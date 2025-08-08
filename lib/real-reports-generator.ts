import { createServerClient } from "@/lib/supabase"
import { getAnalyticsData } from "@/lib/analytics-actions"
import { getOrderStatistics } from "@/lib/admin-actions"

export interface ReportData {
  title: string
  description: string
  generatedAt: string
  category: string
  data: any
  summary: {
    totalRecords: number
    dateRange: string
    keyMetrics: { [key: string]: any }
  }
}

// Sales Reports
export async function generateSalesReport(
  dateRange: { start: string; end: string },
  format: string = 'pdf'
): Promise<{ success: boolean; data?: ReportData; error?: string }> {
  try {
    const supabase = createServerClient()
    
    // Get orders within date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: false })

    if (ordersError) {
      return { success: false, error: ordersError.message }
    }

    // Calculate sales metrics
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0
    const totalOrders = orders?.length || 0
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Status breakdown
    const statusBreakdown = orders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as { [key: string]: number }) || {}

    // Monthly breakdown
    const monthlyData = orders?.reduce((acc, order) => {
      const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!acc[month]) {
        acc[month] = { revenue: 0, orders: 0 }
      }
      acc[month].revenue += parseFloat(order.total || '0')
      acc[month].orders += 1
      return acc
    }, {} as { [key: string]: { revenue: number; orders: number } }) || {}

    const reportData: ReportData = {
      title: 'Sales Performance Report',
      description: `Comprehensive sales analysis from ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      category: 'Sales',
      data: {
        orders: orders || [],
        statusBreakdown,
        monthlyData,
        topCustomers: orders?.slice(0, 10).map(order => ({
          name: order.customerName,
          email: order.customerEmail,
          total: order.total,
          date: order.created_at
        })) || []
      },
      summary: {
        totalRecords: totalOrders,
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        keyMetrics: {
          totalRevenue,
          totalOrders,
          averageOrderValue,
          completedOrders: statusBreakdown.completed || 0,
          pendingOrders: statusBreakdown.pending || 0,
          processingOrders: statusBreakdown.processing || 0
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error generating sales report:', error)
    return { success: false, error: 'Failed to generate sales report' }
  }
}

// User Analytics Report
export async function generateUserReport(
  dateRange: { start: string; end: string }
): Promise<{ success: boolean; data?: ReportData; error?: string }> {
  try {
    const supabase = createServerClient()
    
    // Get orders for user analysis
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, customerName, customerEmail, total, created_at, status')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)

    if (ordersError) {
      return { success: false, error: ordersError.message }
    }

    // Analyze user behavior
    const userStats = orders?.reduce((acc, order) => {
      const userId = order.user_id || order.customerEmail
      if (!acc[userId]) {
        acc[userId] = {
          name: order.customerName,
          email: order.customerEmail,
          totalOrders: 0,
          totalSpent: 0,
          firstOrder: order.created_at,
          lastOrder: order.created_at
        }
      }
      
      acc[userId].totalOrders += 1
      acc[userId].totalSpent += parseFloat(order.total || '0')
      
      if (new Date(order.created_at) < new Date(acc[userId].firstOrder)) {
        acc[userId].firstOrder = order.created_at
      }
      if (new Date(order.created_at) > new Date(acc[userId].lastOrder)) {
        acc[userId].lastOrder = order.created_at
      }
      
      return acc
    }, {} as { [key: string]: any }) || {}

    const topCustomers = Object.values(userStats)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 20)

    const reportData: ReportData = {
      title: 'Customer Analytics Report',
      description: `Customer behavior and engagement analysis from ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      category: 'Analytics',
      data: {
        userStats,
        topCustomers,
        customerSegments: {
          highValue: topCustomers.filter((c: any) => c.totalSpent > 2000).length,
          medium: topCustomers.filter((c: any) => c.totalSpent >= 500 && c.totalSpent <= 2000).length,
          lowValue: topCustomers.filter((c: any) => c.totalSpent < 500).length
        }
      },
      summary: {
        totalRecords: Object.keys(userStats).length,
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        keyMetrics: {
          totalCustomers: Object.keys(userStats).length,
          averageOrdersPerCustomer: Object.values(userStats).reduce((sum: number, user: any) => sum + user.totalOrders, 0) / Object.keys(userStats).length,
          averageSpentPerCustomer: Object.values(userStats).reduce((sum: number, user: any) => sum + user.totalSpent, 0) / Object.keys(userStats).length,
          topCustomerSpending: Math.max(...Object.values(userStats).map((user: any) => user.totalSpent))
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error generating user report:', error)
    return { success: false, error: 'Failed to generate user report' }
  }
}

// Products Performance Report
export async function generateProductsReport(
  dateRange: { start: string; end: string }
): Promise<{ success: boolean; data?: ReportData; error?: string }> {
  try {
    const supabase = createServerClient()
    
    // Get orders within date range for product analysis
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('items, total, created_at, status')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .neq('status', 'cancelled')

    if (ordersError) {
      return { success: false, error: ordersError.message }
    }

    // Analyze product performance
    const productStats: { [key: string]: { sales: number; revenue: number; orders: number } } = {}
    
    orders?.forEach(order => {
      const items = order.items as Array<{ name: string; quantity: number; price: number }>
      
      items?.forEach(item => {
        const productName = item.name
        const itemRevenue = (item.price || 0) * (item.quantity || 1)
        
        if (!productStats[productName]) {
          productStats[productName] = { sales: 0, revenue: 0, orders: 0 }
        }
        
        productStats[productName].sales += item.quantity || 1
        productStats[productName].revenue += itemRevenue
        productStats[productName].orders += 1
      })
    })

    // Sort products by revenue
    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)

    const reportData: ReportData = {
      title: 'Product Performance Report',
      description: `Product sales and performance analysis from ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      category: 'Products',
      data: {
        productStats,
        topProducts,
        categoryBreakdown: await getCategoryBreakdown(topProducts)
      },
      summary: {
        totalRecords: Object.keys(productStats).length,
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        keyMetrics: {
          totalProducts: Object.keys(productStats).length,
          totalSales: Object.values(productStats).reduce((sum, stats) => sum + stats.sales, 0),
          totalRevenue: Object.values(productStats).reduce((sum, stats) => sum + stats.revenue, 0),
          topProduct: topProducts[0]?.name || 'N/A',
          topProductRevenue: topProducts[0]?.revenue || 0
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error generating products report:', error)
    return { success: false, error: 'Failed to generate products report' }
  }
}

// Financial Summary Report
export async function generateFinancialReport(
  dateRange: { start: string; end: string }
): Promise<{ success: boolean; data?: ReportData; error?: string }> {
  try {
    const supabase = createServerClient()
    
    // Get comprehensive financial data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)

    if (ordersError) {
      return { success: false, error: ordersError.message }
    }

    // Calculate financial metrics
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0
    const completedRevenue = orders?.filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0
    
    const pendingRevenue = orders?.filter(order => order.status === 'pending')
      .reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0

    // Monthly financial breakdown
    const monthlyFinancials = orders?.reduce((acc, order) => {
      const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!acc[month]) {
        acc[month] = { 
          total: 0, 
          completed: 0, 
          pending: 0, 
          processing: 0,
          cancelled: 0,
          orders: 0
        }
      }
      
      const amount = parseFloat(order.total || '0')
      acc[month].total += amount
      acc[month][order.status] += amount
      acc[month].orders += 1
      
      return acc
    }, {} as { [key: string]: any }) || {}

    const reportData: ReportData = {
      title: 'Financial Summary Report',
      description: `Comprehensive financial overview from ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      category: 'Financial',
      data: {
        orders: orders || [],
        monthlyFinancials,
        revenueBreakdown: {
          total: totalRevenue,
          completed: completedRevenue,
          pending: pendingRevenue,
          completionRate: totalRevenue > 0 ? (completedRevenue / totalRevenue) * 100 : 0
        }
      },
      summary: {
        totalRecords: orders?.length || 0,
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        keyMetrics: {
          totalRevenue,
          completedRevenue,
          pendingRevenue,
          averageMonthlyRevenue: Object.values(monthlyFinancials).reduce((sum: number, month: any) => sum + month.total, 0) / Math.max(Object.keys(monthlyFinancials).length, 1),
          completionRate: totalRevenue > 0 ? (completedRevenue / totalRevenue) * 100 : 0
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error generating financial report:', error)
    return { success: false, error: 'Failed to generate financial report' }
  }
}

// Operations Report (Projects, Services, etc.)
export async function generateOperationsReport(
  dateRange: { start: string; end: string }
): Promise<{ success: boolean; data?: ReportData; error?: string }> {
  try {
    const supabase = createServerClient()
    
    // Get services data
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')

    // Get projects data
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')

    // Get blogs data for content operations
    const { data: blogs, error: blogsError } = await supabase
      .from('blogs')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)

    if (servicesError || projectsError || blogsError) {
      return { 
        success: false, 
        error: 'Failed to fetch operations data' 
      }
    }

    const reportData: ReportData = {
      title: 'Operations Summary Report',
      description: `Operational overview including services, projects, and content from ${dateRange.start} to ${dateRange.end}`,
      generatedAt: new Date().toISOString(),
      category: 'Operations',
      data: {
        services: services || [],
        projects: projects || [],
        blogs: blogs || [],
        serviceCategories: groupByCategory(services || [], 'category'),
        projectStatus: groupByCategory(projects || [], 'status')
      },
      summary: {
        totalRecords: (services?.length || 0) + (projects?.length || 0) + (blogs?.length || 0),
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        keyMetrics: {
          totalServices: services?.length || 0,
          totalProjects: projects?.length || 0,
          totalBlogs: blogs?.length || 0,
          activeServices: services?.filter(s => s.status === 'active')?.length || 0,
          activeProjects: projects?.filter(p => p.status === 'active')?.length || 0
        }
      }
    }

    return { success: true, data: reportData }
  } catch (error) {
    console.error('Error generating operations report:', error)
    return { success: false, error: 'Failed to generate operations report' }
  }
}

// Helper functions
async function getCategoryBreakdown(products: any[]): Promise<{ [key: string]: { count: number; revenue: number } }> {
  // Simple categorization based on product names
  const categories: { [key: string]: { count: number; revenue: number } } = {}
  
  products.forEach(product => {
    let category = 'Other'
    
    if (product.name.toLowerCase().includes('website') || product.name.toLowerCase().includes('web')) {
      category = 'Web Development'
    } else if (product.name.toLowerCase().includes('mobile') || product.name.toLowerCase().includes('app')) {
      category = 'Mobile Development'
    } else if (product.name.toLowerCase().includes('design') || product.name.toLowerCase().includes('ui')) {
      category = 'Design Services'
    } else if (product.name.toLowerCase().includes('marketing') || product.name.toLowerCase().includes('seo')) {
      category = 'Marketing Services'
    }
    
    if (!categories[category]) {
      categories[category] = { count: 0, revenue: 0 }
    }
    
    categories[category].count += 1
    categories[category].revenue += product.revenue
  })
  
  return categories
}

function groupByCategory(items: any[], field: string): { [key: string]: number } {
  return items.reduce((acc, item) => {
    const category = item[field] || 'Unknown'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as { [key: string]: number })
}
