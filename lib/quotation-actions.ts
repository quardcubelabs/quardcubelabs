"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"

export interface QuotationItem {
  id: string
  name: string
  type: "product" | "service" | "custom"
  quantity: number
  price: number
  image?: string
  description?: string
  category?: string
}

export interface AdminQuotation {
  id: string
  quote_number: string
  user_id?: string | null
  items: QuotationItem[]
  total: number
  status: "draft" | "sent" | "accepted" | "declined" | "expired"
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  customer_address?: string | null
  notes?: string | null
  valid_until?: string | null
  created_at: string
  updated_at: string
}

export interface CreateQuotationData {
  userId?: string | null
  items: QuotationItem[]
  total: number
  customerInfo: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  notes?: string
  validUntil?: string
  status?: "draft" | "sent" | "accepted" | "declined" | "expired"
}

import fs from "fs"
import path from "path"
import crypto from "crypto"

const FALLBACK_FILE_PATH = path.join(process.cwd(), "db", "quotations_data.json")

async function readFallbackQuotations(): Promise<AdminQuotation[]> {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = await fs.promises.readFile(FALLBACK_FILE_PATH, "utf-8")
      return JSON.parse(data) || []
    }
  } catch (err) {
    console.warn("Could not read fallback quotations file:", err)
  }
  return []
}

async function writeFallbackQuotations(quotations: AdminQuotation[]): Promise<void> {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(FALLBACK_FILE_PATH, JSON.stringify(quotations, null, 2), "utf-8")
  } catch (err) {
    console.warn("Could not write fallback quotations file:", err)
  }
}

// Generate quotation number in QCL-QT-YYYY-XXXX format
function generateQuoteNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
  return `QCL-QT-${year}-${random}`
}

// Create a new quotation
export async function createAdminQuotation(data: CreateQuotationData): Promise<AdminQuotation> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const now = new Date().toISOString()
    const newQuote: AdminQuotation = {
      id: crypto.randomUUID(),
      quote_number: generateQuoteNumber(),
      user_id: data.userId || null,
      items: data.items,
      total: Number(data.total),
      status: data.status || "draft",
      customer_name: data.customerInfo.name,
      customer_email: data.customerInfo.email,
      customer_phone: data.customerInfo.phone || null,
      customer_address: data.customerInfo.address || null,
      notes: data.notes || null,
      valid_until: data.validUntil || null,
      created_at: now,
      updated_at: now
    }

    // Try Supabase insert
    try {
      const supabase = createServerClient()
      const quotationData = {
        id: newQuote.id,
        quote_number: newQuote.quote_number,
        user_id: newQuote.user_id,
        items: newQuote.items,
        total: newQuote.total.toString(),
        status: newQuote.status,
        customer_name: newQuote.customer_name,
        customer_email: newQuote.customer_email,
        customer_phone: newQuote.customer_phone,
        customer_address: newQuote.customer_address,
        notes: newQuote.notes,
        valid_until: newQuote.valid_until,
        created_at: newQuote.created_at,
        updated_at: newQuote.updated_at
      }

      const { data: dbQuote, error: dbError } = await supabase
        .from('quotations')
        .insert([quotationData])
        .select()
        .single()

      if (!dbError && dbQuote) {
        return {
          ...dbQuote,
          items: dbQuote.items as QuotationItem[],
          total: Number(dbQuote.total)
        }
      }
      console.warn("Supabase insert did not complete, saving to local fallback storage:", dbError?.message || dbError)
    } catch (sbErr) {
      console.warn("Supabase error in createAdminQuotation, using fallback store:", sbErr)
    }

    // Fallback: Save to local quotations store
    const existing = await readFallbackQuotations()
    const updated = [newQuote, ...existing.filter(q => q.id !== newQuote.id)]
    await writeFallbackQuotations(updated)

    return newQuote
  } catch (error) {
    console.error("Error in createAdminQuotation:", error)
    throw error
  }
}

