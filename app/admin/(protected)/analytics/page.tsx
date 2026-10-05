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
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Eye, 
  Calendar, 
  Activity, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  RefreshCw, 
  FileText, 
  Briefcase, 
  Sparkles,
  Cctv,
  Building2,
  Truck,
  Wallet,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  HardDrive,
  Layers,
  Package,
  FileCheck,
  Receipt
} from "lucide-react"
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
  Cell,
  ComposedChart
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
        activeUsers: Math.floor(Math.random() * 20) + 10,
        newUsers: Math.floor(Math.random() * 5) + 1
      })
    }
    return sampleData
  }

  // Get doughnut chart data for user activity status with website theme colors
  const getUserActivityDoughnutData = () => {
    const themeColors = ['#000080', '#40E0D0', '#FF0000', '#0f766e', '#1e3a8a']
    if (analyticsData?.ordersByStatus && analyticsData.ordersByStatus.length > 0) {
      return analyticsData.ordersByStatus.map((status, index) => ({
        name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
        value: status.count,
        percentage: status.percentage,
        color: themeColors[index % themeColors.length]
      }))
    }
    
    return [
      { name: 'Completed', value: 50, percentage: 50, color: '#000080' },
      { name: 'Processing', value: 35, percentage: 35, color: '#40E0D0' },
      { name: 'Cancelled', value: 15, percentage: 15, color: '#FF0000' }
    ]
  }

  // Format timestamp into relative human-readable time
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

  // Get recent activity data based on real system and website activities
  const getRecentActivityData = () => {
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
    
    const shortToFull = new Map()
    monthsShort.forEach((short, index) => {
      shortToFull.set(short, months[index])
    })
    
    const existingData = analyticsData?.monthlyRevenue || []
    const dataMap = new Map()
    existingData.forEach(item => {
      const monthKey = item.month
      const fullMonthName = shortToFull.get(monthKey) || monthKey
      dataMap.set(fullMonthName, item)
    })
    
    return months.map(month => {
      const existingItem = dataMap.get(month)
      return {
        month,
        revenue: existingItem?.revenue || 0,
        orders: existingItem?.orders || 0
      }
    })
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
    <div className="space-y-6 pb-12">
      {/* Page Header Banner */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
              Analytics <span className="text-white drop-shadow-sm">Dashboard</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Enterprise intelligence, CCTV telemetry, branch performance & financial health
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

      {/* 1. Core Platform Stats Cards Row (Top 5 Cards) */}
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
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 2. Enterprise Ecosystem KPI Strip (New Modules Quick Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            title: "CCTV Pipeline",
            value: formatCurrency(analyticsData.cctv?.pipelineValue || 0),
            subtitle: `${analyticsData.cctv?.totalProjects || 0} active projects`,
            icon: Cctv,
            link: "/admin/cctv"
          },
          {
            title: "Branch Network",
            value: `${analyticsData.branches?.totalBranches || 0} Branches`,
            subtitle: `${formatCurrency(analyticsData.branches?.totalDailySales || 0)} / day`,
            icon: Building2,
            link: "/admin/branches"
          },
          {
            title: "Operating Expenses",
            value: formatCurrency(analyticsData.expenses?.totalExpenses || 0),
            subtitle: `${formatCurrency(analyticsData.expenses?.paidExpenses || 0)} settled`,
            icon: Wallet,
            link: "/admin/expenses"
          },
          {
            title: "Active Staff",
            value: `${analyticsData.staff?.activeStaff || 0} Staff`,
            subtitle: `${analyticsData.staff?.totalStaff || 0} total headcount`,
            icon: UserCheck,
            link: "/admin/staff"
          },
          {
            title: "Supplier Outlay",
            value: formatCurrency(analyticsData.suppliers?.totalSpend || 0),
            subtitle: `${analyticsData.suppliers?.totalSuppliers || 0} vendors`,
            icon: Truck,
            link: "/admin/suppliers"
          },
          {
            title: "Commercial Quotes",
            value: formatCurrency(analyticsData.quotations?.totalQuotedValue || 0),
            subtitle: `${analyticsData.quotations?.conversionRate || 0}% win rate`,
            icon: FileCheck,
            link: "/admin/quotations"
          }
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <Card
              key={idx}
              onClick={() => router.push(item.link)}
              className={cn(
                "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-teal/20 shadow-md hover:border-teal-400" 
                  : "bg-white border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
              )}
            >
              <CardContent className="p-3.5 flex items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider truncate", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {item.title}
                  </p>
                  <p className={cn("text-sm sm:text-base font-black truncate mt-0.5", isDark ? "text-white" : "text-navy")}>
                    {item.value}
                  </p>
                  <p className={cn("text-[10px] font-medium truncate mt-0.5", isDark ? "text-teal-400" : "text-navy/70")}>
                    {item.subtitle}
                  </p>
                </div>
                <div className={cn(
                  "p-2 rounded-xl border shrink-0 transition-transform group-hover:scale-110",
                  isDark ? "bg-navy border-teal/30 text-teal" : "bg-teal-100/80 border-navy/15 text-navy"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. Existing Charts Row: Revenue Trend & Order Status Overview */}
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
                  margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
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

        {/* Order Status Overview Chart */}
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

      {/* 4. CCTV Surveillance & Engineering Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* CCTV Pipeline by Status */}
        <Card className={cn(
          "lg:col-span-2 rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal/40" 
            : "bg-white border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Cctv className="h-5 w-5 text-teal" />
                  CCTV Engineering Project Pipeline & Valuation
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Total active surveillance engineering projects grouped by implementation phase
                </CardDescription>
              </div>
              <Badge className="bg-teal text-navy font-black text-xs">
                {analyticsData.cctv?.totalProjects || 0} Projects
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-2">
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.cctv?.projectsByStatus || []}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="status" 
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    fontWeight={700}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDark ? "#94a3b8" : "#000080"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Project Valuation']}
                    contentStyle={{
                      backgroundColor: isDark ? '#070d24' : '#000080',
                      border: '2px solid rgba(64, 224, 208, 0.5)',
                      borderRadius: '12px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {(analyticsData.cctv?.projectsByStatus || []).map((entry, index) => (
                      <Cell key={`cctv-bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* CCTV Technology Distribution Donut */}
        <Card className={cn(
          "rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal/40" 
            : "bg-white border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Layers className="h-5 w-5 text-teal" />
              Surveillance Architecture
            </CardTitle>
            <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              IP / 4K NVR vs Analog / HD-XVR Deployments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-between h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={analyticsData.cctv?.systemTypeDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {(analyticsData.cctv?.systemTypeDistribution || []).map((entry, index) => (
                    <Cell key={`cctv-sys-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} Projects`, name]}
                  contentStyle={{
                    backgroundColor: '#000080',
                    borderRadius: '10px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 pt-2 border-t border-navy/10 dark:border-slate-800">
              {(analyticsData.cctv?.systemTypeDistribution || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className={isDark ? "text-white" : "text-navy"}>{item.name}</span>
                  </div>
                  <span className={cn("font-black", isDark ? "text-teal-300" : "text-navy")}>{item.count} Projects</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Financial Health & Operational Expenses Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Revenue vs Expenses Composed Chart */}
        <Card className={cn(
          "lg:col-span-2 rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal/40" 
            : "bg-white border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Wallet className="h-5 w-5 text-teal" />
                  Revenue vs Operating Expenses & Net Margin
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Month-by-month financial inflow vs business overhead expenditures
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-navy dark:text-teal-400"><span className="w-2.5 h-2.5 rounded-full bg-navy dark:bg-teal-400"></span>Revenue</span>
                <span className="flex items-center gap-1 text-brand-red"><span className="w-2.5 h-2.5 rounded-full bg-brand-red"></span>Expenses</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-2">
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.expenses?.monthlyComparison || []}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDark ? "#94a3b8" : "#000080"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    formatter={(val: any, name: any) => [formatCurrency(Number(val)), name === 'revenue' ? 'Gross Revenue' : name === 'expenses' ? 'Expenses' : 'Net Margin']}
                    contentStyle={{
                      backgroundColor: isDark ? '#070d24' : '#000080',
                      borderRadius: '12px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="revenue" name="revenue" fill={isDark ? "#40E0D0" : "#000080"} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Breakdown */}
        <Card className={cn(
          "rounded-2xl border-2 transition-all duration-300",
          isDark 
            ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal/40" 
            : "bg-white border-navy/20 shadow-md hover:border-navy"
        )}>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className={cn("text-base sm:text-lg font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Receipt className="h-5 w-5 text-teal" />
              Expense Distribution
            </CardTitle>
            <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
              Operational cost center breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex flex-col justify-between h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="60%">
              <PieChart>
                <Pie
                  data={analyticsData.expenses?.categories || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {(analyticsData.expenses?.categories || []).map((entry, index) => (
                    <Cell key={`exp-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [formatCurrency(Number(val)), 'Amount']}
                  contentStyle={{ backgroundColor: '#000080', borderRadius: '10px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 overflow-y-auto max-h-28 pr-1 scrollbar-thin">
              {(analyticsData.expenses?.categories || []).slice(0, 4).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className={cn("truncate font-bold", isDark ? "text-slate-300" : "text-navy")}>{cat.category}</span>
                  </div>
                  <span className={cn("font-black shrink-0", isDark ? "text-teal-300" : "text-navy")}>{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Branch Network Performance & Retail Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Branch Daily Sales vs Inventory Valuation */}
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
                  <Building2 className="h-5 w-5 text-teal" />
                  Branch Sales & Inventory Comparison
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Daily commercial revenue vs local warehouse inventory valuation
                </CardDescription>
              </div>
              <Badge className="bg-teal text-navy font-bold text-xs">
                {analyticsData.branches?.totalBranches || 4} Branches
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-2">
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.branches?.branchPerformance || []}
                  margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={10}
                    fontWeight={700}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDark ? "#94a3b8" : "#000080"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${(val / 1_000_000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    formatter={(val: any, name: any) => [formatCurrency(Number(val)), name === 'sales' ? 'Daily Sales' : 'Inventory Value']}
                    contentStyle={{ backgroundColor: isDark ? '#070d24' : '#000080', borderRadius: '12px', color: '#ffffff' }}
                  />
                  <Bar dataKey="sales" name="sales" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="inventory" name="inventory" fill={isDark ? "#40E0D0" : "#000080"} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Human Capital & Staff Distribution by Department */}
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
                  <UserCheck className="h-5 w-5 text-teal" />
                  Staff Workforce & Department Structure
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Human capital headcount allocation across functional domains
                </CardDescription>
              </div>
              <Badge className="bg-navy dark:bg-teal text-white dark:text-navy font-bold text-xs">
                {analyticsData.staff?.totalStaff || 23} Team Members
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 md:p-6 pt-2">
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analyticsData.staff?.byRole || []}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#132354" : "#e2e8f0"} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="role" 
                    stroke={isDark ? "#94a3b8" : "#000080"}
                    fontSize={10}
                    fontWeight={700}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${val} Members`, 'Headcount']}
                    contentStyle={{ backgroundColor: isDark ? '#070d24' : '#000080', borderRadius: '12px', color: '#ffffff' }}
                  />
                  <Bar dataKey="count" fill={isDark ? "#40E0D0" : "#000080"} radius={[0, 8, 8, 0]}>
                    {(analyticsData.staff?.byRole || []).map((entry, index) => (
                      <Cell key={`staff-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7. Suppliers & Commercial Quotations Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Suppliers by Spend */}
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
                  <Truck className="h-5 w-5 text-teal" />
                  Top Suppliers & Procurement Outlay
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Primary hardware and equipment distributor expenditure
                </CardDescription>
              </div>
              <span className={cn("text-xs font-black", isDark ? "text-teal-300" : "text-navy")}>
                {formatCurrency(analyticsData.suppliers?.totalSpend || 0)} Total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="space-y-3">
              {(analyticsData.suppliers?.topSuppliers || []).map((sup, idx) => (
                <div 
                  key={idx}
                  onClick={() => router.push('/admin/suppliers')}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]",
                    isDark ? "bg-white/5 border-slate-800 hover:border-teal/40" : "bg-slate-50 border-navy/10 hover:border-navy"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold text-sm truncate", isDark ? "text-white" : "text-navy")}>{sup.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono py-0">{sup.code}</Badge>
                    </div>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-navy/60")}>
                      {sup.ordersCount} Purchase Orders Processed
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn("font-black text-sm sm:text-base", isDark ? "text-teal-300" : "text-navy")}>
                      {formatCurrency(sup.spend)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quotation Pipeline Conversion */}
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
                  <FileCheck className="h-5 w-5 text-teal" />
                  Commercial Quotation Pipeline & Win Rate
                </CardTitle>
                <CardDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/60")}>
                  Proposals conversion and commercial deal statuses
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500 text-white font-black text-xs">
                {analyticsData.quotations?.conversionRate || 0}% Accepted
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <div className="space-y-3">
              {(analyticsData.quotations?.statusBreakdown || []).map((st, idx) => (
                <div 
                  key={idx}
                  onClick={() => router.push('/admin/quotations')}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]",
                    isDark ? "bg-white/5 border-slate-800 hover:border-teal/40" : "bg-slate-50 border-navy/10 hover:border-navy"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: st.color }} />
                    <div>
                      <span className={cn("font-black text-sm", isDark ? "text-white" : "text-navy")}>{st.status}</span>
                      <p className={cn("text-xs", isDark ? "text-slate-400" : "text-navy/60")}>{st.count} Quotations</p>
                    </div>
                  </div>
                  <span className={cn("font-black text-sm sm:text-base", isDark ? "text-teal-300" : "text-navy")}>
                    {formatCurrency(st.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8. Existing Data Tables Row: Top Products & Recent Activity */}
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
                      <div className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black shadow-sm border",
                        isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-white border-navy/20"
                      )}>
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
                    <div className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mt-0.5 shadow-sm shrink-0 border",
                      isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                    )}>
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
