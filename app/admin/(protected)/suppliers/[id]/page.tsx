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
import { getSupplierDetail } from "@/lib/detail-actions"
import type { SupplierDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  DollarSign,
  PackageCheck,
  Receipt,
  FileText,
  Clock,
  TrendingUp,
  Tag,
  CheckCircle2,
  Boxes,
  ExternalLink,
} from "lucide-react"

const spendChartConfig: ChartConfig = {
  ordered: {
    label: "Ordered (TSH)",
    color: "#000080",
  },
  paid: {
    label: "Paid (TSH)",
    color: "#40E0D0",
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

function formatDate(val: any): string {
  if (!val) return "—"
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
  } catch {
    return "—"
  }
}

export default function SupplierDetailPage() {
  const routeParams = useParams()
  const supplierId = (routeParams?.id as string) || ""
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const [mounted, setMounted] = useState(false)

  const [data, setData] = useState<SupplierDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Spend vs Settlement timeframe and date selectors
  const [timeframe, setTimeframe] = useState<"12months" | "30days" | "week">("12months")
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const day = new Date().getDate()
    return Math.min(5, Math.max(1, Math.ceil(day / 7)))
  })

  useEffect(() => {
    if (!supplierId) return
    let isCancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const res = await getSupplierDetail(supplierId)
        if (!isCancelled) setData(res)
      } catch (err) {
        console.error("Failed to load supplier details:", err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [supplierId])

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
          <h2 className="text-2xl font-black mb-2">Supplier Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No vendor profile matches "{supplierId}".
          </p>
          <Link href="/admin/suppliers">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Supplier Directory
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const supplier = data?.supplier || {
    id: supplierId,
    supplier_code: supplierId,
    name: "Supplier",
    company_name: "",
    email: "",
    phone: "",
    city: "Dar es Salaam",
    country: "Tanzania",
    payment_terms: "Net 30",
    status: "active",
  }
  const orders = data?.orders || []
  const receipts = data?.receipts || []
  const expenses = data?.expenses || []
  const totals = data?.totals || {
    orderCount: 0,
    totalSpend: 0,
    totalPaid: 0,
    outstanding: 0,
    averageOrderValue: 0,
    fulfilmentRate: 0,
    expenseTotal: 0,
    spendShare: 0,
    spendRank: 1,
    supplierCount: 1,
    paymentRate: 0,
  }
  const monthly = data?.monthly || []
  const statusDistribution = data?.statusDistribution || []
  const topProducts = data?.topProducts || []

  const PIE_COLORS = isDark
    ? ["#40E0D0", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399"]
    : ["#000080", "#0891b2", "#2563eb", "#7c3aed", "#059669", "#d97706"]

  // Dynamic Chart Data based on user selection (12months: Jan-Dec, 30days: 1-30, week: 7 days)
  const chartData = useMemo(() => {
    if (!data) return []
    const ordersList = orders || []

    if (timeframe === "12months") {
      // 12 Months: January to December of selectedYear
      const result = MONTH_SHORT.map((short, idx) => ({
        key: `month-${idx}`,
        label: short,
        fullLabel: `${MONTH_NAMES[idx]} ${selectedYear}`,
        ordered: 0,
        paid: 0,
        orders: 0,
      }))

      ordersList.forEach(o => {
        if (o.status === "cancelled" || o.status === "draft") return
        const dt = new Date(o.order_date || o.created_at)
        if (isNaN(dt.getTime())) return

        if (dt.getFullYear() === selectedYear) {
          const mIdx = dt.getMonth()
          if (mIdx >= 0 && mIdx < 12) {
            result[mIdx].ordered += Number(o.total) || 0
            result[mIdx].paid += Number(o.amount_paid) || 0
            result[mIdx].orders += 1
          }
        }
      })

      return result
    }

    interface SpendBarItem {
      key: string
      label: string
      fullLabel: string
      ordered: number
      paid: number
      orders: number
      dayNum?: number
      monthIdx?: number
      year?: number
    }

    if (timeframe === "30days") {
      // 30 Days of that specific month (Days 01 to 30)
      const result: SpendBarItem[] = []
      for (let d = 1; d <= 30; d++) {
        const pad = String(d).padStart(2, "0")
        result.push({
          key: `day-${d}`,
          label: pad,
          fullLabel: `${d} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
          ordered: 0,
          paid: 0,
          orders: 0,
        })
      }

      ordersList.forEach(o => {
        if (o.status === "cancelled" || o.status === "draft") return
        const dt = new Date(o.order_date || o.created_at)
        if (isNaN(dt.getTime())) return

        if (dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth) {
          const day = dt.getDate()
          if (day >= 1 && day <= 30) {
            result[day - 1].ordered += Number(o.total) || 0
            result[day - 1].paid += Number(o.amount_paid) || 0
            result[day - 1].orders += 1
          }
        }
      })

      return result
    }

    if (timeframe === "week") {
      // 7 Days of that week of the particular month
      const startDay = (selectedWeek - 1) * 7 + 1
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const result: SpendBarItem[] = []

      for (let offset = 0; offset < 7; offset++) {
        const dNum = startDay + offset
        if (dNum <= daysInMonth) {
          const dt = new Date(selectedYear, selectedMonth, dNum)
          const dayName = DAY_NAMES[dt.getDay()]
          result.push({
            key: `week-${dNum}`,
            label: `${dayName} ${dNum}`,
            dayNum: dNum,
            monthIdx: selectedMonth,
            year: selectedYear,
            fullLabel: `${dayName}, ${dNum} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
            ordered: 0,
            paid: 0,
            orders: 0,
          })
        } else {
          const overflow = dNum - daysInMonth
          const nextMonth = (selectedMonth + 1) % 12
          const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
          const dt = new Date(nextYear, nextMonth, overflow)
          const dayName = DAY_NAMES[dt.getDay()]
          result.push({
            key: `week-${dNum}`,
            label: `${dayName} ${overflow}`,
            dayNum: overflow,
            monthIdx: nextMonth,
            year: nextYear,
            fullLabel: `${dayName}, ${overflow} ${MONTH_NAMES[nextMonth]} ${nextYear}`,
            ordered: 0,
            paid: 0,
            orders: 0,
          })
        }
      }

      ordersList.forEach(o => {
        if (o.status === "cancelled" || o.status === "draft") return
        const dt = new Date(o.order_date || o.created_at)
        if (isNaN(dt.getTime())) return
        const oYear = dt.getFullYear()
        const oMonth = dt.getMonth()
        const oDay = dt.getDate()

        const match = result.find(r => r.year === oYear && r.monthIdx === oMonth && r.dayNum === oDay)
        if (match) {
          match.ordered += Number(o.total) || 0
          match.paid += Number(o.amount_paid) || 0
          match.orders += 1
        }
      })

      return result
    }

    return []
  }, [data, orders, timeframe, selectedYear, selectedMonth, selectedWeek])

  const periodOrderedTotal = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.ordered || 0), 0),
    [chartData]
  )
  const periodPaidTotal = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.paid || 0), 0),
    [chartData]
  )

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
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {supplier.name} <span className={cn(isDark ? "text-teal" : "text-white drop-shadow-sm")}>Ledger</span>
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  {supplier.supplier_code}
                </Badge>
                <Badge className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                  supplier.status === "active" ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {supplier.status} Vendor
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-300" : "text-navy/80")}>
                {supplier.company_name || supplier.name} • {supplier.city || "Dar es Salaam"}, {supplier.country || "Tanzania"} • Terms: {supplier.payment_terms || "Net 30"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/suppliers">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Suppliers</span>
              </Button>
            </Link>

            {supplier.email && (
              <a href={`mailto:${supplier.email}`}>
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
            )}

            {supplier.phone && (
              <a href={`tel:${supplier.phone}`}>
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
            )}

            <Link href={`/admin/purchases?supplier=${supplier.id}`}>
              <Button
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2",
                  isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                )}
              >
                <Truck className="w-4 h-4" />
                <span>New PO</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Total Procurement Spend", value: `TSH ${Number(totals?.totalSpend || 0).toLocaleString()}`, icon: TrendingUp },
          { title: "Amount Settled", value: `TSH ${Number(totals?.totalPaid || 0).toLocaleString()}`, icon: CheckCircle2 },
          { title: "Payable Outstanding", value: `TSH ${Number(totals?.outstanding || 0).toLocaleString()}`, icon: DollarSign },
          { title: "Order Fulfilment Rate", value: `${Number(totals?.fulfilmentRate || 0).toFixed(0)}% (${totals?.orderCount || 0} POs)`, icon: PackageCheck },
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
        {/* Spend vs Settlement Bar Chart (2 cols) */}
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
                    {timeframe === "12months" && "Spend vs Settlement (Jan – Dec)"}
                    {timeframe === "30days" && `30-Day Spend vs Settlement (${MONTH_NAMES[selectedMonth]} ${selectedYear})`}
                    {timeframe === "week" && `Weekly Spend vs Settlement (Week ${selectedWeek} • ${MONTH_NAMES[selectedMonth]} ${selectedYear})`}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {timeframe === "12months" && `January to December procurement expenditure and completed payouts to ${supplier.name}`}
                    {timeframe === "30days" && `Daily breakdown across 30 days of ${MONTH_NAMES[selectedMonth]} ${selectedYear} for ${supplier.name}`}
                    {timeframe === "week" && `7-day breakdown of Week ${selectedWeek} in ${MONTH_NAMES[selectedMonth]} ${selectedYear} for ${supplier.name}`}
                  </CardDescription>
                </div>
              </div>

              {/* Top right corner: Flexible controls & Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {/* Specific Month Selector when in 30days or week view */}
                {timeframe !== "12months" && (
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(val) => setSelectedMonth(Number(val))}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 text-xs font-semibold rounded-lg w-[115px] border shadow-xs transition-colors",
                        isDark
                          ? "bg-[#070c24] border-teal/30 text-teal hover:border-teal/60"
                          : "bg-slate-50 border-navy/20 text-navy hover:border-navy/50"
                      )}
                    >
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20"}>
                      {MONTH_NAMES.map((m, idx) => (
                        <SelectItem key={m} value={String(idx)} className="text-xs">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Specific Week Selector when in week view */}
                {timeframe === "week" && (
                  <Select
                    value={String(selectedWeek)}
                    onValueChange={(val) => setSelectedWeek(Number(val))}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 text-xs font-semibold rounded-lg w-[100px] border shadow-xs transition-colors",
                        isDark
                          ? "bg-[#070c24] border-teal/30 text-teal hover:border-teal/60"
                          : "bg-slate-50 border-navy/20 text-navy hover:border-navy/50"
                      )}
                    >
                      <SelectValue placeholder="Week" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20"}>
                      <SelectItem value="1" className="text-xs">Week 1 (1–7)</SelectItem>
                      <SelectItem value="2" className="text-xs">Week 2 (8–14)</SelectItem>
                      <SelectItem value="3" className="text-xs">Week 3 (15–21)</SelectItem>
                      <SelectItem value="4" className="text-xs">Week 4 (22–28)</SelectItem>
                      <SelectItem value="5" className="text-xs">Week 5 (29–End)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {/* Primary Dropdown: 12months, 30days, week */}
                <Select
                  value={timeframe}
                  onValueChange={(val: "12months" | "30days" | "week") => setTimeframe(val)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 text-xs font-bold rounded-lg w-[115px] border shadow-xs transition-colors",
                      isDark
                        ? "bg-[#0b132b] border-teal/40 text-teal hover:border-teal"
                        : "bg-white border-navy/30 text-navy hover:border-navy"
                    )}
                  >
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20"}>
                    <SelectItem value="12months" className="text-xs font-semibold">
                      12 Months
                    </SelectItem>
                    <SelectItem value="30days" className="text-xs font-semibold">
                      30 Days
                    </SelectItem>
                    <SelectItem value="week" className="text-xs font-semibold">
                      Week
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold hidden xl:inline-flex",
                    isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                  )}
                >
                  Avg PO: TSH {(Number(totals?.averageOrderValue || 0) / 1_000_000).toFixed(1)}M
                </Badge>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              {mounted ? (
                <ChartContainer config={spendChartConfig} className="h-full w-full">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    barGap={timeframe === "30days" ? 1 : 4}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "rgba(64, 224, 208, 0.1)" : "rgba(0, 0, 128, 0.08)"}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={timeframe === "30days" ? 10 : 11}
                      tickLine={false}
                      interval={timeframe === "30days" ? "preserveStartEnd" : 0}
                    />
                    <YAxis
                      stroke={isDark ? "#94a3b8" : "#64748b"}
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={v => {
                        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
                        return `${v}`
                      }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(_, payload) => {
                            const item = payload?.[0]?.payload
                            return item?.fullLabel || item?.label || "Period"
                          }}
                        />
                      }
                    />
                    <Bar
                      dataKey="ordered"
                      name="Ordered"
                      fill={isDark ? "#38bdf8" : "#000080"}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={timeframe === "30days" ? 10 : 36}
                    />
                    <Bar
                      dataKey="paid"
                      name="Paid"
                      fill={isDark ? "#40E0D0" : "#0d9488"}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={timeframe === "30days" ? 10 : 36}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs opacity-50">
                  Loading telemetry...
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-85",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <div className="flex items-center gap-3">
              <span>
                Period Ordered:{" "}
                <strong className={isDark ? "text-sky-400" : "text-navy"}>
                  TSH {periodOrderedTotal.toLocaleString()}
                </strong>
              </span>
              <span>•</span>
              <span>
                Period Settled:{" "}
                <strong className={isDark ? "text-teal" : "text-teal-600"}>
                  TSH {periodPaidTotal.toLocaleString()}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Procurement Share: {Number(totals?.spendShare || 0).toFixed(1)}%</span>
              <span>Total Orders: {totals?.orderCount || 0}</span>
            </div>
          </div>
        </Card>

        {/* Top Procured Products (1 col) */}
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
                <Boxes className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black">
                  Top Procured SKUs
                </CardTitle>
                <CardDescription className="text-xs">
                  Highest volume items sourced from vendor
                </CardDescription>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {topProducts.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center opacity-60 text-xs">
                  <Boxes className="h-8 w-8 mb-2 opacity-40" />
                  No line items cataloged yet
                </div>
              ) : (
                topProducts.map((p, i) => (
                  <div
                    key={p.name}
                    className={cn(
                      "p-3 rounded-2xl border flex items-center justify-between text-xs",
                      isDark ? "bg-[#0c1833] border-teal/15" : "bg-teal-50/50 border-navy/10"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold truncate">{p.name}</p>
                      <p className="text-[10px] opacity-70 font-mono">
                        {p.quantity} Units supplied
                      </p>
                    </div>
                    <span className="font-mono font-black text-xs shrink-0">
                      TSH {Math.round(p.spend).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-navy/10 dark:border-teal/10 text-xs opacity-75">
            <span>Direct expenses linked: TSH {Number(totals?.expenseTotal || 0).toLocaleString()}</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" className="group">
            <Truck className="h-4 w-4 shrink-0 transition-colors group-data-[state=active]:text-white" />
            <span>Purchase Orders</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {orders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="receipts" className="group">
            <PackageCheck className="h-4 w-4 shrink-0 transition-colors group-data-[state=active]:text-white" />
            <span>Goods Received Notes</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {receipts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="group">
            <DollarSign className="h-4 w-4 shrink-0 transition-colors group-data-[state=active]:text-white" />
            <span>Linked Direct Expenses</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {expenses.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Orders */}
        <TabsContent value="orders" className="mt-0">
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
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-sm sm:text-base font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Purchase Orders Issued to {supplier.name}
                  </h3>
                  <p className={cn("text-[11px] sm:text-xs font-medium leading-tight mt-0.5", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    Historical purchase commitments, invoices, and delivery fulfillment
                  </p>
                </div>
              </div>
              <Badge className={cn("font-bold text-xs uppercase", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                {orders.length} Orders
              </Badge>
            </div>

            <div className={cn(
              "rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs",
              isDark ? "bg-[#060a22]/85 border-teal/40" : "bg-white border-2 border-navy"
            )}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">PO Number</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Warehouse</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Total (TSH)</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Paid</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Balance</th>
                      <th className="text-center py-3.5 px-3 md:px-4">Status</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No purchase orders issued to this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map(o => (
                        <tr
                          key={o.id}
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
                                <Truck
                                  className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
                                  isDark ? "text-teal-400" : "text-navy"
                                )}
                              >
                                #{o.po_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:px-4">{o.warehouse_name || "Main Depot"}</td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-black">
                            TSH {Number(o.total || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono text-emerald-500 font-bold">
                            TSH {Number(o.amount_paid || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-bold">
                            TSH {Number(o.balance_due || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-center">
                            <Badge
                              className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5",
                                o.status === "received"
                                  ? "bg-emerald-500 text-white"
                                  : o.status === "partially_received"
                                  ? "bg-blue-500 text-white"
                                  : o.status === "ordered"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-500 text-white"
                              )}
                            >
                              {(o.status || "").replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap font-mono opacity-75">
                            {formatDate(o.order_date || o.created_at)}
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

        {/* Tab 2: Receipts */}
        <TabsContent value="receipts" className="mt-0">
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
                  <PackageCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-sm sm:text-base font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Goods Receiving Notes (GRNs)
                  </h3>
                  <p className={cn("text-[11px] sm:text-xs font-medium leading-tight mt-0.5", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    Physical shipments verified at QuardCube warehouse facilities
                  </p>
                </div>
              </div>
              <Badge className={cn("font-bold text-xs uppercase", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                {receipts.length} GRNs
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
              {receipts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-xs font-semibold opacity-70">
                  No GRN inspection records archived for this vendor.
                </div>
              ) : (
                receipts.map(r => (
                  <div
                    key={r.id}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex flex-col justify-between gap-3 transition-all duration-200 hover:scale-[1.01] group cursor-pointer",
                      isDark
                        ? "bg-[#060a22]/85 border-teal/40 hover:border-teal text-white shadow-xs"
                        : "bg-white border-2 border-navy text-navy shadow-xs hover:border-navy"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs text-teal">
                          #{r.grn_number}
                        </span>
                        <Badge className="bg-emerald-500 text-white font-black text-[10px] uppercase">
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold leading-tight">PO Reference: #{r.po_number}</p>
                    </div>

                    <div className={cn(
                      "pt-2 border-t flex items-center justify-between text-[11px] font-medium opacity-80",
                      isDark ? "border-teal/20 text-slate-300" : "border-navy/15 text-navy/70"
                    )}>
                      <span>Warehouse: {r.warehouse_name || "Main Depot"}</span>
                      <span className="font-mono">{formatDate(r.receipt_date || r.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Expenses */}
        <TabsContent value="expenses" className="mt-0">
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
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-sm sm:text-base font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Disbursements & Direct Expenses
                  </h3>
                  <p className={cn("text-[11px] sm:text-xs font-medium leading-tight mt-0.5", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    Business vouchers billed directly against this vendor
                  </p>
                </div>
              </div>
              <Badge className={cn("font-bold text-xs uppercase", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                {expenses.length} Vouchers
              </Badge>
            </div>

            <div className={cn(
              "rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs",
              isDark ? "bg-[#060a22]/85 border-teal/40" : "bg-white border-2 border-navy"
            )}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Voucher #</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Title / Description</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Category</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Amount (TSH)</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {expenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No direct expense vouchers recorded for this supplier.
                        </td>
                      </tr>
                    ) : (
                      expenses.map(e => (
                        <tr
                          key={e.id}
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
                                <DollarSign
                                  className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
                                  isDark ? "text-teal-400" : "text-navy"
                                )}
                              >
                                #{e.expense_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:px-4">{e.title || e.description}</td>
                          <td className="py-3 px-3 md:px-4 font-semibold">{e.category}</td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-black">
                            TSH {Number(e.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap font-mono opacity-75">
                            {formatDate(e.expense_date || e.created_at)}
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
      </Tabs>
    </div>
  )
}
