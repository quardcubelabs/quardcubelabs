"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { getAuthUsers } from "./auth-users-actions"

// Get all orders for admin with customer names from profiles
export async function getAllOrders() {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    // Get orders and auth users in parallel
    const [ordersResult, usersResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }),
      getAuthUsers()
    ])

    if (ordersResult.error) {
      console.error("Error fetching all orders:", ordersResult.error)
      throw new Error(`Failed to fetch orders: ${ordersResult.error.message}`)
    }

    const orders = ordersResult.data
    const authUsers = usersResult.users

    // Create a map of user_id to user info for quick lookup
    const userMap = new Map()
    authUsers.forEach(user => {
      userMap.set(user.id, {
        name: user.user_metadata?.full_name || 
              user.user_metadata?.name || 
              `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() ||
              user.email?.split('@')[0] ||
              'Unknown Customer',
        email: user.email,
        phone: user.phone || user.user_metadata?.phone
      })
    })

    return orders.map(order => {
      const userInfo = userMap.get(order.user_id)
      
      return {
        ...order,
        items: order.items,
        total: Number(order.total),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        userId: order.user_id,
        order_number: order.order_number,
        // Prioritize user profile name, then order customerName, then default
        customerName: userInfo?.name || order.customerName || 'Unknown Customer',
        customerEmail: userInfo?.email || order.customerEmail || order.customer_email,
        customerPhone: userInfo?.phone || order.customerPhone || order.customer_phone,
      }
    })
  } catch (error) {
    console.error("Error in getAllOrders:", error)
    throw error
  }
}

// Get all users for admin
export async function getAllUsers() {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    // Note: This requires admin service role key for user management
    // For now, we'll get users from orders to show customer information
    const { data: orders, error } = await supabase
      .from('orders')
      .select('user_id, customerName, customerEmail')

    if (error) {
      console.error("Error fetching users:", error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    // Get unique users
    const uniqueUsers = orders.reduce((acc, order) => {
      if (!acc.find(user => user.id === order.user_id)) {
        acc.push({
          id: order.user_id,
          name: order.customerName || 'Unknown',
          email: order.customerEmail || 'No email',
          totalOrders: orders.filter(o => o.user_id === order.user_id).length
        })
      }
      return acc
    }, [] as any[])

    return uniqueUsers
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    throw error
  }
}

// Update order status (admin only)
export async function adminUpdateOrderStatus(orderId: string, status: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      throw new Error(`Failed to update order: ${error.message}`)
    }

    return {
      ...order,
      items: order.items,
      total: Number(order.total),
      order_number: order.order_number,
    }
  } catch (error) {
    console.error("Error in adminUpdateOrderStatus:", error)
    throw error
  }
}

// Delete order (admin only)
export async function adminDeleteOrder(orderId: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      console.error("Error deleting order:", error)
      throw new Error(`Failed to delete order: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error in adminDeleteOrder:", error)
    throw error
  }
}

// Get order statistics
export async function getOrderStatistics() {
  try {
    const { isAdmin } = await verifyAdminSession()
    
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    const supabase = createServerClient()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total, created_at')

    if (error) {
      console.error("Error fetching order statistics:", error)
      throw new Error(`Failed to fetch statistics: ${error.message}`)
    }

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    const completedOrders = orders.filter(order => order.status === 'completed').length
    const processingOrders = orders.filter(order => order.status === 'processing').length

    // Get orders from last 30 days
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
    throw error
  }
}
