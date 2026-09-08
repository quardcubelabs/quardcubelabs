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
    documentTitle: " ",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 16mm 14mm 14mm 14mm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        html, body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000080 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
        .service-quote-container {
          width: 100% !important;
          max-width: 100% !important;
          min-height: calc(297mm - 30mm) !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          margin: 0 auto !important;
          background: transparent !important;
          position: relative !important;
        }
        .print-watermark {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }
        .print-watermark img {
          width: 350px !important;
          height: 350px !important;
          object-fit: contain !important;
          opacity: 0.18 !important;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      }
    `,
  })

  // Generate quote number and dates
  const quoteNumber = `QCL-QTE-${Date.now().toString().slice(-6)}`
  const quoteDate = new Date()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

  // Parse price range for quote items
  const generateQuoteItems = (): QuoteItem[] => {
    const items: QuoteItem[] = []
    
    if (service.title.toLowerCase().includes("web")) {
      items.push(
        { description: "Website Design & Development", price: service.price_range || "TZS 2,500,000" },
        { description: "Responsive Mobile Optimization", price: "Included" },
        { description: "Basic SEO & Performance Setup", price: "Included" },
        { description: "Content Management System (CMS)", price: "Included" },
        { description: "3 Months Dedicated Support", price: "Included" }
      )
    } else if (service.title.toLowerCase().includes("mobile")) {
      items.push(
        { description: "Mobile App Development", price: service.price_range || "TZS 5,000,000" },
        { description: "iOS & Android Cross-Platform", price: "Included" },
        { description: "App Store & Play Store Deployment", price: "Included" },
        { description: "Custom UI/UX Interface Design", price: "Included" },
        { description: "6 Months Support & Security Updates", price: "Included" }
      )
    } else if (service.title.toLowerCase().includes("e-commerce")) {
      items.push(
        { description: "E-commerce Platform Setup & Storefront", price: service.price_range || "TZS 3,500,000" },
        { description: "Payment Gateway Integration (Selcom, M-Pesa, Cards)", price: "Included" },
        { description: "Product Catalog & Inventory System", price: "Included" },
        { description: "Order Management & Automated Billing", price: "Included" },
        { description: "SSL Security Setup & Hardening", price: "Included" }
      )
    } else if (service.title.toLowerCase().includes("ui/ux") || service.title.toLowerCase().includes("design")) {
      items.push(
        { description: "UI/UX Product Design & Prototyping", price: service.price_range || "TZS 1,500,000" },
        { description: "User Research & Journey Architecture", price: "Included" },
        { description: "Interactive Wireframes & Prototypes", price: "Included" },
        { description: "Design System & Component Library", price: "Included" },
        { description: "3 Iterative Revision Rounds", price: "Included" }
      )
    } else {
      items.push(
        { description: service.title, price: service.price_range || "Custom Estimate" },
        { description: "Project Scope Planning & System Architecture", price: "Included" },
        { description: "System Implementation & Quality Assurance Testing", price: "Included" },
        { description: "Technical Documentation & Team Training", price: "Included" },
        { description: "Deployment & Post-launch Maintenance Support", price: "Included" }
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

      {/* Hidden printable content container */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: "210mm" }}>
        <div ref={componentRef} className="service-quote-container w-full font-sans text-navy bg-white relative">
          {/* Fixed Centered Watermark on every printed page */}
          <div className="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <Image
              src="/turquoise.png"
              alt="QuardCubeLabs Watermark"
              width={350}
              height={350}
              className="object-contain opacity-20"
              priority
              unoptimized
            />
          </div>

          <div className="relative z-20 flex flex-col justify-between flex-1 w-full h-full min-h-[calc(297mm-30mm)]">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-navy tracking-tight">QuardCubeLabs</h2>
                  <p className="text-[18px] text-navy/80 font-medium">Your trusted partner in digital solutions</p>
                  <p className="text-[18px] text-navy/80 font-medium mt-0.5">Email: info@quardcubelabs.co.tz</p>
                  <p className="text-[18px] text-navy/80 font-medium">Website: www.quardcubelabs.co.tz</p>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-black text-navy mb-1">QUOTATION</h1>
                  <p className="text-[18px] text-navy/80">
                    Quote #<span className="font-bold text-navy text-[18px]">{quoteNumber}</span>
                  </p>
                  <p className="text-[18px] text-navy/80">
                    Date: <span className="font-bold text-navy text-[18px]">{quoteDate.toLocaleDateString()}</span>
                  </p>
                  <p className="text-[18px] text-navy/80 mt-0.5">
                    Valid Until: <span className="font-bold text-navy text-[18px]">{validUntil.toLocaleDateString()}</span>
                  </p>
                  <p className="text-[18px] text-navy/80 mt-1.5">
                    Status: <span className="font-bold text-[18px] text-teal-600">Official Estimate</span>
                  </p>
                </div>
              </div>

              <hr className="border-navy/30 mb-6" />

              {/* From and To Section */}
              <div className="flex justify-between mb-6">
                <div className="w-1/2 pr-4">
                  <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">From:</h3>
                  <div className="space-y-1 text-[18px]">
                    <p className="text-[18px] text-navy font-bold">QuardCubeLabs</p>
                    <p className="text-[18px] text-navy/80">24 Ferry, Kigamboni</p>
                    <p className="text-[18px] text-navy/80">Dar es Salaam 17101</p>
                    <p className="text-[18px] text-navy/80">Tanzania</p>
                    <p className="text-[18px] text-navy/80 mt-1">Phone: +255 652 540 496</p>
                  </div>
                </div>
                <div className="w-1/2 pl-4 text-right">
                  <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">Service Scope:</h3>
                  <div className="space-y-1 text-[18px]">
                    <p className="text-[18px] text-navy font-bold">{service.title}</p>
                    <p className="text-[18px] text-navy/80">Category: {service.category}</p>
                    <p className="text-[18px] text-navy/80">Prepared for: Valued Client</p>
                    <p className="text-[18px] text-navy/80">Tanzania, United Republic of</p>
                  </div>
                </div>
              </div>

              {/* Quotation Breakdown Table */}
              <div className="mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-navy/60 bg-transparent">
                      <th className="text-left text-[18px] font-black text-navy py-3 px-2 uppercase tracking-wider">Item / Service Scope</th>
                      <th className="text-right text-[18px] font-black text-navy py-3 px-2 w-20 uppercase tracking-wider">Qty</th>
                      <th className="text-right text-[18px] font-black text-navy py-3 px-2 w-48 uppercase tracking-wider">Estimated Price</th>
                      <th className="text-right text-[18px] font-black text-navy py-3 px-2 w-48 uppercase tracking-wider">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, index) => (
                      <tr key={index} className="border-b border-navy/15">
                        <td className="text-[18px] text-navy/90 py-3 px-2 font-semibold">{item.description}</td>
                        <td className="text-right text-[18px] text-navy/90 py-3 px-2 w-20 font-bold">1</td>
                        <td className="text-right text-[18px] text-navy/90 py-3 px-2 w-48 font-bold whitespace-nowrap">
                          {item.price}
                        </td>
                        <td className="text-right text-[18px] text-navy py-3 px-2 w-48 font-black whitespace-nowrap">
                          {item.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Terms & Conditions and Totals */}
              <div className="avoid-break flex justify-between items-start pt-4 border-t border-navy/10">
                <div className="w-1/2 pr-6">
                  <h3 className="text-[18px] font-black text-navy mb-2.5 uppercase tracking-wider">Payment Information:</h3>
                  <p className="text-[18px] text-navy/80 mb-5 font-medium">Payment Method: Bank Transfer / Mobile Money / Office Pickup</p>
                  <h3 className="text-[18px] font-black text-navy mb-2.5 uppercase tracking-wider">Terms & Conditions:</h3>
                  <ol className="list-decimal list-inside text-[18px] text-navy/80 space-y-1.5 font-medium">
                    <li>This quotation is valid for 30 days from the date of issue.</li>
                    <li>A 50% advance deposit is required to initiate service delivery.</li>
                    <li>Final project pricing may vary based on custom technical requirements and scope.</li>
                    <li>All payments should be made through official QuardCubeLabs Company Limited channels.</li>
                  </ol>
                </div>
                <div className="w-1/2 pl-6 text-right">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[18px] text-navy/80 font-medium">
                      <span>Service Estimate:</span>
                      <span className="font-bold text-navy">{service.price_range || "TZS 2,500,000"}</span>
                    </div>
                    <div className="flex justify-between text-[18px] text-navy/80 font-medium">
                      <span>Estimated Shipping / Setup:</span>
                      <span className="font-bold text-green-600">TZS 0.00</span>
                    </div>
                    <div className="flex justify-between text-[18px] text-navy/80 font-medium border-b border-navy/20 pb-1.5">
                      <span>Estimated Tax / VAT:</span>
                      <span className="font-bold text-navy">Included</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-navy pt-1.5">
                      <span>TOTAL ESTIMATE:</span>
                      <span className="font-black">{service.price_range || "TZS 2,500,000"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="avoid-break mt-auto pt-6 text-center text-[18px] text-navy/70 border-t border-navy/20">
              <p className="text-[18px] text-navy/80">&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
              <p className="mt-1 text-[18px] font-bold text-navy">Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

