"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getDashboardTelemetry, DashboardTelemetry, AdminOrder } from "@/lib/admin-actions"
import AdminLoading from "@/components/admin/admin-loading"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
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

export default function AdminDashboard() {
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const [telemetry, setTelemetry] = useState<DashboardTelemetry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("this-week")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest")

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

  const getDateRangeDisplay = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    const endDate = now.toLocaleDateString('en-US', options)
    const past = new Date(now.getTime() - 30 * 86400000)
    const startDate = past.toLocaleDateString('en-US', options)
    return `${startDate} - ${endDate}`
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
      {/* Header Card in Teal without borders */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 text-navy">
              Sales <span className="text-white drop-shadow-sm">Overview</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Real-time business telemetry and operations overview
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-navy/20 text-navy hover:bg-teal-50 shadow-sm transition-all duration-200 w-fit text-xs sm:text-sm font-bold cursor-pointer active:scale-95">
            <Calendar className="h-4 w-4 text-teal" />
            <span>{getDateRangeDisplay()}</span>
            <ChevronDown className="h-4 w-4 text-navy/70" />
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

      {/* Recent Orders */}
      <Card className={cn(
        "rounded-2xl transition-all duration-300",
        isDark 
          ? "bg-[#0a1033] border-none shadow-lg" 
          : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
      )}>
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
                Recent Orders
              </CardTitle>
              <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                Latest client transactions and store orders from database
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-8 sm:pl-9 w-full sm:w-52 h-8 sm:h-9 text-xs sm:text-sm rounded-xl transition-colors border border-teal",
                    isDark 
                      ? "bg-[#0c1438] text-white placeholder:text-slate-400 hover:border-teal-400 focus:border-teal focus:ring-1 focus:ring-teal" 
                      : "bg-white text-navy placeholder:text-navy/50 hover:border-teal-600 focus:bg-white focus:border-teal focus:ring-1 focus:ring-teal"
                  )}
                />
              </div>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className={cn(
                  "w-24 sm:w-28 h-8 sm:h-9 text-xs sm:text-sm font-bold rounded-xl border-2 transition-colors",
                  isDark 
                    ? "bg-[#0c1438] border-teal/30 text-white hover:border-teal/50" 
                    : "bg-white border-navy/20 text-navy hover:border-navy"
                )}>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: AdminOrder) => (
                <div key={order.id} className={cn("p-4 border-b last:border-b-0 transition-colors", isDark ? "border-teal/15 hover:bg-white/5" : "border-slate-100 hover:bg-teal/10")}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                        isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                      )}>
                        <ShoppingCart className="h-4 w-4 text-teal" />
                      </div>
                      <div>
                        <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                          #{order.order_number || order.id}
                        </span>
                        <p className="text-xs text-teal-400 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="space-y-1 mb-2 pl-10.5">
                    <p className={cn("text-sm font-medium", isDark ? "text-slate-200" : "text-navy")}>
                      {order.customer_name || 'Customer'}
                    </p>
                    <p className={cn("text-xs", isDark ? "text-slate-400" : "text-navy/60")}>
                      {getItemsDescription(order.items)}
                    </p>
                  </div>
                  <div className={cn("flex items-center justify-between pt-2 border-t", isDark ? "border-teal/15" : "border-slate-100")}>
                    <span className="w-6 h-6 rounded-full bg-navy/10 dark:bg-white/10 text-xs font-bold flex items-center justify-center">{order.items?.length || 0}</span>
                    <span className={cn("text-sm font-black whitespace-nowrap", isDark ? "text-teal-300" : "text-navy")}>
                      TSH {Number(order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-teal-400 text-sm">
                {isLoading ? 'Loading orders from database...' : 'No orders found'}
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-3.5 px-4 md:px-6 text-xs font-black uppercase tracking-wider text-white">Order Id</th>
                  <th className="text-left py-3.5 px-3 md:px-4 text-xs font-black uppercase tracking-wider text-white">Date</th>
                  <th className="text-left py-3.5 px-3 md:px-4 text-xs font-black uppercase tracking-wider text-white">Customer</th>
                  <th className="text-left py-3.5 px-3 md:px-4 text-xs font-black uppercase tracking-wider text-white hidden lg:table-cell">Details</th>
                  <th className="text-left py-3.5 px-3 md:px-4 text-xs font-black uppercase tracking-wider text-white">Status</th>
                  <th className="text-center py-3.5 px-3 md:px-4 text-xs font-black uppercase tracking-wider text-white hidden md:table-cell">Items</th>
                  <th className="text-right py-3.5 px-4 md:px-6 text-xs font-black uppercase tracking-wider text-white whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order: AdminOrder) => (
                    <tr 
                      key={order.id} 
                      onClick={() => router.push(`/admin/orders`)}
                      className={cn(
                        "border-b transition-colors cursor-pointer group",
                        isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                      )}
                    >
                      <td className="py-3.5 md:py-4 px-4 md:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                          )}>
                            <ShoppingCart className={cn("h-3.5 w-3.5", isDark ? "text-teal" : "text-navy")} />
                          </div>
                          <span className={cn("text-xs md:text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                            #{order.order_number || order.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                        <span className={cn("text-xs md:text-sm font-semibold", isDark ? "text-slate-300" : "text-navy/70")}>
                          {formatDate(order.created_at)}
                        </span>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4">
                        <span className={cn("text-xs md:text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                          {order.customer_name || 'Customer'}
                        </span>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 hidden lg:table-cell">
                        <span className={cn("text-xs md:text-sm", isDark ? "text-slate-300" : "text-navy/60")}>
                          {getItemsDescription(order.items)}
                        </span>
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3.5 md:py-4 px-3 md:px-4 text-center hidden md:table-cell whitespace-nowrap">
                        <span className="w-6 h-6 rounded-full bg-navy/10 dark:bg-white/10 text-xs font-black inline-flex items-center justify-center mx-auto">
                          {order.items?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 md:py-4 px-4 md:px-6 text-right whitespace-nowrap">
                        <span className={cn("text-xs md:text-sm font-black tracking-tight whitespace-nowrap", isDark ? "text-white" : "text-navy")}>
                          TSH {Number(order.total || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-navy/70 font-semibold">
                      {isLoading ? 'Loading orders from database...' : 'No orders found in database'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
