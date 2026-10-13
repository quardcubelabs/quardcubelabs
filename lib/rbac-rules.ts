import { AdminRoleType, StaffMember } from "@/lib/erp/types"

export const ALL_SYSTEM_PERMISSIONS = [
  "pos_checkout", "manage_orders", "issue_invoices", "issue_receipts", "issue_proforma", "apply_discounts", "void_transactions",
  "view_inventory", "manage_products", "adjust_stock", "transfer_stock", "receive_goods",
  "manage_suppliers", "create_purchase_orders", "approve_purchase_orders", "record_expenses", "approve_expenses",
  "view_financial_overview", "view_audit_logs", "generate_financial_reports", "manage_tax_settings",
  "manage_branches", "manage_staff", "manage_roles", "system_settings"
]

// System Superadmin email addresses that always retain full executive control
export const SUPERADMIN_EMAILS = [
  "framanreubinstein@gmail.com",
  "admin@quardcubelabs.com",
  "info@quardcubelabs.com",
  "admin@quardcube.com",
]

/**
 * Route-to-Permission mapping.
 * Any route matching the prefix requires at least one of the listed permissions.
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin/analytics": ["view_financial_overview"],
  "/admin/bonds": ["view_financial_overview"],
  "/admin/cctv": ["system_settings"],
  "/admin/reports": ["generate_financial_reports", "view_audit_logs"],
  "/admin/blogs": ["manage_staff", "system_settings"],
  "/admin/users": ["manage_staff"],
  "/admin/products": ["manage_products", "view_inventory"],
  "/admin/orders": ["manage_orders", "pos_checkout"],
  "/admin/invoices": ["issue_invoices"],
  "/admin/proforma-invoices": ["issue_proforma"],
  "/admin/receipts": ["issue_receipts", "pos_checkout"],
  "/admin/quotations": ["issue_proforma"],
  "/admin/services": ["manage_products"],
  "/admin/inventory": ["view_inventory"],
  "/admin/purchases": ["create_purchase_orders", "approve_purchase_orders"],
  "/admin/suppliers": ["manage_suppliers"],
  "/admin/expenses": ["record_expenses", "approve_expenses"],
  "/admin/projects": ["manage_products", "manage_staff"],
  "/admin/positions": ["manage_staff"],
  "/admin/applications": ["manage_staff"],
  "/admin/branches": ["manage_branches"],
  "/admin/staff": ["manage_staff"],
  "/admin/roles": ["manage_roles"],
  "/admin/settings": ["system_settings"],
}

export interface UserRBACInfo {
  role: AdminRoleType
  roleName: string
  permissions: string[]
  isSuperAdmin: boolean
  staffMember: StaffMember | null
  isActive: boolean
}

/**
 * Checks whether a given path is authorized according to the user's active permissions.
 * Superadmins always have full access to all routes.
 * Dashboard and login are accessible to all authenticated staff members.
 */
export function isRouteAllowed(
  pathname: string, 
  userPermissions: string[] = [], 
  isSuperAdmin = false
): boolean {
  if (isSuperAdmin) return true

  // Standardize pathname
  const cleanPath = (pathname || "").split("?")[0].replace(/\/+$/, "") || "/admin"

  // Dashboard and root admin are accessible to all authenticated staff
  if (
    cleanPath === "/admin" ||
    cleanPath === "/admin/dashboard" ||
    cleanPath.startsWith("/admin/dashboard/") ||
    cleanPath === "/admin/login"
  ) {
    return true
  }

  // Find matches in ROUTE_PERMISSIONS
  for (const [routePrefix, requiredPerms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (cleanPath === routePrefix || cleanPath.startsWith(`${routePrefix}/`)) {
      return requiredPerms.some(p => userPermissions.includes(p))
    }
  }

  // Any unmapped admin subroute defaults to allowed
  return true
}
