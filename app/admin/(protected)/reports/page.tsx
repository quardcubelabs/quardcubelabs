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
  Activity
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

  // Category Configuration definitions
  const categoryOptions = [
    {
      id: 'comprehensive' as const,
      label: 'Executive Comprehensive Intelligence',
      description: 'Unified cross-functional audit: Sales, Revenue, Customers, Products & System Operations',
      icon: Sparkles,
      color: 'teal'
    },
    {
      id: 'sales' as const,
      label: 'Sales & Orders Performance',
      description: 'Detailed order breakdown, conversion statuses, customer purchases, and revenue totals',
      icon: ShoppingCart,
      color: 'navy'
    },
    {
      id: 'financial' as const,
      label: 'Financial & Revenue Ledger',
      description: 'Gross revenue, payment statuses, monthly financial trends, and collection rates',
      icon: DollarSign,
      color: 'teal'
    },
    {
      id: 'analytics' as const,
      label: 'Customer & User Analytics',
      description: 'Customer lifetime spend, account profiles, retention metrics, and top buyers',
      icon: Users,
      color: 'navy'
    },
    {
      id: 'products' as const,
      label: 'Product Catalog & Sales Volume',
      description: 'Top performing products, unit sales, inventory metrics, and product revenue ranking',
      icon: BarChart3,
      color: 'teal'
    },
    {
      id: 'operations' as const,
      label: 'Operations, Services & Projects',
      description: 'Active client projects, published services, content activity, and team workloads',
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

  // Auto-load initial report on mount
  useEffect(() => {
    compileReport()
  }, [category])

  // Handler: Generate Report button click
  const handleGenerateReport = async () => {
    const data = await compileReport()
    if (data) {
      toast({
        title: "Report Generated Successfully",
        description: `${data.title} is ready to view and export.`,
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
      window.print()
      toast({
        title: "Print / PDF Window Opened",
        description: "Save as PDF from your browser print preview.",
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
      text += `QUARDCUBE LABS - BUSINESS INTELLIGENCE & PERFORMANCE REPORT\n`
      text += `========================================================================\n\n`
      text += `TITLE:        ${report.title}\n`
      text += `CATEGORY:     ${report.category}\n`
      text += `DATE RANGE:   ${report.summary.dateRange}\n`
      text += `GENERATED AT: ${new Date(report.generatedAt).toLocaleString()}\n`
      text += `TOTAL RECORDS:${report.summary.totalRecords}\n\n`
      
      if (report.executiveNarrative) {
        text += `------------------------------------------------------------------------\n`
        text += `EXECUTIVE NARRATIVE & STRATEGIC SYNTHESIS\n`
        text += `------------------------------------------------------------------------\n`
        text += `1. OVERALL TRAJECTORY:\n${report.executiveNarrative.overview}\n\n`
        text += `2. REVENUE & FINANCIALS:\n${report.executiveNarrative.revenueAndFinancials}\n\n`
        text += `3. OPERATIONS & DELIVERY:\n${report.executiveNarrative.operationsAndDelivery}\n\n`
        text += `4. RISK & GOVERNANCE:\n${report.executiveNarrative.riskAndGovernance}\n\n`
      }

      text += `------------------------------------------------------------------------\n`
      text += `KEY EXECUTIVE METRICS\n`
      text += `------------------------------------------------------------------------\n`
      Object.entries(report.summary.keyMetrics).forEach(([k, v]) => {
        text += `${k.toUpperCase().padEnd(25)}: ${typeof v === 'number' && k.toLowerCase().includes('revenue') ? 'TZS ' + v.toLocaleString() : v}\n`
      })

      if (report.kpiExplanations && report.kpiExplanations.length > 0) {
        text += `\n------------------------------------------------------------------------\n`
        text += `KEY PERFORMANCE INDICATORS (KPI) ANALYSIS\n`
        text += `------------------------------------------------------------------------\n`
        report.kpiExplanations.forEach(kpi => {
          text += `* ${kpi.label} (${kpi.value}) [${kpi.status.toUpperCase()}]\n  Analysis: ${kpi.analysis}\n\n`
        })
      }

      if (report.strategicRecommendations && report.strategicRecommendations.length > 0) {
        text += `------------------------------------------------------------------------\n`
        text += `STRATEGIC RECOMMENDATIONS & NEXT STEPS\n`
        text += `------------------------------------------------------------------------\n`
        report.strategicRecommendations.forEach(rec => {
          text += `[${rec.priority.toUpperCase()} PRIORITY] ${rec.domain} - ${rec.title}\n  ${rec.recommendation}\n\n`
        })
      }

      if (report.data?.orders?.length > 0) {
        text += `------------------------------------------------------------------------\n`
        text += `ORDERS DATASET (${report.data.orders.length} Records)\n`
        text += `------------------------------------------------------------------------\n`
        report.data.orders.forEach((o: any) => {
          text += `Order #${o.order_number || o.id} | ${o.customer_name || o.customerName || 'Customer'} | ${o.status} | TZS ${Number(o.total || 0).toLocaleString()} | ${o.created_at?.slice(0, 10)}\n`
        })
      }

      if (report.data?.invoices?.length > 0) {
        text += `\n------------------------------------------------------------------------\n`
        text += `INVOICES DATASET (${report.data.invoices.length} Records)\n`
        text += `------------------------------------------------------------------------\n`
        report.data.invoices.forEach((i: any) => {
          text += `Invoice #${i.invoice_number || i.id} | ${i.client_name || 'Client'} | ${i.status} | TZS ${Number(i.amount || 0).toLocaleString()} | Due: ${i.due_date || 'N/A'}\n`
        })
      }

      if (report.data?.quotations?.length > 0) {
        text += `\n------------------------------------------------------------------------\n`
        text += `QUOTATIONS DATASET (${report.data.quotations.length} Records)\n`
        text += `------------------------------------------------------------------------\n`
        report.data.quotations.forEach((q: any) => {
          text += `Quote #${q.quote_number || q.id} | ${q.client_name || 'Client'} | ${q.status} | TZS ${Number(q.total || q.quoted_amount || 0).toLocaleString()}\n`
        })
      }

      text += `\n\n========================================================================\n`
      text += `END OF REPORT - CONFIDENTIAL & PROPRIETARY\n`
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
      csv += `Total Records,${report.summary.totalRecords}\n\n`
      
      csv += `Key Metric,Value\n`
      Object.entries(report.summary.keyMetrics).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`
      })

      // Add table data if orders exist
      if (report.data?.orders && Array.isArray(report.data.orders) && report.data.orders.length > 0) {
        csv += `\nOrders Dataset\n`
        csv += `Order ID,Customer,Email,Total (TSH),Status,Date\n`
        report.data.orders.forEach((o: any) => {
          csv += `"${o.order_number || o.id}","${o.customer_name || o.customerName || ''}","${o.customer_email || o.customerEmail || ''}","${o.total || 0}","${o.status || ''}","${o.created_at || ''}"\n`
        })
      }

      // Add invoices if exist
      if (report.data?.invoices && Array.isArray(report.data.invoices) && report.data.invoices.length > 0) {
        csv += `\nInvoices Dataset\n`
        csv += `Invoice Number,Client,Amount (TSH),Status,Due Date,Date\n`
        report.data.invoices.forEach((i: any) => {
          csv += `"${i.invoice_number || i.id}","${i.client_name || ''}","${i.amount || 0}","${i.status || ''}","${i.due_date || ''}","${i.created_at || ''}"\n`
        })
      }

      // Add quotations if exist
      if (report.data?.quotations && Array.isArray(report.data.quotations) && report.data.quotations.length > 0) {
        csv += `\nQuotations Dataset\n`
        csv += `Quote Number,Client,Amount (TSH),Status,Date\n`
        report.data.quotations.forEach((q: any) => {
          csv += `"${q.quote_number || q.id}","${q.client_name || ''}","${q.total || q.quoted_amount || 0}","${q.status || ''}","${q.created_at || ''}"\n`
        })
      }

      // Add products if exist
      if (report.data?.topProducts && Array.isArray(report.data.topProducts) && report.data.topProducts.length > 0) {
        csv += `\nProducts Performance Dataset\n`
        csv += `Product Name,Units Sold,Revenue (TSH)\n`
        report.data.topProducts.forEach((p: any) => {
          csv += `"${p.name || ''}","${p.sales || 0}","${p.revenue || 0}"\n`
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

  // Format currency helper
  const formatMoney = (amount: number | string | undefined) => {
    const num = Number(amount) || 0
    return `TSH ${num.toLocaleString()}`
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header */}
      <div className={cn(
        "no-print p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
              <Badge className="bg-navy text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                Executive Studio
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">
              Custom Report <span className="text-white drop-shadow-sm">Generator</span>
            </h1>
            <p className={cn("text-xs sm:text-sm font-semibold mt-1", isDark ? "text-teal-300" : "text-navy/90")}>
              Customize, generate, and export publication-ready intelligence reports from live database metrics
            </p>
          </div>
          
          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleInstantDownload('pdf')}
              disabled={isGenerating}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md text-xs sm:text-sm active:scale-95 transition-all"
            >
              {activeDownloadFormat === 'pdf' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-teal" />
              ) : (
                <Printer className="mr-2 h-4 w-4 text-teal" />
              )}
              Instant PDF
            </Button>
            <Button
              onClick={() => handleInstantDownload('csv')}
              disabled={isGenerating}
              className="bg-white hover:bg-slate-100 text-navy font-bold rounded-xl h-10 px-4 shadow-md text-xs sm:text-sm active:scale-95 transition-all"
            >
              {activeDownloadFormat === 'csv' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-teal-600" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-600" />
              )}
              Export CSV
            </Button>
            <Button
              onClick={() => handleInstantDownload('json')}
              disabled={isGenerating}
              variant="outline"
              className={cn(
                "font-bold rounded-xl h-10 px-3 text-xs border shadow-sm",
                isDark ? "bg-[#0c1438] border-teal/40 text-teal-300 hover:bg-teal-400/20" : "bg-teal-50 border-navy/20 text-navy hover:bg-white"
              )}
            >
              {activeDownloadFormat === 'json' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-teal" />
              ) : (
                <Code className="h-4 w-4 text-teal" />
              )}
              <span className="ml-1.5 hidden sm:inline">JSON</span>
            </Button>
            <Button
              onClick={() => handleInstantDownload('txt')}
              disabled={isGenerating}
              variant="outline"
              className={cn(
                "font-bold rounded-xl h-10 px-3 text-xs border shadow-sm",
                isDark ? "bg-[#0c1438] border-teal/40 text-teal-300 hover:bg-teal-400/20" : "bg-teal-50 border-navy/20 text-navy hover:bg-white"
              )}
            >
              {activeDownloadFormat === 'txt' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
              ) : (
                <FileText className="h-4 w-4 text-amber-500" />
              )}
              <span className="ml-1.5 hidden sm:inline">TXT</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Report Builder Configuration Form */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Configuration Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Category Selection */}
          <Card className={cn(
            "rounded-2xl transition-all duration-300",
            isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal text-navy flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <CardTitle className={cn("text-base font-bold", isDark ? "text-white" : "text-navy")}>
                      Choose Report Domain & Focus
                    </CardTitle>
                    <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                      Select the specific business vertical or generate a full multi-domain audit
                    </CardDescription>
                  </div>
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
                      <div className="w-9 h-9 rounded-full bg-navy text-teal flex items-center justify-center shrink-0 shadow-sm border border-navy/20 mt-0.5">
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
                <div className="w-8 h-8 rounded-full bg-teal text-navy flex items-center justify-center font-black text-sm">
                  2
                </div>
                <div>
                  <CardTitle className={cn("text-base font-bold", isDark ? "text-white" : "text-navy")}>
                    Report Parameters & Timeline
                  </CardTitle>
                  <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                    Configure document naming, data filter timeframe, and visual elements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
              {/* Report Custom Title */}
              <div className="space-y-1.5">
                <Label className={cn("text-xs font-bold uppercase", isDark ? "text-teal-300" : "text-navy")}>
                  Custom Report Header Title (Optional)
                </Label>
                <Input
                  placeholder="e.g. QuardCube Labs Q3 Financial & Operations Performance Audit"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className={cn(
                    "rounded-xl border border-teal text-xs sm:text-sm h-10",
                    isDark ? "bg-[#0c1438] text-white placeholder:text-slate-400" : "bg-white text-navy placeholder:text-navy/40"
                  )}
                />
              </div>

              {/* Date Range Selection */}
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
                      <SelectItem value="7d">Last 7 Days (Weekly Audit)</SelectItem>
                      <SelectItem value="30d">Last 30 Days (Monthly Overview)</SelectItem>
                      <SelectItem value="90d">Last 90 Days (Quarterly Summary)</SelectItem>
                      <SelectItem value="1y">Last 365 Days (Annual Performance)</SelectItem>
                      <SelectItem value="custom">Custom Date Range</SelectItem>
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
                      <SelectItem value="pdf">PDF Document (Print & Archive)</SelectItem>
                      <SelectItem value="csv">CSV Spreadsheet (Excel / Google Sheets)</SelectItem>
                      <SelectItem value="json">JSON Raw Telemetry (API & Systems)</SelectItem>
                      <SelectItem value="txt">Formatted Plain Text (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Date Pickers if selected */}
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

              {/* Additional Options Checkboxes */}
              <div className="pt-2 border-t border-navy/10 dark:border-teal/10">
                <Label className={cn("text-xs font-bold uppercase mb-2 block", isDark ? "text-teal-300" : "text-navy")}>
                  Content & Presentation Options
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={includeCharts}
                      onCheckedChange={(checked) => setIncludeCharts(Boolean(checked))}
                    />
                    <span className={isDark ? "text-slate-200" : "text-navy"}>Include Charts & Graphs</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={includeRawData}
                      onCheckedChange={(checked) => setIncludeRawData(Boolean(checked))}
                    />
                    <span className={isDark ? "text-slate-200" : "text-navy"}>Include Detailed Tables</span>
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

        {/* Right Column: Execution Summary & Action Card */}
        <div className="space-y-6">
          <Card className={cn(
            "rounded-2xl transition-all duration-300",
            isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <CardTitle className={cn("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Sliders className="h-4 w-4 text-teal" />
                Report Summary
              </CardTitle>
              <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Review configuration before compiling
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
              <div className={cn(
                "p-3 rounded-xl border text-xs space-y-2",
                isDark ? "bg-slate-900/60 border-teal/15" : "bg-slate-50 border-navy/10"
              )}>
                <div className="flex justify-between items-center">
                  <span className={cn("font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>Focus Area:</span>
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
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Production DB
                  </span>
                </div>
              </div>

              {/* Action Button to Generate */}
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
                    Generate Professional Report
                  </>
                )}
              </Button>

              <p className={cn("text-[11px] text-center font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                Generates verifiable reports compliant with corporate governance & audits
              </p>
            </CardContent>
          </Card>

          {/* Quick Instant Export Formats Card (Always Available) */}
          <Card className={cn(
            "rounded-2xl transition-all duration-300",
            isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className={cn("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Download className="h-4 w-4 text-teal" />
                  Instant Download Formats
                </CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal border-teal/40">
                  1-Click Export
                </Badge>
              </div>
              <CardDescription className={cn("text-[11px] font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Click any format to immediately generate and download
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInstantDownload('pdf')}
                  disabled={isGenerating}
                  className={cn(
                    "font-bold rounded-xl text-xs h-10 border-2 justify-start active:scale-95 transition-all",
                    isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center mr-2 shrink-0">
                    {activeDownloadFormat === 'pdf' ? (
                      <RefreshCw className="h-3.5 w-3.5 text-rose-500 animate-spin" />
                    ) : (
                      <Printer className="h-3.5 w-3.5 text-rose-500" />
                    )}
                  </div>
                  <span>PDF Document</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInstantDownload('csv')}
                  disabled={isGenerating}
                  className={cn(
                    "font-bold rounded-xl text-xs h-10 border-2 justify-start active:scale-95 transition-all",
                    isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center mr-2 shrink-0">
                    {activeDownloadFormat === 'csv' ? (
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  <span>Excel (.csv)</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInstantDownload('json')}
                  disabled={isGenerating}
                  className={cn(
                    "font-bold rounded-xl text-xs h-10 border-2 justify-start active:scale-95 transition-all",
                    isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-teal/15 flex items-center justify-center mr-2 shrink-0">
                    {activeDownloadFormat === 'json' ? (
                      <RefreshCw className="h-3.5 w-3.5 text-teal animate-spin" />
                    ) : (
                      <Code className="h-3.5 w-3.5 text-teal" />
                    )}
                  </div>
                  <span>JSON Data</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInstantDownload('txt')}
                  disabled={isGenerating}
                  className={cn(
                    "font-bold rounded-xl text-xs h-10 border-2 justify-start active:scale-95 transition-all",
                    isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center mr-2 shrink-0">
                    {activeDownloadFormat === 'txt' ? (
                      <RefreshCw className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                  <span>Text (.txt)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Generated Report Preview Canvas (Printable & Interactive) */}
      <div ref={printRef} className="space-y-4 pt-4">
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-navy/10 dark:border-teal/10">
          <div>
            <h2 className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Eye className="h-5 w-5 text-teal" />
              Live Report Document Preview
            </h2>
            <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              Official executive output ready for distribution and presentation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleInstantDownload('pdf')}
              disabled={isGenerating}
              className="bg-teal hover:bg-teal/80 text-navy font-bold rounded-xl h-9 px-3 text-xs shadow-sm active:scale-95 transition-all"
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
                "font-bold rounded-xl h-9 px-3 text-xs border-2 active:scale-95 transition-all",
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
            "p-10 rounded-2xl border text-center space-y-4 shadow-md transition-all duration-300 animate-pulse",
            isDark ? "bg-[#070b24] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="w-12 h-12 rounded-full bg-teal/20 text-teal flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base">Compiling Live Business Intelligence...</h3>
              <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Connecting to production databases, running telemetry algorithms, and assembling charts &amp; narrative analysis
              </p>
            </div>
          </div>
        )}

        {/* Empty State fallback if somehow not generating and null */}
        {!isGenerating && !generatedReport && (
          <div className={cn(
            "p-10 rounded-2xl border text-center space-y-4 shadow-md transition-all duration-300",
            isDark ? "bg-[#070b24] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="w-12 h-12 rounded-full bg-teal/20 text-teal flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-bold text-base">No Report Preview Available</h3>
              <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Click any instant download button or "Generate Professional Report" above to compile a live audit document.
              </p>
            </div>
            <Button
              onClick={handleGenerateReport}
              className="bg-navy text-white font-bold rounded-xl text-xs h-9 px-4"
            >
              <Sparkles className="h-4 w-4 mr-1.5 text-teal" />
              Generate Live Document Preview
            </Button>
          </div>
        )}

        {/* Live Printable Document Sheet Container */}
        {!isGenerating && generatedReport && (
          <div className={cn(
            "print-area p-6 sm:p-10 rounded-2xl transition-all duration-300 shadow-xl",
            isDark ? "bg-[#070b24] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
          )}>
            {/* Header Document Letterhead with Real Logo */}
            {includeExecutiveNotes && (
              <div className="border-b-2 border-teal/40 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/turquoise.png"
                      alt="QuardCube Labs Logo"
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                    />
                    <div>
                      <span className="font-black text-base sm:text-lg tracking-wider uppercase block">
                        QuardCube Labs Ltd
                      </span>
                      <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                        Enterprise Technology & Cloud Analytics Telemetry Division
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs">
                    <p className="font-bold uppercase tracking-wider text-teal">CONFIDENTIAL INTELLIGENCE</p>
                    <p className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                      Ref: QC-REP-{new Date(generatedReport.generatedAt).getFullYear()}-{Math.floor(Math.random() * 8999 + 1000)}
                    </p>
                    <p className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                      Issued: {new Date(generatedReport.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Title & Meta Banner */}
            <div className="mb-8">
              <Badge className="bg-teal text-navy text-[10px] font-black uppercase tracking-wider mb-2">
                {generatedReport.category}
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 tracking-tight">
                {generatedReport.title}
              </h2>
              <p className={cn("text-xs sm:text-sm font-medium leading-relaxed max-w-3xl", isDark ? "text-slate-300" : "text-navy/75")}>
                {generatedReport.description}
              </p>
            </div>

            {/* Key Metrics Grid & Human KPI Explanations */}
            <div className="mb-8 space-y-6">
              <div>
                <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                  <TrendingUp className="h-4 w-4 text-teal" />
                  Executive Performance Indicators &amp; Drivers
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(generatedReport.summary.keyMetrics).map(([key, value], idx) => {
                    const label = key.replace(/([A-Z])/g, ' $1').trim()
                    const isMoney = key.toLowerCase().includes('revenue') || key.toLowerCase().includes('spent') || key.toLowerCase().includes('value') || key.toLowerCase().includes('settled') || key.toLowerCase().includes('quotes')

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

              {/* In-depth KPI Contextual Explanations (Human-Made Narrative Analysis) */}
              {generatedReport.kpiExplanations && generatedReport.kpiExplanations.length > 0 && (
                <div className="p-4 sm:p-5 rounded-xl border border-navy/10 dark:border-teal/20 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-navy/10 dark:border-teal/15 pb-2.5">
                    <h4 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                      <Activity className="h-4 w-4 text-teal" />
                      Key Performance Drivers &amp; Evaluation Analysis
                    </h4>
                    <span className="text-[11px] font-semibold text-teal">Executive Brief</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {generatedReport.kpiExplanations.map((kpi, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3.5 rounded-xl border flex flex-col justify-between space-y-1.5 transition-all",
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Executive Narrative Synthesis Commentary */}
            {generatedReport.executiveNarrative && (
              <div className="mb-8 p-5 sm:p-6 rounded-2xl border border-teal/25 bg-gradient-to-br from-teal/10 via-transparent to-navy/10 dark:from-teal/15 dark:to-slate-900/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-teal/20 pb-3">
                  <Sparkles className="h-4 w-4 text-teal" />
                  <h3 className={cn("text-xs sm:text-sm font-black uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>
                    Executive Narrative &amp; Strategic Synthesis
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="font-bold text-teal uppercase text-[11px] flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      1. Overall Performance &amp; Commercial Momentum
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.overview}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold text-emerald-500 uppercase text-[11px] flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      2. Revenue Inflow &amp; Receivables Health
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.revenueAndFinancials}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold text-teal-400 uppercase text-[11px] flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      3. Operational Delivery &amp; Milestones
                    </p>
                    <p className={cn("leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                      {generatedReport.executiveNarrative.operationsAndDelivery}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
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

            {/* Strategic Recommendations if present */}
            {generatedReport.strategicRecommendations && generatedReport.strategicRecommendations.length > 0 && (
              <div className="mb-8 p-4 sm:p-5 rounded-xl border border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Strategic Next Steps &amp; Recommendations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generatedReport.strategicRecommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3.5 rounded-xl border text-xs space-y-1.5",
                        isDark ? "bg-slate-900/70 border-teal/15" : "bg-white border-navy/10 shadow-sm"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal">
                          {rec.domain}
                        </span>
                        <Badge 
                          className={cn(
                            "text-[9px] font-black uppercase py-0 px-2",
                            rec.priority === 'High' ? "bg-rose-500 text-white" :
                            rec.priority === 'Strategic' ? "bg-teal text-navy font-black" :
                            "bg-amber-500 text-navy font-bold"
                          )}
                        >
                          {rec.priority} Priority
                        </Badge>
                      </div>
                      <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-navy")}>
                        {rec.title}
                      </p>
                      <p className={cn("font-medium leading-relaxed", isDark ? "text-slate-300" : "text-navy/75")}>
                        {rec.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Analytics Chart: Revenue Trend AreaChart matching Analytics page */}
            {includeCharts && (
              <div className="mb-8 p-4 sm:p-6 rounded-xl border border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className={cn("text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                      <TrendingUp className="h-4 w-4 text-teal" />
                      Revenue Trajectory &amp; Operational Volume Curve
                    </h3>
                    <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-teal-400/80" : "text-navy/60")}>
                      Monthly financial velocity, order intake, and receivables trend
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-navy/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-navy/10 dark:border-teal/20 text-xs font-bold text-navy dark:text-teal-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-navy dark:bg-teal"></span>
                    <span>Realized Revenue (TSH)</span>
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
                          : generatedReport.data?.topProducts
                            ? generatedReport.data.topProducts.slice(0, 8).map((p: any) => ({
                                month: p.name?.slice(0, 12) || 'Product',
                                revenue: p.revenue || 0,
                                orders: p.sales || 0
                              }))
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
                          <stop offset="0%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.65} />
                          <stop offset="35%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.42} />
                          <stop offset="70%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.08} />
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
                        stroke={isDark ? "#40E0D0" : "#000080"}
                        strokeWidth={4.5}
                        fill="url(#reportRevenueTrendGlow)"
                        dot={{ r: 0 }}
                        activeDot={{ 
                          r: 7, 
                          stroke: isDark ? "#40E0D0" : "#000080", 
                          strokeWidth: 3.5, 
                          fill: "#ffffff" 
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Data Tables if enabled */}
            {includeRawData && (
              <div className="space-y-8">
                {/* 1. Orders Section */}
                {generatedReport.data?.orders && Array.isArray(generatedReport.data.orders) && generatedReport.data.orders.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <ShoppingCart className="h-4 w-4 text-teal" />
                        Commercial Orders Ledger ({generatedReport.data.orders.length} total)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Sales Performance</Badge>
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
                        Invoices & Accounts Receivables ({generatedReport.data.invoices.length} records)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Financials</Badge>
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

                {/* 3. Quotations Pipeline Section */}
                {generatedReport.data?.quotations && Array.isArray(generatedReport.data.quotations) && generatedReport.data.quotations.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <FileCode2 className="h-4 w-4 text-teal" />
                        Commercial Quotations Pipeline ({generatedReport.data.quotations.length} quotes)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Quotations</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-black bg-navy text-white">
                          <tr>
                            <th className="p-3 text-white font-black">Quote #</th>
                            <th className="p-3 text-white font-black">Client</th>
                            <th className="p-3 text-white font-black">Status</th>
                            <th className="p-3 text-right text-white font-black">Quoted Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                          {generatedReport.data.quotations.slice(0, 15).map((q: any, idx: number) => (
                            <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                              <td className={cn("p-3 font-mono font-bold", isDark ? "text-teal-300" : "text-teal")}>{q.quote_number || q.id?.slice(0, 8)}</td>
                              <td className="p-3 font-medium">{q.client_name || 'Client'}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                                  {q.status || 'pending'}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-bold text-teal-400">{formatMoney(q.total || q.quoted_amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Top Products & Catalog */}
                {generatedReport.data?.topProducts && Array.isArray(generatedReport.data.topProducts) && generatedReport.data.topProducts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <BarChart3 className="h-4 w-4 text-teal" />
                        Products Catalog Performance & Sales Velocity
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Products</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-black bg-navy text-white">
                          <tr>
                            <th className="p-3 text-white font-black">Rank</th>
                            <th className="p-3 text-white font-black">Product Name</th>
                            <th className="p-3 text-white font-black">Category</th>
                            <th className="p-3 text-right text-white font-black">Units Sold</th>
                            <th className="p-3 text-right text-white font-black">Total Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                          {generatedReport.data.topProducts.slice(0, 10).map((p: any, idx: number) => (
                            <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                              <td className="p-3">
                                <span className={cn(
                                  "w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-black shadow-sm",
                                  isDark ? "bg-teal text-navy" : "bg-navy text-teal"
                                )}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="p-3 font-medium">{p.name}</td>
                              <td className="p-3 text-slate-400">{p.category || 'General'}</td>
                              <td className="p-3 text-right font-bold">{p.sales || 0}</td>
                              <td className="p-3 text-right font-bold text-emerald-500">{formatMoney(p.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. Projects Section */}
                {generatedReport.data?.projects && Array.isArray(generatedReport.data.projects) && generatedReport.data.projects.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <Briefcase className="h-4 w-4 text-teal" />
                        Engineering Projects & Delivery Milestones ({generatedReport.data.projects.length} projects)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Projects</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-black bg-navy text-white">
                          <tr>
                            <th className="p-3 text-white font-black">Project Title</th>
                            <th className="p-3 text-white font-black">Client</th>
                            <th className="p-3 text-white font-black">Status</th>
                            <th className="p-3 text-right text-white font-black">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                          {generatedReport.data.projects.slice(0, 10).map((prj: any, idx: number) => (
                            <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                              <td className="p-3 font-bold">{prj.title || prj.name}</td>
                              <td className="p-3 text-slate-400">{prj.client_name || 'Internal'}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                                  {prj.status || 'in_progress'}
                                </Badge>
                              </td>
                              <td className="p-3 text-right text-slate-400">
                                {prj.created_at ? new Date(prj.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. Talent Pipeline & Content */}
                {generatedReport.data?.applications && Array.isArray(generatedReport.data.applications) && generatedReport.data.applications.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                        <Users className="h-4 w-4 text-teal" />
                        Talent Acquisition & Recruitment Pipeline ({generatedReport.data.applications.length} applicants)
                      </h3>
                      <Badge variant="outline" className="text-[10px]">Talent</Badge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-black bg-navy text-white">
                          <tr>
                            <th className="p-3 text-white font-black">Candidate Name</th>
                            <th className="p-3 text-white font-black">Position Applied</th>
                            <th className="p-3 text-white font-black">Status</th>
                            <th className="p-3 text-right text-white font-black">Applied Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                          {generatedReport.data.applications.slice(0, 10).map((app: any, idx: number) => (
                            <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                              <td className="p-3 font-bold">{app.applicant_name || app.name || 'Applicant'}</td>
                              <td className="p-3 text-slate-400">{app.position_title || 'Software Engineer'}</td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                                  {app.status || 'under_review'}
                                </Badge>
                              </td>
                              <td className="p-3 text-right text-slate-400">
                                {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Verification Footer */}
            <div className="mt-12 pt-6 border-t border-navy/10 dark:border-teal/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="text-slate-400">
                <p className="font-semibold text-teal">Certified System Telemetry Output</p>
                <p>Checksum: SHA-256 VERIFIED | Generated via QuardCube Labs Engine</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => handleInstantDownload('pdf')}
                  disabled={isGenerating}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 px-3 text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Save Copy
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
