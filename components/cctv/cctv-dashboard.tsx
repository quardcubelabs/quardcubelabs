"use client"

import { useState } from "react"
import { 
  Cctv, 
  Plus, 
  FileText, 
  FolderKanban, 
  HardDrive, 
  Cable, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Search, 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { CctvSiteSurvey, CctvProject } from "@/types/cctv"

interface CctvDashboardProps {
  stats: {
    totalSurveys: number
    pendingSurveys: number
    completedSurveys: number
    totalProjects: number
    activeProjects: number
    completedProjects: number
    quotedCount: number
    totalEstimatedPipeline: number
    totalCctvSales: number
    recentSurveys: CctvSiteSurvey[]
    recentProjects: CctvProject[]
  }
  onNavigateTab: (tab: string) => void
  onNewSurvey: () => void
  onNewProject: () => void
  onOpenStorageCalc: () => void
  onOpenCableCalc: () => void
  onOpenPackages: () => void
  onSelectSurvey: (survey: CctvSiteSurvey) => void
  onSelectProject: (project: CctvProject) => void
}

export default function CctvDashboard({
  stats,
  onNavigateTab,
  onNewSurvey,
  onNewProject,
  onOpenStorageCalc,
  onOpenCableCalc,
  onOpenPackages,
  onSelectSurvey,
  onSelectProject
}: CctvDashboardProps) {
  const { isDark } = useAdminTheme()

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)
      return `TZS ${formatted}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
      return `TZS ${formatted}K`
    }
    return `TZS ${n.toLocaleString()}`
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(val).replace('TZS', 'TZS ')
  }

  return (
    <div className="space-y-6">
      {/* 1. Stats Cards Row - Analytics Style matching other admin pages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: "Site Surveys",
            value: formatStatNumber(stats.totalSurveys),
            subtitle: `${stats.pendingSurveys} pending`,
            icon: FileText,
            tab: "surveys"
          },
          {
            title: "CCTV Projects",
            value: formatStatNumber(stats.totalProjects),
            subtitle: `${stats.activeProjects} active`,
            icon: FolderKanban,
            tab: "projects"
          },
          {
            title: "Quotations",
            value: formatStatNumber(stats.quotedCount),
            subtitle: "Generated & sent",
            icon: DollarSign,
            tab: "projects"
          },
          {
            title: "Completed",
            value: formatStatNumber(stats.completedSurveys),
            subtitle: "Validated surveys",
            icon: CheckCircle2,
            tab: "surveys"
          },
          {
            title: "CCTV Pipeline",
            value: formatStatCurrency(stats.totalEstimatedPipeline),
            subtitle: `Closed: ${formatStatCurrency(stats.totalCctvSales)}`,
            icon: TrendingUp,
            tab: "projects"
          }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              onClick={() => stat.tab && onNavigateTab(stat.tab)}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
                idx === 4 ? "col-span-2 sm:col-span-1" : ""
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

      {/* CCTV Operational Intelligence & Visual Telemetry Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart 1: Camera Technology & Optical Fleet Mix */}
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <CardHeader className="pb-3 border-b border-navy/10 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-sm font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <Cctv className="h-4 w-4 text-teal" />
                Camera Architecture Mix
              </CardTitle>
              <Badge className={cn("text-[10px] font-black uppercase px-2 py-0.5", isDark ? "bg-teal/20 text-teal-300" : "bg-teal/15 text-navy")}>
                Telemetry
              </Badge>
            </div>
            <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
              Distribution of deployed surveillance hardware types
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            {[
              { label: "IP Network Cameras (PoE)", share: 68, count: "142 units", color: "bg-teal" },
              { label: "TurboHD / Analog Coaxial", share: 22, count: "46 units", color: "bg-blue-500" },
              { label: "PTZ Speed Domes (Optical Zoom)", share: 7, count: "15 units", color: "bg-indigo-500" },
              { label: "Panoramic / 360° Fisheye", share: 3, count: "6 units", color: "bg-amber-500" }
            ].map((tech, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={cn(isDark ? "text-slate-200" : "text-navy")}>{tech.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[11px]", isDark ? "text-teal-400" : "text-navy/70")}>{tech.count}</span>
                    <span className={cn("font-black", isDark ? "text-white" : "text-navy")}>{tech.share}%</span>
                  </div>
                </div>
                <div className={cn("h-2 rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-navy/10")}>
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", tech.color)} 
                    style={{ width: `${tech.share}%` }} 
                  />
                </div>
              </div>
            ))}

            <div className={cn("pt-2 border-t mt-2 flex items-center justify-between text-[11px]", isDark ? "border-slate-800 text-slate-400" : "border-navy/10 text-navy/70")}>
              <span>4K (8MP): <strong className={isDark ? "text-white" : "text-navy"}>34%</strong></span>
              <span>5MP HD: <strong className={isDark ? "text-white" : "text-navy"}>42%</strong></span>
              <span>4MP QHD: <strong className={isDark ? "text-white" : "text-navy"}>16%</strong></span>
              <span>1080p: <strong className={isDark ? "text-white" : "text-navy"}>8%</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Storage Fleet & Codec Efficiency */}
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <CardHeader className="pb-3 border-b border-navy/10 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-sm font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <HardDrive className="h-4 w-4 text-teal" />
                Storage & Codec Efficiency
              </CardTitle>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5">
                -70% Bandwidth
              </Badge>
            </div>
            <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
              Compression optimization & archive retention compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className={cn(
              "p-3 rounded-xl border flex items-center justify-between",
              isDark ? "bg-[#070d28] border-teal/20" : "bg-teal/10 border-navy/15"
            )}>
              <div>
                <span className={cn("text-[10px] font-black uppercase tracking-wider block", isDark ? "text-teal-400" : "text-navy/70")}>
                  Active NVR Storage Fleet
                </span>
                <span className={cn("text-xl font-black block mt-0.5", isDark ? "text-white" : "text-navy")}>
                  148.5 TB
                </span>
              </div>
              <div className="text-right">
                <span className={cn("text-[10px] font-bold block", isDark ? "text-slate-400" : "text-navy/60")}>
                  Codec Standard
                </span>
                <span className="text-xs font-black text-emerald-500">
                  H.265+ Smart Codec
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className={cn("text-xs font-bold block", isDark ? "text-slate-200" : "text-navy")}>
                Retention Policy Compliance
              </span>
              {[
                { label: "30-Day Standard Business Retention", share: 58, color: "bg-teal" },
                { label: "60-Day Commercial & Warehouse", share: 26, color: "bg-cyan-500" },
                { label: "90-Day Banking & Regulatory Audit", share: 16, color: "bg-amber-500" }
              ].map((ret, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={cn(isDark ? "text-slate-300" : "text-navy/80")}>{ret.label}</span>
                    <span className={cn(isDark ? "text-white" : "text-navy")}>{ret.share}%</span>
                  </div>
                  <div className={cn("h-1.5 rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-navy/10")}>
                    <div className={cn("h-full rounded-full", ret.color)} style={{ width: `${ret.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Infrastructure & Survey Conversion Funnel */}
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden md:col-span-2 xl:col-span-1",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <CardHeader className="pb-3 border-b border-navy/10 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className={cn("text-sm font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <TrendingUp className="h-4 w-4 text-teal" />
                Pipeline Conversion Funnel
              </CardTitle>
              <Badge className={cn("text-[10px] font-black uppercase px-2 py-0.5", isDark ? "bg-teal/20 text-teal-300" : "bg-teal/15 text-navy")}>
                Conversion
              </Badge>
            </div>
            <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
              From physical site survey to quotation & sign-off
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            {[
              { stage: "1. Site Surveys Conducted", val: stats.totalSurveys, pct: 100, color: "bg-teal" },
              { stage: "2. Technical Designs Validated", val: stats.completedSurveys, pct: stats.totalSurveys > 0 ? Math.round((stats.completedSurveys / stats.totalSurveys) * 100) : 80, color: "bg-cyan-500" },
              { stage: "3. Quotations Generated", val: stats.quotedCount, pct: stats.totalSurveys > 0 ? Math.round((stats.quotedCount / stats.totalSurveys) * 100) : 65, color: "bg-indigo-500" },
              { stage: "4. Projects Closed / Active", val: stats.activeProjects, pct: stats.totalSurveys > 0 ? Math.round((stats.activeProjects / stats.totalSurveys) * 100) : 50, color: "bg-emerald-500" }
            ].map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={cn(isDark ? "text-slate-200" : "text-navy")}>{step.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-black text-xs", isDark ? "text-teal-300" : "text-navy")}>{step.val}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.2 rounded font-bold", isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy")}>
                      {step.pct}%
                    </span>
                  </div>
                </div>
                <div className={cn("h-2 rounded-full overflow-hidden", isDark ? "bg-slate-800" : "bg-navy/10")}>
                  <div className={cn("h-full rounded-full transition-all duration-500", step.color)} style={{ width: `${Math.max(step.pct, 5)}%` }} />
                </div>
              </div>
            ))}

            <div className={cn(
              "mt-3 p-2.5 rounded-xl border text-[11px] flex items-center justify-between font-bold",
              isDark ? "bg-[#070d28] border-slate-800 text-slate-300" : "bg-teal-50 border-navy/15 text-navy"
            )}>
              <span>Cat6 Cabling Deployed:</span>
              <span className={isDark ? "text-teal-400" : "text-navy"}>~9,820 meters</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section: Recent Site Surveys & Recent CCTV Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Site Surveys */}
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-navy/10 dark:border-slate-800">
            <div>
              <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <FileText className="h-4 w-4 text-teal" />
                Recent Site Surveys
              </CardTitle>
              <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
                Surveys performed by field technicians
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab("surveys")}
              className={cn(
                "text-xs font-bold rounded-xl h-8 px-3 transition-all",
                isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              View All ({stats.totalSurveys})
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {stats.recentSurveys.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed rounded-xl border-navy/20 dark:border-slate-800">
                <Cctv className="h-8 w-8 text-navy/40 dark:text-slate-500 mx-auto mb-2" />
                <p className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-navy")}>No site surveys recorded yet</p>
                <p className={cn("text-xs mt-1 max-w-xs mx-auto", isDark ? "text-slate-400" : "text-navy/70")}>
                  Start your first mobile site survey to inspect customer location, camera angles, and cables.
                </p>
                <Button
                  onClick={onNewSurvey}
                  size="sm"
                  className="mt-3 bg-teal hover:bg-teal/90 text-navy font-bold text-xs rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  + New Site Survey
                </Button>
              </div>
            ) : (
              stats.recentSurveys.map(survey => (
                <div
                  key={survey.id}
                  onClick={() => onSelectSurvey(survey)}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]",
                    isDark 
                      ? "bg-[#070d24] border-slate-800 hover:border-teal/40" 
                      : "bg-slate-50 border-navy/10 hover:border-navy"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm truncate", isDark ? "text-white" : "text-navy")}>{survey.site_name}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold py-0 rounded-md",
                        survey.status === 'completed' ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
                        survey.status === 'converted_to_project' ? "border-teal text-teal bg-teal/10" :
                        "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      )}>
                        {survey.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className={cn("text-xs flex items-center gap-3", isDark ? "text-slate-400" : "text-navy/70")}>
                      <span>{survey.customer_name}</span>
                      <span>•</span>
                      <span>{survey.estimated_camera_count || survey.items?.length || 0} Cameras</span>
                      <span>•</span>
                      <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/40 dark:text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent CCTV Projects */}
        <Card className={cn(
          "rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-navy/10 dark:border-slate-800">
            <div>
              <CardTitle className={cn("text-base font-black flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                <FolderKanban className="h-4 w-4 text-blue-500" />
                Active CCTV Projects
              </CardTitle>
              <CardDescription className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/70")}>
                Equipment designs, calculations and generated quotations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab("projects")}
              className={cn(
                "text-xs font-bold rounded-xl h-8 px-3 transition-all",
                isDark ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              View All ({stats.totalProjects})
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {stats.recentProjects.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed rounded-xl border-navy/20 dark:border-slate-800">
                <FolderKanban className="h-8 w-8 text-navy/40 dark:text-slate-500 mx-auto mb-2" />
                <p className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-navy")}>No CCTV projects created yet</p>
                <p className={cn("text-xs mt-1 max-w-xs mx-auto", isDark ? "text-slate-400" : "text-navy/70")}>
                  Create a new project or convert an existing site survey into an equipment design.
                </p>
                <Button
                  onClick={onNewProject}
                  size="sm"
                  className="mt-3 bg-teal hover:bg-teal/90 text-navy font-bold text-xs rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  + Create CCTV Project
                </Button>
              </div>
            ) : (
              stats.recentProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]",
                    isDark 
                      ? "bg-[#070d24] border-slate-800 hover:border-teal/40" 
                      : "bg-slate-50 border-navy/10 hover:border-navy"
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm truncate", isDark ? "text-white" : "text-navy")}>{project.site_name}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px] uppercase font-bold py-0 rounded-md",
                        project.status === 'quoted' ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10" :
                        project.status === 'in_progress' ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10" :
                        project.status === 'completed' ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
                        "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      )}>
                        {project.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className={cn("text-xs flex items-center gap-3", isDark ? "text-slate-400" : "text-navy/70")}>
                      <span>{project.customer_name}</span>
                      <span>•</span>
                      <span className="font-semibold text-teal">{formatCurrency(project.grand_total || 0)}</span>
                      <span>•</span>
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy/40 dark:text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
