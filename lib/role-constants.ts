import { PermissionCategory, RoleDefinition } from "@/lib/erp/types"

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    category: "Dashboard & Executive Analytics",
    description: "Access executive business summary, real-time sales overview, and performance telemetry",
    permissions: [
      { id: "dashboard:view", name: "Dashboard Overview", description: "Access executive business summary, live sales metrics, and dashboard KPIs" },
      { id: "analytics:view", name: "Business Analytics", description: "Inspect cross-module revenue trends, operational metrics, and analytics charts" }
    ]
  },
  {
    category: "Sales & Commercial Operations",
    description: "Manage storefront sales, orders, invoices, proforma, quotations, and official receipts",
    permissions: [
      { id: "orders:view", name: "View Customer Orders", description: "Inspect customer orders, fulfillment statuses, tracking, and sales history" },
      { id: "orders:manage", name: "Manage Orders & POS", description: "Process live POS checkouts, create, update, or cancel customer store orders" },
      { id: "invoices:view", name: "View Commercial Invoices", description: "Inspect commercial and tax invoices generated across company branches" },
      { id: "invoices:manage", name: "Issue & Manage Invoices", description: "Draft, finalize, and dispatch official commercial and tax invoices" },
      { id: "credit_notes:view", name: "View Credit Notes", description: "Inspect customer credit notes, balance reversals, and returns" },
      { id: "credit_notes:manage", name: "Issue Credit Notes", description: "Generate and allocate customer credit notes against invoices" },
      { id: "proforma:view", name: "View Proforma Invoices", description: "Inspect estimated commercial proforma documents and customer quotes" },
      { id: "proforma:manage", name: "Create Proforma Invoices", description: "Generate, edit, and distribute customer proforma invoices" },
      { id: "receipts:view", name: "View Sales Receipts", description: "Inspect payment vouchers and issued cash, card, and mobile money receipts" },
      { id: "receipts:manage", name: "Issue & Print Receipts", description: "Generate, sign, and print verified A5, 80mm, and 58mm thermal receipts" },
      { id: "quotations:view", name: "View Price Quotations", description: "Inspect formal price quotations, project estimations, and bidding proposals" },
      { id: "quotations:manage", name: "Create & Manage Quotations", description: "Draft, update, and dispatch formal price quotations and proposals" }
    ]
  },
  {
    category: "CRM & Sales Pipeline",
    description: "Manage leads, opportunities, deal pipelines, customer 360 profiles, and sales activities",
    permissions: [
      { id: "crm:view", name: "View CRM Pipeline & Leads", description: "Inspect customer leads, deal pipelines, customer profiles, and timeline activities" },
      { id: "crm:manage", name: "Manage Leads, Deals & Pipeline", description: "Create and update leads, advance pipeline stages, assign sales reps, and log calls/tasks" }
    ]
  },
  {
    category: "Accounting & Double-Entry Books",
    description: "Manage chart of accounts, general ledger, balancing journal entries, supplier bills, and financial statements",
    permissions: [
      { id: "accounting:view", name: "View Accounts & Financial Statements", description: "Inspect chart of accounts, journal entries, P&L, balance sheet, and bank accounts" },
      { id: "accounting:manage", name: "Manage General Ledger & Journals", description: "Post balancing double-entry journal entries, reconcile bank accounts, and configure accounts" },
      { id: "bills:view", name: "View Supplier Bills", description: "Inspect accounts payable supplier bills, payment schedules, and aging" },
      { id: "bills:manage", name: "Issue & Pay Supplier Bills", description: "Create supplier bills, record payments, and track vendor accounts payable" }
    ]
  },
  {
    category: "Inventory & Warehousing",
    description: "Control stock levels, item master data, stock adjustments, serials, and warehouse transfers",
    permissions: [
      { id: "inventory:view", name: "View Stock Levels & Valuations", description: "Inspect real-time product quantities, warehouse valuations, and reorder levels" },
      { id: "inventory:manage", name: "Manage Inventory & Stock Counts", description: "Execute manual stock adjustments, branch transfers, and audit corrections" },
      { id: "serials:view", name: "View Hardware Serials & Warranties", description: "Inspect hardware serial numbers, MAC addresses, and active warranty terms" },
      { id: "serials:manage", name: "Manage Serials & Warranties", description: "Register hardware serial numbers, assign warranties, and track RMA status" }
    ]
  },
  {
    category: "Procurement, Suppliers & Expenses",
    description: "Manage vendor accounts, purchase orders, business operational expenses, and payments",
    permissions: [
      { id: "purchases:view", name: "View Purchase Orders", description: "Inspect supplier purchase orders and goods received notes (GRN)" },
      { id: "purchases:manage", name: "Manage Purchases & GRNs", description: "Draft purchase orders and inspect & sign off incoming goods shipments" },
      { id: "suppliers:view", name: "View Supplier Directory", description: "Inspect vendor profiles, ledger records, and procurement terms" },
      { id: "suppliers:manage", name: "Manage Suppliers & Vendors", description: "Add, edit, and maintain supplier profiles and payment terms" },
      { id: "expenses:view", name: "View Operational Expenses", description: "Inspect company disbursements, utility bills, and petty cash vouchers" },
      { id: "expenses:manage", name: "Record & Settle Expenses", description: "Log operational expenditures and approve accounting disbursements" }
    ]
  },
  {
    category: "Catalogs, Services & Projects",
    description: "Maintain master products catalog, corporate service offerings, and enterprise projects",
    permissions: [
      { id: "products:view", name: "View Products Catalog", description: "Inspect item master records, SKU pricing, barcodes, and specs" },
      { id: "products:manage", name: "Create & Edit Products", description: "Add new SKUs, modify retail prices, barcodes, and categories" },
      { id: "services:view", name: "View Services Catalog", description: "Inspect cataloged engineering, IT, and security services" },
      { id: "services:manage", name: "Manage Services Catalog", description: "Create and update corporate and client service offerings" },
      { id: "projects:view", name: "View Client Projects", description: "Inspect enterprise project timelines, milestones, and budgets" },
      { id: "projects:manage", name: "Manage Projects & Tasks", description: "Create projects, allocate team members, and update deliverables" }
    ]
  },
  {
    category: "Financial Reports & Bid Bonds",
    description: "Access executive financial statements, audit trails, balance sheets, and tender bonds",
    permissions: [
      { id: "reports:view", name: "View Financial Reports", description: "Inspect balance sheets, turnover reports, and tax statements" },
      { id: "reports:generate", name: "Generate & Export Statements", description: "Export audit ledgers and accounting reports in Excel and PDF formats" },
      { id: "bonds:view", name: "View Bid Bonds & Guarantees", description: "Inspect bank guarantees, tender bonds, and security deposits" },
      { id: "bonds:manage", name: "Manage Bonds & Guarantees", description: "Issue, record, and maintain active commercial bid bonds and guarantees" }
    ]
  },
  {
    category: "Human Resources & Branches",
    description: "Manage branch network, employee accounts, career positions, and job applications",
    permissions: [
      { id: "branches:view", name: "View Branch Network", description: "Inspect store locations, depots, and regional offices" },
      { id: "branches:manage", name: "Configure & Add Branches", description: "Create and update store locations, managers, and regional settings" },
      { id: "staff:view", name: "View Staff Directory", description: "Inspect employee records, contact info, and role assignments" },
      { id: "staff:manage", name: "Manage Staff Accounts", description: "Create employee accounts, update employment status, and access keys" },
      { id: "positions:view", name: "View Job Positions", description: "Inspect organizational chart and departmental designations" },
      { id: "positions:manage", name: "Manage Job Positions", description: "Create and configure career positions, requirements, and salary bands" },
      { id: "applications:view", name: "View Job Applications", description: "Inspect candidate resumes, cover letters, and applicant logs" },
      { id: "applications:manage", name: "Process Career Applications", description: "Screen applicants, schedule interviews, and update hiring statuses" }
    ]
  },
  {
    category: "Surveillance, Governance & Administration",
    description: "Manage CCTV surveillance, blog publications, client accounts, roles, and settings",
    permissions: [
      { id: "cctv:view", name: "View Live CCTV Feeds", description: "Monitor live surveillance camera streams across company facilities" },
      { id: "cctv:manage", name: "Manage CCTV Systems", description: "Configure camera feeds, recording storage, and PTZ controllers" },
      { id: "blogs:view", name: "View Articles & News", description: "Inspect company news, public announcements, and articles" },
      { id: "blogs:manage", name: "Publish Articles & News", description: "Draft, edit, and publish press releases and web content" },
      { id: "users:view", name: "View Client Accounts", description: "Inspect client portal registrations and external user profiles" },
      { id: "users:manage", name: "Manage Client Accounts", description: "Update client accounts, permissions, and security status" },
      { id: "roles:view", name: "View Roles & RBAC Matrix", description: "Inspect access levels and security policies across system roles" },
      { id: "roles:manage", name: "Manage Roles & Permissions", description: "Modify role permissions, assign authority, and update matrices" },
      { id: "settings:view", name: "View System Settings", description: "Inspect global business preferences, currency, and tax rules" },
      { id: "settings:manage", name: "Update System Settings", description: "Modify API integrations, SMTP, branch configs, and parameters" }
    ]
  }
]

