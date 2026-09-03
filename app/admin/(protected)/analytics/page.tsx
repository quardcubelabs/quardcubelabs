"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { getAnalyticsData, type AnalyticsData, type RealRecentActivity } from "@/lib/analytics-actions"
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Eye, Calendar, Activity, Target, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, FileText, Briefcase, Sparkles } from "lucide-react"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
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
  AreaChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { isDark } = useAdminTheme()
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

  // Currency formatter: TSH 8k, TSH 450k, TSH 1.2M
  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return 'TSH 0'
    const abs = Math.abs(amount)
    const sign = amount < 0 ? '-' : ''
    
    if (abs >= 1_000_000) {
      const millions = abs / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `${sign}TSH ${formatted}M`
    }
    if (abs >= 1_000) {
      const thousands = abs / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `${sign}TSH ${formatted}K`
    }
    return `${sign}TSH ${abs.toLocaleString()}`
  }

  // Compact number formatter: 8K, 450K, 1.2M
  const formatCompactNumber = (count: number) => {
    if (!count || isNaN(count)) return '0'
    const abs = Math.abs(count)
    const sign = count < 0 ? '-' : ''
    
    if (abs >= 1_000_000) {
      const millions = abs / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `${sign}${formatted}M`
    }
    if (abs >= 1_000) {
      const thousands = abs / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `${sign}${formatted}K`
    }
    return `${sign}${abs.toLocaleString()}`
  }

  // Get user activity data with fallback sample data
  const getUserActivityData = () => {
    if (analyticsData?.userActivity && analyticsData.userActivity.length > 0) {
      return analyticsData.userActivity
    }
    
    // Generate sample data for the last 7 days
    const sampleData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      sampleData.push({
        date: date.toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 20) + 10, // 10-30 active users
        newUsers: Math.floor(Math.random() * 5) + 1 // 1-6 new users
      })
    }
    return sampleData
  }

  // Get doughnut chart data for user activity status with website theme colors
  const getUserActivityDoughnutData = () => {
    const themeColors = ['#000080', '#40E0D0', '#FF0000', '#0f766e', '#1e3a8a']
    if (analyticsData?.ordersByStatus && analyticsData.ordersByStatus.length > 0) {
      // Use order status data if available
      return analyticsData.ordersByStatus.map((status, index) => ({
        name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
        value: status.count,
        percentage: status.percentage,
        color: themeColors[index % themeColors.length]
      }))
    }
    
    // Fallback sample data using website theme colors (Navy, Teal, Brand Red)
    return [
      { name: 'Completed', value: 50, percentage: 50, color: '#000080' }, // Navy
      { name: 'Processing', value: 35, percentage: 35, color: '#40E0D0' }, // Teal  
      { name: 'Cancelled', value: 15, percentage: 15, color: '#FF0000' } // Brand Red
    ]
  }

  // Format timestamp into relative human-readable time (e.g. "Just now", "5m ago", "2h ago", "1d ago")
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Recently'
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
      if (seconds < 60) return 'Just now'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}d ago`
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  // Get recent activity data based on real system and website activities (capped strictly at 5)
  const getRecentActivityData = () => {
    interface ActivityItem {
      id?: string;
      type: string;
      title: string;
      description: string;
      time: string;
      icon: any;
      theme: 'navy' | 'teal';
    }

    const realActivities = analyticsData?.recentActivities || []

    if (realActivities.length > 0) {
      const iconMap: Record<string, any> = {
        order: ShoppingCart,
        user: Users,
        application: Briefcase,
        blog: FileText,
        quote: DollarSign,
        system: Activity
      }

      return realActivities.slice(0, 5).map((act) => ({
        id: act.id,
        type: act.type,
        title: act.title,
        description: act.description,
        time: formatTimeAgo(act.timestamp),
        icon: iconMap[act.type] || Activity,
        theme: act.theme
      }))
    }

    // Fallback if no real activities yet
    return [
      {
        id: 'default-system',
        type: 'system',
        title: 'System Operational',
        description: 'All services running normally and tracking activity',
        time: 'Active',
        icon: Activity,
        theme: 'teal' as const
      }
    ]
  }

  // Handle clicking on specific recent activity items
  const handleActivityClick = (activity: { id?: string; type: string }) => {
    switch (activity.type) {
      case 'order': {
        const orderId = activity.id ? activity.id.replace(/^order-/, '') : ''
        if (orderId && !orderId.startsWith('default')) {
          router.push(`/admin/orders/${orderId}`)
        } else {
          router.push('/admin/orders')
        }
        break
      }
      case 'user':
        router.push('/admin/users')
        break
      case 'application':
        router.push('/admin/applications')
        break
      case 'blog':
        router.push('/admin/blogs')
        break
      case 'quote':
        router.push('/admin/quotations')
        break
      case 'system':
      default:
        router.push('/admin/reports?category=financial')
        break
    }
  }

  // Generate complete year data with existing monthly revenue data
  const getCompleteYearData = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    const monthsShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    // Create mapping from short to full month names
    const shortToFull = new Map()
    monthsShort.forEach((short, index) => {
      shortToFull.set(short, months[index])
    })
    
    const existingData = analyticsData?.monthlyRevenue || []
    
    // Create a map of existing data for quick lookup
    const dataMap = new Map()
    existingData.forEach(item => {
      // Handle both short and full month formats
      const monthKey = item.month
      const fullMonthName = shortToFull.get(monthKey) || monthKey
      dataMap.set(fullMonthName, item)
    })
    
    // Generate complete year data
    return months.map(month => {
      const existingItem = dataMap.get(month)
      return {
        month,
        revenue: existingItem?.revenue || 0,
        orders: existingItem?.orders || 0
      }
    })
  }

  // Debug log for user activity data

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
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header Card in Teal without borders */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
              Analytics <span className="text-white drop-shadow-sm">Dashboard</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Business insights, telemetry trends, and performance metrics
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="bg-white text-navy border-2 border-navy/20 hover:bg-navy hover:text-white font-bold rounded-xl h-10 px-4 shadow-sm flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <span>Refresh</span>
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px] sm:w-[150px] h-10 text-sm font-semibold border-2 border-navy/20 bg-white text-navy rounded-xl shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 1. Stats Cards Row (Top 5 Cards like Dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: "Total Revenue",
            value: formatCurrency(analyticsData.totalRevenue),
            change: `${Math.abs(analyticsData.revenueGrowth)}%`,
            changeType: analyticsData.revenueGrowth >= 0 ? 'up' : 'down',
            icon: DollarSign,
          },
          {
            title: "Total Orders",
            value: formatCompactNumber(analyticsData.totalOrders),
            change: `${Math.abs(analyticsData.orderGrowth)}%`,
            changeType: analyticsData.orderGrowth >= 0 ? 'up' : 'down',
            icon: ShoppingCart,
          },
          {
            title: "Total Users",
            value: formatCompactNumber(analyticsData.totalUsers),
            change: `${Math.abs(analyticsData.userGrowth)}%`,
            changeType: analyticsData.userGrowth >= 0 ? 'up' : 'down',
            icon: Users,
          },
          {
            title: "Conversion Rate",
            value: `${analyticsData.conversionRate}%`,
            change: `${Math.abs(analyticsData.conversionGrowth)}%`,
            changeType: analyticsData.conversionGrowth >= 0 ? 'up' : 'down',
            icon: Target,
          },
          {
            title: "Avg Order Value",
            value: formatCurrency(analyticsData.averageOrderValue),
            change: `${Math.abs(analyticsData.aovGrowth)}%`,
            changeType: analyticsData.aovGrowth >= 0 ? 'up' : 'down',
            icon: BarChart3,
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index} 
              className={cn(
                "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-teal/20 shadow-md hover:border-teal-400" 
                  : "bg-white border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
                index === 4 ? "col-span-2 sm:col-span-1" : ""
              )}
            >
              <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-base sm:text-lg xl:text-xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                  <span className={cn(
                    "text-[11px] font-bold flex items-center mt-1 truncate",
                    stat.changeType === 'up' ? "text-teal-600" : "text-brand-red"
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
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Trend Line Chart */}
        <Card className={cn(
          "rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal/40" 
            : "bg-white border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <TrendingUp className="h-5 w-5 text-teal" />
                  Revenue Trend
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Monthly revenue trajectory and growth curve
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-navy/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-navy/10 dark:border-teal/20 text-xs font-bold text-navy dark:text-teal-300">
                <span className="w-2.5 h-2.5 rounded-full bg-navy dark:bg-teal-400"></span>
                <span>Revenue (TSH)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-2">
            <div className="h-80 sm:h-[370px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getCompleteYearData()}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 25,
                  }}
                >
                  <defs>
                    <linearGradient id="revenueTrendGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.65} />
                      <stop offset="35%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.42} />
                      <stop offset="70%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={isDark ? "#40E0D0" : "#000080"} stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis 
                    stroke={isDark ? "#94a3b8" : "#000080"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
                      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
                      return `${value}`
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = Number(payload[0].value || 0)
                        return (
                          <div className="bg-teal text-navy p-3.5 sm:p-4 rounded-2xl shadow-[0_12px_32px_rgba(0,128,128,0.4)] border-2 border-navy/30 min-w-[160px]">
                            <p className="text-[11px] text-navy font-bold uppercase tracking-wider">{label}</p>
                            <p className="text-lg sm:text-xl font-black text-white mt-0.5 drop-shadow-sm">
                              {formatCurrency(val)}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-navy font-extrabold mt-1">
                              <TrendingUp className="h-3.5 w-3.5 inline text-navy stroke-[2.5]" />
                              <span>Monthly Revenue</span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                    cursor={{ stroke: '#40E0D0', strokeWidth: 2, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={isDark ? "#40E0D0" : "#000080"}
                    strokeWidth={4.5}
                    fill="url(#revenueTrendGlow)"
                    dot={{ r: 0 }}
                    activeDot={{ 
                      r: 7, 
                      stroke: isDark ? "#40E0D0" : "#000080", 
                      strokeWidth: 3.5, 
                      fill: "#ffffff" 
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Overview Chart with Theme Colors & Larger Size */}
        <Card className={cn(
          "rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal/40" 
            : "bg-white border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Users className="h-5 w-5 text-teal" />
              Order Status Overview
            </CardTitle>
            <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              Distribution of order fulfillment and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-2">
            <div className="h-80 sm:h-[370px] flex flex-col justify-between">
              <ResponsiveContainer width="100%" height="82%">
                <PieChart>
                  <Pie
                    data={getUserActivityDoughnutData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={120}
                    paddingAngle={4}
                    cornerRadius={8}
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 22;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      if (percent === 0) return null;

                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill={isDark ? "#94a3b8" : "#000080"} 
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight={900}
                          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                        >
                          {`${Math.round(percent * 100)}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {getUserActivityDoughnutData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#000080',
                      border: '2px solid rgba(64, 224, 208, 0.5)',
                      borderRadius: '14px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      boxShadow: '0 12px 32px rgba(0, 0, 128, 0.4)'
                    }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend with Theme Colors */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-1 px-4">
                {getUserActivityDoughnutData().map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3.5 h-3.5 rounded-full shadow-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={cn("text-xs sm:text-sm font-bold", isDark ? "text-slate-200" : "text-navy")}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Products */}
        <Card className={cn(
          "rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg" 
            : "bg-white border-navy/20 shadow-md"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className={cn("text-base sm:text-lg font-bold", isDark ? "text-white" : "text-navy")}>
              Top Performing Products
            </CardTitle>
            <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              Best selling products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {analyticsData.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.topProducts.map((product, index) => (
                  <div 
                    key={index} 
                    onClick={() => router.push('/admin/reports?category=financial')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                      isDark 
                        ? "border-teal/15 bg-white/5 hover:border-teal/40 hover:bg-teal-400/10" 
                        : "border-navy/10 bg-slate-50/70 hover:border-navy/30 hover:bg-teal-50/70"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-full bg-navy text-white flex-shrink-0 flex items-center justify-center text-sm font-black shadow-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 
                          className={cn("font-bold text-sm line-clamp-1 truncate", isDark ? "text-white" : "text-navy")}
                          title={product.name}
                        >
                          {product.name}
                        </h4>
                        <p className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>{formatCompactNumber(product.sales)} sales</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn("font-black text-sm sm:text-base whitespace-nowrap", isDark ? "text-teal-300" : "text-navy")}>
                        {formatCurrency(product.revenue)}
                      </div>
                      <div className={cn("text-[10px] uppercase font-bold", isDark ? "text-teal-400/60" : "text-navy/50")}>Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-navy/60">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-navy/30" />
                <p className="text-sm font-medium">No product sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className={cn(
          "rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg" 
            : "bg-white border-navy/20 shadow-md"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Activity className="h-5 w-5 text-teal" />
              Recent Activity
            </CardTitle>
            <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              Live platform events, orders, and system updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-3">
              {getRecentActivityData().map((activity, index) => {
                const Icon = activity.icon
                const isNavy = activity.theme === 'navy'
                
                return (
                  <div 
                    key={index} 
                    onClick={() => handleActivityClick(activity)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isNavy 
                        ? isDark 
                          ? "bg-white/5 border-l-4 border-l-teal-400 border-teal/10 hover:bg-teal-400/10 hover:border-teal/30" 
                          : "bg-navy/5 border-l-4 border-l-navy border-navy/10 hover:bg-navy/10 hover:border-navy/25" 
                        : isDark 
                          ? "bg-teal-400/10 border-l-4 border-l-teal-400 border-teal/20 hover:bg-teal-400/20 hover:border-teal/40" 
                          : "bg-teal-50 border-l-4 border-l-teal-500 border-teal/20 hover:bg-teal-100/70 hover:border-teal/40"
                    )}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-navy text-teal flex items-center justify-center mt-0.5 shadow-sm shrink-0 border border-navy/20">
                      <Icon className="h-4 w-4 text-teal" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={cn("text-sm font-bold truncate", isDark ? "text-white" : "text-navy")}>{activity.title}</h4>
                        <span className={cn("text-[10px] font-semibold flex-shrink-0 ml-2", isDark ? "text-teal-400/80" : "text-navy/60")}>{activity.time}</span>
                      </div>
                      <p className={cn("text-xs font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                        {activity.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
