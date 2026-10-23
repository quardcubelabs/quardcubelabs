import { AdminRoleType, StaffMember } from "@/lib/erp/types"
import { ALL_48_PERMISSIONS, LEGACY_PERMISSION_ALIASES } from "./role-constants"

export const ALL_SYSTEM_PERMISSIONS = ALL_48_PERMISSIONS

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
 * Supports both canonical 48 keys and legacy aliases.
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin/analytics": ["analytics:view", "dashboard:view", "view_financial_overview"],
  "/admin/bonds": ["bonds:view", "bonds:manage", "view_financial_overview"],
  "/admin/cctv": ["cctv:view", "cctv:manage", "system_settings"],
  "/admin/reports": ["reports:view", "reports:generate", "generate_financial_reports", "view_audit_logs"],
  "/admin/blogs": ["blogs:view", "blogs:manage", "manage_staff", "system_settings"],
  "/admin/users": ["users:view", "users:manage", "manage_staff"],
  "/admin/products": ["products:view", "products:manage", "manage_products", "view_inventory"],
  "/admin/orders": ["orders:view", "orders:manage", "manage_orders", "pos_checkout"],
  "/admin/invoices": ["invoices:view", "invoices:manage", "issue_invoices"],
  "/admin/proforma-invoices": ["proforma:view", "proforma:manage", "issue_proforma"],
  "/admin/receipts": ["receipts:view", "receipts:manage", "issue_receipts", "pos_checkout"],
  "/admin/quotations": ["quotations:view", "quotations:manage", "issue_proforma"],
  "/admin/services": ["services:view", "services:manage", "manage_products"],
  "/admin/inventory": ["inventory:view", "inventory:manage", "view_inventory"],
  "/admin/purchases": ["purchases:view", "purchases:manage", "create_purchase_orders", "approve_purchase_orders"],
  "/admin/suppliers": ["suppliers:view", "suppliers:manage", "manage_suppliers"],
  "/admin/expenses": ["expenses:view", "expenses:manage", "record_expenses", "approve_expenses"],
  "/admin/projects": ["projects:view", "projects:manage", "manage_products", "manage_staff"],
  "/admin/positions": ["positions:view", "positions:manage", "manage_staff"],
  "/admin/applications": ["applications:view", "applications:manage", "manage_staff"],
  "/admin/branches": ["branches:view", "branches:manage", "manage_branches"],
  "/admin/staff": ["staff:view", "staff:manage", "manage_staff"],
  "/admin/roles": ["roles:view", "roles:manage", "manage_roles"],
  "/admin/settings": ["settings:view", "settings:manage", "system_settings"],
  "/admin/help": ["dashboard:view", "system_settings", "manage_staff", "analytics:view", "reports:view", "products:view", "orders:view"],
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

  // Dashboard, help desk, and root admin are accessible to all authenticated staff
  if (
    cleanPath === "/admin" ||
    cleanPath === "/admin/dashboard" ||
    cleanPath.startsWith("/admin/dashboard/") ||
    cleanPath === "/admin/help" ||
    cleanPath.startsWith("/admin/help/") ||
    cleanPath === "/admin/login"
  ) {
    return true
  }

  // Expand user permissions with aliases
  const expandedPermissions = new Set<string>()
  for (const p of userPermissions) {
    expandedPermissions.add(p)
    if (LEGACY_PERMISSION_ALIASES[p]) {
      expandedPermissions.add(LEGACY_PERMISSION_ALIASES[p])
    }
  }

  // Find matches in ROUTE_PERMISSIONS
  for (const [routePrefix, requiredPerms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (cleanPath === routePrefix || cleanPath.startsWith(`${routePrefix}/`)) {
      return requiredPerms.some(p => expandedPermissions.has(p))
    }
  }

  // Any unmapped admin subroute defaults to allowed
  return true
}
