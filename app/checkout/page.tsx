import { Suspense } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import CheckoutContent from "@/components/checkout/checkout-content"
import Loading from "@/components/loading"

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              <span className="gradient-text">Checkout</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-2xl mx-auto">
              Review your order and complete your purchase
            </p>
          </div>

          <Suspense fallback={<Loading />}>
            <CheckoutContent />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  )
}