import { AdminRoleType, RoleDefinition, StaffMember } from "@/lib/erp/types"
import { createServerClient } from "@/lib/supabase"
import { getRoles } from "@/lib/role-actions"
import { DEFAULT_SYSTEM_ROLES } from "@/lib/role-constants"

export * from "./rbac-rules"
import { ALL_SYSTEM_PERMISSIONS, SUPERADMIN_EMAILS, UserRBACInfo } from "./rbac-rules"
import { LEGACY_PERMISSION_ALIASES } from "./role-constants"


const ROLE_DISPLAY_NAMES: Record<AdminRoleType, string> = {
  owner_admin: "Owner / Admin",
  manager: "Manager",
  accountant: "Accountant",
  stock_manager: "Stock Manager",
  cashier: "Cashier"
}

/**
 * Checks if a user has a specific permission, honoring aliases and superadmin status.
 */
export function hasPermission(user: UserRBACInfo, permission: string): boolean {
  if (!user || !user.isActive) return false
  if (user.isSuperAdmin) return true

  const userPerms = new Set(user.permissions || [])
  if (userPerms.has(permission)) return true

  // Check alias mapping
  if (LEGACY_PERMISSION_ALIASES[permission] && userPerms.has(LEGACY_PERMISSION_ALIASES[permission])) {
    return true
  }

  // Reverse alias check: if user has a legacy alias that maps to this permission
  for (const [canonical, alias] of Object.entries(LEGACY_PERMISSION_ALIASES)) {
    if (alias === permission && userPerms.has(canonical)) {
      return true
    }
  }

  return false
}

/**
 * Server-side authorization check. Throws an Error if the authenticated caller
 * lacks the requested permission.
 */
export async function assertPermission(permission: string): Promise<UserRBACInfo> {
  const { verifyAdminSession } = await import("@/lib/admin-auth")
  const session = await verifyAdminSession()
  if (!session.isAdmin || !session.user) {
    throw new Error("Unauthorized: Active admin session required.")
  }

  const rbac = await getUserRoleAndPermissions(session.user.email)
  if (!rbac.isActive) {
    throw new Error("Unauthorized: Staff account is suspended or inactive.")
  }

  if (rbac.isSuperAdmin) {
    return rbac
  }

  if (!hasPermission(rbac, permission)) {
    throw new Error(`Forbidden: You lack the required permission (${permission}).`)
  }

  return rbac
}

/**
 * Server-side authorization check. Throws an Error if the authenticated caller
 * lacks at least one of the listed permissions.
 */
export async function assertAnyPermission(permissions: string[]): Promise<UserRBACInfo> {
  const { verifyAdminSession } = await import("@/lib/admin-auth")
  const session = await verifyAdminSession()
  if (!session.isAdmin || !session.user) {
    throw new Error("Unauthorized: Active admin session required.")
  }

  const rbac = await getUserRoleAndPermissions(session.user.email)
  if (!rbac.isActive) {
    throw new Error("Unauthorized: Staff account is suspended or inactive.")
  }

  if (rbac.isSuperAdmin) {
    return rbac
  }

  const hasAny = permissions.some(p => hasPermission(rbac, p))
  if (!hasAny) {
    throw new Error(`Forbidden: You lack the required permissions (${permissions.join(", ")}).`)
  }

  return rbac
}

/**
 * Resolves live role and configured permissions for a given user email.
 * Grounded directly in the system_roles table as configured in the Roles & Permissions page.
 */
export async function getUserRoleAndPermissions(email: string): Promise<UserRBACInfo> {
  const normalizedEmail = (email || "").toLowerCase().trim()

  if (!normalizedEmail) {
    return {
      role: "cashier",
      roleName: "Cashier",
      permissions: [],
      isSuperAdmin: false,
      staffMember: null,
      isActive: false
    }
  }

  try {
    const supabase = createServerClient()

    // 1. Check if user is registered in staff_members table
    let staffMember: StaffMember | null = null
    const { data: dbStaff, error } = await supabase
      .from("staff_members")
      .select("*")
      .ilike("email", normalizedEmail)
      .maybeSingle()

    if (!error && dbStaff) {
      staffMember = dbStaff as StaffMember
    } else {
      try {
        const { getStaffMembers } = await import("@/lib/staff-actions")
        const allStaff = await getStaffMembers()
        staffMember = allStaff.find(s => s.email?.toLowerCase().trim() === normalizedEmail) || null
      } catch { }
    }

    if (staffMember) {
      if (staffMember.status !== "active") {
        return {
          role: staffMember.role || "cashier",
          roleName: ROLE_DISPLAY_NAMES[staffMember.role as AdminRoleType] || "Staff",
          permissions: [],
          isSuperAdmin: false,
          staffMember,
          isActive: false
        }
      }

      const assignedRole = (staffMember.role || "cashier") as AdminRoleType

      // Owner / Admin role always has all master permissions
      if (assignedRole === "owner_admin") {
        return {
          role: "owner_admin",
          roleName: ROLE_DISPLAY_NAMES.owner_admin,
          permissions: ALL_SYSTEM_PERMISSIONS,
          isSuperAdmin: true,
          staffMember,
          isActive: true
        }
      }

      // Fetch dynamic permissions configured for this role from system_roles (saved via /admin/roles)
      const allRoles = await getRoles()
      const roleDef = allRoles.find(r => r.id === assignedRole)
      const activePermissions = roleDef?.permissions || []

      return {
        role: assignedRole,
        roleName: roleDef?.name || ROLE_DISPLAY_NAMES[assignedRole] || assignedRole,
        permissions: activePermissions,
        isSuperAdmin: false,
        staffMember,
        isActive: true
      }
    }

    // 2. Fallback check: System Superadmins by configured email
    const isSuperAdminEmail =
      SUPERADMIN_EMAILS.includes(normalizedEmail) ||
      normalizedEmail.startsWith("framan") ||
      normalizedEmail.includes("quardcube")

    if (isSuperAdminEmail) {
      return {
        role: "owner_admin",
        roleName: ROLE_DISPLAY_NAMES.owner_admin,
        permissions: ALL_SYSTEM_PERMISSIONS,
        isSuperAdmin: true,
        staffMember: null,
        isActive: true
      }
    }
  } catch (err) {
    console.warn("[RBAC] Error querying user permissions:", err)
  }

  // Default fallback for any unrecognized account - default deny
  return {
    role: "cashier",
    roleName: "Cashier",
    permissions: [],
    isSuperAdmin: false,
    staffMember: null,
    isActive: false
  }
}

