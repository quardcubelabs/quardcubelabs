"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import { createAdminToken, verifyAdminToken } from "./auth-token"

export type AdminUser = {
  id: string
  email: string
  isAdmin: boolean
}

// Configured admin emails list with environment override support
const CONFIGURED_ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  "framanreubinstein@gmail.com",
  "admin@quardcubelabs.com",
  "info@quardcubelabs.com",
  "admin@quardcube.com",
].filter(Boolean)

/**
 * Authenticate admin using Supabase Auth (bcrypt/argon2 hashed) and issue signed HMAC session token
 */
export async function adminSignIn(email: string, password: string) {
  try {
    const inputEmail = (email || "").trim().toLowerCase()
    const inputPassword = (password || "").trim()

    if (!inputEmail || !inputPassword) {
      return { error: "Email and password are required" }
    }

    console.log(`[AdminAuth] Authenticating against Supabase Auth for: "${inputEmail}"`)

    let isAuthenticated = false
    let adminEmail = inputEmail
    let adminUserId = "admin"

    // 1. Check if environment variables for admin login are configured (optional override)
    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
    const envAdminPassword = (process.env.ADMIN_PASSWORD || "").trim()

    if (envAdminEmail && envAdminPassword && inputEmail === envAdminEmail && inputPassword === envAdminPassword) {
      isAuthenticated = true
      adminEmail = inputEmail
    } else {
      // 2. Primary secure authentication via Supabase Auth database (auth.users)
      const supabase = createServerClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      })

      if (authError || !authData?.user) {
        console.warn(`[AdminAuth] Supabase auth rejected for email "${inputEmail}":`, authError?.message)
        return { error: "Invalid admin credentials." }
      }

      const user = authData.user
      const userEmail = (user.email || "").toLowerCase()
      const isAdminRole = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin"
      const isAllowedAdmin = 
        CONFIGURED_ADMIN_EMAILS.includes(userEmail) ||
        userEmail.startsWith("framan") ||
        userEmail.includes("quardcube")

      if (isAdminRole || isAllowedAdmin) {
        isAuthenticated = true
        adminEmail = userEmail
        adminUserId = user.id
      } else {
        console.warn(`[AdminAuth] User ${userEmail} authenticated but is not an authorized administrator.`)
        return { error: "Unauthorized: You do not have administrator permissions." }
      }
    }

    if (!isAuthenticated) {
      return { error: "Invalid admin credentials." }
    }

    console.log(`[AdminAuth] Successfully authenticated admin: "${adminEmail}"`)

    // Create cryptographically signed HMAC-SHA256 session token
    const token = await createAdminToken(adminEmail, 60 * 60 * 24) // 24 hours

    // Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return { 
      data: { 
        user: { 
          id: adminUserId, 
          email: adminEmail,
          isAdmin: true 
        } 
      }, 
      error: null 
    }
  } catch (error) {
    console.error("Error in adminSignIn:", error)
    return { error: "Authentication failed." }
  }
}

/**
 * Verify active admin session token
 */
export async function verifyAdminSession(): Promise<{ isAdmin: boolean; user: AdminUser | null }> {
  try {
    const cookieStore = await cookies()
    const adminSessionCookie = cookieStore.get("admin-session")
    
    if (!adminSessionCookie?.value) {
      return { isAdmin: false, user: null }
    }

    const payload = await verifyAdminToken(adminSessionCookie.value)
    
    if (payload && payload.role === "admin") {
      return {
        isAdmin: true,
        user: {
          id: "admin",
          email: payload.email || CONFIGURED_ADMIN_EMAILS[0] || "admin@quardcubelabs.com",
          isAdmin: true,
        },
      }
    }

    return { isAdmin: false, user: null }
  } catch (error) {
    console.error("Error verifying admin session:", error)
    return { isAdmin: false, user: null }
  }
}

/**
 * Sign out admin and clear session cookie
 */
export async function adminSignOut() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("admin-session")
    
    return { error: null }
  } catch (error) {
    console.error("Error in adminSignOut:", error)
    return { error: "Sign out failed" }
  }
}

/**
 * Change Admin Password in Supabase Auth
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { isAdmin, user } = await verifyAdminSession()
    if (!isAdmin || !user?.email) {
      return { success: false, error: "Unauthorized: Admin session required." }
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." }
    }

    const adminEmail = user.email.toLowerCase()
    const supabase = createServerClient()

    // 1. Verify current password securely via Supabase Auth signIn
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: currentPassword,
    })

    if (signInError || !authData?.user) {
      return { success: false, error: "Current password is incorrect." }
    }

    // 2. Update password in Supabase Auth (hashed automatically)
    const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      password: newPassword,
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    console.log(`[AdminAuth] Password successfully updated for admin: ${adminEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error in changeAdminPassword:", error)
    return { success: false, error: error.message || "Failed to update password." }
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

    const cleanNewEmail = (newEmail || "").trim().toLowerCase()
    if (!cleanNewEmail || !cleanNewEmail.includes("@")) {
      return { success: false, error: "Please provide a valid email address." }
    }

    const currentAdminEmail = user.email.toLowerCase()
    const supabase = createServerClient()

    // 1. Verify current password
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: currentAdminEmail,
      password: currentPassword,
    })

    if (signInError || !authData?.user) {
      return { success: false, error: "Current password is incorrect." }
    }

    // 2. Update email in Supabase Auth and profile
    const { error: updateError } = await supabase.auth.admin.updateUserById(authData.user.id, {
      email: cleanNewEmail,
      email_confirm: true,
    })

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Update public.profiles
    await supabase.from("profiles").update({
      email: cleanNewEmail,
      updated_at: new Date().toISOString()
    }).eq("id", authData.user.id)

    // 3. Re-issue new signed session token for the new email
    const token = await createAdminToken(cleanNewEmail, 60 * 60 * 24)
    const cookieStore = await cookies()
    cookieStore.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    console.log(`[AdminAuth] Admin email updated from ${currentAdminEmail} to ${cleanNewEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error("Error in changeAdminEmail:", error)
    return { success: false, error: error.message || "Failed to update email." }
  }
}
