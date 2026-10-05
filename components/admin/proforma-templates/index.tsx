"use client"

import React from "react"
import Image from "next/image"
import { AdminProformaInvoice } from "@/lib/proforma-actions"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"

export interface ProformaTemplateProps {
  proforma: AdminProformaInvoice
  templateId?: string
  printRef?: React.RefObject<HTMLDivElement | null>
}

// Single Unified Proforma Invoice Template (matches the official Invoice document standard)
export function ProformaInvoiceDocument({ proforma, printRef }: { proforma: AdminProformaInvoice; printRef?: React.RefObject<HTMLDivElement | null> }) {
  const subtotal = proforma.subtotal || proforma.total
  const taxAmount = proforma.tax_amount || 0
  const discount = proforma.discount || 0
  const qrVerificationValue = proforma.verification_url || `https://quardcubelabs.co.tz/verify/${proforma.verification_token || proforma.proforma_number}`

  const formattedDate = proforma.created_at ? new Date(proforma.created_at).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }) : "N/A"

  const formattedValidUntil = proforma.valid_until ? new Date(proforma.valid_until).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }) : "30 Days from Issue"

  return (
    <div
      ref={printRef}
      className="bg-white text-navy p-8 sm:p-10 rounded-2xl shadow-xl border border-navy/20 font-sans max-w-4xl w-full mx-auto min-h-[950px] flex flex-col justify-between relative overflow-hidden print:p-0 print:border-none print:shadow-none print:rounded-none"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
        <Image
          src="/turquoise.png"
          alt="QuardCube Watermark"
          width={360}
          height={360}
          className="object-contain"
          priority
        />
      </div>

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start pb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">
              QuardCubeLabs
            </h1>
            <p className="text-xs sm:text-sm text-navy/80 font-semibold mt-0.5">
              Your trusted partner in digital solutions
            </p>
            <p className="text-xs text-navy/70 font-medium mt-1">
              Email: info@quardcubelabs.co.tz
            </p>
            <p className="text-xs text-navy/70 font-medium">
              Website: www.quardcubelabs.co.tz
            </p>
          </div>

          <div className="text-left sm:text-right">
            <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight mb-1">
              PROFORMA INVOICE
            </h2>
            <p className="text-xs sm:text-sm text-navy/80 font-medium">
              Proforma #<span className="font-bold text-navy font-mono text-sm sm:text-base">#{proforma.proforma_number}</span>
            </p>
            <p className="text-xs sm:text-sm text-navy/80 font-medium">
              Date: <span className="font-bold text-navy">{formattedDate}</span>
            </p>
            <p className="text-xs sm:text-sm text-navy/80 font-medium">
              Valid Until: <span className="font-bold text-navy">{formattedValidUntil}</span>
            </p>
            <div className="mt-1.5 inline-block">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-teal text-navy">
                {proforma.status}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t-2 border-navy/40 mb-6" />

        {/* Addresses Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 text-xs sm:text-sm">
          <div className="w-full sm:w-1/2">
            <h3 className="font-black text-navy uppercase tracking-wider mb-1.5 text-xs">
              From:
            </h3>
            <p className="font-bold text-navy text-sm sm:text-base">QuardCubeLabs Company Limited</p>
            <p className="text-navy/80">24 Ferry, Kigamboni</p>
            <p className="text-navy/80">Dar es Salaam 17101</p>
            <p className="text-navy/80">Tanzania</p>
            <p className="text-navy/80 font-semibold mt-1">Phone: +255 652 540 496</p>
          </div>

          <div className="w-full sm:w-1/2 sm:text-right">
            <h3 className="font-black text-navy uppercase tracking-wider mb-1.5 text-xs">
              To / Client:
            </h3>
            <p className="font-bold text-navy text-sm sm:text-base">
              {proforma.customer_name || "Valued Client"}
            </p>
            <p className="text-navy/80">{proforma.customer_email || "No email on record"}</p>
            {proforma.customer_phone && (
              <p className="text-navy/80">Phone: {proforma.customer_phone}</p>
            )}
            <p className="text-navy/80">{proforma.customer_address || "Tanzania, United Republic of"}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8 overflow-hidden rounded-xl border border-navy/20">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-navy text-white">
                <th className="py-3 px-4 font-black uppercase tracking-wider text-left">Item Description</th>
                <th className="py-3 px-3 font-black uppercase tracking-wider text-center w-20">Qty</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider text-right w-36">Unit Price</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider text-right w-36">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/15">
              {proforma.items.map((item, idx) => {
                const itemTotal = (item.quantity || 1) * (item.price || 0)
                return (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-teal/5"}>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-navy">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-navy/70 mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-navy">{item.quantity}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-navy/90 whitespace-nowrap">
                      TZS {Number(item.price).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-navy whitespace-nowrap">
                      TZS {itemTotal.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Terms & Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-navy/20 text-xs sm:text-sm">
          {/* Left: Terms & Instructions */}
          <div className="w-full sm:w-1/2 space-y-4">
            <div>
              <h4 className="font-black uppercase tracking-wider text-xs text-navy mb-1">
                Payment Information:
              </h4>
              <p className="text-navy/80 font-medium">
                {proforma.payment_terms || "Bank Transfer / Mobile Money (M-Pesa) / Office Settlement"}
              </p>
            </div>

            <div>
              <h4 className="font-black uppercase tracking-wider text-xs text-navy mb-1">
                Terms & Conditions:
              </h4>
              <ol className="list-decimal list-inside text-navy/80 space-y-1 font-medium text-xs leading-relaxed">
                <li>This is an official Proforma Invoice quotation and commercial estimate.</li>
                <li>Goods and official tax invoices are processed upon confirmation of payment.</li>
                <li>Scan the digital QR code below for instant online authenticity verification.</li>
                {proforma.notes && (
                  <li className="mt-1 font-semibold text-navy">
                    Note: {proforma.notes}
                  </li>
                )}
              </ol>
            </div>

            {/* Stamp & Seal in Left Column */}
            <div className="pt-2">
              <QuardCubeStamp
                date={proforma.created_at}
                receiptNumber={proforma.proforma_number}
                title="QUARDCUBE LABS LIMITED"
                status="OFFICIAL ESTIMATE"
                color="teal"
              />
            </div>
          </div>

          {/* Right: Totals Breakdown & Verification QR */}
          <div className="w-full sm:w-64 sm:ml-auto space-y-2">
            <div className="flex justify-between text-navy/80 py-1 font-medium border-b border-navy/10">
              <span>Subtotal:</span>
              <span className="font-bold text-navy">TZS {Number(subtotal).toLocaleString()}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-green-700 py-1 font-semibold border-b border-navy/10">
                <span>Discount:</span>
                <span>-TZS {Number(discount).toLocaleString()}</span>
              </div>
            )}

            {taxAmount > 0 ? (
              <div className="flex justify-between text-navy/80 py-1 font-medium border-b border-navy/10">
                <span>Tax / VAT ({proforma.tax_rate}%):</span>
                <span className="font-bold text-navy">TZS {Number(taxAmount).toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex justify-between text-navy/80 py-1 font-medium border-b border-navy/10">
                <span>Tax / VAT:</span>
                <span className="font-bold text-navy">TZS 0.00</span>
              </div>
            )}

            <div className="flex justify-between text-base sm:text-lg font-black text-navy pt-2 border-t-2 border-navy/40">
              <span>TOTAL DUE:</span>
              <span className="text-navy">TZS {Number(proforma.total).toLocaleString()}</span>
            </div>

            {/* Verification QR Code */}
            <div className="pt-4 flex flex-col items-end">
              <QuardCubeQRCode
                value={qrVerificationValue}
                size={96}
                darkColor="#000080"
                label="SCAN TO VERIFY PROFORMA"
              />
              {proforma.verification_token && (
                <p className="font-mono text-[9px] text-navy/60 mt-1 text-right">
                  ID: {proforma.verification_token.slice(0, 14)}...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 text-center text-xs text-navy/70 border-t border-navy/20 relative z-10">
        <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
        <p className="mt-0.5 font-bold text-navy">Thank you for your business inquiries!</p>
      </div>
    </div>
  )
}

// Default export renderer
export default function ProformaTemplateRenderer({ proforma, printRef }: ProformaTemplateProps) {
  return (
    <div className="w-full flex justify-center">
      <ProformaInvoiceDocument proforma={proforma} printRef={printRef} />
    </div>
  )
}
