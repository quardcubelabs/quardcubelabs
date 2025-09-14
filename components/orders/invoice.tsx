"use client"

import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import type { Order, OrderItem } from "@/lib/order-actions"

interface InvoiceProps {
  order: Order
}

export default function Invoice({ order }: InvoiceProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  // Get customer information from order data
  const getCustomerInfo = () => {
    if (order.customerName || order.customerEmail) {
      return {
        name: order.customerName || 'Customer',
        email: order.customerEmail || 'Not provided',
        address: order.shippingAddress || 'Address not provided'
      }
    } else {
      return {
        name: 'Customer Information',
        email: 'Not provided',
        address: 'Not provided'
      }
    }
  }

  const customerInfo = getCustomerInfo()

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  })

  return (
    <div className="w-full">
      <Button onClick={handlePrint} className="mb-4">
        <Printer className="h-4 w-4 mr-2" />
        Print Invoice
      </Button>

      <div ref={componentRef} className="bg-white p-8 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-navy/20 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/logo.png"
                alt="QUARDCUBELABS"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">QuardCubeLabs</h1>
              <p className="text-navy/70">Your trusted partner in digital solutions</p>
              <p className="text-sm text-navy/60">Email: info@quardcubelabs.com</p>
              <p className="text-sm text-navy/60">Website: www.quardcubelabs.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-navy mb-2">INVOICE</h2>
            <p className="text-navy/70">Invoice #{order.order_number || order.id.slice(0, 8)}</p>
            <p className="text-navy/70">Date: {new Date(order.date).toLocaleDateString()}</p>
            <p className="text-navy/70">Order Status: <span className="capitalize font-semibold">{order.status}</span></p>
          </div>
        </div>

        {/* From and To Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-navy mb-4">From:</h3>
            <div className="space-y-1 text-navy/70">
              <p className="font-semibold">QuardCubeLabs</p>
              <p>123 Kigamboni</p>
              <p>Dar es Salaam, TC 12345</p>
              <p>Tanzania</p>
              <p>Phone: +255 652540496</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-navy mb-4">To:</h3>
            <div className="space-y-1 text-navy/70">
              <p className="font-semibold">{customerInfo.name}</p>
              <p>{customerInfo.email}</p>
              <p>{customerInfo.address}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-navy/20">
                <th className="text-left py-3 px-4">Item</th>
                <th className="text-center py-3 px-4">Qty</th>
                <th className="text-right py-3 px-4">Unit Price</th>
                <th className="text-right py-3 px-4">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: OrderItem) => (
                <tr key={item.id} className="border-b border-navy/10">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="text-center py-3 px-4">{item.quantity}</td>
                  <td className="text-right py-3 px-4">TZS {item.price.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">TZS {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Subtotal:</span>
                <span className="text-navy">TZS {order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Shipping Cost:</span>
                <span className="text-navy">TZS 0.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-navy/10">
                <span className="text-navy/70">Tax:</span>
                <span className="text-navy">TZS 0.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-navy/20 font-bold text-lg">
                <span className="text-navy">TOTAL DUE:</span>
                <span className="text-navy">TZS {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information and Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-navy mb-3">Payment Information:</h3>
            <div className="space-y-1 text-navy/70">
              <p>Payment Method: Office Pickup</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-navy mb-3">Terms & Conditions:</h3>
            <div className="space-y-1 text-sm text-navy/70">
              <p>1. Goods are shipped upon confirmation of 100% payment.</p>
              <p>2. Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</p>
              <p>3. All payments should be made through the designated payment methods of BAFREDO Electronics limited.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-navy/20 pt-6">
          <div className="text-center text-navy/70">
            <p className="text-navy font-semibold">© 2025 QuardCubeLabs. All rights reserved.</p>
            <p className="mt-1">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  )
}