"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { ThemedDatePicker } from "@/components/admin"
import { generateCustomReportData, type GenerateReportRequest } from "@/lib/reports-actions"
import type { ReportData } from "@/lib/real-reports-generator"
import { printReportDocument } from "@/lib/print-report"
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Printer, 
  FileSpreadsheet, 
  Code, 
  Sliders, 
  PieChart as PieIcon,
  Briefcase,
  TrendingUp,
  Eye,
  FileCode2,
  TableProperties,
  Lightbulb,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  Activity,
  Shield,
  Zap,
  Target,
  Clock,
  Award,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Lock
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts"

type ReportCategory = 'comprehensive' | 'sales' | 'financial' | 'analytics' | 'products' | 'operations'
type ExportFormat = 'pdf' | 'csv' | 'json' | 'txt'

export default function ReportsPage() {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  // Report Builder State
  const [category, setCategory] = useState<ReportCategory>('comprehensive')

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const catParam = params.get('category') as ReportCategory | null
      if (catParam && ['comprehensive', 'sales', 'financial', 'analytics', 'products', 'operations'].includes(catParam)) {
        setCategory(catParam)
      }
    }
  }, [])

  const [customTitle, setCustomTitle] = useState("")
  const [dateRange, setDateRange] = useState("30d")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeRawData, setIncludeRawData] = useState(true)
  const [includeExecutiveNotes, setIncludeExecutiveNotes] = useState(true)

  // Generation status & generated report data
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeDownloadFormat, setActiveDownloadFormat] = useState<ExportFormat | null>(null)
  const [generatedReport, setGeneratedReport] = useState<ReportData | null>(null)
  const [downloadCount, setDownloadCount] = useState(0)
  const [tableSearchTerm, setTableSearchTerm] = useState("")

  // Category Configuration definitions
  const categoryOptions = [
    {
      id: 'comprehensive' as const,
      label: 'Executive Strategic Intelligence',
      description: 'Unified cross-functional audit: Sales, Financials, Invoices, Quotations, Products & Operations',
      icon: Sparkles,
      color: 'teal'
    },
    {
      id: 'sales' as const,
      label: 'Commercial & Sales Velocity',
      description: 'Order intake, customer purchasing behavior, checkout completion, and gross margin trends',
      icon: ShoppingCart,
      color: 'navy'
    },
    {
      id: 'financial' as const,
      label: 'Financial Ledger & Liquidity',
      description: 'Gross revenue inflow, receivables aging, invoice collection rate, and working capital health',
      icon: DollarSign,
      color: 'teal'
    },
    {
      id: 'analytics' as const,
      label: 'Customer Cohorts & Lifetime Value',
      description: 'Client spending concentration, institutional retention, account tiering, and buying patterns',
      icon: Users,
      color: 'navy'
    },
    {
      id: 'products' as const,
      label: 'Product Catalog & Inventory Turnover',
      description: 'SKU sales velocity, unit distribution, top revenue drivers, and catalog liquidity metrics',
      icon: BarChart3,
      color: 'teal'
    },
    {
      id: 'operations' as const,
      label: 'Operations, Delivery & Engineering',
      description: 'Client project delivery milestones, corporate service lines, talent pipeline, and thought leadership',
      icon: Briefcase,
      color: 'navy'
    }
  ]

  // Helper: Core compile report function
  const compileReport = async (overrideFormat?: ExportFormat): Promise<ReportData | null> => {
    if (dateRange === 'custom' && (!startDate || !endDate)) {
      toast({
        title: "Missing Date Range",
        description: "Please specify both Start Date and End Date for the custom range.",
        variant: "destructive"
      })
      return null
    }

    setIsGenerating(true)
    try {
      const requestParams: GenerateReportRequest = {
        title: customTitle.trim() || undefined,
        category,
        dateRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format: overrideFormat || format,
        includeCharts
      }

      const res = await generateCustomReportData(requestParams)

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to generate report")
      }

      setGeneratedReport(res.data)
      return res.data
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err?.message || "An error occurred while building the report.",
        variant: "destructive"
      })
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  // Auto-load initial report on mount or category change
  useEffect(() => {
    compileReport()
  }, [category])

  // Handler: Generate Report button click
  const handleGenerateReport = async () => {
    const data = await compileReport()
    if (data) {
      toast({
        title: "Executive Report Compiled",
        description: `${data.title} is verified and ready to review.`,
      })
      setTimeout(() => {
        printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    }
  }

  // Handler: Instant Download in chosen format
  const handleInstantDownload = async (chosenFormat: ExportFormat = format) => {
    setActiveDownloadFormat(chosenFormat)
    try {
      let reportToDownload = generatedReport
      if (!reportToDownload) {
        toast({
          title: "Compiling Report...",
          description: `Generating ${chosenFormat.toUpperCase()} document from live metrics...`,
        })
        reportToDownload = await compileReport(chosenFormat)
      }

      if (!reportToDownload) return

      executeDownload(chosenFormat, reportToDownload)
    } finally {
      setActiveDownloadFormat(null)
    }
  }

  // Execute download or print dialog with provided report data
  const executeDownload = (chosenFormat: ExportFormat, report: ReportData) => {
    setDownloadCount(prev => prev + 1)
    const baseFileName = `${report.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`

    if (chosenFormat === 'pdf') {
      printReportDocument(report)
      toast({
        title: "Print / PDF Preview Ready",
        description: "Review or save as PDF in your print preview window.",
      })
      return
    }

    if (chosenFormat === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2))
      triggerFileDownload(dataStr, `${baseFileName}.json`)
      return
    }

    if (chosenFormat === 'txt') {
      let text = `========================================================================\n`
      text += `QUARDCUBE LABS - ADVANCED EXECUTIVE BUSINESS INTELLIGENCE & AUDIT\n`
      text += `========================================================================\n\n`
      text += `REPORT ID:    ${report.auditSeal?.reportId || 'QC-AUDIT-VERIFIED'}\n`
      text += `TITLE:        ${report.title}\n`
      text += `CATEGORY:     ${report.category}\n`
      text += `DATE RANGE:   ${report.summary.dateRange}\n`
      text += `GENERATED AT: ${new Date(report.generatedAt).toLocaleString()}\n`
      text += `ISSUING BODY: ${report.auditSeal?.issuingDivision || 'QuardCube Labs Strategic Intelligence Directorate'}\n`
      text += `TOTAL RECORDS:${report.summary.totalRecords}\n\n`

      if (report.scorecard) {
        text += `------------------------------------------------------------------------\n`
        text += `EXECUTIVE VITALITY & PERFORMANCE SCORECARD\n`
        text += `------------------------------------------------------------------------\n`
        text += `OVERALL HEALTH SCORE:       ${report.scorecard.overallHealthScore}/100 [${report.scorecard.healthRating}]\n`
        text += `REVENUE VELOCITY INDEX:     ${report.scorecard.revenueVelocityScore}/100\n`
        text += `OPERATIONAL EFFICIENCY:     ${report.scorecard.operationalEfficiencyScore}/100\n`
        text += `CUSTOMER TRUST INDEX:       ${report.scorecard.customerTrustIndex}/100\n`
        text += `RISK EXPOSURE RATING:       ${report.scorecard.riskExposureRating}\n`
        text += `VITALITY DIAGNOSIS:         ${report.scorecard.vitalityDiagnosis}\n\n`
      }
      
      if (report.executiveNarrative) {
        text += `------------------------------------------------------------------------\n`
        text += `HUMANOID EXECUTIVE SYNTHESIS & QUALITATIVE DIAGNOSTIC\n`
        text += `------------------------------------------------------------------------\n`
        text += `1. EXECUTIVE VERDICT:\n${report.executiveNarrative.executiveVerdict || report.executiveNarrative.overview}\n\n`
        text += `2. COMMERCIAL TRAJECTORY & MARKET CONTEXT:\n${report.executiveNarrative.overview}\n\n`
        text += `3. REVENUE INFLOW & CAPITAL LIQUIDITY:\n${report.executiveNarrative.revenueAndFinancials}\n\n`
        text += `4. OPERATIONS, ENGINEERING & PIPELINE:\n${report.executiveNarrative.operationsAndDelivery}\n\n`
        text += `5. RISK GOVERNANCE & AUDIT CONTROLS:\n${report.executiveNarrative.riskAndGovernance}\n\n`
      }

      text += `------------------------------------------------------------------------\n`
      text += `KEY PERFORMANCE METRICS & SUMMARY\n`
      text += `------------------------------------------------------------------------\n`
      Object.entries(report.summary.keyMetrics).forEach(([k, v]) => {
        text += `${k.toUpperCase().padEnd(30)}: ${typeof v === 'number' && (k.toLowerCase().includes('revenue') || k.toLowerCase().includes('inflow') || k.toLowerCase().includes('invoices')) ? 'TZS ' + v.toLocaleString() : v}\n`
      })

      if (report.kpiExplanations && report.kpiExplanations.length > 0) {
        text += `\n------------------------------------------------------------------------\n`
        text += `KEY PERFORMANCE INDICATORS (KPI) DRIVER ANALYSIS\n`
        text += `------------------------------------------------------------------------\n`
        report.kpiExplanations.forEach(kpi => {
          text += `* ${kpi.label} (${kpi.value}) [${kpi.status.toUpperCase()}]\n  Analysis:  ${kpi.analysis}\n  Benchmark: ${kpi.benchmark || 'N/A'}\n  Driver:    ${kpi.driver || 'N/A'}\n\n`
        })
      }

      if (report.strategicRecommendations && report.strategicRecommendations.length > 0) {
        text += `------------------------------------------------------------------------\n`
        text += `STRATEGIC ACTION ROADMAP & IMPACT MATRIX\n`
        text += `------------------------------------------------------------------------\n`
        report.strategicRecommendations.forEach(rec => {
          text += `[${rec.priority.toUpperCase()} PRIORITY | ${rec.timeline || 'Immediate'}] ${rec.domain} - ${rec.title}\n  Action:          ${rec.recommendation}\n  Expected Impact: ${rec.expectedImpact || 'High leverage'}\n  Risk Level:      ${rec.riskLevel || 'Low'}\n\n`
        })
      }

      if (report.auditSeal) {
        text += `------------------------------------------------------------------------\n`
        text += `EXECUTIVE AUDIT SIGN-OFF & GOVERNANCE COMPLIANCE\n`
        text += `------------------------------------------------------------------------\n`
        text += `SIGNING OFFICER:      ${report.auditSeal.officer}\n`
        text += `COMPLIANCE DIGEST:    ${report.auditSeal.complianceHash}\n`
        text += `VERIFICATION STATUS:  ${report.auditSeal.verificationStatus}\n`
        text += `TIMESTAMP:            ${report.auditSeal.timestamp}\n\n`
      }

      text += `========================================================================\n`
      text += `END OF INTELLIGENCE AUDIT - STRICTLY CONFIDENTIAL\n`
      text += `========================================================================\n`

      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      triggerFileDownload(dataStr, `${baseFileName}.txt`)
      return
    }

    if (chosenFormat === 'csv') {
      let csv = `Report Title,${report.title}\n`
      csv += `Category,${report.category}\n`
      csv += `Generated At,${report.generatedAt}\n`
      csv += `Date Range,${report.summary.dateRange}\n`
      csv += `Total Records,${report.summary.totalRecords}\n`
      if (report.scorecard) {
        csv += `Overall Health Score,${report.scorecard.overallHealthScore}/100\n`
        csv += `Health Rating,${report.scorecard.healthRating}\n`
      }
      csv += `\n`
      
      csv += `Key Metric,Value\n`
      Object.entries(report.summary.keyMetrics).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`
      })

      if (report.data?.orders && Array.isArray(report.data.orders) && report.data.orders.length > 0) {
        csv += `\nOrders Dataset\n`
        csv += `Order ID,Customer,Email,Total (TSH),Status,Date\n`
        report.data.orders.forEach((o: any) => {
          csv += `"${o.order_number || o.id}","${o.customer_name || o.customerName || ''}","${o.customer_email || o.customerEmail || ''}","${o.total || 0}","${o.status || ''}","${o.created_at || ''}"\n`
        })
      }

      if (report.data?.invoices && Array.isArray(report.data.invoices) && report.data.invoices.length > 0) {
        csv += `\nInvoices Dataset\n`
        csv += `Invoice Number,Client,Amount (TSH),Status,Due Date,Date\n`
        report.data.invoices.forEach((i: any) => {
          csv += `"${i.invoice_number || i.id}","${i.client_name || ''}","${i.amount || 0}","${i.status || ''}","${i.due_date || ''}","${i.created_at || ''}"\n`
        })
      }

      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
      triggerFileDownload(dataStr, `${baseFileName}.csv`)
    }
  }

  const triggerFileDownload = (uri: string, filename: string) => {
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", uri)
    downloadAnchor.setAttribute("download", filename)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast({
      title: "Download Started",
      description: `Saved ${filename}`,
    })
  }

  const formatMoney = (amount: number | string | undefined) => {
    const num = Number(amount) || 0
    return `TZS ${num.toLocaleString()}`
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Executive Studio Banner */}
      <div className={cn(
        "no-print p-5 sm:p-7 rounded-2xl sm:rounded-3xl border-0 shadow-lg transition-all duration-300 relative overflow-hidden",
        isDark ? "bg-[#0a1033] text-white" : "bg-teal text-navy"
      )}>
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-navy text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 shadow-sm border border-white/20">
                <Sparkles className="h-3 w-3 mr-1 text-teal inline animate-pulse" />
                Executive Intelligence Hub
              </Badge>
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-navy dark:text-teal-300 border-navy/30 dark:border-teal/30 bg-white/40 dark:bg-white/5">
                Live Data Synchronized
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Enterprise Business <span className="text-white drop-shadow-sm">Intelligence</span>
            </h1>
            <p className={cn("text-xs sm:text-sm font-semibold leading-relaxed", isDark ? "text-teal-200" : "text-navy/90")}>
              Generate high-level qualitative audits, diagnostic scorecards, and strategic executive briefings compiled from active company databases.
            </p>
          </div>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => handleInstantDownload('pdf')}
              disabled={isGenerating}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-11 px-5 shadow-lg text-xs sm:text-sm active:scale-95 transition-all"
            >
              {activeDownloadFormat === 'pdf' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-teal" />
              ) : (
                <Printer className="mr-2 h-4 w-4 text-teal" />
              )}
              Print / Save PDF
            </Button>
            <Button
              onClick={() => handleInstantDownload('csv')}
              disabled={isGenerating}
              className="bg-white hover:bg-slate-100 text-navy font-bold rounded-xl h-11 px-4 shadow-md text-xs sm:text-sm active:scale-95 transition-all"
            >
              {activeDownloadFormat === 'csv' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              )}
              Excel (.csv)
            </Button>
            <Button
              onClick={() => handleInstantDownload('txt')}
              disabled={isGenerating}
              variant="outline"
              className={cn(
                "font-bold rounded-xl h-11 px-3 text-xs border shadow-sm",
                isDark ? "bg-[#0c1438] border-teal/40 text-teal-300 hover:bg-teal-400/20" : "bg-teal-50 border-navy/20 text-navy hover:bg-white"
              )}
            >
              {activeDownloadFormat === 'txt' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
              ) : (
                <FileText className="h-4 w-4 text-amber-500" />
              )}
              <span className="ml-1.5 hidden sm:inline">Executive Brief (.txt)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Report Builder Configuration */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Domain Focus & Timeline Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Category Selection */}
          <Card className={cn(
            "rounded-2xl transition-all duration-300",
            isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                  1
                </div>
                <div>
                  <CardTitle className={cn("text-base font-bold", isDark ? "text-white" : "text-navy")}>
                    Select Intelligence Domain & Scope
                  </CardTitle>
                  <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                    Choose an operational pillar or compile a multi-dimensional enterprise audit
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryOptions.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = category === opt.id

                  return (
                    <div
                      key={opt.id}
                      onClick={() => setCategory(opt.id)}
                      className={cn(
                        "p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-3 select-none",
                        isSelected
                          ? isDark
                            ? "border-teal-400 bg-teal-400/15 shadow-md shadow-teal-950/40"
                            : "border-navy bg-navy/5 shadow-md"
                          : isDark
                            ? "border-teal/15 bg-white/5 hover:border-teal/40 hover:bg-white/10"
                            : "border-navy/10 bg-slate-50 hover:border-navy/30 hover:bg-white"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border mt-0.5", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20")}>
                        <Icon className="h-4 w-4 text-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-navy")}>
                            {opt.label}
                          </h4>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-teal flex-shrink-0 ml-1" />
                          )}
                        </div>
                        <p className={cn("text-[11px] leading-relaxed mt-1 line-clamp-2", isDark ? "text-slate-300" : "text-navy/70")}>
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Timeframe & Parameter Settings */}
          <Card className={cn(
            "rounded-2xl transition-all duration-300",
            isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                  2
                </div>
                <div>
                  <CardTitle className={cn("text-base font-bold", isDark ? "text-white" : "text-navy")}>
                    Report Parameters & Timeline
                  </CardTitle>
                  <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                    Configure timeline filter, document naming, and qualitative diagnostic sections
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
              <div className="space-y-1.5">
                <Label className={cn("text-xs font-bold uppercase", isDark ? "text-teal-300" : "text-navy")}>
                  Custom Report Title (Optional)
                </Label>
                <Input
                  placeholder="e.g. QuardCube Labs Q3 Financial & Strategic Performance Audit"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className={cn(
                    "rounded-xl border border-teal text-xs sm:text-sm h-10",
                    isDark ? "bg-[#0c1438] text-white placeholder:text-slate-400" : "bg-white text-navy placeholder:text-navy/40"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={cn("text-xs font-bold uppercase", isDark ? "text-teal-300" : "text-navy")}>
                    Date Range Filter
                  </Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className={cn(
                      "rounded-xl border border-teal text-xs sm:text-sm h-10",
                      isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
                    )}>
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days (Weekly Diagnostic)</SelectItem>
                      <SelectItem value="30d">Last 30 Days (Monthly Executive Review)</SelectItem>
                      <SelectItem value="90d">Last 90 Days (Quarterly Audit)</SelectItem>
                      <SelectItem value="1y">Last 365 Days (Annual Performance)</SelectItem>
                      <SelectItem value="custom">Custom Date Window</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className={cn("text-xs font-bold uppercase", isDark ? "text-teal-300" : "text-navy")}>
                    Default Export Format
                  </Label>
                  <Select value={format} onValueChange={(val) => setFormat(val as ExportFormat)}>
                    <SelectTrigger className={cn(
                      "rounded-xl border border-teal text-xs sm:text-sm h-10",
                      isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
                    )}>
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document (Print / Archive)</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet (Excel / Google Sheets)</SelectItem>
                      <SelectItem value="json">JSON Raw Telemetry (API / Data Systems)</SelectItem>
                      <SelectItem value="txt">Formatted Plain Text (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {dateRange === 'custom' && (
                <div className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border transition-all",
                  isDark ? "bg-[#080d2a] border-teal/30" : "bg-teal-50/70 border-navy/15"
                )}>
                  <div className="space-y-1.5">
                    <Label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy")}>
                      Start Date
                    </Label>
                    <ThemedDatePicker
                      label="Select Start Date"
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Choose start date..."
                      maxDate={endDate || undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy")}>
                      End Date
                    </Label>
                    <ThemedDatePicker
                      label="Select End Date"
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Choose end date..."
                      minDate={startDate || undefined}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-navy/10 dark:border-teal/10">
                <Label className={cn("text-xs font-bold uppercase mb-2 block", isDark ? "text-teal-300" : "text-navy")}>
                  Report Inclusions
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={includeCharts}
                      onCheckedChange={(checked) => setIncludeCharts(Boolean(checked))}
                    />
                    <span className={isDark ? "text-slate-200" : "text-navy"}>Visual Financial Charts</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={includeRawData}
                      onCheckedChange={(checked) => setIncludeRawData(Boolean(checked))}
                    />
                    <span className={isDark ? "text-slate-200" : "text-navy"}>Audited Data Ledgers</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={includeExecutiveNotes}
                      onCheckedChange={(checked) => setIncludeExecutiveNotes(Boolean(checked))}
                    />
                    <span className={isDark ? "text-slate-200" : "text-navy"}>Official Verification Header</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Summary */}
        <div className="space-y-6">
          <Card className={cn(
            "rounded-2xl transition-all duration-300",
            isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className={cn("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Sliders className="h-4 w-4 text-teal" />
                Compilation Summary
              </CardTitle>
              <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Configuration telemetry
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
              <div className={cn(
                "p-3.5 rounded-xl border text-xs space-y-2.5",
                isDark ? "bg-slate-900/60 border-teal/15" : "bg-slate-50 border-navy/10"
              )}>
                <div className="flex justify-between items-center">
                  <span className={cn("font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>Domain:</span>
                  <span className={cn("font-bold capitalize", isDark ? "text-white" : "text-navy")}>{category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>Timeline:</span>
                  <span className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                    {dateRange === 'custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : dateRange.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>Target Format:</span>
                  <Badge className="bg-navy text-white text-[10px] font-bold uppercase">
                    {format}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn("font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>Data Source:</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Production DB
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-11 shadow-md active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-teal" />
                    Compiling Live Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-teal" />
                    Generate Executive Report
                  </>
                )}
              </Button>

              <p className={cn("text-[11px] text-center font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                Generates verifiable qualitative and statistical audits for executive leadership
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Generated Report Canvas */}
      <div ref={printRef} className="space-y-6 pt-4">
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-navy/10 dark:border-teal/10">
          <div>
            <h2 className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Eye className="h-5 w-5 text-teal" />
              Verified Report Document Preview
            </h2>
            <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              Official executive output ready for distribution, board presentation, and audit archiving
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleInstantDownload('pdf')}
              disabled={isGenerating}
              className="bg-teal hover:bg-teal/80 text-navy font-bold rounded-xl h-9 px-3.5 text-xs shadow-sm active:scale-95 transition-all"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleInstantDownload('csv')}
              disabled={isGenerating}
              className={cn(
                "font-bold rounded-xl h-9 px-3.5 text-xs border-2 active:scale-95 transition-all",
                isDark ? "border-teal/30 text-teal-300 hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
              )}
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isGenerating && (
          <div className={cn(
            "p-12 rounded-2xl border text-center space-y-4 shadow-md transition-all duration-300 animate-pulse",
            isDark ? "bg-[#070b24] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="w-12 h-12 rounded-full bg-teal/20 text-teal flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base">Synthesizing Qualitative Diagnostic & Telemetry...</h3>
              <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Connecting to live databases, calculating vitality scorecards, and compiling humanoid executive synthesis
              </p>
            </div>
          </div>
        )}

        {/* Report Preview Document */}
        {!isGenerating && generatedReport && (
          <div className={cn(
            "print-area p-6 sm:p-10 rounded-2xl sm:rounded-3xl transition-all duration-300 shadow-xl space-y-8",
            isDark ? "bg-[#070b24] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
          )}>
            {/* Header Document Letterhead with Real Logo */}
            {includeExecutiveNotes && (
              <div className="border-b-2 border-teal/40 pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="/turquoise.png"
                      alt="QuardCube Labs Logo"
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                    />
                    <div>
                      <span className="font-black text-base sm:text-xl tracking-wider uppercase block" style={{ fontFamily: 'var(--font-anton)' }}>
                        QuardCube Labs Ltd
                      </span>
                      <p className={cn("text-xs font-semibold tracking-tight", isDark ? "text-teal-300" : "text-navy/70")}>
                        Enterprise Technology &amp; Cloud Analytics Directorate
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs space-y-0.5">
                    <div className="flex items-center sm:justify-end gap-1.5 font-bold uppercase tracking-wider text-teal">
                      <Lock className="h-3 w-3" />
                      <span>{generatedReport.auditSeal?.classification || 'CONFIDENTIAL INTELLIGENCE'}</span>
                    </div>
                    <p className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                      Ref: <span className="font-mono font-bold text-teal">{generatedReport.auditSeal?.reportId || `QC-REP-${new Date(generatedReport.generatedAt).getFullYear()}-0942`}</span>
                    </p>
                    <p className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                      Issued: {new Date(generatedReport.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Title & Meta Banner */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-teal text-navy text-[10px] font-black uppercase tracking-wider">
                  {generatedReport.category} Domain
                </Badge>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-teal border-teal/40">
                  {generatedReport.summary.dateRange}
                </Badge>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight">
                {generatedReport.title}
              </h2>
              <p className={cn("text-xs sm:text-sm font-medium leading-relaxed max-w-3xl", isDark ? "text-slate-300" : "text-navy/80")}>
                {generatedReport.description}
              </p>
            </div>

            {/* A. Executive Vitality Scorecard (Humanoid Health Matrix) */}
            {generatedReport.scorecard && (
              <div className={cn(
                "p-5 sm:p-6 rounded-2xl border-2 transition-all space-y-4",
                isDark 
                  ? "bg-gradient-to-br from-slate-900/90 via-[#0a1438] to-slate-900/90 border-teal/30" 
                  : "bg-gradient-to-br from-teal/10 via-slate-50 to-teal/10 border-navy/20 shadow-md"
              )}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-teal/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal text-navy flex items-center justify-center font-black">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className={cn("text-xs sm:text-sm font-black uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>
                        Executive Vitality &amp; Performance Scorecard
                      </h3>
                      <p className={cn("text-[11px] font-medium", isDark ? "text-teal-300" : "text-navy/70")}>
                        Overall enterprise health index benchmarked against strategic targets
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-teal text-navy text-xs font-black uppercase tracking-wider px-3 py-1 shadow-sm">
                    {generatedReport.scorecard.healthRating}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className={cn("p-3.5 rounded-xl border text-center space-y-1", isDark ? "bg-black/30 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy/60")}>Overall Health</p>
                    <p className="text-2xl sm:text-3xl font-black text-teal drop-shadow-sm">{generatedReport.scorecard.overallHealthScore}<span className="text-xs font-bold text-slate-400">/100</span></p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal h-full rounded-full transition-all duration-500" style={{ width: `${generatedReport.scorecard.overallHealthScore}%` }}></div>
                    </div>
                  </div>

                  <div className={cn("p-3.5 rounded-xl border text-center space-y-1", isDark ? "bg-black/30 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-emerald-400" : "text-navy/60")}>Revenue Velocity</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-500 drop-shadow-sm">{generatedReport.scorecard.revenueVelocityScore}<span className="text-xs font-bold text-slate-400">/100</span></p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${generatedReport.scorecard.revenueVelocityScore}%` }}></div>
                    </div>
                  </div>

                  <div className={cn("p-3.5 rounded-xl border text-center space-y-1", isDark ? "bg-black/30 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-teal-400" : "text-navy/60")}>Operations Efficiency</p>
                    <p className="text-2xl sm:text-3xl font-black text-teal-400 drop-shadow-sm">{generatedReport.scorecard.operationalEfficiencyScore}<span className="text-xs font-bold text-slate-400">/100</span></p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${generatedReport.scorecard.operationalEfficiencyScore}%` }}></div>
                    </div>
                  </div>

                  <div className={cn("p-3.5 rounded-xl border text-center space-y-1", isDark ? "bg-black/30 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", isDark ? "text-amber-400" : "text-navy/60")}>Customer Trust</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-sm">{generatedReport.scorecard.customerTrustIndex}<span className="text-xs font-bold text-slate-400">/100</span></p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${generatedReport.scorecard.customerTrustIndex}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-teal/15 flex items-start gap-2">
                  <Activity className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <p className={cn("text-xs font-medium leading-relaxed", isDark ? "text-teal-200" : "text-navy/80")}>
                    <strong className="text-teal font-bold uppercase">Vitality Diagnosis:</strong> {generatedReport.scorecard.vitalityDiagnosis}
                  </p>
                </div>
              </div>
            )}

            {/* B. Executive Leadership Verdict */}
            {generatedReport.executiveNarrative?.executiveVerdict && (
              <div className={cn(
                "p-5 rounded-2xl border-l-4 border-teal bg-teal/10 dark:bg-teal-950/30 space-y-2",
                isDark ? "border-teal text-white" : "border-teal text-navy"
              )}>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal">Executive Verdict &amp; Leadership Synthesis</h4>
                </div>
                <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                  "{generatedReport.executiveNarrative.executiveVerdict}"
                </p>
              </div>
            )}

            {/* C. Key Metrics Grid */}
            <div>
              <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                <TrendingUp className="h-4 w-4 text-teal" />
                Key Enterprise Metrics Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(generatedReport.summary.keyMetrics).map(([key, value], idx) => {
                  const label = key.replace(/([A-Z])/g, ' $1').trim()
                  const isMoney = key.toLowerCase().includes('revenue') || key.toLowerCase().includes('spent') || key.toLowerCase().includes('value') || key.toLowerCase().includes('settled') || key.toLowerCase().includes('quotes') || key.toLowerCase().includes('inflow') || key.toLowerCase().includes('invoices')

                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        isDark ? "bg-white/5 border-teal/15" : "bg-slate-50 border-navy/10"
                      )}
                    >
                      <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate mb-1", isDark ? "text-teal-400/80" : "text-navy/60")}>
                        {label}
                      </p>
                      <p className={cn("text-base sm:text-lg lg:text-xl font-black truncate", isDark ? "text-white" : "text-navy")}>
                        {typeof value === 'number' && isMoney ? formatMoney(value) : String(value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* D. 4-Quadrant Humanoid Strategic Diagnostic Narrative */}
            {generatedReport.executiveNarrative && (
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-teal/25 bg-gradient-to-br from-teal/10 via-transparent to-navy/10 dark:from-teal/15 dark:to-slate-900/80 space-y-5">
                <div className="flex items-center justify-between border-b border-teal/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-teal" />
                    <h3 className={cn("text-xs sm:text-sm font-black uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>
                      Humanoid Qualitative Diagnosis &amp; Domain Analysis
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal border-teal/40">
                    Comprehensive
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div className={cn("p-4 rounded-xl border space-y-2", isDark ? "bg-slate-900/60 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className="font-black text-teal uppercase text-[11px] flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      1. Commercial Momentum &amp; Market Dynamics
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.overview}
                    </p>
                  </div>

                  <div className={cn("p-4 rounded-xl border space-y-2", isDark ? "bg-slate-900/60 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className="font-black text-emerald-500 uppercase text-[11px] flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      2. Revenue Inflow &amp; Capital Liquidity
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.revenueAndFinancials}
                    </p>
                  </div>

                  <div className={cn("p-4 rounded-xl border space-y-2", isDark ? "bg-slate-900/60 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className="font-black text-teal-400 uppercase text-[11px] flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      3. Engineering Throughput &amp; Operational Delivery
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.operationsAndDelivery}
                    </p>
                  </div>

                  <div className={cn("p-4 rounded-xl border space-y-2", isDark ? "bg-slate-900/60 border-teal/20" : "bg-white border-navy/10 shadow-sm")}>
                    <p className="font-black text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      4. Risk Governance &amp; Compliance Oversight
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.riskAndGovernance}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* E. Departmental Functional Insights */}
            {generatedReport.departmentalInsights && generatedReport.departmentalInsights.length > 0 && (
              <div className="space-y-3">
                <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                  <Briefcase className="h-4 w-4 text-teal" />
                  Departmental Operational Deep-Dive
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedReport.departmentalInsights.map((dept, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border space-y-3",
                        isDark ? "bg-slate-950/60 border-teal/20" : "bg-slate-50 border-navy/10 shadow-sm"
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-navy/10 dark:border-teal/15 pb-2">
                        <span className={cn("font-black text-xs uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>
                          {dept.department}
                        </span>
                        <Badge className="bg-teal text-navy text-[10px] font-black">
                          {dept.healthScore}/100 Health
                        </Badge>
                      </div>
                      <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                        {dept.summary}
                      </p>
                      
                      <div className="space-y-1.5 text-[11px]">
                        <div>
                          <strong className="text-emerald-500 font-bold block mb-0.5">Key Strengths:</strong>
                          <ul className="list-disc list-inside text-slate-400 dark:text-slate-300 space-y-0.5">
                            {dept.strengths.map((s, sIdx) => <li key={sIdx}>{s}</li>)}
                          </ul>
                        </div>
                        {dept.vulnerabilities.length > 0 && (
                          <div>
                            <strong className="text-amber-500 font-bold block mb-0.5">Focus Areas / Risks:</strong>
                            <ul className="list-disc list-inside text-slate-400 dark:text-slate-300 space-y-0.5">
                              {dept.vulnerabilities.map((v, vIdx) => <li key={vIdx}>{v}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="pt-1 text-teal font-semibold">
                          <strong>Strategic Directive:</strong> {dept.strategicAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* F. Key Performance Drivers & Evaluation Context (KPI Deep Dive) */}
            {generatedReport.kpiExplanations && generatedReport.kpiExplanations.length > 0 && (
              <div className="p-5 rounded-2xl border border-navy/10 dark:border-teal/20 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between border-b border-navy/10 dark:border-teal/15 pb-2.5">
                  <h4 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                    <Activity className="h-4 w-4 text-teal" />
                    Key Performance Indicators &amp; Benchmark Context
                  </h4>
                  <span className="text-[11px] font-semibold text-teal">Diagnostic Matrix</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {generatedReport.kpiExplanations.map((kpi, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all",
                        isDark ? "bg-slate-950/60 border-teal/15" : "bg-white border-navy/10 shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={cn("text-xs font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                          {kpi.label}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-bold uppercase py-0 px-2 shrink-0",
                            kpi.status === 'positive' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                            kpi.status === 'attention' ? "bg-rose-500/10 text-rose-500 border-rose-500/30" :
                            "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          )}
                        >
                          {kpi.value}
                        </Badge>
                      </div>
                      <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                        {kpi.analysis}
                      </p>
                      {(kpi.benchmark || kpi.driver) && (
                        <div className="pt-1.5 border-t border-navy/5 dark:border-teal/10 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-semibold gap-2">
                          {kpi.benchmark && <span>Benchmark: <strong className="text-teal">{kpi.benchmark}</strong></span>}
                          {kpi.driver && <span>Driver: <strong className="text-slate-300 dark:text-slate-200">{kpi.driver}</strong></span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* G. Strategic Action Roadmap & Impact Matrix */}
            {generatedReport.strategicRecommendations && generatedReport.strategicRecommendations.length > 0 && (
              <div className="p-5 rounded-2xl border border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                <div className="flex items-center justify-between border-b border-navy/10 dark:border-teal/15 pb-2.5">
                  <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    Strategic Action Roadmap &amp; Prioritization
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-400">Prescriptive Directives</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {generatedReport.strategicRecommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-xl border text-xs space-y-2 flex flex-col justify-between",
                        isDark ? "bg-slate-900/70 border-teal/15" : "bg-white border-navy/10 shadow-sm"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal">
                            {rec.domain}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {rec.timeline && (
                              <Badge variant="outline" className="text-[9px] font-bold uppercase border-teal/30 text-teal">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                {rec.timeline}
                              </Badge>
                            )}
                            <Badge 
                              className={cn(
                                "text-[9px] font-black uppercase py-0 px-2",
                                rec.priority === 'High' ? "bg-rose-500 text-white" :
                                rec.priority === 'Strategic' ? "bg-teal text-navy font-black" :
                                "bg-amber-500 text-navy font-bold"
                              )}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className={cn("font-bold text-xs pt-1", isDark ? "text-white" : "text-navy")}>
                          {rec.title}
                        </p>
                        <p className={cn("font-medium leading-relaxed", isDark ? "text-slate-300" : "text-navy/75")}>
                          {rec.recommendation}
                        </p>
                      </div>

                      {rec.expectedImpact && (
                        <div className="pt-2 border-t border-navy/5 dark:border-teal/10 flex items-center justify-between text-[11px] font-bold text-emerald-500">
                          <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Impact: {rec.expectedImpact}</span>
                          {rec.riskLevel && <span className="text-[10px] text-slate-400 font-semibold">{rec.riskLevel}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* H. Visual Financial Velocity Curve */}
            {includeCharts && (
              <div className="p-5 sm:p-6 rounded-2xl border border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-white/[0.02] space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={cn("text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                      <TrendingUp className="h-4 w-4 text-teal" />
                      Financial Velocity &amp; Monthly Revenue Trajectory
                    </h3>
                    <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-teal-400/80" : "text-navy/60")}>
                      Live historical intake and realization trajectory across operational timeline
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-navy/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-navy/10 dark:border-teal/20 text-xs font-bold text-navy dark:text-teal-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal"></span>
                    <span>Gross Intake (TSH)</span>
                  </div>
                </div>

                <div className="h-72 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        generatedReport.data?.monthlyData
                          ? Object.entries(generatedReport.data.monthlyData).map(([m, val]: any) => {
                              const rev = typeof val === 'object' ? (val.revenue || val.invoiced || val.total || 0) : Number(val) || 0
                              const ord = typeof val === 'object' ? (val.orders || 0) : 0
                              return {
                                month: m,
                                revenue: rev,
                                orders: ord
                              }
                            })
                          : [
                              { month: 'Jan', revenue: 1200000 },
                              { month: 'Feb', revenue: 2400000 },
                              { month: 'Mar', revenue: 1800000 },
                              { month: 'Apr', revenue: 3100000 },
                              { month: 'May', revenue: 2900000 },
                              { month: 'Jun', revenue: 4200000 }
                            ]
                      }
                      margin={{ top: 15, right: 15, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="reportRevenueTrendGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#40E0D0" stopOpacity={0.65} />
                          <stop offset="40%" stopColor="#40E0D0" stopOpacity={0.35} />
                          <stop offset="80%" stopColor="#40E0D0" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#40E0D0" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke={isDark ? "#94a3b8" : "#64748b"}
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => String(value).slice(0, 6)}
                      />
                      <YAxis 
                        stroke={isDark ? "#94a3b8" : "#000080"}
                        fontSize={11}
                        fontWeight={600}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
                          if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
                          return `${value}`
                        }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const val = Number(payload[0].value || 0)
                            return (
                              <div className="bg-teal text-navy p-3.5 rounded-2xl shadow-[0_12px_32px_rgba(0,128,128,0.4)] border-2 border-navy/30 min-w-[160px]">
                                <p className="text-[11px] text-navy font-bold uppercase tracking-wider">{label}</p>
                                <p className="text-base sm:text-lg font-black text-white mt-0.5 drop-shadow-sm">
                                  {formatMoney(val)}
                                </p>
                                <div className="flex items-center gap-1.5 text-xs text-navy font-extrabold mt-1">
                                  <TrendingUp className="h-3.5 w-3.5 inline text-navy stroke-[2.5]" />
                                  <span>Revenue Velocity</span>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                        cursor={{ stroke: '#40E0D0', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#40E0D0"
                        strokeWidth={4.5}
                        fill="url(#reportRevenueTrendGlow)"
                        dot={{ r: 0 }}
                        activeDot={{ 
                          r: 7, 
                          stroke: "#40E0D0", 
                          strokeWidth: 3.5, 
                          fill: "#ffffff" 
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* I. Audited Operational Ledgers */}
            {includeRawData && (
              <div className="space-y-8">
                {/* 1. Orders Section */}
                {generatedReport.data?.orders && Array.isArray(generatedReport.data.orders) && generatedReport.data.orders.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <ShoppingCart className="h-4 w-4 text-teal" />
                        Commercial Orders Ledger ({generatedReport.data.orders.length} total entries)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Sales Ledger</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-black bg-navy text-white">
                          <tr>
                            <th className="p-3 text-white font-black">Order ID</th>
                            <th className="p-3 text-white font-black">Customer</th>
                            <th className="p-3 text-white font-black">Status</th>
                            <th className="p-3 text-right text-white font-black">Total</th>
                            <th className="p-3 text-right text-white font-black">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                          {generatedReport.data.orders.slice(0, 15).map((o: any, idx: number) => (
                            <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                              <td className={cn("p-3 font-mono font-bold", isDark ? "text-teal-300" : "text-teal")}>{o.order_number || o.id?.slice(0, 8)}</td>
                              <td className="p-3 font-medium">{o.customer_name || o.customerName || o.customer_email || 'Customer'}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                                  {o.status || 'pending'}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-bold">{formatMoney(o.total)}</td>
                              <td className="p-3 text-right text-slate-400">
                                {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Invoices Section */}
                {generatedReport.data?.invoices && Array.isArray(generatedReport.data.invoices) && generatedReport.data.invoices.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        Invoices &amp; Accounts Receivables ({generatedReport.data.invoices.length} entries)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Financial Ledger</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-black bg-navy text-white">
                          <tr>
                            <th className="p-3 text-white font-black">Invoice #</th>
                            <th className="p-3 text-white font-black">Client / Account</th>
                            <th className="p-3 text-white font-black">Status</th>
                            <th className="p-3 text-white font-black">Due Date</th>
                            <th className="p-3 text-right text-white font-black">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                          {generatedReport.data.invoices.slice(0, 15).map((inv: any, idx: number) => (
                            <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                              <td className={cn("p-3 font-mono font-bold", isDark ? "text-teal-300" : "text-navy")}>{inv.invoice_number || inv.id?.slice(0, 8)}</td>
                              <td className="p-3 font-medium">{inv.client_name || inv.client_email || 'Client'}</td>
                              <td className="p-3">
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-[10px] uppercase font-bold py-0",
                                    inv.status === 'paid' ? "text-emerald-500 border-emerald-500/30" :
                                    inv.status === 'overdue' ? "text-rose-500 border-rose-500/30" : "text-amber-500 border-amber-500/30"
                                  )}
                                >
                                  {inv.status || 'draft'}
                                </Badge>
                              </td>
                              <td className="p-3 text-slate-400">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Immediate'}</td>
                              <td className="p-3 text-right font-bold text-emerald-500">{formatMoney(inv.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* J. Executive Sign-Off & Cryptographic Verification Seal */}
            {generatedReport.auditSeal && (
              <div className="pt-8 border-t-2 border-teal/40 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-teal font-black uppercase text-[11px]">
                      <Shield className="h-4 w-4" />
                      <span>Executive Governance Verification</span>
                    </div>
                    <p className={cn("font-medium text-[11px]", isDark ? "text-slate-300" : "text-navy/75")}>
                      Signing Officer: <strong className="text-teal font-bold">{generatedReport.auditSeal.officer}</strong>
                    </p>
                    <p className={cn("font-medium text-[11px]", isDark ? "text-slate-300" : "text-navy/75")}>
                      Issuing Body: {generatedReport.auditSeal.issuingDivision}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      Audit Digest: {generatedReport.auditSeal.complianceHash}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end justify-center space-y-2">
                    <div className="border-b-2 border-navy/40 dark:border-teal/40 pb-1 w-52 text-center">
                      <span className="font-serif italic font-bold text-sm tracking-wide text-teal">
                        QuardCube Executive Board
                      </span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 text-[10px] uppercase font-bold py-0.5 px-2.5">
                      ✓ {generatedReport.auditSeal.verificationStatus}
                    </Badge>
                  </div>
                </div>

                <p className="text-[10px] text-center text-slate-400 font-medium pt-2">
                  This business intelligence document contains proprietary commercial telemetry for QuardCube Labs Ltd. Unauthorized reproduction or redistribution is prohibited.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
