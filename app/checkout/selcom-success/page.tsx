"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { useOrders } from "@/contexts/order-context"
import { useAuth } from "@/contexts/auth-context"

type PaymentStatus = "loading" | "confirmed" | "pending" | "failed"

export default function SelcomSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const { clearCart } = useCart()
  const { addOrder } = useOrders()
  const { user } = useAuth()
  const [status, setStatus] = useState<PaymentStatus>("loading")
  const [polledCount, setPolledCount] = useState(0)

  useEffect(() => {
    if (!orderId) {
      setStatus("failed")
      return
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/selcom/webhook?order_id=${orderId}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()

        if (data.payment_status === "COMPLETED") {
          setStatus("confirmed")
          try {
            const cartData = localStorage.getItem("quardcube-cart")
            if (cartData && typeof cartData === "string" && cartData.startsWith("[")) {
              const parsed = JSON.parse(cartData)
              if (Array.isArray(parsed) && parsed.length > 0) {
                const orderItems = parsed.map((item: { product: { id: number; name: string; image: string; price: number }; quantity: number }) => ({
                  id: String(item.product.id),
                  name: item.product.name,
                  quantity: item.quantity,
                  price: item.product.price,
                  image: item.product.image,
                }))
                const total = orderItems.reduce(
                  (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
                  0
                )
                await addOrder(orderItems, total)
              }
            }
          } catch {
            console.error("Error creating order after payment")
          }
          clearCart()
          setTimeout(() => router.push("/orders"), 3000)
        } else if (data.payment_status === "PENDING" || data.payment_status === "INPROGRESS") {
          if (polledCount < 20) {
            setPolledCount((c) => c + 1)
            setTimeout(checkStatus, 3000)
          } else {
            setStatus("pending")
          }
        } else {
          setStatus("failed")
        }
      } catch {
        if (polledCount < 20) {
          setPolledCount((c) => c + 1)
          setTimeout(checkStatus, 3000)
        } else {
          setStatus("failed")
        }
      }
    }

    checkStatus()
  }, [orderId, clearCart, addOrder, router, polledCount])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-20 h-20 rounded-full bg-blue-50 mx-auto flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Confirming Payment</h1>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </>
        )}

        {status === "confirmed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Payment Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your order has been placed successfully. Redirecting to your orders...
            </p>
            <Button
              onClick={() => router.push("/orders")}
              className="bg-navy hover:bg-navy/90 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-50 mx-auto flex items-center justify-center mb-6">
              <Loader2 className="h-10 w-10 text-yellow-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Payment Pending</h1>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. You will receive a confirmation shortly.
              Check your orders page for updates.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/shop")}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={() => router.push("/orders")}
                className="flex-1 bg-navy hover:bg-navy/90 text-white"
              >
                View Orders
              </Button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-6">
              <span className="text-3xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-navy mb-2">Payment Issue</h1>
            <p className="text-gray-600 mb-6">
              We could not confirm your payment. Please check your orders or contact support.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/shop")}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={() => router.push("/orders")}
                className="flex-1 bg-navy hover:bg-navy/90 text-white"
              >
                View Orders
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
