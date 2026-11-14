import type { Metadata } from "next"
import HeroSlider from "@/components/hero-slider"
import Services from "@/components/services"
import FeaturedProducts from "@/components/featured-products"
import Footer from "@/components/footer"
import Testimonials from "@/components/testimonials"
import Partners from "@/components/partners"
import { getFeaturedProducts } from "@/lib/product-actions"

export const metadata: Metadata = {
  title: "QuardCubeLabs - Innovative IT Solutions",
  description: "QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.",
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts(8)

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
