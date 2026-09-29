"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
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
  ArrowRight,
  Sparkles,
  FileCheck2,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { verifyDocumentAction, VerificationResult } from "@/lib/verify-actions"

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const typeParam = searchParams.get("type")
  const docParam = searchParams.get("doc")
  const tokenParam = searchParams.get("token") || searchParams.get("v")

  const [loading, setLoading] = useState<boolean>(false)
  const [manualInput, setManualInput] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // If tokenParam is present in query, redirect to /verify/[token]
  useEffect(() => {
    if (tokenParam) {
      router.push(`/verify/${encodeURIComponent(tokenParam)}`)
    } else if (docParam) {
      // If docParam is provided, redirect to clean verification route
      router.push(`/verify/${encodeURIComponent(docParam)}`)
    }
  }, [tokenParam, docParam, router])

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) {
      setErrorMsg("Please enter a verification code or document number.")
      return
    }
    setErrorMsg(null)
    const cleaned = manualInput.trim()
    router.push(`/verify/${encodeURIComponent(cleaned)}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal selection:text-navy flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-radial from-teal/15 via-indigo-900/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 relative shrink-0">
              <Image 
                src="/turquoise.png" 
                alt="QuardCube Labs" 
                fill 
                className="object-contain" 
              />
            </div>
            <div>
              <span className="font-black tracking-tight text-white text-base group-hover:text-teal transition-colors">
                QUARDCUBE LABS
              </span>
              <span className="block text-[10px] text-teal font-bold uppercase tracking-widest -mt-0.5">
                Document Verification Portal
              </span>
            </div>
          </Link>

          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            Main Site
          </Link>
        </div>
      </header>

      {/* Main Verification Search Portal */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col justify-center space-y-8">
        
        <div className="text-center space-y-3">
          <Badge className="bg-teal/15 text-teal border border-teal/30 text-xs font-bold uppercase tracking-wider px-3.5 py-1">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Official Trust Authority
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Verify a Document
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Enter the secure verification token or scan the QR code printed on your official QuardCube Labs quotation, invoice, or receipt.
          </p>
        </div>

        {/* Search Input Box */}
        <Card className="border-2 border-slate-800 bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleManualSearch} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Verification Code / Document Number
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. a8F72kLm92Qx or INV-2026-00452"
                  value={manualInput}
                  onChange={(e) => {
                    setManualInput(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  className="h-13 bg-slate-950/80 border-2 border-slate-700/80 focus:border-teal rounded-2xl text-base px-4 pr-12 text-white font-medium placeholder:text-slate-500 shadow-inner"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <QrCode className="h-5 w-5" />
                </div>
              </div>
              {errorMsg && (
                <p className="text-xs font-semibold text-red-400 mt-1">
                  {errorMsg}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !manualInput.trim()}
              className="w-full bg-teal hover:bg-teal/90 text-navy font-black rounded-2xl h-12 text-sm uppercase tracking-wider gap-2 shadow-lg"
            >
              <Search className="h-4 w-4" />
              Verify Document Authenticity
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal" />
              256-Bit Cryptographic Registry
            </span>
            <span className="font-semibold text-slate-300">
              Live Server Authority
            </span>
          </div>
        </Card>

        {/* Informative Guidance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
              <QrCode className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Instant QR Scanning</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use your smartphone camera to scan the QR code located on the bottom-right of your document to open verification automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Supported Documents</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifies Commercial Invoices, Service Quotations, Payment Receipts, and Proforma Invoices issued by QuardCube Labs.
            </p>
          </div>
        </div>

        {/* Clear Disclaimer */}
        <p className="text-[11px] text-center text-slate-500 max-w-lg mx-auto leading-relaxed">
          Verified in the QuardCube Labs document system. This portal validates official business records and payment receipts directly from our trust database.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} QuardCube Labs Limited. All rights reserved.</p>
        <p className="text-[10px] text-slate-400 mt-1">Enterprise Intelligence & Cryptographic Document Verification</p>
      </footer>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-teal" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
