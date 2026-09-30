"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import fs from "fs"
import path from "path"
import { 
  getOrCreateDocumentVerification, 
  syncDocumentVerificationStatus 
} from "./document-verification"

export interface ProformaItem {
  id: string
  name: string
  type: "product" | "service" | "custom"
  quantity: number
  price: number
  image?: string
  description?: string
  category?: string
}

export type ProformaTemplateId = 
  | "modern-corporate" 
  | "minimalist-tech" 
  | "classic-enterprise" 
  | "emerald-cyber" 
  | "compact-retail"

export interface AdminProformaInvoice {
  id: string
  proforma_number: string
  user_id?: string | null
  items: ProformaItem[]
  subtotal: number
  tax_rate?: number
  tax_amount?: number
  discount?: number
  total: number
  status: "draft" | "sent" | "accepted" | "converted" | "expired"
  template_id: ProformaTemplateId
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  customer_address?: string | null
  payment_terms?: string | null
  notes?: string | null
  valid_until?: string | null
  converted_invoice_id?: string | null
  verification_token?: string
  verification_url?: string
  created_at: string
  updated_at: string
}

export interface CreateProformaData {
  userId?: string | null
  items: ProformaItem[]
  subtotal: number
  taxRate?: number
  taxAmount?: number
  discount?: number
  total: number
  status?: "draft" | "sent" | "accepted" | "converted" | "expired"
  templateId?: ProformaTemplateId
  customerInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  paymentTerms?: string
  notes?: string
  validUntil?: string
}

const FALLBACK_FILE_PATH = path.join(process.cwd(), "db", "proforma_data.json")

async function readFallbackProformas(): Promise<AdminProformaInvoice[]> {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = await fs.promises.readFile(FALLBACK_FILE_PATH, "utf-8")
      return JSON.parse(data) || []
    }
  } catch (err) {
    console.warn("Could not read fallback proforma file:", err)
  }
  return []
}

async function writeFallbackProformas(proformas: AdminProformaInvoice[]): Promise<void> {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(FALLBACK_FILE_PATH, JSON.stringify(proformas, null, 2), "utf-8")
  } catch (err) {
    console.warn("Could not write fallback proforma file:", err)
  }
}

// Generate proforma number in QCL-PI-YYYY-XXXX format
function generateProformaNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `QCL-PI-${year}-${random}`
}

async function attachProformaVerification(proforma: AdminProformaInvoice): Promise<AdminProformaInvoice> {
  try {
    const v = await getOrCreateDocumentVerification({
      documentType: "proforma",
      documentId: proforma.id,
      documentNumber: proforma.proforma_number,
      status: proforma.status,
      metadata: {
        customer_name: proforma.customer_name,
        customer_email: proforma.customer_email,
        amount: Number(proforma.total),
        currency: "TZS",
        issue_date: proforma.created_at,
        valid_until: proforma.valid_until,
        payment_method: proforma.payment_terms,
        issuer_name: "QuardCube Labs Limited"
      }
    })
    return {
      ...proforma,
      verification_token: v.verification_token,
      verification_url: v.verification_url
    }
  } catch {
    return proforma
  }
}

