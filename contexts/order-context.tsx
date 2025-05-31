"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
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
  updateOrderStatus: (id: string, status: OrderStatus) => void
  isLoading: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const addOrder = async (items: OrderItem[], total: number, customerInfo?: { name: string; email: string; address: string }) => {
    const newOrderId = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const newOrderDate = new Date().toISOString()

    const newOrder: Order = {
      id: newOrderId,
      date: newOrderDate,
      status: "pending",
      items,
      total,
      customerName: customerInfo?.name,
      customerEmail: customerInfo?.email,
      shippingAddress: customerInfo?.address,
    }

    setOrders((prev) => [newOrder, ...prev])
    console.log("Order added to state:", newOrder)
  }

  const getOrder = (id: string) => {
    return orders.find((order) => order.id === id)
  }

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    )
    console.log(`Order ${id} status updated to ${status} in state`)
  }

  return ([
  ].length > 0 ? (
      <OrderContext.Provider value={{ orders, addOrder, getOrder, updateOrderStatus, isLoading }}>
        {children}
      </OrderContext.Provider>
    ) : (
      <OrderContext.Provider value={{ orders, addOrder, getOrder, updateOrderStatus, isLoading }}>
        {children}
      </OrderContext.Provider>
    )
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
} 