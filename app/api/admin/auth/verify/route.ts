import { NextRequest, NextResponse } from "next/server"
import { verifyAdminToken } from "@/lib/auth-token"
import { getUserRoleAndPermissions, SUPERADMIN_EMAILS } from "@/lib/rbac"

export async function GET(req: NextRequest) {
  try {
    const adminSessionCookie = req.cookies.get("admin-session")

    if (!adminSessionCookie?.value) {
      return NextResponse.json({ isAdmin: false, user: null })
    }

    const payload = await verifyAdminToken(adminSessionCookie.value)

    if (payload && payload.role === "admin") {
      const email = payload.email || SUPERADMIN_EMAILS[0] || "admin@quardcubelabs.com"
      const rbacInfo = await getUserRoleAndPermissions(email)

      if (!rbacInfo.isActive) {
        return NextResponse.json({ isAdmin: false, user: null, error: "Staff account is inactive" })
      }

      return NextResponse.json({
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
      })
    }

    return NextResponse.json({ isAdmin: false, user: null })
  } catch (error) {
    console.error("[AdminAuth API] Verify exception:", error)
    return NextResponse.json({ isAdmin: false, user: null })
  }
}

