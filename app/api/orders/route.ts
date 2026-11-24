import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createOrder, OrderItem } from "@/lib/order-actions"
import { isValidEmail, normalizeEmail } from "@/lib/security/validation"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient()

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
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

    return NextResponse.json(orders)
  } catch (error) {
    console.error("GET /api/orders: Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { items, name, email, address, phone } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item." }, { status: 400 })
    }

    const cleanEmail = normalizeEmail(email || session.user.email || "")
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "A valid customer email is required." }, { status: 400 })
    }

    // Server-side calculation of total to prevent client-side price tampering
    let calculatedTotal = 0
    const sanitizedItems: OrderItem[] = []

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
      const price = Math.max(0, Number(item.price) || 0)
      calculatedTotal += price * qty

      sanitizedItems.push({
        id: String(item.id || ""),
        name: String(item.name || "Product").trim(),
        quantity: qty,
        price: price,
        image: String(item.image || "")
      })
    }

    // Call unified createOrder
    const order = await createOrder(
      session.user.id,
      sanitizedItems,
      calculatedTotal,
      {
        name: String(name || "Customer").trim(),
        email: cleanEmail,
        address: String(address || "").trim(),
        phone: phone ? String(phone).trim() : undefined
      }
    )

    return NextResponse.json(order)
  } catch (error: any) {
    console.error("POST /api/orders: Error creating order:", error)
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 })
  }
} 