// Get all quotations
export async function getAdminQuotations(): Promise<AdminQuotation[]> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const fallbackQuotes = await readFallbackQuotations()

    try {
      const supabase = createServerClient()
      const { data: dbQuotes, error: dbError } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false })

      if (!dbError && dbQuotes && dbQuotes.length > 0) {
        const formattedDbQuotes: AdminQuotation[] = dbQuotes.map(quote => ({
          ...quote,
          items: quote.items as QuotationItem[],
          total: Number(quote.total)
        }))

        // Merge any fallback quotes not in db
        const dbIds = new Set(formattedDbQuotes.map(q => q.id))
        const merged = [...formattedDbQuotes, ...fallbackQuotes.filter(q => !dbIds.has(q.id))]
        return merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
    } catch (sbErr) {
      console.warn("Supabase error fetching quotations, using fallback:", sbErr)
    }

    return fallbackQuotes
  } catch (error) {
    console.error("Error in getAdminQuotations:", error)
    return await readFallbackQuotations()
  }
}

// Get quotation by ID
export async function getAdminQuotationById(id: string): Promise<AdminQuotation | null> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    try {
      const supabase = createServerClient()
      const { data: quotation, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && quotation) {
        return {
          ...quotation,
          items: quotation.items as QuotationItem[],
          total: Number(quotation.total)
        }
      }
    } catch (sbErr) {
      console.warn("Supabase error in getAdminQuotationById:", sbErr)
    }

    const fallbackQuotes = await readFallbackQuotations()
    return fallbackQuotes.find(q => q.id === id) || null
  } catch (error) {
    console.error("Error in getAdminQuotationById:", error)
    const fallbackQuotes = await readFallbackQuotations()
    return fallbackQuotes.find(q => q.id === id) || null
  }
}

// Update quotation status
export async function updateQuotationStatus(
  quotationId: string, 
  status: "draft" | "sent" | "accepted" | "declined" | "expired"
): Promise<AdminQuotation | null> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    let updatedQuote: AdminQuotation | null = null

    try {
      const supabase = createServerClient()
      const { data: quotation, error } = await supabase
        .from('quotations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', quotationId)
        .select()
        .single()

      if (!error && quotation) {
        updatedQuote = {
          ...quotation,
          items: quotation.items as QuotationItem[],
          total: Number(quotation.total)
        }
      }
    } catch (sbErr) {
      console.warn("Supabase error in updateQuotationStatus:", sbErr)
    }

    // Always update fallback store
    const fallbackQuotes = await readFallbackQuotations()
    const target = fallbackQuotes.find(q => q.id === quotationId)
    if (target) {
      target.status = status
      target.updated_at = new Date().toISOString()
      await writeFallbackQuotations(fallbackQuotes)
      if (!updatedQuote) updatedQuote = target
    }

    return updatedQuote
  } catch (error) {
    console.error("Error in updateQuotationStatus:", error)
    throw error
  }
}

// Delete quotation
export async function deleteAdminQuotation(quotationId: string): Promise<boolean> {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    try {
      const supabase = createServerClient()
      await supabase
        .from('quotations')
        .delete()
        .eq('id', quotationId)
    } catch (sbErr) {
      console.warn("Supabase error in deleteAdminQuotation:", sbErr)
    }

    const fallbackQuotes = await readFallbackQuotations()
    const updated = fallbackQuotes.filter(q => q.id !== quotationId)
    await writeFallbackQuotations(updated)

    return true
  } catch (error) {
    console.error("Error in deleteAdminQuotation:", error)
    throw error
  }
}

// Get quotations by user ID
export async function getQuotationsByUserId(userId: string): Promise<AdminQuotation[]> {
  try {
    const fallbackQuotes = await readFallbackQuotations()
    const userFallback = fallbackQuotes.filter(q => q.user_id === userId)

    try {
      const supabase = createServerClient()
      const { data: quotations, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!error && quotations && quotations.length > 0) {
        return quotations.map(quote => ({
          ...quote,
          items: quote.items as QuotationItem[],
          total: Number(quote.total)
        }))
      }
    } catch (sbErr) {
      console.warn("Supabase error in getQuotationsByUserId:", sbErr)
    }

    return userFallback
  } catch (error) {
    console.error("Error in getQuotationsByUserId:", error)
    return []
  }
}
