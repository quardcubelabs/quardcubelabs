"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies, headers } from "next/headers"
import { createAdminToken, verifyAdminToken } from "./auth-token"
import { normalizeEmail, isValidEmail } from "@/lib/security/validation"
import { getClientIp } from "@/lib/security/rate-limiter"
import {
  checkLoginProtection,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/security/login-lockout"
import { SUPERADMIN_EMAILS } from "@/lib/rbac-rules"
import crypto from "crypto"

import type { AdminRoleType, StaffMember } from "@/lib/erp/types"

export type AdminUser = {
  id: string
  email: string
  name?: string
  isAdmin: boolean
  role?: AdminRoleType
  roleName?: string
  permissions?: string[]
  isSuperAdmin?: boolean
  staffMember?: StaffMember | null
}

const GENERIC_AUTH_ERROR = "Invalid email or password."

function timingSafeStringMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Authenticate admin using Supabase Auth (bcrypt/argon2 hashed), enforce progressive lockout,
 * prevent user enumeration, never trust client-writable user_metadata, and issue signed HMAC session token.
 */
export async function adminSignIn(email: string, password: string, clientIpOverride?: string) {
  try {
    const inputEmail = normalizeEmail(email)
    const inputPassword = (password || "").trim()

    if (!inputEmail || !isValidEmail(inputEmail) || !inputPassword) {
      return { error: GENERIC_AUTH_ERROR }
    }

    let ip = clientIpOverride || "127.0.0.1"
    if (!clientIpOverride) {
      try {
        const hdrs = await headers()
        ip = getClientIp(hdrs)
      } catch {}
    }

    // 1. Progressive Lockout & IP Rate-Limit Check BEFORE credential evaluation
    const guard = await checkLoginProtection(inputEmail, ip)
    if (!guard.allowed) {
      return {
        error: guard.message || "Too many failed login attempts. Please try again later.",
        status: guard.status,
        retryAfterSeconds: guard.retryAfterSeconds,
      }
    }

    let isAuthenticated = false
    let adminEmail = inputEmail
    let adminUserId = "admin"

    // 2. Optional server-side environment override using timing-safe comparison
    const envAdminEmail = normalizeEmail(process.env.ADMIN_EMAIL || "")
    const envAdminPassword = (process.env.ADMIN_PASSWORD || "").trim()

    if (
      envAdminEmail &&
      envAdminPassword &&
      timingSafeStringMatch(inputEmail, envAdminEmail) &&
      timingSafeStringMatch(inputPassword, envAdminPassword)
    ) {
      isAuthenticated = true
      adminEmail = inputEmail
    } else {
      // 3. Primary secure authentication via Supabase Auth (auth.users)
      // SECURITY: Never auto-create auth users during failed login attempts.
      const supabase = createServerClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      })

      if (authError || !authData?.user) {
        const lockState = await recordFailedLogin(inputEmail, ip, "admin")
        if (lockState.locked && lockState.lockoutMinutes) {
          return {
            error: `Account locked for ${lockState.lockoutMinutes} minutes after multiple failed attempts.`,
            status: 423,
            retryAfterSeconds: lockState.retryAfterSeconds,
          }
        }
        return { error: GENERIC_AUTH_ERROR }
      }

      const user = authData.user
      const userEmail = normalizeEmail(user.email || "")
      const exactSuperAdmins = new Set([
        ...SUPERADMIN_EMAILS.map(e => normalizeEmail(e)),
        ...(envAdminEmail ? [envAdminEmail] : []),
      ])

      // SECURITY: Only trust server-only `app_metadata` (never client-editable `user_metadata`),
      // exact configured Superadmin emails, or active records in `public.staff_members`.
      const appRole = String(user.app_metadata?.role || "").toLowerCase()
      const appStaffRole = String(user.app_metadata?.staff_role || "").toLowerCase()
      const hasServerAppRole = [
        "admin", "owner_admin", "manager", "accountant", "stock_manager", "cashier", "staff"
      ].includes(appRole) || [
        "admin", "owner_admin", "manager", "accountant", "stock_manager", "cashier", "staff"
      ].includes(appStaffRole)

      if (exactSuperAdmins.has(userEmail) || hasServerAppRole) {
        isAuthenticated = true
        adminEmail = userEmail
        adminUserId = user.id
      } else {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("status, role")
          .eq("email", userEmail)
          .maybeSingle()

        if (staffMember && staffMember.status === "active") {
          isAuthenticated = true
          adminEmail = userEmail
          adminUserId = user.id
        } else {
          // Return generic authentication error to prevent role/account enumeration
          await recordFailedLogin(inputEmail, ip, "admin")
          return { error: GENERIC_AUTH_ERROR }
        }
      }
    }

    if (!isAuthenticated) {
      await recordFailedLogin(inputEmail, ip, "admin")
      return { error: GENERIC_AUTH_ERROR }
    }

    // 4. Verify active RBAC status before issuing session cookie
    const { getUserRoleAndPermissions } = await import("@/lib/rbac")
    const rbacInfo = await getUserRoleAndPermissions(adminEmail)

    if (!rbacInfo.isActive) {
      await recordFailedLogin(inputEmail, ip, "admin")
      return { error: GENERIC_AUTH_ERROR }
    }

    // 5. Reset consecutive failure counter on valid authentication
    await recordSuccessfulLogin(adminEmail)

    // 6. Create cryptographically signed HMAC-SHA256 session token
    const token = await createAdminToken(adminEmail, 60 * 60 * 24) // 24 hours

    const cookieStore = await cookies()
    cookieStore.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    // 7. Record login audit event (never logging passwords or tokens)
    try {
      const { logAuditEvent } = await import("@/lib/audit-actions")
      await logAuditEvent({
        module: "security",
        action: "login",
        record_id: rbacInfo.staffMember?.id || adminUserId,
        record_number: rbacInfo.staffMember?.staff_code || "AUTH-LOGIN",
        description: `${rbacInfo.staffMember?.full_name || adminEmail} logged in to system (${rbacInfo.roleName || "Staff"})`,
        user_email: adminEmail,
        user_name: rbacInfo.staffMember?.full_name || adminEmail.split("@")[0],
        branch_id: rbacInfo.staffMember?.branch_id || "br-01",
        branch_name: rbacInfo.staffMember?.branch_name || "QuardCube HQ & Innovation Hub",
        ip_address: ip,
      })
    } catch {}

    return {
      data: {
        token,
        user: {
          id: rbacInfo.staffMember?.id || adminUserId,
          email: adminEmail,
          isAdmin: true,
          role: rbacInfo.role,
          roleName: rbacInfo.roleName,
          permissions: rbacInfo.permissions,
          isSuperAdmin: rbacInfo.isSuperAdmin,
          staffMember: rbacInfo.staffMember,
        },
      },
      error: null,
    }
  } catch (error) {
    console.error("[AdminAuth] Authentication exception:", error)
    return { error: GENERIC_AUTH_ERROR }
  }
}

