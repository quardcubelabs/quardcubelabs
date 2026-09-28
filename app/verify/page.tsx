"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCheck,
  Building2,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  ExternalLink,
  Printer,
  Search,
  AlertTriangle,
  RefreshCw,
  QrCode,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"
import { verifyDocumentAction, VerificationResult } from "@/lib/verify-actions"

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const typeParam = searchParams.get("type")
  const docParam = searchParams.get("doc")
  const amountParam = searchParams.get("amount") || searchParams.get("total")
  const clientParam = searchParams.get("client") || searchParams.get("customer")

  const [loading, setLoading] = useState<boolean>(true)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [searchedDoc, setSearchedDoc] = useState<string>(docParam || "")
  const [manualInput, setManualInput] = useState<string>("")
  const [scanningStep, setScanningStep] = useState<number>(0)

  const steps = [
    "Reading cryptographic security tokens...",
    "Validating document against QuardCube Trust Registry...",
    "Verifying digital corporate seal & signatures...",
    "Authentication complete"
  ]

  const performVerification = async (type: string | null, doc: string | null, amount: string | null, client: string | null) => {
    setLoading(true)
    setScanningStep(0)

    // Animated verification steps for a rich high-tech experience
    const timer1 = setTimeout(() => setScanningStep(1), 300)
    const timer2 = setTimeout(() => setScanningStep(2), 650)
    const timer3 = setTimeout(() => setScanningStep(3), 1000)

    try {
      const res = await verifyDocumentAction(type, doc, {
        amount: amount || undefined,
        client: client || undefined
      })
      setTimeout(() => {
        setResult(res)
        setLoading(false)
      }, 1200)
    } catch (err) {
      console.error("Verification error:", err)
      setTimeout(() => {
        setResult(null)
        setLoading(false)
      }, 1200)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }

  useEffect(() => {
    if (docParam || typeParam) {
      setSearchedDoc(docParam || "")
      performVerification(typeParam, docParam, amountParam, clientParam)
    } else {
      setLoading(false)
    }
  }, [typeParam, docParam, amountParam, clientParam])

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return
    const cleaned = manualInput.trim()
    router.push(`/verify?doc=${encodeURIComponent(cleaned)}`)
  }

  const getDocTypeLabel = (t: string) => {
    switch (t) {
      case "receipt":
        return "Official Payment Receipt"
      case "proforma":
        return "Proforma Invoice & Estimate"
      case "invoice":
        return "Commercial Tax Invoice"
      case "quotation":
        return "Official Service Quotation"
      case "order":
        return "Customer Sales Order"
      default:
        return "Official Commercial Document"
    }
  }

  const getDocTypeBadgeColor = (t: string) => {
    switch (t) {
      case "receipt":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      case "proforma":
        return "bg-teal-500/15 text-teal-400 border-teal-500/30"
      case "invoice":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
      case "quotation":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30"
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white pb-20">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 relative shrink-0">
              <Image
                src="/turquoise.png"
                alt="QuardCube Labs Logo"
                fill
                className="object-contain transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <div>
              <span className="font-black text-lg text-white tracking-wider">
                QUARDCUBE<span className="text-teal-400">LABS</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Trust & Authenticity Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              SSL 256-Bit Encrypted
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Loading / Scanning Animation */}
        {loading ? (
          <div className="my-16 max-w-lg mx-auto bg-slate-900/90 border border-teal-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-teal-400 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Authenticating Document</h2>
            <p className="text-xs text-slate-400 font-mono min-h-[20px] transition-all">
              {steps[scanningStep] || "Verifying..."}
            </p>

            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((scanningStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : result && result.verified ? (
          /* Verification Success Card */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Authenticity Certificate Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl shadow-emerald-950/40">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/30">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge className="bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider px-3 py-0.5">
                        ✓ Verified Genuine
                      </Badge>
                      <Badge variant="outline" className={getDocTypeBadgeColor(result.documentType)}>
                        {getDocTypeLabel(result.documentType)}
                      </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      AUTHENTICATED OFFICIAL DOCUMENT
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Issued & digitally certified by <strong className="text-slate-200">QuardCube Labs Limited</strong> (Tanzania)
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center hidden sm:block">
                  <QuardCubeStamp
                    date={result.issueDate}
                    receiptNumber={result.documentNumber}
                    title="QUARDCUBE LABS LIMITED"
                    status="VERIFIED"
                    color="emerald"
                  />
                </div>
              </div>

              {/* Security Hash Pill */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-400" />
                  Security Hash: <span className="text-teal-300 font-bold">{result.securityHash}</span>
                </span>
                <span className="text-slate-500">
                  Verification Timestamp: {new Date().toLocaleString("en-GB", { timeZone: "Africa/Dar_es_Salaam" })} EAT
                </span>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Information (2 Columns) */}
              <div className="md:col-span-2 space-y-6">
                <Card className="bg-slate-900/80 border-slate-800 text-slate-200 shadow-lg">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-teal-400" />
                        Document Specification
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-[11px] text-slate-400 font-mono block">Document Reference #</span>
                          <span className="text-base font-bold text-white font-mono mt-0.5 block">
                            {result.documentNumber}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-[11px] text-slate-400 font-mono block">Issue / Settlement Date</span>
                          <span className="text-base font-bold text-white mt-0.5 block">
                            {new Date(result.issueDate).toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-[11px] text-slate-400 font-mono block">Billed / Issued To</span>
                          <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                            {result.customerName}
                          </span>
                          {result.customerEmail && (
                            <span className="text-xs text-slate-400 block mt-0.5">{result.customerEmail}</span>
                          )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="text-[11px] text-slate-400 font-mono block">Authentication Status</span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-1 uppercase font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {result.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Amount Display */}
                    {result.amount > 0 && (
                      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                            {result.documentType === "receipt" ? "Total Settled Amount" : "Document Total Value"}
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                            {result.currency} {result.amount.toLocaleString()}
                          </div>
                        </div>
                        {result.paymentMethod && (
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 font-mono block">Payment Channel</span>
                            <span className="text-sm font-bold text-teal-300 block mt-0.5">{result.paymentMethod}</span>
                            {result.transactionRef && (
                              <span className="text-[10px] font-mono text-slate-400 block">{result.transactionRef}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Items Breakdown if present */}
                    {result.items && result.items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                          Verified Line Items ({result.items.length})
                        </h4>
                        <div className="rounded-xl border border-slate-800 overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                              <tr>
                                <th className="p-2.5">Item</th>
                                <th className="p-2.5 text-center w-16">Qty</th>
                                <th className="p-2.5 text-right w-32">Total ({result.currency})</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {result.items.map((it, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30">
                                  <td className="p-2.5 font-medium text-slate-200">{it.name}</td>
                                  <td className="p-2.5 text-center text-slate-400 font-mono">{it.quantity}</td>
                                  <td className="p-2.5 text-right font-bold text-emerald-400 font-mono">
                                    {((it.quantity || 1) * it.price).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {result.notes && (
                      <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400">
                        <strong className="text-slate-200">Notes / Remarks:</strong> {result.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar / Legal Issuer Info (1 Column) */}
              <div className="space-y-6">
                <Card className="bg-slate-900/80 border-slate-800 text-slate-200 shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      Issuing Authority
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <strong className="text-white text-sm block">QuardCube Labs Limited</strong>
                        <span className="text-slate-400 text-[11px]">Registered Digital Solutions Entity</span>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1.5 text-slate-300">
                        <p className="flex items-start gap-2">
                          <span className="text-slate-500 shrink-0">📍</span>
                          <span>24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-slate-500 shrink-0">📞</span>
                          <a href="tel:+255623893383" className="hover:text-teal-400 font-mono">
                            +255 623 893 383
                          </a>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-slate-500 shrink-0">✉️</span>
                          <a href="mailto:info@quardcubelabs.co.tz" className="hover:text-teal-400">
                            info@quardcubelabs.co.tz
                          </a>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-slate-500 shrink-0">🌐</span>
                          <a href="https://quardcubelabs.co.tz" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400">
                            www.quardcubelabs.co.tz
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="w-full bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-white text-xs flex items-center justify-center gap-2"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Certificate
                      </Button>

                      <Button
                        asChild
                        className="w-full bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs"
                      >
                        <Link href="/">
                          Return to Homepage
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Direct Verification Badge */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/20 text-center space-y-2">
                  <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block">
                    Security Architecture
                  </span>
                  <p className="text-xs text-slate-300">
                    This document was validated against the QuardCube cryptographic hash ledger. Tampering or alterations invalidate its electronic verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Document Not Found / Manual Verification Form */
          <div className="my-10 max-w-xl mx-auto space-y-6">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {searchedDoc ? "Document Record Not Found" : "Document Authenticity Verification"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                {searchedDoc
                  ? `No verified active record was found for document reference "${searchedDoc}". Please verify the number from your document or search below.`
                  : "Enter any official QuardCube Labs document reference number (Receipt, Proforma, Invoice, or Quotation) to authenticate."}
              </p>

              {/* Manual Input Form */}
              <form onSubmit={handleManualSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="e.g. QCL-REC-2026-1234 or QCL-PI-..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-700 text-white text-sm"
                  />
                </div>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold">
                  Verify Now
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span>Support: +255 623 893 383</span>
                <Link href="/" className="text-teal-400 hover:underline flex items-center gap-1">
                  Visit QuardCube Home <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-mono text-slate-300">Loading QuardCube Verification Portal...</span>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
