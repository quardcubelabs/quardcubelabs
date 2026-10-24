"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getDashboardTelemetry, DashboardTelemetry, AdminOrder } from "@/lib/admin-actions"
import AdminLoading from "@/components/admin/admin-loading"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ShoppingCart,
  Users,
  RotateCcw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
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
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest")
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getItemsDescription = (items: any[]) => {
    if (!items || items.length === 0) return "No items"
    const firstItem = items[0]?.product_name || items[0]?.name || "Security Equipment"
    if (items.length === 1) return firstItem
    return `${firstItem}, +${items.length - 1} more`
  }

  // Processed and sorted orders list
  const filteredOrders = useMemo(() => {
    const list = telemetry?.recentOrders || []
    return list
      .filter((order: AdminOrder) => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
          order.order_number?.toLowerCase().includes(q) ||
          order.customer_name?.toLowerCase().includes(q) ||
          order.customer_email?.toLowerCase().includes(q) ||
          order.items?.some(i => (i.product_name || i.name || '').toLowerCase().includes(q))
        )
      })
      .sort((a: AdminOrder, b: AdminOrder) => {
        if (sortBy === "oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sortBy === "amount") {
          return Number(b.total || 0) - Number(a.total || 0)
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [telemetry?.recentOrders, searchQuery, sortBy])

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Analytics */}
        <Card className={cn(
          "rounded-2xl transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-none shadow-lg" 
            : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
                  Revenue Analytics
                </CardTitle>
                <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  {timeRange === 'this-week' ? 'Past 7 days live revenue breakdown' : timeRange === 'this-month' ? 'Monthly weekly revenue breakdown' : 'Annual monthly revenue breakdown'}
                </p>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className={cn(
                  "w-32 h-8 text-xs font-bold rounded-xl border-2 transition-colors",
                  isDark 
                    ? "bg-[#0c1438] border-teal/30 text-white hover:border-teal/50" 
                    : "bg-white border-navy/20 text-navy hover:border-navy"
                )}>
                  <SelectValue placeholder="This Week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetry?.revenueChart || []} barCategoryGap="15%" barGap={0}>
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#40E0D0" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1A9A8C" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => {
                      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
                      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
                      return `${value}`
                    }}
                    width={48}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000080',
                      border: '1px solid rgba(64, 224, 208, 0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                      padding: '8px 12px',
                      boxShadow: '0 8px 24px rgba(0,0,128,0.4)'
                    }}
                    labelStyle={{ color: '#40E0D0', fontWeight: 'bold' }}
                    formatter={(value: any) => [`TZS ${Number(value || 0).toLocaleString()}`, 'Revenue']}
                    cursor={{ fill: 'rgba(64, 224, 208, 0.08)' }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#tealGradient)"
                    radius={[8, 8, 8, 8]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Income / Profit and Loss */}
        <Card className={cn(
          "rounded-2xl transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-none shadow-lg" 
            : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
                  Total Income
                </CardTitle>
                <p className={cn("text-xs mt-0.5 font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Real profit (Revenue) and loss (Expenses) performance
                </p>
              </div>
            </div>
            <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2 mt-3 pt-3 border-t-2", isDark ? "border-teal/15" : "border-navy/10")}>
              <span className={cn("text-xs sm:text-sm font-bold", isDark ? "text-slate-300" : "text-navy")}>Performance Ledger</span>
              <div className="flex items-center gap-3 sm:gap-4 sm:ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-teal"></div>
                  <span className={cn("text-xs font-bold", isDark ? "text-slate-400" : "text-navy")}>Profit (Sales)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-brand-red"></div>
                  <span className={cn("text-xs font-bold", isDark ? "text-slate-400" : "text-navy")}>Loss (Expenses)</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-4">
            <div className="h-56 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetry?.profitLoss || []} barCategoryGap="15%" barGap={6}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#40E0D0" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#22C9B8" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF0000" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#CC0000" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => {
                      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
                      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
                      return `${value}`
                    }}
                    width={48}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#080d2a' : '#ffffff',
                      border: isDark ? '1px solid rgba(64, 224, 208, 0.3)' : '2px solid rgba(0, 0, 128, 0.2)',
                      borderRadius: '12px',
                      color: isDark ? '#fff' : '#000080',
                      padding: '8px 12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,128,0.2)'
                    }}
                    formatter={(value: any, name: string) => [
                      `TZS ${Number(value || 0).toLocaleString()}`,
                      name === 'profit' ? 'Profit (Revenue)' : 'Loss (Expenses)'
                    ]}
                  />
                  <Bar dataKey="profit" fill="url(#profitGradient)" radius={[8, 8, 8, 8]} maxBarSize={45} />
                  <Bar dataKey="loss" fill="url(#lossGradient)" radius={[8, 8, 8, 8]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <ShoppingCart className="h-5 w-5 text-teal" />
                  Recent Orders
                </CardTitle>
                <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Latest client transactions and store orders
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-teal" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "pl-8 w-32 sm:w-40 h-8 text-xs rounded-xl border border-teal",
                      isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
                    )}
                  />
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
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 text-[10px] sm:text-[11px] uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                    <th className="text-left py-2 px-2 sm:py-2.5 sm:px-4">Order</th>
                    <th className="text-left py-2 px-1.5 sm:py-2.5 sm:px-3">Customer</th>
                    <th className="text-left py-2 px-1.5 sm:py-2.5 sm:px-2">Status</th>
                    <th className="text-right py-2 px-2 sm:py-2.5 sm:px-4">Total</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.slice(0, 6).map((order) => (
                      <tr 
                        key={order.id}
                        onClick={() => router.push('/admin/orders')}
                        className={cn(
                          "transition-colors cursor-pointer text-xs",
                          isDark ? "hover:bg-white/5" : "hover:bg-teal-50/80"
                        )}
                      >
                        <td className="py-2 px-2 sm:py-2.5 sm:px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className={cn(
                              "hidden sm:flex w-6 h-6 rounded-full items-center justify-center shrink-0 border",
                              isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/30"
                            )}>
                              <ShoppingCart className="h-3 w-3" />
                            </div>
                            <div>
                              <span className={cn("font-bold block text-xs", isDark ? "text-white" : "text-navy")}>
                                #{order.order_number || order.id.slice(0, 8)}
                              </span>
                              <span className="text-[10px] text-teal-500 block">{formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-1.5 sm:py-2.5 sm:px-3">
                          <span className={cn("font-semibold line-clamp-1 truncate block max-w-[80px] sm:max-w-[150px]", isDark ? "text-slate-200" : "text-navy")}>
                            {order.customer_name || 'Customer'}
                          </span>
                        </td>
                        <td className="py-2 px-1.5 sm:py-2.5 sm:px-2 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-2 px-2 sm:py-2.5 sm:px-4 text-right whitespace-nowrap">
                          <span className={cn("font-black text-xs", isDark ? "text-teal-300" : "text-navy")}>
                            TSH {Number(order.total || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-navy/60 font-medium">
                        {isLoading ? "Loading orders from database..." : "No orders found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Activity className="h-5 w-5 text-teal" />
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
