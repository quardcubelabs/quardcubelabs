import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth-token"

const CONFIGURED_ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  "framanreubinstein@gmail.com",
  "admin@quardcubelabs.com",
  "info@quardcubelabs.com",
  "admin@quardcube.com",
].filter(Boolean)

export async function GET(req: NextRequest) {
  try {
    const adminSessionCookie = req.cookies.get("admin-session")

    if (!adminSessionCookie?.value) {
      return NextResponse.json({ isAdmin: false, user: null })
    }

    const payload = await verifyAdminToken(adminSessionCookie.value)

    if (payload && payload.role === "admin") {
      return NextResponse.json({
        isAdmin: true,
        user: {
          id: "admin",
          email: payload.email || CONFIGURED_ADMIN_EMAILS[0] || "admin@quardcubelabs.com",
          isAdmin: true,
        },
      })
    }

    return NextResponse.json({ isAdmin: false, user: null })
  } catch (error) {
    console.error("[AdminAuth API] Verify exception:", error)
    return NextResponse.json({ isAdmin: false, user: null })
  }
}
