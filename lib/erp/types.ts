/**
 * QuardCube Labs Enterprise Business Management (ERP) Types
 * Standardized data models for Inventory, Procurement, Sales, Accounting, and Operations.
 */

// 1. TAXES
export interface TaxRate {
  id: string
  name: string
  code: string
  rate: number // e.g. 18.00
  is_inclusive: boolean
  is_default: boolean
  is_active: boolean
  description?: string
  created_at?: string
}

// 2. WAREHOUSES & LOCATIONS
export interface Warehouse {
  id: string
  code: string
  name: string
  manager_name?: string
  manager_phone?: string
  manager_email?: string
  address: string
  city: string
  region: string
  is_primary: boolean
  is_active: boolean
  total_products?: number
  total_stock_units?: number
  total_stock_value?: number
  created_at?: string
  updated_at?: string
}

// 3. INVENTORY STOCK PER WAREHOUSE
export interface WarehouseStockItem {
  id: string
  product_id: number
  warehouse_id: string
  warehouse_name?: string
  warehouse_code?: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  reorder_point: number
  max_stock_level?: number
  bin_location?: string
  updated_at?: string
}

// 4. AUDITABLE INVENTORY MOVEMENTS
export type StockMovementType =
  | "opening_stock"
  | "purchase_received"
  | "sales_deduction"
  | "sales_reservation"
  | "sales_return"
  | "purchase_return"
  | "transfer_out"
  | "transfer_in"
  | "manual_adjustment"
  | "damage_loss"
  | "audit_correction"

export interface StockMovement {
  id: string
  movement_number: string
  product_id: number
  product_name: string
  warehouse_id?: string
  warehouse_name?: string
  destination_warehouse_id?: string
  destination_warehouse_name?: string
  movement_type: StockMovementType
  quantity: number
  previous_quantity: number
  new_quantity: number
  reference_type?: "order" | "purchase_order" | "invoice" | "adjustment" | "transfer" | "return"
  reference_id?: string
  reference_number?: string
  unit_cost?: number
  total_cost?: number
  reason?: string
  performed_by: string
  created_at: string
}

// 5. EXTENDED ERP PRODUCT
export interface ErpProduct {
  id: number
  name: string
  sku?: string
  barcode?: string
  category: string
  brand?: string
  unit_of_measure?: string // 'Unit', 'Pcs', 'Box', 'Kg', 'Meters'
  cost_price?: number // Buying price
  price: number // Selling price
  tax_rate?: number
  image: string
  description: string
  features: string[]
  stock: number // Total on-hand
  reserved_stock?: number
  available_stock?: number
  reorder_level?: number
  rating: number
  type: "physical" | "service"
  is_active?: boolean
  supplier_id?: string
  supplier_name?: string
  primary_warehouse_id?: string
  warehouse_breakdown?: WarehouseStockItem[]
  created_at?: string
  updated_at?: string
}

// 6. VENDORS / SUPPLIERS
export interface Supplier {
  id: string
  supplier_code: string
  name: string
  company_name?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  tin_number?: string
  vat_number?: string
  payment_terms: string
  opening_balance: number
  current_balance: number // Payable amount
  total_purchases_amount?: number
  total_orders_count?: number
  status: "active" | "inactive" | "blocked"
  notes?: string
  created_at: string
  updated_at: string
}

// 7. PURCHASE ORDERS
export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "confirmed"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled"

export interface PurchaseOrderItem {
  id?: string
  product_id: number
  name: string
  sku?: string
  quantity: number
  received_quantity?: number
  unit_cost: number
  tax_rate?: number
  tax_amount?: number
  discount_amount?: number
  total_cost: number
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  supplier_email?: string
  supplier_phone?: string
  supplier_address?: string
  warehouse_id?: string
  warehouse_name?: string
  order_date: string
  expected_delivery_date?: string
  items: PurchaseOrderItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  shipping_amount: number
  total: number
  amount_paid: number
  balance_due: number
  status: PurchaseOrderStatus
  payment_status: "unpaid" | "partially_paid" | "partial" | "paid"
  verification_token?: string
  verification_url?: string
  notes?: string
  terms_conditions?: string
  created_by: string
  created_at: string
  updated_at: string
}

// 8. GOODS RECEIVING NOTE (GRN)
export interface GoodsReceipt {
  id: string
  grn_number: string
  purchase_order_id: string
  po_number: string
  supplier_id: string
  supplier_name: string
  warehouse_id?: string
  warehouse_name?: string
  receipt_date: string
  received_items: Array<{
    product_id: number
    name: string
    ordered_quantity: number
    received_quantity: number
    unit_cost: number
  }>
  delivery_note_number?: string
  carrier_name?: string
  status: "draft" | "completed" | "cancelled"
  received_by: string
  notes?: string
  created_at: string
}

