"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { getAuthUsers, getUserStats } from "./auth-users-actions"

export interface AdminOrderItem {
  id?: string
  name?: string
  product_name?: string
  quantity: number
  price: number
}

export interface AdminOrder {
  id: string
  order_number: string
  user_id?: string
  userId?: string
  customer_name: string
  customerName: string
  customer_email?: string
  customerEmail?: string
  customer_phone?: string
  customerPhone?: string
  shipping_address?: string
  shippingAddress?: string
  status: "pending" | "processing" | "completed" | "cancelled"
  total: number
  items: AdminOrderItem[]
  date?: string
  created_at: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
}

/**
 * Get all orders for admin with customer names from profiles or user map
 */
export async function getAllOrders(): Promise<AdminOrder[]> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const supabase = createServerClient()

  const [ordersResult, usersResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false }),
    getAuthUsers().catch(() => ({ users: [] }))
  ])

  if (ordersResult.error) {
    console.error("[getAllOrders] Database error:", ordersResult.error)
    return []
  }

  const authUsers = usersResult.users || []
  const userMap = new Map<string, { name: string; email: string; phone: string }>()
  authUsers.forEach((user: any) => {
    userMap.set(user.id, {
      name: user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() ||
            user.email?.split('@')[0] ||
            'Customer',
      email: user.email,
      phone: user.phone || user.user_metadata?.phone
    })
  })

  return (ordersResult.data || []).map((order: any) => {
    const userInfo = userMap.get(order.user_id)
    let parsedItems: any[] = []
    if (Array.isArray(order.items)) {
      parsedItems = order.items
    } else if (typeof order.items === 'string') {
      try { parsedItems = JSON.parse(order.items) } catch { parsedItems = [] }
    }

    const name = userInfo?.name || order.customer_name || order.customerName || 'Customer'
    const email = userInfo?.email || order.customer_email || order.customerEmail || ''
    const phone = userInfo?.phone || order.customer_phone || order.customerPhone || ''

    return {
      id: order.id,
      order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
      user_id: order.user_id,
      userId: order.user_id,
      customer_name: name,
      customerName: name,
      customer_email: email,
      customerEmail: email,
      customer_phone: phone,
      customerPhone: phone,
      shipping_address: order.shipping_address || order.shippingAddress,
      shippingAddress: order.shipping_address || order.shippingAddress,
      status: (order.status || 'pending').toLowerCase() as any,
      total: Number(order.total || 0),
      items: parsedItems,
      date: order.date || order.created_at,
      created_at: order.created_at || order.date || new Date().toISOString(),
      createdAt: order.created_at || order.date || new Date().toISOString(),
      updated_at: order.updated_at || order.created_at,
      updatedAt: order.updated_at || order.created_at
    } as AdminOrder
  })
}

/**
 * Get all users for admin
 */
export async function getAllUsers() {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const [authResult, orders] = await Promise.all([
      getAuthUsers().catch(() => ({ users: [] })),
      getAllOrders().catch(() => [])
    ])

    if (authResult.users && authResult.users.length > 0) {
      return authResult.users.map((u: any) => ({
        id: u.id,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Customer',
        email: u.email || 'No email',
        phone: u.phone || u.user_metadata?.phone,
        totalOrders: orders.filter(o => o.user_id === u.id || o.customer_email === u.email).length
      }))
    }

    // Fallback to unique customers from orders
    const uniqueUsers = orders.reduce((acc: any[], order: any) => {
      const match = acc.find(u => u.id === order.user_id || u.email === order.customer_email)
      if (!match) {
        acc.push({
          id: order.user_id || order.id,
          name: order.customer_name || 'Customer',
          email: order.customer_email || 'No email',
          phone: order.customer_phone,
          totalOrders: orders.filter(o => o.user_id === order.user_id || o.customer_email === order.customer_email).length
        })
      }
      return acc
    }, [])

    return uniqueUsers
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    return []
  }
}

/**
 * Update order status (admin only)
 */
