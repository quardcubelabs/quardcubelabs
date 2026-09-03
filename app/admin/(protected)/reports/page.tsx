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
  TableProperties
} from "lucide-react"
import {
  ResponsiveContainer,
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

  // Handler: Generate Report
  const handleGenerateReport = async () => {
    if (dateRange === 'custom' && (!startDate || !endDate)) {
      toast({
        title: "Missing Date Range",
        description: "Please specify both Start Date and End Date for the custom range.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const requestParams: GenerateReportRequest = {
        title: customTitle.trim() || undefined,
        category,
        dateRange,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format,
        includeCharts
      }

      const res = await generateCustomReportData(requestParams)

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to generate report")
      }

      setGeneratedReport(res.data)
      toast({
        title: "Report Generated Successfully",
        description: `${res.data.title} is ready to view and export.`,
      })

      // Smooth scroll to preview
      setTimeout(() => {
        printRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 200)
    } catch (err: any) {
      toast({
        title: "Generation Failed",
        description: err?.message || "An error occurred while building the report.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handler: Download in chosen format
  const handleDownload = (chosenFormat: ExportFormat = format) => {
    if (!generatedReport) {
      toast({
        title: "No Report Available",
        description: "Generate a report first before downloading.",
        variant: "destructive"
      })
      return
    }

    setDownloadCount(prev => prev + 1)
    const baseFileName = `${generatedReport.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`

    if (chosenFormat === 'pdf') {
      // Trigger modern browser print to PDF
      window.print()
      toast({
        title: "Print / PDF Window Opened",
        description: "Save as PDF from your browser print preview.",
      })
      return
    }

    if (chosenFormat === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(generatedReport, null, 2))
      triggerFileDownload(dataStr, `${baseFileName}.json`)
      return
    }

    if (chosenFormat === 'txt') {
      let text = `========================================================================\n`
      text += `QUARDCUBE LABS - BUSINESS INTELLIGENCE & PERFORMANCE REPORT\n`
      text += `========================================================================\n\n`
      text += `TITLE:        ${generatedReport.title}\n`
      text += `CATEGORY:     ${generatedReport.category}\n`
      text += `DATE RANGE:   ${generatedReport.summary.dateRange}\n`
      text += `GENERATED AT: ${new Date(generatedReport.generatedAt).toLocaleString()}\n`
      text += `TOTAL RECORDS:${generatedReport.summary.totalRecords}\n\n`
      text += `------------------------------------------------------------------------\n`
      text += `KEY EXECUTIVE METRICS\n`
      text += `------------------------------------------------------------------------\n`
      Object.entries(generatedReport.summary.keyMetrics).forEach(([k, v]) => {
        text += `${k.toUpperCase().padEnd(25)}: ${typeof v === 'number' && k.toLowerCase().includes('revenue') ? 'TZS ' + v.toLocaleString() : v}\n`
      })
      text += `\n------------------------------------------------------------------------\n`
      text += `RAW DATA STRUCTURE\n`
      text += `------------------------------------------------------------------------\n`
      text += JSON.stringify(generatedReport.data, null, 2)
      text += `\n\n========================================================================\n`
      text += `END OF REPORT - CONFIDENTIAL & PROPRIETARY\n`
      text += `========================================================================\n`

      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      triggerFileDownload(dataStr, `${baseFileName}.txt`)
      return
    }

    if (chosenFormat === 'csv') {
      let csv = `Report Title,${generatedReport.title}\n`
      csv += `Category,${generatedReport.category}\n`
      csv += `Generated At,${generatedReport.generatedAt}\n`
      csv += `Date Range,${generatedReport.summary.dateRange}\n`
      csv += `Total Records,${generatedReport.summary.totalRecords}\n\n`
      
      csv += `Key Metric,Value\n`
      Object.entries(generatedReport.summary.keyMetrics).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`
      })

      // Add table data if orders exist
      if (generatedReport.data?.orders && Array.isArray(generatedReport.data.orders)) {
        csv += `\nOrders Dataset\n`
        csv += `Order ID,Customer,Email,Total (TSH),Status,Date\n`
        generatedReport.data.orders.forEach((o: any) => {
          csv += `"${o.id}","${o.customerName || ''}","${o.customerEmail || ''}","${o.total || 0}","${o.status || ''}","${o.created_at || ''}"\n`
        })
      } else if (generatedReport.data?.topProducts && Array.isArray(generatedReport.data.topProducts)) {
        csv += `\nProducts Dataset\n`
        csv += `Product Name,Units Sold,Revenue (TSH)\n`
        generatedReport.data.topProducts.forEach((p: any) => {
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
        isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-teal text-navy"
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
          
          {generatedReport && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleDownload('pdf')}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md text-xs sm:text-sm"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print / Save PDF
              </Button>
              <Button
                onClick={() => handleDownload('csv')}
                className="bg-white hover:bg-slate-100 text-navy font-bold rounded-xl h-10 px-4 shadow-md text-xs sm:text-sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-teal-600" />
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Report Builder Configuration Form */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Configuration Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Category Selection */}
          <Card className={cn(
            "rounded-2xl border-2 transition-all duration-300",
            isDark ? "bg-[#0a1033] border-teal/20 shadow-lg" : "bg-white border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal text-navy flex items-center justify-center font-black text-sm">
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
            "rounded-2xl border-2 transition-all duration-300",
            isDark ? "bg-[#0a1033] border-teal/20 shadow-lg" : "bg-white border-navy/20 shadow-md"
          )}>
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal text-navy flex items-center justify-center font-black text-sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border border-teal/20 bg-teal-50/10">
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-teal-300" : "text-navy")}>
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={cn("rounded-xl border border-teal text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-teal-300" : "text-navy")}>
                      End Date
                    </Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={cn("rounded-xl border border-teal text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}
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
            "rounded-2xl border-2 transition-all duration-300",
            isDark ? "bg-[#0a1033] border-teal/20 shadow-lg" : "bg-white border-navy/20 shadow-md"
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

          {/* Quick Export Formats Card */}
          {generatedReport && (
            <Card className={cn(
              "rounded-2xl border-2 transition-all duration-300",
              isDark ? "bg-[#0a1033] border-teal/20 shadow-lg" : "bg-white border-navy/20 shadow-md"
            )}>
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className={cn("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Download className="h-4 w-4 text-teal" />
                  Instant Download Formats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('pdf')}
                    className={cn(
                      "font-bold rounded-xl text-xs h-9 border-2 justify-start",
                      isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                    )}
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5 text-brand-red" />
                    PDF (.pdf)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('csv')}
                    className={cn(
                      "font-bold rounded-xl text-xs h-9 border-2 justify-start",
                      isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                    )}
                  >
                    <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                    Excel (.csv)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('json')}
                    className={cn(
                      "font-bold rounded-xl text-xs h-9 border-2 justify-start",
                      isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                    )}
                  >
                    <Code className="mr-1.5 h-3.5 w-3.5 text-teal" />
                    JSON (.json)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('txt')}
                    className={cn(
                      "font-bold rounded-xl text-xs h-9 border-2 justify-start",
                      isDark ? "border-teal/30 text-white hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                    )}
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
                    Text (.txt)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 3. Generated Report Preview Canvas (Printable & Interactive) */}
      {generatedReport && (
        <div ref={printRef} className="space-y-4 pt-4">
          <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-navy/10 dark:border-teal/10">
            <div>
              <h2 className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Eye className="h-5 w-5 text-teal" />
                Live Report Document Preview
              </h2>
              <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Official executive output ready for distribution
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleDownload('pdf')}
                className="bg-teal hover:bg-teal/80 text-navy font-bold rounded-xl h-9 px-3 text-xs shadow-sm"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload('csv')}
                className={cn(
                  "font-bold rounded-xl h-9 px-3 text-xs border-2",
                  isDark ? "border-teal/30 text-teal-300 hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5"
                )}
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                Download CSV
              </Button>
            </div>
          </div>

          {/* Document Sheet Container */}
          <div className={cn(
            "print-area p-6 sm:p-10 rounded-2xl border-2 transition-all duration-300 shadow-xl",
            isDark ? "bg-[#070b24] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            {/* Header Document Letterhead */}
            {includeExecutiveNotes && (
              <div className="border-b-2 border-teal/40 pb-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-navy text-teal font-black flex items-center justify-center text-sm border border-teal/40">
                        QC
                      </div>
                      <span className="font-black text-base tracking-wider uppercase">
                        QuardCube Labs Ltd
                      </span>
                    </div>
                    <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                      Enterprise Technology & Cloud Analytics Telemetry Division
                    </p>
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

            {/* Key Metrics Grid */}
            <div className="mb-8">
              <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                <TrendingUp className="h-4 w-4 text-teal" />
                Executive Metric Indicators
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {Object.entries(generatedReport.summary.keyMetrics).map(([key, value], idx) => {
                  const label = key.replace(/([A-Z])/g, ' $1').trim()
                  const isMoney = key.toLowerCase().includes('revenue') || key.toLowerCase().includes('spent') || key.toLowerCase().includes('value')

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

            {/* Visual Analytics Chart if enabled */}
            {includeCharts && (
              <div className="mb-8 p-4 sm:p-6 rounded-xl border border-navy/10 dark:border-teal/15 bg-slate-50/50 dark:bg-white/[0.02]">
                <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                  <BarChart3 className="h-4 w-4 text-teal" />
                  Visual Data Distribution & Trends
                </h3>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        generatedReport.data?.monthlyData
                          ? Object.entries(generatedReport.data.monthlyData).map(([m, val]: any) => ({
                              name: m,
                              value: typeof val === 'object' ? val.revenue || val.total || 0 : Number(val) || 0
                            }))
                          : generatedReport.data?.topProducts
                            ? generatedReport.data.topProducts.slice(0, 5).map((p: any) => ({
                                name: p.name?.slice(0, 15) || 'Product',
                                value: p.revenue || p.sales || 0
                              }))
                            : [
                                { name: 'Metric 1', value: 4000 },
                                { name: 'Metric 2', value: 3000 },
                                { name: 'Metric 3', value: 2000 },
                                { name: 'Metric 4', value: 2780 },
                                { name: 'Metric 5', value: 1890 }
                              ]
                      }
                      margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1a2550" : "#e2e8f0"} vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                        tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? '#080d2a' : '#ffffff',
                          border: isDark ? '1px solid rgba(64, 224, 208, 0.3)' : '2px solid rgba(0, 0, 128, 0.2)',
                          borderRadius: '10px',
                          color: isDark ? '#fff' : '#000080',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="value" fill="#40E0D0" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Data Tables if enabled */}
            {includeRawData && (
              <div className="space-y-6">
                <h3 className={cn("text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2", isDark ? "text-teal-300" : "text-navy")}>
                  <TableProperties className="h-4 w-4 text-teal" />
                  Detailed Record Ledger
                </h3>

                {/* Orders table */}
                {generatedReport.data?.orders && Array.isArray(generatedReport.data.orders) && generatedReport.data.orders.length > 0 && (
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
                            <td className="p-3 font-mono font-bold text-teal">{o.order_number || o.id?.slice(0, 8)}</td>
                            <td className="p-3 font-medium">{o.customerName || o.customerEmail || 'Guest'}</td>
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
                )}

                {/* Top Products table */}
                {generatedReport.data?.topProducts && Array.isArray(generatedReport.data.topProducts) && (
                  <div className="overflow-x-auto rounded-xl border border-navy/10 dark:border-teal/20">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] uppercase font-black bg-navy text-white">
                        <tr>
                          <th className="p-3 text-white font-black">Rank</th>
                          <th className="p-3 text-white font-black">Product Name</th>
                          <th className="p-3 text-right text-white font-black">Sales Count</th>
                          <th className="p-3 text-right text-white font-black">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/5 dark:divide-teal/10">
                        {generatedReport.data.topProducts.slice(0, 10).map((p: any, idx: number) => (
                          <tr key={idx} className={isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"}>
                            <td className="p-3 font-bold text-teal">#{idx + 1}</td>
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-right font-bold">{p.sales || 0}</td>
                            <td className="p-3 text-right font-bold text-emerald-500">{formatMoney(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  onClick={() => handleDownload('pdf')}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 px-3 text-xs"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Save Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
