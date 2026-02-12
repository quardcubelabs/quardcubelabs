"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getOrderStatistics, getAllOrders } from "@/lib/admin-actions"
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
    const days = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thus']
    const baseRevenue = stats?.totalRevenue ? stats.totalRevenue / 7 : 20000
    return days.map((day) => ({
      day,
      revenue: Math.floor(baseRevenue * (0.7 + Math.random() * 0.6)),
    }))
  }

  const getProfitLossData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    return months.map(month => ({
      month,
      profit: Math.floor(Math.random() * 50000) + 20000,
      loss: Math.floor(Math.random() * 15000) + 5000,
    }))
  }

  const statCards = [
    {
      title: "Total Sales",
      value: stats?.totalOrders || 0,
      change: "+4.9%",
      changeType: "up" as const,
      lastMonth: Math.floor((stats?.totalOrders || 0) * 0.94),
      icon: ShoppingCart,
    },
    {
      title: "New Customer",
      value: stats?.recentOrders || 0,
      change: "+7.5%",
      changeType: "up" as const,
      lastMonth: Math.floor((stats?.recentOrders || 0) * 0.93),
      icon: Users,
    },
    {
      title: "Return Products",
      value: stats?.pendingOrders || 0,
      change: "-9.0%",
      changeType: "down" as const,
      lastMonth: Math.floor((stats?.pendingOrders || 0) * 1.1),
      icon: RotateCcw,
    },
    {
      title: "Total Revenue",
      value: `TZS ${((stats?.totalRevenue || 0) / 1000).toFixed(2)}k`,
      change: "+12.3%",
      changeType: "up" as const,
      lastMonth: `TZS ${(((stats?.totalRevenue || 0) * 0.88) / 1000).toFixed(2)}k`,
      icon: DollarSign,
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; bgColor: string }> = {
      pending: { color: "text-yellow-700", bgColor: "bg-yellow-100" },
      processing: { color: "text-blue-700", bgColor: "bg-blue-100" },
      completed: { color: "text-green-700", bgColor: "bg-green-100" },
      cancelled: { color: "text-red-700", bgColor: "bg-red-100" },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color} ${config.bgColor} capitalize`}>
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
    <div className="w-full min-h-screen bg-gray-50 -m-4 sm:-m-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Overview</h1>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors w-fit">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-xs sm:text-sm text-gray-600">{getDateRangeDisplay()}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow rounded-xl sm:rounded-2xl">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 order-2 sm:order-1">
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">{stat.title}</p>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                      <span className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</span>
                      <span className={`text-xs sm:text-sm font-medium flex items-center ${
                        stat.changeType === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.changeType === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">Last month: {stat.lastMonth}</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-full bg-orange-50 order-1 sm:order-2 w-fit">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Revenue Analytics */}
        <Card className="bg-white border-0 shadow-sm rounded-xl sm:rounded-2xl">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Revenue analytics</CardTitle>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-28 sm:w-32 h-8 text-xs sm:text-sm border-gray-200 rounded-lg">
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
                  {/* SVG Pattern for diagonal stripes */}
                  <defs>
                    <pattern id="orangeStripes" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                      <rect width="3" height="6" fill="#EA580C" />
                      <rect x="3" width="3" height="6" fill="#F97316" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    domain={[0, 30000]}
                    ticks={[0, 5000, 10000, 15000, 20000, 25000, 30000]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#EA580C',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="url(#orangeStripes)"
                    radius={[8, 8, 8, 8]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Income / Profit and Loss */}
        <Card className="bg-white border-0 shadow-sm rounded-xl sm:rounded-2xl">
          <CardHeader className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Total Income</CardTitle>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">View your income in a certain period of time</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs sm:text-sm font-semibold text-gray-700">Profit and Loss</span>
              <div className="flex items-center gap-3 sm:gap-4 sm:ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg, #1f2937, #1f2937 2px, #374151 2px, #374151 4px)' }}></div>
                  <span className="text-[10px] sm:text-xs text-gray-500">Profit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ background: 'repeating-linear-gradient(45deg, #EA580C, #EA580C 2px, #F97316 2px, #F97316 4px)' }}></div>
                  <span className="text-[10px] sm:text-xs text-gray-500">Loss</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-4">
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getProfitLossData()} barCategoryGap="25%" barGap={2}>
                  {/* SVG Patterns for striped bars */}
                  <defs>
                    <pattern id="profitStripes" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                      <rect width="2.5" height="5" fill="#1f2937" />
                      <rect x="2.5" width="2.5" height="5" fill="#374151" />
                    </pattern>
                    <pattern id="lossStripes" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
                      <rect width="2.5" height="5" fill="#EA580C" />
                      <rect x="2.5" width="2.5" height="5" fill="#F97316" />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    domain={[0, 50000]}
                    ticks={[0, 10000, 20000, 30000, 40000, 50000]}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => [
                      `TZS ${value.toLocaleString()}`,
                      name === 'profit' ? 'Profit' : 'Loss'
                    ]}
                  />
                  <Bar dataKey="profit" fill="url(#profitStripes)" radius={[4, 4, 4, 4]} maxBarSize={14} />
                  <Bar dataKey="loss" fill="url(#lossStripes)" radius={[4, 4, 4, 4]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="bg-white border-0 shadow-sm rounded-xl sm:rounded-2xl">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Recent orders</CardTitle>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-9 w-full sm:w-48 h-8 sm:h-9 text-xs sm:text-sm border-gray-200 rounded-lg"
                />
              </div>
              <Select defaultValue="newest">
                <SelectTrigger className="w-24 sm:w-28 h-8 sm:h-9 text-xs sm:text-sm border-gray-200">
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
                  <div key={order.id} className="p-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">#{order.order_number || order.id}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="space-y-1.5 mb-2">
                      <p className="text-sm text-gray-700">{order.customer_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{getItemsDescription(order.items)}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className="text-xs text-gray-500">{order.items?.length || 0} Items</span>
                      <span className="text-sm font-semibold text-gray-900">
                        TZS {order.total?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-12 text-center text-gray-500 text-sm">
                {isLoading ? 'Loading orders...' : 'No orders found'}
              </div>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox className="mr-2" />
                  </th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Order Id</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-3 md:px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                  <th className="text-right py-3 px-4 md:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
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
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 md:py-4 px-4 md:px-6">
                          <Checkbox />
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <span className="text-xs md:text-sm font-medium text-gray-900">#{order.order_number || order.id}</span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <span className="text-xs md:text-sm text-gray-600">{formatDate(order.created_at)}</span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <span className="text-xs md:text-sm text-gray-900">{order.customer_name || 'Unknown'}</span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 hidden lg:table-cell">
                          <span className="text-xs md:text-sm text-gray-600">{getItemsDescription(order.items)}</span>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4 hidden md:table-cell">
                          <span className="text-xs md:text-sm text-gray-600">{order.items?.length || 0} Items</span>
                        </td>
                        <td className="py-3 md:py-4 px-4 md:px-6 text-right">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">
                            TZS {order.total?.toLocaleString() || '0'}
                          </span>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      {isLoading ? 'Loading orders...' : 'No orders found'}
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
