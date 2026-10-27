"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { SupplierBill, SupplierBillItem } from "./erp/accounting-types"
import { logAuditEvent } from "./audit-actions"
import { createJournalEntry } from "./accounting-actions"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const BILLS_STORAGE = path.join(process.cwd(), "db", "supplier_bills_data.json")

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

const DEFAULT_BILLS: SupplierBill[] = [
  {
    id: "bill-001",
    bill_number: "QCL-BILL-2026-001",
    po_id: "po-001",
    po_number: "QCL-PO-2026-1001",
    supplier_id: "sup-hik-001",
    supplier_name: "Hikvision East Africa Logistics",
    supplier_email: "sales.ea@hikvision.com",
    bill_date: new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0],
    due_date: new Date(Date.now() + 22 * 86400000).toISOString().split("T")[0],
    payment_terms: "Net 30",
    items: [
      { product_id: 1, name: "Hikvision 4K AcuSense ColorVu IP Dome Camera", quantity: 10, unit_cost: 285000, total_cost: 2850000 },
      { product_id: 2, name: "Hikvision 16-Channel 4K NVR Network Video Recorder", quantity: 2, unit_cost: 850000, total_cost: 1700000 }
    ],
    subtotal: 4550000,
    tax_amount: 819000,
    shipping_amount: 50000,
    discount_amount: 0,
    total: 5419000,
    amount_paid: 5419000,
    balance_due: 0,
    status: "paid",
    notes: "Direct container delivery for corporate surveillance infrastructure",
    created_by: "Administrator",
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: "bill-002",
    bill_number: "QCL-BILL-2026-002",
    po_id: "po-002",
    po_number: "QCL-PO-2026-1002",
    supplier_id: "sup-asus-002",
    supplier_name: "ASUS Middle East & Africa FZE",
    supplier_email: "distribution@asus.me",
    bill_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    due_date: new Date(Date.now() + 27 * 86400000).toISOString().split("T")[0],
    payment_terms: "Net 30",
    items: [
      { product_id: 3, name: "ASUS ExpertCenter D7 Mini Tower Core i7 Workstation", quantity: 5, unit_cost: 1850000, total_cost: 9250000 }
    ],
    subtotal: 9250000,
    tax_amount: 1665000,
    shipping_amount: 150000,
    discount_amount: 200000,
    total: 10865000,
    amount_paid: 5000000,
    balance_due: 5865000,
    status: "partially_paid",
    notes: "Part payment made via Selcom Corporate Wire",
    created_by: "Administrator",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
]

export async function getSupplierBills(): Promise<SupplierBill[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("supplier_bills").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) return data as SupplierBill[]
  } catch {}

  const local = await readLocalFile<SupplierBill[]>(BILLS_STORAGE, DEFAULT_BILLS)
  if (local.length === 0) {
    await writeLocalFile(BILLS_STORAGE, DEFAULT_BILLS)
    return DEFAULT_BILLS
  }
  return local
}

export async function createSupplierBill(payload: Omit<SupplierBill, "id" | "bill_number" | "created_at" | "updated_at">): Promise<SupplierBill> {
  const { user } = await verifyAdminSession()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const newBill: SupplierBill = {
    id: `bill-${Date.now()}`,
    bill_number: `QCL-BILL-${new Date().getFullYear()}-${randomSuffix}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("supplier_bills").insert([newBill])
  } catch {}

  const list = await getSupplierBills()
  const updated = [newBill, ...list.filter(b => b.id !== newBill.id)]
  await writeLocalFile(BILLS_STORAGE, updated)

  // Automatically post double-entry journal entry:
  // Debit Inventory Asset (1300), Credit Accounts Payable (2010)
  try {
    await createJournalEntry({
      entry_date: newBill.bill_date,
      reference_type: "supplier_bill",
      reference_number: newBill.bill_number,
      memo: `Recognized supplier liability for ${newBill.supplier_name} (Bill ${newBill.bill_number})`,
      lines: [
        { account_id: "acc-1300", account_code: "1300", account_name: "Inventory Asset", debit: newBill.total, credit: 0, description: "Inventory received into stock" },
        { account_id: "acc-2010", account_code: "2010", account_name: "Accounts Payable", debit: 0, credit: newBill.total, description: `Trade creditor payable to ${newBill.supplier_name}` }
      ]
    })
  } catch (err) {
    console.error("Auto journal entry failed for bill:", err)
  }

  await logAuditEvent({
    module: "purchases",
    action: "created",
    record_id: newBill.id,
    record_number: newBill.bill_number,
    description: `Created supplier bill ${newBill.bill_number} for ${newBill.supplier_name} (TZS ${newBill.total.toLocaleString()})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/purchases/bills")
  return newBill
}

export async function recordBillPayment(billId: string, amount: number, paymentMethod: string): Promise<SupplierBill | null> {
  const { user } = await verifyAdminSession()
  const list = await getSupplierBills()
  const index = list.findIndex(b => b.id === billId)
  if (index === -1) return null

  const bill = list[index]
  const newAmountPaid = bill.amount_paid + amount
  const newBalanceDue = Math.max(0, bill.total - newAmountPaid)
  const newStatus = newBalanceDue === 0 ? "paid" : "partially_paid"

  bill.amount_paid = newAmountPaid
  bill.balance_due = newBalanceDue
  bill.status = newStatus
  bill.updated_at = new Date().toISOString()

  try {
    const supabase = createServerClient()
    await supabase.from("supplier_bills").update({
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      status: newStatus,
      updated_at: bill.updated_at
    }).eq("id", billId)
  } catch {}

  await writeLocalFile(BILLS_STORAGE, list)

  // Automatically post double-entry payment journal:
  // Debit Accounts Payable (2010), Credit CRDB Bank (1020)
  try {
    await createJournalEntry({
      entry_date: new Date().toISOString().split("T")[0],
      reference_type: "supplier_payment",
      reference_number: bill.bill_number,
      memo: `Settlement of supplier bill ${bill.bill_number} (${paymentMethod})`,
      lines: [
        { account_id: "acc-2010", account_code: "2010", account_name: "Accounts Payable", debit: amount, credit: 0, description: `Cleared payable to ${bill.supplier_name}` },
        { account_id: "acc-1020", account_code: "1020", account_name: "CRDB Bank Operational Account", debit: 0, credit: amount, description: `Disbursement from bank via ${paymentMethod}` }
      ]
    })
  } catch (err) {
    console.error("Auto journal entry failed for bill payment:", err)
  }

  await logAuditEvent({
    module: "payments",
    action: "payment_recorded",
    record_id: billId,
    record_number: bill.bill_number,
    description: `Recorded supplier payment of TZS ${amount.toLocaleString()} for bill ${bill.bill_number} (${paymentMethod})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/purchases/bills")
  return bill
}
