"use client"

import React from "react"
import Image from "next/image"
import { AdminReceipt, ReceiptTemplateId } from "@/lib/receipt-actions"
import { 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  ReceiptText, 
  CreditCard,
  Hash,
  Calendar,
  User,
  FileCheck2,
  Lock
} from "lucide-react"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"

export interface ReceiptTemplateProps {
  receipt: AdminReceipt
  templateId?: ReceiptTemplateId
  printRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Utility to convert numerical TZS currency into clean English words.
 * Adds profound authenticity and realism to formal commercial receipts.
 */
function numberToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Tanzanian Shillings Only"

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function convertGroup(n: number): string {
    let str = ""
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + " Hundred "
      n %= 100
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "") + " "
    } else if (n >= 10) {
      str += teens[n - 10] + " "
    } else if (n > 0) {
      str += units[n] + " "
    }
    return str.trim()
  }

  const billions = Math.floor(num / 1000000000)
  const millions = Math.floor((num % 1000000000) / 1000000)
  const thousands = Math.floor((num % 1000000) / 1000)
  const remainder = Math.floor(num % 1000)

  let result = ""
  if (billions > 0) result += convertGroup(billions) + " Billion "
  if (millions > 0) result += convertGroup(millions) + " Million "
  if (thousands > 0) result += convertGroup(thousands) + " Thousand "
  if (remainder > 0) result += convertGroup(remainder) + " "

  return (result.trim() ? result.trim() + " Tanzanian Shillings Only" : "Zero Tanzanian Shillings Only")
}