export async function adminUpdateOrderStatus(orderId: string, status: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    // Update in Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    // Sync invoice status in database (non-blocking)
    try {
      const invStatus = status === "completed" ? "paid" : status === "processing" ? "sent" : status === "cancelled" ? "cancelled" : "draft"
      await supabase
        .from('invoices')
        .update({ status: invStatus, updated_at: new Date().toISOString() })
        .like('notes', `%${orderId}%`)
    } catch {}

    // Record audit event
    try {
      const { logAuditEvent } = await import("./audit-actions")
      await logAuditEvent({
        module: "orders",
        action: "status_changed",
        record_id: orderId,
        record_number: order?.order_number || `ORD-${orderId.slice(0, 8)}`,
        description: `Updated order ${order?.order_number || orderId} status to "${status.toUpperCase()}"`,
        previous_state: { status: order?.status },
        new_state: { status }
      })
    } catch (auditErr) {
      console.warn("[adminUpdateOrderStatus] Audit log warning:", auditErr)
    }

    if (order) {
      return {
        ...order,
        items: order.items,
        total: Number(order.total),
        order_number: order.order_number,
      }
    }

    throw new Error("Order " + orderId + " was not found in the database")
  } catch (error) {
    console.error("Error in adminUpdateOrderStatus:", error)
    throw error
  }
}

/**
 * Delete order (admin only)
 */
export async function adminDeleteOrder(orderId: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()
    await supabase.from('orders').delete().eq('id', orderId)

    // Audit log
    try {
      const { logAuditEvent } = await import("./audit-actions")
      await logAuditEvent({
        module: "orders",
        action: "deleted",
        record_id: orderId,
        description: `Deleted order reference ${orderId}`
      })
    } catch {}

    return { success: true }
  } catch (error) {
    console.error("Error in adminDeleteOrder:", error)
    throw error
  }
}

/**
 * Get basic order statistics
 */
export async function getOrderStatistics() {
  try {
    const orders = await getAllOrders()

    const totalOrders = orders.length
    const totalRevenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + Number(order.total || 0), 0)
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    const completedOrders = orders.filter(order => order.status === 'completed').length
    const processingOrders = orders.filter(order => order.status === 'processing').length

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentOrders = orders.filter(order => 
      new Date(order.created_at) > thirtyDaysAgo
    ).length

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      processingOrders,
      recentOrders
    }
  } catch (error) {
    console.error("Error in getOrderStatistics:", error)
    return {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      processingOrders: 0,
      recentOrders: 0
    }
  }
}

export interface DashboardTelemetry {
  stats: {
    totalOrders: number
    ordersDelta: { change: string; changeType: 'up' | 'down'; lastMonth: number }
    activeCustomers: number
    customersDelta: { change: string; changeType: 'up' | 'down'; lastMonth: number }
    pendingOrders: number
    pendingDelta: { change: string; changeType: 'up' | 'down'; lastMonth: number }
    totalRevenue: number
    revenueDelta: { change: string; changeType: 'up' | 'down'; lastMonth: number }
  }
  donutMetrics: {
    ratioIncome: {
      percentage: number
      income: number
      expenses: number
      hasData?: boolean
      primaryLabel: string
      secondaryLabel: string
    }
    orderFulfillment: {
      percentage: number
      completed: number
      pending: number
      hasData?: boolean
      primaryLabel: string
      secondaryLabel: string
    }
    revenueMix: {
      percentage: number
      products: number
      services: number
      hasData?: boolean
      primaryLabel: string
      secondaryLabel: string
    }
    settlementRatio: {
      percentage: number
      settled: number
      receivable: number
      hasData?: boolean
      primaryLabel: string
      secondaryLabel: string
    }
  }
  revenueChart: Array<{
    day: string
    revenue: number
  }>
  profitLoss: Array<{
    month: string
    profit: number
    loss: number
  }>
  recentOrders: AdminOrder[]
  userCount: number
}

/**
 * Dashboard-only expense read. Deliberately queries the Supabase table directly
 * instead of the generic getExpenses() helper, which merges local JSON caches
 * and seeds demo rows. An empty table returns an empty array - never fake data.
 */
