import { AdminRoleType, RoleDefinition, StaffMember } from "@/lib/erp/types"
import { createServerClient } from "@/lib/supabase"
import { getRoles } from "@/lib/role-actions"
import { DEFAULT_SYSTEM_ROLES } from "@/lib/role-constants"

export * from "./rbac-rules"
import { ALL_SYSTEM_PERMISSIONS, SUPERADMIN_EMAILS, UserRBACInfo } from "./rbac-rules"


const ROLE_DISPLAY_NAMES: Record<AdminRoleType, string> = {
  owner_admin: "Owner / Admin",
  manager: "Manager",
  accountant: "Accountant",
  stock_manager: "Stock Manager",
  cashier: "Cashier"
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
    const { data: staffMember, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (!error && staffMember) {
      if (staffMember.status === "inactive") {
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

  // Default fallback for any unrecognized account
  return {
    role: "cashier",
    roleName: "Cashier",
    permissions: DEFAULT_SYSTEM_ROLES.find(r => r.id === "cashier")?.permissions || [],
    isSuperAdmin: false,
    staffMember: null,
    isActive: true
  }
}

