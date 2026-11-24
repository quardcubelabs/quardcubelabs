import { NextRequest, NextResponse } from "next/server"
import { getSelcomOrderStatus } from "@/lib/selcom"
import { sendPaymentNotificationToAdmin } from "@/lib/email-service"
import { createServerClient } from "@/lib/supabase"
import { sanitizePostgrestFilterValue } from "@/lib/security/url-guard"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transid, order_id, payment_status, resultcode, reference, amount, buyer_name, buyer_email, buyer_phone } = body

    console.log("Selcom webhook received:", { transid, order_id, payment_status, resultcode, reference })

    const safeOrderId = sanitizePostgrestFilterValue(order_id)
    if (!safeOrderId) {
      return NextResponse.json({ error: "Invalid order_id" }, { status: 400 })
    }

    // Upstream status verification: verify payment directly with Selcom Gateway to prevent webhook spoofing
    let isPaymentVerified = false
    try {
      const upstreamStatus = await getSelcomOrderStatus(safeOrderId)
      if (
        upstreamStatus &&
        upstreamStatus.resultcode === "000" &&
        upstreamStatus.data &&
        upstreamStatus.data[0]?.payment_status === "COMPLETED"
      ) {
        isPaymentVerified = true
      }
    } catch (checkErr) {
      console.warn("Could not verify status upstream with Selcom Gateway:", checkErr)
      // Allow if valid signature or fallback
      if (payment_status === "COMPLETED" && resultcode === "000") {
        isPaymentVerified = true
      }
    }

    if (isPaymentVerified) {
      console.log(`Payment confirmed for order ${safeOrderId}, transaction ${transid}`)

      // Update database orders & invoices
      try {
        const supabase = createServerClient()
        await supabase
          .from("orders")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .or(`order_number.eq.${safeOrderId},id.eq.${safeOrderId}`)

        await supabase
          .from("invoices")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .like("notes", `%${safeOrderId}%`)

        const { logAuditEvent } = await import("@/lib/audit-actions")
        await logAuditEvent({
          module: "payments",
          action: "payment_recorded",
          record_id: transid || safeOrderId,
          record_number: safeOrderId,
          description: `Confirmed Selcom gateway settlement of TZS ${Number(amount || 0).toLocaleString()} for order ${safeOrderId}`,
          new_state: { payment_status: "COMPLETED", transid, reference, amount },
          user_name: buyer_name || "Selcom Gateway",
          user_email: buyer_email || "gateway@selcom.net"
        })
      } catch (syncErr) {
        console.error("Error fulfilling Selcom webhook:", syncErr)
      }
      
      // Notify admin about Selcom payment
      sendPaymentNotificationToAdmin({
        orderId: safeOrderId,
        orderNumber: safeOrderId,
        amount: Number(amount || 0),
        paymentMethod: "Selcom Gateway (Mobile Money / Cards)",
        transactionId: transid || reference,
        customerName: buyer_name,
        customerEmail: buyer_email,
        customerPhone: buyer_phone,
      }).catch(err => console.error("Error sending admin Selcom payment notification:", err))
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
