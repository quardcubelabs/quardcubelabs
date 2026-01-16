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
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
        background: white;
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
        
        /* Watermark using CSS */
        .invoice-container::after {
          content: "QUARDCUBELABS";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: 4rem;
          font-weight: bold;
          color: #1e3a8a;
          opacity: 0.05;
          z-index: -1;
          pointer-events: none;
          white-space: nowrap;
          font-family: Arial, sans-serif;
        }
        
        .invoice-container::before {
          content: "INNOVATIVE IT SOLUTIONS";
          position: fixed;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: 1rem;
          font-weight: 600;
          color: #1e3a8a;
          opacity: 0.05;
          z-index: -1;
          pointer-events: none;
          white-space: nowrap;
          font-family: Arial, sans-serif;
        }
        
        .content-layer {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.95);
          padding: 4px;
          border-radius: 4px;
        }
        
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
        {/* Screen-only watermark - for preview */}
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10 print:hidden">
          <div className="transform rotate-45 opacity-10 select-none">
            <div className="text-6xl font-bold text-navy whitespace-nowrap">
              QUARDCUBELABS
            </div>
            <div className="text-xl font-semibold text-navy text-center mt-2">
              INNOVATIVE IT SOLUTIONS
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="content-layer flex justify-between items-start mb-8 border-b border-navy/20 pb-8 relative z-20">
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
              <h1 className="text-2xl font-bold text-navy">QuardCubeLabs</h1>
              <p className="text-navy/70">Your trusted partner in digital solutions</p>
              <p className="text-sm text-navy/60">Email: info@quardcubelabs.com</p>
              <p className="text-sm text-navy/60">Website: www.quardcubelabs.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-navy mb-2">INVOICE</h2>
            <p className="text-navy/70">Invoice #{invoice.invoice_number}</p>
            <p className="text-navy/70">Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
            <p className="text-navy/70">Status: <span className="capitalize font-semibold">{invoice.status}</span></p>
            {invoice.due_date && (
              <p className="text-navy/70">Due Date: {new Date(invoice.due_date).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        {/* From and To Section */}
        <div className="content-layer grid grid-cols-2 gap-8 mb-8 relative z-20">
          <div>
            <h3 className="font-semibold text-navy mb-4">From:</h3>
            <div className="space-y-1 text-navy/70">
              <p className="font-semibold">QuardCubeLabs</p>
              <p>123 Kigamboni</p>
              <p>Dar es Salaam, TC 12345</p>
              <p>Tanzania</p>
              <p>Phone: +255 652540496</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-navy mb-4">Bill To:</h3>
            <div className="space-y-1 text-navy/70">
              <p className="font-semibold">{invoice.customer_name || "Customer"}</p>
              <p>{invoice.customer_email}</p>
              {invoice.customer_phone && (
                <p>Phone: {invoice.customer_phone}</p>
              )}
              {invoice.customer_address && (
                <p>{invoice.customer_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="content-layer mb-8 relative z-20">
          <table className="w-full bg-white">
            <thead>
              <tr className="border-b-2 border-navy/20">
                <th className="text-left py-3 px-4 bg-white">Item</th>
                <th className="text-center py-3 px-4 bg-white">Qty</th>
                <th className="text-right py-3 px-4 bg-white">Unit Price</th>
                <th className="text-right py-3 px-4 bg-white">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-navy/10">
                  <td className="py-3 px-4 bg-white">{item.name}</td>
                  <td className="text-center py-3 px-4 bg-white">{item.quantity}</td>
                  <td className="text-right py-3 px-4 bg-white">TZS {item.price.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 bg-white">TZS {(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="content-layer mb-8 relative z-20">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Subtotal:</span>
                <span className="text-navy">TZS {invoice.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Tax:</span>
                <span className="text-navy">TZS 0.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-navy/20 font-bold text-lg">
                <span className="text-navy">TOTAL DUE:</span>
                <span className="text-navy">TZS {invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {invoice.notes && (
          <div className="content-layer mb-8 relative z-20">
            <h3 className="font-semibold text-navy mb-2">Notes:</h3>
            <p className="text-navy/70">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Information and Terms */}
        <div className="content-layer grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative z-20">
          <div>
            <h3 className="font-semibold text-navy mb-3">Payment Information:</h3>
            <div className="space-y-1 text-navy/70">
              <p>Bank: National Bank of Commerce</p>
              <p>Account Name: QuardCubeLabs Ltd</p>
              <p>Account Number: 0123456789</p>
              <p>Swift Code: NBCTTZTZ</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-navy mb-3">Terms & Conditions:</h3>
            <div className="space-y-1 text-sm text-navy/70">
              <p>1. Payment is due within 30 days of invoice date.</p>
              <p>2. Late payments may incur additional charges.</p>
              <p>3. All payments should be made in Tanzanian Shillings (TZS).</p>
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