export const LEGACY_PERMISSION_ALIASES: Record<string, string> = {
  pos_checkout: "orders:manage",
  manage_orders: "orders:manage",
  issue_invoices: "invoices:manage",
  issue_receipts: "receipts:manage",
  issue_proforma: "proforma:manage",
  apply_discounts: "orders:manage",
  void_transactions: "orders:manage",
  view_inventory: "inventory:view",
  manage_products: "products:manage",
  adjust_stock: "inventory:manage",
  transfer_stock: "inventory:manage",
  receive_goods: "purchases:manage",
  manage_suppliers: "suppliers:manage",
  create_purchase_orders: "purchases:manage",
  approve_purchase_orders: "purchases:manage",
  record_expenses: "expenses:manage",
  approve_expenses: "expenses:manage",
  view_financial_overview: "analytics:view",
  view_audit_logs: "reports:view",
  generate_financial_reports: "reports:generate",
  manage_tax_settings: "settings:manage",
  manage_branches: "branches:manage",
  manage_staff: "staff:manage",
  manage_roles: "roles:manage",
  system_settings: "settings:manage"
}

export const ALL_48_PERMISSIONS: string[] = PERMISSION_CATEGORIES.flatMap(c => c.permissions.map(p => p.id))

export const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: "owner_admin",
    name: "Owner / Executive Admin",
    badge_color: "teal",
    description: "Executive root access with total control over all financial, operational, inventory, staff, and system security configurations.",
    staff_count: 2,
    is_system: true,
    permissions: [...ALL_48_PERMISSIONS]
  },
  {
    id: "manager",
    name: "Operations Manager",
    badge_color: "navy",
    description: "Branch & operations leader with authority over daily sales, team supervision, stock transfers, discounts, and PO approvals.",
    staff_count: 3,
    is_system: true,
    permissions: [
      "dashboard:view", "analytics:view", "cctv:view", "cctv:manage",
      "reports:view", "reports:generate", "users:view", "users:manage",
      "products:view", "products:manage", "orders:view", "orders:manage",
      "invoices:view", "invoices:manage", "proforma:view", "proforma:manage",
      "receipts:view", "receipts:manage", "quotations:view", "quotations:manage",
      "services:view", "services:manage", "inventory:view", "inventory:manage",
      "purchases:view", "purchases:manage", "suppliers:view", "expenses:view",
      "branches:view", "staff:view"
    ]
  },
  {
    id: "accountant",
    name: "Financial Controller / Accountant",
    badge_color: "purple",
    description: "Financial controller responsible for tax invoices, expense approvals, ledger balance, payment receipts, and audit reports.",
    staff_count: 2,
    is_system: true,
    permissions: [
      "dashboard:view", "analytics:view", "reports:view", "reports:generate",
      "orders:view", "invoices:view", "invoices:manage", "proforma:view",
      "proforma:manage", "receipts:view", "receipts:manage", "quotations:view",
      "expenses:view", "expenses:manage", "purchases:view", "suppliers:view",
      "suppliers:manage", "branches:view"
    ]
  },
  {
    id: "stock_manager",
    name: "Warehouse & Inventory Controller",
    badge_color: "amber",
    description: "Logistics and inventory specialist overseeing SKU master records, stock audits, warehouse transfers, and supplier deliveries.",
    staff_count: 4,
    is_system: true,
    permissions: [
      "dashboard:view", "products:view", "products:manage",
      "inventory:view", "inventory:manage", "purchases:view",
      "purchases:manage", "suppliers:view", "branches:view"
    ]
  },
  {
    id: "cashier",
    name: "Point of Sale (POS) Cashier",
    badge_color: "emerald",
    description: "Frontline retail cashier focused on fast POS checkout, customer sales lookup, and verified receipt printing across formats.",
    staff_count: 6,
    is_system: true,
    permissions: [
      "dashboard:view", "products:view", "orders:view", "orders:manage",
      "invoices:view", "receipts:view", "receipts:manage", "quotations:view"
    ]
  }
]
