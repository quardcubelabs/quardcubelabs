"use client"

import { useParams, useRouter } from "next/navigation"
import { useOrders } from "@/contexts/order-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Printer, ShoppingBag, Receipt, MapPin, User, Mail, Phone } from "lucide-react"
import Image from "next/image"
import { countries } from "@/lib/countries"

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  processing: {
    icon: AlertCircle,
    label: "Processing",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
  },
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { orders } = useOrders()
  const { user } = useAuth()
  const order = orders.find((o) => o.id === params.id)

  const getCustomerInfo = () => {
    if (user && user.user_metadata) {
      const countryName = user.user_metadata.country
        ? countries.find((c) => c.code === user.user_metadata.country)?.name || user.user_metadata.country
        : "Not provided"

      return {
        name: user.user_metadata.name || user.email?.split("@")[0] || "Customer",
        email: user.email || "Not provided",
        phone: user.user_metadata.phone || "Not provided",
        country: countryName,
        address: order?.shippingAddress || `${countryName}`,
      }
    } else if (order?.customerName || order?.customerEmail) {
      return {
        name: order.customerName || "Customer",
        email: order.customerEmail || "Not provided",
        phone: "Not provided",
        country: "Not provided",
        address: order.shippingAddress || "Address not provided",
      }
    } else {
      return {
        name: "Customer Information",
        email: "Not provided",
        phone: "Not provided",
        country: "Not provided",
        address: "Not provided",
      }
    }
  }

  const customerInfo = getCustomerInfo()

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center print:hidden">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-navy/40 mb-4" />
          <h3 className="text-xl font-semibold text-navy mb-2">Order not found</h3>
          <p className="text-navy/70 mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status]
  const StatusIcon = status.icon

  return (
    <section className="min-h-screen bg-teal text-navy pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 print:p-0 print:pt-0 print:pb-0 print:mt-0 print:bg-white">
      <style jsx global>{`
        @media print {
          body > div:first-child,
          nav,
          header,
          [role="navigation"],
          .print\\:hidden {
            display: none !important;
          }
          * {
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-size: 11px;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          section,
          div.container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div className="pattern-grid fixed inset-0 pointer-events-none z-10 print:hidden"></div>
      <div className="container mx-auto px-4 print:px-0 print:mx-0 print:max-w-full">
        {/* Screen header */}
        <div className="print:hidden mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-navy/20 hover:bg-navy/5 rounded-full"
                onClick={() => router.push("/orders")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
                  Order Details
                </h1>
                <p className="text-navy/60 mt-1 text-sm">
                  Order #{order.order_number || order.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-navy/20 hover:bg-navy/5 rounded-full"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>

        {/* Screen content */}
        <div className="print:hidden space-y-6">
          {/* Order Status Banner */}
          <div className="bg-white rounded-2xl border-2 border-navy/10 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${status.bg} ${status.border} border flex items-center justify-center`}>
                  <StatusIcon className={`h-6 w-6 ${status.color}`} />
                </div>
                <div>
                  <p className="text-sm text-navy/60">Status</p>
                  <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-navy/60">Order Date</p>
                <p className="text-lg font-semibold text-navy">
                  {new Date(order.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border-2 border-navy/10 overflow-hidden">
                <div className="p-6 border-b border-navy/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-navy" />
                    </div>
                    <h2 className="text-lg font-bold text-navy">Order Items</h2>
                  </div>
                </div>
                <div className="divide-y divide-navy/10">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-6">
                      <div className="w-16 h-16 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                        <Package className="h-7 w-7 text-navy/30" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-navy truncate">{item.name}</h4>
                        <p className="text-sm text-navy/60">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-navy">${item.price.toFixed(2)}</p>
                        <p className="text-sm text-navy/60">
                          Total: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-navy/5 border-t border-navy/10">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-navy">Order Total</p>
                    <p className="text-2xl font-bold text-navy">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Customer Details */}
              <div className="bg-white rounded-2xl border-2 border-navy/10 overflow-hidden">
                <div className="p-6 border-b border-navy/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-navy" />
                    </div>
                    <h2 className="text-lg font-bold text-navy">Customer</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-navy/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-navy/50 uppercase tracking-wider">Name</p>
                      <p className="text-sm font-medium text-navy">{customerInfo.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-navy/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-navy/50 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-navy">{customerInfo.email}</p>
                    </div>
                  </div>
                  {customerInfo.phone !== "Not provided" && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-navy/40 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-navy/50 uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-medium text-navy">{customerInfo.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-navy/40 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-navy/50 uppercase tracking-wider">Address</p>
                      <p className="text-sm font-medium text-navy">{customerInfo.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="bg-white rounded-2xl border-2 border-navy/10 overflow-hidden">
                <div className="p-6 border-b border-navy/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-navy" />
                    </div>
                    <h2 className="text-lg font-bold text-navy">Summary</h2>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Items</span>
                    <span className="font-medium text-navy">{order.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Subtotal</span>
                    <span className="font-medium text-navy">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-navy/60">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t border-navy/10 pt-3 flex justify-between">
                    <span className="font-bold text-navy">Total</span>
                    <span className="text-lg font-bold text-navy">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Invoice */}
        <div className="hidden print:block w-full p-0 m-0 font-sans text-navy bg-transparent relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Image
              src="/turquoise.png"
              alt="QuardCubeLabs Watermark"
              width={300}
              height={300}
              className="object-contain opacity-30"
              priority
              unoptimized
            />
          </div>

          <div className="relative z-20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/turquoise.png"
                  alt="QuardCubeLabs Logo"
                  width={70}
                  height={70}
                  className="object-contain print:block"
                  priority
                  unoptimized
                />
                <div>
                  <h2 className="text-xl font-bold text-navy">QuardCubeLabs</h2>
                  <p className="text-xs text-navy/70">Your trusted partner in digital solutions</p>
                  <p className="text-xs text-navy/70 mt-0.5">Email: info@quardcubelabs.co.tz</p>
                  <p className="text-xs text-navy/70">Website: www.quardcubelabs.co.tz</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-navy mb-1">INVOICE</h1>
                <p className="text-xs text-navy/70">
                  Invoice #<span className="font-semibold text-navy">{order.order_number || order.id.slice(0, 8)}</span>
                </p>
                <p className="text-xs text-navy/70">
                  Date: <span className="font-semibold text-navy">{new Date(order.date).toLocaleDateString()}</span>
                </p>
                <p className="text-xs text-navy/70 mt-2">
                  Order Status:{" "}
                  <span className={`font-semibold ${status.color}`}>{status.label}</span>
                </p>
              </div>
            </div>

            <hr className="border-navy/30 mb-6" />

            <div className="flex justify-between mb-6">
              <div className="w-1/2 pr-4">
                <h3 className="text-sm font-bold text-navy mb-2">From:</h3>
                <p className="text-xs text-navy/80 font-semibold">QuardCubeLabs</p>
                <p className="text-xs text-navy/70">24 Ferry, Kigamboni</p>
                <p className="text-xs text-navy/70">Dar es Salaam 17101</p>
                <p className="text-xs text-navy/70">Tanzania</p>
                <p className="text-xs text-navy/70 mt-1">Phone: +255 652 540 496</p>
              </div>
              <div className="w-1/2 pl-4 text-right">
                <h3 className="text-sm font-bold text-navy mb-2">To:</h3>
                <p className="text-xs text-navy/80 font-semibold">{customerInfo.name}</p>
                <p className="text-xs text-navy/70">{customerInfo.email}</p>
                {customerInfo.phone !== "Not provided" && (
                  <p className="text-xs text-navy/70">Phone: {customerInfo.phone}</p>
                )}
                {customerInfo.country !== "Not provided" && (
                  <p className="text-xs text-navy/70">{customerInfo.country}</p>
                )}
                <p className="text-xs text-navy/70">{customerInfo.address}</p>
              </div>
            </div>

            <div className="mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-navy/50 bg-transparent">
                    <th className="text-left text-xs font-bold text-navy py-2 px-2">Item</th>
                    <th className="text-right text-xs font-bold text-navy py-2 px-2 w-16">Qty</th>
                    <th className="text-right text-xs font-bold text-navy py-2 px-2 w-24">Unit Price</th>
                    <th className="text-right text-xs font-bold text-navy py-2 px-2 w-24">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b border-navy/10">
                      <td className="text-xs text-navy/80 py-2 px-2">{item.name}</td>
                      <td className="text-right text-xs text-navy/80 py-2 px-2 w-16">{item.quantity}</td>
                      <td className="text-right text-xs text-navy/80 py-2 px-2 w-24">
                        TZS {item.price.toFixed(2)}
                      </td>
                      <td className="text-right text-xs text-navy/80 py-2 px-2 w-24">
                        TZS {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between">
              <div className="w-1/2 pr-4">
                <h3 className="text-sm font-bold text-navy mb-2">Payment Information:</h3>
                <p className="text-xs text-navy/80 mb-3">Payment Method: Office Pickup</p>
                <h3 className="text-sm font-bold text-navy mb-2">Terms & Conditions:</h3>
                <ol className="list-decimal list-inside text-xs text-navy/80 space-y-0.5">
                  <li>Goods are shipped upon confirmation of 100% payment.</li>
                  <li>Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</li>
                  <li>All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</li>
                </ol>
              </div>
              <div className="w-1/2 pl-4 text-right">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-navy/80">
                    <span>Subtotal:</span>
                    <span>TZS {order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-navy/80">
                    <span>Shipping Cost:</span>
                    <span>TZS 0.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-navy/80 border-b border-navy/20 pb-1">
                    <span>Tax:</span>
                    <span>TZS 0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-navy pt-1">
                    <span>TOTAL DUE:</span>
                    <span>TZS {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-navy/70">
              <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
              <p className="mt-0.5">Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
