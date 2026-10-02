"use client"

import React from "react"
import Image from "next/image"
import { AdminReceipt, ReceiptTemplateId } from "@/lib/receipt-actions"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"

export interface ReceiptTemplateProps {
  receipt: AdminReceipt
  templateId?: ReceiptTemplateId | string
  printRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Format date in the exact style of reference receipts:
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
    hours = hours ? hours : 12

    return `${dayName} ${day}/${month}/${year} ${hours}:${minutes}${ampm}`
  } catch {
    return new Date().toLocaleString()
  }
}

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
 * 1. A5 VOUCHER / RECEIPT FORMAT
 * Standard A5 Dimensions (approx 148mm × 210mm)
 * Elegant corporate layout with dual headers, itemized table, total ledger,
 * computerized stamp, and QR verification code.
 */
export function QLabsA5Receipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue =
    receipt.verification_url ||
    `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`

  const formattedDateTime = formatReceiptDate(receipt.payment_date || receipt.created_at)
  const displayReceiptNumber = formatReceiptNumber(receipt.receipt_number)

  let verificationDomain = "invoza.co.tz"
  try {
    if (receipt.verification_url) {
      const u = new URL(receipt.verification_url)
      verificationDomain = u.hostname
    }
  } catch {
    verificationDomain = "invoza.co.tz"
  }

  const referenceCode =
    receipt.transaction_ref ||
    (receipt.verification_token
      ? receipt.verification_token.slice(0, 10).toUpperCase()
      : `SJ${Math.random().toString(36).substring(2, 8).toUpperCase()}M`)

  return (
    <div className="relative font-sans text-slate-900 bg-white shadow-2xl mx-auto w-full max-w-[560px] p-6 sm:p-8 select-none text-xs border border-slate-200 rounded-lg">
      {/* Floating Computerized Stamp */}
      <div className="absolute right-6 top-32 pointer-events-none z-20 opacity-85 mix-blend-multiply transform -rotate-12 select-none">
        <QuardCubeStamp
          date={receipt.payment_date || receipt.created_at}
          receiptNumber={receipt.receipt_number}
          color="teal"
          variant="circular"
          title="QUARDCUBELABS LIMITED"
          status={receipt.status === "voided" ? "VOIDED" : "PAID & VERIFIED"}
        />
      </div>

      {/* TOP HEADER */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <Image
              src="/turquoise.png"
              alt="Quardcubelabs Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide text-slate-950 uppercase font-mono">
              QuardCube Labs
            </h1>
            <p className="text-[11px] text-slate-600 font-medium">Innovative IT Solutions & Digital Services</p>
            <p className="text-[10px] text-slate-500">Kigamboni, Dar es Salaam | +255 623 893 383</p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block bg-navy text-white text-xs font-black uppercase px-3 py-1 rounded">
            Official Receipt
          </div>
          <p className="text-sm font-black text-slate-950 font-mono mt-1">
            {displayReceiptNumber}
          </p>
          <p className="text-[10.5px] text-slate-500 font-mono">{formattedDateTime}</p>
        </div>
      </div>

      {/* RECIPIENT & TRANSACTION METADATA GRID */}
      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Billed / Issued To:</span>
          <p className="font-bold text-slate-950 text-sm">{receipt.customer_name || "Valued Customer"}</p>
          {receipt.customer_phone && <p className="text-slate-600 font-mono">{receipt.customer_phone}</p>}
          {receipt.customer_email && <p className="text-slate-500">{receipt.customer_email}</p>}
        </div>

        <div className="text-right space-y-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Payment Details:</span>
          <p className="font-medium text-slate-800">
            Method: <span className="font-bold text-slate-950">{receipt.payment_method || "Direct"}</span>
          </p>
          <p className="font-medium text-slate-800">
            Ref: <span className="font-mono font-bold text-slate-950">{referenceCode}</span>
          </p>
          {receipt.order_number && (
            <p className="font-mono text-[11px] text-slate-600">Order Ref: {receipt.order_number}</p>
          )}
        </div>
      </div>

      {/* ITEMIZED TABLE */}
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10.5px] border-b border-slate-200">
            <tr>
              <th className="p-2.5 pl-3">Item Description</th>
              <th className="p-2.5 text-center">Qty</th>
              <th className="p-2.5 text-right">Unit Price (TZS)</th>
              <th className="p-2.5 pr-3 text-right">Amount (TZS)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipt.items && receipt.items.length > 0 ? (
              receipt.items.map((it, idx) => {
                const qty = Number(it.quantity || 1)
                const price = Number(it.price || 0)
                const lineTotal = qty * price

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 pl-3 font-medium text-slate-900">{it.name}</td>
                    <td className="p-2.5 text-center font-mono">{qty}</td>
                    <td className="p-2.5 text-right font-mono">{price.toLocaleString()}</td>
                    <td className="p-2.5 pr-3 text-right font-bold font-mono text-slate-950">
                      {lineTotal.toLocaleString()}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td className="p-2.5 pl-3 font-medium text-slate-900">
                  {receipt.notes || "Professional IT Solutions Settlement"}
                </td>
                <td className="p-2.5 text-center font-mono">1</td>
                <td className="p-2.5 text-right font-mono">{receipt.amount_paid.toLocaleString()}</td>
                <td className="p-2.5 pr-3 text-right font-bold font-mono text-slate-950">
                  {receipt.amount_paid.toLocaleString()}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TOTALS & SUMMARY */}
      <div className="flex justify-between items-start mb-6">
        <div className="max-w-[240px] text-[11px] text-slate-500">
          <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-0.5">Notes & Verification</p>
          <p>This document certifies full settlement. Official electronic voucher generated by QuardCube Labs ERP.</p>
        </div>

        <div className="w-56 space-y-1.5 text-right bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono">{receipt.amount_paid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>VAT (0% Inclusive):</span>
            <span className="font-mono">0.00</span>
          </div>
          <div className="border-t border-slate-300 pt-1.5 flex justify-between text-sm font-black text-slate-950">
            <span>TOTAL PAID:</span>
            <span className="font-mono text-teal-700">TZS {receipt.amount_paid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* FOOTER & QR VERIFICATION */}
      <div className="border-t-2 border-dashed border-slate-300 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white border border-slate-200 rounded">
            <QuardCubeQRCode
              value={qrVerificationValue}
              size={85}
              includeLabel={false}
              centerLogo={false}
            />
          </div>
          <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
            <p className="font-bold text-slate-800">Scan QR Code to Verify</p>
            <p>Verification Portal: {verificationDomain}</p>
            <p>Security Token: {receipt.verification_token ? `${receipt.verification_token.slice(0, 16)}...` : "VERIFIED-AUTH"}</p>
            <p className="text-emerald-600 font-bold uppercase mt-1">Status: {receipt.status.toUpperCase()}</p>
          </div>
        </div>

        <div className="text-right text-xs">
          <p className="font-bold text-slate-800 italic">Asante kwa kununua!</p>
          <p className="text-[10px] text-slate-500 font-medium">Thank you for choosing QuardCube Labs</p>
        </div>
      </div>
    </div>
  )
}

/**
 * 2. THERMAL 80MM RECEIPT FORMAT
 * Standard 80mm Roll (approx 340px width)
 * Classic POS receipt layout with sawtooth torn edges, double-bordered logo box,
 * monospace item rows, total, stamp & centered QR code.
 */
export function QLabsThermal80Receipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue =
    receipt.verification_url ||
    `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`

  const formattedDateTime = formatReceiptDate(receipt.payment_date || receipt.created_at)
  const displayReceiptNumber = formatReceiptNumber(receipt.receipt_number)

  let verificationDomain = "invoza.co.tz"
  try {
    if (receipt.verification_url) {
      const u = new URL(receipt.verification_url)
      verificationDomain = u.hostname
    }
  } catch {
    verificationDomain = "invoza.co.tz"
  }

  const referenceCode =
    receipt.transaction_ref ||
    (receipt.verification_token
      ? receipt.verification_token.slice(0, 10).toUpperCase()
      : `SJ${Math.random().toString(36).substring(2, 8).toUpperCase()}M`)

  return (
    <div className="relative font-mono text-slate-900 bg-white shadow-2xl mx-auto w-full max-w-[340px] select-none text-xs border border-slate-200">
      {/* Sawtooth Top Torn Paper Edge */}
      <div className="w-full h-3 overflow-hidden bg-slate-200/50 leading-none">
        <svg className="w-full h-3 text-white fill-current" viewBox="0 0 400 12" preserveAspectRatio="none">
          <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 L370,0 L380,12 L390,0 L400,12 Z" />
        </svg>
      </div>

      <div className="px-5 py-5 sm:px-6 sm:py-6 relative">
        {/* Floating Stamp */}
        <div className="absolute right-3 top-36 pointer-events-none z-20 opacity-80 mix-blend-multiply transform -rotate-12 select-none">
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

        {/* 2. COMPANY LOGO + NAME (BORDERLESS) */}
        <div className="my-3 mx-auto flex items-center justify-center gap-2.5">
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src="/turquoise.png"
              alt="Quardcubelabs Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-950 font-mono uppercase">
            Quardcubelabs
          </h1>
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
        <div className="border-b border-dashed border-slate-400 my-3 w-full" />

        {/* 5. CUSTOMER ROW */}
        <div className="flex justify-between items-baseline text-xs mb-2.5">
          <span className="text-slate-700">Customer:</span>
          <span className="font-bold text-slate-950 text-right truncate max-w-[180px]">
            {receipt.customer_name || "Valued Customer"}
          </span>
        </div>

        {/* 6. ITEMIZED ROWS */}
        <div className="space-y-2 my-2.5 text-xs">
          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((it, idx) => {
              const qty = Number(it.quantity || 1)
              const price = Number(it.price || 0)
              const lineTotal = qty * price
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-slate-950 truncate max-w-[190px]">
                      {it.name} {qty > 1 ? `x ${qty}` : ""}
                    </span>
                    <span className="font-bold text-slate-950 shrink-0">
                      {lineTotal.toLocaleString()}
                    </span>
                  </div>
                  {qty > 1 && (
                    <div className="text-[10px] text-slate-500">
                      {qty} @ {price.toLocaleString()}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="space-y-0.5">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-slate-950 truncate max-w-[190px]">
                  {receipt.notes || "Professional IT Settlement"}
                </span>
                <span className="font-bold text-slate-950">
                  {receipt.amount_paid.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 7. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-3 w-full" />

        {/* 8. TOTAL ROW */}
        <div className="flex justify-between items-center text-sm font-black text-slate-950 my-2">
          <span className="tracking-wide">TOTAL:</span>
          <span className="tracking-wide">TZS {receipt.amount_paid.toLocaleString()}</span>
        </div>

        {/* 9. PAYMENT METADATA */}
        <div className="space-y-1 my-2.5 text-xs text-slate-800">
          <div className="flex justify-between">
            <span className="text-slate-700">Payment:</span>
            <span className="font-medium text-slate-950">{receipt.payment_method || "Mobile Money"}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-700">Reference:</span>
            <span className="font-bold text-slate-950 font-mono">{referenceCode}</span>
          </div>

          <div className="flex justify-between items-center pt-0.5">
            <span className="font-bold text-slate-900">Status:</span>
            <span className="font-black text-slate-950 uppercase tracking-wide">
              {receipt.status === "voided" ? "VOIDED" : receipt.status === "refunded" ? "REFUNDED" : "PAID"}
            </span>
          </div>
        </div>

        {/* 10. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-3 w-full" />

        {/* 11. THANK YOU MESSAGE */}
        <div className="text-center my-2.5">
          <p className="text-xs font-semibold text-slate-800 tracking-wide">
            Asante kwa kununua!
          </p>
        </div>

        {/* 12. CENTERED VERIFICATION QR CODE */}
        <div className="flex justify-center my-3">
          <div className="p-1 bg-white inline-block">
            <QuardCubeQRCode
              value={qrVerificationValue}
              size={110}
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
        <svg className="w-full h-3 text-white fill-current rotate-180" viewBox="0 0 400 12" preserveAspectRatio="none">
          <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 L370,0 L380,12 L390,0 L400,12 Z" />
        </svg>
      </div>
    </div>
  )
}

/**
 * 3. THERMAL 58MM RECEIPT FORMAT
 * Compact 58mm Mini POS Roll (approx 230px width)
 * Condensed monospace font, tight line breaks, compact computerized stamp & QR code.
 */
export function QLabsThermal58Receipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue =
    receipt.verification_url ||
    `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`

  const formattedDateTime = formatReceiptDate(receipt.payment_date || receipt.created_at)
  const displayReceiptNumber = formatReceiptNumber(receipt.receipt_number)

  let verificationDomain = "invoza.co.tz"
  try {
    if (receipt.verification_url) {
      const u = new URL(receipt.verification_url)
      verificationDomain = u.hostname
    }
  } catch {
    verificationDomain = "invoza.co.tz"
  }

  const referenceCode =
    receipt.transaction_ref ||
    (receipt.verification_token
      ? receipt.verification_token.slice(0, 8).toUpperCase()
      : `SJ${Math.random().toString(36).substring(2, 6).toUpperCase()}`)

  return (
    <div className="relative font-mono text-slate-900 bg-white shadow-2xl mx-auto w-full max-w-[240px] select-none text-[10.5px] border border-slate-200">
      {/* Sawtooth Top Edge */}
      <div className="w-full h-2.5 overflow-hidden bg-slate-200/50 leading-none">
        <svg className="w-full h-2.5 text-white fill-current" viewBox="0 0 400 12" preserveAspectRatio="none">
          <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 L370,0 L380,12 L390,0 L400,12 Z" />
        </svg>
      </div>

      <div className="px-3.5 py-4 relative">
        {/* Floating Compact Stamp */}
        <div className="absolute right-1 top-28 pointer-events-none z-20 opacity-75 mix-blend-multiply transform -rotate-12 scale-75 select-none">
          <QuardCubeStamp
            date={receipt.payment_date || receipt.created_at}
            receiptNumber={receipt.receipt_number}
            color="teal"
            variant="circular"
            title="QUARDCUBELABS"
            status={receipt.status === "voided" ? "VOID" : "PAID"}
          />
        </div>

        {/* 1. COMPACT LOGO & TITLE (BORDERLESS) */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-2">
            <div className="relative w-5 h-5 shrink-0">
              <Image
                src="/turquoise.png"
                alt="Logo"
                width={20}
                height={20}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-xs uppercase tracking-tight font-mono">QUARDCUBELABS</span>
          </div>
          <p className="text-[9px] text-slate-600 font-semibold uppercase">DAR ES SALAAM | +255623893383</p>
        </div>

        {/* 2. RECEIPT NUMBER & DATE */}
        <div className="text-center mt-2 space-y-0.5 text-[10px] text-slate-800">
          <p className="font-bold">RCT #{displayReceiptNumber}</p>
          <p className="text-[9.5px] text-slate-500">{formattedDateTime}</p>
        </div>

        {/* 3. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-2 w-full" />

        {/* 4. CUSTOMER */}
        <div className="text-[10px] flex justify-between mb-1.5">
          <span className="text-slate-600">Cust:</span>
          <span className="font-bold truncate max-w-[140px] text-right">{receipt.customer_name || "Customer"}</span>
        </div>

        {/* 5. ITEMIZED LIST */}
        <div className="space-y-1.5 my-2">
          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((it, idx) => {
              const qty = Number(it.quantity || 1)
              const price = Number(it.price || 0)
              const lineTotal = qty * price
              return (
                <div key={idx} className="text-[10px]">
                  <div className="flex justify-between font-medium">
                    <span className="truncate max-w-[130px]">{it.name}</span>
                    <span className="font-bold">{lineTotal.toLocaleString()}</span>
                  </div>
                  {qty > 1 && (
                    <div className="text-[9px] text-slate-500">{qty} x {price.toLocaleString()}</div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="text-[10px] flex justify-between">
              <span className="truncate max-w-[130px]">{receipt.notes || "IT Settlement"}</span>
              <span className="font-bold">{receipt.amount_paid.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* 6. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-2 w-full" />

        {/* 7. TOTAL */}
        <div className="flex justify-between items-center text-xs font-black text-slate-950 my-1.5">
          <span>TOTAL:</span>
          <span>TZS {receipt.amount_paid.toLocaleString()}</span>
        </div>

        {/* 8. PAYMENT INFO */}
        <div className="text-[9.5px] space-y-0.5 text-slate-700 my-1.5">
          <div className="flex justify-between">
            <span>Pay:</span>
            <span className="font-medium text-slate-950">{receipt.payment_method || "Cash"}</span>
          </div>
          <div className="flex justify-between">
            <span>Ref:</span>
            <span className="font-bold font-mono text-slate-950">{referenceCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-bold uppercase text-slate-950">{receipt.status.toUpperCase()}</span>
          </div>
        </div>

        {/* 9. DASHED SEPARATOR */}
        <div className="border-b border-dashed border-slate-400 my-2 w-full" />

        {/* 10. COMPACT QR & THANKS */}
        <div className="text-center my-2">
          <p className="text-[9.5px] font-semibold text-slate-800">Asante kwa kununua!</p>
          <div className="flex justify-center my-2">
            <QuardCubeQRCode
              value={qrVerificationValue}
              size={80}
              includeLabel={false}
              centerLogo={false}
            />
          </div>
          <p className="text-[8.5px] text-slate-500 font-mono">Verify: {verificationDomain}</p>
        </div>
      </div>

      {/* Sawtooth Bottom Edge */}
      <div className="w-full h-2.5 overflow-hidden bg-slate-200/50 leading-none">
        <svg className="w-full h-2.5 text-white fill-current rotate-180" viewBox="0 0 400 12" preserveAspectRatio="none">
          <path d="M0,12 L10,0 L20,12 L30,0 L40,12 L50,0 L60,12 L70,0 L80,12 L90,0 L100,12 L110,0 L120,12 L130,0 L140,12 L150,0 L160,12 L170,0 L180,12 L190,0 L200,12 L210,0 L220,12 L230,0 L240,12 L250,0 L260,12 L270,0 L280,12 L290,0 L300,12 L310,0 L320,12 L330,0 L340,12 L350,0 L360,12 L370,0 L380,12 L390,0 L400,12 Z" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Universal Master Receipt Renderer
 * Renders A5 Voucher, Thermal 80mm, or Thermal 58mm based on active templateId.
 */
export default function ReceiptTemplateRenderer({
  receipt,
  templateId = "thermal-80",
  printRef
}: ReceiptTemplateProps) {
  const isA5 = templateId === "a5"
  const is58 = templateId === "thermal-58"

  return (
    <div ref={printRef} className="w-full flex justify-center py-2">
      {isA5 ? (
        <QLabsA5Receipt receipt={receipt} />
      ) : is58 ? (
        <QLabsThermal58Receipt receipt={receipt} />
      ) : (
        <QLabsThermal80Receipt receipt={receipt} />
      )}
    </div>
  )
}
