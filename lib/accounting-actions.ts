"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import {
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  BankCashAccount,
  FinancialPeriodSummary,
  BalanceSheetSummary,
  CustomerAgingRecord,
  SupplierAgingRecord
} from "./erp/accounting-types"
import { logAuditEvent } from "./audit-actions"
import { revalidatePath } from "next/cache"
import { fetchErpRecords, persistErpRecords } from "./erp/erp-db-helper"
import fs from "fs"
import path from "path"

const COA_FILE = path.join(process.cwd(), "db", "chart_of_accounts_data.json")
const JOURNALS_FILE = path.join(process.cwd(), "db", "journal_entries_data.json")
const BANK_FILE = path.join(process.cwd(), "db", "bank_accounts_data.json")

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

// -------------------------------------------------------------
// DEFAULT CHART OF ACCOUNTS (Standard General Ledger)
// -------------------------------------------------------------
const DEFAULT_COA: ChartOfAccount[] = [
  // 1000 - ASSETS
  { id: "acc-1010", code: "1010", name: "Cash on Hand (Main Vault)", type: "asset", sub_category: "Cash & Cash Equivalents", currency: "TZS", current_balance: 14500000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-1020", code: "1020", name: "CRDB Bank Operational Account", type: "asset", sub_category: "Bank Accounts", currency: "TZS", current_balance: 68450000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-1030", code: "1030", name: "Selcom Gateway Settlement Float", type: "asset", sub_category: "Merchant Accounts", currency: "TZS", current_balance: 9800000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-1040", code: "1040", name: "Vodacom M-Pesa Merchant Till", type: "asset", sub_category: "Mobile Money", currency: "TZS", current_balance: 5400000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-1200", code: "1200", name: "Accounts Receivable (Trade Debtors)", type: "asset", sub_category: "Current Assets", currency: "TZS", current_balance: 18900000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-1300", code: "1300", name: "Inventory Asset (Hardware & CCTV Stock)", type: "asset", sub_category: "Current Assets", currency: "TZS", current_balance: 124500000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-1500", code: "1500", name: "Lab & Testing Equipment", type: "asset", sub_category: "Fixed Assets", currency: "TZS", current_balance: 42000000, is_active: true, is_system: false, created_at: new Date().toISOString() },

  // 2000 - LIABILITIES
  { id: "acc-2010", code: "2010", name: "Accounts Payable (Trade Creditors)", type: "liability", sub_category: "Current Liabilities", currency: "TZS", current_balance: 11450000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-2020", code: "2020", name: "VAT Payable (TRA 18%)", type: "liability", sub_category: "Tax Liabilities", currency: "TZS", current_balance: 4230000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-2030", code: "2030", name: "Accrued Operating Expenses", type: "liability", sub_category: "Current Liabilities", currency: "TZS", current_balance: 2800000, is_active: true, is_system: false, created_at: new Date().toISOString() },

  // 3000 - EQUITY
  { id: "acc-3010", code: "3010", name: "Shareholder Paid-In Capital", type: "equity", sub_category: "Owner Equity", currency: "TZS", current_balance: 150000000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-3020", code: "3020", name: "Retained Earnings", type: "equity", sub_category: "Retained Earnings", currency: "TZS", current_balance: 115070000, is_active: true, is_system: true, created_at: new Date().toISOString() },

  // 4000 - REVENUE
  { id: "acc-4010", code: "4010", name: "Sales Revenue — Hardware & CCTV Equipment", type: "revenue", sub_category: "Operating Revenue", currency: "TZS", current_balance: 184500000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-4020", code: "4020", name: "Professional Engineering & Installation Services", type: "revenue", sub_category: "Operating Revenue", currency: "TZS", current_balance: 46200000, is_active: true, is_system: true, created_at: new Date().toISOString() },

  // 5000 - COST OF GOODS SOLD (COGS)
  { id: "acc-5010", code: "5010", name: "Cost of Goods Sold — Hardware Products", type: "cogs", sub_category: "Direct Costs", currency: "TZS", current_balance: 118400000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-5020", code: "5020", name: "Direct Subcontractor & Site Labor", type: "cogs", sub_category: "Direct Costs", currency: "TZS", current_balance: 14200000, is_active: true, is_system: true, created_at: new Date().toISOString() },

  // 6000 - OPERATING EXPENSES
  { id: "acc-6010", code: "6010", name: "Cloud Infrastructure & Software Subscriptions", type: "expense", sub_category: "Operating Expenses", currency: "TZS", current_balance: 5800000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-6020", code: "6020", name: "Office Rent & Regional Hub Facilities", type: "expense", sub_category: "Operating Expenses", currency: "TZS", current_balance: 12000000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-6030", code: "6030", name: "Salaries & Staff Compensation", type: "expense", sub_category: "Payroll Expenses", currency: "TZS", current_balance: 24500000, is_active: true, is_system: true, created_at: new Date().toISOString() },
  { id: "acc-6040", code: "6040", name: "Utilities, Power (TANESCO) & Telecom", type: "expense", sub_category: "Operating Expenses", currency: "TZS", current_balance: 3800000, is_active: true, is_system: false, created_at: new Date().toISOString() },
  { id: "acc-6050", code: "6050", name: "Logistics, Vehicle Fuel & Freight", type: "expense", sub_category: "Operating Expenses", currency: "TZS", current_balance: 4100000, is_active: true, is_system: false, created_at: new Date().toISOString() }
]

const DEFAULT_BANK_ACCOUNTS: BankCashAccount[] = [
  { id: "bnk-01", account_name: "CRDB Bank Corporate Account", account_type: "Bank", account_number: "0150882199200", bank_name: "CRDB Bank Plc", branch: "Tower Branch, Dar es Salaam", currency: "TZS", current_balance: 68450000, is_active: true, last_reconciled_date: new Date().toISOString().split("T")[0] },
  { id: "bnk-02", account_name: "Main Office Vault Cash", account_type: "Cash on Hand", currency: "TZS", current_balance: 14500000, is_active: true, last_reconciled_date: new Date().toISOString().split("T")[0] },
  { id: "bnk-03", account_name: "Selcom Merchant Gateway", account_type: "Payment Gateway (Selcom)", currency: "TZS", current_balance: 9800000, is_active: true, last_reconciled_date: new Date().toISOString().split("T")[0] },
  { id: "bnk-04", account_name: "Vodacom M-Pesa Business Till", account_type: "Mobile Money (M-Pesa)", account_number: "5544122", currency: "TZS", current_balance: 5400000, is_active: true, last_reconciled_date: new Date().toISOString().split("T")[0] }
]

const DEFAULT_JOURNALS: JournalEntry[] = [
  {
    id: "jn-001",
    entry_number: "QCL-JE-2026-001",
    entry_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    reference_type: "invoice",
    reference_number: "INV-2026-1001",
    memo: "Revenue recognition & VAT liability for Serengeti Freight enterprise invoice",
    total_debit: 18500000,
    total_credit: 18500000,
    status: "posted",
    lines: [
      { id: "line-1", account_id: "acc-1200", account_code: "1200", account_name: "Accounts Receivable", debit: 18500000, credit: 0, description: "Debit AR for Serengeti Freight" },
      { id: "line-2", account_id: "acc-4010", account_code: "4010", account_name: "Sales Revenue — Hardware", debit: 0, credit: 15677966, description: "Net Revenue recognition" },
      { id: "line-3", account_id: "acc-2020", account_code: "2020", account_name: "VAT Payable (TRA 18%)", debit: 0, credit: 2822034, description: "Output VAT liability" }
    ],
    posted_by: "Administrator",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "jn-002",
    entry_number: "QCL-JE-2026-002",
    entry_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    reference_type: "payment_received",
    reference_number: "REC-2026-041",
    memo: "Settlement received from CRDB Bank Technical Division via Bank Transfer",
    total_debit: 28400000,
    total_credit: 28400000,
    status: "posted",
    lines: [
      { id: "line-4", account_id: "acc-1020", account_code: "1020", account_name: "CRDB Bank Operational Account", debit: 28400000, credit: 0, description: "Cash received in bank" },
      { id: "line-5", account_id: "acc-1200", account_code: "1200", account_name: "Accounts Receivable", debit: 0, credit: 28400000, description: "Clear AR for CRDB Bank" }
    ],
    posted_by: "Administrator",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "jn-003",
    entry_number: "QCL-JE-2026-003",
    entry_date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    reference_type: "supplier_bill",
    reference_number: "BILL-HIK-092",
    memo: "Accrue supplier bill for Hikvision container shipment (PO-2026-1001)",
    total_debit: 5419000,
    total_credit: 5419000,
    status: "posted",
    lines: [
      { id: "line-6", account_id: "acc-1300", account_code: "1300", account_name: "Inventory Asset", debit: 5419000, credit: 0, description: "Stock added to warehouse" },
      { id: "line-7", account_id: "acc-2010", account_code: "2010", account_name: "Accounts Payable", debit: 0, credit: 5419000, description: "Credit trade payable to Hikvision" }
    ],
    posted_by: "Administrator",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
]

// -------------------------------------------------------------
// CHART OF ACCOUNTS API
// -------------------------------------------------------------
export async function getChartOfAccounts(): Promise<ChartOfAccount[]> {
  return fetchErpRecords<ChartOfAccount>("chart_of_accounts", "erp_chart_of_accounts", COA_FILE, DEFAULT_COA)
}

export async function createAccount(payload: Omit<ChartOfAccount, "id" | "created_at">): Promise<ChartOfAccount> {
  const { user } = await verifyAdminSession()
  const newAccount: ChartOfAccount = {
    id: `acc-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString()
  }

  const list = await getChartOfAccounts()
  const updated = [...list, newAccount].sort((a, b) => a.code.localeCompare(b.code))
  await persistErpRecords("chart_of_accounts", "erp_chart_of_accounts", COA_FILE, updated)

  await logAuditEvent({
    module: "payments",
    action: "created",
    record_id: newAccount.id,
    record_number: newAccount.code,
    description: `Added chart of accounts entry: [${newAccount.code}] ${newAccount.name} (${newAccount.type.toUpperCase()})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/accounting/accounts")
  return newAccount
}

// -------------------------------------------------------------
// JOURNAL ENTRIES API (Double-Entry Engine)
// -------------------------------------------------------------
export async function getJournalEntries(): Promise<JournalEntry[]> {
  return fetchErpRecords<JournalEntry>("journal_entries", "erp_journal_entries", JOURNALS_FILE, DEFAULT_JOURNALS)
}

export async function createJournalEntry(payload: {
  entry_date: string
  reference_type: JournalEntry["reference_type"]
  reference_number?: string
  memo: string
  lines: Array<{
    account_id: string
    account_code: string
    account_name: string
    debit: number
    credit: number
    description?: string
  }>
}): Promise<{ success: boolean; entry?: JournalEntry; error?: string }> {
  const { user } = await verifyAdminSession()

  // Validate double-entry equality
  const totalDebit = payload.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
  const totalCredit = payload.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      success: false,
      error: `Journal entry does not balance! Total Debits: TZS ${totalDebit.toLocaleString()}, Total Credits: TZS ${totalCredit.toLocaleString()}`
    }
  }

  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const newEntry: JournalEntry = {
    id: `jn-${Date.now()}`,
    entry_number: `QCL-JE-${new Date().getFullYear()}-${randomSuffix}`,
    entry_date: payload.entry_date,
    reference_type: payload.reference_type,
    reference_number: payload.reference_number,
    memo: payload.memo,
    total_debit: totalDebit,
    total_credit: totalCredit,
    status: "posted",
    lines: payload.lines.map((l, i) => ({
      id: `line-${Date.now()}-${i}`,
      ...l
    })),
    posted_by: user?.name || "Administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const list = await getJournalEntries()
  const updated = [newEntry, ...list.filter(j => j.id !== newEntry.id)]
  await persistErpRecords("journal_entries", "erp_journal_entries", JOURNALS_FILE, updated)

  // Update balances in Chart of Accounts
  const coa = await getChartOfAccounts()
  for (const line of newEntry.lines) {
    const acc = coa.find(a => a.id === line.account_id || a.code === line.account_code)
    if (acc) {
      if (acc.type === "asset" || acc.type === "expense" || acc.type === "cogs") {
        acc.current_balance += (line.debit - line.credit)
      } else {
        acc.current_balance += (line.credit - line.debit)
      }
    }
  }
  await persistErpRecords("chart_of_accounts", "erp_chart_of_accounts", COA_FILE, coa)

  await logAuditEvent({
    module: "payments",
    action: "payment_recorded",
    record_id: newEntry.id,
    record_number: newEntry.entry_number,
    description: `Posted general ledger journal entry ${newEntry.entry_number}: ${newEntry.memo} (Balancing sum: TZS ${totalDebit.toLocaleString()})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/accounting/journals")
  revalidatePath("/admin/accounting/accounts")
  revalidatePath("/admin/accounting/statements")
  return { success: true, entry: newEntry }
}

// -------------------------------------------------------------
// BANKING & CASH API
// -------------------------------------------------------------
export async function getBankCashAccounts(): Promise<BankCashAccount[]> {
  return fetchErpRecords<BankCashAccount>("bank_accounts", "erp_bank_accounts", BANK_FILE, DEFAULT_BANK_ACCOUNTS)
}

// -------------------------------------------------------------
// FINANCIAL STATEMENTS (P&L, Balance Sheet, Aging)
// -------------------------------------------------------------
export async function getProfitAndLossStatement(periodName = "Year-to-Date"): Promise<FinancialPeriodSummary> {
  const coa = await getChartOfAccounts()

  const revenueAccounts = coa.filter(a => a.type === "revenue")
  const cogsAccounts = coa.filter(a => a.type === "cogs")
  const expenseAccounts = coa.filter(a => a.type === "expense")

  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + Math.abs(a.current_balance), 0)
  const totalCogs = cogsAccounts.reduce((sum, a) => sum + Math.abs(a.current_balance), 0)
  const grossProfit = totalRevenue - totalCogs
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  const totalOperatingExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(a.current_balance), 0)
  const operatingIncome = grossProfit - totalOperatingExpenses
  const netProfit = operatingIncome
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    period_name: periodName,
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    total_revenue: totalRevenue,
    total_cogs: totalCogs,
    gross_profit: grossProfit,
    gross_margin_percentage: Number(grossMargin.toFixed(1)),
    total_operating_expenses: totalOperatingExpenses,
    operating_income: operatingIncome,
    net_profit: netProfit,
    net_profit_margin_percentage: Number(netMargin.toFixed(1))
  }
}

export async function getBalanceSheetSummary(): Promise<BalanceSheetSummary> {
  const coa = await getChartOfAccounts()

  const currentAssets = coa
    .filter(a => a.type === "asset" && a.sub_category !== "Fixed Assets")
    .map(a => ({ name: a.name, amount: Math.abs(a.current_balance) }))

  const nonCurrentAssets = coa
    .filter(a => a.type === "asset" && a.sub_category === "Fixed Assets")
    .map(a => ({ name: a.name, amount: Math.abs(a.current_balance) }))

  const totalAssets = [...currentAssets, ...nonCurrentAssets].reduce((s, a) => s + a.amount, 0)

  const currentLiabilities = coa
    .filter(a => a.type === "liability")
    .map(a => ({ name: a.name, amount: Math.abs(a.current_balance) }))

  const totalLiabilities = currentLiabilities.reduce((s, a) => s + a.amount, 0)

  const equityAccounts = coa.filter(a => a.type === "equity")
  const ownerEquity = equityAccounts.find(a => a.code === "3010")?.current_balance || 150000000
  const retainedEarnings = totalAssets - totalLiabilities - ownerEquity
  const totalEquity = ownerEquity + retainedEarnings

  return {
    as_of_date: new Date().toISOString().split("T")[0],
    assets: {
      current_assets: currentAssets,
      non_current_assets: nonCurrentAssets,
      total_assets: totalAssets
    },
    liabilities: {
      current_liabilities: currentLiabilities,
      long_term_liabilities: [],
      total_liabilities: totalLiabilities
    },
    equity: {
      owner_equity: ownerEquity,
      retained_earnings: retainedEarnings,
      total_equity: totalEquity
    },
    is_balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
  }
}

export async function getAccountsReceivableAging(): Promise<CustomerAgingRecord[]> {
  return [
    {
      customer_id: "cust-001",
      customer_name: "Serengeti Freight Logistics Ltd",
      customer_email: "b.massawe@serengetifreight.co.tz",
      bucket: { current: 6500000, days_31_60: 0, days_61_90: 0, days_90_plus: 0, total: 6500000 }
    },
    {
      customer_id: "cust-003",
      customer_name: "Bakhresa Food Products Ltd",
      customer_email: "security@bakhresa.com",
      bucket: { current: 8400000, days_31_60: 4000000, days_61_90: 0, days_90_plus: 0, total: 12400000 }
    }
  ]
}

export async function getAccountsPayableAging(): Promise<SupplierAgingRecord[]> {
  return [
    {
      supplier_id: "sup-hik-001",
      supplier_name: "Hikvision East Africa Logistics",
      bucket: { current: 5419000, days_31_60: 0, days_61_90: 0, days_90_plus: 0, total: 5419000 }
    },
    {
      supplier_id: "sup-asus-002",
      supplier_name: "ASUS Middle East & Africa FZE",
      bucket: { current: 5865000, days_31_60: 0, days_61_90: 0, days_90_plus: 0, total: 5865000 }
    }
  ]
}
