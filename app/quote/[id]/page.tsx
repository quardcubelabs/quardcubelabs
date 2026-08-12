import { Suspense } from "react"
import Footer from "@/components/footer"
import QuoteContent from "@/components/quote/quote-content"
import Loading from "@/components/loading"
import { getProductById } from "@/lib/product-actions"
import { notFound } from "next/navigation"

interface QuotePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { id } = await params
  const productId = parseInt(id)
  
  if (isNaN(productId)) {
    notFound()
  }

  const product = await getProductById(productId)
  
  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Get a <span className="gradient-text">Quote</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-2xl mx-auto">
              Request a detailed quotation for {product.name}
            </p>
          </div>

          <Suspense fallback={<Loading />}>
            <QuoteContent product={product} />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  )
}