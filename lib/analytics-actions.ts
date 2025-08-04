"use server"

import { createServerClient } from "@/lib/supabase"
import { getAuthUsers, getUserStats } from "@/lib/auth-users-actions"

export interface AnalyticsData {
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

export interface RevenueData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  monthlyData: Array<{ month: string; revenue: number; orders: number }>
}

export interface ProductAnalytics {
  name: string
  sales: number
  revenue: number
}

// Get revenue data from orders table
export async function getRevenueAnalytics(timeRange: string = "30d"): Promise<{ data: RevenueData | null, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    // Calculate date range
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching revenue data:", error)
      return { data: null, error: error.message }
    }

    if (!orders || orders.length === 0) {
      return {
        data: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          monthlyData: []
        },
        error: null
      }
    }

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group by month for monthly data
    const monthlyGroups: { [key: string]: { revenue: number; orders: number } } = {}
    
    orders.forEach(order => {
      const date = new Date(order.created_at)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { revenue: 0, orders: 0 }
      }
      
      monthlyGroups[monthKey].revenue += parseFloat(order.total || '0')
      monthlyGroups[monthKey].orders += 1
    })

    const monthlyData = Object.entries(monthlyGroups)
      .map(([month, data]) => ({
        month: month.split(' ')[0], // Just the month name
        revenue: data.revenue,
        orders: data.orders
      }))
      .slice(-12) // Last 12 months

    return {
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        monthlyData
      },
      error: null
    }
  } catch (error) {
    console.error("Error in getRevenueAnalytics:", error)
    return { data: null, error: "Failed to fetch revenue analytics" }
  }
}

// Get top performing products
export async function getTopProducts(limit: number = 5): Promise<{ data: ProductAnalytics[], error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('items, total, status')
      .neq('status', 'cancelled')

    if (error) {
      console.error("Error fetching top products:", error)
      return { data: [], error: error.message }
    }

    if (!orders || orders.length === 0) {
      return { data: [], error: null }
    }

    // Process items from all orders
    const productStats: { [key: string]: { sales: number; revenue: number } } = {}
    
    orders.forEach(order => {
      const items = order.items as Array<{ name: string; quantity: number; price: number }>
      
      items?.forEach(item => {
        const productName = item.name
        const itemRevenue = (item.price || 0) * (item.quantity || 1)
        
        if (!productStats[productName]) {
          productStats[productName] = { sales: 0, revenue: 0 }
        }
        
        productStats[productName].sales += item.quantity || 1
        productStats[productName].revenue += itemRevenue
      })
    })

    // Convert to array and sort by revenue
    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        sales: stats.sales,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

    return { data: topProducts, error: null }
  } catch (error) {
    console.error("Error in getTopProducts:", error)
    return { data: [], error: "Failed to fetch top products" }
  }
}

// Get order status distribution
export async function getOrderStatusDistribution(): Promise<{ data: Array<{ status: string; count: number; percentage: number }>, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status')

    if (error) {
      console.error("Error fetching order status distribution:", error)
      return { data: [], error: error.message }
    }

    if (!orders || orders.length === 0) {
      return { data: [], error: null }
    }

    // Count orders by status
    const statusCounts: { [key: string]: number } = {}
    const totalOrders = orders.length
    
    orders.forEach(order => {
      const status = order.status || 'pending'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    // Convert to array with percentages
    const statusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: parseFloat(((count / totalOrders) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)

    return { data: statusDistribution, error: null }
  } catch (error) {
    console.error("Error in getOrderStatusDistribution:", error)
    return { data: [], error: "Failed to fetch order status distribution" }
  }
}

// Get user activity data (simulated with order data)
export async function getUserActivity(days: number = 7): Promise<{ data: Array<{ date: string; activeUsers: number; newUsers: number }>, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    // Get auth users for new users data
    const { users: authUsers } = await getAuthUsers()
    
    // Get recent orders for active users
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data: recentOrders, error } = await supabase
      .from('orders')
      .select('user_id, created_at')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error("Error fetching user activity:", error)
      return { data: [], error: error.message }
    }

    // Generate daily activity data
    const activityData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      // Count unique users who placed orders on this date
      const dayOrders = recentOrders?.filter(order => 
        order.created_at.startsWith(dateString)
      ) || []
      
      const activeUsers = new Set(dayOrders.map(order => order.user_id)).size
      
      // Count new users registered on this date
      const newUsers = authUsers.filter(user => 
        user.created_at.startsWith(dateString)
      ).length
      
      activityData.push({
        date: dateString,
        activeUsers,
        newUsers
      })
    }

    return { data: activityData, error: null }
  } catch (error) {
    console.error("Error in getUserActivity:", error)
    return { data: [], error: "Failed to fetch user activity" }
  }
}

