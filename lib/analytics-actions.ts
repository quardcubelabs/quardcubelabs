"use server"

import { createServerClient } from "@/lib/supabase"
import { getAuthUsers, getUserStats } from "@/lib/auth-users-actions"

export interface RealRecentActivity {
  id: string
  type: 'order' | 'user' | 'application' | 'blog' | 'quote' | 'system'
  title: string
  description: string
  timestamp: string // ISO date string
  theme: 'navy' | 'teal'
}

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
  recentActivities?: RealRecentActivity[]
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

// Get revenue data from real orders and invoices in the database
export async function getRevenueAnalytics(timeRange: string = "30d"): Promise<{ data: RevenueData | null, error: string | null }> {
  try {
    const supabase = await createServerClient()
    
    // Calculate date range for summary cards
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    
    // Fetch all real orders from database (for full year trend and current period stats)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total, created_at, date, status, items')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })

    // Also fetch all real invoices from database
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('total, created_at, status')
      .neq('status', 'cancelled')

    if (ordersError && invoicesError) {
      console.error("Error fetching revenue data:", ordersError || invoicesError)
      return { data: null, error: (ordersError || invoicesError)?.message || "Failed to fetch revenue" }
    }

    const allOrders = orders || []
    const allInvoices = invoices || []

    // Calculate totals for selected time range
    const periodOrders = allOrders.filter(order => {
      const orderDate = new Date(order.created_at || order.date)
      return orderDate >= startDate
    })

    const periodInvoices = allInvoices.filter(inv => {
      const invDate = new Date(inv.created_at)
      return invDate >= startDate
    })

    const orderRevenue = periodOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const invoiceRevenue = periodInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0)
    const totalRevenue = orderRevenue + invoiceRevenue
    const totalOrders = periodOrders.length + periodInvoices.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Build complete monthly revenue mapping for all 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    const monthlyGroups: { [key: string]: { revenue: number; orders: number } } = {}
    monthNames.forEach(m => {
      monthlyGroups[m] = { revenue: 0, orders: 0 }
    })

    // Aggregate real orders into their respective calendar months
    allOrders.forEach(order => {
      const rawDate = order.created_at || order.date
      if (rawDate) {
        const date = new Date(rawDate)
        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          const monthName = monthNames[monthIndex]
          monthlyGroups[monthName].revenue += (Number(order.total) || 0)
          monthlyGroups[monthName].orders += 1
        }
      }
    })

    // Aggregate real invoices into their respective calendar months
    allInvoices.forEach(inv => {
      if (inv.created_at) {
        const date = new Date(inv.created_at)
        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          const monthName = monthNames[monthIndex]
          monthlyGroups[monthName].revenue += (Number(inv.total) || 0)
          monthlyGroups[monthName].orders += 1
        }
      }
    })

    // Format monthly data for chart
    const monthlyData = monthNames.map(month => ({
      month,
      revenue: Math.round(monthlyGroups[month].revenue * 100) / 100,
      orders: monthlyGroups[month].orders
    }))

    return {
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        monthlyData
      },
      error: null
    }
  } catch (error) {
    console.error("Error in getRevenueAnalytics:", error)
    return { data: null, error: "Failed to fetch revenue analytics" }
  }
}

