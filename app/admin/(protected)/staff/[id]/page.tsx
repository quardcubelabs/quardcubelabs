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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { getStaffDetail } from "@/lib/detail-actions"
import type { StaffDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Activity,
  Clock,
  KeyRound,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react"

interface StaffDetailPageProps {
  params: Promise<{ id: string }>
}

const activityChartConfig: ChartConfig = {
  count: {
    label: "Actions",
    color: "#40E0D0",
  },
}

const moduleChartConfig: ChartConfig = {
  value: {
    label: "Operations",
    color: "#000080",
  },
}

export default function StaffDetailPage({ params }: StaffDetailPageProps) {
  const resolvedParams = use(params)
  const staffId = resolvedParams.id
  const router = useRouter()
  const { isDark } = useAdminTheme()

  const [data, setData] = useState<StaffDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await getStaffDetail(staffId)
        if (mounted) setData(res)
      } catch (err) {
        console.error("Failed to load staff details:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [staffId])

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
            <UserCheck className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Staff Member Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No profile matches the identifier "{staffId}". It may have been removed.
          </p>
          <Link href="/admin/staff">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff Register
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { staff, branch, role, permissionCoverage, peers, tenureDays, audit } = data
  const initials = staff.full_name
    .split(" ")
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const PIE_COLORS = isDark
    ? ["#40E0D0", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399"]
    : ["#000080", "#0891b2", "#2563eb", "#7c3aed", "#059669", "#d97706"]

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/staff">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 px-3 font-bold border-2 transition-colors",
                isDark
                  ? "border-teal/30 text-white hover:bg-teal/20"
                  : "border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Staff
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                isDark
                  ? "bg-navy text-teal border-teal/30"
                  : "bg-teal text-navy border-teal/40"
              )}
            >
              <UserCheck className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={cn(
                    "text-xl sm:text-2xl font-black tracking-tight",
                    isDark ? "text-white" : "text-navy"
                  )}
                >
                  {staff.full_name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono font-bold text-xs uppercase border",
                    isDark
                      ? "border-teal/40 bg-teal/15 text-teal"
                      : "border-navy/30 bg-teal text-navy"
                  )}
                >
                  {staff.staff_code}
                </Badge>
              </div>
              <p
                className={cn(
                  "text-xs font-semibold mt-0.5",
                  isDark ? "text-teal-400/80" : "text-navy/70"
                )}
              >
                {role?.name || staff.role} • {staff.branch_name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a href={`mailto:${staff.email}`}>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 px-3 font-bold border-2",
                isDark
                  ? "border-teal/30 text-teal-300 hover:bg-teal/20"
                  : "border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </Button>
          </a>
          <a href={`tel:${staff.phone}`}>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 px-3 font-bold border-2",
                isDark
                  ? "border-teal/30 text-teal-300 hover:bg-teal/20"
                  : "border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <Phone className="h-4 w-4 mr-1.5" />
              Call
            </Button>
          </a>
          {branch && (
            <Link href={`/admin/branches/${branch.id}`}>
              <Button
                size="sm"
                className={cn(
                  "rounded-xl h-10 px-4 font-black shadow-md transition-all active:scale-95",
                  isDark
                    ? "bg-navy text-teal hover:bg-navy/80 border border-teal/40"
                    : "bg-teal text-navy hover:bg-teal-400"
                )}
              >
                <Building2 className="h-4 w-4 mr-1.5" />
                Branch Details
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Hero Profile Card */}
      <Card
        className={cn(
          "rounded-3xl border-2 overflow-hidden shadow-lg",
          isDark
            ? "bg-[#0a1033] border-teal/20 text-white"
            : "bg-white border-navy/20 text-navy"
        )}
      >
        <div
          className={cn(
            "p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b",
            isDark ? "border-teal/10 bg-[#070d2b]" : "border-navy/10 bg-teal/10"
          )}
        >
          <div className="flex items-center gap-5">
            <div
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-md border-2 shrink-0",
                isDark
                  ? "bg-navy text-teal border-teal/40"
                  : "bg-teal text-navy border-teal/60"
              )}
            >
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black">{staff.full_name}</h2>
                <Badge
                  className={cn(
                    "text-xs font-black uppercase tracking-wider px-3 py-0.5",
                    staff.status === "active"
                      ? "bg-emerald-500 text-white"
                      : staff.status === "on_leave"
                      ? "bg-amber-500 text-white"
                      : "bg-slate-500 text-white"
                  )}
                >
                  {staff.status.replace("_", " ")}
                </Badge>
              </div>
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  isDark ? "text-teal-300" : "text-navy/80"
                )}
              >
                {role?.description || "Operational staff member with role-based dashboard access"}
              </p>
            </div>
          </div>

          {/* Quick Stats Pillar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Audited Actions
              </p>
              <p className="text-xl font-black mt-0.5">{audit.total}</p>
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Last 30 Days
              </p>
              <p className="text-xl font-black mt-0.5 text-emerald-500">
                {audit.last30Days}
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Perms Granted
              </p>
              <p className="text-xl font-black mt-0.5">
                {permissionCoverage.granted}/{permissionCoverage.total}
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Tenure
              </p>
              <p className="text-xl font-black mt-0.5">{tenureDays}d</p>
            </div>
          </div>
        </div>

        {/* Contact Strip */}
        <div
          className={cn(
            "p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold",
            isDark ? "bg-[#0a1033]" : "bg-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 opacity-60 shrink-0" />
            <span className="truncate">{staff.email}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 opacity-60 shrink-0" />
            <span>{staff.phone}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 opacity-60 shrink-0" />
            <span className="truncate">{staff.branch_name}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 opacity-60 shrink-0" />
            <span>Joined {new Date(staff.joined_date).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend (2 cols) */}
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
                    30-Day Operational Velocity
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live system audit telemetry recorded for {staff.full_name}
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
                {audit.last30Days} events
              </Badge>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ChartContainer config={activityChartConfig} className="h-full w-full">
                <AreaChart
                  data={audit.byDay}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="staffActivityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={isDark ? "#40E0D0" : "#000080"}
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="95%"
                        stopColor={isDark ? "#40E0D0" : "#000080"}
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "rgba(64, 224, 208, 0.1)" : "rgba(0, 0, 128, 0.08)"}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={isDark ? "#40E0D0" : "#000080"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#staffActivityGrad)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold opacity-75",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <span>Telemetry Source: Database Audit Trail</span>
            <span>
              Last activity:{" "}
              {audit.lastActionAt
                ? new Date(audit.lastActionAt).toLocaleString()
                : staff.last_active || "Never"}
            </span>
          </div>
        </Card>

        {/* Module Breakdown Donut (1 col) */}
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
                  Module Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Operational footprint by ERP entity
                </CardDescription>
              </div>
            </div>

            {audit.byModule.length > 0 ? (
              <div className="h-56 sm:h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={audit.byModule}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {audit.byModule.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} actions`, name]}
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
                <Activity className="h-8 w-8 mb-2 opacity-40" />
                No module records logged yet
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-navy/10 dark:border-teal/10">
            {audit.byModule.slice(0, 4).map((m, i) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="font-semibold truncate max-w-[140px]">{m.name}</span>
                </div>
                <span className="font-mono font-bold opacity-80">{m.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs Detail Section */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList
          className={cn(
            "p-1 rounded-2xl border-2 flex items-center justify-start h-auto flex-wrap gap-1",
            isDark ? "bg-[#0c1833] border-teal/20" : "bg-teal-50 border-navy/20"
          )}
        >
          <TabsTrigger
            value="audit"
            className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-teal data-[state=active]:text-navy"
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Audit Ledger ({audit.total})
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-teal data-[state=active]:text-navy"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            Role & RBAC ({permissionCoverage.granted})
          </TabsTrigger>
          <TabsTrigger
            value="peers"
            className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-teal data-[state=active]:text-navy"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Branch Peers ({peers.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Audit Log */}
        <TabsContent value="audit">
          <Card
            className={cn(
              "rounded-3xl border-2 overflow-hidden shadow-lg",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20">
              <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal" />
                Live Audit Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Every action executed by {staff.full_name} is permanently tracked for accountability
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Record / Ref</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Module</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Action</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Description</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {audit.recent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No audit entries recorded for this account yet.
                        </td>
                      </tr>
                    ) : (
                      audit.recent.map(l => (
                        <tr
                          key={l.id}
                          className={cn(
                            "border-b transition-colors cursor-pointer group",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-mono font-bold whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                                  isDark
                                    ? "bg-navy text-teal border-teal/30"
                                    : "bg-teal text-navy border-teal/40"
                                )}
                              >
                                <FileText
                                  className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
                                  isDark ? "text-teal-400" : "text-navy"
                                )}
                              >
                                {l.record_number || l.record_id.slice(0, 10)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:px-4 capitalize font-bold">
                            {l.module}
                          </td>
                          <td className="py-3 px-3 md:px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-mono font-bold capitalize border",
                                isDark
                                  ? "border-teal/30 bg-teal/10 text-teal-300"
                                  : "border-navy/20 bg-slate-50 text-navy"
                              )}
                            >
                              {l.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 md:px-4 max-w-md truncate">
                            {l.description}
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap opacity-75 font-mono">
                            {new Date(l.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Role & Permissions */}
        <TabsContent value="permissions">
          <Card
            className={cn(
              "rounded-3xl border-2 p-6 shadow-lg space-y-6",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-teal" />
                  Role Capabilities Matrix
                </h3>
                <Link href="/admin/roles">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "rounded-xl text-xs font-bold border-2",
                      isDark
                        ? "border-teal/30 text-teal hover:bg-teal/20"
                        : "border-navy/20 text-navy hover:bg-teal-50"
                    )}
                  >
                    Manage Roles
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
              <p className="text-xs opacity-75">
                Staff member inherits all permissions configured under the{" "}
                <span className="font-bold">{role?.name || staff.role}</span> role.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Coverage Ratio</span>
                <span>
                  {Math.round(
                    (permissionCoverage.granted / (permissionCoverage.total || 1)) * 100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  (permissionCoverage.granted / (permissionCoverage.total || 1)) * 100
                }
                className="h-2.5 rounded-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(role?.permissions || []).map(perm => (
                <div
                  key={perm}
                  className={cn(
                    "p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold",
                    isDark
                      ? "bg-[#0c1833] border-teal/20 text-white"
                      : "bg-teal-50/50 border-navy/15 text-navy"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="font-mono">{perm}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Branch Colleagues */}
        <TabsContent value="peers">
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
                <Users className="h-5 w-5 text-teal" />
                Colleagues at {staff.branch_name}
              </h3>
              <p className="text-xs opacity-75">
                Staff assigned to the same operational branch ({peers.length} active peers)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {peers.length === 0 ? (
                <p className="col-span-full text-center py-8 text-xs opacity-60">
                  No other staff members assigned to this branch.
                </p>
              ) : (
                peers.map(p => (
                  <Link
                    key={p.id}
                    href={`/admin/staff/${p.id}`}
                    className={cn(
                      "p-4 rounded-2xl border-2 flex items-center gap-3 transition-all hover:scale-[1.02]",
                      isDark
                        ? "bg-[#0c1833] border-teal/20 hover:border-teal text-white"
                        : "bg-white border-navy/15 hover:border-navy text-navy shadow-xs"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
                        isDark
                          ? "bg-navy text-teal border-teal/30"
                          : "bg-teal text-navy border-teal/40"
                      )}
                    >
                      {p.full_name
                        .split(" ")
                        .map(n => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.full_name}</p>
                      <p className="text-[11px] opacity-70 truncate font-medium">
                        {p.role} • {p.staff_code}
                      </p>
                    </div>
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
