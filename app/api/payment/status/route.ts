import { type NextRequest, NextResponse } from "next/server"
import { getPaymentStatus } from "@/lib/payment-actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transactionId = searchParams.get("transactionId")

  if (!transactionId) {
    return NextResponse.json({ status: "error", message: "Transaction ID is required" }, { status: 400 })
  }

  try {
    const result = await getPaymentStatus(transactionId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error getting payment status:", error)
    return NextResponse.json({ status: "error", message: "Failed to get payment status" }, { status: 500 })
  }
}
