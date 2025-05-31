import { Suspense } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ShopContent from "@/components/shop/shop-content"
import Loading from "@/components/loading"
import { getCategories, getProducts } from "@/lib/product-actions"

export default async function ShopPage() {
  // Fetch data from Supabase
  const categoriesPromise = getCategories()
  const productsPromise = getProducts()

  // Wait for both promises to resolve
  const [categories, products] = await Promise.all([categoriesPromise, productsPromise])

  // Extract category names
  const categoryNames = categories.map((category) => category.name)

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              Shop Our <span className="gradient-text">Products</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Browse our selection of high-quality technology products designed for businesses of all sizes
            </p>
          </div>

          <Suspense fallback={<Loading />}>
            <ShopContent initialProducts={products} categories={categoryNames} />
          </Suspense>
        </div>
      </section>

      <Footer />
    </main>
  )
}
