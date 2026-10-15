"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
import { PERMISSION_CATEGORIES, LEGACY_PERMISSION_ALIASES } from "@/lib/role-constants"
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
  Check,
} from "lucide-react"


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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function StaffDetailPage() {
  const routeParams = useParams()
  const staffId = (routeParams?.id as string) || ""
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const [mounted, setMounted] = useState(false)

  const [data, setData] = useState<StaffDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Operational Velocity timeframe and date selectors
  const [timeframe, setTimeframe] = useState<"12months" | "30days" | "week">("30days")
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const day = new Date().getDate()
    return Math.min(5, Math.max(1, Math.ceil(day / 7)))
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!staffId) return
    let isCancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const res = await getStaffDetail(staffId)
        if (!isCancelled) setData(res)
      } catch (err) {
        console.error("Failed to load staff details:", err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [staffId])

  // Memoized permission mappings for exact matching with roles & permissions page
  const allPermissionDefs = useMemo(() => {
    const map = new Map<string, { id: string; name: string; description: string; category: string }>()
    PERMISSION_CATEGORIES.forEach(cat => {
      cat.permissions.forEach(p => {
        map.set(p.id, { ...p, category: cat.category })
      })
    })
    return map
  }, [])

  const allowedPermissions = useMemo(() => {
    const perms = data?.role?.permissions || []
    const seen = new Set<string>()
    const result: Array<{ id: string; name: string; description: string; category: string }> = []
    
    for (const rawId of perms) {
      const canonicalId = (rawId in LEGACY_PERMISSION_ALIASES) ? (LEGACY_PERMISSION_ALIASES as Record<string, string>)[rawId] : rawId
      if (seen.has(canonicalId)) continue
      
      const def = allPermissionDefs.get(canonicalId)
      if (def) {
        seen.add(canonicalId)
        result.push(def)
      }
    }
    return result
  }, [data?.role?.permissions, allPermissionDefs])

  // Velocity chart data computation based on timeframe
  const velocityData = useMemo(() => {
    if (!data) return []
    const allLogs = data.audit.allLogs || data.audit.recent || []

    if (timeframe === "12months") {
      const list = MONTH_SHORT.map((m, idx) => ({
        key: `m-${idx}`,
        label: m,
        fullLabel: `${MONTH_NAMES[idx]} ${selectedYear}`,
        count: 0,
      }))
      allLogs.forEach(log => {
        const d = new Date(log.created_at)
        if (!isNaN(d.getTime()) && d.getFullYear() === selectedYear) {
          const mIdx = d.getMonth()
          if (mIdx >= 0 && mIdx < 12) {
            list[mIdx].count += 1
          }
        }
      })
      return list
    }

    interface VelocityPoint {
      key: string
      label: string
      fullLabel: string
      count: number
      dateNum?: number
      dayNum?: number
    }

    if (timeframe === "week") {
      const startDay = (selectedWeek - 1) * 7 + 1
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const list: VelocityPoint[] = []
      for (let i = 0; i < 7; i++) {
        const dNum = startDay + i
        if (dNum <= daysInMonth) {
          const dObj = new Date(selectedYear, selectedMonth, dNum)
          const dayName = DAY_NAMES[dObj.getDay()]
          list.push({
            key: `w-${dNum}`,
            label: `${dayName} ${dNum}`,
            fullLabel: `${dayName}, ${dNum} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
            count: 0,
            dateNum: dNum,
          })
        }
      }
      allLogs.forEach(log => {
        const d = new Date(log.created_at)
        if (
          !isNaN(d.getTime()) &&
          d.getFullYear() === selectedYear &&
          d.getMonth() === selectedMonth
        ) {
          const dNum = d.getDate()
          const match = list.find(item => item.dateNum === dNum)
          if (match) match.count += 1
        }
      })
      return list
    }

    // Default: "30days"
    // Horizontal axis with 30 dates from date 1 to 30 or 31 depending on the current month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const list: VelocityPoint[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({
        key: `d-${d}`,
        label: `${d}`,
        fullLabel: `${d} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
        count: 0,
        dayNum: d,
      })
    }
    allLogs.forEach(log => {
      const d = new Date(log.created_at)
      if (
        !isNaN(d.getTime()) &&
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth
      ) {
        const day = d.getDate()
        if (day >= 1 && day <= daysInMonth) {
          list[day - 1].count += 1
        }
      }
    })
    return list
  }, [data, timeframe, selectedYear, selectedMonth, selectedWeek])

  const totalVelocityEvents = useMemo(() => {
    return velocityData.reduce((sum, item) => sum + item.count, 0)
  }, [velocityData])

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
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {staff.full_name} <span className={cn(isDark ? "text-teal" : "text-white drop-shadow-sm")}>Profile</span>
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  {staff.staff_code}
                </Badge>
                <Badge className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                  staff.status === "active" ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {staff.status.replace("_", " ")}
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-300" : "text-navy/80")}>
                {role?.name || staff.role} • {staff.branch_name} • Joined {new Date(staff.joined_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/staff">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Staff</span>
              </Button>
            </Link>

            <a href={`mailto:${staff.email}`}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </Button>
            </a>

            <a href={`tel:${staff.phone}`}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Call</span>
              </Button>
            </a>

            {branch && (
              <Link href={`/admin/branches/${branch.id}`}>
                <Button
                  size="sm"
                  className={cn(
                    "font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2",
                    isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Branch Hub</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Audit Trail Events", value: `${audit.total} events`, icon: Activity },
          { title: "Selected Period Activity", value: `${totalVelocityEvents} actions`, icon: TrendingUp },
          { title: "RBAC Permissions", value: `${allowedPermissions.length}/${permissionCoverage.total} active`, icon: ShieldCheck },
          { title: "Service Tenure", value: `${tenureDays} Days`, icon: Clock },
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

      {/* 3. VISUALIZATIONS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Velocity Chart (2 cols) */}
        <Card
          className={cn(
            "lg:col-span-2 rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
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
                    {timeframe === "12months"
                      ? "12-Month Operational Velocity"
                      : timeframe === "week"
                      ? "Weekly Operational Velocity"
                      : "30-Day Operational Velocity"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live system audit telemetry recorded for {staff.full_name}
                  </CardDescription>
                </div>
              </div>

              {/* Timeframe selector dropdown */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Select
                  value={timeframe}
                  onValueChange={(val: "12months" | "30days" | "week") => setTimeframe(val)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 px-3 rounded-xl font-bold text-xs shadow-xs min-w-[125px]",
                      isDark
                        ? "bg-[#080d2a] border-slate-700 text-teal hover:border-teal/50"
                        : "bg-slate-50 border-2 border-navy/30 text-navy hover:bg-slate-100"
                    )}
                  >
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent
                    className={cn(
                      "rounded-xl p-1 shadow-xl",
                      isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white border-2 border-navy/20"
                    )}
                  >
                    <SelectItem value="12months" className="text-xs font-bold rounded-lg cursor-pointer">
                      A Year
                    </SelectItem>
                    <SelectItem value="30days" className="text-xs font-bold rounded-lg cursor-pointer">
                      30 Days
                    </SelectItem>
                    <SelectItem value="week" className="text-xs font-bold rounded-lg cursor-pointer">
                      A Week
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold h-9 px-2.5 flex items-center justify-center shrink-0",
                    isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                  )}
                >
                  {totalVelocityEvents} events
                </Badge>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              {mounted ? (
                <ChartContainer config={activityChartConfig} className="h-full w-full">
                  <AreaChart
                    data={velocityData}
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
                      fontSize={timeframe === "30days" ? 9 : 11}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.fullLabel || item?.label || "Activity"
                          }}
                        />
                      }
                    />
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
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-xs opacity-50">Loading visualization...</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-75",
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

            {mounted && audit.byModule.length > 0 ? (
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

      {/* 4. TABS DETAIL SECTION (WITH SELECTED PERMISSIONS CARD THEME APPLIED) */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 shrink-0" />
            <span>Audit Ledger</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {audit.total}
            </span>
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Role & RBAC</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {allowedPermissions.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="peers">
            <Users className="h-4 w-4 shrink-0" />
            <span>Branch Peers</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {peers.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Audit Log */}
        <TabsContent value="audit" className="mt-0">
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
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Live Audit Ledger & Action Trace
                  </h3>
                  <p className={cn("text-[11px] font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                    Every action executed by {staff.full_name} is permanently tracked for governance
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
                )}
              >
                {audit.recent.length} Records Shown
              </Badge>
            </div>

            <div
              className={cn(
                "rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs",
                isDark ? "bg-[#060a22]/85 border-teal/40" : "bg-white border-2 border-navy"
              )}
            >
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
                                  "w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-sm border",
                                  isDark
                                    ? "bg-navy text-teal border-teal/30"
                                    : "bg-teal text-navy border-teal/40"
                                )}
                              >
                                <FileText
                                  className={cn("h-3.5 w-3.5", isDark ? "text-teal" : "text-navy")}
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
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Role & Permissions (EXACT MATCH WITH ROLES & PERMISSIONS PAGE) */}
        <TabsContent value="permissions" className="mt-0">
          <div
            className={cn(
              "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
              isDark
                ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Role & RBAC Security Permissions
                  </h3>
                  <p className={cn("text-[11px] font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                    Security capabilities authorized for {staff.full_name} under role: <span className="font-bold underline">{role?.name || staff.role}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold",
                    isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
                  )}
                >
                  {allowedPermissions.length} / {permissionCoverage.total} Allowed
                </Badge>
                <Link href="/admin/roles">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "rounded-xl text-xs font-bold border-2 h-8 px-2.5",
                      isDark
                        ? "border-teal/30 text-teal hover:bg-teal/20"
                        : "border-navy/20 text-navy hover:bg-teal-50"
                    )}
                  >
                    Manage Roles
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* If no permissions granted: SHOW NO PERMISSION CARDS */}
            {allowedPermissions.length === 0 ? (
              <div
                className={cn(
                  "py-12 text-center rounded-2xl border flex flex-col items-center justify-center p-6 space-y-2",
                  isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-white/80 border-navy/20"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-1",
                    isDark ? "bg-teal/20 text-teal" : "bg-navy/10 text-navy"
                  )}
                >
                  <Lock className="w-6 h-6" />
                </div>
                <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                  No Permissions Authorized
                </p>
                <p className={cn("text-xs max-w-sm", isDark ? "text-slate-400" : "text-navy/70")}>
                  This staff member has not been authorized with any security permissions in Roles & Permissions for {role?.name || staff.role}.
                </p>
              </div>
            ) : (
              /* If permissions exist: display cards matching selected permission cards in roles&permissions */
              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map((cat, catIdx) => {
                  const catPerms = allowedPermissions.filter(p => p.category === cat.category)
                  if (catPerms.length === 0) return null

                  return (
                    <div
                      key={catIdx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        isDark ? "bg-[#080d2a] border-slate-800" : "bg-slate-50/80 border-2 border-navy/15"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className={cn("font-black text-xs uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-white" : "text-navy")}>
                            <Sparkles className={cn("w-3.5 h-3.5", isDark ? "text-teal" : "text-navy")} />
                            {cat.category}
                          </h4>
                          <p className={cn("text-[10.5px] mt-0.5", isDark ? "text-slate-400" : "text-navy/60")}>
                            {cat.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                            isDark ? "bg-teal/15 text-teal border-teal/30" : "bg-navy text-white"
                          )}
                        >
                          {catPerms.length} Active
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {catPerms.map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              "p-2.5 rounded-xl border flex items-start gap-2.5 transition-all",
                              isDark
                                ? "bg-teal/15 border-teal/40 text-white"
                                : "bg-teal/15 border-2 border-navy text-navy"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all",
                              isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                            )}>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>

                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                                {p.name}
                              </p>
                              <p className={cn("text-[10px] line-clamp-1 leading-tight", isDark ? "text-slate-400" : "text-navy/60")}>
                                {p.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Branch Colleagues */}
        <TabsContent value="peers" className="mt-0">
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
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Colleagues at {staff.branch_name}
                  </h3>
                  <p className={cn("text-[11px] font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                    Staff assigned to the same operational branch ({peers.length} active peers)
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
                )}
              >
                {peers.length} Peers
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {peers.length === 0 ? (
                <div
                  className={cn(
                    "col-span-full py-8 text-center rounded-xl border text-xs font-medium",
                    isDark ? "bg-[#060a22]/70 border-teal/20 text-slate-400" : "bg-white/80 border-navy/20 text-navy/70"
                  )}
                >
                  No other staff members assigned to this branch.
                </div>
              ) : (
                peers.map(p => (
                  <Link
                    key={p.id}
                    href={`/admin/staff/${p.id}`}
                    className={cn(
                      "p-3.5 rounded-xl border flex items-center gap-3 transition-all hover:scale-[1.01] shadow-xs",
                      isDark
                        ? "bg-teal/15 border-teal/40 text-white hover:bg-teal/25"
                        : "bg-teal/15 border-2 border-navy text-navy hover:bg-teal/25"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
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
                    <div className="min-w-0 flex-1">
                      <p className={cn("font-bold text-xs truncate", isDark ? "text-white" : "text-navy font-black")}>
                        {p.full_name}
                      </p>
                      <p className={cn("text-[10px] truncate font-medium", isDark ? "text-teal-200/80" : "text-navy/70")}>
                        {p.role} • {p.staff_code}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