/**
 * Verify active admin session token strictly
 */
export async function verifyAdminSession(): Promise<{ isAdmin: boolean; user: AdminUser | null }> {
  try {
    const cookieStore = await cookies()
    const adminSessionCookie = cookieStore.get("admin-session")

    if (!adminSessionCookie?.value) {
      return { isAdmin: false, user: null }
    }

    const payload = await verifyAdminToken(adminSessionCookie.value)
    if (!payload || payload.role !== "admin" || !payload.email) {
      return { isAdmin: false, user: null }
    }

    const email = normalizeEmail(payload.email)
    if (!isValidEmail(email)) {
      return { isAdmin: false, user: null }
    }

    const { getUserRoleAndPermissions } = await import("@/lib/rbac")
    const rbacInfo = await getUserRoleAndPermissions(email)

    if (!rbacInfo.isActive) {
      return { isAdmin: false, user: null }
    }

    return {
      isAdmin: true,
      user: {
        id: rbacInfo.staffMember?.id || "admin",
        email,
        isAdmin: true,
        role: rbacInfo.role,
        roleName: rbacInfo.roleName,
        permissions: rbacInfo.permissions,
        isSuperAdmin: rbacInfo.isSuperAdmin,
        staffMember: rbacInfo.staffMember,
      },
    }
  } catch {
    return { isAdmin: false, user: null }
  }
}