// Get top performing products from real database orders
export async function getTopProducts(limit: number = 5): Promise<{ data: ProductAnalytics[], error: string | null }> {
  try {
    const supabase = await createServerClient()
    
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

    // Process items from all real orders
    const productStats: { [key: string]: { sales: number; revenue: number } } = {}
    
    orders.forEach(order => {
      let items: any[] = []
      if (Array.isArray(order.items)) {
        items = order.items
      } else if (typeof order.items === 'string') {
        try {
          items = JSON.parse(order.items)
        } catch {
          items = []
        }
      }
      
      items?.forEach((item: any) => {
        const productName = item.name || 'Unnamed Product'
        const itemQty = Number(item.quantity) || 1
        const itemPrice = Number(item.price) || 0
        const itemRevenue = itemPrice * itemQty
        
        if (!productStats[productName]) {
          productStats[productName] = { sales: 0, revenue: 0 }
        }
        
        productStats[productName].sales += itemQty
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

// Get user activity data (real data from orders and auth users)
export async function getUserActivity(days: number = 7): Promise<{ data: Array<{ date: string; activeUsers: number; newUsers: number }>, error: string | null }> {
  try {
    const supabase = await createServerClient()
    
    // Get auth users for new users data
    const { users: authUsers } = await getAuthUsers()
    
    // Get recent orders for active users
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, created_at, customer_email')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (ordersError) {
      console.error("Error fetching user activity orders:", ordersError)
      return { data: [], error: ordersError.message }
    }

    // Also get user sessions or login data if available (fallback to orders)
    // For more accurate active user tracking, you could track page views or sessions

    // Generate daily activity data
    const activityData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      
      // Count unique users who placed orders on this date (active users)
      const dayOrders = recentOrders?.filter(order => 
        order.created_at.startsWith(dateString)
      ) || []
      
      // Get unique user IDs and emails for the day
      const uniqueUserIds = new Set()
      dayOrders.forEach(order => {
        if (order.user_id) uniqueUserIds.add(order.user_id)
        if (order.customer_email) uniqueUserIds.add(order.customer_email)
      })
      
      const activeUsers = uniqueUserIds.size
      
      // Count new users registered on this date
      const newUsers = authUsers.filter(user => 
        user.created_at.startsWith(dateString)
      ).length
      
      activityData.push({
        date: dateString,
        activeUsers: Math.max(activeUsers, newUsers), // Ensure active users >= new users
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

// Get real recent activities across the platform (orders, new users, applications, blogs, quotes)
export async function getRecentRealActivities(limit: number = 5): Promise<RealRecentActivity[]> {
  try {
    const supabase = createServerClient()
    const activities: RealRecentActivity[] = []

    // Fetch in parallel: recent orders, recent users, recent job applications, recent blogs, recent quotations
    const [ordersRes, usersRes, appsRes, blogsRes, quotesRes] = await Promise.allSettled([
      supabase
        .from('orders')
        .select('id, order_number, customerName, customerEmail, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      getAuthUsers(),
      supabase
        .from('applications')
        .select('id, first_name, last_name, email, created_at, applied_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('blogs')
        .select('id, title, author, created_at, published_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('quotations')
        .select('id, quote_number, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
    ])

    // Process Orders
    if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
      ordersRes.value.data.forEach((order: any) => {
        const time = order.created_at
        if (!time) return
        const customer = order.customerName || order.customerEmail || 'Customer'
        const orderRef = order.order_number ? `#${order.order_number}` : ''
        const amount = order.total ? ` (TZS ${Number(order.total).toLocaleString()})` : ''
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: orderRef ? `New Order ${orderRef}` : 'New Order Placed',
          description: `${customer} placed an order${amount} - ${order.status || 'pending'}`,
          timestamp: time,
          theme: 'navy'
        })
      })
    }

    // Process Registered Users
    if (usersRes.status === 'fulfilled' && usersRes.value.users) {
      usersRes.value.users.forEach((user: any) => {
        const time = user.created_at
        if (!time) return
        const name = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() || 
                     user.email?.split('@')[0] || 
                     'New User'
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          title: 'User Registered',
          description: `${name} joined QuardCube Labs`,
          timestamp: time,
          theme: 'teal'
        })
      })
    }

    // Process Job Applications
    if (appsRes.status === 'fulfilled' && appsRes.value.data) {
      appsRes.value.data.forEach((app: any) => {
        const time = app.created_at || app.applied_at
        if (!time) return
        const name = `${app.first_name || ''} ${app.last_name || ''}`.trim() || app.email || 'An applicant'
        activities.push({
          id: `app-${app.id}`,
          type: 'application',
          title: 'New Job Application',
          description: `${name} submitted an application`,
          timestamp: time,
          theme: 'navy'
        })
      })
    }

    // Process Published Blogs
    if (blogsRes.status === 'fulfilled' && blogsRes.value.data) {
      blogsRes.value.data.forEach((blog: any) => {
        const time = blog.created_at || blog.published_at
        if (!time) return
        activities.push({
          id: `blog-${blog.id}`,
          type: 'blog',
          title: 'New Article Published',
          description: `"${blog.title}" by ${blog.author || 'Admin'}`,
          timestamp: time,
          theme: 'teal'
        })
      })
    }

    // Process Quotations
    if (quotesRes.status === 'fulfilled' && quotesRes.value.data) {
      quotesRes.value.data.forEach((quote: any) => {
        const time = quote.created_at
        if (!time) return
        const quoteRef = quote.quote_number ? `#${quote.quote_number}` : ''
        activities.push({
          id: `quote-${quote.id}`,
          type: 'quote',
          title: quoteRef ? `Quotation ${quoteRef}` : 'Quotation Generated',
          description: `For ${quote.customer_name || 'Client'} (${quote.status || 'draft'})`,
          timestamp: time,
          theme: 'navy'
        })
      })
    }

    // Sort descending by timestamp: newest activities first
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Strictly limit to the requested slots (5 items max)
    return activities.slice(0, limit)
  } catch (error) {
    console.error("Error fetching real activities:", error)
    return []
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
      growthMetrics,
      recentActivities
    ] = await Promise.all([
      getRevenueAnalytics(timeRange),
      getTopProducts(5),
      getOrderStatusDistribution(),
      getUserActivity(7),
      getUserStats(),
      getGrowthMetrics(timeRange),
      getRecentRealActivities(5)
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
      ordersByStatus: statusResult.data || [],
      recentActivities
    }

    return { data: analyticsData, error: null }
  } catch (error) {
    console.error("Error in getAnalyticsData:", error)
    return { data: null, error: "Failed to fetch analytics data" }
  }
}