// 9. EXPENSES
export type ExpenseCategory =
  | "Rent & Facilities"
  | "Electricity & Water"
  | "Internet & Telecom"
  | "Transport & Logistics"
  | "Logistics & Fuel"
  | "Office Supplies"
  | "IT Hardware & Tools"
  | "Hardware Maintenance"
  | "Software & Cloud Services"
  | "Marketing & Advertising"
  | "Salaries & Contractor Fees"
  | "Maintenance & Repairs"
  | "Taxes & Licenses"
  | "Bank & Processing Fees"
  | "Meals & Entertainment"
  | "Other"

export interface BusinessExpense {
  id: string
  expense_number: string
  category: ExpenseCategory
  amount: number
  tax_amount: number
  expense_date: string
  supplier_id?: string
  vendor_name?: string
  payment_method: string
  payment_reference?: string
  description: string
  receipt_url?: string
  status: "draft" | "submitted" | "approved" | "rejected" | "paid"
  is_billable: boolean
  customer_id?: string
  customer_name?: string
  recorded_by: string
  created_at: string
  updated_at: string
  title?: string
  notes?: string
  currency?: string
  payment_status?: "paid" | "partial" | "unpaid" | string
}

// 10. CREDIT NOTES & RETURNS
export interface CreditNoteItem {
  id: string
  product_id?: number
  name: string
  quantity: number
  unit_price: number
  total: number
}

export interface CreditNote {
  id: string
  credit_note_number: string
  invoice_id?: string
  invoice_number?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  credit_date: string
  items: CreditNoteItem[]
  subtotal: number
  tax_amount: number
  total_credit: number
  amount_allocated: number
  remaining_credit: number
  status: "draft" | "open" | "closed" | "voided"
  reason?: string
  verification_token?: string
  verification_url?: string
  created_at: string
  updated_at: string
}

// 11. AUDIT LOGS
export interface AuditLogEntry {
  id: string
  module: "products" | "inventory" | "invoices" | "orders" | "payments" | "expenses" | "purchases" | "quotations" | "customers" | "suppliers"
  action: "created" | "updated" | "deleted" | "status_changed" | "stock_adjusted" | "stock_transferred" | "payment_recorded" | "received" | "approved"
  record_id: string
  record_number?: string
  description: string
  previous_state?: any
  new_state?: any
  user_email: string
  user_name: string
  ip_address?: string
  created_at: string
}

// 12. FINANCIAL SUMMARY METRICS
export interface ErpFinancialOverview {
  todayRevenue: number
  thisWeekRevenue: number
  thisMonthRevenue: number
  thisYearRevenue: number
  totalReceivables: number // Unpaid client invoices
  overdueReceivables: number
  totalPayables: number // Unpaid supplier POs/Bills
  totalExpensesMonth: number
  netProfitMonth: number
  totalStockValue: number
  totalProductsCount: number
  lowStockCount: number
  outOfStockCount: number
  pendingOrdersCount: number
  pendingQuotationsCount: number
  pendingPurchaseOrdersCount: number
}

// Type aliases for seamless compatibility
export type Expense = BusinessExpense

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  type?: string
  category: "Invoice" | "Order" | "Quotation" | "Proforma" | "Receipt" | "Product" | "Customer" | "Supplier" | "Purchase Order" | "Expense" | string
  url: string
  badge?: string
  date?: string
  amount?: number
}

// 13. BRANCHES & OUTLETS
export interface Branch {
  id: string
  code: string
  name: string
  manager_name: string
  phone: string
  email: string
  address: string
  city: string
  region: string
  is_main: boolean
  is_active: boolean
  staff_count: number
  inventory_val: number
  daily_sales: number
  created_at: string
  updated_at?: string
}

// 14. ROLES & PERMISSIONS
export type AdminRoleType =
  | "owner_admin"
  | "manager"
  | "accountant"
  | "stock_manager"
  | "cashier"

export interface PermissionItem {
  id: string
  name: string
  description: string
}

export interface PermissionCategory {
  category: string
  description: string
  permissions: PermissionItem[]
}

export interface RoleDefinition {
  id: AdminRoleType
  name: string
  badge_color?: string
  badge?: string
  description: string
  staff_count?: number
  permissions: string[]
  is_system?: boolean
}

// 15. STAFF MEMBERS
export interface StaffMember {
  id: string
  staff_code: string
  full_name: string
  email: string
  phone: string
  role: AdminRoleType
  branch_id: string
  branch_name: string
  status: "active" | "inactive" | "on_leave"
  avatar_url?: string
  joined_date: string
  last_active?: string
}

// 16. RECEIPT PRINT FORMATS
export type ReceiptPrintFormat = "a5" | "thermal-80" | "thermal-58"