async function getDashboardExpenses(): Promise<Array<{ amount: number; expense_date?: string; created_at?: string }>> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) return []

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('amount, expense_date, created_at')

  if (error) {
    console.error('[getDashboardExpenses] Database error:', error)
    return []
  }

  return (data || []) as Array<{ amount: number; expense_date?: string; created_at?: string }>
}

/**
 * Authoritative telemetry calculation:
 * - Real orders from the database (no seeded arrays or JSON caches)
 * - Real business expenses from the database
 * - Real 30-day period comparison (period 1 vs period 2)
 * - Dynamic weekly, monthly, and yearly chart aggregations
 */
export async function getDashboardTelemetry(timeRange: string = "this-week"): Promise<DashboardTelemetry> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const [orders, expenses, userStatsResult] = await Promise.all([
    getAllOrders().catch(() => [] as AdminOrder[]),
    getDashboardExpenses().catch(() => []),
    getUserStats().catch(() => ({ stats: null }))
  ])

  const now = new Date()

  // Calculate strict period boundaries based on timeRange
  let periodStart: Date
  let priorStart: Date
  let priorEnd: Date

  if (timeRange === "today") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    priorStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
    priorEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
  } else if (timeRange === "this-week") {
    periodStart = new Date(now.getTime() - 7 * 86400000)
    priorStart = new Date(now.getTime() - 14 * 86400000)
    priorEnd = new Date(now.getTime() - 7 * 86400000)
  } else if (timeRange === "this-month") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    priorStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
    priorEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  } else {
    // this-year
    periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
    priorStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0)
    priorEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
  }

  // 1. Core Metrics & Filtered Period Comparisons
  const validOrders = orders.filter(o => o.status !== 'cancelled')

  // Orders inside the active period
  const periodValidOrders = validOrders.filter(o => new Date(o.created_at) >= periodStart)
  const priorValidOrders = validOrders.filter(o => {
    const d = new Date(o.created_at)
    return d >= priorStart && d <= priorEnd
  })

  const periodAllOrders = orders.filter(o => new Date(o.created_at) >= periodStart)
  const priorAllOrders = orders.filter(o => {
    const d = new Date(o.created_at)
    return d >= priorStart && d <= priorEnd
  })

  // Total Orders & Delta for active filter
  const curOrdersCount = periodAllOrders.length
  const priorOrdersCount = priorAllOrders.length
  const ordersDelta = calcDelta(curOrdersCount, priorOrdersCount)

  // Total Revenue & Delta for active filter
  const curRevenue = periodValidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const priorRevenue = priorValidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const revenueDelta = calcDelta(curRevenue, priorRevenue)

  // Pending Orders & Delta for active filter
  const curPending = periodAllOrders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const priorPending = priorAllOrders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const pendingDelta = calcDelta(curPending, priorPending)

  // Active Customers & Delta for active filter
  const curUsers = new Set(periodAllOrders.map(o => o.customer_email || o.customer_name).filter(Boolean)).size
  const priorUsers = new Set(priorAllOrders.map(o => o.customer_email || o.customer_name).filter(Boolean)).size
  const customersDelta = calcDelta(curUsers, priorUsers)

  // Active period expenses
  const periodExpensesList = expenses.filter(e => {
    const rawDate = e.expense_date || e.created_at
    if (!rawDate) return false
    return new Date(rawDate) >= periodStart
  })
  const curExpenses = periodExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  // Compute 4 Donut Chart Telemetry Breakdown (Ratio Income, Fulfillment, Revenue Mix, Settlement)
  // 1. Ratio Income (Income vs Expenses)
  const incomePlusExp = curRevenue + curExpenses
  const hasIncomeData = incomePlusExp > 0
  const ratioIncomePct = hasIncomeData
    ? Math.round((curRevenue / incomePlusExp) * 100)
    : 0

  // 2. Order Fulfillment (Completed vs Pending)
  const completedOrdersCount = periodAllOrders.filter(o => o.status === 'completed').length
  const totalTrackedOrders = completedOrdersCount + curPending
  const hasFulfillmentData = totalTrackedOrders > 0
  const fulfillmentPct = hasFulfillmentData
    ? Math.round((completedOrdersCount / totalTrackedOrders) * 100)
    : 0

  // 3. Revenue Mix (Hardware / IT Products vs Managed Tech Services)
  let productsRev = 0
  let servicesRev = 0
  periodValidOrders.forEach(o => {
    const items = o.items || []
    const isService = items.some(it => {
      const name = (it.name || it.product_name || '').toLowerCase()
      return name.includes('cctv') || name.includes('install') || name.includes('network') || name.includes('service') || name.includes('support')
    })
    if (isService) {
      servicesRev += Number(o.total || 0)
    } else {
      productsRev += Number(o.total || 0)
    }
  })
  if (curRevenue === 0) {
    productsRev = 0
    servicesRev = 0
  }
  const hasRevenueData = curRevenue > 0
  const revMixPct = hasRevenueData
    ? Math.round((productsRev / curRevenue) * 100)
    : 0

  // 4. Settlement Ratio (Collected / Paid vs Pending Collection)
  const settledRevenue = periodValidOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)
  const receivableRevenue = Math.max(0, curRevenue - settledRevenue)
  const settlementPct = hasRevenueData
    ? Math.round((settledRevenue / curRevenue) * 100)
    : 0

  const donutMetrics = {
    ratioIncome: {
      percentage: ratioIncomePct,
      income: curRevenue,
      expenses: curExpenses,
      hasData: hasIncomeData,
      primaryLabel: "Income",
      secondaryLabel: "Expenses"
    },
    orderFulfillment: {
      percentage: fulfillmentPct,
      completed: completedOrdersCount,
      pending: curPending,
      hasData: hasFulfillmentData,
      primaryLabel: "Fulfilled",
      secondaryLabel: "Pending"
    },
    revenueMix: {
      percentage: revMixPct,
      products: productsRev,
      services: servicesRev,
      hasData: hasRevenueData,
      primaryLabel: "Products",
      secondaryLabel: "Services"
    },
    settlementRatio: {
      percentage: settlementPct,
      settled: settledRevenue,
      receivable: receivableRevenue,
      hasData: hasRevenueData,
      primaryLabel: "Settled",
      secondaryLabel: "Receivable"
    }
  }

  // 2. Revenue Chart Data based on timeRange
  let revenueChart: Array<{ day: string; revenue: number }> = []

  if (timeRange === "today") {
    // 6 4-hour intervals for today
    const intervals = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
    const buckets = intervals.map(time => ({ day: time, revenue: 0 }))
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    validOrders.forEach(o => {
      const d = new Date(o.created_at)
      if (d >= startOfToday) {
        const hour = d.getHours()
        const idx = Math.min(Math.floor(hour / 4), 5)
        buckets[idx].revenue += Number(o.total || 0)
      }
    })
    revenueChart = buckets
  } else if (timeRange === "this-week") {
    // Last 7 days ending today
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const last7Days: { key: string; day: string; dateStart: Date; dateEnd: Date; revenue: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayLabel = dayNames[d.getDay()]
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      last7Days.push({
        key: d.toISOString().split('T')[0],
        day: dayLabel,
        dateStart: startOfDay,
        dateEnd: endOfDay,
        revenue: 0
      })
    }

    validOrders.forEach(o => {
      const orderDate = new Date(o.created_at)
      for (const bucket of last7Days) {
        if (orderDate >= bucket.dateStart && orderDate <= bucket.dateEnd) {
          bucket.revenue += Number(o.total || 0)
          break
        }
      }
    })

    revenueChart = last7Days.map(b => ({ day: b.day, revenue: b.revenue }))
  } else if (timeRange === "this-month") {
    // 4 Weeks of current month
    const weeks = [
      { day: "Wk 1 (1-7)", start: 1, end: 7, revenue: 0 },
      { day: "Wk 2 (8-14)", start: 8, end: 14, revenue: 0 },
      { day: "Wk 3 (15-21)", start: 15, end: 21, revenue: 0 },
      { day: "Wk 4 (22+)", start: 22, end: 31, revenue: 0 }
    ]

    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    validOrders.forEach(o => {
      const d = new Date(o.created_at)
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dom = d.getDate()
        for (const wk of weeks) {
          if (dom >= wk.start && dom <= wk.end) {
            wk.revenue += Number(o.total || 0)
            break
          }
        }
      }
    })

    revenueChart = weeks.map(w => ({ day: w.day, revenue: w.revenue }))
  } else {
    // this-year: 12 calendar months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = now.getFullYear()
    const monthsMap = monthNames.map(m => ({ day: m, revenue: 0 }))

    validOrders.forEach(o => {
      const d = new Date(o.created_at)
      if (d.getFullYear() === currentYear) {
        const mIdx = d.getMonth()
        if (mIdx >= 0 && mIdx < 12) {
          monthsMap[mIdx].revenue += Number(o.total || 0)
        }
      }
    })

    revenueChart = monthsMap
  }

  // 3. Profit & Loss: Last 6 calendar months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const last6Months: { month: string; year: number; monthIndex: number; profit: number; loss: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    last6Months.push({
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      profit: 0,
      loss: 0
    })
  }

  // Aggregate order revenue as profit
  validOrders.forEach(o => {
    const d = new Date(o.created_at)
    for (const m of last6Months) {
      if (d.getFullYear() === m.year && d.getMonth() === m.monthIndex) {
        m.profit += Number(o.total || 0)
        break
      }
    }
  })

  // Aggregate expenses from database as loss
  expenses.forEach(e => {
    const rawDate = e.expense_date || e.created_at
    if (rawDate) {
      const d = new Date(rawDate)
      for (const m of last6Months) {
        if (d.getFullYear() === m.year && d.getMonth() === m.monthIndex) {
          m.loss += Number(e.amount || 0)
          break
        }
      }
    }
  })

  const profitLoss = last6Months.map(m => ({
    month: m.month,
    profit: Math.round(m.profit),
    loss: Math.round(m.loss)
  }))

  const totalUsers = userStatsResult.stats?.totalUsers
    ?? new Set(orders.map(o => o.customer_email || o.customer_name).filter(Boolean)).size
    ?? 0

  return {
    stats: {
      totalOrders: curOrdersCount,
      ordersDelta: {
        change: ordersDelta.change,
        changeType: ordersDelta.changeType,
        lastMonth: priorOrdersCount
      },
      activeCustomers: curUsers > 0 ? curUsers : (curOrdersCount > 0 ? curUsers : totalUsers),
      customersDelta: {
        change: customersDelta.change,
        changeType: customersDelta.changeType,
        lastMonth: priorUsers
      },
      pendingOrders: curPending,
      pendingDelta: {
        change: pendingDelta.change,
        changeType: pendingDelta.changeType,
        lastMonth: priorPending
      },
      totalRevenue: curRevenue,
      revenueDelta: {
        change: revenueDelta.change,
        changeType: revenueDelta.changeType,
        lastMonth: priorRevenue
      }
    },
    donutMetrics,
    revenueChart,
    profitLoss,
    recentOrders: periodAllOrders.length > 0 ? periodAllOrders.slice(0, 10) : orders.slice(0, 10),
    userCount: totalUsers
  }
}

function calcDelta(current: number, prior: number): { change: string; changeType: 'up' | 'down' } {
  if (prior === 0) {
    // Never fabricate a growth percentage when there is no comparable prior data.
    if (current > 0) return { change: "New", changeType: "up" }
    return { change: "0.0%", changeType: "up" }
  }
  const diff = ((current - prior) / prior) * 100
  const sign = diff >= 0 ? "+" : ""
  return {
    change: `${sign}${diff.toFixed(1)}%`,
    changeType: diff >= 0 ? "up" : "down"
  }
}
