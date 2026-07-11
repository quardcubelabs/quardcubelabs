import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import HeroSlider from "@/components/hero-slider"
import Services from "@/components/services"
import About from "@/components/about"
import Footer from "@/components/footer"
import Testimonials from "@/components/testimonials"
import Partners from "@/components/partners"

export const metadata: Metadata = {
  title: "QuardCubeLabs - Innovative IT Solutions",
  description: "QuardCubeLabs provides cutting-edge IT solutions including software development, web design, power solutions, security products, connectivity & networking, and standard IT products and services.",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />
      <HeroSlider />
      <Services />
      <About />
      <Testimonials />
      <Partners />
      <Footer />
    </main>
  )
}
