"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { BusinessExpense, ExpenseCategory } from "./erp/types"
import { logAuditEvent } from "./audit-actions"
import { revalidatePath } from "next/cache"
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
    expense_date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
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
    expense_date: new Date(Date.now() - 12 * 86400000).toISOString().split("T")[0],
    vendor_name: "TANESCO LUKU Commercial",
    payment_method: "Mobile Money",
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
    expense_date: new Date(Date.now() - 18 * 86400000).toISOString().split("T")[0],
    vendor_name: "Supabase & AWS Cloud Infrastructure",
    payment_method: "Credit Card",
    payment_reference: "CC-AWS-009212",
    description: "Cloud database hosting, telemetry ingestion, and S3 storage",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-004",
    expense_number: "QCL-EXP-2026-0104",
    category: "Logistics & Fuel",
    amount: 280000,
    tax_amount: 0,
    expense_date: new Date(Date.now() - 22 * 86400000).toISOString().split("T")[0],
    vendor_name: "Puma Energy Tanzania",
    payment_method: "Cash",
    payment_reference: "RCP-PUMA-1029",
    description: "Field engineering vehicle fuel & transport logistics",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-005",
    expense_number: "QCL-EXP-2026-0105",
    category: "Hardware Maintenance",
    amount: 540000,
    tax_amount: 0,
    expense_date: new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0],
    vendor_name: "Precision Calibration Labs",
    payment_method: "Bank Transfer",
    payment_reference: "TX-CALIB-8821",
    description: "Fiber fusion splicer and OTDR precision calibration",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-hik-01",
    expense_number: "QCL-EXP-2026-0201",
    category: "Logistics & Fuel",
    amount: 450000,
    tax_amount: 81000,
    expense_date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
    vendor_name: "Hikvision East Africa Logistics",
    supplier_id: "sup-hik-001",
    payment_method: "Bank Transfer",
    payment_reference: "TX-CLR-HIK-992",
    description: "Port clearance & container inspection fee for PO #QCL-PO-2026-1001",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-hik-02",
    expense_number: "QCL-EXP-2026-0202",
    category: "Hardware Maintenance",
    amount: 280000,
    tax_amount: 0,
    expense_date: new Date(Date.now() - 25 * 86400000).toISOString().split("T")[0],
    vendor_name: "Hikvision East Africa Logistics",
    supplier_id: "sup-hik-001",
    payment_method: "Bank Transfer",
    payment_reference: "TX-CERT-HIK-881",
    description: "Direct surveillance equipment calibration and ISO certification fees",
    status: "paid",
    is_billable: false,
    recorded_by: "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "exp-asus-01",
    expense_number: "QCL-EXP-2026-0203",
    category: "Logistics & Fuel",
    amount: 680000,
    tax_amount: 0,
    expense_date: new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0],
    vendor_name: "ASUS Middle East & Africa FZE",
    supplier_id: "sup-asus-002",
    payment_method: "Bank Transfer",
    payment_reference: "TX-ASUS-AIR-010",
    description: "International air freight surcharge and Dubai export clearance",
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
    if (!error && data) {
      if ((data as any[]).length === 0) {
        try {
          await supabase.from("expenses").upsert(DEFAULT_EXPENSES)
          await writeFallbackExpenses(DEFAULT_EXPENSES)
          return DEFAULT_EXPENSES
        } catch {}
      }

      // Merge Supabase expenses with any local fallback expenses so newly created items are never lost
      const local = await readFallbackExpenses()
      const dbIds = new Set((data || []).map((d: any) => d.id))
      const combined = [
        ...(data as BusinessExpense[]),
        ...local.filter(l => !dbIds.has(l.id))
      ].sort((a, b) => new Date(b.expense_date || b.created_at).getTime() - new Date(a.expense_date || a.created_at).getTime())

      await writeFallbackExpenses(combined)
      return combined
    }
  } catch (err) {
    console.warn("[ExpenseActions] Supabase expenses fetch error:", err)
  }

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
  branchId?: string
}): Promise<BusinessExpense> {
  const { isAdmin, user } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const expenseNumber = generateExpenseNumber()
  const now = new Date().toISOString()
  const recordedByName = user?.staffMember?.full_name || user?.email || "Administrator"
  const staffBranchId = user?.staffMember?.branch_id || data.branchId || "br-01"
  const staffBranchName = user?.staffMember?.branch_name || "QuardCube HQ & Innovation Hub"

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
    status: data.status || "paid",
    is_billable: data.isBillable || false,
    customer_id: data.customerId,
    customer_name: data.customerName,
    recorded_by: recordedByName,
    branch_id: staffBranchId,
    created_at: now,
    updated_at: now
  }

  // Build clean payload for Supabase database table
  const dbPayload: any = {
    id: newExpense.id,
    expense_number: newExpense.expense_number,
    category: newExpense.category,
    amount: newExpense.amount,
    tax_amount: newExpense.tax_amount,
    expense_date: newExpense.expense_date,
    supplier_id: newExpense.supplier_id || null,
    vendor_name: newExpense.vendor_name,
    payment_method: newExpense.payment_method,
    payment_reference: newExpense.payment_reference || null,
    description: newExpense.description,
    receipt_url: newExpense.receipt_url || null,
    status: newExpense.status,
    is_billable: newExpense.is_billable,
    recorded_by: newExpense.recorded_by,
    branch_id: newExpense.branch_id || null,
    created_at: newExpense.created_at,
    updated_at: newExpense.updated_at
  }
  if (newExpense.customer_id) dbPayload.customer_id = newExpense.customer_id
  if (newExpense.customer_name) dbPayload.customer_name = newExpense.customer_name

  // Push to Supabase with resilient retry if optional columns are missing
  try {
    const supabase = createServerClient()
    const { error: dbError } = await supabase.from("expenses").insert([dbPayload])
    if (dbError) {
      console.warn("[ExpenseActions] Supabase insert warning:", dbError.message)
      // Retry without optional customer fields if schema column does not exist
      if (dbError.message?.includes("column") || (dbError as any).code === "42703") {
        const { customer_id, customer_name, ...cleanPayload } = dbPayload
        const retry = await supabase.from("expenses").insert([cleanPayload])
        if (retry.error) {
          console.error("[ExpenseActions] Supabase clean insert error:", retry.error.message)
        } else {
          console.log(`[ExpenseActions] Expense #${newExpense.expense_number} pushed to Supabase successfully on retry`)
        }
      }
    } else {
      console.log(`[ExpenseActions] Expense #${newExpense.expense_number} pushed to Supabase database successfully`)
    }
  } catch (err) {
    console.error("[ExpenseActions] Exception pushing expense to Supabase:", err)
  }

  // Update fallback store
  const list = await readFallbackExpenses()
  list.unshift(newExpense)
  await writeFallbackExpenses(list)

  // Record audit log explicitly attributed to the active staff user
  await logAuditEvent({
    module: "expenses",
    action: "created",
    record_id: newExpense.id,
    record_number: newExpense.expense_number,
    description: `Recorded business expense #${newExpense.expense_number} [${newExpense.category}]: TZS ${newExpense.amount.toLocaleString()} (${newExpense.vendor_name})`,
    user_email: user?.email,
    user_name: recordedByName,
    branch_id: staffBranchId,
    branch_name: staffBranchName
  })

  revalidatePath("/admin/expenses")
  return newExpense
}

