"use client"

import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import type { AdminInvoice } from "@/lib/invoice-actions"

interface AdminInvoicePreviewProps {
  invoice: AdminInvoice
}

export default function AdminInvoicePreview({ invoice }: AdminInvoicePreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: " ",
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          background: white;
        }
        
        .invoice-container {
          padding: 10mm 8mm !important;
        }
        
        /* Hide watermarks in print */
        .watermark,
        .print-watermark {
          display: none !important;
        }
        
        /* Ensure content appears above watermark */
        .content-layer {
          position: relative;
          z-index: 1;
          padding: 4px;
          border-radius: 4px;
        }
        
        /* Table styling for print */
        .content-layer table {
          background: white !important;
        }
        
        .content-layer th,
        .content-layer td {
          background: white !important;
        }
      }
    `,
  })

  return (
    <div className="w-full">
      <Button onClick={handlePrint} className="mb-4">
        <Printer className="h-4 w-4 mr-2" />
        Print Invoice
      </Button>

      <div ref={componentRef} className="invoice-container bg-white p-8 rounded-lg relative">
        {/* Screen-only watermark - for preview (faded logo) */}
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10 print:hidden">
          <div className="relative w-80 h-80 opacity-[0.08]">
            <Image
              src="/turquoise.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>



        {/* Header */}
        <div className="content-layer flex justify-between items-start mb-8 border-b border-navy/20 pb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 relative">
              <Image
                src="/turquoise.png"
                alt="QUARDCUBELABS"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">QuardCubeLabs</h1>
              <p className="text-cyan-600 text-sm">Your trusted partner in digital solutions</p>
              <p className="text-sm text-cyan-600">Email: info@quardcubelabs.com</p>
              <p className="text-sm text-cyan-600">Website: www.quardcubelabs.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-cyan-500 mb-2">INVOICE</h2>
            <p className="text-navy/70">Invoice #{invoice.invoice_number}</p>
            <p className="text-navy/70">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p className="text-navy/70">Order Status: <span className="capitalize font-semibold text-cyan-500">{invoice.status}</span></p>
          </div>
        </div>

        {/* From and To Section */}
        <div className="content-layer grid grid-cols-2 gap-8 mb-8 relative z-20">
          <div>
            <h3 className="font-semibold text-navy mb-4">From:</h3>
            <div className="space-y-1">
              <p className="font-semibold text-cyan-600">QuardCubeLabs</p>
              <p className="text-cyan-600">123 Kigamboni</p>
              <p className="text-cyan-600">Dar es Salaam, TC 12345</p>
              <p className="text-cyan-600">Tanzania</p>
              <p className="text-cyan-600">Phone: +255 652540496</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-navy mb-4">To:</h3>
            <div className="space-y-1">
              <p className="font-semibold text-cyan-600">{invoice.customer_name || "Customer"}</p>
              <p className="text-cyan-600">{invoice.customer_email}</p>
              {invoice.customer_phone && (
                <p className="text-cyan-600">Phone: {invoice.customer_phone}</p>
              )}
              {invoice.customer_address && (
                <p className="text-cyan-600">{invoice.customer_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="content-layer mb-8 relative z-20">
          <table className="w-full bg-white">
            <thead>
              <tr className="bg-cyan-500 text-white">
                <th className="text-left py-3 px-4">Item</th>
                <th className="text-center py-3 px-4">Qty</th>
                <th className="text-right py-3 px-4">Unit Price</th>
                <th className="text-right py-3 px-4">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-navy/10">
                  <td className="py-3 px-4 bg-white">{item.name}</td>
                  <td className="text-center py-3 px-4 bg-white">{item.quantity}</td>
                  <td className="text-right py-3 px-4 bg-white">TZS {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right py-3 px-4 bg-white">TZS {(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Information and Totals Section */}
        <div className="content-layer grid grid-cols-2 gap-8 mb-8 relative z-20">
          {/* Payment Information */}
          <div>
            <h3 className="font-semibold text-navy mb-3">Payment Information:</h3>
            <div className="space-y-1 text-navy/70">
              <p>Payment Method: Office Pickup</p>
            </div>
            
            <h3 className="font-semibold text-navy mt-6 mb-3">Terms & Conditions:</h3>
            <div className="space-y-1 text-sm text-navy/70">
              <p>1. Goods are shipped upon confirmation of 100% payment.</p>
              <p>2. Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</p>
              <p>3. All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</p>
            </div>
          </div>
          
          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Subtotal:</span>
                <span className="text-cyan-600">TZS {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Shipping Cost:</span>
                <span className="text-cyan-600">TZS 0.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Tax:</span>
                <span className="text-cyan-600">TZS 0.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-navy/20 font-bold text-lg">
                <span className="text-navy">TOTAL DUE:</span>
                <span className="text-cyan-600">TZS {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="content-layer border-t border-navy/20 pt-6 relative z-20">
          <div className="text-center text-navy/70">
            <p className="text-navy font-semibold">© {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
            <p className="mt-1">Thank you for your business!</p>
          </div>
        </div>


      </div>
    </div>
  )
}
