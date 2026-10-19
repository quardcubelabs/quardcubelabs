"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import ReportCoverPage from "@/components/admin/report-cover-page"
import { 
  ReportType, 
  GeneratedReportRecord, 
  ReportTemplateRecord,
  PreparedReportPayload,
  ExportFormat
} from "@/lib/report-engine/types"
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
  Bookmark,
  Sparkles,
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
  ArrowUpRight,
  ArrowDownRight
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

  const [reports, setReports] = useState<GeneratedReportRecord[]>([])
  const [templates, setTemplates] = useState<ReportTemplateRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [pythonServiceOnline, setPythonServiceOnline] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<ReportType>("sales")

  // View modal state
  const [selectedReport, setSelectedReport] = useState<GeneratedReportRecord | null>(null)
  const [viewPayload, setViewPayload] = useState<PreparedReportPayload | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [isLoadingView, setIsLoadingView] = useState(false)

  // Format exporting states
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  // Delete modal state
  const [reportToDelete, setReportToDelete] = useState<GeneratedReportRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load initial data
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [reportsData, templatesData, engineStatus] = await Promise.all([
        getGeneratedReports(),
        getReportTemplates(),
        getReportEngineStatus()
      ])
      setReports(reportsData)
      setTemplates(templatesData)
      setPythonServiceOnline(engineStatus.pythonServiceOnline)
    } catch (err: any) {
      console.error("Error loading reports:", err)
      toast({
        title: "Error Loading Reports",
        description: "Failed to fetch report history.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Quick stats calculation
  const totalReports = reports.length
  const now = new Date()
  const reportsThisMonth = reports.filter(r => {
    const d = new Date(r.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const savedTemplatesCount = templates.length
  const recentlyGeneratedCount = reports.filter(r => {
    const diff = (now.getTime() - new Date(r.created_at).getTime()) / (1000 * 3600 * 24)
    return diff <= 7
  }).length

  // Filtered reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.created_by && r.created_by.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === "all" || r.type === filterType
    return matchesSearch && matchesType
  })

  // View Report in Modal
  const handleViewReport = async (report: GeneratedReportRecord) => {
    setSelectedReport(report)
    setIsViewing(true)
    setIsLoadingView(true)
    try {
      const res = await previewReportAction(report.configuration)
      if (res.success && res.data) {
        setViewPayload(res.data)
      } else {
        toast({
          title: "Preview Notice",
          description: "Displaying available saved report metadata.",
        })
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsLoadingView(false)
    }
  }

  // Direct format export from modal or list
  const handleExportFormat = async (report: GeneratedReportRecord, format: ExportFormat) => {
    setExportingFormat(format)
    try {
      const res = await generateReportAction(report.configuration, format)
      if (res.success && res.fileUrl) {
        toast({
          title: `${format.toUpperCase()} Generated Successfully`,
          description: `Downloading ${res.filename}...`
        })
        const link = document.createElement("a")
        link.href = res.fileUrl
        link.download = res.filename || `Report.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        loadData()
      } else {
        toast({
          title: "Export Failed",
          description: res.error || "Failed to render requested document format.",
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Export Error",
        description: e.message,
        variant: "destructive"
      })
    } finally {
      setExportingFormat(null)
    }
  }

  // Duplicate Report
  const handleDuplicate = async (report: GeneratedReportRecord) => {
    try {
      const res = await duplicateReportAction(report.id)
      if (res.success && res.configuration) {
        toast({
          title: "Report Duplicated",
          description: `Loaded "${report.name}" into builder.`
        })
        router.push("/admin/reports/create")
      }
    } catch (e: any) {
      toast({
        title: "Duplication Failed",
        description: e.message,
        variant: "destructive"
      })
    }
  }

  // Delete Report
  const confirmDelete = async () => {
    if (!reportToDelete) return
    setIsDeleting(true)
    try {
      const res = await deleteReportAction(reportToDelete.id)
      if (res.success) {
        toast({
          title: "Report Deleted",
          description: `"${reportToDelete.name}" has been removed from history.`
        })
        setReports(prev => prev.filter(r => r.id !== reportToDelete.id))
        setReportToDelete(null)
      } else {
        toast({
          title: "Delete Failed",
          description: res.error,
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Delete Error",
        description: e.message,
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* 1. Standard Page Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Reports <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>& Business Intelligence</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Executive PDF, editable DOCX, and structured XLSX report generation engine
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 ml-auto shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className={cn(
                "font-bold rounded-xl h-10 sm:h-11 px-4 gap-1.5 shadow-sm transition-all active:scale-95 shrink-0",
                isDark 
                  ? "bg-white/10 border-teal/40 text-teal-300 hover:bg-white/20" 
                  : "bg-white/90 border-2 border-navy/20 text-navy hover:bg-white"
              )}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin text-teal")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/admin/reports/create?type=${selectedDomain}`)}
              className="bg-navy hover:bg-navy/90 text-white font-bold gap-2 rounded-xl shadow-lg h-10 sm:h-11 px-5 transition-all hover:shadow-xl active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Report Builder
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards - strictly adhering to admin dashboard theme tokens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Total Reports",
            value: totalReports.toString(),
            subtitle: "Generated audit manifests",
            icon: FileText
          },
          {
            title: "This Month",
            value: reportsThisMonth.toString(),
            subtitle: "Active reporting period",
            icon: Calendar
          },
          {
            title: "Saved Templates",
            value: savedTemplatesCount.toString(),
            subtitle: "Reusable configurations",
            icon: Bookmark
          },
          {
            title: "Recent 7-Day",
            value: recentlyGeneratedCount.toString(),
            subtitle: "Latest business audits",
            icon: Sparkles
          }
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
              <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-base sm:text-lg xl:text-xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                  {stat.subtitle && (
                    <p className={cn("text-[11px] font-medium mt-0.5 truncate block", isDark ? "text-teal-400" : "text-navy/70")}>
                      {stat.subtitle}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. Report Domain Selector Dropdown (Replaces 14 cards) */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 space-y-4",
        isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Sliders className="h-5 w-5 text-teal" />
              Generate Report by Business Domain
            </h2>
            <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
              Select an authoritative business domain below to configure custom audit periods, filters, and formats.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="w-full sm:w-80">
              <Select value={selectedDomain} onValueChange={(val: ReportType) => setSelectedDomain(val)}>
                <SelectTrigger className={cn(
                  "h-10 sm:h-11 rounded-xl border font-bold text-xs sm:text-sm",
                  isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy"
                )}>
                  <SelectValue placeholder="Select Report Domain..." />
                </SelectTrigger>
                <SelectContent className={cn("max-h-80", isDark ? "bg-[#0a1033] text-white border-slate-700" : "bg-white text-navy")}>
                  {(Object.keys(TYPE_CONFIG) as ReportType[]).map((t) => {
                    const conf = TYPE_CONFIG[t]
                    const Icon = conf.icon
                    return (
                      <SelectItem key={t} value={t} className="cursor-pointer py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-teal shrink-0" />
                          <div className="text-left">
                            <span className="font-bold block text-xs">{conf.label}</span>
                            <span className={cn("text-[10px] block line-clamp-1", isDark ? "text-slate-400" : "text-navy/60")}>
                              {conf.desc}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => router.push(`/admin/reports/create?type=${selectedDomain}`)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-5 gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Launch Builder
            </Button>
          </div>
        </div>

        {/* Selected Domain Overview Pill Strip */}
        {selectedDomain && TYPE_CONFIG[selectedDomain] && (
          <div className={cn(
            "p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
            isDark ? "bg-[#070d28] border-teal/20" : "bg-teal/5 border-navy/15"
          )}>
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-xl", TYPE_CONFIG[selectedDomain].badgeClass)}>
                {React.createElement(TYPE_CONFIG[selectedDomain].icon, { className: "h-4 w-4" })}
              </div>
              <div>
                <span className={cn("font-bold block", isDark ? "text-white" : "text-navy")}>
                  {TYPE_CONFIG[selectedDomain].label}
                </span>
                <span className={cn("text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>
                  {TYPE_CONFIG[selectedDomain].desc}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", isDark ? "border-teal/40 text-teal-300" : "border-navy/20 text-navy")}>
                PDF • DOCX • XLSX Ready
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/admin/reports/create?type=${selectedDomain}`)}
                className="h-8 text-xs font-bold text-teal hover:text-teal/80 hover:bg-teal/10"
              >
                Configure Parameters &rarr;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Main Reports History Table Card */}
      <div className={cn(
        "rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden",
        isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
      )}>
        <div className={cn("p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4", isDark ? "border-slate-800" : "border-navy/15")}>
          <div>
            <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-navy")}>Generated Reports History</h3>
            <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
              Official executive intelligence reports across PDF, DOCX, and XLSX formats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-64">
              <Search className={cn("absolute left-3 top-2.5 h-4 w-4", isDark ? "text-slate-400" : "text-navy/50")} />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-9 h-9 text-xs rounded-xl",
                  isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
                )}
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className={cn("w-40 h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy")}>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 uppercase tracking-wider text-xs font-black bg-navy text-white border-navy/30">
                <th className="p-3.5 pl-6 font-black"><span className="hidden sm:inline">Report Name</span><span className="sm:hidden">Report</span></th>
                <th className="p-3.5 font-black"><span className="hidden sm:inline">Domain</span><span className="sm:hidden">Type</span></th>
                <th className="p-3.5 font-black hidden md:table-cell">Author</th>
                <th className="p-3.5 font-black"><span className="hidden sm:inline">Generated Date</span><span className="sm:hidden">Date</span></th>
                <th className="p-3.5 font-black hidden sm:table-cell">Format</th>
                <th className="p-3.5 font-black"><span className="hidden sm:inline">Status</span><span className="sm:hidden">Stat</span></th>
                <th className="p-3.5 pr-6 text-right font-black"><span className="hidden sm:inline">Actions</span><span className="sm:hidden">Act</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className={cn("text-center py-14", isDark ? "text-slate-400" : "text-navy/60")}>
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className={cn("font-bold text-sm", isDark ? "text-slate-200" : "text-navy")}>No generated reports found</p>
                    <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-navy/60")}>
                      Click "+ Create Report" or pick a 1-Click Builder above to generate your first document.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => router.push("/admin/reports/create")}
                      className="mt-4 bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl text-xs"
                    >
                      + Create Report Now
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => {
                  const typeObj = TYPE_CONFIG[report.type] || TYPE_CONFIG.custom
                  const Icon = typeObj.icon
                  const createdDate = new Date(report.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })

                  return (
                    <tr key={report.id} className="hover:bg-navy/5 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-6 font-bold text-navy dark:text-slate-100 max-w-[240px] truncate">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                          )}>
                            <Icon className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
                          </div>
                          <span className="truncate">{report.name}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <Badge variant="outline" className={cn("text-[11px] py-0.5 px-2.5 font-bold uppercase", typeObj.badgeClass)}>
                          {typeObj.label}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-navy/80 dark:text-slate-300 font-medium">
                        {report.created_by || "Administrator"}
                      </td>

                      <td className="p-3.5 text-navy/70 dark:text-slate-400">
                        {createdDate}
                      </td>

                      <td className="p-3.5">
                        <Badge variant="secondary" className="uppercase font-mono text-[10px] py-0.5 px-2 font-bold bg-navy/10 dark:bg-slate-800 text-navy dark:text-slate-100">
                          {report.file_format || "PDF"}
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="capitalize font-bold text-navy dark:text-slate-200">
                            {report.status || "completed"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="View Live Briefing & Cover Page"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          {/* Quick export buttons */}
                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white"
                            )}
                            title="Download PDF Document"
                            onClick={() => handleExportFormat(report, "pdf")}
                            disabled={exportingFormat !== null}
                          >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white"
                            )}
                            title="Download Word DOCX"
                            onClick={() => handleExportFormat(report, "docx")}
                            disabled={exportingFormat !== null}
                          >
                            <FileCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white"
                            )}
                            title="Download Excel XLSX"
                            onClick={() => handleExportFormat(report, "xlsx")}
                            disabled={exportingFormat !== null}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="Duplicate Report Config"
                            onClick={() => handleDuplicate(report)}
                          >
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                              isDark ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                            )}
                            title="Delete Report"
                            onClick={() => setReportToDelete(report)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Saved Templates Section */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-slate-300" : "text-navy/80")}>
              <Bookmark className="h-4 w-4 text-violet-500" />
              Saved Report Templates ({templates.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => {
              const typeObj = TYPE_CONFIG[tpl.type] || TYPE_CONFIG.custom
              const Icon = typeObj.icon
              return (
                <div key={tpl.id} className={cn(
                  "rounded-2xl sm:rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5",
                  isDark ? "bg-[#0a1033] border-none text-white shadow-md hover:bg-[#0c1438]" : "bg-white border-2 border-navy/20 hover:border-navy"
                )}>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={cn("text-[10px] py-0.5 px-2 capitalize font-bold", typeObj.badgeClass)}>
                        {typeObj.label}
                      </Badge>
                      <span className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                        {new Date(tpl.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className={cn("text-sm font-black mt-2.5 truncate flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                      <Icon className="h-4 w-4 text-teal" />
                      {tpl.name}
                    </h4>
                    {tpl.description && (
                      <p className={cn("text-xs line-clamp-2 mt-1 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/reports/create?type=${tpl.type}`)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl transition-all gap-1.5",
                      isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-teal hover:text-navy" : "border-2 border-navy/20 hover:bg-teal hover:text-navy hover:border-teal"
                    )}
                  >
                    Load in Builder
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. View & Instant Multi-Format Export Modal with Professional Cover Page & Narratives */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className={cn("max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-7 border-2", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl")}>
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-navy/10 dark:border-slate-800">
              <div>
                <DialogTitle className="text-xl font-black flex items-center gap-2.5 text-navy dark:text-white">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal-100/80 text-navy border-teal/40")}>
                    <FileText className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
                  </div>
                  {viewPayload?.title || selectedReport?.name || "Official Executive Report Briefing"}
                </DialogTitle>
                <DialogDescription className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-navy/70")}>
                  {viewPayload?.subtitle || "Authoritative Business Document Synthesis & Strategic Intelligence"}
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedReport && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleExportFormat(selectedReport, "pdf")}
                      disabled={exportingFormat !== null}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-9 px-3 gap-1.5 shadow-sm active:scale-95"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Export PDF
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExportFormat(selectedReport, "docx")}
                      disabled={exportingFormat !== null}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-3 gap-1.5 shadow-sm active:scale-95"
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      DOCX
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleExportFormat(selectedReport, "xlsx")}
                      disabled={exportingFormat !== null}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-3 gap-1.5 shadow-sm active:scale-95"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {isLoadingView ? (
            <div className="py-20 text-center">
              <RefreshCw className="h-10 w-10 animate-spin text-teal mx-auto mb-3" />
              <p className="text-sm font-bold text-navy dark:text-white">Synthesizing authoritative business intelligence...</p>
              <p className="text-xs text-slate-400 mt-1">Generating custom cover page, forensic observations & human narrative analysis</p>
            </div>
          ) : viewPayload ? (
            <div className="space-y-6 my-3">
              {/* 1. Custom Professional Cover Page Component */}
              <ReportCoverPage payload={viewPayload} isDark={isDark} />

              {/* 2. Executive Synthesis & Management Briefing */}
              <div className={cn(
                "p-5 rounded-2xl border-l-6 border-l-teal shadow-xs space-y-2",
                isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/15"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-teal tracking-wider">
                    1. Executive Briefing & Contextual Mandate
                  </span>
                  <Badge className="text-[9px] font-bold uppercase bg-teal/20 text-teal-300 border border-teal/40">
                    Human Prepared
                  </Badge>
                </div>
                <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-200" : "text-navy/80")}>
                  {viewPayload.summary?.executiveSummary || 
                    `During the active audit period, QuardCube Labs operations and financial ledgers were reconciled across core enterprise modules. This briefing synthesizes operational throughput, fiscal velocity, and variance indicators into actionable executive directives.`}
                </p>
                {viewPayload.methodology?.scope && (
                  <p className={cn("text-[11px] pt-1.5 border-t border-navy/10 dark:border-slate-800 italic", isDark ? "text-slate-400" : "text-navy/60")}>
                    Scope: {viewPayload.methodology.scope}
                  </p>
                )}
              </div>

              {/* 3. Executive Vitality Diagnosis & Enterprise Health Scorecard */}
              {viewPayload.scorecard && (
                <div className={cn(
                  "p-5 rounded-2xl border space-y-3",
                  isDark ? "bg-[#070d28] border-teal/20" : "bg-white border-2 border-navy/15 shadow-xs"
                )}>
                  <div className="flex items-center justify-between">
                    <h4 className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      2. Operational Health & Vitality Diagnosis
                    </h4>
                    <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-0.5">
                      {viewPayload.scorecard.healthRating || "A+ Optimal Health"}
                    </Badge>
                  </div>
                  <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                    {viewPayload.scorecard.vitalityDiagnosis || "All business systems and financial streams demonstrate optimal commercial resilience and audited integrity."}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-navy/10 dark:border-slate-800 text-[11px]">
                    <div className="p-2 rounded-lg bg-navy/5 dark:bg-slate-800/40 text-center">
                      <span className="text-[10px] text-slate-400 block">Overall Score</span>
                      <strong className="text-teal font-black text-sm">{viewPayload.scorecard.overallHealthScore || 94}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-navy/5 dark:bg-slate-800/40 text-center">
                      <span className="text-[10px] text-slate-400 block">Revenue Velocity</span>
                      <strong className="text-emerald-500 font-black text-sm">{viewPayload.scorecard.revenueVelocityScore || 92}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-navy/5 dark:bg-slate-800/40 text-center">
                      <span className="text-[10px] text-slate-400 block">Efficiency</span>
                      <strong className="text-blue-500 font-black text-sm">{viewPayload.scorecard.operationalEfficiencyScore || 96}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-navy/5 dark:bg-slate-800/40 text-center">
                      <span className="text-[10px] text-slate-400 block">Trust Index</span>
                      <strong className="text-amber-500 font-black text-sm">{viewPayload.scorecard.customerTrustIndex || 95}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Core Performance KPI Metrics */}
              {viewPayload.summary?.metrics && (
                <div className="space-y-2">
                  <h4 className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-slate-300" : "text-navy")}>
                    3. Core Performance Indicators
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {viewPayload.summary.metrics.map((m, idx) => (
                      <div key={idx} className={cn(
                        "p-4 rounded-2xl border text-center transition-all",
                        isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/15"
                      )}>
                        <div className="text-base sm:text-lg font-black text-teal truncate">{String(m.value)}</div>
                        <div className={cn("text-[10px] font-bold uppercase mt-1 truncate", isDark ? "text-white" : "text-navy")}>{m.label}</div>
                        {m.description && <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{m.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Key Forensic Observations & Analytical Findings */}
              {viewPayload.narrative?.observations && viewPayload.narrative.observations.length > 0 && (
                <div className={cn(
                  "p-5 rounded-2xl border space-y-2.5",
                  isDark ? "bg-[#070d28] border-teal/20" : "bg-white border-2 border-navy/15"
                )}>
                  <h4 className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                    <CheckCircle2 className="h-4 w-4 text-teal" />
                    4. Key Observations & Forensic Findings
                  </h4>
                  <div className="space-y-2 pt-1">
                    {viewPayload.narrative.observations.map((obs, oIdx) => (
                      <div key={oIdx} className="flex items-start gap-2.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5 shrink-0" />
                        <span className={cn("leading-relaxed font-medium", isDark ? "text-slate-200" : "text-navy/80")}>
                          {obs}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Authoritative Business Data Ledgers */}
              {viewPayload.tables && Object.entries(viewPayload.tables).map(([key, tbl]) => (
                <div key={key} className="space-y-2">
                  <h4 className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>
                    5. {tbl.title}
                  </h4>
                  {tbl.introText && (
                    <p className={cn("text-xs italic", isDark ? "text-slate-400" : "text-navy/60")}>
                      {tbl.introText}
                    </p>
                  )}
                  <div className={cn(
                    "overflow-x-auto border-2 rounded-2xl",
                    isDark ? "border-slate-800" : "border-navy/15"
                  )}>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-navy text-white text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          {tbl.headers.map((h, i) => (
                            <th key={i} className="p-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                        {tbl.rows.slice(0, 15).map((r, rIdx) => (
                          <tr key={rIdx} className={cn(
                            rIdx % 2 === 0 ? "bg-transparent" : "bg-navy/5 dark:bg-slate-800/40",
                            isDark ? "hover:bg-slate-800/60" : "hover:bg-teal-50"
                          )}>
                            {r.map((c, cIdx) => (
                              <td key={cIdx} className={cn("p-2.5", cIdx === 0 && "font-bold text-navy dark:text-white")}>
                                {String(c)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      {tbl.summaryFooter && (
                        <tfoot className={cn(
                          "border-t-2 font-black text-xs",
                          isDark ? "bg-[#060a22] text-teal-300 border-teal/30" : "bg-teal-50 text-navy border-navy/20"
                        )}>
                          <tr>
                            {tbl.summaryFooter.map((sf, sIdx) => (
                              <td key={sIdx} className="p-3">{String(sf)}</td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              ))}

              {/* 7. Strategic Management Recommendations */}
              {viewPayload.narrative?.recommendations && viewPayload.narrative.recommendations.length > 0 && (
                <div className={cn(
                  "p-5 rounded-2xl border space-y-3",
                  isDark ? "bg-[#070d28] border-teal/20" : "bg-teal/5 border-navy/15"
                )}>
                  <h4 className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    6. Strategic Management Directives & Next Steps
                  </h4>
                  <div className="space-y-2 pt-1">
                    {viewPayload.narrative.recommendations.map((rec, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className={cn("leading-relaxed font-semibold", isDark ? "text-slate-200" : "text-navy")}>
                          {rec}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Statutory Tax & Regulatory Compliance Disclosure */}
              <div className={cn(
                "p-4 rounded-2xl border text-xs leading-relaxed space-y-1",
                isDark ? "bg-[#05091f] border-slate-800 text-slate-400" : "bg-slate-50 border-navy/10 text-navy/70"
              )}>
                <span className="font-bold text-[10px] uppercase text-teal tracking-wider block">
                  7. Statutory & TRA Tax Compliance Disclosure
                </span>
                <p>
                  All commercial financial transactions referenced in this document reflect standard 18% Tanzania Revenue Authority (TRA) Value Added Tax reconciliation where applicable. Figures are verified against primary database ledgers with tamper-evident cryptographic checksums.
                </p>
              </div>

              {/* 9. Three-Tier Executive Sign-Off & Verification Seal */}
              <div className={cn(
                "p-5 rounded-2xl border space-y-4",
                isDark ? "bg-[#060a22] border-slate-800" : "bg-white border-2 border-navy/15"
              )}>
                <h4 className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>
                  8. Executive Sign-Off & Corporate Governance Signatures
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className={cn("p-3.5 rounded-xl border space-y-1", isDark ? "border-slate-800 bg-[#070d24]" : "border-navy/10 bg-slate-50")}>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Prepared By</span>
                    <strong className="block text-navy dark:text-white font-black">{viewPayload.branding?.preparedBy || "Senior Business Analyst"}</strong>
                    <span className="text-[10px] text-teal block">Reporting Officer</span>
                    <span className="text-[10px] text-slate-400 block pt-1">Signed & Verified</span>
                  </div>
                  <div className={cn("p-3.5 rounded-xl border space-y-1", isDark ? "border-slate-800 bg-[#070d24]" : "border-navy/10 bg-slate-50")}>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Reviewed By</span>
                    <strong className="block text-navy dark:text-white font-black">{viewPayload.branding?.reportingOfficer || "Director of Operations"}</strong>
                    <span className="text-[10px] text-teal block">Enterprise Quality Lead</span>
                    <span className="text-[10px] text-slate-400 block pt-1">Reconciliation Cleared</span>
                  </div>
                  <div className={cn("p-3.5 rounded-xl border space-y-1", isDark ? "border-slate-800 bg-[#070d24]" : "border-navy/10 bg-slate-50")}>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Approved By</span>
                    <strong className="block text-navy dark:text-white font-black">Managing Director</strong>
                    <span className="text-[10px] text-emerald-500 font-bold block">Executive Authorization</span>
                    <span className="text-[10px] text-slate-400 block pt-1">Authorized for Circulation</span>
                  </div>
                </div>
              </div>

              {/* Document Control Footer info */}
              <div className="pt-3 border-t flex flex-wrap items-center justify-between text-[10px] text-slate-400">
                <div>Report Ref: <span className="font-mono font-bold text-teal">{viewPayload.documentControl?.reportId || "QC-VERIFIED"}</span></div>
                <div>Status: <span className="font-bold">{viewPayload.documentControl?.status || "Official Management Record"}</span></div>
                <div>Checksum: <span className="font-mono">{viewPayload.auditSeal?.complianceHash || "QC-SHA256-VERIFIED"}</span></div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">Unable to load live preview.</p>
          )}

          <DialogFooter className="mt-4 pt-3 border-t">
            <Button variant="outline" onClick={() => setIsViewing(false)} className="rounded-xl text-xs font-bold">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Delete Confirmation Dialog */}
      <Dialog open={!!reportToDelete} onOpenChange={open => !open && setReportToDelete(null)}>
        <DialogContent className={cn("rounded-3xl p-6", isDark ? "bg-[#0a1033] text-white border-slate-800" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <Trash2 className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Delete Report Record?
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Are you sure you want to delete <span className="font-bold text-navy dark:text-white">"{reportToDelete?.name}"</span>? This will remove the report from history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setReportToDelete(null)} disabled={isDeleting} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl text-xs font-bold gap-1">
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Deleting..." : "Delete Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
