"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { CreditNote, CreditNoteItem } from "./erp/types"
import { logAuditEvent } from "./audit-actions"
import { createJournalEntry } from "./accounting-actions"
import { getOrCreateDocumentVerification } from "./document-verification"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const CREDIT_NOTES_STORAGE = path.join(process.cwd(), "db", "credit_notes_data.json")

async function readLocalFile<T>(filePath: string, defaultVal: T): Promise<T> {
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, "utf-8")
      return JSON.parse(data) || defaultVal
    }
  } catch {}
  return defaultVal
}

async function writeLocalFile(filePath: string, data: any): Promise<void> {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
  } catch {}
}

const DEFAULT_CREDIT_NOTES: CreditNote[] = [
  {
    id: "cn-001",
    credit_note_number: "QCL-CN-2026-001",
    invoice_id: "inv-901",
    invoice_number: "INV-2026-091",
    customer_name: "Bakhresa Food Products Ltd",
    customer_email: "security@bakhresa.com",
    customer_phone: "+255 22 286 1122",
    credit_date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    items: [
      { id: "item-1", product_id: 1, name: "Hikvision 4K AcuSense Dome (Surplus Unit Return)", quantity: 1, unit_price: 285000, total: 285000 }
    ],
    subtotal: 285000,
    tax_amount: 51300,
    total_credit: 336300,
    amount_allocated: 336300,
    remaining_credit: 0,
    status: "closed",
    reason: "Return of uninstalled surplus camera unit from phase 1 installation",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
]

export async function getCreditNotes(): Promise<CreditNote[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("credit_notes").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) return data as CreditNote[]
  } catch {}

  const local = await readLocalFile<CreditNote[]>(CREDIT_NOTES_STORAGE, DEFAULT_CREDIT_NOTES)
  if (local.length === 0) {
    await writeLocalFile(CREDIT_NOTES_STORAGE, DEFAULT_CREDIT_NOTES)
    return DEFAULT_CREDIT_NOTES
  }
  return local
}

export async function createCreditNote(payload: {
  invoice_id?: string
  invoice_number?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  items: CreditNoteItem[]
  subtotal: number
  tax_amount: number
  total_credit: number
  reason?: string
}): Promise<CreditNote> {
  const { user } = await verifyAdminSession()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const cnNumber = `QCL-CN-${new Date().getFullYear()}-${randomSuffix}`

  const newId = crypto.randomUUID()
  const newCn: CreditNote = {
    id: newId,
    credit_note_number: cnNumber,
    invoice_id: payload.invoice_id,
    invoice_number: payload.invoice_number,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    credit_date: new Date().toISOString().split("T")[0],
    items: payload.items,
    subtotal: payload.subtotal,
    tax_amount: payload.tax_amount,
    total_credit: payload.total_credit,
    amount_allocated: 0,
    remaining_credit: payload.total_credit,
    status: "open",
    reason: payload.reason,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Attach cryptographic anti-fraud verification token
  try {
    const v = await getOrCreateDocumentVerification({
      documentType: "invoice",
      documentId: newCn.id,
      documentNumber: newCn.credit_note_number,
      status: "issued",
      metadata: {
        customer_name: newCn.customer_name,
        amount: newCn.total_credit,
        currency: "TZS",
        issuer_name: "QuardCube Labs Limited"
      }
    })
    newCn.verification_token = v.verification_token
    newCn.verification_url = v.verification_url
  } catch {}

  try {
    const supabase = createServerClient()
    const { remaining_credit, ...insertable } = newCn
    await supabase.from("credit_notes").insert([insertable])
  } catch (dbErr) {
    console.warn("Failed to insert credit note into Supabase:", dbErr)
  }

  const list = await getCreditNotes()
  const updated = [newCn, ...list.filter(c => c.id !== newCn.id)]
  await writeLocalFile(CREDIT_NOTES_STORAGE, updated)

  // Double-Entry Journal Entry:
  // Debit Sales Returns (Revenue contra) or Inventory, Credit Accounts Receivable (1200)
  try {
    await createJournalEntry({
      entry_date: newCn.credit_date,
      reference_type: "credit_note",
      reference_number: newCn.credit_note_number,
      memo: `Issued credit note ${newCn.credit_note_number} for ${newCn.customer_name} against Invoice ${newCn.invoice_number || 'N/A'}`,
      lines: [
        { account_id: "acc-4010", account_code: "4010", account_name: "Sales Revenue — Hardware", debit: newCn.subtotal, credit: 0, description: "Debit revenue reversal" },
        { account_id: "acc-2020", account_code: "2020", account_name: "VAT Payable (TRA 18%)", debit: newCn.tax_amount, credit: 0, description: "Reverse output VAT" },
        { account_id: "acc-1200", account_code: "1200", account_name: "Accounts Receivable", debit: 0, credit: newCn.total_credit, description: `Credit AR balance for ${newCn.customer_name}` }
      ]
    })
  } catch (err) {
    console.error("Auto journal entry failed for credit note:", err)
  }

  await logAuditEvent({
    module: "invoices",
    action: "created",
    record_id: newCn.id,
    record_number: newCn.credit_note_number,
    description: `Issued official credit note ${newCn.credit_note_number} to ${newCn.customer_name} (TZS ${newCn.total_credit.toLocaleString()})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/credit-notes")
  return newCn
}