// Calculate growth percentages (comparison with previous period)
export async function getGrowthMetrics(timeRange: string = "30d"): Promise<{ 
  revenueGrowth: number
  orderGrowth: number 
  userGrowth: number
  conversionGrowth: number
}> {
  try {
    const supabase = createServerClient()
    
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    
    // Current period
    const currentStart = new Date()
    currentStart.setDate(currentStart.getDate() - daysAgo)
    
    // Previous period (same duration)
    const previousStart = new Date()
    previousStart.setDate(previousStart.getDate() - (daysAgo * 2))
    const previousEnd = new Date()
    previousEnd.setDate(previousEnd.getDate() - daysAgo)
    
    // Get current period data
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', currentStart.toISOString())
      .neq('status', 'cancelled')
    
    // Get previous period data
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', previousEnd.toISOString())
      .neq('status', 'cancelled')
    
    // Calculate metrics
    const currentRevenue = currentOrders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0
    const previousRevenue = previousOrders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0
    
    const currentOrderCount = currentOrders?.length || 0
    const previousOrderCount = previousOrders?.length || 0
    
    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const orderGrowth = previousOrderCount > 0 ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 : 0
    
    // User growth (using auth users)
    const { users: authUsers } = await getAuthUsers()
    const currentUsers = authUsers.filter(user => 
      new Date(user.created_at) >= currentStart
    ).length
    const previousUsers = authUsers.filter(user => 
      new Date(user.created_at) >= previousStart && new Date(user.created_at) < previousEnd
    ).length
    
    const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0
    
    // Conversion rate growth (orders vs new users)
    const currentConversion = currentUsers > 0 ? (currentOrderCount / currentUsers) * 100 : 0
    const previousConversion = previousUsers > 0 ? (previousOrderCount / previousUsers) * 100 : 0
    const conversionGrowth = previousConversion > 0 ? ((currentConversion - previousConversion) / previousConversion) * 100 : 0
    
    return {
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
      orderGrowth: parseFloat(orderGrowth.toFixed(1)),
      userGrowth: parseFloat(userGrowth.toFixed(1)),
      conversionGrowth: parseFloat(conversionGrowth.toFixed(1))
    }
  } catch (error) {
    console.error("Error calculating growth metrics:", error)
    return {
      revenueGrowth: 0,
      orderGrowth: 0,
      userGrowth: 0,
      conversionGrowth: 0
    }
  }
}

// Main function to get complete analytics data
export async function getAnalyticsData(timeRange: string = "30d"): Promise<{ data: AnalyticsData | null, error: string | null }> {
  try {
    // Fetch all analytics data in parallel
    const [
      revenueResult,
      topProductsResult,
      statusResult,
      activityResult,
      userStatsResult,
      growthMetrics
    ] = await Promise.all([
      getRevenueAnalytics(timeRange),
      getTopProducts(5),
      getOrderStatusDistribution(),
      getUserActivity(7),
      getUserStats(),
      getGrowthMetrics(timeRange)
    ])

    if (revenueResult.error) {
      return { data: null, error: revenueResult.error }
    }

    const revenueData = revenueResult.data!
    const userStats = userStatsResult.stats || { totalUsers: 0, verifiedUsers: 0, unverifiedUsers: 0, recentSignups: 0 }
    
    // Calculate conversion rate
    const conversionRate = userStats.totalUsers > 0 ? (revenueData.totalOrders / userStats.totalUsers) * 100 : 0

    const analyticsData: AnalyticsData = {
      totalRevenue: revenueData.totalRevenue,
      revenueGrowth: growthMetrics.revenueGrowth,
      totalOrders: revenueData.totalOrders,
      orderGrowth: growthMetrics.orderGrowth,
      totalUsers: userStats.totalUsers,
      userGrowth: growthMetrics.userGrowth,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      conversionGrowth: growthMetrics.conversionGrowth,
      averageOrderValue: revenueData.averageOrderValue,
      aovGrowth: growthMetrics.revenueGrowth - growthMetrics.orderGrowth, // Approximation
      monthlyRevenue: revenueData.monthlyData,
      topProducts: topProductsResult.data || [],
      userActivity: activityResult.data || [],
      ordersByStatus: statusResult.data || []
    }

    return { data: analyticsData, error: null }
  } catch (error) {
    console.error("Error in getAnalyticsData:", error)
    return { data: null, error: "Failed to fetch analytics data" }
  }
}
