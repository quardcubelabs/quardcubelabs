"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllOrders, adminUpdateOrderStatus, adminDeleteOrder } from "@/lib/admin-actions"
import { useToast } from "@/components/ui/use-toast"
import { AdminLoading } from "@/components/admin"
import { Eye, Edit, Trash2, Calendar, User, Mail, MapPin, Phone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Order {
  id: string
  order_number?: string
  user_id: string
  items: any[]
  total: number
  status: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  created_at: string
  updated_at: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const data = await getAllOrders()
      setOrders(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId)
      await adminUpdateOrderStatus(orderId, newStatus)
      
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return
    }

    try {
      await adminDeleteOrder(orderId)
      setOrders(orders.filter(order => order.id !== orderId))
      setSelectedOrder(null)
      
      toast({
        title: "Order Deleted",
        description: "Order has been successfully deleted",
      })
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <AdminLoading message="Loading orders..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
           <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
              Orders <span className="gradient-text">Management</span>
            </h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchOrders}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-navy">
              Orders <span className="gradient-text">Management</span>
            </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage and track customer orders</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm" className="w-full sm:w-auto">
          Refresh Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <p className="text-gray-500 text-sm sm:text-base">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className={`cursor-pointer transition-all hover:shadow-md  ${
                  selectedOrder?.id === order.id ? "ring-2 ring-navy" : ""
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-lg truncate">
                        Order #{order.order_number || order.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-xs flex-shrink-0`}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Customer:</span>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate ml-2 max-w-[50%]">
                        {order.customerName || "Unknown Customer"}
                      </span>
                    </div>
                    {order.customerEmail && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Email:</span>
                        <span className="text-xs sm:text-sm text-gray-700 truncate ml-2 max-w-[50%]">
                          {order.customerEmail}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Total:</span>
                      <span className="font-bold text-navy text-xs sm:text-sm">
                        TZS {order.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Items:</span>
                      <span className="text-xs sm:text-sm">{order.items.length} item(s)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Order Details - Show as modal on mobile */}
        <div className="hidden lg:block">
          {selectedOrder ? (
            <Card className="sticky top-6">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-base">
                  Order Details
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                    disabled={updatingStatus === selectedOrder.id}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {selectedOrder.customerName || "Unknown Customer"}
                    </span>
                  </div>
                  
                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedOrder.customerEmail}</span>
                    </div>
                  )}

                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  
                  {selectedOrder.shippingAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">{selectedOrder.shippingAddress}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>TZS {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total:</span>
                      <span>TZS {selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {new Date(selectedOrder.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedOrder.updated_at).toLocaleString()}</div>
                  <div className="truncate">Order ID: {selectedOrder.id}</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Select an order to view details</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mobile Order Details Modal */}
        {selectedOrder && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSelectedOrder(null)}>
            <div 
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-navy">Order Details</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                    disabled={updatingStatus === selectedOrder.id}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {selectedOrder.customerName || "Unknown Customer"}
                    </span>
                  </div>
                  
                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm break-all">{selectedOrder.customerEmail}</span>
                    </div>
                  )}

                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  
                  {selectedOrder.shippingAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">{selectedOrder.shippingAddress}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="flex-1 truncate mr-2">{item.name} x{item.quantity}</span>
                        <span className="flex-shrink-0">TZS {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>TZS {selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 pb-4">
                  <div>Created: {new Date(selectedOrder.created_at).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedOrder.updated_at).toLocaleString()}</div>
                  <div className="break-all">Order ID: {selectedOrder.id}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
