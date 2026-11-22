import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/rbac"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const supabase = createServerClient()

    // 1. Check if caller is an admin
    const adminSession = await verifyAdminSession()
    const isAdmin = !!(adminSession.isAdmin && adminSession.user && (
      adminSession.user.isSuperAdmin || hasPermission(adminSession.user as any, "orders:manage")
    ))

    // 2. If not admin, check customer auth session
    let customerUserId: string | null = null
    if (!isAdmin) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      customerUserId = session.user.id
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ["pending", "processing", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid order status value" }, { status: 400 })
    }

    // Customers can ONLY cancel an order if it is still pending
    if (!isAdmin) {
      if (status !== "cancelled") {
        return NextResponse.json({ error: "Forbidden: Customers may only cancel pending orders." }, { status: 403 })
      }

      // Verify the order currently belongs to the customer and is pending
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .eq("user_id", customerUserId)
        .maybeSingle()

      if (!currentOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (currentOrder.status !== "pending") {
        return NextResponse.json({ error: "Cannot cancel an order that is already processing or completed." }, { status: 400 })
      }
    }

    // Update the order status
    let query = supabase.from("orders").update({ status }).eq("id", orderId)
    if (!isAdmin && customerUserId) {
      query = query.eq("user_id", customerUserId)
    }

    const { data: order, error } = await query.select().single()

    if (error) throw error

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 