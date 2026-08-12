import { NextRequest, NextResponse } from "next/server"
import { getSelcomOrderStatus } from "@/lib/selcom"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transid, order_id, payment_status, resultcode, reference } = body

    console.log("Selcom webhook received:", { transid, order_id, payment_status, resultcode, reference })

    if (payment_status === "COMPLETED" && resultcode === "000") {
      console.log(`Payment confirmed for order ${order_id}, transaction ${transid}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Selcom webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("order_id")

    if (!orderId) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 })
    }

    const status = await getSelcomOrderStatus(orderId)

    if (status.resultcode === "000" && status.data && status.data[0]) {
      const orderData = status.data[0]
      return NextResponse.json({
        success: true,
        payment_status: orderData.payment_status,
        transid: orderData.transid,
        amount: orderData.amount,
        reference: status.reference,
      })
    }

    return NextResponse.json({
      success: false,
      payment_status: "UNKNOWN",
      message: status.message || "Order not found",
    })
  } catch (error) {
    console.error("Selcom order status error:", error)
    return NextResponse.json(
      { error: "Failed to check order status" },
      { status: 500 }
    )
  }
}
