import { NextRequest, NextResponse } from "next/server"
import { createSelcomOrder, generateOrderId } from "@/lib/selcom"

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
    const body: CheckoutRequest = await request.json()
    const { items, customerInfo } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    if (!customerInfo.name || !customerInfo.email) {
      return NextResponse.json({ error: "Customer info required" }, { status: 400 })
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const orderId = generateOrderId()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    const nameParts = customerInfo.name.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const response = await createSelcomOrder({
      order_id: orderId,
      buyer_email: customerInfo.email,
      buyer_name: customerInfo.name,
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
