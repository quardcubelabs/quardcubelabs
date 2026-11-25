"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardTelemetry, DashboardTelemetry, AdminOrder } from "@/lib/admin-actions"
import AdminLoading from "@/components/admin/admin-loading"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import { Button } from "@/components/ui/button"
import { DashboardDonutCard } from "@/components/admin/dashboard-donut-card"
import { DashboardConcentricCard } from "@/components/admin/dashboard-concentric-card"
import { formatCompactNumber, formatCompactCurrency } from "@/lib/admin-format"
import {
  ShoppingCart,
  Users,
  RotateCcw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronDown,
  Calendar,
  LayoutDashboard,
  Activity,
  Briefcase,
  FileText,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getRecentRealActivities, RealRecentActivity } from "@/lib/analytics-actions"

export default function AdminDashboard() {
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const [telemetry, setTelemetry] = useState<DashboardTelemetry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("this-week")
  const [activities, setActivities] = useState<RealRecentActivity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)

  useEffect(() => {
    let isMounted = true
    getRecentRealActivities(8)
      .then((data) => {
        if (isMounted) {
          setActivities(data)
          setIsLoadingActivities(false)
        }
      })
      .catch((err) => {
        console.error("Error loading dashboard activities:", err)
        if (isMounted) setIsLoadingActivities(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const data = await getDashboardTelemetry(timeRange)
        if (isMounted) {
          setTelemetry(data)
        }
      } catch (error) {
        console.error("Error fetching dashboard telemetry:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [timeRange])

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  const getDateRangeDisplay = (range: string = timeRange) => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    if (range === 'today') {
      return `Today, ${now.toLocaleDateString('en-US', options)}`
    }
    if (range === 'this-week') {
      const past = new Date(now.getTime() - 7 * 86400000)
      return `${past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', options)}`
    }
    if (range === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', options)}`
    }
    if (range === 'this-year') {
      return `Year ${now.getFullYear()}`
    }
    const past = new Date(now.getTime() - 30 * 86400000)
    return `${past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', options)}`
  }

  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const mins = Math.floor(diffMs / 60000)
      if (mins < 1) return 'Just now'
      if (mins < 60) return `${mins}m ago`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}d ago`
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  // Authoritative stat cards populated strictly from database telemetry
  const statCards = [
    {
      title: "Total Orders",
      value: formatStatNumber(telemetry?.stats.totalOrders || 0),
      change: telemetry?.stats.ordersDelta.change || "+0.0%",
      changeType: telemetry?.stats.ordersDelta.changeType || ("up" as const),
      lastMonth: formatStatNumber(telemetry?.stats.ordersDelta.lastMonth || 0),
      icon: ShoppingCart,
      color: "teal",
    },
    {
      title: "Active Customers",
      value: formatStatNumber(telemetry?.stats.activeCustomers || 0),
      change: telemetry?.stats.customersDelta.change || "+0.0%",
      changeType: telemetry?.stats.customersDelta.changeType || ("up" as const),
      lastMonth: formatStatNumber(telemetry?.stats.customersDelta.lastMonth || 0),
      icon: Users,
      color: "navy",
    },
    {
      title: "Pending Orders",
      value: formatStatNumber(telemetry?.stats.pendingOrders || 0),
      change: telemetry?.stats.pendingDelta.change || "0.0%",
      changeType: telemetry?.stats.pendingDelta.changeType || ("down" as const),
      lastMonth: formatStatNumber(telemetry?.stats.pendingDelta.lastMonth || 0),
      icon: RotateCcw,
      color: "yellow",
    },
    {
      title: "Total Revenue",
      value: formatStatCurrency(telemetry?.stats.totalRevenue || 0),
      change: telemetry?.stats.revenueDelta.change || "+0.0%",
      changeType: telemetry?.stats.revenueDelta.changeType || ("up" as const),
      lastMonth: formatStatCurrency(telemetry?.stats.revenueDelta.lastMonth || 0),
      icon: DollarSign,
      color: "teal",
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; bgColor: string; border: string }> = {
      pending: { color: "text-amber-400", bgColor: "bg-amber-400/15", border: "border-amber-400/30" },
      processing: { color: "text-teal-400", bgColor: "bg-teal-400/15", border: "border-teal-400/30" },
      completed: { color: "text-emerald-400", bgColor: "bg-emerald-400/15", border: "border-emerald-400/30" },
      cancelled: { color: "text-rose-400", bgColor: "bg-rose-400/15", border: "border-rose-400/30" },
    }
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending
    return (
      <span className={cn(
        "px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize",
        config.color, config.bgColor, config.border
      )}>
        {status}
      </span>
    )
  }

  const getItemsDescription = (items: any[]) => {
    if (!items || items.length === 0) return "No items"
    const firstItem = items[0]?.product_name || items[0]?.name || "Security Equipment"
    if (items.length === 1) return firstItem
    return `${firstItem}, +${items.length - 1} more`
  }

  // Orders sorted newest-first, straight from the database telemetry
  const recentOrders = useMemo(() => {
    const list = telemetry?.recentOrders || []
    return [...list].sort(
      (a: AdminOrder, b: AdminOrder) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [telemetry?.recentOrders])

  if (isLoading && !telemetry) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Card in Teal with round icon and functioning date dropdown */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <LayoutDashboard className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
                Sales <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>Overview</span>
              </h1>
              <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                Real-time business telemetry and operations overview
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0">
            <Select value={timeRange} onValueChange={(val) => setTimeRange(val)}>
              <SelectTrigger className="w-full sm:w-auto min-w-0 sm:min-w-[220px] bg-white border-2 border-navy/20 text-navy font-bold hover:bg-teal-50 shadow-sm rounded-xl py-2 px-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal shrink-0" />
                  <SelectValue placeholder="Select timeframe" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-navy/20 text-navy font-semibold rounded-xl shadow-xl">
                <SelectItem value="today">Today ({getDateRangeDisplay('today')})</SelectItem>
                <SelectItem value="this-week">This Week ({getDateRangeDisplay('this-week')})</SelectItem>
                <SelectItem value="this-month">This Month ({getDateRangeDisplay('this-month')})</SelectItem>
                <SelectItem value="this-year">This Year ({getDateRangeDisplay('this-year')})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index} 
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:shadow-lg" 
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
                  <span className={cn(
                    "text-[11px] font-bold flex items-center mt-1 truncate",
                    stat.changeType === 'up' ? "text-teal-500" : "text-brand-red"
                  )}>
                    {stat.changeType === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1 shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1 shrink-0" />
                    )}
                    {stat.change}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 group-hover:bg-navy/80"
                    : "bg-teal border-teal/40 group-hover:bg-teal/80"
                )}>
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "text-navy")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Donut Gauges Grid: Ratio Income, Fulfillment, and Combined Revenue & Settlement Concentric Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <DashboardDonutCard
          title="Ratio Income"
          hasData={telemetry?.donutMetrics?.ratioIncome?.hasData ?? false}
          percentage={telemetry?.donutMetrics?.ratioIncome?.percentage ?? 0}
          primaryLabel={telemetry?.donutMetrics?.ratioIncome?.primaryLabel ?? "Income"}
          primaryValue={formatCompactCurrency(telemetry?.donutMetrics?.ratioIncome?.income ?? 0)}
          primaryColor="#0284c7"
          secondaryLabel={telemetry?.donutMetrics?.ratioIncome?.secondaryLabel ?? "Expenses"}
          secondaryValue={formatCompactCurrency(telemetry?.donutMetrics?.ratioIncome?.expenses ?? 0)}
          secondaryColor="#f43f5e"
          gradientId="gradientRatioIncome"
          gradientFrom="#f43f5e"
          gradientTo="#0284c7"
          thumbColor="#0284c7"
          subtitle="Net earnings ratio"
        />

        <DashboardDonutCard
          title="Order Fulfillment"
          hasData={telemetry?.donutMetrics?.orderFulfillment?.hasData ?? false}
          percentage={telemetry?.donutMetrics?.orderFulfillment?.percentage ?? 0}
          primaryLabel={telemetry?.donutMetrics?.orderFulfillment?.primaryLabel ?? "Fulfilled"}
          primaryValue={`${telemetry?.donutMetrics?.orderFulfillment?.completed ?? 0} Orders`}
          primaryColor="#10b981"
          secondaryLabel={telemetry?.donutMetrics?.orderFulfillment?.secondaryLabel ?? "Pending"}
          secondaryValue={`${telemetry?.donutMetrics?.orderFulfillment?.pending ?? 0} Orders`}
          secondaryColor="#f59e0b"
          gradientId="gradientOrderFulfillment"
          gradientFrom="#f59e0b"
          gradientTo="#10b981"
          thumbColor="#10b981"
          subtitle="Delivery completion"
        />

        {/* Combined Revenue Mix & Statement/Settlement Ratio Concentric Card */}
        <DashboardConcentricCard
          className="sm:col-span-2 lg:col-span-2"
          title="Revenue & Settlement Summary"
          hasData={(telemetry?.donutMetrics?.revenueMix?.hasData || telemetry?.donutMetrics?.settlementRatio?.hasData) ?? false}
          mainLabel="Gross Invoiced & Settled"
          mainValue={formatCompactCurrency(
            ((telemetry?.donutMetrics?.revenueMix?.products ?? 0) + (telemetry?.donutMetrics?.revenueMix?.services ?? 0)) ||
            (telemetry?.stats?.totalRevenue ?? 0)
          )}
          growthBadge={telemetry?.donutMetrics?.ratioIncome?.hasData ? `+${Math.round((telemetry.donutMetrics.ratioIncome.percentage || 0) / 2)}%` : undefined}
          footerNote="Synchronized live with active date range & fiscal ledger"
          rings={[
            {
              label: "Products Revenue",
              value: formatCompactCurrency(telemetry?.donutMetrics?.revenueMix?.products ?? 0),
              percentage: telemetry?.donutMetrics?.revenueMix?.percentage ?? 0,
              color: "#10b981",
            },
            {
              label: "Services Revenue",
              value: formatCompactCurrency(telemetry?.donutMetrics?.revenueMix?.services ?? 0),
              percentage: telemetry?.donutMetrics?.revenueMix?.hasData ? Math.max(0, 100 - (telemetry?.donutMetrics?.revenueMix?.percentage ?? 0)) : 0,
              color: "#f97316",
            },
            {
              label: "Settled Cash Ratio",
              value: formatCompactCurrency(telemetry?.donutMetrics?.settlementRatio?.settled ?? 0),
              percentage: telemetry?.donutMetrics?.settlementRatio?.percentage ?? 0,
              color: "#3b82f6",
            },
          ]}
        />
      </div>

      {/* 2-Column Section: Recent Orders & Recent System Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Recent Orders */}
        <Card className={cn(
          "rounded-2xl transition-all duration-300 flex flex-col",
          isDark 
            ? "bg-[#0a1033] border-none shadow-lg" 
            : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2.5", isDark ? "text-white" : "text-navy")}>
                  <CardTitleIcon icon={ShoppingCart} isDark={isDark} />
                  Recent Orders
                </CardTitle>
                <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Latest client transactions and store orders
                </p>
              </div>
              <Button
                onClick={() => router.push('/admin/orders')}
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs font-bold rounded-xl border-2 px-2.5 shrink-0",
                  isDark ? "border-teal/30 text-teal-300 hover:bg-teal-500/10" : "border-navy/20 text-navy hover:bg-teal-50"
                )}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 flex-1">
            <div className="space-y-2.5">
              {recentOrders.length > 0 ? (
                recentOrders.slice(0, 6).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => router.push('/admin/orders')}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                      isDark
                        ? "bg-white/5 border-l-4 border-l-teal-400 border-teal/10 hover:bg-teal-400/10 hover:border-teal/30"
                        : "bg-teal-50 border-l-4 border-l-teal-500 border-teal/20 hover:bg-teal-100/70 hover:border-teal/40"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border mt-0.5",
                      isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                    )}>
                      <ShoppingCart className="h-3.5 w-3.5 text-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-navy")}>
                          #{order.order_number || order.id.slice(0, 8)} - {order.customer_name || 'Customer'}
                        </h4>
                        <span className={cn("text-[10px] font-semibold shrink-0", isDark ? "text-teal-400/80" : "text-navy/60")}>
                          {formatTimeAgo(order.created_at)}
                        </span>
                      </div>
                      <p className={cn("text-[11px] font-medium truncate mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                        TSH {Number(order.total || 0).toLocaleString()} · <span className="capitalize">{order.status}</span> · {getItemsDescription(order.items)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-navy/60 font-medium">
                  {isLoading ? "Loading orders from database..." : "No orders found"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Recent Activity */}
        <Card className={cn(
          "rounded-2xl transition-all duration-300 flex flex-col",
          isDark 
            ? "bg-[#0a1033] border-none shadow-lg" 
            : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2.5", isDark ? "text-white" : "text-navy")}>
                  <CardTitleIcon icon={Activity} isDark={isDark} />
                  Recent System Activity
                </CardTitle>
                <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Live platform operations, client actions & audit events
                </p>
              </div>
              <Button 
                onClick={() => router.push('/admin/analytics')} 
                variant="outline" 
                size="sm"
                className={cn(
                  "h-8 text-xs font-bold rounded-xl border-2 px-2.5 shrink-0",
                  isDark ? "border-teal/30 text-teal-300 hover:bg-teal-500/10" : "border-navy/20 text-navy hover:bg-teal-50"
                )}
              >
                Analytics
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 flex-1">
            <div className="space-y-2.5">
              {activities.length > 0 ? (
                activities.slice(0, 6).map((activity, index) => {
                  const iconMap: Record<string, any> = {
                    order: ShoppingCart,
                    user: Users,
                    application: Briefcase,
                    blog: FileText,
                    quote: DollarSign,
                    system: Activity,
                  }
                  const Icon = iconMap[activity.type] || Activity
                  const isNavy = activity.theme === 'navy'

                  return (
                    <div 
                      key={index}
                      onClick={() => {
                        if (activity.type === 'order') router.push('/admin/orders')
                        else if (activity.type === 'user') router.push('/admin/users')
                        else if (activity.type === 'application') router.push('/admin/applications')
                        else if (activity.type === 'blog') router.push('/admin/blogs')
                        else if (activity.type === 'quote') router.push('/admin/quotations')
                        else router.push('/admin/reports')
                      }}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer",
                        isNavy 
                          ? isDark 
                            ? "bg-white/5 border-l-4 border-l-teal-400 border-teal/10 hover:bg-teal-400/10 hover:border-teal/30" 
                            : "bg-navy/5 border-l-4 border-l-navy border-navy/10 hover:bg-navy/10 hover:border-navy/25" 
                          : isDark 
                            ? "bg-teal-400/10 border-l-4 border-l-teal-400 border-teal/20 hover:bg-teal-400/20 hover:border-teal/40" 
                            : "bg-teal-50 border-l-4 border-l-teal-500 border-teal/20 hover:bg-teal-100/70 hover:border-teal/40"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border mt-0.5",
                        isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                      )}>
                        <Icon className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-navy")}>
                            {activity.title}
                          </h4>
                          <span className={cn("text-[10px] font-semibold shrink-0", isDark ? "text-teal-400/80" : "text-navy/60")}>
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className={cn("text-[11px] font-medium truncate mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-6 text-center text-xs text-navy/60 font-medium">
                  {isLoadingActivities ? "Loading activity stream..." : "System Operational - All services running normally"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
