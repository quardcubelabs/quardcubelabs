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
  ReportConfiguration
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
  Clock
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
      <div className={cn(
        "p-5 sm:p-6 rounded-2xl shadow-md border-0",
        isDark ? "bg-[#0a1033] text-white" : "bg-[#000080] text-white"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#40E0D0]/20 text-[#40E0D0] border border-[#40E0D0]/30 shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
                Business Intelligence <span className="text-[#40E0D0]">& Dynamic Reports</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Multi-dimensional filtering across invoices, receipts, items, locations, sales reps, VAT, and payments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadFilteredData}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isLoading && "animate-spin")} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
              <CardContent className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-500">
                  Filtered Gross Revenue
                </span>
                <div className="mt-1.5 text-xl font-bold font-mono text-teal-500">
                  TZS {summary.totalGross.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Total value with taxes</p>
              </CardContent>
            </Card>

            <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
              <CardContent className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                  Taxable Net Subtotal
                </span>
                <div className="mt-1.5 text-xl font-bold font-mono text-blue-500">
                  TZS {summary.totalSubtotal.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Pre-tax sales turnover</p>
              </CardContent>
            </Card>

            <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
              <CardContent className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  TRA 18% Output VAT
                </span>
                <div className="mt-1.5 text-xl font-bold font-mono text-amber-500">
                  TZS {summary.totalVat.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Total statutory VAT liability</p>
              </CardContent>
            </Card>

            <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
              <CardContent className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Transaction Count
                </span>
                <div className="mt-1.5 text-xl font-bold font-mono">
                  {summary.recordCount}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Matching document records</p>
              </CardContent>
            </Card>

            <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
              <CardContent className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                  Average Ticket Size
                </span>
                <div className="mt-1.5 text-xl font-bold font-mono text-emerald-500">
                  TZS {summary.averageTicket.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Mean settlement per order</p>
              </CardContent>
            </Card>
          </div>

          {/* Export Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-500/5">
            <div>
              <h3 className="font-bold text-sm">Filtered Data Export & Document Generation</h3>
              <p className="text-xs text-slate-500">
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
                className="h-9 px-3.5 text-xs font-bold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white"
              >
                <FileSpreadsheet className={cn("mr-1.5 h-4 w-4", isExportingExcel && "animate-spin")} />
                {isExportingExcel ? "Generating Excel..." : "Generate Excel (.xlsx)"}
              </Button>

              {/* PDF Preview & Print Button */}
              <Button
                size="sm"
                onClick={() => setIsPdfPreviewOpen(true)}
                disabled={records.length === 0}
                className="h-9 px-3.5 text-xs font-bold bg-[#000080] text-white hover:bg-[#000080]/90 shadow-sm"
              >
                <Printer className="mr-1.5 h-4 w-4 text-[#40E0D0]" />
                Generate PDF Document
              </Button>

              {/* CSV Fast Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={records.length === 0}
                className="h-9 px-3 text-xs border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </div>

          {/* Filtered Records Data Table */}
          <Card className={cn("overflow-hidden", isDark ? "bg-[#0d0d12]/90 border-slate-800" : "bg-white border-slate-200")}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={cn("border-b font-bold uppercase tracking-wider text-[11px]", isDark ? "border-slate-800 bg-slate-900/60 text-slate-400" : "border-slate-200 bg-slate-100/70 text-slate-600")}>
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Document #</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Customer / Entity</th>
                    <th className="px-3 py-3">Salesman</th>
                    <th className="px-3 py-3">Location & Mode</th>
                    <th className="px-3 py-3">Items / Narrative</th>
                    <th className="px-3 py-3">Payment Channel</th>
                    <th className="px-3 py-3 text-right">Subtotal</th>
                    <th className="px-3 py-3 text-right">VAT (18%)</th>
                    <th className="px-3 py-3 text-right">Total (TZS)</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-slate-500 text-sm">
                        No transactions found matching the applied filter criteria. Try broadening your dates or clearing filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((tx) => (
                      <tr key={tx.id} className={cn("transition-colors", isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50")}>
                        <td className="px-3 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                          {tx.document_number}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono border-slate-500/30">
                            {tx.document_type.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 font-medium max-w-[180px] truncate" title={tx.customer_name}>
                          {tx.customer_name}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                          {tx.salesman}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          <div className="font-medium text-slate-600 dark:text-slate-300">{tx.location}</div>
                          <div className="text-[10px] text-slate-400">{tx.mode}</div>
                        </td>
                        <td className="px-3 py-2.5 max-w-[220px] truncate text-slate-600 dark:text-slate-400" title={tx.items_summary}>
                          {tx.items_summary}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                          {tx.payment_method}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                          {tx.subtotal.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-amber-500">
                          {tx.vat_amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-teal-500 whitespace-nowrap">
                          TZS {tx.total_amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize font-normal border",
                              (tx.status === "paid" || tx.status === "settled") && "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
                              tx.status === "open" && "border-blue-500/30 text-blue-500 bg-blue-500/10",
                              tx.status === "partially_paid" && "border-amber-500/30 text-amber-500 bg-amber-500/10",
                              tx.status === "overdue" && "border-rose-500/30 text-rose-500 bg-rose-500/10",
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
        {/* TAB 2: STANDARD BUSINESS DOMAIN REPORTS                       */}
        {/* ============================================================= */}
        <TabsContent value="standard-domains" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(Object.keys(TYPE_CONFIG) as ReportType[]).map((domainKey) => {
              const conf = TYPE_CONFIG[domainKey]
              const Icon = conf.icon
              const isExportingThis = quickExporting?.startsWith(domainKey)

              return (
                <Card
                  key={domainKey}
                  className={cn("p-4 border transition-all hover:scale-[1.01]", isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-[#000080]/10 dark:bg-[#40E0D0]/10 text-[#000080] dark:text-[#40E0D0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] border", conf.badgeClass)}>
                      Executive
                    </Badge>
                  </div>

                  <h3 className="mt-3 font-bold text-sm">{conf.label}</h3>
                  <p className="text-xs text-slate-500 mt-1 h-8">{conf.desc}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportExcel()}
                      className="h-7 text-xs flex-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      <FileSpreadsheet className="mr-1 h-3 w-3" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsPdfPreviewOpen(true)}
                      className="h-7 text-xs flex-1 bg-[#000080] text-white hover:bg-[#000080]/90"
                    >
                      <Printer className="mr-1 h-3 w-3 text-[#40E0D0]" />
                      PDF
                    </Button>
                  </div>
                </Card>
              )
            })}
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

          <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={cn("border-b font-bold uppercase text-[11px]", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  <tr>
                    <th className="px-4 py-3">Report Name</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Date Generated</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No archived reports on record.
                      </td>
                    </tr>
                  ) : (
                    reports.map((rep) => (
                      <tr key={rep.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                        <td className="px-4 py-3 font-medium">
                          {rep.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] capitalize font-mono">
                            {rep.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 uppercase font-mono font-bold text-teal-500">
                          {rep.file_format || "PDF"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(rep.created_at).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {rep.created_by}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsPdfPreviewOpen(true)}
                            className="h-7 text-xs text-primary"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Button>
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
        <DialogContent className={cn("max-w-4xl max-h-[90vh] overflow-y-auto p-0", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Printer className="h-4 w-4 text-[#000080] dark:text-[#40E0D0]" />
              Official Executive Report Document Preview (Print to PDF)
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrintPdf} className="bg-[#000080] text-white hover:bg-[#000080]/90 text-xs font-bold">
                <Printer className="mr-1.5 h-3.5 w-3.5 text-[#40E0D0]" />
                Print / Save as PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsPdfPreviewOpen(false)} className="text-xs">
                Close
              </Button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div ref={printRef} className="p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-[#0a0a14]">
            {/* 1. Official Corporate Letterhead */}
            <div className="flex items-start justify-between pb-6 border-b-2 border-[#000080]">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#000080] dark:text-[#40E0D0]">
                  QUARDCUBE LABS LIMITED
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Enterprise Technology, Security & Business Intelligence Solutions
                </p>
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p>Makumbusho, Millennium Tower 14th Floor, Dar es Salaam, Tanzania</p>
                  <p>TIN: 142-981-229  |  VAT Reg: 40-029182-M  |  Tel: +255 623 893 383</p>
                  <p>Email: info@quardcubelabs.co.tz  |  Web: www.quardcubelabs.co.tz</p>
                </div>
              </div>

              <div className="text-right">
                <Badge className="bg-[#000080] text-white uppercase tracking-wider text-[10px] px-2.5 py-1">
                  OFFICIAL AUDIT REPORT
                </Badge>
                <p className="text-xs font-mono font-bold mt-2">Ref: QCL-REP-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</p>
                <p className="text-[11px] text-slate-400">Date: {new Date().toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            {/* 2. Document Title & Period */}
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-[#000080] dark:text-white">
                Filtered Executive Performance & Transactions Audit Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Period: {startDate || "All Historic Records"} through {endDate || "Current Date"}
              </p>
            </div>

            {/* 3. Applied Filters Manifest Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/40 text-xs">
              <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                Applied Audit Scope & Parameters:
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
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Gross Value</span>
                <div className="text-base font-bold font-mono text-[#000080] dark:text-[#40E0D0] mt-1">
                  TZS {summary.totalGross.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Taxable Subtotal</span>
                <div className="text-base font-bold font-mono text-blue-600 mt-1">
                  TZS {summary.totalSubtotal.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">TRA 18% Output VAT</span>
                <div className="text-base font-bold font-mono text-amber-600 mt-1">
                  TZS {summary.totalVat.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <span className="text-[10px] uppercase font-bold text-slate-400">Audited Records</span>
                <div className="text-base font-bold font-mono text-emerald-600 mt-1">
                  {records.length} Documents
                </div>
              </div>
            </div>

            {/* 5. Detailed Transaction Register Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#000080] text-white font-bold text-[10px] uppercase tracking-wider">
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
                      <td className="p-2 font-mono font-bold text-[#000080] dark:text-[#40E0D0] whitespace-nowrap">{r.document_number}</td>
                      <td className="p-2 uppercase font-mono text-[9px]">{r.document_type}</td>
                      <td className="p-2 font-medium max-w-[140px] truncate">{r.customer_name}</td>
                      <td className="p-2 max-w-[180px] truncate text-slate-500">{r.items_summary}</td>
                      <td className="p-2 text-right font-mono">{r.subtotal.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-amber-600">{r.vat_amount.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-bold">{r.total_amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-[#000080]">
                    <td colSpan={5} className="p-2 text-right font-bold text-xs">TOTAL AUDITED SUM:</td>
                    <td className="p-2 text-right font-mono text-xs">{summary.totalSubtotal.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-xs text-amber-600">{summary.totalVat.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-xs text-[#000080] dark:text-[#40E0D0]">TZS {summary.totalGross.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. Legal Compliance & Sign-off Block */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-6 text-[11px] text-slate-500">
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
                <p className="text-[10px]">Treasury & Tax Compliance</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-700 dark:text-slate-300">Executive Authorization:</p>
                <div className="mt-8 border-b border-slate-300 dark:border-slate-700 w-36 ml-auto" />
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
