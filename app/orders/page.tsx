"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Eye, Search, Package } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { DatabaseStatus, DatabaseErrorFallback } from "@/components/database-status"

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { orders, isLoading: isOrdersLoading } = useOrders()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "completed" | "cancelled">("all")

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isAuthLoading, router])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A"
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return "TZS 0"
    }
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
    }).format(amount)
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800"
    
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800"
      case "processing":
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isAuthLoading || isOrdersLoading) {
    return (
      <main className="min-h-screen bg-teal text-navy">
        <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">ORDERS MADE</h1>

            <DatabaseStatus>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-navy/20 p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-navy/40 mb-4" />
                    <h3 className="text-xl font-semibold text-navy mb-2">No Orders Yet</h3>
                    <p className="text-navy/70 mb-6">You haven't placed any orders yet.</p>
                    <Button
                      onClick={() => router.push("/shop")}
                      className="bg-navy hover:bg-navy/90 text-white"
                    >
                      Start Shopping
                    </Button>
                  </div>
              ) : (
                <>
                  {/* Search and Filters */}
                  <div className="mb-6">
                    <div className="relative w-full max-w-xs mb-4">
                      <Input
                        type="text"
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white/70"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Status Filters - Mobile Optimized */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                      onClick={() => setSelectedStatus("all")}
                      variant={selectedStatus === "all" ? "default" : "outline"}
                      className={selectedStatus === "all" ? "bg-navy text-white hover:bg-navy/90" : "text-xs sm:text-sm"}
                      size="sm"
                    >
                      All Orders
                    </Button>
                    <Button
                      onClick={() => setSelectedStatus("completed")}
                      variant={selectedStatus === "completed" ? "default" : "outline"}
                      className={selectedStatus === "completed" ? "bg-green-600 hover:bg-green-700 text-white" : "text-xs sm:text-sm"}
                      size="sm"
                    >
                      Completed
                    </Button>
                    <Button
                      onClick={() => setSelectedStatus("pending")}
                      variant={selectedStatus === "pending" ? "default" : "outline"}
                      className={selectedStatus === "pending" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "text-xs sm:text-sm"}
                      size="sm"
                    >
                      Pending
                    </Button>
                    <Button
                      onClick={() => setSelectedStatus("cancelled")}
                      variant={selectedStatus === "cancelled" ? "default" : "outline"}
                      className={selectedStatus === "cancelled" ? "bg-red-600 hover:bg-red-700 text-white" : "text-xs sm:text-sm"}
                      size="sm"
                    >
                      Cancelled
                    </Button>
                  </div>

                  {/* Orders Table - Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-navy text-white">
                          <th className="px-4 py-3 text-left">Order</th>
                          <th className="px-4 py-3 text-left">Customer Name</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/10">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-navy/5">
                            <td className="px-4 py-3">{order.id}</td>
                            <td className="px-4 py-3">{order.customerName || "N/A"}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(order.total)}</td>
                            <td className="px-4 py-3">
                              {formatDate(order.createdAt || order.created_at || order.date)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Unknown"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/orders/${order.id}`)}
                                className="hover:bg-navy/10"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Orders Cards - Mobile */}
                  <div className="md:hidden space-y-4">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg border border-navy/20 p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-navy">Order #{order.id}</h3>
                            <p className="text-sm text-navy/70">{order.customerName || "N/A"}</p>
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-semibold text-navy">{formatCurrency(order.total)}</p>
                            <p className="text-sm text-navy/70">
                              {formatDate(order.createdAt || order.created_at || order.date)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="border-navy text-navy hover:bg-navy hover:text-white"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button variant="outline" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" className="bg-navy text-white">
                      1
                    </Button>
                    <Button variant="outline" disabled>
                      Next
                    </Button>
                  </div>
                </>
              )}
              </div>
            </DatabaseStatus>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 