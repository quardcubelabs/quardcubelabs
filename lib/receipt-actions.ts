"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import fs from "fs"
import path from "path"
import { 
  getOrCreateDocumentVerification, 
  syncDocumentVerificationStatus 
} from "./document-verification"

export interface ReceiptItem {
  id: string
  name: string
  quantity: number
  price: number
  description?: string
}

export type ReceiptTemplateId = 
  | "qlabs-thermal"
  | "modern-corporate" 
  | "minimalist-tech" 
  | "classic-enterprise" 
  | "emerald-cyber" 
  | "compact-retail"

export type PaymentMethod = 
  | "M-Pesa" 
  | "Airtel Money" 
  | "Tigo Pesa" 
  | "Bank Transfer" 
  | "Credit Card" 
  | "Cash" 
  | "Direct Settlement"

export interface AdminReceipt {
  id: string
  receipt_number: string
  user_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  customer_address?: string | null
  invoice_number?: string | null
  order_number?: string | null
  amount_paid: number
  payment_method: PaymentMethod
  transaction_ref?: string | null
  payment_date: string
  items: ReceiptItem[]
  notes?: string | null
  template_id: ReceiptTemplateId
  status: "issued" | "refunded" | "voided"
  verification_token?: string
  verification_url?: string
  created_at: string
  updated_at: string
}

export interface CreateReceiptData {
  userId?: string | null
  customerInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  invoiceNumber?: string
  orderNumber?: string
  amountPaid: number
  paymentMethod: PaymentMethod
  transactionRef?: string
  paymentDate?: string
  items?: ReceiptItem[]
  notes?: string
  templateId?: ReceiptTemplateId
  status?: "issued" | "refunded" | "voided"
}

const FALLBACK_FILE_PATH = path.join(process.cwd(), "db", "receipts_data.json")

async function readFallbackReceipts(): Promise<AdminReceipt[]> {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = await fs.promises.readFile(FALLBACK_FILE_PATH, "utf-8")
      return JSON.parse(data) || []
    }
  } catch (err) {
    console.warn("Could not read fallback receipts file:", err)
  }
  return []
}

async function writeFallbackReceipts(receipts: AdminReceipt[]): Promise<void> {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(FALLBACK_FILE_PATH, JSON.stringify(receipts, null, 2), "utf-8")
  } catch (err) {
    console.warn("Could not write fallback receipts file:", err)
  }
}

// Generate receipt number in QCL-REC-YYYY-XXXX format
function generateReceiptNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `QCL-REC-${year}-${random}`
}

async function attachReceiptVerification(receipt: AdminReceipt): Promise<AdminReceipt> {
  try {
    const v = await getOrCreateDocumentVerification({
      documentType: "receipt",
      documentId: receipt.id,
      documentNumber: receipt.receipt_number,
      status: receipt.status,
      metadata: {
        customer_name: receipt.customer_name,
        customer_email: receipt.customer_email,
        amount: Number(receipt.amount_paid),
        currency: "TZS",
        issue_date: receipt.payment_date || receipt.created_at,
        payment_method: receipt.payment_method,
        issuer_name: "QuardCube Labs Limited"
      }
    })
    return {
      ...receipt,
      verification_token: v.verification_token,
      verification_url: v.verification_url
    }
  } catch {
    return receipt
  }
}

// Create a new receipt
export async function createAdminReceipt(data: CreateReceiptData): Promise<AdminReceipt> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) throw new Error("Unauthorized: Admin access required")

    const supabase = createServerClient()
    const nowIso = new Date().toISOString()
    const receiptNumber = generateReceiptNumber()
    const templateId = data.templateId || "qlabs-thermal"
    const localId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const receiptData = {
      receipt_number: receiptNumber,
      user_id: data.userId || null,
      customer_name: data.customerInfo.name,
      customer_email: data.customerInfo.email,
      customer_phone: data.customerInfo.phone || null,
      customer_address: data.customerInfo.address || null,
      invoice_number: data.invoiceNumber || null,
      order_number: data.orderNumber || null,
      amount_paid: data.amountPaid,
      payment_method: data.paymentMethod,
      transaction_ref: data.transactionRef || `MP-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      payment_date: data.paymentDate || nowIso,
      items: data.items || [],
      notes: data.notes || null,
      template_id: templateId,
      status: data.status || "issued",
      created_at: nowIso,
      updated_at: nowIso
    }

    let createdId = localId

    try {
      const { data: inserted, error } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select()
        .single()

      if (!error && inserted) {
        createdId = inserted.id || localId
      }
    } catch (e) {
      console.warn("Supabase receipts table not available, using local store:", e)
    }

    const newReceipt: AdminReceipt = {
      id: createdId,
      ...receiptData,
      template_id: templateId as ReceiptTemplateId
    }

    // Register verification
    const verified = await attachReceiptVerification(newReceipt)

    // Save to local fallback store
    const currentList = await readFallbackReceipts()
    currentList.unshift(verified)
    await writeFallbackReceipts(currentList)

    return verified
  } catch (error) {
    console.error("Error in createAdminReceipt:", error)
    throw error
  }
}

// Get all receipts
export async function getAdminReceipts(): Promise<AdminReceipt[]> {
  try {
    const supabase = createServerClient()
    const fallbackList = await readFallbackReceipts()
    let receiptsList: AdminReceipt[] = fallbackList

    try {
      const { data: receipts, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && receipts && receipts.length > 0) {
        const formatted = receipts.map(r => ({
          ...r,
          amount_paid: Number(r.amount_paid || 0),
          items: (r.items || []) as ReceiptItem[],
          template_id: (r.template_id || "modern-corporate") as ReceiptTemplateId
        }))
        const dbIds = new Set(formatted.map(r => r.id))
        receiptsList = [...formatted, ...fallbackList.filter(r => !dbIds.has(r.id))]
      }
    } catch (err) {
      // Fallback
    }

    return await Promise.all(receiptsList.map(attachReceiptVerification))
  } catch (error) {
    return await readFallbackReceipts()
  }
}

// Update receipt status
export async function updateReceiptStatus(
  id: string,
  status: AdminReceipt['status']
): Promise<AdminReceipt | null> {
  try {
    const supabase = createServerClient()
    const nowIso = new Date().toISOString()
    let updatedReceipt: AdminReceipt | null = null

    try {
      const { data, error } = await supabase
        .from('receipts')
        .update({ status, updated_at: nowIso })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        updatedReceipt = {
          ...data,
          amount_paid: Number(data.amount_paid),
          items: data.items as ReceiptItem[],
          template_id: data.template_id as ReceiptTemplateId
        }
      }
    } catch (e) {}

    const list = await readFallbackReceipts()
    const idx = list.findIndex(r => r.id === id)
    if (idx !== -1) {
      list[idx].status = status
      list[idx].updated_at = nowIso
      await writeFallbackReceipts(list)
      if (!updatedReceipt) updatedReceipt = list[idx]
    }

    // Sync verification record status
    await syncDocumentVerificationStatus("receipt", id, status)

    if (updatedReceipt) {
      return await attachReceiptVerification(updatedReceipt)
    }

    return null
  } catch (error) {
    console.error("Error updating receipt status:", error)
    return null
  }
}

// Delete receipt
export async function deleteAdminReceipt(id: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    try {
      await supabase.from('receipts').delete().eq('id', id)
    } catch (e) {}

    const list = await readFallbackReceipts()
    const filtered = list.filter(r => r.id !== id)
    await writeFallbackReceipts(filtered)

    return true
  } catch (error) {
    console.error("Error deleting receipt:", error)
    return false
  }
}
