"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { getOrdersByUserId, createOrder, updateOrderStatus, type Order, type OrderItem, type OrderStatus } from "@/lib/order-actions"
import { useToast } from "@/components/ui/use-toast"

interface OrderContextType {
  orders: Order[]
  addOrder: (items: OrderItem[], total: number, customerInfo?: { name: string; email: string; address: string; phone?: string }) => Promise<void>
  getOrder: (id: string) => Order | undefined
  handleOrderStatusUpdate: (id: string, status: OrderStatus) => Promise<void>
  refreshOrders: () => Promise<void>
  isLoading: boolean
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, session } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user && session?.access_token) {
      loadOrders()
    } else if (!user) {
      setOrders([])
    }
  }, [user, session?.access_token])

  const loadOrders = async () => {
    if (!user || !session?.access_token) return

    setIsLoading(true)
    try {
      const userOrders = await getOrdersByUserId(user.id, session.access_token)
      setOrders(userOrders || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const addOrder = async (items: OrderItem[], total: number, customerInfo?: { name: string; email: string; address: string; phone?: string }) => {
    if (!user || !session?.access_token) throw new Error("User must be logged in to place an order")

    try {
      const newOrder = await createOrder(user.id, items, total, customerInfo, session.access_token)
      setOrders((prev) => [newOrder, ...prev])
      await loadOrders()
      
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      }

      // Send WhatsApp notifications
      try {
        // Notify admin about new purchase
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            type: 'purchase',
            data: {
              customerName: customerInfo?.name || 'Customer',
              customerEmail: customerInfo?.email || user.email || '',
              orderItems: newOrder.items.map((item: OrderItem) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              total: newOrder.total,
              orderId: newOrder.order_number || newOrder.id,
            },
          }),
        })

        // Send order confirmation to customer (if phone number is available)
        if (customerInfo?.phone) {
          await fetch('/api/whatsapp', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              type: 'order_confirmation',
              data: {
                customerPhone: customerInfo.phone,
                customerName: customerInfo.name || 'Customer',
                orderItems: newOrder.items.map((item: OrderItem) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                total: newOrder.total,
                orderId: newOrder.order_number || newOrder.id,
              },
            }),
          })
        }
      } catch (whatsappError) {
        console.error("Failed to send WhatsApp notifications:", whatsappError)
        // Don't fail the order creation if WhatsApp fails
      }
      
      // Send notifications via API route (don't block the UI)
      if (customerInfo?.email || customerInfo?.phone) {
        try {
          await fetch('/api/notifications/send-order-notifications', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              orderId: newOrder.id,
              order: newOrder,
              customerInfo
            }),
          })
        } catch (notificationError) {
          console.error("Error sending notifications:", notificationError)
          // Don't fail the order creation if notifications fail
        }
      }
      
      toast({
        title: "Order Created Successfully!",
        description: `Your order ${newOrder.order_number || newOrder.id} has been placed successfully.`,
        variant: "default",
      })
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
    <OrderContext.Provider value={{ orders, addOrder, getOrder, handleOrderStatusUpdate, refreshOrders: loadOrders, isLoading }}>
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