"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { getAnalyticsData, type AnalyticsData } from "@/lib/analytics-actions"
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Eye, Calendar, Activity, Target, ArrowUpRight, ArrowDownRight, Filter, RefreshCw } from "lucide-react"

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30d")
  const { toast } = useToast()

  // Load analytics data from database
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error: analyticsError } = await getAnalyticsData(timeRange)
        
        if (analyticsError) {
          setError(analyticsError)
          toast({
            title: "Error",
            description: "Failed to load analytics data",
            variant: "destructive",
          })
          return
        }

        setAnalyticsData(data)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        const errorMessage = "Failed to load analytics data"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange, toast])

  const handleRefresh = () => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error: analyticsError } = await getAnalyticsData(timeRange)
        
        if (analyticsError) {
          setError(analyticsError)
          toast({
            title: "Error",
            description: "Failed to load analytics data",
            variant: "destructive",
          })
          return
        }

        setAnalyticsData(data)
        toast({
          title: "Success",
          description: "Analytics data refreshed successfully",
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
        const errorMessage = "Failed to load analytics data"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }

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
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <AdminLoading message="Loading analytics data..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Load Analytics</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
            {analyticsData.monthlyRevenue.length > 0 ? (
              <div className="h-80 relative">
                {/* Simple chart representation */}
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                  {analyticsData.monthlyRevenue.map((data, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="bg-navy rounded-t-sm w-8 mb-2"
                        style={{
                          height: `${Math.max(20, (data.revenue / Math.max(...analyticsData.monthlyRevenue.map(d => d.revenue), 1)) * 200)}px`
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
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No revenue data available for the selected period</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Daily active and new users</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.userActivity.length > 0 ? (
              <div className="h-80 relative">
                <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                  {analyticsData.userActivity.map((data, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="flex flex-col items-center mb-2">
                        <div
                          className="bg-blue-500 rounded-t-sm w-4 mr-1"
                          style={{
                            height: `${Math.max(10, (data.activeUsers / Math.max(...analyticsData.userActivity.map(d => d.activeUsers), 1)) * 150)}px`
                          }}
                        ></div>
                        <div
                          className="bg-green-500 rounded-t-sm w-4 ml-1"
                          style={{
                            height: `${Math.max(5, (data.newUsers / Math.max(...analyticsData.userActivity.map(d => d.newUsers), 1)) * 150)}px`
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
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No user activity data available</p>
                </div>
              </div>
            )}
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
            {analyticsData.topProducts.length > 0 ? (
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No product sales data available</p>
              </div>
            )}
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