// Create a new proforma invoice
export async function createAdminProformaInvoice(data: CreateProformaData): Promise<AdminProformaInvoice> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) throw new Error("Unauthorized: Admin access required")

    const supabase = createServerClient()
    const nowIso = new Date().toISOString()
    const proformaNumber = generateProformaNumber()
    const templateId = data.templateId || "modern-corporate"
    const localId = `pi-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const proformaData = {
      proforma_number: proformaNumber,
      user_id: data.userId || null,
      items: data.items,
      subtotal: data.subtotal || data.total,
      tax_rate: data.taxRate || 0,
      tax_amount: data.taxAmount || 0,
      discount: data.discount || 0,
      total: data.total,
      status: data.status || "draft",
      template_id: templateId,
      customer_name: data.customerInfo.name,
      customer_email: data.customerInfo.email,
      customer_phone: data.customerInfo.phone || null,
      customer_address: data.customerInfo.address || null,
      payment_terms: data.paymentTerms || "100% advance or approved credit terms",
      notes: data.notes || null,
      valid_until: data.validUntil || null,
      created_at: nowIso,
      updated_at: nowIso
    }

    let createdId = localId

    try {
      const { data: inserted, error } = await supabase
        .from('proforma_invoices')
        .insert([proformaData])
        .select()
        .single()

      if (!error && inserted) {
        createdId = inserted.id || localId
      }
    } catch (e) {
      console.warn("Supabase proforma_invoices table not available, using local store:", e)
    }

    const newProforma: AdminProformaInvoice = {
      id: createdId,
      ...proformaData,
      template_id: templateId as ProformaTemplateId
    }

    // Register verification
    const verified = await attachProformaVerification(newProforma)

    // Save to local fallback store
    const currentList = await readFallbackProformas()
    currentList.unshift(verified)
    await writeFallbackProformas(currentList)

    return verified
  } catch (error) {
    console.error("Error in createAdminProformaInvoice:", error)
    throw error
  }
}

// Get all proforma invoices
export async function getAdminProformaInvoices(): Promise<AdminProformaInvoice[]> {
  try {
    const supabase = createServerClient()
    const fallbackList = await readFallbackProformas()
    let proformasList: AdminProformaInvoice[] = fallbackList

    try {
      const { data: proformas, error } = await supabase
        .from('proforma_invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && proformas && proformas.length > 0) {
        const formatted = proformas.map(p => ({
          ...p,
          items: (p.items || []) as ProformaItem[],
          subtotal: Number(p.subtotal || p.total || 0),
          tax_rate: Number(p.tax_rate || 0),
          tax_amount: Number(p.tax_amount || 0),
          discount: Number(p.discount || 0),
          total: Number(p.total || 0),
          template_id: (p.template_id || "modern-corporate") as ProformaTemplateId
        }))
        const dbIds = new Set(formatted.map(p => p.id))
        proformasList = [...formatted, ...fallbackList.filter(p => !dbIds.has(p.id))]
      }
    } catch (err) {
      // Fallback
    }

    return await Promise.all(proformasList.map(attachProformaVerification))
  } catch (error) {
    return await readFallbackProformas()
  }
}

export const getAdminProformas = getAdminProformaInvoices


// Update proforma status
export async function updateProformaStatus(
  id: string,
  status: AdminProformaInvoice['status']
): Promise<AdminProformaInvoice | null> {
  try {
    const supabase = createServerClient()
    const nowIso = new Date().toISOString()
    let updatedProforma: AdminProformaInvoice | null = null

    try {
      const { data, error } = await supabase
        .from('proforma_invoices')
        .update({ status, updated_at: nowIso })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        updatedProforma = {
          ...data,
          items: data.items as ProformaItem[],
          subtotal: Number(data.subtotal),
          total: Number(data.total),
          template_id: data.template_id as ProformaTemplateId
        }
      }
    } catch (e) {}

    // Fallback update
    const list = await readFallbackProformas()
    const idx = list.findIndex(p => p.id === id)
    if (idx !== -1) {
      list[idx].status = status
      list[idx].updated_at = nowIso
      await writeFallbackProformas(list)
      if (!updatedProforma) updatedProforma = list[idx]
    }

    // Sync verification record status
    await syncDocumentVerificationStatus("proforma", id, status)

    if (updatedProforma) {
      return await attachProformaVerification(updatedProforma)
    }

    return null
  } catch (error) {
    console.error("Error updating proforma status:", error)
    return null
  }
}

// Convert proforma to official tax invoice
export async function convertProformaToInvoice(proformaId: string): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const proformas = await getAdminProformaInvoices()
    const proforma = proformas.find(p => p.id === proformaId)
    if (!proforma) return { success: false, error: "Proforma invoice not found" }

    const supabase = createServerClient()
    const year = new Date().getFullYear()
    const invoiceNumber = `QCL-INV-${year}-${Math.floor(1000 + Math.random() * 9000)}`
    const nowIso = new Date().toISOString()

    const invoiceData = {
      invoice_number: invoiceNumber,
      user_id: proforma.user_id || null,
      items: proforma.items,
      total: proforma.total.toString(),
      status: "sent",
      customer_name: proforma.customer_name,
      customer_email: proforma.customer_email,
      customer_phone: proforma.customer_phone || null,
      customer_address: proforma.customer_address || null,
      notes: `Converted from Proforma #${proforma.proforma_number}. ${proforma.notes || ''}`.trim(),
      due_date: proforma.valid_until || null,
      created_at: nowIso,
      updated_at: nowIso
    }

    let createdInvoiceId = `inv-${Date.now()}`
    try {
      const { data: inv, error } = await supabase.from('invoices').insert([invoiceData]).select().single()
      if (!error && inv) {
        createdInvoiceId = inv.id
      }
    } catch (e) {}

    // Mark proforma as converted
    await updateProformaStatus(proformaId, "converted")

    return { success: true, invoiceId: createdInvoiceId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete proforma invoice
export async function deleteAdminProformaInvoice(id: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    try {
      await supabase.from('proforma_invoices').delete().eq('id', id)
    } catch (e) {}

    const list = await readFallbackProformas()
    const filtered = list.filter(p => p.id !== id)
    await writeFallbackProformas(filtered)

    return true
  } catch (error) {
    console.error("Error deleting proforma:", error)
    return false
  }
}
