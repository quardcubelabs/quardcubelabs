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
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { getProjectDetail } from "@/lib/detail-actions"
import type { ProjectDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  FolderOpen,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  Github,
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

  const [data, setData] = useState<ProjectDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await getProjectDetail(projectId)
        if (mounted) setData(res)
      } catch (err) {
        console.error("Failed to load project details:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [projectId])

  if (isLoading) return <AdminLoading />

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card
          className={cn(
            "max-w-md w-full p-8 text-center rounded-3xl border-2 shadow-xl",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border shadow-sm",
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
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0",
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

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/projects">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Projects</span>
              </Button>
            </Link>

            {project.project_url && (
              <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                    isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Live Demo</span>
                </Button>
              </a>
            )}

            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                    isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                  )}
                >
                  <Github className="w-4 h-4" />
                  <span className="hidden sm:inline">Repository</span>
                </Button>
              </a>
            )}

            <Link href={`/projects/${project.slug || project.id}`} target="_blank">
              <Button
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2",
                  isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                )}
              >
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
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                )}
              >
                Avg: TSH {(portfolio.averageBudget / 1_000_000).toFixed(1)}M
              </Badge>
            </div>

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
                    fill={isDark ? "#000080" : "#000080"}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="utilized"
                    name="Utilized / Disbursed"
                    fill={isDark ? "#40E0D0" : "#40E0D0"}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className={cn(
                "rounded-3xl border-2 p-6 shadow-md space-y-3",
                isDark
                  ? "bg-[#0a1033] border-teal/20 text-white"
                  : "bg-white border-navy/20 text-navy"
              )}
            >
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <Target className="h-5 w-5" />
                Problem Statement & Challenge
              </div>
              <p className="text-xs leading-relaxed opacity-85">
                {project.challenge || "Complex system requirements necessitating scalable architectural design, low-latency telemetry processing, and resilient enterprise data pipelines."}
              </p>
            </Card>

            <Card
              className={cn(
                "rounded-3xl border-2 p-6 shadow-md space-y-3",
                isDark
                  ? "bg-[#0a1033] border-teal/20 text-white"
                  : "bg-white border-navy/20 text-navy"
              )}
            >
              <div className="flex items-center gap-2 text-teal font-bold text-sm">
                <Code2 className="h-5 w-5" />
                Engineered Solution
              </div>
              <p className="text-xs leading-relaxed opacity-85">
                {project.solution || "Implementation of high-performance microservices, modern front-end interfaces, and automated continuous deployment workflows aligned with modern security standards."}
              </p>
            </Card>

            <Card
              className={cn(
                "rounded-3xl border-2 p-6 shadow-md space-y-3",
                isDark
                  ? "bg-[#0a1033] border-teal/20 text-white"
                  : "bg-white border-navy/20 text-navy"
              )}
            >
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <Trophy className="h-5 w-5" />
                Key Results & Metrics
              </div>
              <ul className="text-xs space-y-1.5 opacity-85">
                {(project.results && project.results.length > 0) ? (
                  project.results.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Production-ready deployment & telemetry</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Zero regression SLA performance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>Client stakeholder sign-off completed</span>
                    </li>
                  </>
                )}
              </ul>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Related */}
        <TabsContent value="related" className="mt-0">
          <Card
            className={cn(
              "rounded-3xl border-2 p-6 shadow-lg",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <div className="mb-4">
              <h3 className="text-lg font-black flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-teal" />
                Other Projects in {project.category}
              </h3>
              <p className="text-xs opacity-75">
                Sister initiatives sharing technology domains and architectural stacks
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {related.length === 0 ? (
                <p className="col-span-full text-center py-8 text-xs opacity-60">
                  No other projects cataloged under this category.
                </p>
              ) : (
                related.map(rel => (
                  <Link
                    key={rel.id}
                    href={`/admin/projects/${rel.id}`}
                    className={cn(
                      "p-4 rounded-2xl border-2 space-y-2 transition-all hover:scale-[1.02]",
                      isDark
                        ? "bg-[#0c1833] border-teal/20 hover:border-teal text-white"
                        : "bg-white border-navy/15 hover:border-navy text-navy shadow-xs"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm truncate">{rel.title}</p>
                      <Badge
                        className={cn(
                          "text-[10px] uppercase font-black px-2 py-0.5",
                          rel.status === "completed" ? "bg-emerald-500 text-white" : "bg-teal text-navy"
                        )}
                      >
                        {rel.status}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-75 line-clamp-2">
                      {rel.description || rel.short_description || "Enterprise initiative"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
