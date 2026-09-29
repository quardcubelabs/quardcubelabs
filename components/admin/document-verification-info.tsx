"use client"

import React, { useState } from "react"
import { ShieldCheck, Copy, Check, ExternalLink, QrCode, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface DocumentVerificationInfoProps {
  documentType: "invoice" | "quotation" | "receipt" | "proforma"
  documentNumber: string
  verificationToken?: string
  verificationUrl?: string
  status?: string
  className?: string
  isDark?: boolean
}

export default function DocumentVerificationInfo({
  documentType,
  documentNumber,
  verificationToken,
  verificationUrl,
  status = "VALID",
  className,
  isDark = false
}: DocumentVerificationInfoProps) {
  const [copied, setCopied] = useState(false)

  const token = verificationToken || documentNumber
  const publicUrl = verificationUrl || `https://quardcubelabs.co.tz/verify/${token}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success("Verification URL copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      toast.error("Failed to copy URL")
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl p-3.5 border transition-all text-xs",
        isDark
          ? "bg-slate-900/90 border-teal/30 text-slate-200"
          : "bg-slate-50/90 border-slate-200 text-slate-800",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-dashed border-teal/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal/10 text-teal">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider text-[11px] text-teal">
              Document Verification System
            </p>
            <p className="text-[10px] text-slate-500">
              Cryptographically secured via QuardCube authoritative registry
            </p>
          </div>
        </div>

        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            status.toLowerCase().includes("paid") || status.toLowerCase().includes("valid") || status.toLowerCase().includes("accepted")
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : status.toLowerCase().includes("cancel")
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          )}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Verification Token</span>
          <p className="font-mono font-bold text-xs text-teal select-all break-all">
            {token}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase">Verification URL</span>
          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
            {publicUrl}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopyUrl}
          className="h-7 text-[11px] px-2.5 gap-1.5"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy Verification URL"}
        </Button>

        <Button
          type="button"
          size="sm"
          asChild
          className="h-7 text-[11px] px-2.5 gap-1.5 bg-teal text-navy hover:bg-teal/90 font-semibold"
        >
          <a href={`/verify/${token}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3" />
            Open Public Portal
          </a>
        </Button>
      </div>
    </div>
  )
}