/**
 * Sign out admin and clear session cookie
 */
export async function adminSignOut() {
  try {
    const cookieStore = await cookies()
    const adminSessionCookie = cookieStore.get("admin-session")
    if (adminSessionCookie?.value) {
      try {
        const payload = await verifyAdminToken(adminSessionCookie.value)
        if (payload?.email) {
          const { getUserRoleAndPermissions } = await import("@/lib/rbac")
          const rbacInfo = await getUserRoleAndPermissions(payload.email)
          const { logAuditEvent } = await import("@/lib/audit-actions")
          await logAuditEvent({
            module: "security",
            action: "updated",
            record_id: rbacInfo.staffMember?.id || "logout",
            record_number: rbacInfo.staffMember?.staff_code || "AUTH-LOGOUT",
            description: `${rbacInfo.staffMember?.full_name || payload.email} logged out from system`,
            user_email: payload.email,
            user_name: rbacInfo.staffMember?.full_name || payload.email.split("@")[0],
            branch_id: rbacInfo.staffMember?.branch_id || "br-01",
            branch_name: rbacInfo.staffMember?.branch_name || "QuardCube HQ & Innovation Hub",
          })
        }
      } catch {}
    }
    cookieStore.delete("admin-session")
    return { error: null }
  } catch {
    return { error: "Sign out failed" }
  }
}

/**
 * Change Admin Password in Supabase Auth with audit logging
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { isAdmin, user } = await verifyAdminSession()
    if (!isAdmin || !user?.email) {
      return { success: false, error: "Unauthorized: Admin session required." }
    }

    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      return { success: false, error: "New password must be between 8 and 128 characters long." }
    }

    const adminEmail = user.email.toLowerCase()
    const supabase = createServerClient()

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: currentPassword,
    })

    if (signInError || !authData?.user) {
      return { success: false, error: "Current password is incorrect." }
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      password: newPassword,
    })

    if (updateError) {
      return { success: false, error: "Could not update password. Please choose a stronger password." }
    }

    try {
      const { logAuditEvent } = await import("@/lib/audit-actions")
      await logAuditEvent({
        module: "security",
        action: "updated",
        record_id: user.id,
        record_number: "AUTH-PWD-CHANGE",
        description: `Administrator password changed for ${adminEmail}`,
        user_email: adminEmail,
      })
    } catch {}

    return { success: true }
  } catch {
    return { success: false, error: "Failed to update password." }
  }
}

/**
 * Change Admin Email Address in Supabase Auth
 */
export async function changeAdminEmail(newEmail: string, currentPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { isAdmin, user } = await verifyAdminSession()
    if (!isAdmin || !user?.email) {
      return { success: false, error: "Unauthorized: Admin session required." }
    }

    const cleanNewEmail = normalizeEmail(newEmail)
    if (!isValidEmail(cleanNewEmail)) {
      return { success: false, error: "Please provide a valid email address." }
    }

    const currentAdminEmail = user.email.toLowerCase()
    const supabase = createServerClient()

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: currentAdminEmail,
      password: currentPassword,
    })

    if (signInError || !authData?.user) {
      return { success: false, error: "Current password is incorrect." }
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      email: cleanNewEmail,
      email_confirm: true,
    })

    if (updateError) {
      return { success: false, error: "Failed to update email address." }
    }

    await supabase
      .from("profiles")
      .update({
        email: cleanNewEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authData.user.id)

    const token = await createAdminToken(cleanNewEmail, 60 * 60 * 24)
    const cookieStore = await cookies()
    cookieStore.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    try {
      const { logAuditEvent } = await import("@/lib/audit-actions")
      await logAuditEvent({
        module: "security",
        action: "updated",
        record_id: user.id,
        record_number: "AUTH-EMAIL-CHANGE",
        description: `Administrator email updated from ${currentAdminEmail} to ${cleanNewEmail}`,
        user_email: cleanNewEmail,
      })
    } catch {}

    return { success: true }
  } catch {
    return { success: false, error: "Failed to update email." }
  }
}
