import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import DownloadableLogo from "@/components/downloadable-logo"

export default function LogoPage() {
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
            <DownloadableLogo />

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
