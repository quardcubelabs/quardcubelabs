"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { BusinessExpense, ExpenseCategory } from "./erp/types"
import { logAuditEvent } from "./audit-actions"
import fs from "fs"
import path from "path"

const EXPENSES_STORAGE = path.join(process.cwd(), "db", "expenses_data.json")

const DEFAULT_EXPENSES: BusinessExpense[] = [
  {
    id: "exp-001",
    expense_number: "QCL-EXP-2026-0101",
    category: "Internet & Telecom",
    amount: 450000,
    tax_amount: 81000,
    expense_date: new Date().toISOString().split("T")[0],
    vendor_name: "Liquid Intelligent Technologies / TTCL",
    payment_method: "Bank Transfer",
    payment_reference: "TX-INTERNET-SEP26",
    description: "Dedicated optical fiber broadband and static IP block subscription",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-002",
    expense_number: "QCL-EXP-2026-0102",
    category: "Electricity & Water",
    amount: 320000,
    tax_amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    vendor_name: "TANESCO LUKU Commercial",
    payment_method: "M-Pesa",
    payment_reference: "MP-LUKU-992812",
    description: "Hub and testing lab three-phase prepaid power tokens",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-003",
    expense_number: "QCL-EXP-2026-0103",
    category: "Software & Cloud Services",
    amount: 680000,
    tax_amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    vendor_name: "Supabase & AWS Cloud Infrastructure",
    payment_method: "Credit Card",
    payment_reference: "CC-AWS-009212",
    description: "Cloud database hosting, telemetry ingestion, and S3 storage",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

async function readFallbackExpenses(): Promise<BusinessExpense[]> {
  try {
    if (fs.existsSync(EXPENSES_STORAGE)) {
      const data = await fs.promises.readFile(EXPENSES_STORAGE, "utf-8")
      return JSON.parse(data) || DEFAULT_EXPENSES
    }
  } catch {}
  return DEFAULT_EXPENSES
}

async function writeFallbackExpenses(expenses: BusinessExpense[]): Promise<void> {
  try {
    const dir = path.dirname(EXPENSES_STORAGE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(EXPENSES_STORAGE, JSON.stringify(expenses, null, 2), "utf-8")
  } catch {}
}

function generateExpenseNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `QCL-EXP-${year}-${rand}`
}

export async function getExpenses(): Promise<BusinessExpense[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false })
    if (!error && data && data.length > 0) {
      return data as BusinessExpense[]
    }
  } catch {}

  const local = await readFallbackExpenses()
  if (local.length === 0) {
    await writeFallbackExpenses(DEFAULT_EXPENSES)
    return DEFAULT_EXPENSES
  }
  return local
}

export async function createExpense(data: {
  category: ExpenseCategory
  amount: number
  taxAmount?: number
  expenseDate?: string
  supplierId?: string
  vendorName?: string
  paymentMethod: string
  paymentReference?: string
  description: string
  receiptUrl?: string
  status?: BusinessExpense["status"]
  isBillable?: boolean
  customerId?: string
  customerName?: string
}): Promise<BusinessExpense> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const expenseNumber = generateExpenseNumber()
  const now = new Date().toISOString()

  const newExpense: BusinessExpense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    expense_number: expenseNumber,
    category: data.category,
    amount: Number(data.amount),
    tax_amount: Number(data.taxAmount || 0),
    expense_date: data.expenseDate || now.split("T")[0],
    supplier_id: data.supplierId,
    vendor_name: data.vendorName || "General Vendor",
    payment_method: data.paymentMethod,
    payment_reference: data.paymentReference,
    description: data.description,
    receipt_url: data.receiptUrl,
    status: data.status || "approved",
    is_billable: data.isBillable || false,
    customer_id: data.customerId,
    customer_name: data.customerName,
    recorded_by: "Administrator",
    created_at: now,
    updated_at: now
  }

  try {
    const supabase = createServerClient()
    await supabase.from("expenses").insert([newExpense])
  } catch {}

  const list = await readFallbackExpenses()
  list.unshift(newExpense)
  await writeFallbackExpenses(list)

  await logAuditEvent({
    module: "expenses",
    action: "created",
    record_id: newExpense.id,
    record_number: newExpense.expense_number,
    description: `Recorded expense #${newExpense.expense_number} [${newExpense.category}]: TZS ${newExpense.amount.toLocaleString()} (${newExpense.vendor_name})`
  })

  return newExpense
}

export async function updateExpenseStatus(
  id: string,
  status: BusinessExpense["status"]
): Promise<BusinessExpense | null> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const list = await readFallbackExpenses()
  const idx = list.findIndex(e => e.id === id || e.expense_number === id)
  if (idx === -1) return null

  list[idx].status = status
  list[idx].updated_at = new Date().toISOString()
  await writeFallbackExpenses(list)

  try {
    const supabase = createServerClient()
    await supabase.from("expenses").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
  } catch {}

  await logAuditEvent({
    module: "expenses",
    action: "status_changed",
    record_id: id,
    record_number: list[idx].expense_number,
    description: `Expense #${list[idx].expense_number} status updated to "${status}"`
  })

  return list[idx]
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const list = await readFallbackExpenses()
  const filtered = list.filter(e => e.id !== id && e.expense_number !== id)
  await writeFallbackExpenses(filtered)

  try {
    const supabase = createServerClient()
    await supabase.from("expenses").delete().eq("id", id)
  } catch {}

  await logAuditEvent({
    module: "expenses",
    action: "deleted",
    record_id: id,
    description: `Deleted expense record ${id}`
  })

  return true
}
