"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import {
  ReportType,
  GeneratedReportRecord,
  ReportTemplateRecord,
  PreparedReportPayload,
  ExportFormat,
  ReportConfiguration,
  ComparisonType,
  SummaryMetricItem,
  ChartSeriesData
} from "@/lib/report-engine/types"
import { getDefaultSections, DEFAULT_BRANDING } from "@/lib/report-engine/data-fetcher"
import {
  getGeneratedReports,
  getReportTemplates,
  deleteReportAction,
  duplicateReportAction,
  getReportEngineStatus,
  previewReportAction,
  generateReportAction
} from "@/lib/reports-actions"
import {
  getFilteredReportTransactions,
  ReportTransactionRecord,
  ReportFilterCriteria,
  FilteredReportSummary
} from "@/lib/filtered-reports-actions"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from "recharts"
import {
  FileText,
  Download,
  Calendar,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Truck,
  Server,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Trash2,
  Eye,
  Sliders,
  FileSpreadsheet,
  FileCode,
  Printer,
  Receipt,
  CreditCard,
  Building,
  ShieldCheck,
  Briefcase,
  FileCheck,
  Video,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Layers,
  Building2,
  Landmark,
  UserCheck,
  Tag,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  TrendingUp,
  BarChart3,
  Target,
  Edit3,
  ExternalLink
} from "lucide-react"

const TYPE_CONFIG: Record<ReportType, { label: string; icon: any; badgeClass: string; cardClass: string; desc: string }> = {
  sales: { 
    label: "Sales Performance", 
    icon: ShoppingCart, 
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    cardClass: "border-emerald-500/30 hover:border-emerald-500/60",
    desc: "Revenue trends, order volumes & product demand"
  },
  invoices: { 
    label: "Invoices & Billing", 
    icon: Receipt, 
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    cardClass: "border-blue-500/30 hover:border-blue-500/60",
    desc: "Billing status, receivables aging & collections"
  },
  expenses: { 
    label: "Business Expenses", 
    icon: CreditCard, 
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    cardClass: "border-rose-500/30 hover:border-rose-500/60",
    desc: "Cost centers, overheads & voucher audits"
  },
  inventory: { 
    label: "Inventory Valuation", 
    icon: Package, 
    badgeClass: "bg-teal/20 text-teal-700 dark:text-teal-400 border-teal/40",
    cardClass: "border-teal/30 hover:border-teal/60",
    desc: "Warehouse valuation, stock health & alerts"
  },
  customers: { 
    label: "Customer Portfolio", 
    icon: Users, 
    badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
    cardClass: "border-violet-500/30 hover:border-violet-500/60",
    desc: "Client acquisition, account ranking & LTV"
  },
  products: { 
    label: "Product Catalogue", 
    icon: Briefcase, 
    badgeClass: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    cardClass: "border-indigo-500/30 hover:border-indigo-500/60",
    desc: "SKU performance, pricing & category margins"
  },
  financial: { 
    label: "Financial Summary", 
    icon: DollarSign, 
    badgeClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    cardClass: "border-cyan-500/30 hover:border-cyan-500/60",
    desc: "Cashflow, billings vs paid & net position"
  },
  purchases: { 
    label: "Procurement & POs", 
    icon: Truck, 
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    cardClass: "border-amber-500/30 hover:border-amber-500/60",
    desc: "Supplier orders, spend outlay & vendor delivery"
  },
  quotations: { 
    label: "Commercial Quotes", 
    icon: FileCheck, 
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30",
    cardClass: "border-fuchsia-500/30 hover:border-fuchsia-500/60",
    desc: "Proposals pipeline, win rates & deal closures"
  },
  payments: { 
    label: "Payment Settlements", 
    icon: CreditCard, 
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    cardClass: "border-emerald-500/30 hover:border-emerald-500/60",
    desc: "Settlement channels & gateway reconciliation"
  },
  tax: { 
    label: "Tax & TRA Compliance", 
    icon: ShieldCheck, 
    badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    cardClass: "border-orange-500/30 hover:border-orange-500/60",
    desc: "18% Standard VAT output, input tax & liability"
  },
  operational: { 
    label: "Enterprise Operations", 
    icon: Building, 
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    cardClass: "border-sky-500/30 hover:border-sky-500/60",
    desc: "Department throughput & service delivery"
  },
  cctv: { 
    label: "CCTV Engineering", 
    icon: Video, 
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    cardClass: "border-purple-500/30 hover:border-purple-500/60",
    desc: "Surveillance site surveys & engineering specs"
  },
  it_assets: { 
    label: "IT Infrastructure", 
    icon: Server, 
    badgeClass: "bg-red-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    cardClass: "border-rose-500/30 hover:border-rose-500/60",
    desc: "Hardware registers, server status & uptime"
  },
  custom: { 
    label: "Custom Report", 
    icon: Sliders, 
    badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    cardClass: "border-slate-500/30 hover:border-slate-500/60",
    desc: "Configurable multi-source analytics query"
  }
}

const REPORT_CATEGORIES = [
  { id: "all", label: "All Categories", count: 15 },
  { id: "financial", label: "Financial & Accounting", count: 4 },
  { id: "sales", label: "Sales & Revenue", count: 2 },
  { id: "crm", label: "Customer & CRM", count: 1 },
  { id: "inventory", label: "Inventory & Stock", count: 2 },
  { id: "purchasing", label: "Purchasing & Suppliers", count: 1 },
  { id: "expenses", label: "Expenses & Profitability", count: 1 },
  { id: "projects", label: "Projects & Services", count: 3 },
  { id: "custom", label: "Custom Management", count: 1 }
]

const TYPE_CATEGORY_MAP: Record<ReportType, string> = {
  sales: "sales",
  quotations: "sales",
  invoices: "financial",
  financial: "financial",
  payments: "financial",
  tax: "financial",
  customers: "crm",
  inventory: "inventory",
  products: "inventory",
  purchases: "purchasing",
  expenses: "expenses",
  operational: "projects",
  cctv: "projects",
  it_assets: "projects",
  custom: "custom"
}

