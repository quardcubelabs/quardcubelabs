"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Package, Check, X } from "lucide-react"
import Image from "next/image"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { orders, getOrder, updateOrderStatus, isLoading: isOrdersLoading } = useOrders()
  const order = getOrder(params.id)

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isAuthLoading, router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
    }).format(amount)
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

  const handleStatusUpdate = async (newStatus: "completed" | "cancelled") => {
    try {
      await updateOrderStatus(params.id, newStatus)
      toast({
        title: "Order status updated",
        description: `Order has been marked as ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  if (isAuthLoading || isOrdersLoading) {
    return (
      <main className="min-h-screen bg-teal text-navy">
        <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-teal text-navy">
        <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
        <Navbar />
        <div className="container mx-auto px-4 pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
            <p className="text-navy/70 mb-8">The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => router.push("/orders")} className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/orders")}
            className="mb-8 hover:bg-navy/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>

          <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Order #{order.id}</h1>
                <p className="text-navy/70">Placed on {formatDate(order.date)}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-white/50 rounded-xl p-4">
                      <div className="relative h-20 w-20 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-navy/70">Quantity: {item.quantity}</p>
                        <p className="text-navy/70">Price: {formatCurrency(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="bg-white/50 rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-navy/70">Subtotal</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy/70">Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t border-navy/20 pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  {order.status === "pending" && (
                    <div className="mt-6 space-y-2">
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate("completed")}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleStatusUpdate("cancelled")}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-white/50 rounded-xl p-6 mt-6">
                  <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                  <div className="space-y-2">
                    <p><span className="text-navy/70">Name:</span> {order.customerName || "N/A"}</p>
                    <p><span className="text-navy/70">Email:</span> {order.customerEmail || "N/A"}</p>
                    <p><span className="text-navy/70">Shipping Address:</span> {order.shippingAddress || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}