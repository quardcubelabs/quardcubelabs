"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { getOrdersByUserId, createOrder, updateOrderStatus, type Order, type OrderItem, type OrderStatus } from "@/lib/order-actions"

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
  handleOrderStatusUpdate: (id: string, status: OrderStatus) => Promise<void>
  isLoading: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadOrders()
    } else {
      setOrders([])
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const userOrders = await getOrdersByUserId(user.id)
      setOrders(userOrders || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const addOrder = async (items: OrderItem[], total: number, customerInfo?: { name: string; email: string; address: string }) => {
    if (!user) throw new Error("User must be logged in to place an order")

    try {
      const newOrder = await createOrder(user.id, items, total, customerInfo)
      setOrders((prev) => [newOrder, ...prev])
      await loadOrders()
    } catch (error) {
      console.error("Error adding order:", error)
      throw error
    }
  }

  const getOrder = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  const handleOrderStatusUpdate = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status)
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status } : order))
      )
      await loadOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      throw error
    }
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder, getOrder, handleOrderStatusUpdate, isLoading }}>
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