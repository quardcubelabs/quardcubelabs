import { AdminRoleType, RoleDefinition, StaffMember } from "@/lib/erp/types"
import { createServerClient } from "@/lib/supabase"
import { DEFAULT_SYSTEM_ROLES, LEGACY_PERMISSION_ALIASES } from "@/lib/role-constants"
import fs from "fs"
import path from "path"

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
 * Internal server-only role loader (avoids recursive RBAC checks during session verification)
 */
async function loadRolesInternal(): Promise<RoleDefinition[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("system_roles").select("*").order("id")
    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id as AdminRoleType,
        name: r.name,
        description: r.description,
        badge: r.badge,
        permissions: Array.isArray(r.permissions)
          ? r.permissions
          : typeof r.permissions === "string"
          ? JSON.parse(r.permissions)
          : []
      }))
    }
  } catch {}

  try {
    const rolesFile = path.join(process.cwd(), "db", "roles_data.json")
    if (fs.existsSync(rolesFile)) {
      const raw = await fs.promises.readFile(rolesFile, "utf-8")
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}

  return DEFAULT_SYSTEM_ROLES
}

/**
 * Internal server-only staff lookup from local fallback store when DB table is unreachable
 */
async function findFallbackStaffByEmail(normalizedEmail: string): Promise<StaffMember | null> {
  try {
    const staffFile = path.join(process.cwd(), "db", "staff_data.json")
    if (fs.existsSync(staffFile)) {
      const raw = await fs.promises.readFile(staffFile, "utf-8")
      const list = JSON.parse(raw)
      if (Array.isArray(list)) {
        return list.find((s: StaffMember) => s.email?.toLowerCase().trim() === normalizedEmail) || null
      }
    }
  } catch {}
  return null
}

/**
 * Checks if a user has a specific permission, honoring aliases and superadmin status.
 */
export function hasPermission(user: UserRBACInfo, permission: string): boolean {
  if (!user || !user.isActive) return false
  if (user.isSuperAdmin) return true

  const userPerms = new Set(user.permissions || [])
  if (userPerms.has(permission)) return true

  if (LEGACY_PERMISSION_ALIASES[permission] && userPerms.has(LEGACY_PERMISSION_ALIASES[permission])) {
    return true
  }

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
 * lacks at least one of the listed permissions. Accepts either an array or varargs.
 */
export async function assertAnyPermission(
  first: string | string[],
  ...rest: string[]
): Promise<UserRBACInfo> {
  const permissions: string[] = Array.isArray(first) ? first : [first, ...rest]
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
 * Strictly requires an exact match in `staff_members` or `SUPERADMIN_EMAILS`
 * (never substring/prefix email wildcards or client-editable metadata).
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

  const envAdminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim()
  const exactSuperAdminSet = new Set([
    ...SUPERADMIN_EMAILS.map(e => e.toLowerCase().trim()),
    ...(envAdminEmail ? [envAdminEmail] : [])
  ])

  try {
    const supabase = createServerClient()

    // 1. Check if user is registered in staff_members table (exact case-insensitive match)
    let staffMember: StaffMember | null = null
    const { data: dbStaff, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (!error && dbStaff) {
      staffMember = dbStaff as StaffMember
    } else {
      staffMember = await findFallbackStaffByEmail(normalizedEmail)
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

      if (assignedRole === "owner_admin" || exactSuperAdminSet.has(normalizedEmail)) {
        return {
          role: "owner_admin",
          roleName: ROLE_DISPLAY_NAMES.owner_admin,
          permissions: ALL_SYSTEM_PERMISSIONS,
          isSuperAdmin: true,
          staffMember,
          isActive: true
        }
      }

      const allRoles = await loadRolesInternal()
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

    // 2. Exact match check against configured Superadmin emails ONLY (never prefix/substring)
    if (exactSuperAdminSet.has(normalizedEmail)) {
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

  // Default deny for any unrecognized account
  return {
    role: "cashier",
    roleName: "Cashier",
    permissions: [],
    isSuperAdmin: false,
    staffMember: null,
    isActive: false
  }
}