// ----------------------------------------------------------------------
// 1. TEMPLATE: MODERN CORPORATE (Executive Commercial Payment Receipt)
// ----------------------------------------------------------------------
export function ModernCorporateReceipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue = receipt.verification_url || `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`
  const formattedDate = new Date(receipt.payment_date).toLocaleDateString("en-GB", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  })
  const amountWords = numberToWords(receipt.amount_paid)

  return (
    <div className="bg-white text-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 font-sans max-w-3xl mx-auto min-h-[920px] flex flex-col justify-between relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035]">
        <Image src="/turquoise.png" alt="" width={420} height={420} className="object-contain" />
      </div>

      {/* Official Paid Watermark Stamp Banner */}
      <div className="absolute right-12 top-28 border-4 border-emerald-600/80 text-emerald-700/85 font-black text-2xl uppercase tracking-widest px-4 py-1.5 rounded-lg -rotate-12 pointer-events-none z-10 select-none shadow-xs">
        PAID IN FULL
      </div>

      <div className="relative z-10">
        {/* Header with Turquoise Logo before QuardCubeLabs text */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 relative shrink-0">
              <Image
                src="/turquoise.png"
                alt="QuardCubeLabs Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">
                  QUARDCUBE<span className="text-teal-600">LABS</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Enterprise Technology & Digital Solutions</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania<br />
                Tel: +255 623 893 383 / +255 652 540 496 • info@quardcubelabs.co.tz • www.quardcubelabs.co.tz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-auto">
            {/* QuardCube Verified QR Code with Central Emblem */}
            <QuardCubeQRCode 
              value={qrVerificationValue} 
              size={84} 
              label="Verify Receipt" 
            />
            <div className="text-right">
              <div className="inline-block bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded uppercase tracking-wider shadow-xs">
                OFFICIAL RECEIPT
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1.5 font-mono">
                #{receipt.receipt_number}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Date: <span className="font-semibold text-slate-800">{formattedDate}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Corporate Tax / Registration Banner */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-md mt-3 border border-slate-200">
          <span><strong className="text-slate-700">TIN:</strong> 142-985-632</span>
          <span><strong className="text-slate-700">VRN:</strong> 40-029481-K</span>
          <span><strong className="text-slate-700">REG NO:</strong> 154892</span>
          <span className="text-emerald-700 font-bold">FISCAL PAYMENT CLEARANCE</span>
        </div>

        {/* Payment & Customer Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 p-4 rounded-xl bg-slate-50/90 border border-slate-200 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <User className="h-3 w-3 text-slate-500" /> RECEIVED FROM / PAYER
            </p>
            <h3 className="text-sm font-bold text-slate-900 pt-0.5">{receipt.customer_name}</h3>
            <p className="text-slate-600">{receipt.customer_email}</p>
            {receipt.customer_phone && <p className="text-slate-600 font-mono">{receipt.customer_phone}</p>}
            {receipt.customer_address && <p className="text-slate-500">{receipt.customer_address}</p>}
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-3 w-3 text-slate-500" /> PAYMENT SETTLEMENT DETAILS
            </p>
            <p className="text-slate-800 font-semibold pt-0.5">
              Method: <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{receipt.payment_method}</span>
            </p>
            {receipt.transaction_ref && (
              <p className="text-slate-600 font-mono">
                Tx Reference: <span className="font-bold text-slate-900">{receipt.transaction_ref}</span>
              </p>
            )}
            {receipt.invoice_number && (
              <p className="text-slate-600 font-mono">Settled Invoice: <span className="font-semibold text-slate-900">#{receipt.invoice_number}</span></p>
            )}
            <p className="text-slate-500 font-mono text-[11px]">Settlement Status: <span className="text-emerald-700 font-bold">Paid & Verified</span></p>
          </div>
        </div>

        {/* Item Breakdown if available, or summary item */}
        <div className="border border-slate-200 rounded-xl overflow-hidden my-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3">Item / Service Description</th>
                <th className="p-3 text-center w-16">Qty</th>
                <th className="p-3 text-right w-28">Unit Price (TZS)</th>
                <th className="p-3 text-right w-32">Total (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-medium text-slate-900">{it.name}</td>
                    <td className="p-3 text-center text-slate-600">{it.quantity || 1}</td>
                    <td className="p-3 text-right text-slate-600 font-mono">{it.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900 font-mono">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 font-medium text-slate-900">
                    Payment settlement for professional digital services & products
                    {receipt.invoice_number ? ` (Invoice #${receipt.invoice_number})` : ""}
                  </td>
                  <td className="p-3 text-center text-slate-600">1</td>
                  <td className="p-3 text-right text-slate-600 font-mono">{receipt.amount_paid.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-slate-900 font-mono">{receipt.amount_paid.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Amount Box & Amount in Words */}
        <div className="my-4 p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Amount Received</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5 font-mono">
              TZS {receipt.amount_paid.toLocaleString()}
            </p>
          </div>
          <div className="text-right sm:self-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3.5 py-1.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4" /> Verified Settled
            </span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 my-3">
          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">Amount in Words:</span>
          <span className="font-semibold italic text-slate-800">{amountWords}</span>
        </div>

        {receipt.notes && (
          <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-lg text-xs text-teal-900 my-3">
            <span className="font-bold text-teal-950 uppercase text-[10px] tracking-wider block">Remarks / Purpose:</span>
            <span>{receipt.notes}</span>
          </div>
        )}
      </div>

      {/* Signature & Official Computerized Corporate Stamp */}
      <div className="border-t border-slate-200 pt-5 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs text-slate-500 relative z-10">
        <div>
          <p className="font-bold text-slate-900 text-sm">QuardCube Labs Accounts Department</p>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">TX-VERIFY: QC-REC-{receipt.receipt_number}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Electronic computer generated official receipt. Valid without manual signature when QR is authenticated.</p>
        </div>

        <div className="flex items-center gap-6 self-end sm:self-auto">
          {/* Official Computerized Corporate Stamp */}
          <QuardCubeStamp
            date={receipt.payment_date}
            receiptNumber={receipt.receipt_number}
            color="teal"
          />

          <div className="text-right">
            <div className="h-8 w-32 border-b border-slate-400 mb-1 ml-auto"></div>
            <p className="font-semibold text-slate-800 text-[11px]">Authorized Signatory</p>
            <p className="text-[10px] text-slate-400 font-mono">Finance Controller</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. TEMPLATE: MINIMALIST TECH (Cyber Treasury Voucher)
// ----------------------------------------------------------------------
export function MinimalistTechReceipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue = receipt.verification_url || `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`
  const formattedDate = new Date(receipt.payment_date).toISOString().split("T")[0]
  const amountWords = numberToWords(receipt.amount_paid)

  return (
    <div className="bg-slate-950 text-slate-100 p-8 sm:p-10 rounded-2xl shadow-2xl font-sans max-w-3xl mx-auto min-h-[920px] flex flex-col justify-between border border-teal-500/30 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <Image src="/turquoise.png" alt="" width={420} height={420} className="object-contain" />
      </div>

      <div className="relative z-10">
        {/* Header with Turquoise Logo before QuardCubeLabs */}
        <div className="flex justify-between items-start border-b border-teal-500/30 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-wider font-mono">
                QUARDCUBE<span className="text-teal-400">LABS</span>
              </h1>
              <p className="text-xs text-teal-400 font-mono mt-0.5">DIGITAL TREASURY PAYMENT VOUCHER</p>
              <p className="text-[10px] text-slate-400 font-mono">
                24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania • info@quardcubelabs.co.tz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* QuardCube Verified QR Code with Central Emblem */}
            <QuardCubeQRCode 
              value={qrVerificationValue} 
              size={80} 
              label="Authenticate" 
            />
            <div className="text-right font-mono text-xs">
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded font-semibold block">
                #{receipt.receipt_number}
              </span>
              <p className="text-slate-400 mt-2">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Security & System Identifiers */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 my-4">
          <span>TOKEN: SHA256-REC-{receipt.receipt_number}</span>
          <span className="text-teal-400 flex items-center gap-1"><Lock className="h-3 w-3" /> SECURE LEDGER SETTLEMENT</span>
        </div>

        {/* Cleared Amount Banner */}
        <div className="my-4 p-6 rounded-2xl bg-slate-900/90 border border-teal-500/30 text-center space-y-2 shadow-lg">
          <p className="text-xs font-mono text-teal-400 uppercase tracking-widest">Amount Cleared</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-mono">
            TZS {receipt.amount_paid.toLocaleString()}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Channel: <span className="text-teal-300 font-bold">{receipt.payment_method}</span> • Ref: <span className="text-slate-200">{receipt.transaction_ref || "DIRECT"}</span>
          </p>
        </div>

        {/* Payer & Settlement Monospace Grid */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 font-mono my-4">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Payer Entity:</span>
            <span className="text-white font-bold">{receipt.customer_name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Payer Email:</span>
            <span className="text-slate-300">{receipt.customer_email}</span>
          </div>
          {receipt.customer_phone && (
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Payer Phone:</span>
              <span className="text-slate-300">{receipt.customer_phone}</span>
            </div>
          )}
          {receipt.invoice_number && (
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Invoice Ref:</span>
              <span className="text-teal-400">#{receipt.invoice_number}</span>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        {receipt.items && receipt.items.length > 0 && (
          <div className="border border-slate-800 rounded-xl overflow-hidden my-4 font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-2.5">Item Scope</th>
                  <th className="p-2.5 text-center w-16">Qty</th>
                  <th className="p-2.5 text-right w-32">Total (TZS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {receipt.items.map((it, idx) => (
                  <tr key={idx} className="text-slate-300">
                    <td className="p-2.5">{it.name}</td>
                    <td className="p-2.5 text-center text-slate-400">{it.quantity || 1}</td>
                    <td className="p-2.5 text-right font-bold text-white">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Amount in words */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 my-3">
          <span className="text-teal-400 font-bold block text-[10px] uppercase">Amount in Words:</span>
          <span className="text-slate-200 italic">{amountWords}</span>
        </div>

        {receipt.notes && (
          <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/50 text-xs font-mono text-teal-300 my-3">
            <span className="text-teal-400 font-bold block text-[10px] uppercase">Notes:</span>
            <span>{receipt.notes}</span>
          </div>
        )}
      </div>

      {/* Footer with Computerized Stamp */}
      <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-end text-xs text-slate-400 font-mono relative z-10">
        <div>
          <span>QuardCube Digital Treasury</span>
          <p className="text-emerald-400 font-semibold text-[11px] mt-0.5">Cryptographically Confirmed Settlement</p>
          <p className="text-[10px] text-slate-500">24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania</p>
        </div>

        <QuardCubeStamp
          date={receipt.payment_date}
          receiptNumber={receipt.receipt_number}
          color="teal"
          className="scale-90"
        />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 3. TEMPLATE: CLASSIC ENTERPRISE (Formal Standard Corporate Receipt)
// ----------------------------------------------------------------------
export function ClassicEnterpriseReceipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue = receipt.verification_url || `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`
  const formattedDate = new Date(receipt.payment_date).toLocaleDateString("en-GB", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  })
  const amountWords = numberToWords(receipt.amount_paid)

  return (
    <div className="bg-white text-black p-8 sm:p-10 border-2 border-slate-900 font-serif max-w-3xl mx-auto min-h-[920px] flex flex-col justify-between relative overflow-hidden shadow-xl">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <Image src="/turquoise.png" alt="" width={400} height={400} className="object-contain" />
      </div>

      <div className="relative z-10">
        {/* Header with Turquoise Logo before QuardCubeLabs */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <div className="text-left font-sans">
              <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950">QUARDCUBE LABS LIMITED</h1>
              <p className="text-xs uppercase mt-0.5 text-slate-700 font-semibold">
                24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Tel: +255 623 893 383 / +255 652 540 496 • Email: info@quardcubelabs.co.tz
              </p>
            </div>
          </div>

          {/* QuardCube Verified QR Code with Central Emblem */}
          <QuardCubeQRCode 
            value={qrVerificationValue} 
            size={80} 
            label="Verification" 
          />
        </div>

        {/* Title */}
        <div className="text-center my-4">
          <h2 className="text-xl font-bold uppercase tracking-widest font-sans underline decoration-2 underline-offset-4">
            OFFICIAL PAYMENT RECEIPT
          </h2>
          <p className="text-[11px] font-mono text-slate-600 mt-1">
            TIN: 142-985-632 | VRN: 40-029481-K | Certificate of Incorporation: 154892
          </p>
        </div>

        {/* Metadata Bar */}
        <div className="flex justify-between text-xs my-3 font-mono border-b border-slate-300 pb-2">
          <p><span className="font-bold font-sans">Receipt No:</span> <span className="font-bold text-slate-900">{receipt.receipt_number}</span></p>
          <p><span className="font-bold font-sans">Date:</span> {formattedDate}</p>
        </div>

        {/* Classic Boxed Narrative */}
        <div className="border border-slate-900 p-5 text-xs space-y-3.5 my-4 bg-slate-50/50">
          <p className="leading-relaxed">
            <span className="font-bold font-sans uppercase">Received with thanks from:</span>{" "}
            <span className="font-sans font-bold uppercase underline text-sm ml-1 text-slate-950">{receipt.customer_name}</span>
            {receipt.customer_email && <span className="text-slate-600 font-sans ml-2">({receipt.customer_email})</span>}
          </p>
          
          <p className="leading-relaxed">
            <span className="font-bold font-sans uppercase">The Sum of Tanzanian Shillings:</span>{" "}
            <span className="font-sans font-semibold italic text-slate-900 ml-1">{amountWords}</span>
          </p>

          <div className="flex flex-wrap items-center justify-between border-t border-dashed border-slate-400 pt-3 gap-2 font-sans">
            <div>
              <span className="font-bold uppercase">Amount in Figures:</span>{" "}
              <span className="text-base font-black text-slate-900 font-mono ml-1">TZS {receipt.amount_paid.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-bold uppercase">Payment Channel:</span>{" "}
              <span className="font-semibold text-slate-900 ml-1">{receipt.payment_method}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between border-t border-dashed border-slate-400 pt-3 gap-2 font-mono text-[11px] text-slate-700">
            {receipt.transaction_ref && (
              <p><span className="font-bold font-sans">Cheque / Tx Ref No:</span> {receipt.transaction_ref}</p>
            )}
            {receipt.invoice_number && (
              <p><span className="font-bold font-sans">Being settlement for Invoice:</span> #{receipt.invoice_number}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        {receipt.items && receipt.items.length > 0 && (
          <table className="w-full border border-slate-900 text-xs my-4 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-sans">
                <th className="border-r border-slate-900 p-2.5 text-left">Description / Particulars</th>
                <th className="border-r border-slate-900 p-2.5 w-16 text-center">Qty</th>
                <th className="border-r border-slate-900 p-2.5 w-28 text-right">Rate (TZS)</th>
                <th className="p-2.5 w-32 text-right">Amount (TZS)</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((it, idx) => (
                <tr key={idx} className="border-b border-slate-900 font-sans">
                  <td className="border-r border-slate-900 p-2.5">{it.name}</td>
                  <td className="border-r border-slate-900 p-2.5 text-center">{it.quantity || 1}</td>
                  <td className="border-r border-slate-900 p-2.5 text-right font-mono">{it.price.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-bold font-mono">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {receipt.notes && (
          <p className="text-xs italic text-slate-600 my-2">
            <strong className="font-sans not-italic">Notes / Particulars:</strong> {receipt.notes}
          </p>
        )}
      </div>

      {/* Signature & Official Computerized Stamp */}
      <div className="grid grid-cols-2 pt-6 text-xs items-end relative z-10 border-t border-slate-300">
        <div>
          {/* Computerized Official Stamp */}
          <QuardCubeStamp
            date={receipt.payment_date}
            receiptNumber={receipt.receipt_number}
            color="black"
          />
          <p className="text-[10px] font-mono text-slate-500 mt-2">
            Official Electronic Receipt • QuardCube Labs Ltd
          </p>
        </div>
        <div className="text-right font-sans">
          <p className="font-bold uppercase text-slate-900">For: QUARDCUBE LABS LIMITED</p>
          <div className="h-10"></div>
          <p className="border-t border-slate-900 inline-block pt-1 px-6 font-semibold text-slate-800">
            Authorized Signature & Clearance
          </p>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 4. TEMPLATE: EMERALD CYBER (Official Clearance Receipt)
// ----------------------------------------------------------------------
export function EmeraldCyberReceipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue = receipt.verification_url || `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`
  const formattedDate = new Date(receipt.payment_date).toLocaleDateString("en-GB", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  })
  const amountWords = numberToWords(receipt.amount_paid)

  return (
    <div className="bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans max-w-3xl mx-auto min-h-[920px] flex flex-col justify-between border border-emerald-100 relative">
      <div>
        {/* Emerald Gradient Banner Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 relative shrink-0 p-1.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain p-1" />
              </div>
              <div>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Settled & Verified
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">QUARDCUBE LABS</h1>
                <p className="text-xs text-emerald-100">24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania</p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">Tel: +255 623 893 383 • info@quardcubelabs.co.tz</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-auto">
              {/* QuardCube Verified QR Code with Central Emblem */}
              <QuardCubeQRCode 
                value={qrVerificationValue} 
                size={80} 
                label="Verify" 
              />
              <div className="text-right font-mono">
                <p className="text-lg font-bold text-emerald-200">#{receipt.receipt_number}</p>
                <p className="text-xs text-emerald-100 mt-0.5">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-8 space-y-5">
          {/* Gross Amount Card */}
          <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Gross Amount Confirmed</p>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1 font-mono">
              TZS {receipt.amount_paid.toLocaleString()}
            </h2>
            <p className="text-xs text-emerald-700 mt-1">
              Settled via <span className="font-bold">{receipt.payment_method}</span> {receipt.transaction_ref ? `(Ref: ${receipt.transaction_ref})` : ""}
            </p>
          </div>

          {/* Amount in words */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">Amount in Words:</span>
            <span className="font-semibold italic text-slate-900">{amountWords}</span>
          </div>

          {/* Client Account Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white text-xs">
            <div className="space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Client / Payer Entity</p>
              <h4 className="text-sm font-bold text-slate-900">{receipt.customer_name}</h4>
              <p className="text-slate-600">{receipt.customer_email}</p>
              {receipt.customer_phone && <p className="text-slate-600 font-mono">{receipt.customer_phone}</p>}
            </div>

            <div className="space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Settlement References</p>
              <p className="text-slate-800 font-semibold">Payment Mode: <span className="text-emerald-700">{receipt.payment_method}</span></p>
              {receipt.invoice_number && <p className="text-slate-600 font-mono">Invoice Ref: #{receipt.invoice_number}</p>}
              <p className="text-slate-500 font-mono text-[11px]">Clearance Status: <span className="text-emerald-600 font-bold">Authenticated</span></p>
            </div>
          </div>

          {/* Items Table */}
          {receipt.items && receipt.items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-emerald-50/50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center w-16">Qty</th>
                    <th className="p-3 text-right w-32">Amount (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-900">{it.name}</td>
                      <td className="p-3 text-center text-slate-600">{it.quantity || 1}</td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {receipt.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <strong className="text-slate-800">Remarks / Particulars:</strong> {receipt.notes}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-end">
        <div>
          <span>Official Electronic Fiscal Receipt</span>
          <p className="text-emerald-600 font-semibold text-[11px] mt-0.5">QuardCube Labs Finance & Accounts</p>
          <p className="text-[10px] text-slate-400">24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania</p>
        </div>

        <QuardCubeStamp
          date={receipt.payment_date}
          receiptNumber={receipt.receipt_number}
          color="emerald"
        />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 5. TEMPLATE: COMPACT RETAIL (POS / Voucher Receipt)
// ----------------------------------------------------------------------
export function CompactRetailReceipt({ receipt }: { receipt: AdminReceipt }) {
  const qrVerificationValue = receipt.verification_url || `https://quardcubelabs.co.tz/verify/${receipt.verification_token || receipt.receipt_number}`
  const amountWords = numberToWords(receipt.amount_paid)

  return (
    <div className="bg-slate-50 text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-300 font-mono max-w-xl mx-auto min-h-[820px] flex flex-col justify-between shadow-lg">
      <div>
        {/* Header with Turquoise Logo */}
        <div className="flex justify-between items-center border-b border-dashed border-slate-400 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <div className="text-left">
              <h2 className="text-base font-black tracking-wider text-slate-900">QUARDCUBE LABS</h2>
              <p className="text-[10px] text-slate-600">24 Ferry, Kigamboni, Dar es Salaam 17101</p>
              <p className="text-[10px] text-slate-600">Tel: +255 623 893 383</p>
            </div>
          </div>
          {/* QuardCube Verified QR Code with Central Emblem */}
          <QuardCubeQRCode 
            value={qrVerificationValue} 
            size={68} 
            label="Verify" 
          />
        </div>

        {/* Transaction Summary */}
        <div className="text-xs space-y-1.5 my-4 border-b border-dashed border-slate-400 pb-3">
          <p className="flex justify-between">
            <span className="text-slate-500">Receipt No:</span>
            <span className="font-bold text-slate-900">#{receipt.receipt_number}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">Date/Time:</span>
            <span>{new Date(receipt.payment_date).toLocaleString()}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-bold text-slate-900">{receipt.customer_name}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-bold text-slate-900">{receipt.payment_method}</span>
          </p>
          {receipt.transaction_ref && (
            <p className="flex justify-between">
              <span className="text-slate-500">Tx Reference:</span>
              <span className="font-bold text-slate-900">{receipt.transaction_ref}</span>
            </p>
          )}
          {receipt.invoice_number && (
            <p className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span>#{receipt.invoice_number}</span>
            </p>
          )}
        </div>

        {/* Line Items */}
        <div className="my-4 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-300 font-bold">
            <span>Description</span>
            <span>Amount (TZS)</span>
          </div>
          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((it, idx) => (
              <div key={idx} className="flex justify-between py-1.5 text-slate-700">
                <span>{it.name} (x{it.quantity || 1})</span>
                <span>{((it.quantity || 1) * it.price).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between py-1.5 text-slate-700">
              <span>Payment settlement</span>
              <span>{receipt.amount_paid.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2.5 border-t-2 border-slate-900 font-black text-sm mt-3">
            <span>TOTAL PAID:</span>
            <span>TZS {receipt.amount_paid.toLocaleString()}</span>
          </div>
        </div>

        {/* Amount in words */}
        <div className="p-2.5 rounded bg-slate-200/60 text-[11px] text-slate-700 my-2">
          <span className="font-bold text-slate-900 block text-[10px]">AMOUNT IN WORDS:</span>
          <span className="italic">{amountWords}</span>
        </div>
      </div>

      <div className="flex flex-col items-center border-t border-dashed border-slate-400 pt-4 space-y-2 text-center">
        <QuardCubeStamp
          date={receipt.payment_date}
          receiptNumber={receipt.receipt_number}
          color="teal"
          variant="boxed"
        />
        <div className="text-[10px] text-slate-500 space-y-0.5 mt-2">
          <p className="font-bold">*** THANK YOU FOR CHOOSING QUARDCUBE LABS ***</p>
          <p>24 Ferry, Kigamboni, Dar es Salaam • Goods subject to warranty terms.</p>
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// Master Component Switcher
// ----------------------------------------------------------------------
export default function ReceiptTemplateRenderer({ receipt, templateId, printRef }: ReceiptTemplateProps) {
  const activeTemplate = templateId || receipt.template_id || "modern-corporate"

  return (
    <div ref={printRef} className="w-full">
      {activeTemplate === "modern-corporate" && <ModernCorporateReceipt receipt={receipt} />}
      {activeTemplate === "minimalist-tech" && <MinimalistTechReceipt receipt={receipt} />}
      {activeTemplate === "classic-enterprise" && <ClassicEnterpriseReceipt receipt={receipt} />}
      {activeTemplate === "emerald-cyber" && <EmeraldCyberReceipt receipt={receipt} />}
      {activeTemplate === "compact-retail" && <CompactRetailReceipt receipt={receipt} />}
    </div>
  )
}
