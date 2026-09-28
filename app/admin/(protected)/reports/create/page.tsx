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
  Palette
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

const REPORT_TYPES: { type: ReportType; label: string; desc: string; icon: any; color: string }[] = [
  { type: "sales", label: "Sales Report", desc: "Revenue trends, order volumes, product performance, and payment analytics.", icon: ShoppingCart, color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
  { type: "inventory", label: "Inventory Report", desc: "Warehouse stock valuation, SKU health, depleted stock alerts, and category analysis.", icon: Package, color: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
  { type: "customers", label: "Customer Report", desc: "Client acquisition, purchasing history, high-value account directory, and lifetime value.", icon: Users, color: "text-violet-500 border-violet-500/30 bg-violet-500/10" },
  { type: "purchases", label: "Purchase & Supplier Report", desc: "Procurement volume, vendor performance tracking, and supply chain fulfillment logs.", icon: Truck, color: "text-amber-500 border-amber-500/30 bg-amber-500/10" },
  { type: "financial", label: "Financial Report", desc: "Invoiced vs collected revenue, aging receivables, and quotation conversion pipeline.", icon: DollarSign, color: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10" },
  { type: "it_assets", label: "IT & Asset Report", desc: "Enterprise infrastructure, hardware registers, system status, and compliance posture.", icon: Server, color: "text-rose-500 border-rose-500/30 bg-rose-500/10" },
  { type: "custom", label: "Custom Multi-Source Report", desc: "Configurable multi-source analytics query builder across all business modules.", icon: Sliders, color: "text-purple-500 border-purple-500/30 bg-purple-500/10" },
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
  const refreshPreview = async () => {
    setIsPreviewLoading(true)
    try {
      const config = getCurrentConfig()
      const res = await previewReportAction(config)
      if (res.success && res.data) {
        setPreviewData(res.data)
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
      refreshPreview()
    }, 400)
    return () => clearTimeout(timer)
  }, [selectedType, dateFrom, dateTo, comparisonEnabled, filterStatus, filterPaymentMethod])

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-navy/15 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/reports")}
            className="h-10 w-10 border-2 border-navy/20 dark:border-slate-700 hover:bg-navy/5 dark:hover:bg-slate-800 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy dark:text-slate-100">
                Report Builder
              </h1>
              <Badge className="bg-teal/15 text-teal border border-teal/30 text-xs py-0.5 font-bold uppercase">
                Engine v2.0
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
              Configure, preview with authoritative data, and export professional business documents.
            </p>
          </div>
        </div>

        {/* Engine Status & Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-navy/15 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-navy/80 dark:text-slate-300">
            <span className={cn("h-2 w-2 rounded-full animate-pulse", pythonServiceOnline ? "bg-emerald-500" : "bg-amber-500")} />
            <span>{pythonServiceOnline ? "Python Engine Active" : "Local Engine Ready"}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate("xlsx")}
            disabled={isGenerating}
            className="border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 font-bold rounded-xl h-10 px-3.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isGenerating && generatingFormat === "xlsx" ? "Building XLSX..." : "Export XLSX"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleGenerate("docx")}
            disabled={isGenerating}
            className="border-2 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 gap-1.5 font-bold rounded-xl h-10 px-3.5"
          >
            <FileCode className="h-4 w-4" />
            {isGenerating && generatingFormat === "docx" ? "Building DOCX..." : "Export DOCX"}
          </Button>

          <Button
            size="sm"
            onClick={() => handleGenerate("pdf")}
            disabled={isGenerating}
            className="bg-teal hover:bg-teal/90 text-navy font-bold gap-1.5 rounded-xl shadow-md h-10 px-4"
          >
            <Download className="h-4 w-4" />
            {isGenerating && generatingFormat === "pdf" ? "Rendering PDF..." : "Generate PDF"}
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Builder Controls + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Builder Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-navy/5 dark:bg-slate-800/80 rounded-2xl border-2 border-navy/15 dark:border-slate-800 overflow-x-auto text-xs">
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
                    ? "bg-white dark:bg-slate-900 text-navy dark:text-slate-100 shadow-sm"
                    : "text-navy/60 dark:text-slate-400 hover:text-navy dark:hover:text-slate-200"
                )}
              >
                {step.id}. {step.label}
              </button>
            ))}
          </div>

          {/* STEP 1: REPORT TYPE */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-navy dark:text-slate-100 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-teal" />
                  Select Report Category
                </h3>
                <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
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
                        "flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-teal bg-teal/5 shadow-sm"
                          : "border-navy/15 dark:border-slate-800 hover:border-navy/30 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl border shrink-0 mt-0.5", typeItem.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-navy dark:text-slate-100">{typeItem.label}</h4>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />}
                        </div>
                        <p className="text-[11px] text-navy/60 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">
                          {typeItem.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <Button size="sm" onClick={() => setCurrentStep(2)} className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl gap-1.5 text-xs">
                  Next: Period & Details
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS & PERIOD */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-navy dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal" />
                  Report Metadata & Date Range
                </h3>
                <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
                  Define report headings, active calculation window, and prior period comparisons.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-navy dark:text-slate-200">Report Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Q3 Commercial Sales Report"
                    className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-navy dark:text-slate-200">Executive Context / Description</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Provide executive context or purpose of this audit..."
                    className="text-xs resize-none rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-navy dark:text-slate-200">Date From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-navy dark:text-slate-200">Date To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                    />
                  </div>
                </div>

                {/* Comparison Period Toggle */}
                <div className="pt-2 border-t border-navy/15 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-navy dark:text-slate-200">Period Comparison</h5>
                      <p className="text-[11px] text-navy/60 dark:text-slate-400 font-medium">Compute variance deltas against prior timelines</p>
                    </div>
                    <Switch
                      checked={comparisonEnabled}
                      onCheckedChange={setComparisonEnabled}
                    />
                  </div>

                  {comparisonEnabled && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-navy/5 dark:bg-slate-800/50 border border-navy/15 dark:border-slate-700">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-navy/60 dark:text-slate-400 uppercase">Comparison From</Label>
                        <Input
                          type="date"
                          value={compDateFrom}
                          onChange={e => setCompDateFrom(e.target.value)}
                          className="h-8 text-xs rounded-lg border border-navy/20 dark:border-slate-700 bg-transparent"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-navy/60 dark:text-slate-400 uppercase">Comparison To</Label>
                        <Input
                          type="date"
                          value={compDateTo}
                          onChange={e => setCompDateTo(e.target.value)}
                          className="h-8 text-xs rounded-lg border border-navy/20 dark:border-slate-700 bg-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} className="rounded-xl font-semibold">
                  Back
                </Button>
                <Button size="sm" onClick={() => setCurrentStep(3)} className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl gap-1.5 text-xs">
                  Next: Sections
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SECTIONS & ORDERING */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-navy dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-teal" />
                  Report Sections & Layout
                </h3>
                <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
                  Enable, disable, and reorder document sections to tailor the final report structure.
                </p>
              </div>

              <div className="space-y-2">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                      sec.enabled
                        ? "border-navy/20 dark:border-slate-800 bg-white dark:bg-slate-900"
                        : "border-navy/10 dark:border-slate-800/40 bg-navy/5 dark:bg-slate-800/20 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={sec.enabled}
                        onCheckedChange={() => toggleSection(sec.id)}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-navy dark:text-slate-100 truncate">{sec.title}</span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize font-semibold">
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
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)} className="rounded-xl font-semibold">
                  Back
                </Button>
                <Button size="sm" onClick={() => setCurrentStep(4)} className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl gap-1.5 text-xs">
                  Next: Filters
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: DYNAMIC FILTERS */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-navy dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-teal" />
                  Domain Filters
                </h3>
                <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
                  Filter authoritative database records to narrow your analytical scope.
                </p>
              </div>

              <div className="space-y-3">
                {selectedType === "sales" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-navy dark:text-slate-200">Order Fulfillment Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700">
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
                      <Label className="text-xs font-bold text-navy dark:text-slate-200">Payment Channel</Label>
                      <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                        <SelectTrigger className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700">
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
                    <Label className="text-xs font-bold text-navy dark:text-slate-200">Stock Health Filter</Label>
                    <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                      <SelectTrigger className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700">
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
                  <div className="p-4 rounded-xl bg-navy/5 dark:bg-slate-800/50 border border-navy/15 dark:border-slate-700 text-center space-y-1">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                    <h5 className="text-xs font-bold text-navy dark:text-slate-100">Standard Scope Active</h5>
                    <p className="text-[11px] text-navy/60 dark:text-slate-400 font-medium">
                      All verified authoritative database records within the chosen date range are included.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)} className="rounded-xl font-semibold">
                  Back
                </Button>
                <Button size="sm" onClick={() => setCurrentStep(5)} className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl gap-1.5 text-xs">
                  Next: Branding
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: BRANDING */}
          {currentStep === 5 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-navy dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-teal" />
                  Executive Branding & Seal
                </h3>
                <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
                  Configure company identifiers, audit officer signature, and document theme accents.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-navy dark:text-slate-200">Company / Entity Name</Label>
                  <Input
                    value={branding.companyName}
                    onChange={e => setBranding({ ...branding, companyName: e.target.value })}
                    className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-navy dark:text-slate-200">Subtitle / Directorate</Label>
                  <Input
                    value={branding.subtitle}
                    onChange={e => setBranding({ ...branding, subtitle: e.target.value })}
                    className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-navy dark:text-slate-200">Issuing Officer / Division</Label>
                  <Input
                    value={branding.preparedBy}
                    onChange={e => setBranding({ ...branding, preparedBy: e.target.value })}
                    className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-navy dark:text-slate-200">Contact Email</Label>
                    <Input
                      value={branding.email}
                      onChange={e => setBranding({ ...branding, email: e.target.value })}
                      className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-navy dark:text-slate-200">Contact Phone</Label>
                    <Input
                      value={branding.phone}
                      onChange={e => setBranding({ ...branding, phone: e.target.value })}
                      className="h-9 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)} className="rounded-xl font-semibold">
                  Back
                </Button>
                <Button size="sm" onClick={refreshPreview} className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl gap-1.5 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Update Live Preview
                </Button>
              </div>
            </div>
          )}

          {/* Save As Template Card */}
          <div className="bg-white dark:bg-slate-900 border-2 border-navy/20 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
            <h4 className="text-xs font-bold text-navy dark:text-slate-100 flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-violet-500" />
              Save as Reusable Template
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Template name (e.g. Monthly Commercial Audit)"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="h-8 text-xs rounded-xl border-2 border-navy/20 dark:border-slate-700 bg-transparent flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !templateName.trim()}
                className="h-8 text-xs font-bold rounded-xl shrink-0"
              >
                {isSavingTemplate ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Interactive Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-teal" />
              <h3 className="font-bold text-sm text-navy dark:text-slate-100">Live Authoritative Preview</h3>
              {isPreviewLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-navy/60 dark:text-slate-400" />}
            </div>
            <span className="text-[11px] text-navy/60 dark:text-slate-400 font-medium">
              Real-time calculations from database
            </span>
          </div>

          {/* PREVIEW CONTAINER STYLED AS FORMAL DOCUMENT */}
          <div className="rounded-2xl border-2 border-navy/20 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-md space-y-8 min-h-[600px] overflow-x-auto text-slate-800 dark:text-slate-200">
            {/* 1. Header Banner */}
            <div className="border-b-2 border-navy/20 dark:border-slate-800 pb-6 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy dark:text-slate-100 uppercase">
                    {previewData?.branding.companyName || branding.companyName}
                  </h2>
                  <p className="text-xs font-bold text-navy/60 dark:text-slate-400 tracking-wide uppercase">
                    {previewData?.branding.subtitle || branding.subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-teal/15 text-teal border-teal/30 font-black uppercase tracking-wider text-[11px]">
                    Official Report
                  </Badge>
                  <p className="text-[11px] text-navy/60 dark:text-slate-400 mt-1 font-medium">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-lg sm:text-xl font-bold text-navy dark:text-slate-100">
                  {previewData?.title || title}
                </h3>
                <p className="text-xs text-navy/70 dark:text-slate-400 mt-0.5 font-medium">
                  Period: <span className="font-bold text-navy dark:text-slate-200">{previewData?.period.from || dateFrom}</span> to <span className="font-bold text-navy dark:text-slate-200">{previewData?.period.to || dateTo}</span>
                </p>
              </div>
            </div>

            {/* 2. Executive Summary Metrics */}
            {previewData?.summary.metrics && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal" />
                  Key Performance Indicators
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previewData.summary.metrics.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-navy/15 dark:border-slate-800 bg-navy/5 dark:bg-slate-800/40 space-y-1">
                      <p className="text-[10px] font-bold text-navy/60 dark:text-slate-400 uppercase tracking-wider truncate">{m.label}</p>
                      <p className="text-base sm:text-lg font-black text-navy dark:text-slate-100 tracking-tight">{String(m.value)}</p>
                      {m.description && <p className="text-[10px] text-navy/60 dark:text-slate-400 line-clamp-1">{m.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Comparison Callouts */}
            {previewData?.comparison?.enabled && previewData.comparison.metrics && (
              <div className="p-4 rounded-xl border border-teal/30 bg-teal/5 space-y-2">
                <h5 className="text-xs font-bold text-teal flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Prior Period Variance Analysis ({previewData.comparison.from} to {previewData.comparison.to})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {previewData.comparison.metrics.map((cm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-navy/15 dark:border-slate-800 text-xs">
                      <span className="font-medium text-navy/70 dark:text-slate-300">{cm.label}</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{String(cm.value)}</span>
                        {cm.changePercent !== undefined && (
                          <span className={cn(
                            "flex items-center text-[11px] px-1.5 py-0.5 rounded font-bold",
                            cm.changeDirection === "up" ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"
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

            {/* 4. Chart Visualizations */}
            {previewData?.charts && (
              <div className="space-y-6">
                {Object.entries(previewData.charts).map(([chartKey, chartData]) => {
                  const formattedData = chartData.labels.map((lbl, idx) => ({
                    name: lbl,
                    value: chartData.values[idx] || 0
                  }))

                  return (
                    <div key={chartKey} className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400">
                        {chartData.title || "Data Visualization"}
                      </h4>
                      <div className="h-56 w-full rounded-2xl border border-navy/15 dark:border-slate-800 bg-navy/5 dark:bg-slate-800/30 p-3">
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
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="name" fontSize={10} tickLine={false} />
                              <YAxis fontSize={10} tickLine={false} />
                              <Tooltip />
                              <Area type="monotone" dataKey="value" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#chartGrad)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 5. Data Tables */}
            {previewData?.tables && (
              <div className="space-y-6">
                {Object.entries(previewData.tables).map(([tblKey, tblData]) => (
                  <div key={tblKey} className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy/60 dark:text-slate-400">
                      {tblData.title}
                    </h4>
                    <div className="rounded-2xl border border-navy/15 dark:border-slate-800 overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-navy/5 dark:bg-slate-800/80 border-b border-navy/15 dark:border-slate-800">
                            {tblData.headers.map((h, i) => (
                              <th key={i} className="p-2.5 font-bold text-navy dark:text-slate-200">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/10 dark:divide-slate-800">
                          {tblData.rows.slice(0, 8).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-navy/5 dark:hover:bg-slate-800/40">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2.5 text-navy dark:text-slate-200 truncate max-w-[200px]">
                                  {String(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 6. Executive Narrative & Vitality Scorecard */}
            {previewData?.scorecard && (
              <div className="p-4 rounded-xl border border-navy/15 dark:border-slate-800 bg-navy/5 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-navy dark:text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Executive Vitality Diagnosis
                  </h5>
                  <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                    {previewData.scorecard.healthRating}
                  </Badge>
                </div>
                <p className="text-xs text-navy/70 dark:text-slate-400 leading-relaxed font-medium">
                  {previewData.scorecard.vitalityDiagnosis}
                </p>
              </div>
            )}

            {/* 7. Cryptographic Audit Seal */}
            {previewData?.auditSeal && (
              <div className="border-t border-navy/20 dark:border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-navy/60 dark:text-slate-400">
                <div>
                  <p className="font-bold text-navy dark:text-slate-200">
                    Issuing Division: {previewData.auditSeal.issuingDivision}
                  </p>
                  <p className="font-mono text-[10px]">
                    Audit Hash: {previewData.auditSeal.complianceHash}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {previewData.auditSeal.verificationStatus}
                  </p>
                  <p className="text-[10px] font-mono">
                    ID: {previewData.auditSeal.reportId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
