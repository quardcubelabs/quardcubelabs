"use client"

import { useParams, useRouter } from "next/navigation"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Printer } from "lucide-react"
// import Invoice from "@/components/orders/invoice"
import Image from "next/image"

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    color: "text-amber-500"
  },
  processing: {
    icon: AlertCircle,
    label: "Processing",
    color: "text-blue-500"
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-green-500"
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    color: "text-red-500"
  }
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { orders } = useOrders()
  const order = orders.find(o => o.id === params.id)

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center print:hidden">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-navy/40 mb-4" />
          <h3 className="text-xl font-semibold text-navy mb-2">Order not found</h3>
          <p className="text-navy/70 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[order.status].icon

  return (
    <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 print:p-0 print:pt-0 print:pb-0 print:mt-0">
      <style jsx global>{`
        @media print {
          body > div:first-child,
          nav,
          header,
          [role="navigation"],
          .print\\:hidden {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      <div className="container mx-auto px-4 print:px-0">
        {/* Main content - hidden when printing */}
        <div className="print:hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="border-navy/20 hover:bg-navy/5"
                onClick={() => router.push("/orders")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy">Order Details</h1>
                <p className="text-navy/70 mt-2">Order #{order.id}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-navy/20 hover:bg-navy/5"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>

          <div className="bg-white/50 rounded-2xl border-2 border-navy/20 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-navy/70">Order Date</p>
                <p className="text-lg font-semibold text-navy">
                  {new Date(order.date).toLocaleDateString()}
                </p>
              </div>
              <Badge className={`${statusConfig[order.status].color} bg-white border-2`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusConfig[order.status].label}
              </Badge>
            </div>

            {order.customerName && (
              <div className="mb-6">
                <h3 className="font-semibold text-navy mb-2">Customer Information</h3>
                <div className="space-y-1 text-navy/70">
                  <p>{order.customerName}</p>
                  {order.customerEmail && <p>{order.customerEmail}</p>}
                  {order.shippingAddress && <p>{order.shippingAddress}</p>}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-navy mb-2">Order Items</h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-navy/10 flex items-center justify-center">
                    <Package className="h-8 w-8 text-navy/40" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-navy">{item.name}</h4>
                    <p className="text-navy/70">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-navy">${item.price.toFixed(2)}</p>
                    <p className="text-navy/70">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-navy/10">
              <div className="flex justify-between items-center">
                <p className="text-navy/70">Order Total</p>
                <p className="text-xl font-bold text-navy">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Printable Invoice - visible only when printing */}
        <div className="hidden print:block w-full p-8 font-sans text-navy bg-white shadow-lg rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            {/* Left side: Logo and Company Info */}
            <div className="flex items-center gap-4">
              <Image 
                src="/quardcubelabs.png" 
                alt="QuardCubeLabs Logo" 
                width={100} 
                height={100} 
                className="object-contain print:block"
                priority
                unoptimized
              />
              <div>
                <h2 className="text-2xl font-bold text-navy">QuardCubeLabs</h2>
                <p className="text-sm text-navy/70">Your trusted partner in digital solutions</p>
                <p className="text-sm text-navy/70 mt-1">Email: info@quardcubelabs.com</p>
                <p className="text-sm text-navy/70">Website: www.quardcubelabs.com</p>
              </div>
            </div>
            {/* Right side: Invoice Details */}
            <div className="text-right">
              <h1 className="text-3xl font-bold text-navy mb-2">INVOICE</h1>
              <p className="text-sm text-navy/70">Invoice #<span className="font-semibold text-navy">{order.id}</span></p>
              <p className="text-sm text-navy/70">Date: <span className="font-semibold text-navy">{new Date(order.date).toLocaleDateString()}</span></p>
              <p className="text-sm text-navy/70 mt-4">Order Status: <span className={`font-semibold ${statusConfig[order.status].color}`}>{statusConfig[order.status].label}</span></p>
            </div>
          </div>

          <hr className="border-navy/30 mb-12" />

          {/* Client and Company Address Details */}
          <div className="flex justify-between mb-12">
            {/* Company Address */}
            <div className="w-1/2 pr-4">
              <h3 className="text-lg font-bold text-navy mb-3">From:</h3>
              <p className="text-sm text-navy/80 font-semibold">QuardCubeLabs</p>
              <p className="text-sm text-navy/70">123 Kigamboni</p>
              <p className="text-sm text-navy/70">Dar es salaam, TC 12345</p>
              <p className="text-sm text-navy/70">Tanzania</p>
              <p className="text-sm text-navy/70 mt-2">Phone: +255 652540496</p>
            </div>
            {/* Client Address */}
            <div className="w-1/2 pl-4 text-right">
              <h3 className="text-lg font-bold text-navy mb-3">To:</h3>
              <p className="text-sm text-navy/80 font-semibold">{order.customerName || "N/A"}</p>
              <p className="text-sm text-navy/70">{order.shippingAddress || "N/A"}</p>
              {order.customerEmail && <p className="text-sm text-navy/70 mt-2">Email: {order.customerEmail}</p>}
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-12">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-navy/50 bg-navy/10">
                  <th className="text-left text-sm font-bold text-navy py-3 px-2">Item</th>
                  <th className="text-right text-sm font-bold text-navy py-3 px-2 w-20">Qty</th>
                  <th className="text-right text-sm font-bold text-navy py-3 px-2 w-24">Unit Price</th>
                  <th className="text-right text-sm font-bold text-navy py-3 px-2 w-24">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-navy/10">
                    <td className="text-sm text-navy/80 py-3 px-2">{item.name}</td>
                    <td className="text-right text-sm text-navy/80 py-3 px-2 w-20">{item.quantity}</td>
                    <td className="text-right text-sm text-navy/80 py-3 px-2 w-24">TZS {item.price.toFixed(2)}</td>
                    <td className="text-right text-sm text-navy/80 py-3 px-2 w-24">TZS {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals and Terms */}
          <div className="flex justify-between">
             {/* Terms and Conditions */}
            <div className="w-1/2 pr-4">
               <h3 className="text-lg font-bold text-navy mb-3">Payment Information:</h3>
               {/* Add payment method details here if available in order data */}
               <p className="text-sm text-navy/80 mb-4">Payment Method: Office Pickup</p>
              <h3 className="text-lg font-bold text-navy mb-3">Terms & Conditions:</h3>
              <ol className="list-decimal list-inside text-sm text-navy/80 space-y-1">
                <li>Goods are shipped upon confirmation of 100% payment.</li>
                <li>Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</li>
                <li>All payments should be made through the designated payment methods of BAFREDO Electronics limited.</li> {/* This might need updating if payment methods change */}
              </ol>
            </div>
            {/* Totals */}
            <div className="w-1/2 pl-4 text-right">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-navy/80">
                  <span>Subtotal:</span>
                  <span>TZS {order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-navy/80">
                  <span>Shipping Cost:</span>
                  <span>TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-sm text-navy/80 border-b border-navy/20 pb-2">
                  <span>Tax:</span>
                   {/* Assuming tax is included in total or calculated elsewhere */}
                  <span>TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-xl font-bold text-navy pt-2">
                  <span>TOTAL DUE:</span>
                  <span>TZS {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

           {/* Footer */}
           <div className="mt-12 text-center text-sm text-navy/70">
             <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
             <p className="mt-1">Thank you for your business!</p>
           </div>

           <div className="mt-8 text-right print:hidden">
            <Button 
              className="bg-navy hover:bg-navy/90 text-white rounded-full px-6"
              onClick={() => window.print()}
            >
              Print Invoice
            </Button>
          </div>

        </div>
      </div>
    </section>
  )
}