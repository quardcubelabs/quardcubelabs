"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { getProjectDetail } from "@/lib/detail-actions"
import { updateProject } from "@/lib/projects-actions"
import type { ProjectDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Code2,
  Target,
  Trophy,
  TrendingUp,
  Star,
  FileText,
  Edit,
  RefreshCw,
  Check,
} from "lucide-react"

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

const budgetChartConfig: ChartConfig = {
  budget: {
    label: "Allocated Budget (TSH)",
    color: "#000080",
  },
  utilized: {
    label: "Utilized / Disbursed (TSH)",
    color: "#40E0D0",
  },
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const { isSidebarOpen } = useAdminSidebar()
  const { toast } = useToast()

  const [data, setData] = useState<ProjectDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    budget: 0,
    team_size: 1,
    status: "in_progress" as "completed" | "in_progress" | "planned" | "cancelled",
    start_date: "",
    end_date: "",
    challenge: "",
    solution: "",
  })

  const loadData = async () => {
    try {
      const res = await getProjectDetail(projectId)
      setData(res)
    } catch (err) {
      console.error("Failed to load project details:", err)
    }
  }

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    loadData().finally(() => {
      if (mounted) setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [projectId])

  const openEditModal = () => {
    if (!data?.project) return
    setEditForm({
      budget: Number(data.project.budget) || 0,
      team_size: Number(data.project.team_size) || 1,
      status: (data.project.status as any) || "in_progress",
      start_date: data.project.start_date || "",
      end_date: data.project.end_date || "",
      challenge: data.project.challenge || "",
      solution: data.project.solution || "",
    })
    setIsEditModalOpen(true)
  }

  const handleSaveBudgetAndScope = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data?.project?.id) return
    setIsSubmittingEdit(true)
    try {
      const res = await updateProject(data.project.id, {
        budget: Number(editForm.budget) || 0,
        team_size: Number(editForm.team_size) || 1,
        status: editForm.status,
        start_date: editForm.start_date || "",
        end_date: editForm.end_date || "",
        challenge: editForm.challenge || "",
        solution: editForm.solution || "",
      })

      if (res?.error) {
        toast({
          title: "Update Failed",
          description: res.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Parameters Updated",
          description: "Engineering budget and project scope saved successfully.",
        })
        setIsEditModalOpen(false)
        await loadData()
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  if (isLoading) return <AdminLoading />

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card
          className={cn(
            "max-w-md w-full p-8 text-center rounded-3xl border-2 shadow-xl",
            isDark
              ? "bg-[#0a1033] border-teal/30 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner border",
              isDark
                ? "bg-navy text-teal border-teal/30"
                : "bg-teal text-navy border-teal/40"
            )}
          >
            <FolderOpen className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Project Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No engineering project matches "{projectId}".
          </p>
          <Link href="/admin/projects">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects Directory
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { project, progress, portfolio, related } = data

  const PIE_COLORS = isDark
    ? ["#40E0D0", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399"]
    : ["#000080", "#0891b2", "#2563eb", "#7c3aed", "#059669", "#d97706"]

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. SIGNATURE HEADER BANNER */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 text-navy transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-inner shrink-0",
              isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
            )}>
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {project.title} <span className={cn(isDark ? "text-teal" : "text-white drop-shadow-sm")}>Project</span>
                </h1>
                <Badge className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                  project.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : project.status === "in_progress"
                    ? "bg-teal text-navy"
                    : "bg-slate-500 text-white"
                )}>
                  {project.status.replace("_", " ")}
                </Badge>
                {project.featured && (
                  <Badge className="bg-amber-500 text-white font-black text-xs uppercase flex items-center gap-1 px-2 py-0.5">
                    <Star className="h-3 w-3 fill-white" />
                    Featured
                  </Badge>
                )}
                <Badge variant="outline" className="font-bold text-xs border capitalize">
                  {project.category}
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-300" : "text-navy/80")}>
                Client: {project.client || "QuardCube Core"} • Start: {project.start_date ? new Date(project.start_date).toLocaleDateString() : "Flexible"} • {progress.percent}% Milestone Execution
              </p>
            </div>
          </div>

          {/* Action Buttons: Aligned to the right side of the card */}
          <div className={cn(
            "flex items-end justify-end shrink-0 transition-all duration-300 self-end md:self-center",
            isSidebarOpen
              ? "flex-col items-end gap-2"
              : "flex-row items-center justify-end gap-2.5"
          )}>
            <Link href="/admin/projects" className={cn(isSidebarOpen ? "w-full sm:w-auto" : "")}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-4 gap-2 shadow-sm transition-all border-2 cursor-pointer w-full sm:w-44 justify-center",
                  isDark
                    ? "border-teal/30 text-teal hover:bg-teal/10"
                    : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Back to Projects</span>
              </Button>
            </Link>

            <Link
              href={`/projects/${project.slug || project.id}`}
              target="_blank"
              className={cn(isSidebarOpen ? "w-full sm:w-auto" : "")}
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-4 gap-2 shadow-sm transition-all border-2 cursor-pointer w-full sm:w-44 justify-center",
                  isDark
                    ? "border-teal/30 text-teal hover:bg-teal/10"
                    : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Public View</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Project Budget", value: project.budget ? `TSH ${(Number(project.budget) / 1_000_000).toFixed(1)}M` : "Internal / R&D", icon: TrendingUp },
          { title: "Milestone Execution", value: `${progress.percent}% Progress`, icon: Target },
          { title: "Engineering Team", value: `${project.team_size || 4} Assigned`, icon: Users },
          { title: "Tech Stack Modules", value: `${project.technologies?.length || 0} Modules`, icon: Code2 },
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
              <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Budget Benchmark (2 cols) */}
        <Card
          className={cn(
            "lg:col-span-2 rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                    isDark
                      ? "bg-navy text-teal border-teal/30"
                      : "bg-teal text-navy border-teal/40"
                  )}
                >
                  <TrendingUp className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-black">
                    Engineering Budget Allocation Benchmark
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparing project resource outlay across QuardCube software portfolio
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold",
                    isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                  )}
                >
                  Avg: TSH {(portfolio.averageBudget / 1_000_000).toFixed(1)}M
                </Badge>
                <Button
                  onClick={openEditModal}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2.5 rounded-lg text-xs font-bold gap-1 border transition-all cursor-pointer",
                    isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 text-navy hover:bg-navy/10"
                  )}
                  title="Edit Budget and Scope Parameters"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>

            {portfolio.budgets.length === 0 ? (
              <div className={cn(
                "h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-6 rounded-2xl border-2 border-dashed my-2 transition-all",
                isDark ? "border-teal/25 bg-teal/5" : "border-navy/20 bg-teal/5"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm",
                  isDark ? "bg-teal text-navy font-black" : "bg-navy text-white font-black"
                )}>
                  <DollarSign className="w-6 h-6" />
                </div>
                <h4 className={cn("font-black text-sm sm:text-base", isDark ? "text-white" : "text-navy")}>
                  No Engineering Budget Configured
                </h4>
                <p className={cn("text-xs max-w-md mt-1 mb-4 leading-relaxed font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                  This project and portfolio initiatives do not currently have budget allocations recorded. Assign an engineering budget to initialize portfolio benchmarking and cost-utilization metrics.
                </p>
                <Button
                  onClick={openEditModal}
                  className={cn(
                    "font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer",
                    isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Allocate Project Budget
                </Button>
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full pt-4">
                <ChartContainer config={budgetChartConfig} className="h-full w-full">
                  <BarChart
                    data={portfolio.budgets}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "rgba(64, 224, 208, 0.1)" : "rgba(0, 0, 128, 0.08)"}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="budget"
                      name="Allocated Budget"
                      fill={isDark ? "#38bdf8" : "#000080"}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="utilized"
                      name="Utilized / Disbursed"
                      fill={isDark ? "#40E0D0" : "#0d9488"}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold opacity-75",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <span>Current project: {project.title}</span>
            <span>Total Portfolio Outlay: TSH {(portfolio.totalBudget / 1_000_000).toFixed(1)}M</span>
          </div>
        </Card>

        {/* Portfolio Category Distribution (1 col) */}
        <Card
          className={cn(
            "rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                  isDark
                    ? "bg-navy text-teal border-teal/30"
                    : "bg-teal text-navy border-teal/40"
                )}
              >
                <Layers className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black">
                  Portfolio Categories
                </CardTitle>
                <CardDescription className="text-xs">
                  Active engineering domains & services
                </CardDescription>
              </div>
            </div>

            {portfolio.byCategory.length > 0 ? (
              <div className="h-56 sm:h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolio.byCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {portfolio.byCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} projects`, name]}
                      contentStyle={{
                        borderRadius: "1rem",
                        fontWeight: "bold",
                        backgroundColor: isDark ? "#0c1833" : "#ffffff",
                        borderColor: isDark ? "#40E0D0" : "#000080",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center opacity-60 text-xs">
                No categories cataloged
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-navy/10 dark:border-teal/10">
            {portfolio.byCategory.slice(0, 4).map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="font-semibold truncate max-w-[140px] capitalize">
                    {c.name}
                  </span>
                </div>
                <span className="font-mono font-bold opacity-80">{c.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="scope" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scope">
            <Target className="h-4 w-4 shrink-0" />
            <span>Engineering Scope & Results</span>
          </TabsTrigger>
          <TabsTrigger value="related">
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span>Related {project.category}</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-teal group-data-[state=active]:text-navy">
              {related.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Scope */}
        <TabsContent value="scope">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* 1. Problem Statement & Challenge */}
            <div
              className={cn(
                "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-3.5",
                isDark
                  ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                  : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Target className="h-4 w-4" />
                </div>
                <span className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                  Problem Statement & Challenge
                </span>
              </div>
              <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-200" : "text-navy/85")}>
                {project.challenge || "Complex system requirements necessitating scalable architectural design, low-latency telemetry processing, and resilient enterprise data pipelines."}
              </p>
            </div>

            {/* 2. Engineered Solution */}
            <div
              className={cn(
                "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-3.5",
                isDark
                  ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                  : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Code2 className="h-4 w-4" />
                </div>
                <span className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                  Engineered Solution
                </span>
              </div>
              <p className={cn("text-xs leading-relaxed font-medium", isDark ? "text-slate-200" : "text-navy/85")}>
                {project.solution || "Implementation of high-performance microservices, modern front-end interfaces, and automated continuous deployment workflows aligned with modern security standards."}
              </p>
            </div>

            {/* 3. Key Results & Metrics */}
            <div
              className={cn(
                "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-3.5",
                isDark
                  ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                  : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Trophy className="h-4 w-4" />
                </div>
                <span className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                  Key Results & Metrics
                </span>
              </div>
              <ul className={cn("text-xs space-y-2 font-medium", isDark ? "text-slate-200" : "text-navy/85")}>
                {(project.results && project.results.length > 0) ? (
                  project.results.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>{r}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Production-ready deployment & telemetry</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Zero regression SLA performance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                      <span>Client stakeholder sign-off completed</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Related */}
        <TabsContent value="related" className="mt-0">
          <div
            className={cn(
              "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
              isDark
                ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-sm sm:text-base font-black leading-tight capitalize", isDark ? "text-white" : "text-navy font-black")}>
                    Other Projects in {project.category}
                  </h3>
                  <p className={cn("text-[11px] sm:text-xs font-medium leading-tight mt-0.5", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    Sister initiatives sharing technology domains and architectural stacks
                  </p>
                </div>
              </div>
              <Badge className={cn("font-bold text-xs uppercase", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                {related.length} Related
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
              {related.length === 0 ? (
                <div className="col-span-full text-center py-8 text-xs font-semibold opacity-70">
                  No other projects cataloged under this category.
                </div>
              ) : (
                related.map(rel => (
                  <Link
                    key={rel.id}
                    href={`/admin/projects/${rel.id}`}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col justify-between gap-3 transition-all duration-200 hover:scale-[1.02] group cursor-pointer",
                      isDark
                        ? "bg-[#060a22]/85 border-teal/40 hover:border-teal text-white shadow-xs"
                        : "bg-white border-2 border-navy text-navy shadow-xs hover:border-navy"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black",
                            isDark ? "bg-teal text-navy shadow-2xs" : "bg-navy text-white shadow-2xs"
                          )}>
                            <FolderOpen className="w-3 h-3" />
                          </div>
                          <p className={cn("font-black text-xs sm:text-sm truncate", isDark ? "text-white group-hover:text-teal" : "text-navy group-hover:text-teal-700")}>
                            {rel.title}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-[9px] uppercase font-black px-1.5 py-0.5 shrink-0",
                            rel.status === "completed" 
                              ? "bg-emerald-500 text-white" 
                              : isDark ? "bg-teal text-navy" : "bg-navy text-white"
                          )}
                        >
                          {rel.status}
                        </Badge>
                      </div>
                      <p className={cn("text-[11px] leading-tight line-clamp-2 font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                        {rel.description || rel.short_description || "Enterprise initiative"}
                      </p>
                    </div>

                    <div className={cn("pt-2 border-t flex items-center justify-between text-[10px] font-bold", isDark ? "border-teal/20 text-teal-300" : "border-navy/15 text-navy/70")}>
                      <span>{rel.budget ? `TSH ${(Number(rel.budget) / 1_000_000).toFixed(1)}M` : "Budget Pending"}</span>
                      <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-teal">
                        View Detail →
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Budget & Scope Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <DollarSign className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Edit Budget & Engineering Scope
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Update budget outlay, team allocation, timeline, and technical scope parameters
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBudgetAndScope} className={cn(
            "space-y-4 p-4 sm:p-5 rounded-2xl border transition-all mt-3",
            isDark
              ? "bg-teal/15 border border-teal/40 text-white"
              : "bg-teal/15 border-2 border-navy text-navy"
          )}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_budget" className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>Engineering Budget (TSH)</span>
                  <span className="text-[10px] text-teal font-medium">Portfolio benchmark</span>
                </Label>
                <Input
                  id="edit_budget"
                  type="number"
                  min="0"
                  step="500000"
                  value={editForm.budget === 0 ? "" : (editForm.budget ?? "")}
                  onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value === "" ? 0 : Number(e.target.value) }))}
                  placeholder="e.g. 25000000"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white placeholder:text-slate-400" : "bg-white border-navy/20 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_team_size" className="text-xs font-bold uppercase tracking-wider">
                  Assigned Team Size
                </Label>
                <Input
                  id="edit_team_size"
                  type="number"
                  min="1"
                  value={editForm.team_size || 1}
                  onChange={(e) => setEditForm(prev => ({ ...prev, team_size: Number(e.target.value) || 1 }))}
                  placeholder="e.g. 4"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white placeholder:text-slate-400" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_status" className="text-xs font-bold uppercase tracking-wider">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val: any) => setEditForm(prev => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_start_date" className="text-xs font-bold uppercase tracking-wider">Start Date</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_end_date" className="text-xs font-bold uppercase tracking-wider">End Date</Label>
                <Input
                  id="edit_end_date"
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_challenge" className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Problem Statement & Challenge
              </Label>
              <Textarea
                id="edit_challenge"
                value={editForm.challenge}
                onChange={(e) => setEditForm(prev => ({ ...prev, challenge: e.target.value }))}
                rows={3}
                placeholder="Key technical hurdles, scalability bottlenecks or project problem statement"
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white placeholder:text-slate-400" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_solution" className="text-xs font-bold uppercase tracking-wider text-teal">
                Engineered Solution
              </Label>
              <Textarea
                id="edit_solution"
                value={editForm.solution}
                onChange={(e) => setEditForm(prev => ({ ...prev, solution: e.target.value }))}
                rows={3}
                placeholder="Architectural design, microservices, frameworks and solutions implemented"
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#060a22]/80 border-teal/30 text-white placeholder:text-slate-400" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className={cn("rounded-xl border-2 font-bold h-10 px-4 text-xs sm:text-sm", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingEdit}
                className="bg-teal text-navy font-black hover:bg-teal-400 rounded-xl h-10 px-5 shadow-md transition-all active:scale-95 text-xs sm:text-sm cursor-pointer"
              >
                {isSubmittingEdit ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Save Parameters
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
