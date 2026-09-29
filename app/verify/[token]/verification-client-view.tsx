"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  User, 
  Lock, 
  ExternalLink, 
  Printer, 
  QrCode, 
  ArrowLeft,
  Search,
  Copy,
  BadgeCheck,
  Sparkles,
  Share2,
  Phone,
  Mail,
  MapPin,
  Check,
  RefreshCw
} from "lucide-react"
import type { PublicVerificationResponse } from "@/lib/document-verification"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import QuardCubeStamp from "@/components/ui/quardcube-stamp"

interface Props {
  token: string
  initialResult: PublicVerificationResponse
}

export default function VerificationClientView({ token, initialResult }: Props) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<PublicVerificationResponse>(initialResult)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast({
        title: "Verification URL Copied",
        description: "Official verification link copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  // Format currency
  const formatTzs = (amount?: number) => {
    if (amount === undefined || amount === null) return "TZS 0.00"
    return `TZS ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Format date
  const formatDate = (dStr?: string) => {
    if (!dStr) return "N/A"
    try {
      return new Date(dStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    } catch {
      return dStr
    }
  }

  // Format time
  const formatTime = (dStr?: string) => {
    if (!dStr) return ""
    try {
      return new Date(dStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      })
    } catch {
      return ""
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal selection:text-navy flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-teal/15 via-indigo-900/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation Header */}
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
                Trust & Verification Registry
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/verify">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold rounded-xl border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 gap-1.5"
              >
                <Search className="h-3.5 w-3.5 text-teal" />
                <span className="hidden sm:inline">Search Another</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        
        {/* If document was NOT FOUND / INVALID TOKEN */}
        {!result.verified ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-2 border-red-500/40 bg-red-950/20 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
              <CardContent className="p-6 sm:p-10 text-center space-y-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <XCircle className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>

                <div>
                  <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider px-3 py-1">
                    Authenticity Check Failed
                  </Badge>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
                    DOCUMENT NOT FOUND
                  </h1>
                  <p className="text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                    {result.errorMessage || "We could not verify this document. The verification code is invalid, altered, or does not exist in the official QuardCube Labs document registry."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2 text-xs text-slate-300 max-w-md mx-auto">
                  <p className="font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Security Notice:
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    If you received a document purporting to be from QuardCube Labs with this QR code, please contact our official compliance desk at <a href="mailto:info@quardcubelabs.co.tz" className="text-teal underline">info@quardcubelabs.co.tz</a> immediately.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/verify" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-teal hover:bg-teal/90 text-navy font-black rounded-xl gap-2 h-11 px-6 shadow-md">
                      <Search className="h-4 w-4" />
                      Verify Another Code
                    </Button>
                  </Link>
                  <Link href="/" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-bold rounded-xl h-11 px-6">
                      Return to Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* When document IS VERIFIED */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Top Status Banner */}
            <div className={cn(
              "rounded-3xl border-2 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden",
              result.status === "PAID" || result.status === "VALID"
                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                : result.status === "CANCELLED"
                ? "border-red-500/40 bg-red-950/20 text-red-300"
                : result.status === "EXPIRED" || result.status === "PARTIALLY_PAID"
                ? "border-amber-500/40 bg-amber-950/20 text-amber-300"
                : "border-teal/40 bg-slate-900/80 text-teal"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-inner",
                    result.status === "PAID" || result.status === "VALID"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : result.status === "CANCELLED"
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : result.status === "EXPIRED"
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : "bg-teal/20 border-teal/40 text-teal"
                  )}>
                    {result.status === "CANCELLED" ? (
                      <XCircle className="h-7 w-7" />
                    ) : result.status === "EXPIRED" ? (
                      <Clock className="h-7 w-7" />
                    ) : (
                      <CheckCircle2 className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase tracking-widest font-black opacity-80">
                        {result.documentTypeLabel}
                      </span>
                      <Badge className={cn(
                        "font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 border",
                        result.status === "PAID"
                          ? "bg-emerald-500 text-slate-950 border-emerald-400"
                          : result.status === "CANCELLED"
                          ? "bg-red-500 text-white border-red-400"
                          : result.status === "EXPIRED"
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-teal text-navy border-teal"
                      )}>
                        {result.statusDisplay?.badgeLabel || result.status}
                      </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                      {result.statusDisplay?.title || "VERIFIED DOCUMENT"}
                    </h1>
                  </div>
                </div>

                <div className="sm:text-right shrink-0 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                  <span className="text-[11px] text-slate-400 font-semibold block">Total Valuation</span>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {formatTzs(result.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Description message */}
              <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed font-medium">
                {result.statusDisplay?.description}
              </p>
            </div>

            {/* Document Details Card */}
            <Card className="border-2 border-slate-800 bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl">
              <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal" />
                  <h2 className="font-bold text-sm text-white uppercase tracking-wider">
                    Authoritative Document Metadata
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: #{result.documentNumber}
                </span>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-teal" />
                      Document Number
                    </span>
                    <p className="text-base sm:text-lg font-black text-white tracking-tight font-mono">
                      {result.documentNumber}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-teal" />
                      Client / Entity Name
                    </span>
                    <p className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                      {result.customerName}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-teal" />
                      Issue Date
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {formatDate(result.issueDate)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-teal" />
                      Settlement / Current Status
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        result.status === "PAID" ? "bg-emerald-500" :
                        result.status === "CANCELLED" ? "bg-red-500" :
                        result.status === "EXPIRED" ? "bg-amber-500" : "bg-teal animate-pulse"
                      )} />
                      <p className="text-sm sm:text-base font-bold text-white tracking-tight capitalize">
                        {result.statusDisplay?.badgeLabel || result.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmations List */}
                <div className="p-5 rounded-2xl border border-teal/20 bg-teal/5 space-y-2.5">
                  <h3 className="text-xs font-bold text-teal uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Security & Authenticity Confirmations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-200 pt-1">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Exists in QuardCube Registry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Issued by QuardCube Labs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Verification Successful</span>
                    </div>
                  </div>
                </div>

                {/* Audit & Token Details */}
                <div className="border-t border-slate-800 pt-6 space-y-3 text-xs text-slate-400">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-300">Verification Token:</span>
                      <p className="font-mono text-[11px] text-teal select-all">
                        {result.verificationToken}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="font-semibold text-slate-300">Verified Timestamp:</span>
                      <p className="text-[11px] text-slate-300">
                        {formatDate(result.verifiedAt)} • {formatTime(result.verifiedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[11px]">
                    <div className="flex items-center gap-2">
                      <BadgeCheck className="h-3.5 w-3.5 text-teal" />
                      <span>Total Verifications: <strong className="text-white">{result.scanCount || 1}</strong> times</span>
                    </div>
                    {result.authenticityCert?.sealHash && (
                      <div className="font-mono text-[10px] text-slate-400">
                        Digital Hash: {result.authenticityCert.sealHash}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-10 rounded-xl border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 font-bold gap-1.5 text-xs flex-1 sm:flex-none"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-teal" />}
                    {copied ? "Link Copied!" : "Copy Verification URL"}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handlePrint}
                    className="h-10 rounded-xl bg-teal hover:bg-teal/90 text-navy font-black gap-1.5 text-xs flex-1 sm:flex-none shadow-md"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Confirmation
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Issuer Trust Card */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">{result.issuer.companyName}</p>
                  <p className="text-[11px] text-slate-400">{result.issuer.registeredLocation}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-300">
                <a href={`tel:${result.issuer.contactPhone}`} className="hover:text-teal flex items-center gap-1 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-teal" />
                  {result.issuer.contactPhone}
                </a>
                <a href={`mailto:${result.issuer.contactEmail}`} className="hover:text-teal flex items-center gap-1 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-teal" />
                  Email Desk
                </a>
              </div>
            </div>

            {/* Clear Legal / Institutional Disclaimer */}
            <p className="text-[11px] text-center text-slate-400 max-w-xl mx-auto leading-relaxed">
              This verification record is provided directly from the authoritative QuardCube Labs Document Registry. Verified in the QuardCube Labs document system.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} QuardCube Labs Limited. All rights reserved.</p>
        <p className="text-[10px] text-slate-400 mt-1">Enterprise Intelligence & Cryptographic Document Verification</p>
      </footer>
    </div>
  )
}
