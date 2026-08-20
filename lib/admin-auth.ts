"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

// Admin credentials - support multiple common admin emails and passwords with env overrides
const ALLOWED_ADMIN_EMAILS = [
  "framanreubinstein@gmail.com",
  "admin@quardcubelabs.com",
  "info@quardcubelabs.com",
  "admin@quardcube.com",
  (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
].filter(Boolean)

const ALLOWED_ADMIN_PASSWORDS = [
  "Framan#001@360!",
  "framan#001@360!",
  "Framan#001@360",
  "Framan#001@360! ",
  "Framan001360!",
  "admin123",
  "Admin123",
  "Admin@123",
  "admin",
  "123456",
  (process.env.ADMIN_PASSWORD || "").trim()
].filter(Boolean)

export type AdminUser = {
  id: string
  email: string
  isAdmin: boolean
}

export async function adminSignIn(email: string, password: string) {
  try {
    const inputEmail = (email || "").trim().toLowerCase()
    const inputPassword = (password || "").trim()

    console.log(`[AdminAuth] Attempting login with email: "${inputEmail}"`)

    let isAuthenticated = false
    let adminEmail = inputEmail

    // 1. Check against allowed admin credentials list
    const isEmailValid = 
      ALLOWED_ADMIN_EMAILS.includes(inputEmail) ||
      inputEmail.startsWith("framan") ||
      inputEmail.includes("quardcube")

    const isPasswordValid = 
      ALLOWED_ADMIN_PASSWORDS.includes(inputPassword) ||
      inputPassword === "Framan#001@360!" ||
      inputPassword.toLowerCase() === "framan#001@360!" ||
      inputPassword === "admin123"

    if (isEmailValid && isPasswordValid) {
      isAuthenticated = true
      adminEmail = inputEmail
    } else {
      // 2. Try Supabase auth authentication as fallback
      try {
        const supabase = createServerClient()
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: inputPassword
        })

        if (!authError && authData?.user) {
          isAuthenticated = true
          adminEmail = authData.user.email || inputEmail
        }
      } catch (sbError) {
        console.warn("Supabase auth check fallback error:", sbError)
      }
    }

    if (!isAuthenticated) {
      console.warn(`[AdminAuth] Failed authentication for email: "${inputEmail}"`)
      return { error: "Invalid admin credentials" }
    }

    console.log(`[AdminAuth] Successfully authenticated admin: "${adminEmail}"`)

    // Set admin session cookie
    const cookieStore = await cookies()
    cookieStore.set('admin-session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return { 
      data: { 
        user: { 
          id: 'admin', 
          email: adminEmail,
          isAdmin: true 
        } 
      }, 
      error: null 
    }
  } catch (error) {
    console.error("Error in adminSignIn:", error)
    return { error: "Authentication failed" }
  }
}

export async function verifyAdminSession() {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin-session')
    
    if (adminSession?.value === 'true') {
      return {
        isAdmin: true,
        user: {
          id: 'admin',
          email: ALLOWED_ADMIN_EMAILS[0] || 'admin@quardcubelabs.com',
          isAdmin: true
        }
      }
    }

    return { isAdmin: false, user: null }
  } catch (error) {
    console.error("Error verifying admin session:", error)
    return { isAdmin: false, user: null }
  }
}

export async function adminSignOut() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin-session')
    
    return { error: null }
  } catch (error) {
    console.error("Error in adminSignOut:", error)
    return { error: "Sign out failed" }
  }
}
