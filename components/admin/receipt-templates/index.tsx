"use client"

import React from "react"
import Image from "next/image"
import { AdminReceipt, ReceiptTemplateId } from "@/lib/receipt-actions"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"

export interface ReceiptTemplateProps {
  receipt: AdminReceipt
  templateId?: ReceiptTemplateId
  printRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Format date in the exact style of the reference receipt:
 * e.g. "Fri 25/09/2026 11:25AM"
 */
function formatReceiptDate(dateString?: string | Date): string {
  try {
    const d = dateString ? new Date(dateString) : new Date()
    if (isNaN(d.getTime())) return new Date().toLocaleDateString()

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayName = days[d.getDay()]
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // 0 should be 12

    return `${dayName} ${day}/${month}/${year} ${hours}:${minutes}${ampm}`
  } catch {
    return new Date().toLocaleString()
  }
}

/**
 * Format receipt number cleanly:
 * If it has a prefix like QCL-REC-2026-0213, display RCT-0213 or keep original.
 */
function formatReceiptNumber(numStr?: string): string {
  if (!numStr) return "RCT-0213"
  if (numStr.startsWith("QCL-REC-")) {
    const parts = numStr.split("-")
    const last = parts[parts.length - 1]
    return `RCT-${last}`
  }
  return numStr
}

/**
 * Quardcubelabs Official Thermal Receipt Template
 * Matches the exact layout, double-bordered box with company logo + name,
 * clean monospace formatting, dashed dividers, item breakdown, total,
 * metadata, Asante kwa kununua message, verified QR Code, and round
 * computerized official corporate stamp.
 */
export function QLabsThermalReceipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue =
    receipt.verification_url ||
    `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`

  const formattedDateTime = formatReceiptDate(receipt.payment_date || receipt.created_at)
  const displayReceiptNumber = formatReceiptNumber(receipt.receipt_number)

  // Verification display domain
  let verificationDomain = "invoza.co.tz"
  try {
    if (receipt.verification_url) {
      const u = new URL(receipt.verification_url)
      verificationDomain = u.hostname
    }
  } catch {
    verificationDomain = "invoza.co.tz"
  }

  // Format reference number
  const referenceCode =
    receipt.transaction_ref ||
    (receipt.verification_token
      ? receipt.verification_token.slice(0, 10).toUpperCase()
      : `SJ${Math.random().toString(36).substring(2, 8).toUpperCase()}M`)

