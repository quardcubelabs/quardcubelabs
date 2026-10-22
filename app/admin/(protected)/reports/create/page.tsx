"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  ReportType, 
  ExportFormat, 
  ReportConfiguration, 
  PreparedReportPayload,
  ComparisonType,
  SummaryMetricItem,
  ChartSeriesData
} from "@/lib/report-engine/types"
import { getDefaultSections, DEFAULT_BRANDING } from "@/lib/report-engine/data-fetcher"
import { 
  previewReportAction, 
  generateReportAction,
  getReportEngineStatus
} from "@/lib/reports-actions"
import {
  FileText,
  Download,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Truck,
  Server,
  ArrowLeft,
  Sliders,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Receipt,
  CreditCard,
  FileCheck,
  Video,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

interface ReportTypeOption {
  type: ReportType
  label: string
  desc: string
  icon: any
  category: "finance" | "operations" | "compliance"
}

const REPORT_TYPES: ReportTypeOption[] = [
  { type: "sales", label: "Sales Performance", desc: "Gross revenue, transactions & product demand", icon: ShoppingCart, category: "finance" },
  { type: "invoices", label: "Invoices & Receivables", desc: "Billings, paid cash & receivables aging", icon: Receipt, category: "finance" },
  { type: "expenses", label: "Business Expenses", desc: "Operational cost centers, vouchers & overheads", icon: CreditCard, category: "finance" },
  { type: "financial", label: "Financial Position", desc: "Billings vs receipts, margin & net surplus", icon: DollarSign, category: "finance" },
  { type: "payments", label: "Payment Settlements", desc: "Settlement channels: Bank, M-Pesa, Cards", icon: CreditCard, category: "finance" },
  { type: "tax", label: "TRA 18% VAT Compliance", desc: "Output VAT, deductible input tax & net liability", icon: ShieldCheck, category: "compliance" },
  { type: "inventory", label: "Inventory Valuation", desc: "Warehouse stock valuation, health & low stock", icon: Package, category: "operations" },
  { type: "purchases", label: "Purchases & Procurement", desc: "Purchase order logs & supplier disbursements", icon: Truck, category: "operations" },
  { type: "quotations", label: "Commercial Quotations", desc: "Active proposals, pipeline & conversion rate", icon: FileCheck, category: "operations" },
  { type: "customers", label: "Customer Accounts", desc: "Client acquisition, lifetime value & retention", icon: Users, category: "operations" },
  { type: "cctv", label: "CCTV Engineering", desc: "Field site surveys, camera channels & project values", icon: Video, category: "operations" },
  { type: "it_assets", label: "IT Infrastructure", desc: "Server hardware registers, uptime & network assets", icon: Server, category: "compliance" },
]

type DatePreset = "today" | "last_7_days" | "this_month" | "last_month" | "this_quarter" | "this_year" | "custom"

export default function CreateReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  // Core selections (simplified!)
  const [selectedType, setSelectedType] = useState<ReportType>("sales")
  const [datePreset, setDatePreset] = useState<DatePreset>("this_month")
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf")
  
  // Custom Dates (only when preset === "custom")
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split("T")[0]
  })
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split("T")[0])

  // Optional Advanced settings (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customTitle, setCustomTitle] = useState("")
  const [compareEnabled, setCompareEnabled] = useState(false)
  const [comparisonType, setComparisonType] = useState<ComparisonType>("previous_period")
  const [statusFilter, setStatusFilter] = useState("all")

  // Generation & Preview states
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreparedReportPayload | null>(null)
  const [pythonOnline, setPythonOnline] = useState(false)

  // Preselect from URL
  useEffect(() => {
    const typeParam = searchParams.get("type") as ReportType
    if (typeParam && REPORT_TYPES.some(t => t.type === typeParam)) {
      setSelectedType(typeParam)
    }
  }, [searchParams])

  // Check backend engine
  useEffect(() => {
    getReportEngineStatus().then(res => setPythonOnline(res.pythonServiceOnline)).catch(() => {})
  }, [])

  // Calculate actual period based on preset
  const computedPeriod = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]

    switch (datePreset) {
      case "today":
        return { from: todayStr, to: todayStr }
      case "last_7_days": {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        return { from: d.toISOString().split("T")[0], to: todayStr }
      }
      case "this_month": {
        const fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
        const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from: fromDate.toISOString().split("T")[0], to: toDate.toISOString().split("T")[0] }
      }
      case "last_month": {
        const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const toDate = new Date(now.getFullYear(), now.getMonth(), 0)
        return { from: fromDate.toISOString().split("T")[0], to: toDate.toISOString().split("T")[0] }
      }
      case "this_quarter": {
        const qMonth = Math.floor(now.getMonth() / 3) * 3
        const fromDate = new Date(now.getFullYear(), qMonth, 1)
        const toDate = new Date(now.getFullYear(), qMonth + 3, 0)
        return { from: fromDate.toISOString().split("T")[0], to: toDate.toISOString().split("T")[0] }
      }
      case "this_year": {
        const fromDate = new Date(now.getFullYear(), 0, 1)
        const toDate = new Date(now.getFullYear(), 11, 31)
        return { from: fromDate.toISOString().split("T")[0], to: toDate.toISOString().split("T")[0] }
      }
      case "custom":
      default:
        return { from: customFrom, to: customTo }
    }
  }, [datePreset, customFrom, customTo])

  // Current report configuration
  const currentConfig: ReportConfiguration = useMemo(() => {
    const selectedMeta = REPORT_TYPES.find(t => t.type === selectedType)
    const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    const autoTitle = `${selectedMeta?.label || "Executive"} Report - ${monthName}`

    return {
      title: customTitle.trim() || autoTitle,
      description: selectedMeta?.desc || "Authoritative business intelligence analysis",
      type: selectedType,
      period: computedPeriod,
      comparison: compareEnabled ? {
        enabled: true,
        type: comparisonType,
        from: computedPeriod.from,
        to: computedPeriod.to
      } : { enabled: false },
      branding: DEFAULT_BRANDING,
      sections: getDefaultSections(selectedType),
      filters: {
        status: statusFilter
      }
    }
  }, [selectedType, computedPeriod, customTitle, compareEnabled, comparisonType, statusFilter])

  // Fetch Live Preview
  const fetchPreview = async () => {
    setIsPreviewLoading(true)
    try {
      const res = await previewReportAction(currentConfig)
      if (res.success && res.data) {
        setPreviewData(res.data)
      }
    } catch (err: any) {
      console.warn("Preview load error:", err)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // Memoized Chart Series for Preview
  const firstChartSeries: ChartSeriesData | null = useMemo(() => {
    if (!previewData?.charts) return null
    const list = Object.values(previewData.charts)
    return list.length > 0 ? list[0] : null
  }, [previewData])

  const chartPreviewData = useMemo(() => {
    if (!firstChartSeries || !firstChartSeries.labels) return []
    return firstChartSeries.labels.map((name, i) => ({
      name,
      value: firstChartSeries.values?.[i] ?? 0
    }))
  }, [firstChartSeries])

  // Load preview whenever type or period changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview()
    }, 350)
    return () => clearTimeout(timer)
  }, [selectedType, computedPeriod, compareEnabled, comparisonType, statusFilter])

  // Handle Generate and Instant Download
  const handleGenerate = async (formatOverride?: ExportFormat) => {
    const format = formatOverride || selectedFormat
    setIsGenerating(true)
    try {
      const res = await generateReportAction(currentConfig, format)
      if (res.success && res.fileUrl) {
        toast({
          title: "Report Generated Successfully",
          description: `Download started for ${res.filename || "Report"}.`,
        })
        const link = document.createElement("a")
        link.href = res.fileUrl
        link.download = res.filename || `report-${selectedType}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast({
          title: "Generation Failed",
          description: res.error || "Could not generate report document.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({
        title: "Generation Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedMeta = REPORT_TYPES.find(t => t.type === selectedType) || REPORT_TYPES[0]
  const SelectedIcon = selectedMeta.icon

  return (
    <div className="space-y-5 pb-16">
      {/* 1. Header Bar */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/reports")}
              className={cn(
                "rounded-xl font-bold h-10 px-3.5 gap-1.5 transition-all active:scale-95",
                isDark ? "bg-white/10 border-teal/40 text-teal-300 hover:bg-white/20" : "bg-white border-2 border-navy/20 text-navy hover:bg-navy hover:text-white"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold flex items-center gap-2">
                Generate <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Report</span>
              </h1>
              <p className={cn("text-xs sm:text-sm font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                Instant executive business intelligence with 1-click export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={cn("text-[11px] font-bold px-3 py-1 rounded-full", isDark ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-navy text-white")}>
              <CheckCircle2 className="h-3 w-3 mr-1 text-teal" />
              {pythonOnline ? "Python Engine Active" : "Fast Engine Active"}
            </Badge>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Streamlined Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Fast 3-Step Selection Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">

          {/* STEP 1: Select Topic / Domain */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl p-5 border-2 transition-all",
            isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal text-navy font-black text-xs flex items-center justify-center">1</span>
                <h3 className="font-extrabold text-sm sm:text-base">Choose Report Domain</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{selectedMeta.label}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REPORT_TYPES.map((item) => {
                const Icon = item.icon
                const isSelected = selectedType === item.type
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item.type)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group",
                      isSelected
                        ? isDark 
                          ? "bg-teal/20 border-teal text-white shadow-sm" 
                          : "bg-navy text-white border-navy shadow-md"
                        : isDark
                          ? "bg-[#070d28] border-slate-800 text-slate-300 hover:border-teal/40 hover:text-white"
                          : "bg-slate-50 border-slate-200 text-navy hover:border-navy/40 hover:bg-teal-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isSelected
                          ? isDark ? "bg-teal text-navy" : "bg-teal text-navy"
                          : isDark ? "bg-slate-800 text-teal-400" : "bg-navy/10 text-navy"
                      )}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="font-bold text-xs truncate leading-snug">{item.label}</span>
                    </div>
                    <p className={cn(
                      "text-[10px] line-clamp-1 opacity-80",
                      isSelected ? "text-slate-100" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {item.desc}
                    </p>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* STEP 2: Choose Timeframe Period */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl p-5 border-2 transition-all",
            isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal text-navy font-black text-xs flex items-center justify-center">2</span>
                <h3 className="font-extrabold text-sm sm:text-base">Select Reporting Period</h3>
              </div>
              <span className="text-xs font-mono font-bold text-teal">
                {computedPeriod.from} &rarr; {computedPeriod.to}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: "this_month", label: "This Month" },
                { id: "last_month", label: "Last Month" },
                { id: "last_7_days", label: "7 Days" },
                { id: "this_quarter", label: "Quarter" },
                { id: "this_year", label: "This Year" },
                { id: "custom", label: "Custom..." },
              ].map(preset => {
                const isSelected = datePreset === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDatePreset(preset.id as DatePreset)}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center",
                      isSelected
                        ? "bg-teal text-navy font-black shadow-sm"
                        : isDark
                          ? "bg-[#070d28] border border-slate-800 text-slate-300 hover:text-white"
                          : "bg-slate-100 border border-slate-200 text-navy hover:bg-slate-200"
                    )}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Custom Date Pickers (only shown when custom is chosen) */}
            {datePreset === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider mb-1 block">Start Date</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={e => setCustomFrom(e.target.value)}
                    className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider mb-1 block">End Date</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={e => setCustomTo(e.target.value)}
                    className={cn("h-10 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* STEP 3: Choose Format & Generate */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl p-5 border-2 transition-all",
            isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal text-navy font-black text-xs flex items-center justify-center">3</span>
                <h3 className="font-extrabold text-sm sm:text-base">Choose Format & Generate</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { id: "pdf", label: "PDF Document", sub: "Official Print/Vector", icon: FileText, color: "text-rose-500" },
                { id: "xlsx", label: "Excel Spreadsheet", sub: "Data Tables & Math", icon: FileSpreadsheet, color: "text-emerald-500" },
                { id: "docx", label: "Word Document", sub: "Editable Report", icon: FileCode, color: "text-blue-500" },
              ].map(fmt => {
                const isSelected = selectedFormat === fmt.id
                const Icon = fmt.icon
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5",
                      isSelected
                        ? isDark 
                          ? "bg-teal/20 border-teal text-white ring-1 ring-teal" 
                          : "bg-navy text-white border-navy shadow-md"
                        : isDark
                          ? "bg-[#070d28] border-slate-800 text-slate-400 hover:border-slate-700"
                          : "bg-slate-50 border-slate-200 text-navy hover:bg-slate-100"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? "text-teal" : fmt.color)} />
                    <span className="text-xs font-bold leading-tight">{fmt.label}</span>
                    <span className="text-[10px] opacity-75">{fmt.sub}</span>
                  </button>
                )
              })}
            </div>

            {/* Big Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="flex-1 bg-navy hover:bg-navy/90 text-white font-extrabold rounded-xl h-12 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all active:scale-95 gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin text-teal" />
                    Generating {selectedFormat.toUpperCase()}...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 text-teal" />
                    Generate & Download {selectedFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* OPTIONAL COLLAPSIBLE: Advanced Settings */}
          <Card className={cn(
            "rounded-2xl border transition-all overflow-hidden",
            isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm"
          )}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-500 hover:text-navy dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-teal" />
                <span>Advanced Customization (Optional)</span>
              </div>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 pt-1 border-t border-slate-200 dark:border-slate-800 space-y-3.5 text-xs animate-in fade-in">
                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider mb-1 block">Custom Report Title</Label>
                  <Input
                    placeholder={`${selectedMeta.label} - Custom Title`}
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-bold block">Comparison Analysis</span>
                    <span className="text-[11px] text-slate-500">Benchmark against previous corresponding timeframe</span>
                  </div>
                  <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} />
                </div>

                {compareEnabled && (
                  <div className="pt-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider mb-1 block">Comparison Benchmark</Label>
                    <Select value={comparisonType} onValueChange={(val: ComparisonType) => setComparisonType(val)}>
                      <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}>
                        <SelectValue placeholder="Select benchmark" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previous_period">Previous Period</SelectItem>
                        <SelectItem value="same_period_last_year">Same Period Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-[11px] font-bold uppercase tracking-wider mb-1 block">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="completed">Completed / Settled</SelectItem>
                      <SelectItem value="pending">Pending / Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Document Summary & Authoritative Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl p-5 border-2 transition-all space-y-4 sticky top-4",
            isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm"
          )}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={cn("p-2 rounded-xl bg-teal text-navy")}>
                  <SelectedIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm">{currentConfig.title}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {computedPeriod.from} to {computedPeriod.to}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="font-mono uppercase text-[10px] border-teal text-teal">
                {selectedFormat}
              </Badge>
            </div>

            {/* Authoritative KPI Tiles */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Authoritative Highlights</p>
              {isPreviewLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-teal mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Calculating real-time analytics...</p>
                </div>
              ) : previewData?.summary?.metrics && previewData.summary.metrics.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {previewData.summary.metrics.slice(0, 4).map((kpi: SummaryMetricItem, idx: number) => {
                    const hasChange = kpi.changePercent !== undefined && kpi.changePercent !== null
                    const isPositive = (kpi.changePercent ?? 0) > 0
                    const isNegative = (kpi.changePercent ?? 0) < 0
                    const changeFormatted = hasChange
                      ? `${isPositive ? "+" : ""}${kpi.changePercent}%`
                      : null

                    return (
                      <div
                        key={kpi.key || idx}
                        className={cn(
                          "p-3 rounded-xl border",
                          isDark ? "bg-[#070d28] border-slate-800" : "bg-slate-50 border-slate-200"
                        )}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">{kpi.label}</span>
                        <span className="text-sm sm:text-base font-black text-navy dark:text-white block truncate mt-0.5">{String(kpi.value)}</span>
                        {changeFormatted && (
                          <span className={cn(
                            "text-[10px] font-bold block mt-0.5",
                            isPositive ? "text-emerald-500" : isNegative ? "text-rose-500" : "text-slate-500"
                          )}>
                            {changeFormatted}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-xs text-slate-500">Document data will be aggregated directly from database.</p>
                </div>
              )}
            </div>

            {/* Chart Preview if available */}
            {chartPreviewData.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {firstChartSeries?.title || "Trend Overview"}
                </p>
                <div className="h-44 w-full rounded-xl p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPreviewData}>
                      <defs>
                        <linearGradient id="areaPreviewGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#888888" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#888888" />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="value" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#areaPreviewGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 1-Click Direct Formats Row */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">One-Click Direct Downloads</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate("pdf")}
                  disabled={isGenerating}
                  className="rounded-xl text-xs font-bold border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate("xlsx")}
                  disabled={isGenerating}
                  className="rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerate("docx")}
                  disabled={isGenerating}
                  className="rounded-xl text-xs font-bold border-blue-500/30 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <FileCode className="h-3.5 w-3.5 mr-1" />
                  Word
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
