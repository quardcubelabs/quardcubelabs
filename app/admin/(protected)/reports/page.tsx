"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  ReportType, 
  GeneratedReportRecord, 
  ReportTemplateRecord,
  PreparedReportPayload
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
  BarChart3,
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
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  ExternalLink,
  Sliders,
  FileSpreadsheet,
  FileCode,
  TrendingUp,
  Activity,
  Award,
  Zap,
  Printer
} from "lucide-react"

const TYPE_CONFIG: Record<ReportType, { label: string; icon: any; badgeClass: string; cardClass: string }> = {
  sales: { 
    label: "Sales", 
    icon: ShoppingCart, 
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    cardClass: "border-emerald-500/30 hover:border-emerald-500/60"
  },
  inventory: { 
    label: "Inventory", 
    icon: Package, 
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    cardClass: "border-blue-500/30 hover:border-blue-500/60"
  },
  customers: { 
    label: "Customers", 
    icon: Users, 
    badgeClass: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
    cardClass: "border-violet-500/30 hover:border-violet-500/60"
  },
  purchases: { 
    label: "Purchases", 
    icon: Truck, 
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    cardClass: "border-amber-500/30 hover:border-amber-500/60"
  },
  financial: { 
    label: "Financial", 
    icon: DollarSign, 
    badgeClass: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    cardClass: "border-cyan-500/30 hover:border-cyan-500/60"
  },
  it_assets: { 
    label: "IT Assets", 
    icon: Server, 
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    cardClass: "border-rose-500/30 hover:border-rose-500/60"
  },
  custom: { 
    label: "Custom", 
    icon: Sliders, 
    badgeClass: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    cardClass: "border-purple-500/30 hover:border-purple-500/60"
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

  // View modal state
  const [selectedReport, setSelectedReport] = useState<GeneratedReportRecord | null>(null)
  const [viewPayload, setViewPayload] = useState<PreparedReportPayload | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [isLoadingView, setIsLoadingView] = useState(false)

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
          description: "Showing saved report metadata.",
        })
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setIsLoadingView(false)
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

  // Quick download / generate PDF handler
  const [isGeneratingPdfId, setIsGeneratingPdfId] = useState<string | null>(null)
  const handleDownloadReportPdf = async (report: GeneratedReportRecord) => {
    if (report.file_url) {
      const link = document.createElement("a")
      link.href = report.file_url
      link.download = `${report.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // Generate on the fly
    setIsGeneratingPdfId(report.id)
    try {
      const res = await generateReportAction(report.configuration, "pdf")
      if (res.success && res.fileUrl) {
        toast({ title: "PDF Ready", description: `Downloading ${res.filename}...` })
        const link = document.createElement("a")
        link.href = res.fileUrl
        link.download = res.filename || "Report.pdf"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        loadData()
      } else {
        toast({ title: "Generation Error", description: res.error || "Failed to render PDF.", variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" })
    } finally {
      setIsGeneratingPdfId(null)
    }
  }

  // Print modal document
  const handlePrintModalDocument = () => {
    if (!viewPayload) return
    const printWin = window.open("", "_blank", "width=920,height=980")
    if (!printWin) {
      window.print()
      return
    }

    const metricsHtml = (viewPayload.summary?.metrics || []).map(m => `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; min-width: 120px; flex: 1 1 calc(25% - 8px); box-sizing: border-box;">
        <div style="font-size: 9.5px; font-weight: 800; color: #000080; text-transform: uppercase;">${m.label}</div>
        <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 3px;">${m.value}</div>
      </div>
    `).join("")

    const tablesHtml = viewPayload.tables ? Object.values(viewPayload.tables).map(tbl => `
      <div style="margin-top: 16px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="font-size: 11.5px; font-weight: 900; color: #000080; text-transform: uppercase; margin-bottom: 6px;">${tbl.title}</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #000080; color: #ffffff;">
              ${tbl.headers.map(h => `<th style="padding: 6px 8px; text-align: left;">${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tbl.rows.slice(0, 25).map((r, rIdx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${rIdx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                ${r.map((c, cIdx) => `<td style="padding: 5px 8px; font-weight: ${cIdx === 0 ? "700" : "500"};">${c}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `).join("") : ""

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${viewPayload.title}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; font-size: 11px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000080; padding-bottom: 8px; margin-bottom: 12px; }
            .badge { display: inline-block; background: #000080; color: #fff; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 3px; text-transform: uppercase; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div style="font-size: 16px; font-weight: 900; color: #000080;">${viewPayload.branding.companyName}</div>
              <div style="font-size: 10px; color: #64748b;">${viewPayload.branding.subtitle}</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <div style="font-weight: 800; color: #000080;">OFFICIAL REPORT</div>
              <div>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
            </div>
          </div>
          <div>
            <div class="badge">${viewPayload.type} Report</div>
            <h1 style="font-size: 18px; font-weight: 900; color: #000080; margin: 0 0 4px 0;">${viewPayload.title}</h1>
            <div style="font-size: 10.5px; color: #64748b; margin-bottom: 12px;">Period: ${viewPayload.period.from} to ${viewPayload.period.to}</div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">${metricsHtml}</div>
          ${tablesHtml}
          <div style="margin-top: 20px; border-top: 1.5px solid #000080; padding-top: 10px; font-size: 9.5px; color: #64748b; display: flex; justify-content: space-between;">
            <div>Hash: ${viewPayload.auditSeal?.complianceHash || "QC-VERIFIED"}</div>
            <div>VERIFIED PRODUCTION DATABASE AUDIT</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy/15 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy dark:text-slate-100">
              Reports & Insights
            </h1>
            <Badge className="bg-teal/15 text-teal border border-teal/30 text-xs py-0.5 font-bold uppercase">
              v2.0 Engine
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-navy/70 dark:text-slate-400 mt-1 font-medium">
            Create, manage and analyze business reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="border-2 border-navy/20 dark:border-slate-700 hover:bg-navy/5 dark:hover:bg-slate-800 text-navy dark:text-slate-100 font-semibold gap-1.5 rounded-xl h-10 px-4"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => router.push("/admin/reports/create")}
            className="bg-teal hover:bg-teal/90 text-navy font-bold gap-2 rounded-xl shadow-md h-10 px-5 transition-all hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            + Create Report
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400">Total Reports</span>
            <div className="h-8 w-8 rounded-xl bg-navy/5 dark:bg-slate-800 flex items-center justify-center text-navy dark:text-slate-200">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-navy dark:text-slate-100">{totalReports}</p>
          <p className="text-[11px] font-medium text-navy/60 dark:text-slate-400">Generated audit manifests</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400">This Month</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-navy dark:text-slate-100">{reportsThisMonth}</p>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-bold">Active reporting period</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400">Saved Templates</span>
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-navy dark:text-slate-100">{savedTemplatesCount}</p>
          <p className="text-[11px] font-medium text-navy/60 dark:text-slate-400">Reusable configurations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400">Recent 7-Day</span>
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-navy dark:text-slate-100">{recentlyGeneratedCount}</p>
          <p className="text-[11px] font-medium text-navy/60 dark:text-slate-400">Latest business audits</p>
        </div>
      </div>

      {/* Quick Launch Category Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy/80 dark:text-slate-300">
            1-Click Report Builders
          </h2>
          <span className="text-xs text-navy/60 dark:text-slate-400 font-medium">Select domain to launch builder</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(["sales", "inventory", "customers", "financial", "purchases", "it_assets"] as ReportType[]).map(t => {
            const conf = TYPE_CONFIG[t]
            const Icon = conf.icon
            return (
              <button
                key={t}
                onClick={() => router.push(`/admin/reports/create?type=${t}`)}
                className="flex flex-col items-start p-4 rounded-2xl border-2 border-navy/20 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal/60 dark:hover:border-teal/60 transition-all text-left group shadow-sm hover:shadow-md"
              >
                <div className={cn("p-2.5 rounded-xl border mb-2.5 group-hover:scale-105 transition-transform", conf.badgeClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-navy dark:text-slate-100 group-hover:text-teal transition-colors">
                  {conf.label} Report
                </h4>
                <p className="text-[10px] text-navy/60 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                  Authoritative metrics
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Reports Table Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-navy/15 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-navy dark:text-slate-100">Recent Reports</h3>
            <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5">
              History of rendered PDF, DOCX, and XLSX business intelligence documents.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy/50 dark:text-slate-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 font-semibold">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="customers">Customers</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="purchases">Purchases</SelectItem>
                <SelectItem value="it_assets">IT Assets</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy/5 dark:bg-slate-800/60 text-navy dark:text-slate-200 border-b border-navy/15 dark:border-slate-800">
                <th className="p-3.5 pl-6 font-bold uppercase tracking-wider">Report Name</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Category</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Created By</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Created Date</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Format</th>
                <th className="p-3.5 font-bold uppercase tracking-wider">Status</th>
                <th className="p-3.5 pr-6 text-right font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-navy/60 dark:text-slate-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-sm text-navy dark:text-slate-200">No generated reports found</p>
                    <p className="text-xs text-navy/60 dark:text-slate-400 mt-1">
                      Click "+ Create Report" to build and export your first business report.
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
                  const createdDate = new Date(report.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })

                  return (
                    <tr key={report.id} className="hover:bg-navy/5 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-6 font-bold text-navy dark:text-slate-100 max-w-[240px] truncate">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-navy/5 dark:bg-slate-800 text-navy dark:text-slate-200 shrink-0">
                            <Icon className="h-4 w-4" />
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
                          <span className={cn("h-2 w-2 rounded-full", report.status === "completed" ? "bg-emerald-500" : "bg-amber-500")} />
                          <span className="capitalize font-bold text-navy dark:text-slate-200">
                            {report.status || "completed"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Live Report"
                            onClick={() => handleViewReport(report)}
                            className="h-8 w-8 text-navy/70 dark:text-slate-300 hover:text-navy dark:hover:text-white rounded-lg hover:bg-navy/10 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {report.file_url && (
                            <a
                              href={report.file_url}
                              download
                              title="Download Document"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-teal hover:bg-teal/10 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Duplicate Configuration"
                            onClick={() => handleDuplicate(report)}
                            className="h-8 w-8 text-navy/70 dark:text-slate-300 hover:text-navy dark:hover:text-white rounded-lg hover:bg-navy/10 dark:hover:bg-slate-800"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Report"
                            onClick={() => setReportToDelete(report)}
                            className="h-8 w-8 text-navy/70 dark:text-slate-300 hover:text-destructive rounded-lg hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Saved Templates Carousel */}
      {templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-navy/80 dark:text-slate-300 flex items-center gap-1.5">
              <Bookmark className="h-4 w-4 text-violet-500" />
              Saved Report Templates ({templates.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => {
              const typeObj = TYPE_CONFIG[tpl.type] || TYPE_CONFIG.custom
              const Icon = typeObj.icon
              return (
                <div key={tpl.id} className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className={cn("text-[10px] py-0.5 px-2 capitalize font-bold", typeObj.badgeClass)}>
                        {typeObj.label}
                      </Badge>
                      <span className="text-[11px] text-navy/60 dark:text-slate-400 font-medium">
                        {new Date(tpl.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-navy dark:text-slate-100 mt-2.5 truncate flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-teal" />
                      {tpl.name}
                    </h4>
                    {tpl.description && (
                      <p className="text-xs text-navy/70 dark:text-slate-400 line-clamp-2 mt-1 font-medium">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/admin/reports/create?type=${tpl.type}`)}
                    className="w-full text-xs font-bold border-2 border-navy/20 dark:border-slate-700 hover:bg-teal hover:text-navy hover:border-teal rounded-xl transition-all gap-1.5"
                  >
                    Use Template
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW REPORT MODAL */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-navy dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal" />
              {selectedReport?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Generated on {selectedReport && new Date(selectedReport.created_at).toLocaleString()} • Format: {selectedReport?.file_format.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {isLoadingView ? (
            <div className="py-12 text-center text-navy/60 dark:text-slate-400 space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-teal" />
              <p className="text-xs font-semibold">Aggregating report dataset...</p>
            </div>
          ) : viewPayload ? (
            <div className="space-y-6 pt-2">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {viewPayload.summary.metrics.map((m, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-navy/15 dark:border-slate-800 bg-navy/5 dark:bg-slate-800/40">
                    <p className="text-[10px] font-bold text-navy/60 dark:text-slate-400 uppercase tracking-wider">{m.label}</p>
                    <p className="text-base font-black text-navy dark:text-slate-100 mt-0.5">{String(m.value)}</p>
                  </div>
                ))}
              </div>

              {/* Table Data */}
              {viewPayload.tables && Object.values(viewPayload.tables).map((tbl, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-navy/80 dark:text-slate-300">{tbl.title}</h4>
                  <div className="rounded-xl border border-navy/15 dark:border-slate-800 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-navy/5 dark:bg-slate-800/80 border-b border-navy/15 dark:border-slate-800">
                        <tr>
                          {tbl.headers.map((h, i) => (
                            <th key={i} className="p-2.5 font-bold text-navy dark:text-slate-200">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/10 dark:divide-slate-800">
                        {tbl.rows.slice(0, 10).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((c, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-navy dark:text-slate-200 truncate max-w-[180px]">{String(c)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Audit Seal */}
              {viewPayload.auditSeal && (
                <div className="p-3.5 rounded-xl border border-navy/15 dark:border-slate-800 bg-navy/5 dark:bg-slate-800/40 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-navy/60 dark:text-slate-400">
                    Audit Hash: {viewPayload.auditSeal.complianceHash}
                  </span>
                  <Badge className="bg-emerald-500 text-white text-[10px] font-bold">
                    {viewPayload.auditSeal.verificationStatus}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-navy/60 dark:text-slate-400 py-4">No detailed preview payload available.</p>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintModalDocument}
              disabled={!viewPayload}
              className="rounded-xl font-bold gap-1.5"
            >
              <Printer className="h-3.5 w-3.5 text-teal" />
              Quick Print / PDF
            </Button>

            {selectedReport && (
              <Button
                size="sm"
                onClick={() => handleDownloadReportPdf(selectedReport)}
                disabled={isGeneratingPdfId === selectedReport.id}
                className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl gap-1.5 shadow-sm text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                {isGeneratingPdfId === selectedReport.id ? "Rendering PDF..." : "Download PDF"}
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setIsViewing(false)} className="rounded-xl font-semibold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!reportToDelete} onOpenChange={open => !open && setReportToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Report Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-navy/70 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-navy dark:text-slate-100">"{reportToDelete?.name}"</span>? This will remove the audit entry from history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReportToDelete(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="gap-1.5 rounded-xl font-bold"
            >
              {isDeleting ? "Deleting..." : "Delete Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
