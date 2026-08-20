"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getOrderStatistics, getAllOrders } from "@/lib/admin-actions"
import AdminLoading from "@/components/admin/admin-loading"
import WhatsAppTestPanel from "@/components/admin/whatsapp-test-panel"
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

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  processingOrders: number
  recentOrders: number
}

interface Order {
  id: number
  order_number: string
  created_at: string
  customer_name: string
  items: any[]
  status: string
  total: number
}

export default function AdminDashboard() {
  const { isDark } = useAdminTheme()
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("this-week")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          getOrderStatistics(),
          getAllOrders()
        ])
        setStats(statsData)
        setOrders(ordersData.slice(0, 10))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getDateRangeDisplay = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    const endDate = now.toLocaleDateString('en-US', options)
    const startDate = new Date(now.setMonth(now.getMonth() - 1)).toLocaleDateString('en-US', options)
    return `${startDate} - ${endDate}`
  }

  const getRevenueChartData = () => {
    const days = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']
    const baseRevenue = stats?.totalRevenue ? stats.totalRevenue / 7 : 20000
    return days.map((day) => ({
      day,
      revenue: Math.floor(baseRevenue * (0.7 + Math.random() * 0.6)),
    }))
  }

  const getProfitLossData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month) => ({
      month,
      profit: Math.floor(Math.random() * 35000) + 10000,
      loss: Math.floor(Math.random() * 15000) + 2000,
    }))
  }

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toLocaleString() || "0",
      change: "+8.2%",
      changeType: "up" as const,
      lastMonth: Math.floor((stats?.totalOrders || 0) * 0.92),
      icon: ShoppingCart,
      color: "teal",
    },
    {
      title: "Active Customers",
      value: ((stats?.totalOrders || 0) * 3 + 12).toString(),
      change: "+15.4%",
      changeType: "up" as const,
      lastMonth: ((stats?.totalOrders || 0) * 3),
      icon: Users,
      color: "navy",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders?.toString() || "0",
      change: "-2.5%",
      changeType: "down" as const,
      lastMonth: Math.floor((stats?.pendingOrders || 0) * 1.1),
      icon: RotateCcw,
      color: "yellow",
    },
    {
      title: "Total Revenue",
      value: `TZS ${((stats?.totalRevenue || 0) / 1000).toFixed(2)}k`,
      change: "+12.3%",
      changeType: "up" as const,
      lastMonth: `TZS ${(((stats?.totalRevenue || 0) * 0.88) / 1000).toFixed(2)}k`,
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
    const config = statusConfig[status] || statusConfig.pending
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
    const firstItem = items[0]?.product_name || items[0]?.name || "Product"
    if (items.length === 1) return firstItem
    return `${firstItem}, +${items.length - 1} more`
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-teal/15">
        <div>
          <h1 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-navy")}>
            Sales Overview
          </h1>
          <p className="text-xs sm:text-sm text-teal-400 mt-1">
            Real-time business telemetry and operations overview
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-colors w-fit text-xs sm:text-sm font-medium",
          isDark 
            ? "bg-[#080d2a] border-teal/25 text-slate-200 hover:border-teal/40" 
            : "bg-white border-teal/30 text-navy hover:bg-teal-50/50"
        )}>
          <Calendar className="h-4 w-4 text-teal-400" />
          <span>{getDateRangeDisplay()}</span>
          <ChevronDown className="h-4 w-4 text-teal-400/70" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index} 
              className={cn(
                "rounded-2xl transition-all duration-200 border hover:-translate-y-0.5",
                isDark 
                  ? "bg-[#080d2a]/80 border-teal/20 shadow-lg shadow-black/20 hover:border-teal/40" 
                  : "bg-white border-teal/25 shadow-md shadow-navy/5 hover:border-teal/40"
              )}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1 truncate", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      {stat.title}
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className={cn("text-xl sm:text-2xl lg:text-3xl font-extrabold truncate", isDark ? "text-white" : "text-navy")}>
                        {stat.value}
                      </span>
                      <span className={cn(
                        "text-xs font-bold flex items-center",
                        stat.changeType === 'up' ? "text-teal-400" : "text-rose-400"
                      )}>
                        {stat.changeType === 'up' ? (
                          <TrendingUp className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                        )}
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2.5 sm:p-3 rounded-xl border flex-shrink-0",
                    isDark ? "bg-teal-400/10 border-teal-400/25 text-teal-300" : "bg-teal-50 border-teal-200 text-navy"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
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
          "rounded-2xl border",
          isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-lg" : "bg-white border-teal/25 shadow-md"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
                  Revenue Analytics
                </CardTitle>
                <p className="text-xs text-teal-400/80">Weekly sales breakdown</p>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className={cn(
                  "w-32 h-8 text-xs font-semibold rounded-xl border",
                  isDark ? "bg-[#0c1438] border-teal/30 text-white" : "bg-slate-50 border-teal/30 text-navy"
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
                <BarChart data={getRevenueChartData()} barCategoryGap="15%" barGap={0}>
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
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    domain={[0, 30000]}
                    ticks={[0, 5000, 10000, 15000, 20000, 25000, 30000]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#0a0f2c',
                      border: '1px solid rgba(64, 224, 208, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      padding: '8px 12px',
                      boxShadow: '0 8px 24px rgba(0,0,128,0.4)'
                    }}
                    labelStyle={{ color: '#40E0D0', fontWeight: 'bold' }}
                    formatter={(value: number) => [`TZS ${value.toLocaleString()}`, 'Revenue']}
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
          "rounded-2xl border",
          isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-lg" : "bg-white border-teal/25 shadow-md"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
                  Total Income
                </CardTitle>
                <p className="text-xs text-teal-400/80 mt-0.5">Profit and loss performance overview</p>
              </div>
            </div>
            <div className={cn("flex flex-col sm:flex-row sm:items-center gap-2 mt-3 pt-3 border-t", isDark ? "border-teal/15" : "border-slate-100")}>
              <span className={cn("text-xs sm:text-sm font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>Performance</span>
              <div className="flex items-center gap-3 sm:gap-4 sm:ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-teal-400"></div>
                  <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>Profit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-rose-500"></div>
                  <span className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>Loss</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-4">
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getProfitLossData()} barCategoryGap="25%" barGap={3}>
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#40E0D0" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#22C9B8" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FB7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#E11D48" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    domain={[0, 50000]}
                    ticks={[0, 10000, 20000, 30000, 40000, 50000]}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#0a0f2c',
                      border: '1px solid rgba(64, 224, 208, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,128,0.4)'
                    }}
                    formatter={(value: number, name: string) => [
                      `TZS ${value.toLocaleString()}`,
                      name === 'profit' ? 'Profit' : 'Loss'
                    ]}
                  />
                  <Bar dataKey="profit" fill="url(#profitGradient)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                  <Bar dataKey="loss" fill="url(#lossGradient)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className={cn(
        "rounded-2xl border",
        isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-lg" : "bg-white border-teal/25 shadow-md"
      )}>
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
                Recent Orders
              </CardTitle>
              <p className="text-xs text-teal-400/80">Latest client transactions and store orders</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "pl-8 sm:pl-9 w-full sm:w-52 h-8 sm:h-9 text-xs sm:text-sm rounded-xl border",
                    isDark 
                      ? "bg-[#0c1438] border-teal/30 text-white placeholder:text-slate-400" 
                      : "bg-slate-50 border-teal/30 text-navy placeholder:text-slate-400"
                  )}
                />
              </div>
              <Select defaultValue="newest">
                <SelectTrigger className={cn(
                  "w-24 sm:w-28 h-8 sm:h-9 text-xs sm:text-sm rounded-xl border",
                  isDark ? "bg-[#0c1438] border-teal/30 text-white" : "bg-slate-50 border-teal/30 text-navy"
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
            {orders.length > 0 ? (
              orders
                .filter(order => 
                  searchQuery === "" || 
                  order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((order) => (
                  <div key={order.id} className={cn("p-4 border-b last:border-b-0", isDark ? "border-teal/15" : "border-slate-100")}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                          #{order.order_number || order.id}
                        </span>
                        <p className="text-xs text-teal-400 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="space-y-1 mb-2">
                      <p className={cn("text-sm font-medium", isDark ? "text-slate-200" : "text-slate-800")}>
                        {order.customer_name || 'Customer'}
                      </p>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                        {getItemsDescription(order.items)}
                      </p>
                    </div>
                    <div className={cn("flex items-center justify-between pt-2 border-t", isDark ? "border-teal/15" : "border-slate-100")}>
                      <span className="text-xs text-teal-400">{order.items?.length || 0} Items</span>
                      <span className={cn("text-sm font-bold", isDark ? "text-teal-300" : "text-navy")}>
                        TZS {order.total?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center text-teal-400 text-sm">
                {isLoading ? 'Loading orders...' : 'No orders found'}
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn("border-b", isDark ? "border-teal/15 bg-white/5" : "border-slate-200 bg-slate-50/70")}>
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-teal-400">
                    <Checkbox className="mr-2 border-teal-400" />
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider text-teal-400">Order Id</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider text-teal-400">Date</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider text-teal-400">Customer</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider text-teal-400 hidden lg:table-cell">Details</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider text-teal-400">Status</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-semibold uppercase tracking-wider text-teal-400 hidden md:table-cell">Items</th>
                  <th className="text-right py-3 px-4 md:px-6 text-xs font-semibold uppercase tracking-wider text-teal-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders
                    .filter(order => 
                      searchQuery === "" || 
                      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((order) => (
                      <tr 
                        key={order.id} 
                        className={cn(
                          "border-b transition-colors",
                          isDark ? "border-teal/10 hover:bg-white/5" : "border-slate-100 hover:bg-teal-50/40"
                        )}
                      >
                        <td className="py-3 md:py-4 px-4 md:px-6">
                          <Checkbox className="border-teal-400" />
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <span className={cn("text-xs md:text-sm font-bold", isDark ? "text-white" : "text-navy")}>
                            #{order.order_number || order.id}
                          </span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <span className={cn("text-xs md:text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
                            {formatDate(order.created_at)}
                          </span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <span className={cn("text-xs md:text-sm font-semibold", isDark ? "text-white" : "text-navy")}>
                            {order.customer_name || 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 hidden lg:table-cell">
                          <span className={cn("text-xs md:text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                            {getItemsDescription(order.items)}
                          </span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 hidden md:table-cell">
                          <span className={cn("text-xs md:text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
                            {order.items?.length || 0} Items
                          </span>
                        </td>
                        <td className="py-3 md:py-4 px-4 md:px-6 text-right">
                          <span className={cn("text-xs md:text-sm font-bold", isDark ? "text-teal-300" : "text-navy")}>
                            TZS {order.total?.toLocaleString() || '0'}
                          </span>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-teal-400">
                      {isLoading ? 'Loading orders...' : 'No orders found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Integration Test Panel */}
      <div className="pt-2">
        <WhatsAppTestPanel />
      </div>
    </div>
  )
}
