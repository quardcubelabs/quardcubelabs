"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Eye, Search, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

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
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  return (
    <main className="min-h-screen bg-teal text-navy">
      <div className="pattern-grid fixed inset-0 pointer-events-none"></div>
      <Navbar />

      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4">
              My <span className="gradient-text">Orders</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy/80 max-w-3xl mx-auto">
              View and manage your orders
            </p>
          </div>

          <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/50 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-10 bg-white/70 border-navy/20 focus:border-navy rounded-full w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === "all" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={selectedStatus === "pending" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedStatus("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={selectedStatus === "completed" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedStatus("completed")}
                >
                  Completed
                </Button>
                <Button
                  variant={selectedStatus === "cancelled" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedStatus("cancelled")}
                >
                  Cancelled
                </Button>
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
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
                        <td className="px-4 py-3">{formatDate(order.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">No orders found</h3>
                <p className="text-navy/70">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
} 