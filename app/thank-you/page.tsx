"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function ThankYouPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") || "Unknown"

  // Redirect to home if accessed directly without an order
  useEffect(() => {
    if (!searchParams.has("orderId")) {
      const timer = setTimeout(() => {
        router.push("/")
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [router, searchParams])

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Thank You for Your Order!</h1>
            <p className="text-base sm:text-lg text-navy/80 mb-4 sm:mb-6">
              Your order has been confirmed and will be shipped shortly.
            </p>
            <p className="text-navy/80 mb-8">
              Order ID: <span className="font-medium">{orderId}</span>
            </p>

            <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">What's Next?</h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You will receive an order confirmation email with details of your purchase.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Your items will be processed and shipped within 1-3 business days.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You will receive shipping confirmation and tracking information once your order ships.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>If you have any questions, please contact our customer support team.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                className="bg-navy hover:bg-navy/90 text-white rounded-full w-full sm:w-auto"
                onClick={() => router.push("/shop")}
              >
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                className="border-navy text-navy hover:bg-navy/10 rounded-full w-full sm:w-auto"
                onClick={() => router.push("/")}
              >
                Return to Home
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
