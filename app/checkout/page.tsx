"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { addOrder } = useOrders()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get order items from URL state or context
  const orderItems = JSON.parse(localStorage.getItem("pendingOrderItems") || "[]")
  const orderTotal = JSON.parse(localStorage.getItem("pendingOrderTotal") || "0")

  if (!orderItems.length) {
    router.push("/shop")
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const customerInfo = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
    }

    try {
      await addOrder(orderItems, orderTotal, customerInfo)
      // Clear pending order data
      localStorage.removeItem("pendingOrderItems")
      localStorage.removeItem("pendingOrderTotal")
      router.push("/orders")
    } catch (error) {
      console.error("Error placing order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            className="mb-8 border-navy/20 hover:bg-navy/5"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>

          <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-6">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={user?.user_metadata?.full_name || ""}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Shipping Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    required
                    className="mt-1"
                    placeholder="Enter your complete shipping address"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-navy/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-navy/70">Order Total</span>
                  <span className="text-xl font-bold text-navy">TZS {orderTotal.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-navy hover:bg-navy/90 text-white rounded-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
} 