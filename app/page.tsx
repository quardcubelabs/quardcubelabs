import Navbar from "@/components/navbar"
import HeroSlider from "@/components/hero-slider"
import Services from "@/components/services"
import About from "@/components/about"
import Projects from "@/components/projects"
import Footer from "@/components/footer"
import Testimonials from "@/components/testimonials"
import Partners from "@/components/partners"

export default function Home() {
  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />
      <HeroSlider />
      <Services />
      <About />
      <Projects />
      <Testimonials />
      <Partners />
      <Footer />
    </main>
  )
}
