import { PermissionCategory, RoleDefinition } from "@/lib/erp/types"

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    category: "Sales & Point of Sale (POS)",
    description: "Manage storefront sales, orders, quotations, proforma, and customer receipts",
    permissions: [
      { id: "pos_checkout", name: "POS Terminal Checkout", description: "Process live cash, card, and mobile money register checkouts" },
      { id: "manage_orders", name: "Manage Customer Orders", description: "Create, view, update, and cancel customer store orders" },
      { id: "issue_invoices", name: "Issue Commercial Invoices", description: "Generate, edit, and send official tax invoices" },
      { id: "issue_receipts", name: "Issue & Print Receipts", description: "Generate and print verified A5, 80mm, and 58mm thermal receipts" },
      { id: "issue_proforma", name: "Issue Proforma Invoices", description: "Create and dispatch quotations and proforma estimates" },
      { id: "apply_discounts", name: "Grant Custom Discounts", description: "Authorize custom price overrides and percentage discounts" },
      { id: "void_transactions", name: "Void & Refund Receipts", description: "Cancel completed sales and issue customer refunds" }
    ]
  },
  {
    category: "Inventory & Warehousing",
    description: "Control stock levels, item master data, stock adjustments, and multi-branch transfers",
    permissions: [
      { id: "view_inventory", name: "View Stock Levels & Valuations", description: "Inspect real-time product quantities and warehouse values" },
      { id: "manage_products", name: "Create & Edit Products", description: "Add new SKUs, modify prices, barcodes, and descriptions" },
      { id: "adjust_stock", name: "Stock Adjustments & Counts", description: "Execute manual adjustments, damage write-offs, and stock audit corrections" },
      { id: "transfer_stock", name: "Inter-Branch Stock Transfers", description: "Dispatch and accept inventory transfers between branches/warehouses" },
      { id: "receive_goods", name: "Receive Goods (GRN)", description: "Inspect supplier shipments and sign off Goods Received Notes" }
    ]
  },
  {
    category: "Procurement & Expenses",
    description: "Manage vendor accounts, purchase orders, business operational expenses, and payments",
    permissions: [
      { id: "manage_suppliers", name: "Manage Suppliers & Vendors", description: "Add, edit, and maintain supplier profiles and payment terms" },
      { id: "create_purchase_orders", name: "Create Purchase Orders (PO)", description: "Draft and dispatch procurement purchase orders to vendors" },
      { id: "approve_purchase_orders", name: "Approve High-Value POs", description: "Authorize capital expenditures and large vendor orders" },
      { id: "record_expenses", name: "Record Business Expenses", description: "Log operational expenditures, utility bills, and office costs" },
      { id: "approve_expenses", name: "Approve & Settle Expenses", description: "Review and approve logged expenses for accounting payout" }
    ]
  },
  {
    category: "Accounting & Financials",
    description: "Access executive financial ledgers, audit logs, profit & loss, and tax reports",
    permissions: [
      { id: "view_financial_overview", name: "View Executive Revenue & Profit", description: "Access total turnover, profit margins, and net receivables" },
      { id: "view_audit_logs", name: "View Security Audit Trails", description: "Inspect timestamped user activity and system audit logs" },
      { id: "generate_financial_reports", name: "Generate Financial Statements", description: "Export PDF/Excel balance sheets, tax logs, and cashflow reports" },
      { id: "manage_tax_settings", name: "Configure Tax & VAT Rates", description: "Set standard 18% VAT and custom withholding tax rules" }
    ]
  },
  {
    category: "Administration & Security",
    description: "Manage branch locations, employee staff accounts, user permissions, and master settings",
    permissions: [
      { id: "manage_branches", name: "Manage Branch Network", description: "Add, configure, and manage retail stores and depot branches" },
      { id: "manage_staff", name: "Manage Staff & Users", description: "Create staff accounts, assign branches, and manage employment status" },
      { id: "manage_roles", name: "Manage Roles & Permissions", description: "Define system roles and configure granular security matrices" },
      { id: "system_settings", name: "Global System Configuration", description: "Configure business info, SMS gateway, API keys, and SMTP server" }
    ]
  }
]

export const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: "owner_admin",
    name: "Owner / Admin",
    badge_color: "teal",
    description: "Executive root access with total control over all financial, operational, inventory, staff, and system security configurations.",
    staff_count: 2,
    is_system: true,
    permissions: [
      "pos_checkout", "manage_orders", "issue_invoices", "issue_receipts", "issue_proforma", "apply_discounts", "void_transactions",
      "view_inventory", "manage_products", "adjust_stock", "transfer_stock", "receive_goods",
      "manage_suppliers", "create_purchase_orders", "approve_purchase_orders", "record_expenses", "approve_expenses",
      "view_financial_overview", "view_audit_logs", "generate_financial_reports", "manage_tax_settings",
      "manage_branches", "manage_staff", "manage_roles", "system_settings"
    ]
  },
  {
    id: "manager",
    name: "Manager",
    badge_color: "navy",
    description: "Branch & operations leader with authority over daily sales, team supervision, stock transfers, discounts, and PO approvals.",
    staff_count: 3,
    is_system: true,
    permissions: [
      "pos_checkout", "manage_orders", "issue_invoices", "issue_receipts", "issue_proforma", "apply_discounts", "void_transactions",
      "view_inventory", "manage_products", "adjust_stock", "transfer_stock", "receive_goods",
      "manage_suppliers", "create_purchase_orders", "approve_purchase_orders", "record_expenses",
      "view_financial_overview", "view_audit_logs", "generate_financial_reports",
      "manage_branches", "manage_staff"
    ]
  },
  {
    id: "accountant",
    name: "Accountant",
    badge_color: "purple",
    description: "Financial controller responsible for tax invoices, expense approvals, ledger balance, payment receipts, and audit reports.",
    staff_count: 2,
    is_system: true,
    permissions: [
      "manage_orders", "issue_invoices", "issue_receipts", "issue_proforma",
      "view_inventory",
      "manage_suppliers", "create_purchase_orders", "record_expenses", "approve_expenses",
      "view_financial_overview", "view_audit_logs", "generate_financial_reports", "manage_tax_settings"
    ]
  },
  {
    id: "stock_manager",
    name: "Stock Manager",
    badge_color: "amber",
    description: "Logistics and inventory specialist overseeing SKU master records, stock audits, warehouse transfers, and supplier deliveries.",
    staff_count: 4,
    is_system: true,
    permissions: [
      "view_inventory", "manage_products", "adjust_stock", "transfer_stock", "receive_goods",
      "manage_suppliers", "create_purchase_orders"
    ]
  },
  {
    id: "cashier",
    name: "Cashier",
    badge_color: "emerald",
    description: "Frontline retail cashier focused on fast POS checkout, customer sales lookup, and verified receipt printing across formats.",
    staff_count: 6,
    is_system: true,
    permissions: [
      "pos_checkout", "manage_orders", "issue_receipts", "issue_proforma",
      "view_inventory"
    ]
  }
]