export async function updateExpenseStatus(
  id: string,
  status: BusinessExpense["status"]
): Promise<BusinessExpense | null> {
  const { isAdmin, user } = await verifyAdminSession()
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
  } catch (err) {
    console.warn("[ExpenseActions] Expense DB update fallback:", err)
  }

  await logAuditEvent({
    module: "expenses",
    action: "status_changed",
    record_id: id,
    record_number: list[idx].expense_number,
    description: `Expense #${list[idx].expense_number} status updated to "${status}"`,
    user_email: user?.email,
    user_name: user?.staffMember?.full_name || user?.email,
    branch_id: user?.staffMember?.branch_id,
    branch_name: user?.staffMember?.branch_name
  })

  revalidatePath("/admin/expenses")
  return list[idx]
}

export async function deleteExpense(id: string): Promise<boolean> {
  const { isAdmin, user } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  try {
    const supabase = createServerClient()
    await supabase.from("expenses").delete().eq("id", id)
  } catch (err) {
    console.warn("[ExpenseActions] Expense DB delete fallback:", err)
  }

  const list = await readFallbackExpenses()
  const target = list.find(e => e.id === id || e.expense_number === id)
  const filtered = list.filter(e => e.id !== id && e.expense_number !== id)
  await writeFallbackExpenses(filtered)

  await logAuditEvent({
    module: "expenses",
    action: "deleted",
    record_id: id,
    record_number: target?.expense_number,
    description: `Deleted expense record ${target?.expense_number || id}`,
    user_email: user?.email,
    user_name: user?.staffMember?.full_name || user?.email,
    branch_id: user?.staffMember?.branch_id,
    branch_name: user?.staffMember?.branch_name
  })

  revalidatePath("/admin/expenses")
  return true
}