export default function ReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()
  const printRef = useRef<HTMLDivElement>(null)

  // Top-level Navigation & Data States
  const [activeTab, setActiveTab] = useState<string>("filtered-explorer")
  const [isLoading, setIsLoading] = useState(true)

  // Archival Reports States
  const [reports, setReports] = useState<GeneratedReportRecord[]>([])
  const [templates, setTemplates] = useState<ReportTemplateRecord[]>([])
  const [pythonServiceOnline, setPythonServiceOnline] = useState(false)
  const [archiveSearch, setArchiveSearch] = useState("")
  const [archiveFilterType, setArchiveFilterType] = useState<string>("all")
  const [quickExporting, setQuickExporting] = useState<string | null>(null)

  // -------------------------------------------------------------
  // EXECUTIVE BUSINESS REPORT GENERATOR & NARRATIVE ENGINE STATES
  // -------------------------------------------------------------
  const [selectedDomainType, setSelectedDomainType] = useState<ReportType>("sales")
  const [selectedDomainCategory, setSelectedDomainCategory] = useState<string>("all")
  const [domainDatePreset, setDomainDatePreset] = useState<"today" | "last_7_days" | "this_month" | "last_month" | "this_quarter" | "this_year" | "custom">("this_month")
  const [domainCustomFrom, setDomainCustomFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split("T")[0]
  })
  const [domainCustomTo, setDomainCustomTo] = useState(() => new Date().toISOString().split("T")[0])
  const [narrativeDepth, setNarrativeDepth] = useState<"short" | "standard" | "comprehensive">("standard")
  const [customReportTitle, setCustomReportTitle] = useState("")
  const [customSubtitle, setCustomSubtitle] = useState("")
  const [preparedFor, setPreparedFor] = useState("QuardCube Labs Management & Stakeholders")
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [comparisonBenchmark, setComparisonBenchmark] = useState<ComparisonType>("previous_period")
  const [domainStatusFilter, setDomainStatusFilter] = useState("all")
  const [managementCommentary, setManagementCommentary] = useState("")
  const [showDomainAdvanced, setShowDomainAdvanced] = useState(false)
  const [activeNarrativeTab, setActiveNarrativeTab] = useState<string>("summary")

  // Domain Preview & Generation states
  const [domainPreviewPayload, setDomainPreviewPayload] = useState<PreparedReportPayload | null>(null)
  const [isDomainPreviewLoading, setIsDomainPreviewLoading] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [generatingFormat, setGeneratingFormat] = useState<ExportFormat | null>(null)

  // -------------------------------------------------------------
  // MULTI-DIMENSIONAL FILTER STATES
  // -------------------------------------------------------------
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedMode, setSelectedMode] = useState<string>("all")
  const [selectedSalesman, setSelectedSalesman] = useState<string>("all")
  const [selectedReceiptType, setSelectedReceiptType] = useState<string>("all")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all")
  const [itemQuery, setItemQuery] = useState<string>("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all")
  const [selectedVatStatus, setSelectedVatStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Filtered dataset & Summary
  const [records, setRecords] = useState<ReportTransactionRecord[]>([])
  const [summary, setSummary] = useState<FilteredReportSummary>({
    totalGross: 0,
    totalSubtotal: 0,
    totalVat: 0,
    recordCount: 0,
    averageTicket: 0,
    settlementRate: 100
  })

  // Dynamic filter options from data
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [availableModes, setAvailableModes] = useState<string[]>([])
  const [availableSalespeople, setAvailableSalespeople] = useState<string[]>([])
  const [availableReceiptTypes, setAvailableReceiptTypes] = useState<string[]>([])
  const [availableCustomers, setAvailableCustomers] = useState<string[]>([])
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([])
  const [availableVatStatuses, setAvailableVatStatuses] = useState<string[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  // PDF Preview & Print Modal
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  // Load Data
  const loadFilteredData = async () => {
    setIsLoading(true)
    try {
      const data = await getFilteredReportTransactions({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: selectedCategory,
        location: selectedLocation,
        mode: selectedMode,
        salesman: selectedSalesman,
        receiptType: selectedReceiptType,
        customer: selectedCustomer,
        item: itemQuery || undefined,
        paymentMethod: selectedPaymentMethod,
        vatStatus: selectedVatStatus,
        searchQuery: searchQuery || undefined
      })

      setRecords(data.records)
      setSummary(data.summary)
      setAvailableCategories(data.categories)
      setAvailableLocations(data.locations)
      setAvailableModes(data.modes)
      setAvailableSalespeople(data.salespeople)
      setAvailableReceiptTypes(data.receiptTypes)
      setAvailableCustomers(data.customers)
      setAvailablePaymentMethods(data.paymentMethods)
      setAvailableVatStatuses(data.vatStatuses)
      setCurrentPage(1)
    } catch (err) {
      console.error("Error loading filtered report:", err)
      toast({
        title: "Filter Error",
        description: "Failed to apply report criteria.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadArchiveData = async () => {
    try {
      const [reportsData, templatesData, engineStatus] = await Promise.all([
        getGeneratedReports(),
        getReportTemplates(),
        getReportEngineStatus()
      ])
      setReports(reportsData)
      setTemplates(templatesData)
      setPythonServiceOnline(engineStatus.pythonServiceOnline)
    } catch (err) {
      console.error("Error loading archival reports:", err)
    }
  }

  useEffect(() => {
    loadFilteredData()
    loadArchiveData()
  }, [])

  // -------------------------------------------------------------
  // DOMAIN REPORT GENERATOR COMPUTED CONFIG & ACTIONS
  // -------------------------------------------------------------
  const domainPeriod = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]

    switch (domainDatePreset) {
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
        return { from: domainCustomFrom, to: domainCustomTo }
    }
  }, [domainDatePreset, domainCustomFrom, domainCustomTo])

  const domainConfig: ReportConfiguration = useMemo(() => {
    const meta = TYPE_CONFIG[selectedDomainType]
    const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
    const autoTitle = `${meta?.label || "Executive"} Business Intelligence Report — ${monthName}`

    return {
      title: customReportTitle.trim() || autoTitle,
      subtitle: customSubtitle.trim() || "Authoritative Executive Intelligence & Audit Analysis",
      description: meta?.desc || "High-quality data-driven business report",
      type: selectedDomainType,
      period: domainPeriod,
      comparison: comparisonEnabled ? {
        enabled: true,
        type: comparisonBenchmark,
        from: domainPeriod.from,
        to: domainPeriod.to
      } : { enabled: false },
      branding: {
        ...DEFAULT_BRANDING,
        preparedFor: preparedFor.trim() || "Management & Business Partners"
      },
      sections: getDefaultSections(selectedDomainType),
      filters: {
        status: domainStatusFilter
      },
      narrativeDepth,
      customNarrative: managementCommentary.trim() ? {
        managementCommentary: managementCommentary.trim()
      } : undefined
    }
  }, [
    selectedDomainType,
    domainPeriod,
    customReportTitle,
    customSubtitle,
    preparedFor,
    comparisonEnabled,
    comparisonBenchmark,
    domainStatusFilter,
    narrativeDepth,
    managementCommentary
  ])

  const fetchDomainPreview = async () => {
    setIsDomainPreviewLoading(true)
    try {
      const res = await previewReportAction(domainConfig)
      if (res.success && res.data) {
        setDomainPreviewPayload(res.data)
      }
    } catch (err) {
      console.warn("Domain preview load error:", err)
    } finally {
      setIsDomainPreviewLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDomainPreview()
    }, 400)
    return () => clearTimeout(timer)
  }, [domainConfig])

  const firstChartSeries: ChartSeriesData | null = useMemo(() => {
    if (!domainPreviewPayload?.charts) return null
    const list = Object.values(domainPreviewPayload.charts)
    return list.length > 0 ? list[0] : null
  }, [domainPreviewPayload])

  const chartPreviewData = useMemo(() => {
    if (!firstChartSeries || !firstChartSeries.labels) return []
    return firstChartSeries.labels.map((name, i) => ({
      name,
      value: firstChartSeries.values?.[i] ?? 0
    }))
  }, [firstChartSeries])

  const handleGenerateDomainReport = async (format: ExportFormat) => {
    setIsGeneratingDoc(true)
    setGeneratingFormat(format)
    try {
      const res = await generateReportAction(domainConfig, format)
      if (res.success && res.fileUrl) {
        toast({
          title: "Report Generated Successfully",
          description: `Download started for ${res.filename || "Report"}. Saved to report history.`
        })
        const link = document.createElement("a")
        link.href = res.fileUrl
        link.download = res.filename || `report-${selectedDomainType}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        loadArchiveData()
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
      setIsGeneratingDoc(false)
      setGeneratingFormat(null)
    }
  }

  // Quick Date Range Presets
  const applyDatePreset = (preset: "today" | "yesterday" | "week" | "month" | "last_month" | "quarter" | "ytd" | "all") => {
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]

    if (preset === "today") {
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === "yesterday") {
      const y = new Date(now.getTime() - 86400000).toISOString().split("T")[0]
      setStartDate(y)
      setEndDate(y)
    } else if (preset === "week") {
      const w = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0]
      setStartDate(w)
      setEndDate(todayStr)
    } else if (preset === "month") {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
      setStartDate(mStart)
      setEndDate(todayStr)
    } else if (preset === "last_month") {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0]
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]
      setStartDate(lmStart)
      setEndDate(lmEnd)
    } else if (preset === "quarter") {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0]
      setStartDate(qStart)
      setEndDate(todayStr)
    } else if (preset === "ytd") {
      const yStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
      setStartDate(yStart)
      setEndDate(todayStr)
    } else if (preset === "all") {
      setStartDate("")
      setEndDate("")
    }
  }

  const handleResetFilters = () => {
    setStartDate("")
    setEndDate("")
    setSelectedCategory("all")
    setSelectedLocation("all")
    setSelectedMode("all")
    setSelectedSalesman("all")
    setSelectedReceiptType("all")
    setSelectedCustomer("all")
    setItemQuery("")
    setSelectedPaymentMethod("all")
    setSelectedVatStatus("all")
    setSearchQuery("")
  }

  // Handle Export to Excel (.xlsx) via backend ExcelJS API route
  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const response = await fetch("/api/reports/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            startDate,
            endDate,
            category: selectedCategory,
            location: selectedLocation,
            mode: selectedMode,
            salesman: selectedSalesman,
            receiptType: selectedReceiptType,
            customer: selectedCustomer,
            item: itemQuery,
            paymentMethod: selectedPaymentMethod,
            vatStatus: selectedVatStatus,
            searchQuery
          },
          records
        })
      })

      if (!response.ok) {
        throw new Error("Excel generator returned an error.")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `QuardCube_Filtered_Report_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Excel Export Complete",
        description: `Successfully exported ${records.length} transactions with formulas and styling.`
      })
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to generate Excel file.",
        variant: "destructive"
      })
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Handle CSV Export
  const handleExportCsv = () => {
    try {
      const headers = [
        "Date",
        "Document Number",
        "Document Type",
        "Customer Name",
        "Sales Representative",
        "Location",
        "Mode / Channel",
        "Items Summary",
        "Payment Channel",
        "VAT Status",
        "Taxable Subtotal (TZS)",
        "TRA 18% VAT (TZS)",
        "Total Amount (TZS)",
        "Status"
      ]

      const rows = records.map(r => [
        `"${r.date}"`,
        `"${r.document_number}"`,
        `"${r.document_type.toUpperCase()}"`,
        `"${r.customer_name.replace(/"/g, '""')}"`,
        `"${r.salesman}"`,
        `"${r.location}"`,
        `"${r.mode}"`,
        `"${r.items_summary.replace(/"/g, '""')}"`,
        `"${r.payment_method}"`,
        `"${r.vat_status}"`,
        r.subtotal,
        r.vat_amount,
        r.total_amount,
        `"${r.status.toUpperCase()}"`
      ])

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `QuardCube_Report_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "CSV Exported",
        description: `Downloaded ${records.length} records as CSV.`
      })
    } catch {
      toast({ title: "Error", description: "Failed to export CSV.", variant: "destructive" })
    }
  }

  // Print PDF
  const handlePrintPdf = () => {
    window.print()
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (startDate) count++
    if (endDate) count++
    if (selectedCategory !== "all") count++
    if (selectedLocation !== "all") count++
    if (selectedMode !== "all") count++
    if (selectedSalesman !== "all") count++
    if (selectedReceiptType !== "all") count++
    if (selectedCustomer !== "all") count++
    if (itemQuery.trim()) count++
    if (selectedPaymentMethod !== "all") count++
    if (selectedVatStatus !== "all") count++
    if (searchQuery.trim()) count++
    return count
  }, [
    startDate,
    endDate,
    selectedCategory,
    selectedLocation,
    selectedMode,
    selectedSalesman,
    selectedReceiptType,
    selectedCustomer,
    itemQuery,
    selectedPaymentMethod,
    selectedVatStatus,
    searchQuery
  ])

  // Pagination calculation
  const totalPages = Math.ceil(records.length / pageSize) || 1
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return records.slice(start, start + pageSize)
  }, [records, currentPage, pageSize])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div
        className={cn(
          "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
          isDark
            ? "bg-[#0a1033] border-none text-white shadow-none"
            : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
                Business Intelligence{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  &amp; Dynamic Reports
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Multi-dimensional filtering across invoices, receipts, items, locations, sales reps, VAT, and payments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={loadFilteredData}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 sm:h-11 px-3 sm:px-4 font-bold border shadow-sm transition-all active:scale-95",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Sync Data
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={cn("grid w-full grid-cols-3 max-w-xl", isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-100")}>
          <TabsTrigger value="filtered-explorer" className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filtered Explorer
          </TabsTrigger>
          <TabsTrigger value="standard-domains" className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Domain Reports
          </TabsTrigger>
          <TabsTrigger value="saved-archive" className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Report History ({reports.length})
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* TAB 1: DYNAMIC FILTERED EXPLORER (PRIMARY USER REQUIREMENT)    */}
        {/* ============================================================= */}
        <TabsContent value="filtered-explorer" className="space-y-6">
          {/* Multi-Dimensional Filter Control Card */}
          <Card className={cn(isDark ? "bg-[#0d0d12]/90 border-slate-800" : "bg-white border-slate-200")}>
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#40E0D0]" />
                Multi-Dimensional Report Filters
                {activeFilterCount > 0 && (
                  <Badge className="bg-[#000080] text-[#40E0D0] text-[10px] font-bold">
                    {activeFilterCount} Active
                  </Badge>
                )}
              </CardTitle>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <X className="mr-1 h-3 w-3" />
                  Reset Filters
                </Button>
              )}
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Date Presets Row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Presets:
                </span>
                {[
                  { label: "Today", value: "today" },
                  { label: "Yesterday", value: "yesterday" },
                  { label: "Last 7 Days", value: "week" },
                  { label: "This Month", value: "month" },
                  { label: "Last Month", value: "last_month" },
                  { label: "This Quarter", value: "quarter" },
                  { label: "Year-to-Date", value: "ytd" },
                  { label: "All Time", value: "all" },
                ].map((p) => (
                  <Button
                    key={p.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(p.value as any)}
                    className="h-7 text-[11px] px-2.5 font-medium border-slate-200 dark:border-slate-800 hover:bg-[#000080] hover:text-white"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* Comprehensive Filter Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                {/* 1. Date Range: From */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Date From</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={cn("h-8 text-xs font-mono", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}
                  />
                </div>

                {/* 2. Date Range: To */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Date To</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={cn("h-8 text-xs font-mono", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}
                  />
                </div>

                {/* 3. Category */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Product / Service Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Location / Branch */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Location / Branch Hub</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {availableLocations.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Mode / Sales Channel */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Transaction Mode / Channel</Label>
                  <Select value={selectedMode} onValueChange={setSelectedMode}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      {availableModes.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 6. Salesman / Staff */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Salesperson / Account Rep</Label>
                  <Select value={selectedSalesman} onValueChange={setSelectedSalesman}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Salespeople" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Salespeople</SelectItem>
                      {availableSalespeople.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 7. Receipt / Document Type */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Receipt / Document Type</Label>
                  <Select value={selectedReceiptType} onValueChange={setSelectedReceiptType}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Document Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Document Types</SelectItem>
                      <SelectItem value="invoice">Commercial Invoice</SelectItem>
                      <SelectItem value="receipt">Cash / Official Receipt</SelectItem>
                      <SelectItem value="quotation">Commercial Quotation</SelectItem>
                      <SelectItem value="credit_note">Customer Credit Note</SelectItem>
                      <SelectItem value="supplier_bill">Supplier Bill (AP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 8. Customer Account */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Customer / Entity</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {availableCustomers.map((cust) => (
                        <SelectItem key={cust} value={cust}>{cust}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 9. Payment Method */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Payment Channel / Method</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All Payment Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Methods</SelectItem>
                      {availablePaymentMethods.map((pm) => (
                        <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 10. VAT Status */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">TRA VAT Classification</Label>
                  <Select value={selectedVatStatus} onValueChange={setSelectedVatStatus}>
                    <SelectTrigger className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}>
                      <SelectValue placeholder="All VAT Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All VAT Statuses</SelectItem>
                      {availableVatStatuses.map((vat) => (
                        <SelectItem key={vat} value={vat}>{vat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 11. Specific Item / Model Search */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Hardware Item / SKU</Label>
                  <Input
                    placeholder="e.g. 4K Dome, NVR, Cat6"
                    value={itemQuery}
                    onChange={(e) => setItemQuery(e.target.value)}
                    className={cn("h-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}
                  />
                </div>

                {/* 12. Freeform Keyword Search */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-400">Keyword Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Doc #, memo, name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={cn("h-8 pl-8 text-xs", isDark ? "bg-slate-900 border-slate-800" : "border-slate-200")}
                    />
                  </div>
                </div>
              </div>

              {/* Filter Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">
                  Showing <b>{records.length}</b> transactions matching criteria
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={loadFilteredData}
                    className="h-8 text-xs font-bold bg-[#000080] text-white hover:bg-[#000080]/90 shadow-sm"
                  >
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
            {[
              {
                title: "Filtered Gross",
                value: `TZS ${summary.totalGross.toLocaleString()}`,
                sub: "With 18% VAT included",
                icon: DollarSign,
              },
              {
                title: "Taxable Subtotal",
                value: `TZS ${summary.totalSubtotal.toLocaleString()}`,
                sub: "Pre-tax turnover base",
                icon: Receipt,
              },
              {
                title: "TRA 18% Output VAT",
                value: `TZS ${summary.totalVat.toLocaleString()}`,
                sub: "Statutory VAT reserve",
                icon: ShieldCheck,
              },
              {
                title: "Transactions",
                value: `${summary.recordCount} Docs`,
                sub: "Matching filtered records",
                icon: FileText,
              },
              {
                title: "Average Ticket",
                value: `TZS ${summary.averageTicket.toLocaleString()}`,
                sub: "Mean settlement value",
                icon: CheckCircle2,
              },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <Card
                  key={idx}
                  className={cn(
                    "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                    isDark
                      ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
                      : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
                  )}
                >
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                      <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                        {stat.title}
                      </span>
                      <span className={cn("text-base sm:text-xl xl:text-2xl font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {stat.value}
                      </span>
                      <span className={cn("text-[10px] sm:text-xs font-medium truncate block mt-0.5", isDark ? "text-slate-400" : "text-navy/60")}>
                        {stat.sub}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                        isDark
                          ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                          : "bg-teal-100/80 border-navy/15 text-navy"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Export Actions Bar */}
          <Card
            className={cn(
              "rounded-2xl p-4 mb-6 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
              isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm"
            )}
          >
            <div>
              <h3 className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>Filtered Data Export &amp; Document Generation</h3>
              <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                Generate official Excel spreadsheets or high-resolution printable PDF reports with current filters applied
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Excel (.xlsx) Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExportingExcel || records.length === 0}
                className={cn(
                  "rounded-xl h-10 px-4 text-xs font-bold border transition-all active:scale-95 shadow-sm",
                  isDark
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-emerald-50 text-emerald-800 border-emerald-600/30 hover:bg-emerald-100"
                )}
              >
                <FileSpreadsheet className={cn("mr-1.5 h-4 w-4", isExportingExcel && "animate-spin")} />
                {isExportingExcel ? "Generating Excel..." : "Generate Excel (.xlsx)"}
              </Button>

              {/* PDF Preview & Print Button */}
              <Button
                size="sm"
                onClick={() => setIsPdfPreviewOpen(true)}
                disabled={records.length === 0}
                className={cn(
                  "rounded-xl h-10 px-4 text-xs font-bold gap-1.5 shadow-md transition-all active:scale-95",
                  isDark
                    ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                    : "bg-navy hover:bg-navy/90 text-white"
                )}
              >
                <Printer className="mr-1 h-4 w-4" />
                Generate PDF Document
              </Button>

              {/* CSV Fast Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={records.length === 0}
                className={cn(
                  "rounded-xl h-10 px-3.5 text-xs font-bold border transition-all active:scale-95 shadow-sm",
                  isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100"
                )}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </Card>

          {/* Filtered Records Data Table */}
          <Card
            className={cn(
              "rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 w-full shadow-lg",
              isDark
                ? "bg-[#060a22] border-none text-white shadow-none"
                : "bg-white border-2 border-navy/20 text-navy"
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-navy text-white font-black border-b border-navy/30">
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Date</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Document #</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Type</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Customer / Entity</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Salesman</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Location &amp; Mode</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Items / Narrative</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-left text-[10px] sm:text-xs">Payment Channel</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-right text-[10px] sm:text-xs">Subtotal</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-right text-[10px] sm:text-xs">VAT (18%)</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-right text-[10px] sm:text-xs">Total (TZS)</th>
                    <th className="py-2.5 sm:py-3.5 px-3 font-black text-white uppercase tracking-wider text-center text-[10px] sm:text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/10 text-xs">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-slate-500 text-sm font-medium">
                        No transactions found matching the applied filter criteria. Try broadening your dates or clearing filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((tx) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          "transition-colors",
                          isDark
                            ? "border-b border-navy/20 hover:bg-teal/30 hover:text-white"
                            : "border-b border-navy/10 hover:bg-teal/50 hover:text-navy"
                        )}
                      >
                        <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className={cn("px-3 py-2.5 font-mono font-bold whitespace-nowrap", isDark ? "text-slate-300" : "text-navy/70")}>
                          {tx.document_number}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className={cn("text-[10px] uppercase font-bold rounded-lg border", isDark ? "border-teal/30 text-slate-300 bg-teal/10" : "border-navy/20 text-navy bg-slate-50")}>
                            {tx.document_type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className={cn("px-3 py-2.5 font-bold max-w-[180px] truncate", isDark ? "text-white" : "text-navy")} title={tx.customer_name}>
                          {tx.customer_name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap font-medium">
                          {tx.salesman}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400">
                          <div className={cn("font-semibold", isDark ? "text-slate-300" : "text-navy")}>{tx.location}</div>
                          <div className="text-[10px] text-slate-400">{tx.mode}</div>
                        </td>
                        <td className="px-3 py-2.5 max-w-[220px] truncate text-slate-400" title={tx.items_summary}>
                          {tx.items_summary}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-400">
                          {tx.payment_method}
                        </td>
                        <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", isDark ? "text-slate-300" : "text-navy/80")}>
                          {tx.subtotal.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-500">
                          {tx.vat_amount.toLocaleString()}
                        </td>
                        <td className={cn("px-3 py-2.5 text-right font-mono font-black whitespace-nowrap", isDark ? "text-white" : "text-navy")}>
                          TZS {tx.total_amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize font-bold rounded-lg border px-2 py-0.5",
                              (tx.status === "paid" || tx.status === "settled") && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                              tx.status === "open" && "border-blue-500/30 text-blue-600 bg-blue-500/10",
                              tx.status === "partially_paid" && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                              tx.status === "overdue" && "border-rose-500/30 text-rose-600 bg-rose-500/10",
                              tx.status === "closed" && "border-slate-500/30 text-slate-400"
                            )}
                          >
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {records.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800 text-xs gap-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <span>Rows per page:</span>
                  <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, records.length)}–
                    {Math.min(currentPage * pageSize, records.length)} of {records.length} records
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-xs font-mono font-bold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 px-2.5 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB 2: PROFESSIONAL BUSINESS REPORT GENERATOR & NARRATIVE     */}
        {/* ============================================================= */}
        <TabsContent value="standard-domains" className="space-y-6">
          {/* Top Category Filter Toolbar */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 transition-all",
            isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm text-navy"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal" />
                  Executive Business Report Generator &amp; Analytical Narrative Studio
                </h2>
                <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
                  Data-driven reporting engine combining verified database metrics, deterministic accounting calculations, and professional analytical narrative
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] font-bold px-3 py-1 rounded-full", isDark ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-navy text-white")}>
                  <CheckCircle2 className="h-3 w-3 mr-1 text-teal" />
                  {pythonServiceOnline ? "Python High-Fidelity Active" : "Native Node.js Engine Active"}
                </Badge>
              </div>
            </div>

            {/* Category Selector Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Categories:
              </span>
              {REPORT_CATEGORIES.map((cat) => {
                const isSelected = selectedDomainCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedDomainCategory(cat.id)}
                    className={cn(
                      "py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
                      isSelected
                        ? "bg-teal text-navy font-black shadow-sm"
                        : isDark
                          ? "bg-[#070d28] border border-slate-800 text-slate-300 hover:text-white hover:border-teal/30"
                          : "bg-slate-100 border border-slate-200 text-navy hover:bg-slate-200"
                    )}
                  >
                    <span>{cat.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full",
                      isSelected ? "bg-navy text-teal font-black" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    )}>
                      {cat.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Main 2-Column Report Generator Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT COLUMN: Configuration, Template, Period, Narrative & Export (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* STEP 1: Select Report Template */}
              <Card className={cn(
                "rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 transition-all",
                isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm text-navy"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal text-navy font-black text-xs flex items-center justify-center">1</span>
                    <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider">Select Report Template</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono capitalize border-teal/40 text-teal">
                    {selectedDomainType}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {(Object.keys(TYPE_CONFIG) as ReportType[])
                    .filter((typeKey) => selectedDomainCategory === "all" || TYPE_CATEGORY_MAP[typeKey] === selectedDomainCategory)
                    .map((typeKey) => {
                      const conf = TYPE_CONFIG[typeKey]
                      const Icon = conf.icon
                      const isSelected = selectedDomainType === typeKey
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() => setSelectedDomainType(typeKey)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between group",
                            isSelected
                              ? isDark
                                ? "bg-teal/20 border-teal text-white shadow-sm ring-1 ring-teal/50"
                                : "bg-navy text-white border-navy shadow-md"
                              : isDark
                                ? "bg-[#070d28] border-slate-800 text-slate-300 hover:border-teal/40 hover:text-white"
                                : "bg-slate-50 border-slate-200 text-navy hover:border-navy/40 hover:bg-teal-50/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                              "p-1.5 rounded-lg transition-colors shrink-0",
                              isSelected
                                ? "bg-teal text-navy font-black"
                                : isDark ? "bg-slate-800 text-teal-400" : "bg-navy/10 text-navy"
                            )}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-bold text-xs truncate leading-tight">{conf.label}</span>
                          </div>
                          <p className={cn(
                            "text-[10px] line-clamp-1 opacity-75",
                            isSelected ? "text-slate-100" : "text-slate-400"
                          )}>
                            {conf.desc}
                          </p>
                        </button>
                      )
                    })}
                </div>
              </Card>

              {/* STEP 2: Reporting Period & Narrative Depth */}
              <Card className={cn(
                "rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 transition-all",
                isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm text-navy"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal text-navy font-black text-xs flex items-center justify-center">2</span>
                    <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider">Period &amp; Narrative Depth</h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-teal">
                    {domainPeriod.from} &rarr; {domainPeriod.to}
                  </span>
                </div>

                {/* Period Presets */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-3">
                  {[
                    { id: "this_month", label: "Month" },
                    { id: "last_month", label: "L. Month" },
                    { id: "last_7_days", label: "7 Days" },
                    { id: "this_quarter", label: "Quarter" },
                    { id: "this_year", label: "Year" },
                    { id: "custom", label: "Custom..." },
                  ].map(preset => {
                    const isSelected = domainDatePreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setDomainDatePreset(preset.id as any)}
                        className={cn(
                          "py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center",
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

                {domainDatePreset === "custom" && (
                  <div className="grid grid-cols-2 gap-2 mb-3 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in">
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">From Date</Label>
                      <Input
                        type="date"
                        value={domainCustomFrom}
                        onChange={e => setDomainCustomFrom(e.target.value)}
                        className={cn("h-8 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">To Date</Label>
                      <Input
                        type="date"
                        value={domainCustomTo}
                        onChange={e => setDomainCustomTo(e.target.value)}
                        className={cn("h-8 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                      />
                    </div>
                  </div>
                )}

                {/* Narrative Depth Selection (Part F requirement) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal" /> Analytical Narrative Depth
                    </Label>
                    <span className="text-[10px] font-mono font-bold text-teal uppercase">
                      {narrativeDepth === "short" ? "Executive Brief" : narrativeDepth === "standard" ? "Full Standard" : "Comprehensive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "short", label: "Short", sub: "Briefing (4 Sec)" },
                      { id: "standard", label: "Standard", sub: "Analytical (7 Sec)" },
                      { id: "comprehensive", label: "Detailed", sub: "Dossier (9 Sec)" },
                    ].map(d => {
                      const isSelected = narrativeDepth === d.id
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setNarrativeDepth(d.id as any)}
                          className={cn(
                            "p-2 rounded-xl border text-center transition-all",
                            isSelected
                              ? isDark ? "bg-teal/20 border-teal text-white ring-1 ring-teal" : "bg-navy text-white border-navy shadow-sm"
                              : isDark ? "bg-[#070d28] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-navy"
                          )}
                        >
                          <span className="text-xs font-bold block">{d.label}</span>
                          <span className="text-[9px] opacity-75 block">{d.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Card>

              {/* STEP 3: Multi-Format Document Generation */}
              <Card className={cn(
                "rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 transition-all",
                isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm text-navy"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-teal text-navy font-black text-xs flex items-center justify-center">3</span>
                    <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider">Multi-Format Export</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Deterministic Data Model</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => handleGenerateDomainReport("pdf")}
                    disabled={isGeneratingDoc}
                    className={cn(
                      "rounded-xl h-12 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all shadow-md active:scale-95",
                      isDark ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30" : "bg-rose-600 text-white hover:bg-rose-700"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span>{isGeneratingDoc && generatingFormat === "pdf" ? "Building..." : "Export PDF"}</span>
                  </Button>

                  <Button
                    onClick={() => handleGenerateDomainReport("docx")}
                    disabled={isGeneratingDoc}
                    className={cn(
                      "rounded-xl h-12 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all shadow-md active:scale-95",
                      isDark ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30" : "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    <FileCode className="h-4 w-4" />
                    <span>{isGeneratingDoc && generatingFormat === "docx" ? "Building..." : "Export Word"}</span>
                  </Button>

                  <Button
                    onClick={() => handleGenerateDomainReport("xlsx")}
                    disabled={isGeneratingDoc}
                    className={cn(
                      "rounded-xl h-12 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-all shadow-md active:scale-95",
                      isDark ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    )}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{isGeneratingDoc && generatingFormat === "xlsx" ? "Building..." : "Export Excel"}</span>
                  </Button>
                </div>
              </Card>

              {/* Collapsible: Advanced Parameters & Custom Governance */}
              <Card className={cn(
                "rounded-2xl border transition-all overflow-hidden",
                isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm text-navy"
              )}>
                <button
                  type="button"
                  onClick={() => setShowDomainAdvanced(!showDomainAdvanced)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-teal" />
                    <span>Advanced Governance &amp; Custom Filters</span>
                  </div>
                  {showDomainAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showDomainAdvanced && (
                  <div className="p-4 pt-1 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs animate-in fade-in">
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Custom Report Title</Label>
                      <Input
                        placeholder={`${TYPE_CONFIG[selectedDomainType].label} - Custom Title`}
                        value={customReportTitle}
                        onChange={e => setCustomReportTitle(e.target.value)}
                        className={cn("h-8 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Prepared For / Addressee</Label>
                      <Input
                        placeholder="e.g. Board of Directors, TRA Tax Auditors, Banking Partner"
                        value={preparedFor}
                        onChange={e => setPreparedFor(e.target.value)}
                        className={cn("h-8 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="font-bold block text-xs">Benchmark Variance Comparison</span>
                        <span className="text-[10px] text-slate-400">Compare against previous period to establish percentage trends</span>
                      </div>
                      <Switch checked={comparisonEnabled} onCheckedChange={setComparisonEnabled} />
                    </div>

                    {comparisonEnabled && (
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Comparison Benchmark</Label>
                        <Select value={comparisonBenchmark} onValueChange={(val: ComparisonType) => setComparisonBenchmark(val)}>
                          <SelectTrigger className={cn("h-8 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}>
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
                      <Label className="text-[10px] font-bold uppercase tracking-wider mb-1 block text-slate-400">Executive Management Commentary</Label>
                      <Textarea
                        placeholder="Add authoritative managerial guidance or observations to embed into the generated document narrative..."
                        value={managementCommentary}
                        onChange={e => setManagementCommentary(e.target.value)}
                        className={cn("text-xs rounded-xl min-h-[60px]", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-navy/20")}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN: Live Document Summary & Analytical Narrative Studio (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className={cn(
                "rounded-2xl sm:rounded-3xl p-5 border-2 transition-all space-y-4",
                isDark ? "bg-[#0a1033] border-slate-800 text-white" : "bg-white border-navy/20 shadow-sm text-navy"
              )}>
                {/* Branded Document Header (Sections 1 & 12 of Standard) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal text-navy font-black flex items-center justify-center shrink-0">
                      {React.createElement(TYPE_CONFIG[selectedDomainType].icon, { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base leading-tight">
                        {domainConfig.title}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Period: {domainPeriod.from} to {domainPeriod.to} &bull; For: {domainConfig.branding?.preparedFor}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchDomainPreview}
                      disabled={isDomainPreviewLoading}
                      className={cn(
                        "rounded-xl h-8 px-2.5 text-xs font-bold gap-1",
                        isDark ? "border-slate-700 text-slate-300 hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100"
                      )}
                    >
                      <RefreshCw className={cn("w-3 h-3", isDomainPreviewLoading && "animate-spin")} />
                      Refresh
                    </Button>
                    <Badge variant="outline" className="font-mono uppercase text-[10px] border-teal/40 text-teal">
                      Ref: QCL-REP-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}
                    </Badge>
                  </div>
                </div>

                {/* Section 5: Authoritative Deterministic KPI Cards */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Section 5 — Key Performance Indicators (Authoritative Data Model)
                  </span>

                  {isDomainPreviewLoading ? (
                    <div className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-teal mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Computing deterministic intelligence metrics...</p>
                    </div>
                  ) : domainPreviewPayload?.summary?.metrics && domainPreviewPayload.summary.metrics.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {domainPreviewPayload.summary.metrics.slice(0, 4).map((kpi: SummaryMetricItem, idx: number) => {
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">{kpi.label}</span>
                            <span className={cn("text-sm sm:text-base font-black block truncate mt-0.5", isDark ? "text-white" : "text-navy")}>
                              {String(kpi.value)}
                            </span>
                            {changeFormatted && (
                              <span className={cn(
                                "text-[10px] font-bold block mt-0.5",
                                isPositive ? "text-emerald-500" : isNegative ? "text-rose-500" : "text-slate-400"
                              )}>
                                {changeFormatted} vs prev
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <p className="text-xs text-slate-400">Data records will be aggregated directly from PostgreSQL database.</p>
                    </div>
                  )}
                </div>

                {/* Section 8: Visualizations & Charts */}
                {chartPreviewData.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Section 8 — Visual Performance Trajectory
                    </span>
                    <div className="h-40 w-full rounded-xl p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartPreviewData}>
                          <defs>
                            <linearGradient id="domainPreviewGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00A896" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#00A896" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#888888" />
                          <YAxis tick={{ fontSize: 9 }} stroke="#888888" />
                          <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          <Area type="monotone" dataKey="value" stroke="#00A896" strokeWidth={2} fillOpacity={1} fill="url(#domainPreviewGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Analytical Narrative Studio (Sections 3, 4, 6, 7, 9, 10 - Part F) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal" /> Sections 3–10: Analytical Business Intelligence Narrative
                    </span>
                    <span className="text-[10px] font-mono text-teal">Grounded in verified database records</span>
                  </div>

                  {/* Section Switcher Tabs */}
                  <div className="flex flex-wrap items-center gap-1 mb-3">
                    {[
                      { id: "summary", label: "Executive Summary" },
                      { id: "performance", label: "Performance Analysis" },
                      { id: "variance", label: "Variance Trends" },
                      { id: "findings", label: "Audit Findings" },
                      { id: "implications", label: "Implications & Risks" },
                      { id: "actions", label: "Action Plan" },
                      { id: "conclusion", label: "Conclusion" },
                    ].map(tab => {
                      const isActive = activeNarrativeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveNarrativeTab(tab.id)}
                          className={cn(
                            "py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all",
                            isActive
                              ? "bg-navy dark:bg-teal text-white dark:text-navy font-black shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                          )}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Narrative Display Box */}
                  <div className={cn(
                    "p-4 rounded-xl border text-xs leading-relaxed min-h-[140px]",
                    isDark ? "bg-[#070d28] border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  )}>
                    {isDomainPreviewLoading ? (
                      <div className="flex items-center justify-center h-28">
                        <RefreshCw className="w-5 h-5 animate-spin text-teal" />
                      </div>
                    ) : (
                      <>
                        {activeNarrativeTab === "summary" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 3: Executive Summary &amp; Management Briefing
                            </span>
                            <p className="whitespace-pre-line">
                              {domainPreviewPayload?.narrative?.executiveSummary ||
                                domainPreviewPayload?.summary?.executiveSummary ||
                                "This business intelligence report synthesizes verified transaction records for the active period to provide corporate leadership with actionable intelligence."}
                            </p>
                          </div>
                        )}

                        {activeNarrativeTab === "performance" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 6: Operational &amp; Financial Performance Analysis
                            </span>
                            <p className="whitespace-pre-line">
                              {domainPreviewPayload?.narrative?.performanceAnalysis ||
                                "Performance metrics indicate stable baseline operational throughput with adherence to configured governance rules."}
                            </p>
                          </div>
                        )}

                        {activeNarrativeTab === "variance" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 6B: Variance &amp; Period-over-Period Benchmark Trends
                            </span>
                            <p className="whitespace-pre-line">
                              {domainPreviewPayload?.narrative?.varianceAnalysis ||
                                "Comparison calculations reflect directional momentum across the measured domain metrics."}
                            </p>
                          </div>
                        )}

                        {activeNarrativeTab === "findings" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 9A: Key Audit Observations &amp; Evidence-Based Findings
                            </span>
                            <ul className="list-disc pl-4 space-y-1">
                              {(domainPreviewPayload?.narrative?.keyFindings || [
                                "All recorded transactions align with approved corporate chart of accounts.",
                                "Statutory 18% TRA VAT accounting reconciled with zero discrepancy.",
                                "Collections and receipts recorded through authorized gateway channels."
                              ]).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {activeNarrativeTab === "implications" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 9B: Business Implications &amp; Risk Assessment
                            </span>
                            <p className="whitespace-pre-line">
                              {domainPreviewPayload?.narrative?.businessImplications ||
                                "Working capital and operational continuity remain aligned with corporate risk appetites."}
                            </p>
                          </div>
                        )}

                        {activeNarrativeTab === "actions" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 9C: Prioritized Strategic Action Plan &amp; Directives
                            </span>
                            {domainPreviewPayload?.narrative?.actionPlan && domainPreviewPayload.narrative.actionPlan.length > 0 ? (
                              <div className="space-y-2">
                                {domainPreviewPayload.narrative.actionPlan.map((act, i) => (
                                  <div key={i} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a1033] flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn(
                                          "text-[9px] font-bold px-1.5 py-0.2",
                                          act.priority === "high" ? "border-rose-500/30 text-rose-500 bg-rose-500/10" : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                        )}>
                                          {act.priority.toUpperCase()}
                                        </Badge>
                                        <span className="font-bold text-xs">{act.action}</span>
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-1">{act.reason}</p>
                                    </div>
                                    <div className="text-right shrink-0 text-[10px] text-slate-400 font-mono">
                                      <div>{act.role}</div>
                                      <div className="text-teal font-semibold">{act.timeframe}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>Action plan generated based on audited exception items.</p>
                            )}
                          </div>
                        )}

                        {activeNarrativeTab === "conclusion" && (
                          <div className="space-y-2">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-teal block">
                              Section 10: Conclusion &amp; Next Steps
                            </span>
                            <p className="whitespace-pre-line">
                              {domainPreviewPayload?.narrative?.conclusion ||
                                "In summary, QuardCube Labs operations reflect consistent business execution across the active reporting period."}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Section 12: Headers, Footers & Corporate Sign-off Block */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2">
                  <div>
                    <span className="font-semibold text-slate-300">QUARDCUBE LABS LIMITED</span> &bull; Makumbusho, Millennium Tower 14th Floor
                  </div>
                  <div className="flex items-center gap-3">
                    <span>TIN: 142-981-229</span>
                    <span>VAT: 40-029182-M</span>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB 3: SAVED REPORT ARCHIVE HISTORY                           */}
        {/* ============================================================= */}
        <TabsContent value="saved-archive" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search archive history by report title or author..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={archiveFilterType} onValueChange={setArchiveFilterType}>
                <SelectTrigger className="w-44 h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(Object.keys(TYPE_CONFIG) as ReportType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card
            className={cn(
              "rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 w-full shadow-lg",
              isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-navy text-white font-black border-b border-navy/30">
                    <th className="py-2.5 sm:py-3.5 px-4 font-black text-white uppercase tracking-wider text-[10px] sm:text-xs">Report Name</th>
                    <th className="py-2.5 sm:py-3.5 px-4 font-black text-white uppercase tracking-wider text-[10px] sm:text-xs">Domain</th>
                    <th className="py-2.5 sm:py-3.5 px-4 font-black text-white uppercase tracking-wider text-[10px] sm:text-xs">Format</th>
                    <th className="py-2.5 sm:py-3.5 px-4 font-black text-white uppercase tracking-wider text-[10px] sm:text-xs">Date Generated</th>
                    <th className="py-2.5 sm:py-3.5 px-4 font-black text-white uppercase tracking-wider text-[10px] sm:text-xs">Created By</th>
                    <th className="py-2.5 sm:py-3.5 px-4 font-black text-white uppercase tracking-wider text-right text-[10px] sm:text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/10 text-xs">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-medium">
                        No archived reports on record. Generate a report in the Domain Reports tab to begin archival logging.
                      </td>
                    </tr>
                  ) : (
                    reports.map((rep) => (
                      <tr
                        key={rep.id}
                        className={cn(
                          "transition-colors",
                          isDark ? "border-b border-navy/20 hover:bg-teal/30 hover:text-white" : "border-b border-navy/10 hover:bg-teal/50 hover:text-navy"
                        )}
                      >
                        <td className="px-4 py-3 font-bold">
                          <span className={cn(isDark ? "text-white" : "text-navy")}>{rep.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] capitalize font-mono", isDark ? "border-teal/30 text-slate-300 bg-teal/10" : "border-navy/20 text-navy bg-slate-50")}>
                            {rep.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-mono font-bold",
                              rep.file_format === "pdf" && "border-rose-500/30 text-rose-500 bg-rose-500/10",
                              rep.file_format === "xlsx" && "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
                              rep.file_format === "docx" && "border-blue-500/30 text-blue-500 bg-blue-500/10"
                            )}
                          >
                            {rep.file_format || "PDF"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(rep.created_at).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {rep.created_by}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {rep.file_url ? (
                            <a
                              href={rep.file_url}
                              download
                              className={cn(
                                "inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm",
                                isDark ? "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30" : "bg-navy text-white hover:bg-navy/90"
                              )}
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsPdfPreviewOpen(true)}
                              className="h-7 text-xs text-primary"
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" /> View
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================= */}
      {/* PUBLICATION-READY PRINT / PDF REPORT PREVIEW MODAL             */}
      {/* ============================================================= */}
      <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
        <DialogContent className={cn("w-[95vw] sm:max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 shadow-2xl", isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy")}>
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-teal-500/20 text-teal-300 border-teal-500/30" : "bg-navy text-teal border-navy/20")}>
                    <Printer className="h-4 w-4" />
                  </div>
                  Official Executive Audit Report — Print / Save as PDF
                </DialogTitle>
                <DialogDescription className={cn("text-xs mt-1", isDark ? "text-slate-300" : "text-navy/70")}>
                  Authenticated executive audit summary with verified figures, statutory TRA VAT accounting, and corporate authorization.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className={cn("rounded-xl text-xs font-bold h-9", isDark ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrintPdf}
                  className={cn("rounded-xl text-xs font-bold gap-1.5 shadow-md h-9", isDark ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black" : "bg-navy hover:bg-navy/90 text-white")}
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Printable Document Body */}
          <div ref={printRef} className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070d28] rounded-2xl border border-slate-200 dark:border-slate-800 mt-2">
            {/* 1. Official Corporate Letterhead */}
            <div className="flex flex-col sm:flex-row items-start justify-between pb-6 border-b-2 border-navy gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-navy dark:text-white">
                  QUARDCUBE LABS LIMITED
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Enterprise Technology, Security &amp; Business Intelligence Solutions
                </p>
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p>Makumbusho, Millennium Tower 14th Floor, Dar es Salaam, Tanzania</p>
                  <p>TIN: 142-981-229 &bull; VAT Reg: 40-029182-M &bull; Tel: +255 623 893 383</p>
                  <p>Email: info@quardcubelabs.co.tz &bull; Web: www.quardcubelabs.co.tz</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <Badge className="bg-navy text-white uppercase tracking-wider text-[10px] px-2.5 py-1">
                  OFFICIAL AUDIT REPORT
                </Badge>
                <p className="text-xs font-mono font-bold mt-2">Ref: QCL-REP-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</p>
                <p className="text-[11px] text-slate-400">Date: {new Date().toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            {/* 2. Document Title & Period */}
            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-navy dark:text-white">
                Filtered Executive Performance &amp; Transactions Audit Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Period: {startDate || "All Historic Records"} through {endDate || "Current Date"}
              </p>
            </div>

            {/* 3. Applied Filters Manifest Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/40 text-xs">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block mb-1">
                Applied Audit Scope &amp; Parameters:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div><span className="text-slate-400">Category:</span> <b className="text-slate-700 dark:text-slate-200">{selectedCategory}</b></div>
                <div><span className="text-slate-400">Location:</span> <b className="text-slate-700 dark:text-slate-200">{selectedLocation}</b></div>
                <div><span className="text-slate-400">Salesman:</span> <b className="text-slate-700 dark:text-slate-200">{selectedSalesman}</b></div>
                <div><span className="text-slate-400">Doc Type:</span> <b className="text-slate-700 dark:text-slate-200">{selectedReceiptType}</b></div>
                <div><span className="text-slate-400">Customer:</span> <b className="text-slate-700 dark:text-slate-200">{selectedCustomer}</b></div>
                <div><span className="text-slate-400">Mode:</span> <b className="text-slate-700 dark:text-slate-200">{selectedMode}</b></div>
                <div><span className="text-slate-400">Payment:</span> <b className="text-slate-700 dark:text-slate-200">{selectedPaymentMethod}</b></div>
                <div><span className="text-slate-400">VAT Status:</span> <b className="text-slate-700 dark:text-slate-200">{selectedVatStatus}</b></div>
              </div>
            </div>

            {/* 4. Financial KPI Summary Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Gross Value</span>
                <div className="text-base font-bold font-mono text-navy dark:text-white mt-1">
                  TZS {summary.totalGross.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Taxable Subtotal</span>
                <div className="text-base font-bold font-mono text-blue-600 mt-1">
                  TZS {summary.totalSubtotal.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">TRA 18% Output VAT</span>
                <div className="text-base font-bold font-mono text-amber-600 mt-1">
                  TZS {summary.totalVat.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Audited Records</span>
                <div className="text-base font-bold font-mono text-emerald-600 mt-1">
                  {records.length} Documents
                </div>
              </div>
            </div>

            {/* 5. Detailed Transaction Register Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-navy text-white font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Doc #</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Customer / Entity</th>
                    <th className="p-2">Items Summary</th>
                    <th className="p-2 text-right">Subtotal</th>
                    <th className="p-2 text-right">VAT 18%</th>
                    <th className="p-2 text-right">Total (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/50"}>
                      <td className="p-2 font-mono whitespace-nowrap">{r.date}</td>
                      <td className="p-2 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.document_number}</td>
                      <td className="p-2 uppercase font-mono text-[9px]">{r.document_type}</td>
                      <td className="p-2 font-medium max-w-[140px] truncate">{r.customer_name}</td>
                      <td className="p-2 max-w-[180px] truncate text-slate-500">{r.items_summary}</td>
                      <td className="p-2 text-right font-mono">{r.subtotal.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-amber-600">{r.vat_amount.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-bold">{r.total_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-navy">
                    <td colSpan={5} className="p-2 text-right font-bold text-xs">TOTAL AUDITED SUM:</td>
                    <td className="p-2 text-right font-mono text-xs">{summary.totalSubtotal.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-xs text-amber-600">{summary.totalVat.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-xs text-navy dark:text-white">TZS {summary.totalGross.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Legal Compliance & Sign-off Block */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6 text-[11px] text-slate-500">
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Prepared By:</p>
                <div className="mt-8 border-b border-slate-300 dark:border-slate-700 w-36" />
                <p className="mt-1 font-semibold">Lead Business Analyst</p>
                <p className="text-[10px]">QuardCube Labs Directorate</p>
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Financial Audit Review:</p>
                <div className="mt-8 border-b border-slate-300 dark:border-slate-700 w-36" />
                <p className="mt-1 font-semibold">Chief Financial Officer</p>
                <p className="text-[10px]">Treasury &amp; Tax Compliance</p>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-bold text-slate-700 dark:text-slate-300">Executive Authorization:</p>
                <div className="mt-8 border-b border-slate-300 dark:border-slate-700 w-36 sm:ml-auto" />
                <p className="mt-1 font-semibold">Managing Director</p>
                <p className="text-[10px]">QuardCube Labs Limited</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
