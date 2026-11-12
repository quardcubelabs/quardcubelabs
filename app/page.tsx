import type { Metadata } from "next"
import HeroSlider from "@/components/hero-slider"
import Services from "@/components/services"
import FeaturedProducts from "@/components/featured-products"
import Footer from "@/components/footer"
import Testimonials from "@/components/testimonials"
import Partners from "@/components/partners"
import { getProducts } from "@/lib/product-actions"

export const metadata: Metadata = {
  title: "QuardCubeLabs - Innovative IT Solutions",
  description: "QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.",
}

export default async function Home() {
  const allProducts = await getProducts()
  const featuredProducts = [...allProducts]
    .sort((a, b) => {
      const aInStock = a.stock > 0 ? 1 : 0
      const bInStock = b.stock > 0 ? 1 : 0
      if (bInStock !== aInStock) return bInStock - aInStock
      return (b.rating || 0) - (a.rating || 0)
    })
    .slice(0, 8)

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10"></div>
      <HeroSlider />
      <Services />
      <FeaturedProducts products={featuredProducts} />
      <Testimonials />
      <Partners />
      <Footer />
    </main>
  )
}
