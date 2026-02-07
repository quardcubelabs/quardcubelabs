"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Image from "next/image"

export default function LogoPage() {
  const downloadLogo = async () => {
    try {
      const response = await fetch('/turquoise.png')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "quardcubelabs-logo.png"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading logo:", error)
    }
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              QuardCubeLabs <span className="gradient-text">Logo</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              Download our logo in SVG format for high-quality usage in any size
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-navy/20">
              <h3 className="text-xl font-bold text-navy">Download Company Logo</h3>
              
              {/* Logo Preview */}
              <div className="relative w-48 h-48 bg-white p-4 rounded-lg shadow-sm">
                <Image
                  src="/turquoise.png"
                  alt="QuardCubeLabs Logo"
                  fill
                  className="object-contain"
                />
              </div>

              <Button onClick={downloadLogo} className="bg-navy hover:bg-navy/90 text-white">
                <Download className="h-4 w-4 mr-2" />
                Download PNG Logo
              </Button>
            </div>

            <div className="mt-12 p-6 bg-white/50 rounded-2xl border-2 border-navy/20">
              <h2 className="text-xl font-bold text-navy mb-4">Logo Usage Guidelines</h2>

              <div className="space-y-4 text-navy/80">
                <p>When using the QuardCubeLabs logo, please adhere to the following guidelines:</p>

                <ul className="list-disc pl-5 space-y-2">
                  <li>Maintain the original proportions of the logo</li>
                  <li>Do not alter the colors unless specifically authorized</li>
                  <li>Ensure adequate spacing around the logo</li>
                  <li>Do not place the logo on busy backgrounds that reduce visibility</li>
                  <li>Do not add effects such as shadows, outlines, or glows to the logo</li>
                </ul>

                <p>
                  For any questions regarding logo usage or to request special permissions, please contact our brand
                  team at <span className="text-brand-red">brand@quardcubelabs.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
