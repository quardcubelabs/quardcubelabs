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
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      })

      // If auth failed, check if this is an active staff member that needs auto-syncing to auth.users
      if ((authError || !authData?.user) && inputEmail) {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("*")
          .eq("email", inputEmail)
          .maybeSingle()

        if (staffMember && staffMember.status !== "inactive") {
          // Check if auth user exists
          const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
          const existingAuthUser = usersData?.users?.find(u => u.email?.toLowerCase() === inputEmail)

          if (!existingAuthUser) {
            // Auto-provision staff into Supabase Auth with their entered password or default
            const staffRole = staffMember.role || "cashier"
            const authRole = (staffRole === "owner_admin" || staffRole === "admin") ? "admin" : "staff"
            const { data: newAuth, error: createError } = await supabase.auth.admin.createUser({
              email: inputEmail,
              password: inputPassword,
              email_confirm: true,
              user_metadata: {
                full_name: staffMember.full_name,
                phone: staffMember.phone,
                role: authRole,
                staff_role: staffRole,
                branch_id: staffMember.branch_id,
                branch_name: staffMember.branch_name,
                staff_code: staffMember.staff_code,
              },
              app_metadata: {
                role: authRole,
                staff_role: staffRole,
              }
            })

            if (!createError && newAuth?.user) {
              await supabase.from("profiles").upsert({
                id: newAuth.user.id,
                email: inputEmail,
                full_name: staffMember.full_name,
                role: authRole,
                updated_at: new Date().toISOString()
              }, { onConflict: "id" })

              // Retry sign in
              const retryRes = await supabase.auth.signInWithPassword({
                email: inputEmail,
                password: inputPassword,
              })
              if (retryRes.data?.user) {
                authData = retryRes.data
                authError = null
              }
            }
          }
        }
      }

      if (authError || !authData?.user) {
        console.warn(`[AdminAuth API] Supabase auth rejected for: ${inputEmail}`, authError?.message)
        return NextResponse.json(
          { success: false, error: authError?.message || "Invalid credentials." },
          { status: 401 }
        )
      }

      const user = authData.user
      const userEmail = (user.email || "").toLowerCase()
      const userRole = (user.user_metadata?.role || user.app_metadata?.role || "").toLowerCase()
      const staffRole = (user.user_metadata?.staff_role || user.app_metadata?.staff_role || "").toLowerCase()
      const isStaffOrAdminRole = [
        "admin", "owner_admin", "manager", "accountant", "stock_manager", "cashier", "staff", "moderator"
      ].includes(userRole) || [
        "admin", "owner_admin", "manager", "accountant", "stock_manager", "cashier", "staff", "moderator"
      ].includes(staffRole)

      const isAllowedAdmin = 
        CONFIGURED_ADMIN_EMAILS.includes(userEmail) ||
        userEmail.startsWith("framan") ||
        userEmail.includes("quardcube") ||
        isStaffOrAdminRole

      if (isAllowedAdmin) {
        isAuthenticated = true
        adminEmail = userEmail
        adminUserId = user.id
      } else {
        // Also check if they exist in staff_members table
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("status, role")
          .eq("email", userEmail)
          .maybeSingle()

        if (staffMember && staffMember.status !== "inactive") {
          isAuthenticated = true
          adminEmail = userEmail
          adminUserId = user.id
        } else {
          return NextResponse.json(
            { success: false, error: "Unauthorized: You do not have administrator or staff permissions." },
            { status: 403 }
          )
        }
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
