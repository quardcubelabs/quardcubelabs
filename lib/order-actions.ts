"use server"

import { createServerClient } from "@/lib/supabase"
import { 
  sendOrderConfirmationEmail, 
  sendNewOrderNotificationToAdmin,
  sendOrderStatusUpdateEmail 
} from "@/lib/email-service"

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

export type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export type Order = {
  id: string
  order_number?: string
  userId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
  date: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  created_at?: string // Supabase field name
  updated_at?: string // Supabase field name
}

export async function createOrder(
  userId: string,
  items: OrderItem[],
  total: number,
  customerInfo?: {
    name: string
    email: string
    address: string
    phone?: string
  }
) {
  try {

    const supabase = createServerClient()

    const orderData = {
      user_id: userId,
      date: new Date().toISOString(),
      items: items,
      total: total.toString(),
      status: "pending" as const,
      customerName: customerInfo?.name || null,
      customerEmail: customerInfo?.email || null,
      shippingAddress: customerInfo?.address || null,
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating order:", error)
      throw new Error(`Failed to create order: ${error.message}`)
    }

    if (!order) {
      throw new Error("Failed to create order - no order returned")
    }


    const formattedOrder = {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      createdAt: order.created_at || order.createdAt,
      updatedAt: order.updated_at || order.updatedAt,
      userId: order.user_id,
      order_number: order.order_number,
    }

    // Send email notifications (non-blocking)
    if (customerInfo?.email) {
      // Send order confirmation to customer
      sendOrderConfirmationEmail(formattedOrder as Order, customerInfo.email)
        .then(sent => {
        })
        .catch(err => console.error("Error sending order confirmation:", err))

      // Send notification to admin
      sendNewOrderNotificationToAdmin({
        orderId: order.id,
        orderNumber: order.order_number || order.id,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        total: Number(order.total),
        items: items
      })
        .then(sent => {
        })
        .catch(err => console.error("Error sending admin notification:", err))
    }

    return formattedOrder
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export async function getOrdersByUserId(userId: string) {
  try {
    
    const supabase = createServerClient()

    const { data: userOrders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error("Supabase error fetching orders:", error)
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    if (!userOrders || userOrders.length === 0) {
      return []
    }

    
    return userOrders.map(order => ({
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      // Ensure we have both field names for compatibility
      createdAt: order.created_at || order.createdAt,
      updatedAt: order.updated_at || order.updatedAt,
      userId: order.user_id,
      order_number: order.order_number,
    }))
  } catch (error) {
    console.error("Error fetching orders:", error)
    
    // Provide more specific error information
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('SASL_SIGNATURE_MISMATCH')) {
        console.error("❌ Database connection failed")
        console.error("This usually indicates:")
        console.error("1. Supabase project is paused/deleted")
        console.error("2. Database credentials are incorrect")
        console.error("3. Network connectivity issues")
        
        // Return empty array instead of throwing to prevent app crash
        return []
      }
    }
    
    // Return empty array for any database errors to prevent app crash
    return []
  }
}

export async function getOrderById(id: string) {
  try {
    const supabase = createServerClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error("Supabase error fetching order:", error)
      return null
    }

    if (!order) return null

    return {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      createdAt: order.created_at || order.createdAt,
      updatedAt: order.updated_at || order.updatedAt,
      userId: order.user_id,
      order_number: order.order_number,
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const supabase = createServerClient()

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating order:", error)
      throw new Error(`Failed to update order: ${error.message}`)
    }

    if (!order) {
      throw new Error("Failed to update order - no order returned")
    }

    const formattedOrder = {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      order_number: order.order_number,
    }

    // Send status update email to customer (non-blocking)
    if (order.customerEmail) {
      sendOrderStatusUpdateEmail({
        customerName: order.customerName || 'Customer',
        customerEmail: order.customerEmail,
        orderNumber: order.order_number || order.id,
        orderId: order.id,
        newStatus: status,
        items: (order.items as OrderItem[]).map(item => ({
          name: item.name,
          quantity: item.quantity
        }))
      })
        .then(sent => {
        })
        .catch(err => console.error("Error sending status update email:", err))
    }

    return formattedOrder
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function deleteOrder(id: string) {
  try {
    const supabase = createServerClient()

    // First, update the order status to 'cancelled' instead of deleting
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error cancelling order:", error)
      throw new Error(`Failed to cancel order: ${error.message}`)
    }

    if (!order) {
      throw new Error("Failed to cancel order - no order returned")
    }

    return {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      order_number: order.order_number,
    }
  } catch (error) {
    console.error("Error cancelling order:", error)
    throw error
  }
} 