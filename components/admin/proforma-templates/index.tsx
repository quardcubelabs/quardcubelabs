"use client"

import React from "react"
import Image from "next/image"
import { AdminProformaInvoice, ProformaTemplateId } from "@/lib/proforma-actions"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Building2, ShieldCheck, Phone, Mail, MapPin, Globe } from "lucide-react"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"

export interface ProformaTemplateProps {
  proforma: AdminProformaInvoice
  templateId?: ProformaTemplateId
  printRef?: React.RefObject<HTMLDivElement | null>
}

// 1. TEMPLATE: MODERN CORPORATE (Executive Navy & Teal)
export function ModernCorporateProforma({ proforma }: { proforma: AdminProformaInvoice }) {
  const subtotal = proforma.subtotal || proforma.total
  const taxAmount = proforma.tax_amount || 0
  const discount = proforma.discount || 0
  const qrVerificationValue = `https://quardcubelabs.co.tz/verify?type=proforma&doc=${proforma.proforma_number}&total=${proforma.total}&client=${encodeURIComponent(proforma.customer_name)}`

  return (
    <div className="bg-white text-slate-800 p-8 sm:p-10 rounded-2xl shadow-lg border border-slate-200 font-sans max-w-4xl mx-auto min-h-[950px] flex flex-col justify-between relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <Image src="/turquoise.png" alt="" width={420} height={420} className="object-contain" />
      </div>

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCubeLabs Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase">
                QUARDCUBE<span className="text-teal-600">LABS</span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Enterprise Technology & Digital Solutions</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania<br />
                Tel: +255 623 893 383 • info@quardcubelabs.co.tz • www.quardcubelabs.co.tz
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <QuardCubeQRCode value={qrVerificationValue} size={88} label="Scan to Verify" />
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white font-black text-xs px-3.5 py-1.5 rounded uppercase tracking-widest shadow-xs">
                PROFORMA INVOICE
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1.5 font-mono">
                #{proforma.proforma_number}
              </p>
              <div className="text-[11px] text-slate-600 space-y-0.5 mt-1">
                <p>Date: <span className="font-semibold text-slate-900">{new Date(proforma.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</span></p>
                {proforma.valid_until && (
                  <p>Valid Until: <span className="font-semibold text-amber-700">{new Date(proforma.valid_until).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}</span></p>
                )}
                <p>Status: <span className="uppercase font-bold text-teal-700">{proforma.status}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Billing Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PREPARED FOR / CLIENT:</p>
            <h3 className="text-base font-bold text-slate-900 mt-1">{proforma.customer_name}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{proforma.customer_email}</p>
            {proforma.customer_phone && <p className="text-xs text-slate-600">{proforma.customer_phone}</p>}
            {proforma.customer_address && <p className="text-xs text-slate-600 mt-1">{proforma.customer_address}</p>}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PAYMENT TERMS & INSTRUCTIONS:</p>
            <p className="text-xs font-semibold text-slate-800 mt-1">{proforma.payment_terms || "Bank Wire / Mobile Money"}</p>
            <p className="text-xs text-slate-600 mt-1">
              Bank: CRDB Bank PLC (USD/TZS)<br />
              Account: 0150829182300<br />
              Vodacom M-Pesa Lipa: +255 623 893 383
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden my-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 font-bold w-12 text-center">#</th>
                <th className="p-3 font-bold">Item Description</th>
                <th className="p-3 font-bold text-center w-20">Qty</th>
                <th className="p-3 font-bold text-right w-32">Unit Price (TZS)</th>
                <th className="p-3 font-bold text-right w-36">Total (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {proforma.items.map((item, idx) => {
                const itemTotal = (item.quantity || 1) * (item.price || 0)
                return (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      {item.description && <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                    <td className="p-3 text-right text-slate-700">{item.price.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{itemTotal.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start my-6 gap-6">
          <div className="max-w-md text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Important Notice & Terms:</p>
            <p className="leading-relaxed">
              This is an official commercial Proforma Invoice. Scan the QR code for instant digital verification.
            </p>
            {proforma.notes && (
              <p className="mt-2 text-slate-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <span className="font-semibold">Special Instructions:</span> {proforma.notes}
              </p>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">TZS {subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 py-1 border-b border-slate-100">
                <span>Discount:</span>
                <span className="font-semibold">-TZS {discount.toLocaleString()}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                <span>VAT ({proforma.tax_rate}%):</span>
                <span className="font-semibold text-slate-900">TZS {taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 p-2 bg-slate-100 rounded-lg border border-slate-200">
              <span>Grand Total:</span>
              <span className="text-teal-700">TZS {proforma.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Computerized Stamp */}
      <div className="border-t border-slate-200 pt-6 mt-6 flex justify-between items-end text-xs text-slate-500 relative z-10">
        <div>
          <p className="font-bold text-slate-800">QuardCube Labs Commercial Directorate</p>
          <p className="font-mono text-[10px] mt-0.5">AUTH-HASH: QC-PI-{proforma.proforma_number}</p>
        </div>

        <div className="flex items-center gap-6">
          <QuardCubeStamp
            date={proforma.created_at}
            receiptNumber={proforma.proforma_number}
            title="QUARDCUBE LABS LIMITED"
            status="OFFICIAL ESTIMATE"
            color="teal"
          />

          <div className="text-right">
            <div className="h-8 w-28 border-b border-slate-400 mb-1 ml-auto"></div>
            <p className="font-semibold text-slate-800 text-[11px]">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. TEMPLATE: MINIMALIST TECH (Sleek Slate & Teal with Logo & Seal)
export function MinimalistTechProforma({ proforma }: { proforma: AdminProformaInvoice }) {
  const qrVerificationValue = `https://quardcubelabs.co.tz/verify?type=proforma&doc=${proforma.proforma_number}&total=${proforma.total}`

  return (
    <div className="bg-slate-950 text-slate-100 p-8 sm:p-10 rounded-2xl shadow-xl font-sans max-w-4xl mx-auto min-h-[950px] flex flex-col justify-between border border-teal-500/30 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <Image src="/turquoise.png" alt="" width={420} height={420} className="object-contain" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start border-b border-teal-500/30 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                QUARDCUBE<span className="text-teal-400">LABS</span>
              </h1>
              <p className="text-xs text-teal-400 font-mono mt-0.5">PROFORMA SPECIFICATION DOCUMENT</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <QuardCubeQRCode value={qrVerificationValue} size={84} darkColor="#0f172a" label="Authenticity" />
            <div className="text-right font-mono">
              <span className="px-3 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded text-xs uppercase font-semibold">
                #{proforma.proforma_number}
              </span>
              <p className="text-xs text-slate-400 mt-2">Issued: {new Date(proforma.created_at).toISOString().split("T")[0]}</p>
              {proforma.valid_until && <p className="text-xs text-amber-400">Expiry: {proforma.valid_until.split("T")[0]}</p>}
            </div>
          </div>
        </div>

        {/* Client block */}
        <div className="grid grid-cols-2 gap-6 my-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div>
            <p className="text-[10px] font-mono text-teal-400 uppercase">Target Entity / Client</p>
            <h4 className="text-sm font-bold text-white mt-1">{proforma.customer_name}</h4>
            <p className="text-slate-400 font-mono">{proforma.customer_email}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-teal-400 uppercase">Terms & Instructions</p>
            <p className="text-slate-200 mt-1">{proforma.payment_terms || "Advance bank wire / mobile money"}</p>
          </div>
        </div>

        {/* Cyber Items Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden my-6 bg-slate-900/50">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 border-b border-slate-800 text-teal-400">
              <tr>
                <th className="p-3 font-semibold">Description</th>
                <th className="p-3 text-center w-20">Qty</th>
                <th className="p-3 text-right w-32">Rate (TZS)</th>
                <th className="p-3 text-right w-36">Valuation (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {proforma.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 text-slate-200">{it.name}</td>
                  <td className="p-3 text-center text-slate-400">{it.quantity}</td>
                  <td className="p-3 text-right text-slate-400">{it.price.toLocaleString()}</td>
                  <td className="p-3 text-right font-bold text-teal-300">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end my-6">
          <div className="w-72 p-4 rounded-xl bg-slate-900 border border-teal-500/30 font-mono space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span>TZS {(proforma.subtotal || proforma.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span className="text-teal-400">Estimated Total:</span>
              <span>TZS {proforma.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-6 mt-6 flex justify-between items-end text-xs text-slate-400 font-mono relative z-10">
        <div>
          <span>QuardCube Digital Architecture</span>
          <p className="text-teal-400 text-[11px] mt-0.5">Secure Transaction Framework</p>
        </div>

        <QuardCubeStamp
          date={proforma.created_at}
          receiptNumber={proforma.proforma_number}
          status="ESTIMATED"
          color="teal"
        />
      </div>
    </div>
  )
}

// 3. TEMPLATE: CLASSIC ENTERPRISE (Formal Document with Turquoise Logo & Official Stamp)
export function ClassicEnterpriseProforma({ proforma }: { proforma: AdminProformaInvoice }) {
  const qrVerificationValue = `https://quardcubelabs.co.tz/verify?type=proforma&doc=${proforma.proforma_number}`

  return (
    <div className="bg-white text-black p-8 sm:p-10 border-2 border-black font-serif max-w-4xl mx-auto min-h-[950px] flex flex-col justify-between relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <Image src="/turquoise.png" alt="" width={420} height={420} className="object-contain" />
      </div>

      <div className="relative z-10">
        <div className="border-b-2 border-black pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <div className="text-left font-sans">
              <h1 className="text-2xl font-black uppercase tracking-widest text-slate-950">QUARDCUBE LABS LIMITED</h1>
              <p className="text-xs uppercase mt-0.5 text-slate-600">24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania • Tel: +255 623 893 383</p>
            </div>
          </div>
          <QuardCubeQRCode value={qrVerificationValue} size={80} label="Verification" />
        </div>

        <div className="text-center my-4">
          <h2 className="text-xl font-bold uppercase underline tracking-wider font-sans">PROFORMA INVOICE</h2>
        </div>

        <div className="flex justify-between text-xs my-3 font-mono">
          <p><span className="font-bold">Doc No:</span> {proforma.proforma_number}</p>
          <p><span className="font-bold">Date:</span> {new Date(proforma.created_at).toLocaleDateString()}</p>
        </div>

        <div className="border border-black p-4 text-xs space-y-2 my-4 font-sans">
          <p><span className="font-bold">Issued To:</span> <span className="font-bold uppercase text-sm">{proforma.customer_name}</span></p>
          <p><span className="font-bold">Email / Contact:</span> {proforma.customer_email} {proforma.customer_phone ? `• ${proforma.customer_phone}` : ""}</p>
          <p><span className="font-bold">Terms of Settlement:</span> {proforma.payment_terms || "100% Advance Payment via Bank Settlement"}</p>
        </div>

        <table className="w-full border border-black text-xs my-6 border-collapse font-sans">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border-r border-black p-2.5 text-left">Item Description</th>
              <th className="border-r border-black p-2.5 text-center w-16">Qty</th>
              <th className="border-r border-black p-2.5 text-right w-32">Unit Price (TZS)</th>
              <th className="p-2.5 text-right w-36">Total (TZS)</th>
            </tr>
          </thead>
          <tbody>
            {proforma.items.map((it, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border-r border-black p-2.5 font-medium">{it.name}</td>
                <td className="border-r border-black p-2.5 text-center">{it.quantity}</td>
                <td className="border-r border-black p-2.5 text-right">{it.price.toLocaleString()}</td>
                <td className="p-2.5 text-right font-bold">{((it.quantity || 1) * it.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end my-4 font-sans">
          <div className="w-72 border border-black p-3 space-y-1 text-xs">
            <div className="flex justify-between font-bold text-sm">
              <span>Grand Total:</span>
              <span>TZS {proforma.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 pt-8 text-xs items-end relative z-10 font-sans">
        <div>
          <QuardCubeStamp
            date={proforma.created_at}
            receiptNumber={proforma.proforma_number}
            status="OFFICIAL ESTIMATE"
            color="black"
          />
        </div>
        <div className="text-right">
          <p className="font-bold">For: QUARDCUBE LABS LIMITED</p>
          <div className="h-10"></div>
          <p className="border-t border-black inline-block pt-1 px-4">Authorized Officer</p>
        </div>
      </div>
    </div>
  )
}

// 4. TEMPLATE: EMERALD CYBER (Vivid Emerald with Turquoise Logo & Seal)
export function EmeraldCyberProforma({ proforma }: { proforma: AdminProformaInvoice }) {
  const qrVerificationValue = `https://quardcubelabs.co.tz/verify?type=proforma&doc=${proforma.proforma_number}&total=${proforma.total}`

  return (
    <div className="bg-white text-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans max-w-4xl mx-auto min-h-[950px] flex flex-col justify-between border border-emerald-100 relative">
      <div>
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 relative shrink-0 p-1 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
                <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain p-1" />
              </div>
              <div>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Commercial Estimate
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">PROFORMA INVOICE</h1>
                <p className="text-xs text-emerald-100">QUARDCUBE LABS TANZANIA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <QuardCubeQRCode value={qrVerificationValue} size={84} label="Verify" />
              <div className="text-right font-mono">
                <p className="text-lg font-bold text-emerald-200">#{proforma.proforma_number}</p>
                <p className="text-xs text-emerald-100 mt-0.5">{new Date(proforma.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-500 font-semibold uppercase text-[10px]">Client / Recipient</p>
            <h4 className="text-sm font-bold text-slate-900 mt-1">{proforma.customer_name}</h4>
            <p className="text-slate-600">{proforma.customer_email}</p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-100">
              <tr>
                <th className="py-3 px-2">Item Description</th>
                <th className="py-3 px-2 text-center w-20">Qty</th>
                <th className="py-3 px-2 text-right w-32">Rate (TZS)</th>
                <th className="py-3 px-2 text-right w-36">Total (TZS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proforma.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-2 font-semibold text-slate-900">{it.name}</td>
                  <td className="py-3 px-2 text-center text-slate-600">{it.quantity}</td>
                  <td className="py-3 px-2 text-right text-slate-700">{it.price.toLocaleString()}</td>
                  <td className="py-3 px-2 text-right font-bold text-emerald-700">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-72 p-4 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white space-y-1.5 shadow-md">
              <div className="flex justify-between text-xs text-emerald-100">
                <span>Subtotal</span>
                <span>TZS {(proforma.subtotal || proforma.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-black pt-1 border-t border-emerald-400">
                <span>Total Due</span>
                <span>TZS {proforma.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-end">
        <div>
          <span>QUARDCUBE LABS • Commercial Directorate</span>
          <p className="text-emerald-600 font-semibold text-[11px] mt-0.5">Authorized Estimation Document</p>
        </div>

        <QuardCubeStamp
          date={proforma.created_at}
          receiptNumber={proforma.proforma_number}
          color="emerald"
        />
      </div>
    </div>
  )
}

// 5. TEMPLATE: COMPACT RETAIL (POS / Sales Quotation Style with Logo & Seal)
export function CompactRetailProforma({ proforma }: { proforma: AdminProformaInvoice }) {
  const qrVerificationValue = `https://quardcubelabs.co.tz/verify?type=proforma&doc=${proforma.proforma_number}`

  return (
    <div className="bg-slate-50 text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-300 font-sans max-w-3xl mx-auto min-h-[850px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">QUARDCUBE LABS</h2>
              <p className="text-[11px] text-slate-500">Commercial & Retail Sales Office</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <QuardCubeQRCode value={qrVerificationValue} size={68} label="Verify" />
            <div className="text-right">
              <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-0.5 rounded">PROFORMA</span>
              <p className="text-xs font-mono font-bold mt-1">#{proforma.proforma_number}</p>
            </div>
          </div>
        </div>

        <div className="my-4 text-xs grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="font-bold text-slate-500 text-[10px] uppercase">Billed To</p>
            <p className="font-bold text-slate-800">{proforma.customer_name}</p>
            <p>{proforma.customer_email}</p>
            {proforma.customer_phone && <p>{proforma.customer_phone}</p>}
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="font-bold text-slate-500 text-[10px] uppercase">Details</p>
            <p>Date: {new Date(proforma.created_at).toLocaleDateString()}</p>
            <p>Terms: {proforma.payment_terms || "Advance"}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden my-4">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="p-2.5 text-left">Item</th>
                <th className="p-2.5 text-center w-12">Qty</th>
                <th className="p-2.5 text-right w-28">Price</th>
                <th className="p-2.5 text-right w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {proforma.items.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-medium">{it.name}</td>
                  <td className="p-2.5 text-center">{it.quantity}</td>
                  <td className="p-2.5 text-right">{it.price.toLocaleString()}</td>
                  <td className="p-2.5 text-right font-bold">{((it.quantity || 1) * it.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end my-4">
          <div className="w-64 text-xs space-y-1 p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t">
              <span>Total:</span>
              <span className="text-teal-700">TZS {proforma.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center border-t pt-4 space-y-2 text-center">
        <QuardCubeStamp
          date={proforma.created_at}
          receiptNumber={proforma.proforma_number}
          color="teal"
          variant="boxed"
        />
        <p className="text-[11px] text-slate-400">Thank you for your business inquiries • QuardCube Labs Tanzania</p>
      </div>
    </div>
  )
}

// Master Component Switcher
export default function ProformaTemplateRenderer({ proforma, templateId, printRef }: ProformaTemplateProps) {
  const activeTemplate = templateId || proforma.template_id || "modern-corporate"

  return (
    <div ref={printRef} className="w-full">
      {activeTemplate === "modern-corporate" && <ModernCorporateProforma proforma={proforma} />}
      {activeTemplate === "minimalist-tech" && <MinimalistTechProforma proforma={proforma} />}
      {activeTemplate === "classic-enterprise" && <ClassicEnterpriseProforma proforma={proforma} />}
      {activeTemplate === "emerald-cyber" && <EmeraldCyberProforma proforma={proforma} />}
      {activeTemplate === "compact-retail" && <CompactRetailProforma proforma={proforma} />}
    </div>
  )
}
