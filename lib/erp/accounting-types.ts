/**
 * QuardCube Labs Enterprise Accounting & Zoho Books Equivalent Data Types
 * Double-Entry General Ledger, Chart of Accounts, Journal Entries, Supplier Bills, and Financial Statements.
 */

export type AccountType = 
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "cogs"
  | "expense"

export interface ChartOfAccount {
  id: string
  code: string // e.g., '1010', '1200', '2010', '4010', '5010', '6010'
  name: string
  type: AccountType
  sub_category: string // e.g., 'Current Assets', 'Accounts Receivable', 'Cash & Bank', 'Current Liabilities', 'Operating Income'
  description?: string
  currency: string
  current_balance: number
  is_active: boolean
  is_system: boolean
  created_at: string
}

export type JournalStatus = "draft" | "posted" | "voided"

export type JournalReferenceType = 
  | "invoice"
  | "payment_received"
  | "supplier_bill"
  | "supplier_payment"
  | "expense"
  | "credit_note"
  | "inventory_adjustment"
  | "manual"
  | "payroll"

export interface JournalEntryLine {
  id: string
  entry_id?: string
  account_id: string
  account_code: string
  account_name: string
  debit: number
  credit: number
  description?: string
}

export interface JournalEntry {
  id: string
  entry_number: string
  entry_date: string
  reference_type: JournalReferenceType
  reference_id?: string
  reference_number?: string
  memo: string
  total_debit: number
  total_credit: number
  status: JournalStatus
  lines: JournalEntryLine[]
  posted_by: string
  created_at: string
  updated_at: string
}

export interface SupplierBillItem {
  id?: string
  product_id?: number
  name: string
  sku?: string
  description?: string
  quantity: number
  unit_cost: number
  tax_rate?: number
  tax_amount?: number
  total_cost: number
}

export interface SupplierBill {
  id: string
  bill_number: string
  po_id?: string
  po_number?: string
  grn_id?: string
  grn_number?: string
  supplier_id: string
  supplier_name: string
  supplier_email?: string
  supplier_phone?: string
  bill_date: string
  due_date: string
  payment_terms: string
  items: SupplierBillItem[]
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total: number
  amount_paid: number
  balance_due: number
  status: "draft" | "open" | "paid" | "partially_paid" | "overdue" | "voided"
  notes?: string
  journal_entry_id?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface BankCashAccount {
  id: string
  account_name: string
  account_type: "Bank" | "Cash on Hand" | "Mobile Money (M-Pesa)" | "Mobile Money (Airtel)" | "Mobile Money (Tigo Pesa)" | "Payment Gateway (Selcom)"
  account_number?: string
  bank_name?: string
  branch?: string
  currency: string
  current_balance: number
  is_active: boolean
  last_reconciled_date?: string
  notes?: string
}

export interface FinancialPeriodSummary {
  period_name: string
  start_date: string
  end_date: string
  total_revenue: number
  total_cogs: number
  gross_profit: number
  gross_margin_percentage: number
  total_operating_expenses: number
  operating_income: number
  net_profit: number
  net_profit_margin_percentage: number
}

export interface AgingBucket {
  current: number // 0-30 days
  days_31_60: number
  days_61_90: number
  days_90_plus: number
  total: number
}

export interface CustomerAgingRecord {
  customer_id: string
  customer_name: string
  customer_email: string
  bucket: AgingBucket
}

export interface SupplierAgingRecord {
  supplier_id: string
  supplier_name: string
  bucket: AgingBucket
}

export interface BalanceSheetSummary {
  as_of_date: string
  assets: {
    current_assets: Array<{ name: string; amount: number }>
    non_current_assets: Array<{ name: string; amount: number }>
    total_assets: number
  }
  liabilities: {
    current_liabilities: Array<{ name: string; amount: number }>
    long_term_liabilities: Array<{ name: string; amount: number }>
    total_liabilities: number
  }
  equity: {
    retained_earnings: number
    owner_equity: number
    total_equity: number
  }
  is_balanced: boolean
}
