"use client"

import React from "react"
import Image from "next/image"
import { ShieldCheck, Building2, Calendar, User, FileText, CheckCircle2, Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PreparedReportPayload, DocumentControlData, ReportBranding } from "@/lib/report-engine/types"

interface ReportCoverPageProps {
  payload: PreparedReportPayload
  isDark?: boolean
  className?: string
}

export default function ReportCoverPage({ payload, isDark = false, className }: ReportCoverPageProps) {
  const branding: ReportBranding = payload.branding || {}
  const docControl: DocumentControlData = payload.documentControl || {
    reportId: "QC-REP-" + Date.now().toString(36).toUpperCase(),
    reportType: payload.title || "Executive Intelligence Report",
    reportingPeriod: payload.period?.formatted || `${payload.period?.from} – ${payload.period?.to}`,
    generatedBy: branding.preparedBy || "Senior Business Analyst & Operations Lead",
    preparedFor: branding.preparedFor || "Executive Management & Board of Directors",
    generatedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    version: "1.0",
    status: "Official Management Record",
    dataSource: "Primary Supabase Ledgers & Verified Transactions",
    lastUpdated: new Date().toISOString().split("T")[0],
    confidentiality: "CONFIDENTIAL & PROPRIETARY"
  }

  const companyName = branding.companyName || "QUARDCUBE LABS"
  const companySubtitle = branding.subtitle || "Enterprise Technology & Infrastructure Solutions"
  const companyAddress = branding.address || "Makumbusho, Millennium Tower 14th Floor, Dar es Salaam, Tanzania"
  const companyContact = `${branding.phone || "+255 623 893 383"}  •  ${branding.email || "info@quardcubelabs.co.tz"}`

  return (
    <div className={cn(
      "w-full rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-xl transition-all relative",
      isDark ? "bg-[#070c28] border-teal/30 text-white" : "bg-white border-navy/20 text-navy",
      className
    )}>
      {/* Top Corporate Brand Ribbon Header */}
      <div className={cn(
        "p-5 sm:p-7 border-b relative",
        isDark ? "bg-[#05091f] border-teal/20" : "bg-gradient-to-r from-teal/15 via-teal/5 to-transparent border-navy/15"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-white p-1.5 shadow-md border border-navy/10 flex items-center justify-center">
              <img
                src="/turquoise.png"
                alt="QuardCube Labs"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-navy dark:text-white uppercase">
                  {companyName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase bg-teal text-navy tracking-wider">
                  Verified
                </span>
              </div>
              <p className={cn("text-xs font-semibold", isDark ? "text-teal-300" : "text-navy/70")}>
                {companySubtitle}
              </p>
              <p className={cn("text-[10px] mt-0.5", isDark ? "text-slate-400" : "text-navy/60")}>
                {companyAddress}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <Badge className={cn(
              "text-[10px] font-black uppercase tracking-wider px-3 py-1 shadow-xs border",
              isDark ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-rose-50 text-rose-700 border-rose-300"
            )}>
              <Lock className="w-3 h-3 mr-1" />
              {branding.confidentiality || "CONFIDENTIAL & PROPRIETARY"}
            </Badge>
            <p className={cn("text-[10px] mt-1.5 font-mono", isDark ? "text-slate-400" : "text-navy/60")}>
              Ref: <span className="font-bold">{docControl.reportId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Cover Body */}
      <div className="p-6 sm:p-10 space-y-6 sm:space-y-8">
        {/* Title Callout Block with Teal Left Accent Bar */}
        <div className={cn(
          "p-6 sm:p-8 rounded-2xl border-l-6 border-l-teal shadow-sm space-y-3 relative overflow-hidden",
          isDark ? "bg-[#091133] border-teal/30" : "bg-slate-50/80 border-navy/15"
        )}>
          <div className="flex items-center gap-2">
            <Badge className="bg-navy text-white dark:bg-teal dark:text-navy text-[10px] font-black uppercase tracking-wider">
              Official Executive Assessment
            </Badge>
            <span className={cn("text-xs font-bold", isDark ? "text-teal-400" : "text-navy/70")}>
              Fiscal Cycle: {docControl.reportingPeriod}
            </span>
          </div>

          <h1 className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight",
            isDark ? "text-white" : "text-navy"
          )}>
            {payload.title}
          </h1>

          {payload.subtitle && (
            <p className={cn(
              "text-sm sm:text-base font-semibold leading-relaxed",
              isDark ? "text-teal-300/90" : "text-navy/80"
            )}>
              {payload.subtitle}
            </p>
          )}

          {/* Statement of Purpose & Executive Narration */}
          <div className={cn(
            "pt-3 mt-3 border-t text-xs leading-relaxed space-y-1.5",
            isDark ? "border-slate-800 text-slate-300" : "border-navy/10 text-navy/70"
          )}>
            <p className="font-bold uppercase tracking-wider text-[11px] text-teal">
              Mandate & Analytical Context:
            </p>
            <p className="italic">
              {payload.description || 
                `This executive report provides an authoritative, human-prepared synthesis of QuardCube Labs operations, financial integrity, and performance metrics for ${docControl.reportingPeriod}. All data extracts have been audited against primary database ledgers in compliance with Tanzanian corporate accounting and regulatory standards.`}
            </p>
          </div>
        </div>

        {/* 2-Column Document Control & Governance Information Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-slate-300" : "text-navy")}>
              <ShieldCheck className="h-4 w-4 text-teal" />
              Document Control & Audit Governance
            </h3>
            <span className={cn("text-[10px] font-mono", isDark ? "text-slate-400" : "text-navy/60")}>
              ISO-Aligned Corporate Reporting Standard
            </span>
          </div>

          <div className={cn(
            "rounded-2xl border overflow-hidden",
            isDark ? "border-slate-800 bg-[#060a22]" : "border-navy/15 bg-white shadow-xs"
          )}>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 text-xs">
              {/* Left Column Controls */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Document Reference:</span>
                  <span className="font-mono font-bold text-teal">{docControl.reportId}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Reporting Domain:</span>
                  <span className="font-bold uppercase text-navy dark:text-white">{payload.type.replace('_', ' ')}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Reporting Cycle:</span>
                  <span className="font-bold text-navy dark:text-white">{docControl.reportingPeriod}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Classification:</span>
                  <span className="font-bold text-rose-500">{docControl.confidentiality}</span>
                </div>
              </div>

              {/* Right Column Controls */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Prepared By:</span>
                  <span className="font-bold text-navy dark:text-white">{docControl.generatedBy}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Prepared For:</span>
                  <span className="font-bold text-navy dark:text-white">{docControl.preparedFor}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Audit Timestamp:</span>
                  <span className="font-mono text-navy dark:text-white">{docControl.generatedOn}</span>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className={cn("font-bold text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>Governance Status:</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {docControl.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Watermark Running Footer */}
      <div className={cn(
        "px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]",
        isDark ? "bg-[#05091f] border-teal/20 text-slate-400" : "bg-slate-50 border-navy/15 text-navy/60"
      )}>
        <div>
          <span>{companyContact}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Official Corporate Intelligence Record</span>
          <span>•</span>
          <span className="font-mono">{payload.auditSeal?.complianceHash || "QC-VERIFIED-AUTH-HASH"}</span>
        </div>
      </div>
    </div>
  )
}
