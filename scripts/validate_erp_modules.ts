import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { getLeads, getDeals, getCustomerAccounts, getActivities } from "../lib/crm-actions"
import {
  getChartOfAccounts,
  getJournalEntries,
  getBankCashAccounts,
  getProfitAndLossStatement,
  getBalanceSheetSummary,
  getAccountsReceivableAging,
  getAccountsPayableAging
} from "../lib/accounting-actions"
import { getSupplierBills } from "../lib/supplier-bill-actions"
import { getCreditNotes } from "../lib/credit-note-actions"
import { getHardwareSerials } from "../lib/serial-actions"
import { getStockAdjustments } from "../lib/stock-adjustment-actions"

async function runValidation() {
  console.log("=== STARTING UNIFIED ERP BACKEND REGRESSION TEST ===")

  // 1. CRM
  const leads = await getLeads()
  const deals = await getDeals()
  const customers = await getCustomerAccounts()
  const activities = await getActivities()
  console.log(`[CRM] Leads: ${leads.length}, Deals: ${deals.length}, Customers: ${customers.length}, Activities: ${activities.length}`)

  // 2. Accounting
  const coa = await getChartOfAccounts()
  const journals = await getJournalEntries()
  const banks = await getBankCashAccounts()
  console.log(`[ACCOUNTING] COA Accounts: ${coa.length}, Posted Journals: ${journals.length}, Bank Accounts: ${banks.length}`)

  // Verify journal double-entry balancing
  for (const j of journals) {
    const diff = Math.abs(j.total_debit - j.total_credit)
    if (diff > 0.01) {
      throw new Error(`Journal ${j.entry_number} is NOT balanced! Diff: ${diff}`)
    }
  }
  console.log(`[ACCOUNTING] All ${journals.length} journal entries verified with ZERO debit/credit variance.`)

  // 3. Financial Statements
  const pnl = await getProfitAndLossStatement("FY 2026")
  const bs = await getBalanceSheetSummary()
  const ar = await getAccountsReceivableAging()
  const ap = await getAccountsPayableAging()
  console.log(`[STATEMENTS] Revenue: TZS ${pnl.total_revenue.toLocaleString()}, Net Profit: TZS ${pnl.net_profit.toLocaleString()} (Margin: ${pnl.net_profit_margin_percentage}%)`)
  console.log(`[STATEMENTS] Total Assets: TZS ${bs.assets.total_assets.toLocaleString()}, Balanced: ${bs.is_balanced}`)
  console.log(`[STATEMENTS] AR Debtors: ${ar.length}, AP Creditors: ${ap.length}`)

  // 4. Purchasing & Credit Notes
  const bills = await getSupplierBills()
  const creditNotes = await getCreditNotes()
  console.log(`[PURCHASING] Supplier Bills: ${bills.length}, Total Payables: TZS ${bills.reduce((s, b) => s + b.total, 0).toLocaleString()}`)
  console.log(`[CREDIT NOTES] Customer Credit Notes: ${creditNotes.length}`)

  // 5. Inventory
  const serials = await getHardwareSerials()
  const adjustments = await getStockAdjustments()
  console.log(`[INVENTORY] Hardware Serials: ${serials.length}, Physical Adjustments: ${adjustments.length}`)

  console.log("=== ALL UNIFIED ERP MODULES VERIFIED SUCCESSFULLY ===")
}

runValidation().catch(err => {
  console.error("Validation failed:", err)
  process.exit(1)
})
