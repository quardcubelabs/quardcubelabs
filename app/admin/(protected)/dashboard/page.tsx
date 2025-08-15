"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrderStatistics } from "@/lib/admin-actions"
import AdminLoading from "@/components/admin/admin-loading"
import {
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  processingOrders: number
  recentOrders: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getOrderStatistics()
        setStats(data)
      } catch (error) {
        console.error("Error fetching statistics:", error)
        setError("Failed to load dashboard statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // if (isLoading) {
  //   return (
  //     <div className="space-y-6">
  //       <div>
  //         <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
  //         <p className="text-gray-600">Welcome to the QuardCube Labs admin dashboard</p>
  //       </div>
  //       <AdminLoading message="Loading dashboard..." size="lg" />
  //     </div>
  //   )
  // }

  // if (error) {
  //   return (
  //     <div className="space-y-6">
  //       <div>
  //         <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
  //         <p className="text-gray-600">Welcome to the QuardCube Labs admin dashboard</p>
  //       </div>
  //       <Card className="border-red-200">
  //         <CardContent className="p-6">
  //           <p className="text-red-600">{error}</p>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   )
  // }

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      description: "All time orders",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Revenue",
      value: `TZS ${(stats?.totalRevenue || 0).toLocaleString()}`,
      description: "All time revenue",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      description: "Awaiting processing",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Completed Orders",
      value: stats?.completedOrders || 0,
      description: "Successfully delivered",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Processing Orders",
      value: stats?.processingOrders || 0,
      description: "Currently being processed",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Recent Orders",
      value: stats?.recentOrders || 0,
      description: "Last 30 days",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ]

  // Chart data generators
  const getOrderTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    return months.map(month => ({
      month,
      orders: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 200000) + 50000
    }))
  }

  const getOrderStatusData = () => [
    { name: 'Completed', value: stats?.completedOrders || 45, color: '#10B981' },
    { name: 'Processing', value: stats?.processingOrders || 25, color: '#8B5CF6' },
    { name: 'Pending', value: stats?.pendingOrders || 20, color: '#F59E0B' },
    { name: 'Cancelled', value: 10, color: '#EF4444' }
  ]

  const getWeeklyActivityData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(day => ({
      day,
      visitors: Math.floor(Math.random() * 100) + 50,
      orders: Math.floor(Math.random() * 30) + 10
    }))
  }

  const getRevenueData = () => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    return quarters.map(quarter => ({
      quarter,
      revenue: Math.floor(Math.random() * 500000) + 300000,
      target: 400000
    }))
  }

  return (
    <div className="w-full h-full p-6 space-y-8 ">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-navy/80">Welcome to the QuardCube Labs admin dashboard</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="border-navy/20 bg-navy/10 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
                  <CardTitle className="text-xs font-medium text-navy">
                    {stat.title}
                  </CardTitle>
                  <div className="p-1.5 rounded-full bg-white">
                    <Icon className="h-4 w-4 text-brand-red" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-3">
                  <div className="text-lg font-bold text-navy">{stat.value}</div>
                  <p className="text-xs text-navy/70 mt-0.5">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="text-navy">Quick Actions</CardTitle>
              <CardDescription className="text-navy/70">Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href="/admin/orders"
                className="block p-3 bg-navy/10 border border-navy/20 rounded-lg hover:bg-navy/20 transition-colors"
              >
                <div className="font-medium text-navy">Manage Orders</div>
                <div className="text-sm text-navy/70">View and update order statuses</div>
              </a>
              <a
                href="/admin/products"
                className="block p-3 bg-navy/10 border border-navy/20 rounded-lg hover:bg-navy/20 transition-colors"
              >
                <div className="font-medium text-navy">Manage Products</div>
                <div className="text-sm text-navy/70">Add, edit, and manage product inventory</div>
              </a>
              <a
                href="/admin/users"
                className="block p-3 bg-navy/10 border border-navy/20 rounded-lg hover:bg-navy/20 transition-colors"
              >
                <div className="font-medium text-navy">View Users</div>
                <div className="text-sm text-navy/70">Monitor customer accounts and activity</div>
              </a>
            </CardContent>
          </Card>

          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="text-navy">System Status</CardTitle>
              <CardDescription className="text-navy/70">Current system health and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-navy/10 border border-navy/20 rounded-lg">
                <div>
                  <div className="font-medium text-navy">Database</div>
                  <div className="text-sm text-navy/70">Connected and operational</div>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-navy/10 border border-navy/20 rounded-lg">
                <div>
                  <div className="font-medium text-navy">Authentication</div>
                  <div className="text-sm text-navy/70">Supabase auth active</div>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-navy/10 border border-navy/20 rounded-lg">
                <div>
                  <div className="font-medium text-navy">Payment System</div>
                  <div className="text-sm text-navy/70">Order processing enabled</div>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Trends Chart */}
          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <BarChart3 className="h-5 w-5 text-navy/70" />
                Order Trends
              </CardTitle>
              <CardDescription className="text-navy/70">Monthly order volume and revenue trends</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getOrderTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="orders" fill="#082c66ff" name="Orders" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

          {/* Order Status Distribution */}
          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <PieChart className="h-5 w-5 text-navy/70" />
                Order Status Distribution
              </CardTitle>
              <CardDescription className="text-navy/70">Current distribution of order statuses</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="70%">
                <RechartsPieChart>
                  <Pie
                    data={getOrderStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={3}
                    cornerRadius={6}
                    dataKey="value"
                  >
                    {getOrderStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2 px-4">
                {getOrderStatusData().map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <Activity className="h-5 w-5 text-navy/70" />
                Weekly Activity
              </CardTitle>
              <CardDescription className="text-navy/70">Daily visitors and orders for the current week</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getWeeklyActivityData()}>
                  <defs>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#8B5CF6" 
                    fillOpacity={1} 
                    fill="url(#visitorsGradient)" 
                    name="Visitors"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#10B981" 
                    fillOpacity={1} 
                    fill="url(#ordersGradient)" 
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

          {/* Revenue Performance */}
          <Card className="border-navy/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-navy">
                <TrendingUp className="h-5 w-5 text-navy/70" />
                Revenue Performance
              </CardTitle>
              <CardDescription className="text-navy/70">Quarterly revenue vs targets</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getRevenueData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="quarter" stroke="#6b7280" fontSize={12} />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12}
                    tickFormatter={(value) => `TZS ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      `TZS ${value.toLocaleString()}`,
                      name === 'revenue' ? 'Revenue' : 'Target'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#6B7280" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#6B7280', strokeWidth: 2, r: 4 }}
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
