"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import {
  AdminPageHeader,
  AdminStats,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminMutedText,
  AdminStatusBadge,
  AdminCountBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getProjectDetail } from "@/lib/detail-actions"
import { updateProject } from "@/lib/projects-actions"
import type { ProjectDetailData } from "@/lib/detail-types"
import type { Project } from "@/types/database"
import {
  ArrowLeft,
  FolderOpen,
  DollarSign,
  Users,
  ExternalLink,
  Layers,
  Code2,
  Target,
  Trophy,
  TrendingUp,
  Edit,
  Eye,
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
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [data, setData] = useState<ProjectDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [selectedRelated, setSelectedRelated] = useState<Project | null>(null)
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false)
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

  const relatedColumns: AdminTableColumn<Project>[] = [
    {
      key: "project",
      header: "Project",
      cellClassName: "max-w-[220px]",
      render: (rel) => (
        <AdminPrimaryCell
          icon={FolderOpen}
          title={rel.title}
          href={`/admin/projects/${rel.id}`}
          subtitle={rel.description || rel.short_description || "Enterprise initiative"}
          badge={
            rel.featured ? (
              <AdminTag className="shrink-0">Featured</AdminTag>
            ) : undefined
          }
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (rel) => <AdminStatusBadge status={rel.status} />,
    },
    {
      key: "category",
      header: "Category",
      hidden: "md",
      render: (rel) => (
        <AdminPill className="capitalize">{rel.category.replace("-", " ")}</AdminPill>
      ),
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      render: (rel) =>
        rel.budget ? (
          <span className="font-mono font-bold whitespace-nowrap">
            TSH {(Number(rel.budget) / 1_000_000).toFixed(1)}M
          </span>
        ) : (
          <AdminMutedText>Budget Pending</AdminMutedText>
        ),
    },
  ]

  const relatedActions: AdminTableAction<Project>[] = [
    {
      key: "view",
      label: "View Project Details",
      icon: Eye,
      variant: "view",
      onClick: (rel) => {
        setSelectedRelated(rel)
        setIsRelatedModalOpen(true)
      },
    },
    {
      key: "open",
      label: "Open Project Detail Page",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (rel) => `/admin/projects/${rel.id}`,
    },
  ]

  const relatedDetailSections: AdminDetailSectionData[] = selectedRelated
    ? [
        {
          key: "summary",
          title: "Project Summary",
          icon: Layers,
          span: 2,
          content: (
            <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
              {selectedRelated.description ||
                selectedRelated.short_description ||
                "No extended scope description registered."}
            </p>
          ),
        },
        {
          key: "details",
          title: "Engagement Details",
          icon: Code2,
          fields: [
            {
              label: "Status",
              value: <AdminStatusBadge status={selectedRelated.status} />,
            },
            {
              label: "Category",
              value: (
                <AdminPill className="capitalize">
                  {selectedRelated.category.replace("-", " ")}
                </AdminPill>
              ),
            },
            { label: "Client", value: selectedRelated.client || "Internal" },
            {
              label: "Budget",
              value: selectedRelated.budget
                ? `TSH ${Number(selectedRelated.budget).toLocaleString()}`
                : "Budget Pending",
            },
            { label: "Team Size", value: `${selectedRelated.team_size || 1} Engineer(s)` },
            {
              label: "Start Date",
              value: selectedRelated.start_date
                ? new Date(selectedRelated.start_date).toLocaleDateString()
                : "—",
            },
            {
              label: "End Date",
              value: selectedRelated.end_date
                ? new Date(selectedRelated.end_date).toLocaleDateString()
                : "—",
            },
          ],
        },
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16">
      <AdminPageHeader
        title={project.title}
        accent="Project"
        subtitle={`Client: ${project.client || "QuardCube Core"} • ${
          project.start_date
            ? `Start: ${new Date(project.start_date).toLocaleDateString()}`
            : "Start: Flexible"
        } • ${progress.percent}% Milestone Execution`}
        icon={FolderOpen}
        onRefresh={loadData}
        actions={
          <>
            <Link href="/admin/projects">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-4 gap-2 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-white dark:hover:bg-teal/10"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                Back to Projects
              </Button>
            </Link>
            <Link
              href={`/projects/${project.slug || project.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-4 gap-2 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-white dark:hover:bg-teal/10"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                Public View
              </Button>
            </Link>
          </>
        }
      />

      <AdminStats
        items={[
          {
            title: "Project Budget",
            value: project.budget
              ? `TSH ${(Number(project.budget) / 1_000_000).toFixed(1)}M`
              : "Internal / R&D",
            icon: TrendingUp,
          },
          {
            title: "Milestone Execution",
            value: `${progress.percent}% Progress`,
            icon: Target,
          },
          {
            title: "Engineering Team",
            value: `${project.team_size || 4} Assigned`,
            icon: Users,
          },
          {
            title: "Tech Stack Modules",
            value: `${project.technologies?.length || 0} Modules`,
            icon: Code2,
          },
        ]}
      />

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
                <CardTitleIcon icon={TrendingUp} isDark={isDark} />
                <div>
                  <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
                    Engineering Budget Allocation Benchmark
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparing project resource outlay across QuardCube software portfolio
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminPill className="font-mono normal-case">
                  Avg: TSH {(portfolio.averageBudget / 1_000_000).toFixed(1)}M
                </AdminPill>
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
              <CardTitleIcon icon={Layers} isDark={isDark} />
              <div>
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2.5">
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

      <Tabs defaultValue="scope" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scope">
            <Target className="h-4 w-4 shrink-0" />
            <span>Engineering Scope & Results</span>
          </TabsTrigger>
          <TabsTrigger value="related">
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span>Related {project.category}</span>
            <AdminCountBadge>{related.length}</AdminCountBadge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Scope */}
        <TabsContent value="scope">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
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
              <AdminPill className="font-bold uppercase">
                {related.length} Related
              </AdminPill>
            </div>

            <AdminTable
              columns={relatedColumns}
              data={related}
              rowKey={(rel) => rel.id}
              actions={relatedActions}
              emptyIcon={FolderOpen}
              emptyTitle="No other projects cataloged under this category."
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Budget & Scope */}
      <AdminFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        icon={DollarSign}
        title="Edit Budget & Engineering Scope"
        description="Update budget outlay, team allocation, timeline, and technical scope parameters"
        onSubmit={handleSaveBudgetAndScope}
        isSubmitting={isSubmittingEdit}
        isEdit
        editLabel="Save Parameters"
      >
        <AdminFormGrid>
          <AdminFormField label="Engineering Budget (TSH)" hint="Portfolio benchmark">
            <AdminInput
              type="number"
              min="0"
              step="500000"
              monospace
              value={editForm.budget === 0 ? "" : (editForm.budget ?? "")}
              onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value === "" ? 0 : Number(e.target.value) }))}
              placeholder="e.g. 25000000"
            />
          </AdminFormField>
          <AdminFormField label="Assigned Team Size">
            <AdminInput
              type="number"
              min="1"
              value={editForm.team_size || 1}
              onChange={(e) => setEditForm(prev => ({ ...prev, team_size: Number(e.target.value) || 1 }))}
              placeholder="e.g. 4"
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid className="grid-cols-1 sm:grid-cols-3">
          <AdminFormField label="Status">
            <AdminSelect
              value={editForm.status}
              onValueChange={(val) => setEditForm(prev => ({ ...prev, status: val as typeof prev.status }))}
              options={[
                { value: "completed", label: "Completed" },
                { value: "in_progress", label: "In Progress" },
                { value: "planned", label: "Planned" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Start Date">
            <AdminInput
              type="date"
              value={editForm.start_date}
              onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </AdminFormField>
          <AdminFormField label="End Date">
            <AdminInput
              type="date"
              value={editForm.end_date}
              onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Problem Statement & Challenge">
          <AdminTextarea
            value={editForm.challenge}
            onChange={(e) => setEditForm(prev => ({ ...prev, challenge: e.target.value }))}
            rows={3}
            placeholder="Key technical hurdles, scalability bottlenecks or project problem statement"
          />
        </AdminFormField>

        <AdminFormField label="Engineered Solution">
          <AdminTextarea
            value={editForm.solution}
            onChange={(e) => setEditForm(prev => ({ ...prev, solution: e.target.value }))}
            rows={3}
            placeholder="Architectural design, microservices, frameworks and solutions implemented"
          />
        </AdminFormField>
      </AdminFormModal>

      {/* Related project row details */}
      <AdminDetailModal
        open={isRelatedModalOpen}
        onOpenChange={(open) => {
          setIsRelatedModalOpen(open)
          if (!open) setSelectedRelated(null)
        }}
        icon={FolderOpen}
        title={selectedRelated?.title ?? "Project Details"}
        badge={
          selectedRelated ? (
            <AdminStatusBadge status={selectedRelated.status} />
          ) : undefined
        }
        subtitle={
          selectedRelated
            ? `Client: ${selectedRelated.client || "Internal Project"} • Category: ${selectedRelated.category.replace("-", " ")}`
            : undefined
        }
        sections={relatedDetailSections}
        headerActions={
          selectedRelated ? (
            <Link
              href={`/admin/projects/${selectedRelated.id}`}
              className="bg-teal hover:bg-teal-400 text-navy font-bold rounded-xl shadow-sm flex items-center gap-1.5 h-9 px-3.5 text-xs transition-all active:scale-95"
            >
              Open Project
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />
    </div>
  )
}
