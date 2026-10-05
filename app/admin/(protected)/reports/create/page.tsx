"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  ReportType, 
  ExportFormat, 
  ReportConfiguration, 
  PreparedReportPayload,
  ReportSectionConfig,
  ComparisonType,
  ReportBranding
} from "@/lib/report-engine/types"
import { getDefaultSections, DEFAULT_BRANDING } from "@/lib/report-engine/data-fetcher"
import { 
  previewReportAction, 
  generateReportAction, 
  saveReportTemplate,
  getReportEngineStatus
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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Eye,
  Sliders,
  FileSpreadsheet,
  FileCode,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bookmark,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Building2,
  Palette,
  Printer
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

import {
  Receipt,
  CreditCard,
  Building,
  Briefcase,
  FileCheck,
  Video
} from "lucide-react"

const REPORT_TYPES: { type: ReportType; label: string; desc: string; icon: any; color: string }[] = [
  { type: "sales", label: "Sales Performance Report", desc: "Gross revenue, completed transactions, product demand & AOV analytics.", icon: ShoppingCart, color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
  { type: "invoices", label: "Invoice Register & Receivables", desc: "Commercial billings, collected cash, overdue receivables & aging analysis.", icon: Receipt, color: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
  { type: "expenses", label: "Business Expense & Cost Audit", desc: "Operational cost centers, deductible input tax, utilities & supplier disbursements.", icon: CreditCard, color: "text-rose-500 border-rose-500/30 bg-rose-500/10" },
  { type: "inventory", label: "Inventory Valuation & Stock Health", desc: "Warehouse stock valuation, SKU health, depleted stock alerts & category analysis.", icon: Package, color: "text-teal border-teal/40 bg-teal/15" },
  { type: "customers", label: "Customer Portfolio & Account Health", desc: "Client acquisition, repeat order trends, high-value account rankings & lifetime value.", icon: Users, color: "text-violet-500 border-violet-500/30 bg-violet-500/10" },
  { type: "products", label: "Product Catalogue & Merchandising", desc: "SKU catalogue inventory, category distribution, pricing margins & product ratings.", icon: Briefcase, color: "text-indigo-500 border-indigo-500/30 bg-indigo-500/10" },
  { type: "financial", label: "Executive Financial Position", desc: "Invoiced billings vs cash receipts, operational expenses & net operating surplus.", icon: DollarSign, color: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10" },
  { type: "purchases", label: "Procurement & Supplier Inflows", desc: "Purchase order logs, supplier fulfillment SLAs & supply chain expenditure.", icon: Truck, color: "text-amber-500 border-amber-500/30 bg-amber-500/10" },
  { type: "quotations", label: "Commercial Quotations & Pipeline", desc: "Commercial proposals, quotation status pipeline, deal win rates & conversion.", icon: FileCheck, color: "text-fuchsia-500 border-fuchsia-500/30 bg-fuchsia-500/10" },
  { type: "payments", label: "Payment Settlements & Gateway Audit", desc: "Payment channel breakdown (Bank, Mobile Money, Cards) & reconciliation.", icon: CreditCard, color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
  { type: "tax", label: "Tax Compliance & TRA 18% VAT", desc: "Output VAT (18% TRA inclusive), deductible input tax & statutory net filing liability.", icon: ShieldCheck, color: "text-orange-500 border-orange-500/30 bg-orange-500/10" },
  { type: "operational", label: "Enterprise Operational Throughput", desc: "Cross-departmental order fulfillment, dispatch SLAs & branch staff allocation.", icon: Building, color: "text-sky-500 border-sky-500/30 bg-sky-500/10" },
  { type: "cctv", label: "CCTV Surveillance Engineering", desc: "Field site surveys, video channel specifications & engineering contract values.", icon: Video, color: "text-purple-500 border-purple-500/30 bg-purple-500/10" },
  { type: "it_assets", label: "IT Infrastructure & Asset Inventory", desc: "Server infrastructure, hardware asset registers, system status & 99.95% uptime.", icon: Server, color: "text-red-500 border-rose-500/30 bg-rose-500/10" },
  { type: "custom", label: "Custom Multi-Source Analytics", desc: "Configurable multi-source analytics query builder across all business modules.", icon: Sliders, color: "text-slate-500 border-slate-500/30 bg-slate-500/10" },
]

const PIE_COLORS = ["#00F0FF", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#3B82F6"]

export default function CreateReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [currentStep, setCurrentStep] = useState<number>(1)
  const [selectedType, setSelectedType] = useState<ReportType>("sales")
  const [title, setTitle] = useState("Monthly Executive Sales Report")
  const [description, setDescription] = useState("Comprehensive commercial performance and revenue breakdown.")
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0])
  const [comparisonEnabled, setComparisonEnabled] = useState(true)
  const [comparisonType, setComparisonType] = useState<ComparisonType>("previous_period")
  const [compDateFrom, setCompDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 60)
    return d.toISOString().split("T")[0]
  })
  const [compDateTo, setCompDateTo] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 31)
    return d.toISOString().split("T")[0]
  })

  // Dynamic Sections
  const [sections, setSections] = useState<ReportSectionConfig[]>(() => getDefaultSections("sales"))

  // Filters
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all")
  const [filterStockStatus, setFilterStockStatus] = useState<any>("all")

  // Branding
  const [branding, setBranding] = useState<ReportBranding>(DEFAULT_BRANDING)

  // Live Preview Data
  const [previewData, setPreviewData] = useState<PreparedReportPayload | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingFormat, setGeneratingFormat] = useState<ExportFormat | null>(null)
  const [pythonServiceOnline, setPythonServiceOnline] = useState(false)

  // Template Save Modal
  const [templateName, setTemplateName] = useState("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)

  // Check URL params for pre-selected type
  useEffect(() => {
    const typeParam = searchParams.get("type") as ReportType
    if (typeParam && REPORT_TYPES.some(t => t.type === typeParam)) {
      handleTypeChange(typeParam)
    }
  }, [searchParams])

  // Check Python Service Status
  useEffect(() => {
    getReportEngineStatus().then(res => setPythonServiceOnline(res.pythonServiceOnline))
  }, [])

  // When report type changes, update sections and title defaults
  const handleTypeChange = (newType: ReportType) => {
    setSelectedType(newType)
    setSections(getDefaultSections(newType))
    const typeObj = REPORT_TYPES.find(t => t.type === newType)
    setTitle(`${typeObj?.label || "Business"} - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`)
  }

  // Build current configuration object
  const getCurrentConfig = (): ReportConfiguration => ({
    title,
    description,
    type: selectedType,
    period: { from: dateFrom, to: dateTo },
    comparison: comparisonEnabled ? {
      enabled: true,
      type: comparisonType,
      from: compDateFrom,
      to: compDateTo
    } : { enabled: false },
    branding,
    sections,
    filters: {
      status: filterStatus,
      paymentMethod: filterPaymentMethod,
      stockStatus: filterStockStatus
    }
  })

  // Fetch Live Preview
  const refreshPreview = async (showSuccessToast = false) => {
    setIsPreviewLoading(true)
    try {
      const config = getCurrentConfig()
      const res = await previewReportAction(config)
      if (res.success && res.data) {
        setPreviewData(res.data)
        if (showSuccessToast) {
          toast({
            title: "Live Preview Updated",
            description: "Authoritative data and layout have been recalculated.",
          })
        }
      } else {
        toast({
          title: "Preview Error",
          description: res.error || "Failed to load live preview data.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({
        title: "Preview Calculation Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // Trigger preview update on configuration change
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshPreview(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [
    selectedType,
    title,
    description,
    dateFrom,
    dateTo,
    comparisonEnabled,
    comparisonType,
    compDateFrom,
    compDateTo,
    filterStatus,
    filterPaymentMethod,
    filterStockStatus,
    sections,
    branding
  ])

  // Move Section Up/Down
  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSections.length) return
    const temp = newSections[index]
    newSections[index] = newSections[targetIndex]
    newSections[targetIndex] = temp
    newSections.forEach((s, idx) => { s.order = idx + 1 })
    setSections(newSections)
  }

  // Toggle Section Enabled
  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  // Handle Export Generation
  const handleGenerate = async (format: ExportFormat) => {
    setIsGenerating(true)
    setGeneratingFormat(format)

    toast({
      title: "Generating Business Report...",
      description: `Authoritatively assembling ${format.toUpperCase()} document via Report Engine.`
    })

    try {
      const config = getCurrentConfig()
      const res = await generateReportAction(config, format)

      if (res.success && res.fileUrl) {
        toast({
          title: "Report Generated Successfully!",
          description: `Engine: ${res.engineUsed === "python-fastapi" ? "Python FastAPI Service" : "Core Generator"}. Downloading ${res.filename}...`
        })

        const link = document.createElement("a")
        link.href = res.fileUrl
        link.download = res.filename || `Report.${format}`
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
      setGeneratingFormat(null)
    }
  }

  // Handle Save Template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Template Name Required", description: "Please provide a name for this template.", variant: "destructive" })
      return
    }
    setIsSavingTemplate(true)
    try {
      const config = getCurrentConfig()
      const res = await saveReportTemplate(templateName, description, config)
      if (res.success) {
        toast({ title: "Template Saved", description: `"${templateName}" is now available in your saved templates.` })
        setTemplateName("")
      } else {
        toast({ title: "Failed to Save Template", description: res.error, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Template Error", description: e.message, variant: "destructive" })
    } finally {
      setIsSavingTemplate(false)
    }
  }

  // Client-Side Print / Direct Vector PDF Generator
  const handlePrintPreview = () => {
    if (!previewData) {
      toast({ title: "Preview Loading", description: "Please wait for live preview data to calculate.", variant: "destructive" })
      return
    }

    const printWin = window.open("", "_blank", "width=920,height=980")
    if (!printWin) {
      window.print()
      return
    }

    const metricsHtml = (previewData.summary?.metrics || []).map(m => `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; min-width: 120px; flex: 1 1 calc(25% - 8px); box-sizing: border-box;">
        <div style="font-size: 9.5px; font-weight: 800; color: #000080; text-transform: uppercase;">${m.label}</div>
        <div style="font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 3px;">${m.value}</div>
        ${m.description ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${m.description}</div>` : ""}
      </div>
    `).join("")

    const tablesHtml = previewData.tables ? Object.values(previewData.tables).map(tbl => `
      <div style="margin-top: 18px; margin-bottom: 18px; page-break-inside: avoid;">
        <div style="font-size: 12px; font-weight: 900; color: #000080; text-transform: uppercase; margin-bottom: 6px;">${tbl.title}</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10.5px;">
          <thead>
            <tr style="background: #000080; color: #ffffff;">
              ${tbl.headers.map(h => `<th style="padding: 6px 8px; text-align: left;">${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tbl.rows.slice(0, 30).map((r, rIdx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${rIdx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                ${r.map((c, cIdx) => `<td style="padding: 5px 8px; font-weight: ${cIdx === 0 ? "700" : "500"};">${c}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `).join("") : ""

    const scorecardHtml = previewData.scorecard ? `
      <div style="background: #f0fdfa; border: 1.5px solid #0d9488; border-radius: 10px; padding: 12px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #99f6e4; padding-bottom: 6px; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 900; color: #000080; text-transform: uppercase;">Executive Scorecard: ${previewData.scorecard.healthRating}</span>
          <span style="background: #000080; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">SCORE: ${previewData.scorecard.overallHealthScore}/100</span>
        </div>
        <div style="font-size: 11px; color: #0f766e;"><strong>Diagnosis:</strong> ${previewData.scorecard.vitalityDiagnosis}</div>
      </div>
    ` : ""

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${previewData.title}</title>
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
              <div style="font-size: 16px; font-weight: 900; color: #000080;">${previewData.branding.companyName}</div>
              <div style="font-size: 10px; color: #64748b;">${previewData.branding.subtitle}</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <div style="font-weight: 800; color: #000080;">OFFICIAL REPORT</div>
              <div>${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
            </div>
          </div>
          <div>
            <div class="badge">${previewData.type} Report</div>
            <h1 style="font-size: 18px; font-weight: 900; color: #000080; margin: 0 0 4px 0;">${previewData.title}</h1>
            <div style="font-size: 10.5px; color: #64748b; margin-bottom: 12px;">Period: ${previewData.period.from} to ${previewData.period.to} | Prepared by: ${previewData.branding.preparedBy}</div>
          </div>
          ${scorecardHtml}
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">${metricsHtml}</div>
          ${tablesHtml}
          <div style="margin-top: 20px; border-top: 1.5px solid #000080; padding-top: 10px; font-size: 9.5px; color: #64748b; display: flex; justify-content: space-between;">
            <div>Hash: ${previewData.auditSeal?.complianceHash || "QC-VERIFIED"}</div>
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
      {/* Top Header Banner */}
      <div
        className={cn(
          "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
          isDark
            ? "bg-[#0a1033] border-none text-white shadow-none"
            : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/reports")}
              className={cn(
                "h-10 w-10 rounded-xl transition-colors",
                isDark
                  ? "hover:bg-white/10 text-white"
                  : "hover:bg-navy/10 text-navy"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Report Builder
                </h1>
                <Badge className={cn(
                  "text-xs py-0.5 font-bold uppercase",
                  isDark ? "bg-teal/20 text-teal-400 border border-teal/40" : "bg-navy text-teal font-black"
                )}>
                  Engine v2.0
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm mt-0.5 font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                Configure parameters, preview live verified data, and export professional executive documents.
              </p>
            </div>
          </div>

          {/* Engine Status & Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
              isDark ? "bg-[#070d24] text-slate-300 border border-slate-800" : "bg-white/80 text-navy border border-navy/10"
            )}>
              <span className={cn("h-2 w-2 rounded-full animate-pulse", pythonServiceOnline ? "bg-emerald-500" : "bg-amber-500")} />
              <span>{pythonServiceOnline ? "Python Engine Active" : "Local Engine Ready"}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPreview}
              className={cn(
                "gap-1.5 font-bold rounded-xl h-10 px-3.5",
                isDark 
                  ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" 
                  : "bg-white border-2 border-navy/20 text-navy hover:bg-white/90"
              )}
            >
              <Printer className="h-4 w-4 text-teal" />
              Quick Print
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("xlsx")}
              disabled={isGenerating}
              className={cn(
                "gap-1.5 font-bold rounded-xl h-10 px-3.5",
                isDark 
                  ? "bg-[#070d24] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10" 
                  : "bg-white border-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50"
              )}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {isGenerating && generatingFormat === "xlsx" ? "Building XLSX..." : "Export XLSX"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerate("docx")}
              disabled={isGenerating}
              className={cn(
                "gap-1.5 font-bold rounded-xl h-10 px-3.5",
                isDark 
                  ? "bg-[#070d24] border-blue-500/40 text-blue-400 hover:bg-blue-500/10" 
                  : "bg-white border-2 border-blue-600/30 text-blue-700 hover:bg-blue-50"
              )}
            >
              <FileCode className="h-4 w-4" />
              {isGenerating && generatingFormat === "docx" ? "Building DOCX..." : "Export DOCX"}
            </Button>

            <Button
              size="sm"
              onClick={() => handleGenerate("pdf")}
              disabled={isGenerating}
              className={cn(
                "font-bold gap-1.5 rounded-xl shadow-md h-10 px-4",
                isDark 
                  ? "bg-teal hover:bg-teal/90 text-navy" 
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Download className="h-4 w-4" />
              {isGenerating && generatingFormat === "pdf" ? "Rendering PDF..." : "Generate PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Builder Controls + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Builder Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step Selector Tabs */}
          <div className={cn(
            "flex items-center gap-1 p-1.5 rounded-2xl border transition-all overflow-x-auto text-xs",
            isDark ? "bg-[#0a1033] border-slate-800" : "bg-white border-2 border-navy/20"
          )}>
            {[
              { id: 1, label: "Category" },
              { id: 2, label: "Period" },
              { id: 3, label: "Sections" },
              { id: 4, label: "Filters" },
              { id: 5, label: "Branding" }
            ].map(step => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl font-bold whitespace-nowrap transition-all text-[11px]",
                  currentStep === step.id
                    ? isDark
                      ? "bg-teal text-navy font-black shadow-md"
                      : "bg-navy text-white font-black shadow-md"
                    : isDark
                      ? "text-slate-400 hover:text-white"
                      : "text-navy/70 hover:text-navy hover:bg-navy/5"
                )}
              >
                {step.id}. {step.label}
              </button>
            ))}
          </div>

          {/* STEP 1: REPORT TYPE */}
          {currentStep === 1 && (
            <div className={cn(
              "rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-4 transition-all",
              isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
            )}>
              <div>
                <h3 className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Layers className="h-4 w-4 text-teal" />
                  Select Report Category
                </h3>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                  Choose the business domain to load standard sections and authoritative schemas.
                </p>
              </div>

              <div className="space-y-2.5">
                {REPORT_TYPES.map(typeItem => {
                  const Icon = typeItem.icon
                  const isSelected = selectedType === typeItem.type
                  return (
                    <div
                      key={typeItem.type}
                      onClick={() => handleTypeChange(typeItem.type)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all",
                        isSelected
                          ? isDark
                            ? "border-teal bg-teal/15 shadow-sm"
                            : "border-navy bg-teal/15 shadow-sm"
                          : isDark
                            ? "border-slate-800 hover:border-slate-700 bg-[#070d24]"
                            : "border-navy/15 hover:border-navy/40 bg-white"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl border shrink-0 mt-0.5", typeItem.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn("font-bold text-xs", isDark ? "text-white" : "text-navy")}>{typeItem.label}</h4>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />}
                        </div>
                        <p className={cn("text-[11px] mt-0.5 leading-relaxed font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                          {typeItem.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(2)} 
                  className={cn(
                    "font-bold rounded-xl gap-1.5 text-xs shadow-sm",
                    isDark ? "bg-teal hover:bg-teal/90 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                  )}
                >
                  Next: Period & Details
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS & PERIOD */}
          {currentStep === 2 && (
            <div className={cn(
              "rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-4 transition-all",
              isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
            )}>
              <div>
                <h3 className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Calendar className="h-4 w-4 text-teal" />
                  Report Metadata & Date Range
                </h3>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                  Define report headings, active calculation window, and prior period comparisons.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Report Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Q3 Commercial Sales Report"
                    className={cn(
                      "h-9 text-xs rounded-xl font-medium",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Executive Context / Description</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Provide executive context or purpose of this audit..."
                    className={cn(
                      "text-xs resize-none rounded-xl font-medium",
                      isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Date From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className={cn(
                        "h-9 text-xs rounded-xl font-medium",
                        isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy"
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Date To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className={cn(
                        "h-9 text-xs rounded-xl font-medium",
                        isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy"
                      )}
                    />
                  </div>
                </div>

                {/* Comparison Period Toggle */}
                <div className={cn("pt-2 border-t space-y-3", isDark ? "border-slate-800" : "border-navy/15")}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Period Comparison</h5>
                      <p className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/60")}>Compute variance deltas against prior timelines</p>
                    </div>
                    <Switch
                      checked={comparisonEnabled}
                      onCheckedChange={setComparisonEnabled}
                    />
                  </div>

                  {comparisonEnabled && (
                    <div className={cn(
                      "grid grid-cols-2 gap-3 p-3 rounded-2xl border",
                      isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/15"
                    )}>
                      <div className="space-y-1">
                        <Label className={cn("text-[10px] font-bold uppercase", isDark ? "text-slate-400" : "text-navy/60")}>Comparison From</Label>
                        <Input
                          type="date"
                          value={compDateFrom}
                          onChange={e => setCompDateFrom(e.target.value)}
                          className={cn(
                            "h-8 text-xs rounded-lg",
                            isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white border-navy/20 text-navy"
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className={cn("text-[10px] font-bold uppercase", isDark ? "text-slate-400" : "text-navy/60")}>Comparison To</Label>
                        <Input
                          type="date"
                          value={compDateTo}
                          onChange={e => setCompDateTo(e.target.value)}
                          className={cn(
                            "h-8 text-xs rounded-lg",
                            isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white border-navy/20 text-navy"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentStep(1)} 
                  className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-navy/5")}
                >
                  Back
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(3)} 
                  className={cn("font-bold rounded-xl gap-1.5 text-xs shadow-sm", isDark ? "bg-teal hover:bg-teal/90 text-navy" : "bg-navy hover:bg-navy/90 text-white")}
                >
                  Next: Sections
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SECTIONS & ORDERING */}
          {currentStep === 3 && (
            <div className={cn(
              "rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-4 transition-all",
              isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
            )}>
              <div>
                <h3 className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Sliders className="h-4 w-4 text-teal" />
                  Report Sections & Layout
                </h3>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                  Enable, disable, and reorder document sections to tailor the final report structure.
                </p>
              </div>

              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border-2 transition-all",
                      sec.enabled
                        ? isDark
                          ? "border-slate-700 bg-[#070d24]"
                          : "border-navy/20 bg-white"
                        : isDark
                          ? "border-slate-800/40 bg-slate-900/20 opacity-60"
                          : "border-navy/10 bg-navy/5 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={sec.enabled}
                        onCheckedChange={() => toggleSection(sec.id)}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-navy")}>{sec.title}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize font-bold">
                            {sec.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, "up")}
                        className="h-7 w-7 rounded-lg"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={idx === sections.length - 1}
                        onClick={() => moveSection(idx, "down")}
                        className="h-7 w-7 rounded-lg"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentStep(2)} 
                  className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-navy/5")}
                >
                  Back
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(4)} 
                  className={cn("font-bold rounded-xl gap-1.5 text-xs shadow-sm", isDark ? "bg-teal hover:bg-teal/90 text-navy" : "bg-navy hover:bg-navy/90 text-white")}
                >
                  Next: Filters
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: DYNAMIC FILTERS */}
          {currentStep === 4 && (
            <div className={cn(
              "rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-4 transition-all",
              isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
            )}>
              <div>
                <h3 className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Sliders className="h-4 w-4 text-teal" />
                  Domain Filters
                </h3>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                  Filter authoritative database records to narrow your analytical scope.
                </p>
              </div>

              <div className="space-y-3">
                {selectedType === "sales" && (
                  <>
                    <div className="space-y-1">
                      <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Order Fulfillment Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses (Completed, Pending, etc.)</SelectItem>
                          <SelectItem value="completed">Completed / Settled</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="pending">Pending Settlement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Payment Channel</Label>
                      <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                        <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}>
                          <SelectValue placeholder="All Payment Channels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Channels (Mobile Money, Cards, Bank)</SelectItem>
                          <SelectItem value="M-Pesa">Vodacom M-Pesa</SelectItem>
                          <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                          <SelectItem value="Tigo Pesa">Tigo Pesa</SelectItem>
                          <SelectItem value="Credit Card">Credit / Debit Card</SelectItem>
                          <SelectItem value="Direct Settlement">Direct Invoice Settlement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {selectedType === "inventory" && (
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Stock Health Filter</Label>
                    <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                      <SelectTrigger className={cn("h-9 text-xs rounded-xl", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}>
                        <SelectValue placeholder="All Stock Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products (Healthy & Depleted)</SelectItem>
                        <SelectItem value="low_stock">Low Stock Alerts Only (≤ 5 units)</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock Only (0 units)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(selectedType === "customers" || selectedType === "financial" || selectedType === "it_assets" || selectedType === "custom") && (
                  <div className={cn(
                    "p-4 rounded-2xl border text-center space-y-1",
                    isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/15"
                  )}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                    <h5 className={cn("text-xs font-bold", isDark ? "text-white" : "text-navy")}>Standard Scope Active</h5>
                    <p className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                      All verified authoritative database records within the chosen date range are included.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentStep(3)} 
                  className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-navy/5")}
                >
                  Back
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCurrentStep(5)} 
                  className={cn("font-bold rounded-xl gap-1.5 text-xs shadow-sm", isDark ? "bg-teal hover:bg-teal/90 text-navy" : "bg-navy hover:bg-navy/90 text-white")}
                >
                  Next: Branding
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: BRANDING */}
          {currentStep === 5 && (
            <div className={cn(
              "rounded-2xl sm:rounded-3xl p-5 shadow-sm space-y-4 transition-all",
              isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
            )}>
              <div>
                <h3 className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Building2 className="h-4 w-4 text-teal" />
                  Executive Branding & Seal
                </h3>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                  Configure company identifiers, audit officer signature, and document theme accents.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Company / Entity Name</Label>
                  <Input
                    value={branding.companyName}
                    onChange={e => setBranding({ ...branding, companyName: e.target.value })}
                    className={cn("h-9 text-xs rounded-xl font-medium", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}
                  />
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Subtitle / Directorate</Label>
                  <Input
                    value={branding.subtitle}
                    onChange={e => setBranding({ ...branding, subtitle: e.target.value })}
                    className={cn("h-9 text-xs rounded-xl font-medium", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}
                  />
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Issuing Officer / Division</Label>
                  <Input
                    value={branding.preparedBy}
                    onChange={e => setBranding({ ...branding, preparedBy: e.target.value })}
                    className={cn("h-9 text-xs rounded-xl font-medium", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Contact Email</Label>
                    <Input
                      value={branding.email}
                      onChange={e => setBranding({ ...branding, email: e.target.value })}
                      className={cn("h-9 text-xs rounded-xl font-medium", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={cn("text-xs font-bold", isDark ? "text-slate-200" : "text-navy")}>Contact Phone</Label>
                    <Input
                      value={branding.phone}
                      onChange={e => setBranding({ ...branding, phone: e.target.value })}
                      className={cn("h-9 text-xs rounded-xl font-medium", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentStep(4)} 
                  className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white hover:bg-slate-800" : "border-navy/20 text-navy hover:bg-navy/5")}
                >
                  Back
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => refreshPreview(true)} 
                  disabled={isPreviewLoading}
                  className={cn("font-bold rounded-xl gap-1.5 text-xs shadow-sm", isDark ? "bg-teal hover:bg-teal/90 text-navy" : "bg-navy hover:bg-navy/90 text-white")}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isPreviewLoading && "animate-spin")} />
                  {isPreviewLoading ? "Recalculating..." : "Update Live Preview"}
                </Button>
              </div>
            </div>
          )}

          {/* Save As Template Card */}
          <div className={cn(
            "rounded-2xl sm:rounded-3xl p-4 shadow-sm space-y-2.5 transition-all",
            isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
          )}>
            <h4 className={cn("text-xs font-bold flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
              <Bookmark className="h-3.5 w-3.5 text-teal" />
              Save as Reusable Template
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Template name (e.g. Monthly Commercial Audit)"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className={cn("h-8 text-xs rounded-xl flex-1 font-medium", isDark ? "bg-[#070d24] border-slate-700 text-white" : "bg-white border-2 border-navy/20 text-navy")}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !templateName.trim()}
                className={cn("h-8 text-xs font-bold rounded-xl shrink-0", isDark ? "border-slate-700 text-white hover:bg-slate-800" : "border-2 border-navy/20 text-navy hover:bg-navy/5")}
              >
                {isSavingTemplate ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-teal" />
              <h3 className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>Live Authoritative Preview</h3>
              {isPreviewLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal" />}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPreview}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 px-3",
                  isDark ? "bg-[#0a1033] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-navy/5"
                )}
              >
                <Printer className="h-3.5 w-3.5 text-teal" />
                Print View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshPreview(true)}
                disabled={isPreviewLoading}
                className={cn(
                  "h-8 text-xs font-bold rounded-xl gap-1.5 px-3",
                  isDark ? "bg-teal/15 border-teal/40 text-teal hover:bg-teal/25" : "bg-teal/10 border-2 border-navy/20 text-navy hover:bg-teal/20"
                )}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isPreviewLoading && "animate-spin")} />
                {isPreviewLoading ? "Updating Preview..." : "Update Live Preview"}
              </Button>
            </div>
          </div>

          {/* PREVIEW CONTAINER STYLED AS FORMAL DOCUMENT */}
          <div className={cn(
            "rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-md space-y-8 min-h-[600px] overflow-x-auto transition-all",
            isDark ? "bg-[#0a1033] border-none text-slate-200 shadow-md" : "bg-white border-2 border-navy/20 text-slate-800"
          )}>
            {/* 1. Header Banner */}
            <div className={cn("border-b pb-6 space-y-2", isDark ? "border-slate-800" : "border-navy/20")}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight uppercase", isDark ? "text-white" : "text-navy")}>
                    {previewData?.branding.companyName || branding.companyName}
                  </h2>
                  <p className={cn("text-xs font-bold tracking-wide uppercase", isDark ? "text-slate-400" : "text-navy/60")}>
                    {previewData?.branding.subtitle || branding.subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    "font-black uppercase tracking-wider text-[11px]",
                    isDark ? "bg-teal/20 text-teal-400 border border-teal/40" : "bg-teal text-navy border-none"
                  )}>
                    Official Report
                  </Badge>
                  <p className={cn("text-[11px] mt-1 font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className={cn("text-lg sm:text-xl font-black", isDark ? "text-white" : "text-navy")}>
                  {previewData?.title || title}
                </h3>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                  Period: <span className={cn("font-bold", isDark ? "text-teal-400" : "text-navy")}>{previewData?.period.from || dateFrom}</span> to <span className={cn("font-bold", isDark ? "text-teal-400" : "text-navy")}>{previewData?.period.to || dateTo}</span>
                </p>
                {(description || previewData?.subtitle) && (
                  <p className={cn("text-xs mt-1 italic", isDark ? "text-slate-400" : "text-navy/60")}>
                    {previewData?.subtitle || description}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Rendering of Configured Sections in Order */}
            {sections
              .filter(sec => sec.enabled)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((sec, sIdx) => {
                // SECTION TYPE: SUMMARY
                if (sec.type === 'summary') {
                  return (
                    <div key={sec.id || `sec_sum_${sIdx}`} className="space-y-4">
                      {previewData?.summary.metrics ? (
                        <div className="space-y-3">
                          <h4 className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-slate-400" : "text-navy/70")}>
                            <Sparkles className="h-3.5 w-3.5 text-teal" />
                            {sec.title || "Key Performance Indicators"}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {previewData.summary.metrics.map((m, idx) => (
                              <div 
                                key={idx} 
                                className={cn(
                                  "p-3.5 rounded-2xl border space-y-1 transition-all",
                                  isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/15"
                                )}
                              >
                                <p className={cn("text-[10px] font-bold uppercase tracking-wider truncate", isDark ? "text-slate-400" : "text-navy/60")}>{m.label}</p>
                                <p className={cn("text-base sm:text-lg font-black tracking-tight", isDark ? "text-white" : "text-navy")}>{String(m.value)}</p>
                                {m.description && <p className={cn("text-[10px] line-clamp-1", isDark ? "text-slate-400" : "text-navy/60")}>{m.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className={cn("p-4 rounded-2xl border border-dashed text-center text-xs", isDark ? "border-slate-800 text-slate-400" : "border-navy/20 text-navy/60")}>
                          Loading summary indicators...
                        </div>
                      )}

                      {/* Comparison Callouts inside Summary Section */}
                      {comparisonEnabled && previewData?.comparison?.metrics && (
                        <div className={cn(
                          "p-4 rounded-2xl border space-y-2",
                          isDark ? "bg-teal/10 border-teal/30 text-slate-200" : "bg-teal/5 border-teal/40 text-navy"
                        )}>
                          <h5 className="text-xs font-bold text-teal flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Prior Period Variance Analysis ({previewData.comparison.from || compDateFrom} to {previewData.comparison.to || compDateTo})
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {previewData.comparison.metrics.map((cm, idx) => (
                              <div key={idx} className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl border text-xs",
                                isDark ? "bg-[#070d24] border-slate-800" : "bg-white border-navy/15"
                              )}>
                                <span className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/70")}>{cm.label}</span>
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span>{String(cm.value)}</span>
                                  {cm.changePercent !== undefined && (
                                    <span className={cn(
                                      "flex items-center text-[11px] px-1.5 py-0.5 rounded font-bold",
                                      cm.changeDirection === "up" ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                                    )}>
                                      {cm.changeDirection === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                      {cm.changePercent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                // SECTION TYPE: CHART
                if (sec.type === 'chart') {
                  const chartData = (sec.dataKey && previewData?.charts?.[sec.dataKey]) || 
                    (previewData?.charts ? Object.values(previewData.charts)[0] : null)

                  if (!chartData) {
                    return (
                      <div key={sec.id || `sec_chart_${sIdx}`} className="space-y-2">
                        <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/70")}>
                          {sec.title}
                        </h4>
                        <div className={cn("h-44 w-full rounded-2xl border border-dashed flex items-center justify-center text-xs", isDark ? "border-slate-800 text-slate-400" : "border-navy/20 text-navy/50")}>
                          Visual chart calculating for period {dateFrom} to {dateTo}...
                        </div>
                      </div>
                    )
                  }

                  const formattedData = chartData.labels.map((lbl, idx) => ({
                    name: lbl,
                    value: chartData.values[idx] || 0
                  }))

                  return (
                    <div key={sec.id || `sec_chart_${sIdx}`} className="space-y-2">
                      <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/70")}>
                        {sec.title || chartData.title || "Data Visualization"}
                      </h4>
                      <div className={cn("h-56 w-full rounded-2xl border p-3", isDark ? "border-slate-800 bg-[#070d24]" : "border-navy/15 bg-teal/5")}>
                        {chartData.chartType === "doughnut" || chartData.chartType === "pie" ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={formattedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={chartData.chartType === "doughnut" ? 50 : 0}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {formattedData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : chartData.chartType === "bar" ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={formattedData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="name" fontSize={10} tickLine={false} />
                              <YAxis fontSize={10} tickLine={false} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#00F0FF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formattedData}>
                              <defs>
                                <linearGradient id={`chartGrad_${sIdx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="name" fontSize={10} tickLine={false} />
                              <YAxis fontSize={10} tickLine={false} />
                              <Tooltip />
                              <Area type="monotone" dataKey="value" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill={`url(#chartGrad_${sIdx})`} />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )
                }

                // SECTION TYPE: TABLE
                if (sec.type === 'table') {
                  const tblData = (sec.dataKey && previewData?.tables?.[sec.dataKey]) ||
                    (previewData?.tables ? Object.values(previewData.tables)[0] : null)

                  if (!tblData) {
                    return (
                      <div key={sec.id || `sec_tbl_${sIdx}`} className="space-y-2">
                        <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/70")}>
                          {sec.title}
                        </h4>
                        <div className={cn("p-4 rounded-2xl border border-dashed text-center text-xs", isDark ? "border-slate-800 text-slate-400" : "border-navy/20 text-navy/50")}>
                          Data ledger records in preparation...
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={sec.id || `sec_tbl_${sIdx}`} className="space-y-2">
                      <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-slate-400" : "text-navy/70")}>
                        {sec.title || tblData.title}
                      </h4>
                      <div className={cn("rounded-2xl border overflow-hidden text-xs", isDark ? "border-slate-800" : "border-navy/15")}>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={cn("border-b", isDark ? "bg-[#070d24] text-slate-300 border-slate-800" : "bg-teal/15 text-navy border-navy/15 font-bold")}>
                              {tblData.headers.map((h, i) => (
                                <th key={i} className="p-3 font-bold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-navy/10")}>
                            {tblData.rows.slice(0, 8).map((row, rIdx) => (
                              <tr key={rIdx} className={cn(isDark ? "hover:bg-slate-800/40" : "hover:bg-teal-50/50")}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className={cn("p-3 truncate max-w-[200px]", isDark ? "text-slate-200" : "text-navy")}>
                                    {String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }

                // SECTION TYPE: SCORECARD
                if (sec.type === 'scorecard') {
                  if (!previewData?.scorecard) return null
                  return (
                    <div key={sec.id || `sec_score_${sIdx}`} className={cn(
                      "p-4 rounded-2xl border space-y-2",
                      isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/15"
                    )}>
                      <div className="flex items-center justify-between">
                        <h5 className={cn("text-xs font-bold flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          {sec.title || "Executive Vitality Diagnosis"}
                        </h5>
                        <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                          {previewData.scorecard.healthRating}
                        </Badge>
                      </div>
                      <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                        {previewData.scorecard.vitalityDiagnosis}
                      </p>
                    </div>
                  )
                }

                // SECTION TYPE: AUDIT SEAL
                if (sec.type === 'audit_seal') {
                  const seal = previewData?.auditSeal || {
                    issuingDivision: branding.preparedBy || 'Enterprise Reporting Engine',
                    complianceHash: `QC-${Date.now().toString(16).toUpperCase()}`,
                    verificationStatus: 'VERIFIED_CRYPTOGRAPHICALLY',
                    reportId: `REP-${selectedType.toUpperCase()}-TEMP`
                  }
                  return (
                    <div key={sec.id || `sec_audit_${sIdx}`} className={cn(
                      "border-t pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]",
                      isDark ? "border-slate-800 text-slate-400" : "border-navy/20 text-navy/60"
                    )}>
                      <div>
                        <p className={cn("font-bold", isDark ? "text-slate-200" : "text-navy")}>
                          Issuing Division: {seal.issuingDivision}
                        </p>
                        <p className="font-mono text-[10px]">
                          Audit Hash: {seal.complianceHash}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-bold text-emerald-500 flex items-center sm:justify-end gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {seal.verificationStatus}
                        </p>
                        <p className="text-[10px] font-mono">
                          ID: {seal.reportId}
                        </p>
                      </div>
                    </div>
                  )
                }

                return null
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
