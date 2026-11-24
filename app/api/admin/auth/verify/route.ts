import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth-token"
import { getUserRoleAndPermissions } from "@/lib/rbac"
import { normalizeEmail, isValidEmail } from "@/lib/security/validation"

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, no-cache, must-revalidate" }

export async function GET(req: NextRequest) {
  try {
    const adminSessionCookie = req.cookies.get("admin-session")

    if (!adminSessionCookie?.value) {
      return NextResponse.json({ isAdmin: false, user: null }, { headers: NO_STORE_HEADERS })
    }

    const payload = await verifyAdminToken(adminSessionCookie.value)
    if (!payload || payload.role !== "admin" || !payload.email) {
      return NextResponse.json({ isAdmin: false, user: null }, { headers: NO_STORE_HEADERS })
    }

    const email = normalizeEmail(payload.email)
    if (!isValidEmail(email)) {
      return NextResponse.json({ isAdmin: false, user: null }, { headers: NO_STORE_HEADERS })
    }

    const rbacInfo = await getUserRoleAndPermissions(email)
    if (!rbacInfo.isActive) {
      return NextResponse.json({ isAdmin: false, user: null }, { headers: NO_STORE_HEADERS })
    }

    return NextResponse.json(
      {
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
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch {
    return NextResponse.json({ isAdmin: false, user: null }, { headers: NO_STORE_HEADERS })
  }
}
