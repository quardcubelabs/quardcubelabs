import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { createAdminToken } from "@/lib/auth-token"

const CONFIGURED_ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  "framanreubinstein@gmail.com",
  "admin@quardcubelabs.com",
  "info@quardcubelabs.com",
  "admin@quardcube.com",
].filter(Boolean)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const inputEmail = (body.email || "").trim().toLowerCase()
    const inputPassword = (body.password || "").trim()

    if (!inputEmail || !inputPassword) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    let isAuthenticated = false
    let adminEmail = inputEmail
    let adminUserId = "admin"

    // 1. Check environment override if configured
    const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
    const envAdminPassword = (process.env.ADMIN_PASSWORD || "").trim()

    if (envAdminEmail && envAdminPassword && inputEmail === envAdminEmail && inputPassword === envAdminPassword) {
      isAuthenticated = true
      adminEmail = inputEmail
    } else {
      // 2. Primary secure authentication via Supabase Auth database
      const supabase = createServerClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      })

      if (authError || !authData?.user) {
        console.warn(`[AdminAuth API] Supabase auth rejected for: ${inputEmail}`, authError?.message)
        return NextResponse.json(
          { success: false, error: authError?.message || "Invalid admin credentials." },
          { status: 401 }
        )
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
        return NextResponse.json(
          { success: false, error: "Unauthorized: You do not have administrator permissions." },
          { status: 403 }
        )
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      )
    }

    // Create cryptographically signed HMAC session token
    const token = await createAdminToken(adminEmail, 60 * 60 * 24)

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUserId,
        email: adminEmail,
        isAdmin: true,
      }
    })

    // Set secure HTTP-only cookie
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error: any) {
    console.error("[AdminAuth API] Login exception:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error during authentication." },
      { status: 500 }
    )
  }
}
