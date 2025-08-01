"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Eye, Calendar, Activity, Target, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react"

interface AnalyticsData {
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  orderGrowth: number
  totalUsers: number
  userGrowth: number
  conversionRate: number
  conversionGrowth: number
  averageOrderValue: number
  aovGrowth: number
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  userActivity: Array<{ date: string; activeUsers: number; newUsers: number }>
  ordersByStatus: Array<{ status: string; count: number; percentage: number }>
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const { toast } = useToast()

  // Mock analytics data
  const mockAnalyticsData: AnalyticsData = {
    totalRevenue: 145750.00,
    revenueGrowth: 23.5,
    totalOrders: 1247,
    orderGrowth: 18.2,
    totalUsers: 892,
    userGrowth: 12.8,
    conversionRate: 3.2,
    conversionGrowth: -2.1,
    averageOrderValue: 116.85,
    aovGrowth: 8.7,
    monthlyRevenue: [
      { month: "Jan", revenue: 18500, orders: 156 },
      { month: "Feb", revenue: 21200, orders: 189 },
      { month: "Mar", revenue: 19800, orders: 167 },
      { month: "Apr", revenue: 24100, orders: 203 },
      { month: "May", revenue: 22700, orders: 194 },
      { month: "Jun", revenue: 26450, orders: 226 },
      { month: "Jul", revenue: 33000, orders: 287 }
    ],
    topProducts: [
      { name: "Professional Web Development Package", sales: 45, revenue: 134975 },
      { name: "Mobile App Development (iOS & Android)", sales: 12, revenue: 59999.88 },
      { name: "E-commerce Store Setup", sales: 23, revenue: 68999.77 },
      { name: "UI/UX Design Package", sales: 38, revenue: 75999.62 },
      { name: "Digital Marketing Campaign", sales: 19, revenue: 28499.81 }
    ],
    userActivity: [
      { date: "2024-07-24", activeUsers: 156, newUsers: 12 },
      { date: "2024-07-25", activeUsers: 189, newUsers: 18 },
      { date: "2024-07-26", activeUsers: 167, newUsers: 9 },
      { date: "2024-07-27", activeUsers: 203, newUsers: 24 },
      { date: "2024-07-28", activeUsers: 194, newUsers: 15 },
      { date: "2024-07-29", activeUsers: 226, newUsers: 21 },
      { date: "2024-07-30", activeUsers: 287, newUsers: 33 }
    ],
    ordersByStatus: [
      { status: "Completed", count: 876, percentage: 70.2 },
      { status: "Processing", count: 156, percentage: 12.5 },
      { status: "Pending", count: 98, percentage: 7.9 },
      { status: "Cancelled", count: 67, percentage: 5.4 },
      { status: "Refunded", count: 50, percentage: 4.0 }
    ]
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setAnalyticsData(mockAnalyticsData)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange, toast])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    const isPositive = value >= 0
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {Math.abs(value)}%
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {formatPercentage(analyticsData.revenueGrowth)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {formatPercentage(analyticsData.orderGrowth)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {formatPercentage(analyticsData.userGrowth)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {formatPercentage(analyticsData.conversionGrowth)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {formatPercentage(analyticsData.aovGrowth)} from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue and order volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 relative">
              {/* Simple chart representation */}
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                {analyticsData.monthlyRevenue.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-navy rounded-t-sm w-8 mb-2"
                      style={{
                        height: `${(data.revenue / Math.max(...analyticsData.monthlyRevenue.map(d => d.revenue))) * 200}px`
                      }}
                    ></div>
                    <div className="text-xs text-gray-500 text-center">
                      <div>{data.month}</div>
                      <div className="text-navy font-semibold">{formatCurrency(data.revenue)}</div>
                      <div className="text-gray-400">{data.orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Daily active and new users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 relative">
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                {analyticsData.userActivity.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex flex-col items-center mb-2">
                      <div
                        className="bg-blue-500 rounded-t-sm w-4 mr-1"
                        style={{
                          height: `${(data.activeUsers / Math.max(...analyticsData.userActivity.map(d => d.activeUsers))) * 150}px`
                        }}
                      ></div>
                      <div
                        className="bg-green-500 rounded-t-sm w-4 ml-1"
                        style={{
                          height: `${(data.newUsers / Math.max(...analyticsData.userActivity.map(d => d.newUsers))) * 150}px`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      <div>{new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-blue-600">{data.activeUsers}</div>
                      <div className="text-green-600">+{data.newUsers}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute top-4 right-4 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Active Users</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>New Users</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Best selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-xs text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-navy">{formatCurrency(product.revenue)}</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of orders by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.ordersByStatus.map((status, index) => {
                const getStatusColor = (statusName: string) => {
                  switch (statusName.toLowerCase()) {
                    case 'completed': return 'bg-green-500'
                    case 'processing': return 'bg-blue-500'
                    case 'pending': return 'bg-yellow-500'
                    case 'cancelled': return 'bg-red-500'
                    case 'refunded': return 'bg-gray-500'
                    default: return 'bg-gray-400'
                  }
                }

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`}></div>
                        <span className="text-sm font-medium">{status.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{status.count}</span>
                        <span className="text-xs text-gray-500">({status.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status.status)}`}
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common analytics tasks and reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start gap-2">
                <BarChart3 className="h-5 w-5 text-navy" />
                <div>
                  <div className="font-medium">Sales Report</div>
                  <div className="text-xs text-gray-500">Generate detailed sales analysis</div>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start gap-2">
                <Users className="h-5 w-5 text-navy" />
                <div>
                  <div className="font-medium">User Analytics</div>
                  <div className="text-xs text-gray-500">Analyze user behavior patterns</div>
                </div>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="flex flex-col items-start gap-2">
                <TrendingUp className="h-5 w-5 text-navy" />
                <div>
                  <div className="font-medium">Growth Metrics</div>
                  <div className="text-xs text-gray-500">Track business growth indicators</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
