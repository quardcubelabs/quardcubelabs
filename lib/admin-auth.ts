"use server"

import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

// Admin credentials - in production, these should be stored securely
const ADMIN_CREDENTIALS = {
  email: "framanreubinstein@gmail.com",
  password: "Framan#001@360!"
}

export type AdminUser = {
  id: string
  email: string
  isAdmin: boolean
}

export async function adminSignIn(email: string, password: string) {
  try {
    // Check if credentials match admin credentials
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return { error: "Invalid admin credentials" }
    }

    // Set admin session cookie
    const cookieStore = cookies()
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
          email: ADMIN_CREDENTIALS.email,
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
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin-session')
    
    if (adminSession?.value === 'true') {
      return {
        isAdmin: true,
        user: {
          id: 'admin',
          email: ADMIN_CREDENTIALS.email,
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
    const cookieStore = cookies()
    cookieStore.delete('admin-session')
    
    return { error: null }
  } catch (error) {
    console.error("Error in adminSignOut:", error)
    return { error: "Sign out failed" }
  }
}
