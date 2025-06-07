"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export interface Order {
  id: string
  date: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
}

interface OrderContextType {
  orders: Order[]
  addOrder: (items: OrderItem[], total: number, customerInfo?: { name: string; email: string; address: string }) => Promise<void>
  getOrder: (id: string) => Order | undefined
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>
  isLoading: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  // Fetch orders when user changes
  useEffect(() => {
    if (user) {
      fetchOrders()
    } else {
      setOrders([])
    }
  }, [user])

  const fetchOrders = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders")
      if (!response.ok) throw new Error("Failed to fetch orders")
      const data = await response.json()
      
      // Transform the data to match our Order interface
      const transformedOrders = data.map((order: any) => ({
        id: order.id.toString(),
        date: order.created_at,
        status: order.status,
        items: JSON.parse(order.items),
        total: Number(order.total),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        shippingAddress: order.shipping_address,
      }))
      
      setOrders(transformedOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addOrder = async (items: OrderItem[], total: number, customerInfo?: { name: string; email: string; address: string }) => {
    if (!user) throw new Error("User must be logged in to place an order")

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          total,
          name: customerInfo?.name,
          email: customerInfo?.email,
          address: customerInfo?.address,
        }),
      })

      if (!response.ok) throw new Error("Failed to create order")
      
      // Refresh orders after adding new one
      await fetchOrders()
    } catch (error) {
      console.error("Error creating order:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getOrder = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    if (!user) throw new Error("User must be logged in to update order status")

    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update order status")
      
      // Refresh orders after updating
      await fetchOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder, getOrder, updateOrderStatus, isLoading }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
} 