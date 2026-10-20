"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllOrders, adminUpdateOrderStatus, adminDeleteOrder } from "@/lib/admin-actions"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { AdminLoading } from "@/components/admin"
import { Eye, Edit, Trash2, User, Mail, MapPin, Phone, Search, Package, DollarSign, Clock, CheckCircle, RefreshCw, ShoppingCart, Receipt, XCircle, Printer, Boxes, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Order {
  id: string
  order_number?: string
  user_id?: string
  items: any[]
  total: number
  status: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  created_at: string
  updated_at?: string
}

export default function AdminOrdersPage() {
  const { isDark } = useAdminTheme()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editStatus, setEditStatus] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  const tabs = [
    { key: "all", label: "All Orders", icon: ShoppingCart },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "processing", label: "Processing", icon: Package },
    { key: "completed", label: "Completed", icon: CheckCircle },
    { key: "cancelled", label: "Cancelled", icon: XCircle },
  ]

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAllOrders()
      setOrders(data)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Failed to load orders. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId)
      await adminUpdateOrderStatus(orderId, newStatus as any)
      
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
      
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (err) {
      console.error("Error updating order status:", err)
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
    if (!confirm("Are you sure you want to cancel/delete this order?")) {
      return
    }

    try {
      await adminDeleteOrder(orderId)
      setOrders(orders.filter(order => order.id !== orderId))
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null)
      }
      
      toast({
        title: "Order Deleted",
        description: "Order has been removed successfully",
      })
    } catch (err) {
      console.error("Error deleting order:", err)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600 text-white border-green-600 font-black shadow-xs"
      case "processing":
        return "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 font-bold"
      case "pending":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold"
      case "cancelled":
        return "bg-brand-red/15 text-brand-red border-brand-red/30 font-bold"
      default:
        return "bg-gray-500/15 text-gray-700 dark:text-gray-300 font-bold"
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || order.status === activeTab
    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesTab && matchesStatus
  })

  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === "pending").length
  const processingOrders = orders.filter(o => o.status === "processing").length
  const completedOrders = orders.filter(o => o.status === "completed").length
  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, order) => sum + (Number(order.total) || 0), 0)

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
          <h1 className="text-2xl font-bold text-navy">Orders Management</h1>
          <p className="text-navy/80 font-medium">Manage and track customer orders</p>
        </div>
        <Alert className="border-2 border-brand-red bg-brand-red/10 text-brand-red rounded-xl">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchOrders} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl">Retry</Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Orders <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Real-time customer order processing and fulfillment telemetry
            </p>
          </div>
          <div className="flex items-center justify-end ml-auto shrink-0 w-full sm:w-auto">
            <Button 
              onClick={fetchOrders} 
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Orders
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Orders", value: formatStatNumber(totalOrders), icon: ShoppingCart },
          { title: "Pending", value: formatStatNumber(pendingOrders), icon: Clock },
          { title: "Processing", value: formatStatNumber(processingOrders), icon: Package },
          { title: "Completed", value: formatStatNumber(completedOrders), icon: CheckCircle },
          { 
            title: "Total Revenue", 
            value: formatStatCurrency(totalRevenue), 
            icon: DollarSign 
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
              idx === 4 ? "col-span-2 sm:col-span-1" : ""
            )}
          >
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-base sm:text-lg xl:text-xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Tabs & Filters Bar */}
      <Card className={cn(
        "rounded-2xl p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5",
                  isSelected
                    ? "bg-navy text-white shadow-md"
                    : isDark 
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                      : "text-navy/70 hover:bg-teal-50 hover:text-navy"
                )}
              >
                <tab.icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
                <span>{tab.label}</span>
                {tab.key !== "all" && (
                  <span className={cn(
                    "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                    isSelected 
                      ? "bg-white/20 text-white"
                      : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
                  )}>
                    {orders.filter(o => o.status === tab.key).length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
            <Input
              placeholder="Search by order number, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium",
                isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
              )}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px] h-10 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
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
      </Card>

      {filteredOrders.length === 0 ? (
        <div className={cn(
          "rounded-2xl p-12 text-center",
          isDark ? "border-none bg-[#0a1033]/50 text-slate-300" : "border-2 border-dashed border-navy/20 bg-white/50 text-navy"
        )}>
          <Package className="h-12 w-12 text-teal opacity-60 mx-auto mb-3" />
          <p className="font-bold text-base">No orders found</p>
          <p className={cn("text-xs mt-1", isDark ? "text-slate-400" : "text-navy/70")}>Try changing your search terms or filter selection</p>
        </div>
      ) : (
        <Card className={cn(
          "rounded-2xl overflow-hidden transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-md"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                  <th className="text-left py-3.5 px-4"><span className="hidden sm:inline">Order #</span><span className="sm:hidden">Order</span></th>
                  <th className="text-left py-3.5 px-4"><span className="hidden sm:inline">Customer</span><span className="sm:hidden">Client</span></th>
                  <th className="text-center py-3.5 px-4 hidden sm:table-cell">Items</th>
                  <th className="text-left py-3.5 px-4 whitespace-nowrap"><span className="hidden sm:inline">Order Total</span><span className="sm:hidden">Total</span></th>
                  <th className="text-left py-3.5 px-4"><span className="hidden sm:inline">Status</span><span className="sm:hidden">Stat</span></th>
                  <th className="text-left py-3.5 px-4 hidden md:table-cell">Date</th>
                  <th className="text-right py-3.5 px-4"><span className="hidden sm:inline">Actions</span><span className="sm:hidden">Act</span></th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800/80" : "divide-slate-100")}>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "transition-colors cursor-pointer",
                      selectedOrder?.id === order.id 
                        ? (isDark ? "bg-teal-400/20 text-white" : "bg-teal/40 text-navy")
                        : (isDark ? "hover:bg-teal/50 hover:text-navy" : "hover:bg-teal/50 hover:text-navy")
                    )}
                    onClick={() => {
                      setSelectedOrder(order)
                      setIsViewModalOpen(true)
                    }}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                        )}>
                          <ShoppingCart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                        </div>
                        <div className="min-w-0">
                          <span className={cn("font-extrabold", isDark ? "text-white" : "text-navy")}>
                            #{order.order_number || order.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className={cn("font-bold truncate max-w-[160px]", isDark ? "text-white" : "text-navy")}>
                          {order.customerName || "Unknown Customer"}
                        </p>
                        {order.customerEmail && (
                          <p className={cn("text-xs truncate max-w-[160px]", isDark ? "text-slate-300" : "text-navy/70")}>
                            {order.customerEmail}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell whitespace-nowrap">
                      <span className="w-6 h-6 rounded-full bg-navy/10 dark:bg-white/10 text-xs font-black inline-flex items-center justify-center mx-auto">
                        {order.items?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={cn("font-black tracking-tight whitespace-nowrap", isDark ? "text-white" : "text-navy")}>
                        TSH {Number(order.total).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={cn("text-xs capitalize px-2 py-0.5 rounded-full border", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/70")}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-teal-400/20 text-teal-300 hover:bg-teal-400 hover:text-navy" : "bg-teal-50 text-teal-700 hover:bg-teal hover:text-navy"
                          )}
                          onClick={() => router.push(`/admin/receipts?orderId=${order.id}`)}
                          title="View / Issue Official QLABS Receipt"
                        >
                          <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsViewModalOpen(true)
                          }}
                          title="View order details"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          onClick={() => {
                            setEditingOrder(order)
                            setEditStatus(order.status)
                            setIsEditDialogOpen(true)
                          }}
                          title="Edit order status"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                          )}
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Delete order"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ORDER DETAILS MODAL (Item 02 & Item 03 Theme) */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-2xl sm:rounded-3xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
        )}>
          <DialogHeader className="sr-only">
            <DialogTitle>Order #{selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)} Details</DialogTitle>
            <DialogDescription>Customer order items, billing, shipping and fulfillment status</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Top Bar Header Navigation */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="/turquoise.png" 
                    alt="QuardCubeLabs Logo" 
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        Order #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                      </h2>
                      <Badge variant="outline" className={cn("text-xs capitalize px-2.5 py-0.5 rounded-full border font-bold", getStatusColor(selectedOrder.status))}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      Placed on {new Date(selectedOrder.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/admin/receipts?orderId=${selectedOrder.id}`)}
                    className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 h-9 px-3.5 text-xs"
                  >
                    <Receipt className="h-4 w-4 text-teal" />
                    Issue Receipt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.print()}
                    className={cn("font-bold rounded-xl shadow-xs flex items-center gap-1.5 h-9 px-3.5 text-xs border-2", isDark ? "border-teal/40 text-teal-300 hover:bg-teal/20" : "border-navy/20 text-navy hover:bg-slate-100")}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>

              {/* 2-Column Responsive Grid matching Quotation / Invoice details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Order Items & Financial Totals */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-4",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <div className="flex items-center justify-between border-b border-navy/10 dark:border-teal/20 pb-3">
                      <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                        <Package className="h-4 w-4" />
                        <span>Ordered Items ({selectedOrder.items?.length || 0})</span>
                      </div>
                      <span className="text-xs uppercase font-mono font-bold opacity-70">
                        ID: #{selectedOrder.id.slice(0, 10)}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className={cn("border-b text-[10px] uppercase font-mono font-bold", isDark ? "border-teal/30 text-teal-300" : "border-navy/20 text-navy")}>
                            <th className="text-left py-2 px-2">Item Details</th>
                            <th className="text-center py-2 px-2">Qty</th>
                            <th className="text-right py-2 px-2">Unit Price</th>
                            <th className="text-right py-2 px-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy/10 dark:divide-teal/20">
                          {selectedOrder.items && selectedOrder.items.length > 0 ? (
                            selectedOrder.items.map((item: any, idx: number) => (
                              <tr key={idx} className="transition-colors hover:bg-teal/10">
                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-2.5">
                                    {item.image && (
                                      <div className="w-9 h-9 rounded-lg border border-navy/15 bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                      </div>
                                    )}
                                    <span className="font-bold">{item.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono font-bold">x{item.quantity}</td>
                                <td className="py-2.5 px-2 text-right font-mono">TZS {Number(item.price || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right font-mono font-bold">TZS {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-6 text-center opacity-60">No item records on this order.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-navy/15 dark:border-teal/30 pt-3 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="opacity-80">Subtotal:</span>
                        <span className="font-bold">TZS {Number(selectedOrder.total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Shipping:</span>
                        <span className="font-bold text-emerald-500">FREE</span>
                      </div>
                      <div className="flex justify-between border-t border-navy/20 dark:border-teal/40 pt-2 text-sm font-black">
                        <span className="uppercase">Total Amount:</span>
                        <span>TZS {Number(selectedOrder.total).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 Column: Status & Customer Information */}
                <div className="space-y-6">
                  {/* Status Card (Item 03 Theme) */}
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <div className="flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <ShieldCheck className="h-4 w-4" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Fulfillment Status</h4>
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(val) => handleStatusUpdate(selectedOrder.id, val)}
                        disabled={updatingStatus === selectedOrder.id}
                      >
                        <SelectTrigger className={cn("h-10 rounded-xl border-2 font-bold text-xs", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-white border-navy/20 text-navy")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] opacity-75">Update status directly to synchronize telemetry and notify customer.</p>
                    </div>
                  </div>

                  {/* Customer Information Card (Item 03 Theme) */}
                  <div className={cn(
                    "p-5 rounded-2xl transition-all space-y-3",
                    isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
                  )}>
                    <div className="flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                      <User className="h-4 w-4" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Customer & Delivery</h4>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">Client Name</span>
                        <span className="font-bold text-sm">{selectedOrder.customerName || "Customer Name Not Provided"}</span>
                      </div>
                      {selectedOrder.customerEmail && (
                        <div>
                          <span className="opacity-75 block text-[10px] uppercase font-bold">Email Address</span>
                          <span className="font-medium">{selectedOrder.customerEmail}</span>
                        </div>
                      )}
                      {selectedOrder.customerPhone && (
                        <div>
                          <span className="opacity-75 block text-[10px] uppercase font-bold">Phone Number</span>
                          <span className="font-medium">{selectedOrder.customerPhone}</span>
                        </div>
                      )}
                      <div>
                        <span className="opacity-75 block text-[10px] uppercase font-bold">Shipping Destination</span>
                        <span className="font-medium">{selectedOrder.shippingAddress || "Main Laboratory Address, Dar es Salaam, Tanzania"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Edit Order Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(
          "max-w-md p-5 sm:p-6 rounded-2xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="pb-3 border-b border-navy/10 dark:border-teal/20">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <Edit className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Update Order Status
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
              Change order #{editingOrder?.order_number || editingOrder?.id.slice(0, 8)} fulfillment state
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">
                Select New Status
              </label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold text-sm", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue placeholder="Choose status..." />
                </SelectTrigger>
                <SelectContent className={cn("rounded-xl border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectItem value="pending" className="font-bold">Pending</SelectItem>
                  <SelectItem value="processing" className="font-bold">Processing</SelectItem>
                  <SelectItem value="completed" className="font-bold text-green-600">Completed</SelectItem>
                  <SelectItem value="cancelled" className="font-bold text-brand-red">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs leading-relaxed",
              isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
            )}>
              <span className="font-bold">Notice:</span> Updating the order status will synchronize telemetry and trigger automatic notifications.
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-3 border-t border-navy/10 dark:border-teal/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl border-navy/20 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (editingOrder && editStatus) {
                  await handleStatusUpdate(editingOrder.id, editStatus)
                  setIsEditDialogOpen(false)
                }
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs px-5 shadow-sm"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
