import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient()

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log("GET /api/orders: Unauthorized - No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch orders for the user
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("GET /api/orders: Supabase fetch error:", error)
      throw error
    }

    console.log("GET /api/orders: Successfully fetched orders")
    return NextResponse.json(orders)
  } catch (error) {
    console.error("GET /api/orders: Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient()

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log("POST /api/orders: Unauthorized - No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("POST /api/orders: Request body:", body) // Log the request body
    const { items, total, name, email, address } = body

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: session.user.id,
        items: JSON.stringify(items),
        total,
        customer_name: name,
        customer_email: email,
        shipping_address: address,
        status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("POST /api/orders: Supabase insert error:", orderError) // Log the specific error
      throw orderError // Re-throw to be caught by the outer catch block
    }

    console.log("POST /api/orders: Order created successfully")
    return NextResponse.json(order)
  } catch (error) {
    console.error("POST /api/orders: Error creating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 