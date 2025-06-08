"use server"

import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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
  userId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export async function createOrder(
  userId: string,
  items: OrderItem[],
  total: number,
  customerInfo?: {
    name: string
    email: string
    address: string
  }
) {
  try {
    console.log("Creating order with data:", {
      userId,
      items,
      total,
      customerInfo
    })

    const [order] = await db
      .insert(orders)
      .values({
        user_id: userId,
        date: new Date(),
        items: items,
        total: total.toString(),
        status: "pending" as const,
        customerName: customerInfo?.name || null,
        customerEmail: customerInfo?.email || null,
        shippingAddress: customerInfo?.address || null,
      })
      .returning()

    if (!order) {
      throw new Error("Failed to create order - no order returned")
    }

    console.log("Order created successfully:", order)

    return {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
    }
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export async function getOrdersByUserId(userId: string) {
  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(orders.date)

    if (!userOrders || userOrders.length === 0) {
      return []
    }

    return userOrders.map(order => ({
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
    }))
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function getOrderById(id: string) {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))

    if (!order) return null

    return {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning()

    if (!order) {
      throw new Error("Failed to update order - no order returned")
    }

    return {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
} 