  return (
    <div className="relative font-mono text-slate-900 bg-white shadow-2xl mx-auto w-full max-w-[370px] select-none text-xs border border-slate-200">
      {/* Sawtooth Top Torn Paper Edge */}
      <div className="w-full h-3 overflow-hidden bg-slate-200/50 leading-none">
        <svg
          className="w-full h-3 text-white fill-current"
          viewBox="0 0 400 12"
          preserveAspectRatio="none"
        >
          <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 L370,0 L380,12 L390,0 L400,12 Z" />
        </svg>
      </div>

      <div className="px-6 py-6 sm:px-7 sm:py-7 relative">
        {/* Floating Computerized Round Corporate Stamp (Kept exactly as requested) */}
        <div className="absolute right-4 top-40 pointer-events-none z-20 opacity-80 mix-blend-multiply transform -rotate-12 select-none">
          <QuardCubeStamp
            date={receipt.payment_date || receipt.created_at}
            receiptNumber={receipt.receipt_number}
            color="teal"
            variant="circular"
            title="QUARDCUBELABS LIMITED"
            status={receipt.status === "voided" ? "VOIDED" : "PAID & VERIFIED"}
          />
        </div>

        {/* 1. TOP CONTACT HEADER */}
        <div className="text-center space-y-0.5 text-[11px] text-slate-700 tracking-wider">
          <p className="font-semibold uppercase">KIGAMBONI, DAR ES SALAAM</p>
          <p className="font-semibold">+255623893383</p>
        </div>

        {/* 2. DOUBLE-BORDER COMPANY LOGO + NAME BOX */}
        <div className="my-4 mx-auto w-fit">
          <div className="border border-slate-950 p-[2.5px] rounded-xs">
            <div className="border border-slate-950 px-4 py-1.5 flex items-center justify-center gap-2.5">
              <div className="relative w-6 h-6 shrink-0">
                <Image
                  src="/turquoise.png"
                  alt="Quardcubelabs Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg sm:text-[21px] font-black tracking-wide text-slate-950 font-mono uppercase">
                Quardcubelabs
              </h1>
            </div>
          </div>
        </div>

        {/* 3. DATE & RECEIPT NUMBER */}
        <div className="text-center space-y-1 text-xs text-slate-800 font-medium">
          <p>{formattedDateTime}</p>
          <p className="tracking-wide">
            RECEIPT No. <span className="font-bold">{displayReceiptNumber}</span>
          </p>
          {receipt.order_number && (
            <p className="text-[11px] text-slate-600 font-mono tracking-wide">
              ORDER Ref: <span className="font-semibold text-slate-900">{receipt.order_number}</span>
            </p>
          )}
        </div>

        {/* 4. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-3.5 w-full" />

        {/* 5. CUSTOMER ROW */}
        <div className="flex justify-between items-baseline text-xs mb-3">
          <span className="text-slate-700">Customer:</span>
          <span className="font-bold text-slate-950 text-right truncate max-w-[200px]">
            {receipt.customer_name || "Valued Customer"}
          </span>
        </div>

        {/* 6. ITEMIZED PRODUCT / SERVICE ROWS */}
        <div className="space-y-2.5 my-3 text-xs">
          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((it, idx) => {
              const qty = Number(it.quantity || 1)
              const price = Number(it.price || 0)
              const lineTotal = qty * price
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-slate-950 truncate max-w-[210px]">
                      {it.name} {qty > 1 ? `x ${qty}` : ""}
                    </span>
                    <span className="font-bold text-slate-950 shrink-0">
                      {lineTotal.toLocaleString()}
                    </span>
                  </div>
                  {qty > 1 && (
                    <div className="text-[10.5px] text-slate-500">
                      {qty} @ {price.toLocaleString()}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-slate-950">
                  {receipt.notes || "Professional IT & Digital Settlement"}
                </span>
                <span className="font-bold text-slate-950">
                  {receipt.amount_paid.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 7. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-3.5 w-full" />

        {/* 8. TOTAL ROW */}
        <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-950 my-2.5">
          <span className="tracking-wide">TOTAL:</span>
          <span className="tracking-wide">TZS {receipt.amount_paid.toLocaleString()}</span>
        </div>

        {/* 9. PAYMENT METADATA */}
        <div className="space-y-1.5 my-3 text-xs text-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-700">Payment:</span>
            <span className="font-medium text-slate-950">
              {receipt.payment_method || "Mobile Money"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-700">Reference:</span>
            <span className="font-bold text-slate-950 font-mono">{referenceCode}</span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span className="font-bold text-slate-900">Status:</span>
            <span className="font-black text-slate-950 uppercase tracking-wide">
              {receipt.status === "voided"
                ? "VOIDED"
                : receipt.status === "refunded"
                ? "REFUNDED"
                : "PAID"}
            </span>
          </div>
        </div>

        {/* 10. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-3.5 w-full" />

        {/* 11. THANK YOU MESSAGE */}
        <div className="text-center my-3">
          <p className="text-xs font-semibold text-slate-800 tracking-wide">
            Asante kwa kununua!
          </p>
        </div>

        {/* 12. CENTERED VERIFICATION QR CODE */}
        <div className="flex justify-center my-3.5">
          <div className="p-1 bg-white inline-block">
            <QuardCubeQRCode
              value={qrVerificationValue}
              size={120}
              includeLabel={false}
              centerLogo={false}
            />
          </div>
        </div>

        {/* 13. SCAN VERIFICATION FOOTER TEXT */}
        <div className="text-center mb-1">
          <p className="text-[10px] text-slate-500 font-mono tracking-tight">
            Scan to verify this receipt - {verificationDomain}
          </p>
        </div>
      </div>

      {/* Sawtooth Bottom Torn Paper Edge */}
      <div className="w-full h-3 overflow-hidden bg-slate-200/50 leading-none">
        <svg
          className="w-full h-3 text-white fill-current rotate-180"
          viewBox="0 0 400 12"
          preserveAspectRatio="none"
        >
          <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 L370,0 L380,12 L390,0 L400,12 Z" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Universal Master Receipt Renderer
 * Renders the official QLABS thermal receipt template for all receipts.
 */
export default function ReceiptTemplateRenderer({
  receipt,
  printRef
}: ReceiptTemplateProps) {
  return (
    <div ref={printRef} className="w-full flex justify-center py-2">
      <QLabsThermalReceipt receipt={receipt} />
    </div>
  )
}
