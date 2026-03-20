"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllOrders, adminUpdateOrderStatus, adminDeleteOrder } from "@/lib/admin-actions"
import { useToast } from "@/components/ui/use-toast"
import { AdminLoading } from "@/components/admin"
import { Eye, Edit, Trash2, Calendar, User, Mail, MapPin, Phone, Search, Package, DollarSign, Clock, CheckCircle, XCircle, ShoppingCart, RefreshCw } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Computed stats
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === "pending").length
  const processingOrders = orders.filter(o => o.status === "processing").length
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "delivered").length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const tabMatch = activeTab === "all" || order.status === activeTab
    const statusMatch = statusFilter === "all" || order.status === statusFilter
    const searchMatch = searchQuery === "" ||
      (order.order_number || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerEmail || "").toLowerCase().includes(searchQuery.toLowerCase())
    return tabMatch && statusMatch && searchMatch
  })

  const tabs = [
    { key: "all", label: "All Orders" },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ]

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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-navy">
          Orders <span className="gradient-text">Management</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Manage and track customer orders</p>
      </div>

      {/* 1. Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Orders</p>
              <p className="text-xl font-bold text-blue-900">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-yellow-600 font-medium">Pending</p>
              <p className="text-xl font-bold text-yellow-900">{pendingOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-pink-100 rounded-full p-2">
              <Package className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-pink-600 font-medium">Processing</p>
              <p className="text-xl font-bold text-pink-900">{processingOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Completed</p>
              <p className="text-xl font-bold text-green-900">{completedOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-full p-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-purple-900">TZS {totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {orders.filter(o => o.status === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by order number, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button variant="default" size="default" className="bg-navy hover:bg-navy/90">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4. Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === "all" ? "All Orders" : tabs.find(t => t.key === activeTab)?.label}
            <span className="ml-2 text-sm font-normal text-gray-500">({filteredOrders.length})</span>
          </h2>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* 5. Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider hidden sm:table-cell">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedOrder?.id === order.id ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-navy">
                        #{order.order_number || order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 truncate max-w-[160px]">
                          {order.customerName || "Unknown Customer"}
                        </p>
                        {order.customerEmail && (
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">
                            {order.customerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className="text-gray-700">{order.items.length} item(s)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">
                        TZS {order.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusColor(order.status)} text-xs capitalize`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id) }}
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Sidebar - Desktop */}
      {selectedOrder && (
        <div className="hidden lg:block">
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
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
        </div>
      )}

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
  )
}
