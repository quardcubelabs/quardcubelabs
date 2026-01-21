"use client"

import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Image from "next/image"
import type { Service } from "@/types/database"

interface QuoteProps {
  service: Service
}

interface QuoteItem {
  description: string
  price: string
  note?: string
}

export default function ServiceQuote({ service }: QuoteProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handleDownload = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Quote-${service.title}-${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .quote-watermark {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) rotate(-45deg) !important;
          width: 300px !important;
          height: 300px !important;
          opacity: 0.08 !important;
          z-index: -1 !important;
          pointer-events: none !important;
          user-select: none !important;
        }
        .quote-content {
          position: relative !important;
          z-index: 1 !important;
        }
        .quote-content::before {
          content: '' !important;
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          width: 250px !important;
          height: 250px !important;
          background-image: url('/turquoise.png') !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          transform: translate(-50%, -50%) rotate(-45deg) !important;
          opacity: 0.06 !important;
          z-index: -1 !important;
          pointer-events: none !important;
          user-select: none !important;
        }
      }
    `,
  })

  // Generate quote number
  const quoteNumber = `QT-${Date.now().toString().slice(-6)}`
  const quoteDate = new Date()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

  // Parse price range for quote items
  const generateQuoteItems = (): QuoteItem[] => {
    const items: QuoteItem[] = []
    
    if (service.title.toLowerCase().includes('web')) {
      items.push(
        { description: "Website Design & Development", price: service.price_range || "Starting from $2,500" },
        { description: "Responsive Mobile Optimization", price: "Included" },
        { description: "Basic SEO Setup", price: "Included" },
        { description: "Content Management System", price: "Included" },
        { description: "3 Months Free Support", price: "Included" }
      )
    } else if (service.title.toLowerCase().includes('mobile')) {
      items.push(
        { description: "Mobile App Development", price: service.price_range || "Starting from $5,000" },
        { description: "iOS & Android Platform", price: "Included" },
        { description: "App Store Deployment", price: "Included" },
        { description: "User Interface Design", price: "Included" },
        { description: "6 Months Support & Updates", price: "Included" }
      )
    } else if (service.title.toLowerCase().includes('e-commerce')) {
      items.push(
        { description: "E-commerce Platform Setup", price: service.price_range || "Starting from $3,500" },
        { description: "Payment Gateway Integration", price: "Included" },
        { description: "Product Catalog Management", price: "Included" },
        { description: "Order Management System", price: "Included" },
        { description: "Security & SSL Setup", price: "Included" }
      )
    } else if (service.title.toLowerCase().includes('ui/ux') || service.title.toLowerCase().includes('design')) {
      items.push(
        { description: "UI/UX Design Service", price: service.price_range || "Starting from $1,500" },
        { description: "User Research & Analysis", price: "Included" },
        { description: "Wireframes & Prototypes", price: "Included" },
        { description: "Design System Creation", price: "Included" },
        { description: "3 Revision Rounds", price: "Included" }
      )
    } else {
      // Generic service
      items.push(
        { description: service.title, price: service.price_range || "Contact for pricing" },
        { description: "Project Planning & Analysis", price: "Included" },
        { description: "Implementation & Testing", price: "Included" },
        { description: "Documentation & Training", price: "Included" },
        { description: "Post-launch Support", price: "Included" }
      )
    }

    return items
  }

  const quoteItems = generateQuoteItems()

  return (
    <div className="w-full">
      <Button onClick={handleDownload} className="bg-navy hover:bg-navy/90 text-white rounded-full">
        <Download className="h-4 w-4 mr-2" />
        Get Quote
      </Button>

      {/* Hidden printable content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={componentRef} className="bg-white p-8 rounded-lg shadow-lg quote-content">
          {/* Watermark elements */}
          <div className="quote-watermark">
            <Image
              src="/turquoise.png"
              alt="QUARDCUBELABS Watermark"
              fill
              className="object-contain"
            />
          </div>
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b border-navy/20 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 relative">
                <Image
                  src="/turquoise.png"
                  alt="QUARDCUBELABS"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy">QUARDCUBELABS</h1>
                <p className="text-navy/70">Innovative IT Solutions</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-navy mb-2">QUOTATION</h2>
              <p className="text-navy/70">#{quoteNumber}</p>
            </div>
          </div>

        {/* Company Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-navy mb-4">From:</h3>
            <div className="space-y-1 text-navy/70">
              <p className="font-semibold">QuardCubeLabs</p>
              <p>Dar es Salaam, Tanzania</p>
              <p>Email: info@quardcubelabs.com</p>
              <p>Phone: +255 XXX XXX XXX</p>
              <p>Website: www.quardcubelabs.com</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-navy mb-4">Quote Details:</h3>
            <div className="space-y-1 text-navy/70">
              <p>Quote Date: {quoteDate.toLocaleDateString()}</p>
              <p>Valid Until: {validUntil.toLocaleDateString()}</p>
              <p>Service: {service.title}</p>
              <p>Category: {service.category}</p>
            </div>
          </div>
        </div>

        {/* Service Description */}
        <div className="mb-8">
          <h3 className="font-semibold text-navy mb-4">Service Description:</h3>
          <div className="bg-navy/5 p-4 rounded-lg">
            <h4 className="font-semibold text-navy mb-2">{service.title}</h4>
            <p className="text-navy/70 mb-4">{service.description}</p>
            {service.features && service.features.length > 0 && (
              <div>
                <p className="font-semibold text-navy mb-2">Key Features:</p>
                <ul className="list-disc list-inside text-navy/70 space-y-1">
                  {service.features.slice(0, 5).map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quote Items Table */}
        <div className="mb-8">
          <h3 className="font-semibold text-navy mb-4">Quote Breakdown:</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-navy/20">
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-right py-3 px-4">Price</th>
              </tr>
            </thead>
            <tbody>
              {quoteItems.map((item, index) => (
                <tr key={index} className="border-b border-navy/10">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      {item.note && <p className="text-sm text-navy/60">{item.note}</p>}
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-medium">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8">
          <h3 className="font-semibold text-navy mb-4">Terms & Conditions:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-navy/70">
            <div>
              <h4 className="font-semibold text-navy mb-2">Payment Terms:</h4>
              <ul className="space-y-1">
                <li>• 50% deposit required to start project</li>
                <li>• Remaining 50% upon project completion</li>
                <li>• Payment via bank transfer or credit card</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-2">Project Timeline:</h4>
              <ul className="space-y-1">
                <li>• Timeline depends on project complexity</li>
                <li>• Detailed timeline provided after consultation</li>
                <li>• Regular progress updates included</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-2">Deliverables:</h4>
              <ul className="space-y-1">
                <li>• Source code and documentation</li>
                <li>• Training and handover session</li>
                <li>• Post-launch support included</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-navy mb-2">Warranty:</h4>
              <ul className="space-y-1">
                <li>• Bug fixes included for first 90 days</li>
                <li>• Ongoing maintenance available</li>
                <li>• Technical support provided</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-navy/5 p-6 rounded-lg mb-8">
          <h3 className="font-semibold text-navy mb-3">Next Steps:</h3>
          <ol className="list-decimal list-inside text-navy/70 space-y-2">
            <li>Review this quotation carefully</li>
            <li>Contact us to discuss your specific requirements</li>
            <li>Schedule a consultation call to finalize details</li>
            <li>Sign the project agreement and make initial payment</li>
            <li>Project kickoff and development begins</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="border-t border-navy/20 pt-8">
          <div className="text-center text-navy/70">
            <p className="font-semibold mb-2">Ready to get started?</p>
            <p className="mb-4">Contact us today to discuss your project requirements!</p>
            <div className="space-y-1">
              <p>Email: info@quardcubelabs.com | Phone: +255 XXX XXX XXX</p>
              <p>Visit: www.quardcubelabs.com</p>
            </div>
            <div className="mt-6 pt-4 border-t border-navy/10">
              <p className="text-sm">This quotation is valid for 30 days from the date of issue.</p>
              <p className="text-sm">Final pricing may vary based on specific requirements and project scope.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
