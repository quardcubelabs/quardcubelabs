import { NextRequest, NextResponse } from "next/server"
import { createSelcomOrder, generateOrderId } from "@/lib/selcom"
import { createServerClient } from "@/lib/supabase"
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter"
import { isValidEmail, normalizeEmail, sanitizeString } from "@/lib/security/validation"

type CheckoutItem = {
  id: string
  name: string
  quantity: number
  price: number
}

type CheckoutRequest = {
  items: CheckoutItem[]
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers)
    const rl = checkRateLimit(`selcom-checkout:${ip}`, 10, 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many checkout requests. Please wait." }, { status: 429 })
    }

    const body: CheckoutRequest = await request.json()
    const { items, customerInfo } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const cleanEmail = normalizeEmail(customerInfo?.email)
    const cleanName = sanitizeString(customerInfo?.name, 120)

    if (!cleanName || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Valid customer name and email are required" }, { status: 400 })
    }

    // Authoritative server-side price lookup and stock verification from database
    const supabase = createServerClient()
    const numericIds = items.map(i => Number(i.id)).filter(n => Number.isFinite(n) && n > 0)
    let productMap = new Map<number, { id: number; name: string; price: number; stock: number }>()

    if (numericIds.length > 0) {
      const { data: dbProducts } = await supabase
        .from("products")
        .select("id, name, price, stock")
        .in("id", numericIds)

      if (dbProducts) {
        productMap = new Map(dbProducts.map(p => [p.id, p]))
      }
    }

    let calculatedAmount = 0
    let totalItems = 0
    const validatedItems: CheckoutItem[] = []

    for (const item of items) {
      const pId = Number(item.id)
      const dbProduct = productMap.get(pId)
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))

      if (dbProduct) {
        if (dbProduct.stock < qty) {
          return NextResponse.json({
            error: `Insufficient stock for product: ${dbProduct.name}. Requested: ${qty}, Available: ${dbProduct.stock}`
          }, { status: 400 })
        }
        const authoritativePrice = Math.max(0, Number(dbProduct.price) || 0)
        calculatedAmount += authoritativePrice * qty
        totalItems += qty
        validatedItems.push({
          id: String(dbProduct.id),
          name: dbProduct.name,
          quantity: qty,
          price: authoritativePrice
        })
      } else {
        const safePrice = Math.max(0, Number(item.price) || 0)
        calculatedAmount += safePrice * qty
        totalItems += qty
        validatedItems.push({
          id: String(item.id || ""),
          name: sanitizeString(item.name || "Item", 120),
          quantity: qty,
          price: safePrice
        })
      }
    }

    if (calculatedAmount <= 0) {
      return NextResponse.json({ error: "Invalid order total amount." }, { status: 400 })
    }

    const amount = calculatedAmount
    const orderId = generateOrderId()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.quardcubelabs.co.tz"

    const response = await createSelcomOrder({
      order_id: orderId,
      buyer_email: cleanEmail,
      buyer_name: cleanName,
      buyer_phone: customerInfo.phone || "",
      amount: amount,
      payment_methods: "ALL",
      redirect_url: `${baseUrl}/checkout/selcom-success?order_id=${orderId}`,
      cancel_url: `${baseUrl}/checkout?cancelled=true`,
      webhook: `${baseUrl}/api/selcom/webhook`,
      no_of_items: totalItems,
    })

    if (response.resultcode === "000" && response.data && response.data[0]) {
      const checkoutUrl = response.data[0].payment_gateway_url

      // Persist pending order to database so webhooks can fulfill even if browser disconnects
      try {
        await supabase.from("orders").insert([{
          order_number: orderId,
          user_id: "guest",
          items: validatedItems,
          total: amount.toString(),
          status: "pending",
          customerName: cleanName,
          customerEmail: cleanEmail,
          shippingAddress: `${customerInfo.address || ""}, ${customerInfo.city || ""}`.trim() || null,
          date: new Date().toISOString()
        }])
      } catch (dbErr) {
        console.warn("[SelcomCheckout] Could not pre-record order in DB:", dbErr)
      }

      return NextResponse.json({
        success: true,
        orderId,
        checkoutUrl,
        reference: response.reference,
      })
    }

    return NextResponse.json(
      {
        error: response.message || "Failed to create Selcom order",
        resultcode: response.resultcode,
      },
      { status: 400 }
    )
  } catch (error) {
    console.error("Selcom checkout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
