"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { 
  getOrCreateDocumentVerification, 
  syncDocumentVerificationStatus 
} from "./document-verification"

export interface InvoiceItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export interface AdminInvoice {
  id: string
  invoice_number: string
  user_id: string
  items: InvoiceItem[]
  total: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  customer_name: string
  customer_email: string
  customer_phone?: string
  customer_address?: string
  notes?: string
  due_date?: string
  verification_token?: string
  verification_url?: string
  created_at: string
  updated_at: string
}

export interface CreateInvoiceData {
  userId: string
  items: InvoiceItem[]
  total: number
  customerInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  notes?: string
  dueDate?: string
}

// Generate invoice number in QCL-YYYY-XXXX format
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
  return `QCL-${year}-${random}`
}

async function attachInvoiceVerification(invoice: AdminInvoice): Promise<AdminInvoice> {
  try {
    const v = await getOrCreateDocumentVerification({
      documentType: "invoice",
      documentId: invoice.id,
      documentNumber: invoice.invoice_number,
      status: invoice.status,
      metadata: {
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        amount: Number(invoice.total),
        currency: "TZS",
        issue_date: invoice.created_at,
        valid_until: invoice.due_date,
        issuer_name: "QuardCube Labs Limited"
      }
    })
    return {
      ...invoice,
      verification_token: v.verification_token,
      verification_url: v.verification_url
    }
  } catch {
    return invoice
  }
}

// Create a new invoice
export async function createAdminInvoice(data: CreateInvoiceData): Promise<AdminInvoice> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()
    const invoiceNumber = generateInvoiceNumber()
    const now = new Date().toISOString()

    const invoiceData = {
      invoice_number: invoiceNumber,
      user_id: data.userId,
      items: data.items,
      total: data.total.toString(),
      status: "draft" as const,
      customer_name: data.customerInfo.name,
      customer_email: data.customerInfo.email,
      customer_phone: data.customerInfo.phone || null,
      customer_address: data.customerInfo.address || null,
      notes: data.notes || null,
      due_date: data.dueDate || null,
      created_at: now,
      updated_at: now
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single()

    if (error) {
      console.error("Error creating invoice:", error)
      throw new Error(`Failed to create invoice: ${error.message}`)
    }

    const formattedInvoice: AdminInvoice = {
      ...invoice,
      items: invoice.items as InvoiceItem[],
      total: Number(invoice.total)
    }

    // Register verification token
    const verified = await attachInvoiceVerification(formattedInvoice)
    return verified
  } catch (error) {
    console.error("Error in createAdminInvoice:", error)
    throw error
  }
}

// Get all invoices
export async function getAdminInvoices(): Promise<AdminInvoice[]> {
  try {
    const supabase = createServerClient()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching invoices from database:", error)
      return []
    }

    const rawList: AdminInvoice[] = (invoices || []).map(invoice => ({
      ...invoice,
      items: (invoice.items || []) as InvoiceItem[],
      total: Number(invoice.total || 0)
    }))

    return await Promise.all(rawList.map(attachInvoiceVerification))
  } catch (error) {
    console.error("Error in getAdminInvoices:", error)
    return []
  }
}

// Get invoice by ID
export async function getAdminInvoiceById(id: string): Promise<AdminInvoice | null> {
  try {
    const supabase = createServerClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !invoice) {
      console.error("Error fetching invoice:", error)
      return null
    }

    const raw: AdminInvoice = {
      ...invoice,
      items: (invoice.items || []) as InvoiceItem[],
      total: Number(invoice.total || 0)
    }

    return await attachInvoiceVerification(raw)
  } catch (error) {
    console.error("Error in getAdminInvoiceById:", error)
    return null
  }
}

// Update invoice status
export async function updateInvoiceStatus(
  invoiceId: string, 
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
): Promise<AdminInvoice | null> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating invoice status:", error)
      throw new Error(`Failed to update invoice: ${error.message}`)
    }

    // Sync verification record status
    await syncDocumentVerificationStatus("invoice", invoiceId, status)

    const raw: AdminInvoice = {
      ...invoice,
      items: invoice.items as InvoiceItem[],
      total: Number(invoice.total)
    }

    return await attachInvoiceVerification(raw)
  } catch (error) {
    console.error("Error in updateInvoiceStatus:", error)
    throw error
  }
}

// Delete invoice
export async function deleteAdminInvoice(invoiceId: string): Promise<boolean> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)

    if (error) {
      console.error("Error deleting invoice:", error)
      throw new Error(`Failed to delete invoice: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error("Error in deleteAdminInvoice:", error)
    throw error
  }
}

// Get invoices by user ID
export async function getInvoicesByUserId(userId: string): Promise<AdminInvoice[]> {
  try {
    const supabase = createServerClient()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching user invoices:", error)
      return []
    }

    const raw = (invoices || []).map(invoice => ({
      ...invoice,
      items: invoice.items as InvoiceItem[],
      total: Number(invoice.total)
    }))

    return await Promise.all(raw.map(attachInvoiceVerification))
  } catch (error) {
    console.error("Error in getInvoicesByUserId:", error)
    return []
  }
}
