"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  ArrowLeft, 
  Package, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Trash2, 
  CheckCircle, 
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Loader2
} from "lucide-react"
import AdminLoading from "@/components/admin/admin-loading"
import { getOrderById } from "@/lib/order-actions"
import { adminUpdateOrderStatus, adminDeleteOrder } from "@/lib/admin-actions"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

interface OrderItem {
  id?: string | number
  name: string
  quantity: number
  price: number
  image?: string
}

interface OrderData {
  id: string
  order_number?: string
  user_id?: string
  userId?: string
  items: OrderItem[]
  total: number
  status: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
}

export default function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.id
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadOrder = async () => {
    try {
      const data = await getOrderById(orderId)
      if (data) {
        setOrder(data as OrderData)
      } else {
        setOrder(null)
      }
    } catch (err) {
      console.error("Error loading order:", err)
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    setIsUpdatingStatus(true)

    try {
      await adminUpdateOrderStatus(order.id, newStatus)
      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
      toast({
        title: "Status Updated",
        description: `Order status changed to "${newStatus}". Customer notified via email.`,
      })
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Update Failed",
        description: "Could not update order status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    if (!confirm(`Are you sure you want to cancel and delete order #${order.order_number || order.id.slice(0, 8)}?`)) {
      return
    }

    setIsDeleting(true)
    try {
      await adminDeleteOrder(order.id)
      toast({
        title: "Order Deleted",
        description: "The order has been cancelled and removed.",
      })
      router.push("/admin/orders")
    } catch (err) {
      console.error("Error deleting order:", err)
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 text-white border-green-600 font-black px-3 py-1 text-xs uppercase tracking-wider shadow-xs">Completed</Badge>
      case "processing":
        return <Badge className="bg-teal text-navy border-teal font-black px-3 py-1 text-xs uppercase tracking-wider">Processing</Badge>
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-black px-3 py-1 text-xs uppercase tracking-wider">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-brand-red text-white border-brand-red font-black px-3 py-1 text-xs uppercase tracking-wider">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="font-black px-3 py-1 text-xs capitalize">{status}</Badge>
    }
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (!order) {
    return (
      <div className="min-h-screen py-16 px-4 max-w-2xl mx-auto text-center">
        <div className={cn(
          "p-8 rounded-3xl border-2 shadow-lg",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <Package className="h-16 w-16 mx-auto mb-4 text-brand-red opacity-80" />
          <h2 className="text-2xl font-black mb-2">Order Not Found</h2>
          <p className="text-sm opacity-80 mb-6">
            The order #{orderId} does not exist or has been removed.
          </p>
          <Link href="/admin/orders">
            <Button className="bg-navy hover:bg-navy/85 text-white font-bold rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const createdAtDate = order.created_at || order.createdAt
  const formattedDate = createdAtDate ? new Date(createdAtDate).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }) : "Date unavailable"

  return (
    <div className="min-h-screen pb-16 space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 px-3 font-bold transition-colors",
                isDark 
                  ? "border-teal/30 text-white hover:bg-teal/20" 
                  : "border-navy/20 text-navy hover:bg-navy/10"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className={cn("text-2xl sm:text-3xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                Order #{order.order_number || order.id.slice(0, 8)}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Placed on {formattedDate}
            </p>
          </div>
        </div>

        {/* Delete / Cancel Action */}
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-xl border-brand-red/40 text-brand-red hover:bg-brand-red/10 font-bold h-10 px-4 flex items-center gap-2"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span>Cancel & Delete Order</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-lg transition-all",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20 bg-teal/10 dark:bg-[#070d2b]">
              <CardTitle className="text-base sm:text-lg font-black flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-navy dark:text-white" />
                  Order Items ({order.items?.length || 0})
                </span>
                <span className="text-xs uppercase font-bold tracking-wider opacity-70">
                  Telemetry ID: #{order.id.slice(0, 12)}
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3 px-4">Item Details</th>
                      <th className="text-center py-3 px-4">Qty</th>
                      <th className="text-right py-3 px-4">Unit Price</th>
                      <th className="text-right py-3 px-4">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <tr key={idx} className={cn("transition-colors duration-150 cursor-pointer group", isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy")}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border-2 border-navy/15 bg-white p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-navy/40" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate max-w-xs">{item.name}</p>
                                {item.id && (
                                  <Link 
                                    href={`/shop/${item.id}`} 
                                    target="_blank" 
                                    className="text-xs text-navy dark:text-teal-300 hover:underline flex items-center gap-1 font-medium mt-0.5"
                                  >
                                    View in Shop <ExternalLink className="h-3 w-3 text-navy dark:text-white" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-bold whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-md bg-navy/10 dark:bg-white/10 text-xs font-black inline-block">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-medium whitespace-nowrap">
                            TSH {Number(item.price).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-right font-black whitespace-nowrap">
                            TSH {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm opacity-60">
                          No item records recorded for this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="p-4 sm:p-6 border-t border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-[#070d2b]/50">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm whitespace-nowrap">
                    <span className="opacity-70">Subtotal:</span>
                    <span className="font-bold">TSH {Number(order.total).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm whitespace-nowrap">
                    <span className="opacity-70">Shipping:</span>
                    <span className="font-bold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm whitespace-nowrap">
                    <span className="opacity-70">Tax / VAT:</span>
                    <span className="font-bold">Included</span>
                  </div>
                  <div className="border-t border-navy/10 dark:border-teal/30 pt-2.5 flex justify-between items-baseline whitespace-nowrap">
                    <span className="font-black text-base">Grand Total:</span>
                    <span className="text-xl sm:text-2xl font-black text-navy dark:text-teal-400 whitespace-nowrap tracking-tight">
                      TSH {Number(order.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Customer Details & Order Status Controls */}
        <div className="space-y-6">
          {/* Order Status Controller Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-navy dark:text-white" />
                Manage Order Status
              </h3>
              <p className="text-xs opacity-70">Update the current fulfillment phase</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                Change Status:
              </label>
              <Select
                value={order.status}
                onValueChange={handleStatusChange}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className={cn(
                  "h-11 rounded-xl border-2 font-bold text-sm",
                  isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn("rounded-xl border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectItem value="pending" className="font-bold">Pending Approval</SelectItem>
                  <SelectItem value="processing" className="font-bold">Processing Order</SelectItem>
                  <SelectItem value="completed" className="font-bold text-green-600">Completed & Delivered</SelectItem>
                  <SelectItem value="cancelled" className="font-bold text-brand-red">Cancelled Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs leading-relaxed",
              isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
            )}>
              <span className="font-bold">Automated notification:</span> Changing the order status triggers an automatic email notification directly to the customer.
            </div>
          </Card>

          {/* Customer Information Card */}
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}>
            <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <User className="h-5 w-5 text-navy dark:text-white" />
                Customer Information
              </h3>
              <p className="text-xs opacity-70">Buyer profile & delivery address</p>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</p>
                  <p className="font-bold text-sm">{order.customerName || "Customer Name Not Provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</p>
                  <p className="font-medium text-sm truncate">{order.customerEmail || "No email on record"}</p>
                </div>
              </div>

              {order.customerPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Contact</p>
                    <p className="font-medium text-sm">{order.customerPhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Delivery Address</p>
                  <p className="font-medium text-sm leading-relaxed">{order.shippingAddress || "Physical pickup or digital delivery"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
