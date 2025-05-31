import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient()

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Update the order status
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", params.orderId)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 