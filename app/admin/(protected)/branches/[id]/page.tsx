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
  AreaChart,
  Area,
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
import { getBranchDetail } from "@/lib/detail-actions"
import type { BranchDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Boxes,
  CheckCircle2,
  Calendar,
  Activity,
  UserCheck,
  FileText,
  Warehouse as WarehouseIcon,
  Crown,
  Sparkles,
} from "lucide-react"

interface BranchDetailPageProps {
  params: Promise<{ id: string }>
}

const comparisonChartConfig: ChartConfig = {
  daily_sales: {
    label: "Daily Sales (TSH)",
    color: "#40E0D0",
  },
}

export default function BranchDetailPage({ params }: BranchDetailPageProps) {
  const resolvedParams = use(params)
  const branchId = resolvedParams.id
  const router = useRouter()
  const { isDark } = useAdminTheme()

  const [data, setData] = useState<BranchDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await getBranchDetail(branchId)
        if (mounted) setData(res)
      } catch (err) {
        console.error("Failed to load branch details:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [branchId])

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
            <Building2 className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Branch Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No branch outlet matches "{branchId}". It may have been closed or removed.
          </p>
          <Link href="/admin/branches">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Branch Network
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { branch, staff, roleDistribution, comparison, rank, share, metrics, warehouses, activity } = data

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
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {branch.name} <span className={cn(isDark ? "text-teal" : "text-white drop-shadow-sm")}>Outlet</span>
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  {branch.code}
                </Badge>
                {branch.is_main && (
                  <Badge className="bg-amber-500 text-white font-black text-xs uppercase px-2 py-0.5">
                    Main HQ
                  </Badge>
                )}
                <Badge className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                  branch.is_active ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {branch.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-300" : "text-navy/80")}>
                {branch.address}, {branch.city}, {branch.region} • Managed by {branch.manager_name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/branches">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Branches</span>
              </Button>
            </Link>

            <a href={`mailto:${branch.email}`}>
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

            <a href={`tel:${branch.phone}`}>
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
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Daily Sales Run-rate", value: `TSH ${Number(branch.daily_sales).toLocaleString()}`, icon: TrendingUp },
          { title: "Inventory Valuation", value: `TSH ${Number(branch.inventory_val).toLocaleString()}`, icon: Package },
          { title: "Staff Roster", value: `${staff.length} Active`, icon: Users },
          { title: "Productivity / Staff", value: `TSH ${Math.round(metrics.salesPerStaff).toLocaleString()}`, icon: DollarSign },
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
        {/* Branch Network Benchmark (2 cols) */}
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
                    Network Sales Performance Benchmark
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comparing daily revenue across QuardCube branch network
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
                {share.sales.toFixed(1)}% of total
              </Badge>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ChartContainer config={comparisonChartConfig} className="h-full w-full">
                <BarChart
                  data={comparison}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
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
                  <Bar dataKey="daily_sales" radius={[8, 8, 0, 0]}>
                    {comparison.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isCurrent
                            ? isDark
                              ? "#40E0D0"
                              : "#000080"
                            : isDark
                            ? "rgba(64, 224, 208, 0.3)"
                            : "rgba(0, 0, 128, 0.2)"
                        }
                      />
                    ))}
                  </Bar>
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
            <span>Highlighted bar represents this branch</span>
            <span>Annualised Run-rate: TSH {(metrics.annualisedSales / 1_000_000).toFixed(1)}M</span>
          </div>
        </Card>

        {/* Staff Role Distribution (1 col) */}
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
                <Users className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black">
                  Staff Role Mix
                </CardTitle>
                <CardDescription className="text-xs">
                  Operational roles stationed at this branch
                </CardDescription>
              </div>
            </div>

            {roleDistribution.length > 0 ? (
              <div className="h-56 sm:h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} staff`, name]}
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
                <Users className="h-8 w-8 mb-2 opacity-40" />
                No staff stationed here
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-navy/10 dark:border-teal/10">
            {roleDistribution.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="font-semibold truncate max-w-[140px]">{r.name}</span>
                </div>
                <span className="font-mono font-bold opacity-80">{r.value} staff</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="staff" className="space-y-0">
        <TabsList className="mb-0">
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 shrink-0" />
            <span>Branch Staff ({staff.length})</span>
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <WarehouseIcon className="h-4 w-4 shrink-0" />
            <span>Regional Warehouses ({warehouses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 shrink-0" />
            <span>Branch Audit Activity ({activity.total})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Staff */}
        <TabsContent value="staff" className="mt-0">
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
                <Users className="h-5 w-5 text-teal" />
                Staff Assigned to {branch.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time active headcount stationed at this facility
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Staff Member</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Role</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Contact</th>
                      <th className="text-center py-3.5 px-3 md:px-4">Status</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {staff.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No staff members assigned to this branch yet.
                        </td>
                      </tr>
                    ) : (
                      staff.map(s => (
                        <tr
                          key={s.id}
                          className={cn(
                            "border-b transition-colors cursor-pointer group",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-bold whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border font-black",
                                  isDark
                                    ? "bg-navy text-teal border-teal/30"
                                    : "bg-teal text-navy border-teal/40"
                                )}
                              >
                                {s.full_name
                                  .split(" ")
                                  .map(p => p[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <p className="font-bold text-xs">{s.full_name}</p>
                                <p className="text-[10px] font-mono opacity-60">
                                  {s.staff_code}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:px-4 capitalize font-semibold">
                            {s.role.replace("_", " ")}
                          </td>
                          <td className="py-3 px-3 md:px-4">
                            <p className="truncate max-w-xs">{s.email}</p>
                            <p className="text-[10px] opacity-70">{s.phone}</p>
                          </td>
                          <td className="py-3 px-3 md:px-4 text-center">
                            <Badge
                              className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5",
                                s.status === "active"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-500 text-white"
                              )}
                            >
                              {s.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right">
                            <Link href={`/admin/staff/${s.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className={cn(
                                  "rounded-xl text-xs font-bold border",
                                  isDark
                                    ? "border-teal/30 text-teal hover:bg-teal/20"
                                    : "border-navy/20 text-navy hover:bg-teal-50"
                                )}
                              >
                                View Profile
                              </Button>
                            </Link>
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

        {/* Tab 2: Warehouses */}
        <TabsContent value="warehouses" className="mt-0">
          <Card
            className={cn(
              "rounded-3xl border-2 p-6 shadow-lg space-y-4",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <div>
              <h3 className="text-lg font-black flex items-center gap-2">
                <WarehouseIcon className="h-5 w-5 text-teal" />
                Warehouses Serving {branch.city}
              </h3>
              <p className="text-xs opacity-75">
                Supply chain storage facilities mapped to this branch region
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {warehouses.length === 0 ? (
                <p className="col-span-full text-center py-8 text-xs opacity-60">
                  No regional warehouses currently assigned to {branch.city}.
                </p>
              ) : (
                warehouses.map(w => (
                  <div
                    key={w.id}
                    className={cn(
                      "p-4 rounded-2xl border-2 space-y-2",
                      isDark
                        ? "bg-[#0c1833] border-teal/20 text-white"
                        : "bg-white border-navy/15 text-navy shadow-xs"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{w.name}</p>
                      <Badge variant="outline" className="font-mono text-[10px] font-bold">
                        {w.code}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-75">{w.address}</p>
                    <div className="pt-2 border-t border-navy/10 dark:border-teal/10 flex items-center justify-between text-xs font-semibold">
                      <span>Manager: {w.manager_name || "Assigned"}</span>
                      <span className="font-mono font-bold text-teal">
                        {w.city}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Activity */}
        <TabsContent value="activity" className="mt-0">
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
                Branch Team Operational Ledger
              </CardTitle>
              <CardDescription className="text-xs">
                Audited activities logged by staff members stationed at this branch
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Staff Member</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Module</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Action</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Details</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {activity.recent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No audit entries logged by branch staff yet.
                        </td>
                      </tr>
                    ) : (
                      activity.recent.map(l => (
                        <tr
                          key={l.id}
                          className={cn(
                            "border-b transition-colors cursor-pointer group",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-bold whitespace-nowrap">
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
                              <span className="font-bold text-xs">{l.user_name}</span>
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
      </Tabs>
    </div>
  )
}
