import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const adminSessionCookie = req.cookies.get("admin-session")
    if (adminSessionCookie?.value) {
      try {
        const { verifyAdminToken } = await import("@/lib/auth-token")
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
            branch_name: rbacInfo.staffMember?.branch_name || "QuardCube HQ & Innovation Hub"
          })
        }
      } catch (auditErr) {
        console.warn("[AdminAuth API] Logout audit event warning:", auditErr)
      }
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete("admin-session")
    return response
  } catch (error) {
    console.error("[AdminAuth API] Logout exception:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
