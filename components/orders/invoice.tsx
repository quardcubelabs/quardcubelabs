"use client"

import { useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import type { Order } from "@/contexts/order-context"

interface InvoiceProps {
  order: Order
}

export default function Invoice({ order }: InvoiceProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
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

      <div ref={componentRef} className="bg-white p-8 rounded-lg shadow-lg">
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
              <h1 className="text-2xl font-bold text-navy">QUARDCUBELABS</h1>
              <p className="text-navy/70">Innovative IT Solutions</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-navy mb-2">INVOICE</h2>
            <p className="text-navy/70">#{order.id}</p>
          </div>
        </div>

        {/* Order and Customer Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-navy mb-2">Order Details</h3>
            <div className="space-y-1 text-navy/70">
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              <p>Status: <span className="capitalize">{order.status}</span></p>
            </div>
          </div>
          {order.customerName && (
            <div>
              <h3 className="font-semibold text-navy mb-2">Customer Details</h3>
              <div className="space-y-1 text-navy/70">
                <p>{order.customerName}</p>
                {order.customerEmail && <p>{order.customerEmail}</p>}
                {order.shippingAddress && <p>{order.shippingAddress}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-navy/20">
                <th className="text-left py-3 px-4">Item</th>
                <th className="text-right py-3 px-4">Quantity</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-navy/10">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="text-right py-3 px-4">{item.quantity}</td>
                  <td className="text-right py-3 px-4">${item.price.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right py-4 px-4 font-bold">Total:</td>
                <td className="text-right py-4 px-4 font-bold">${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-navy/20 pt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-navy mb-2">Payment Information</h3>
              <p className="text-navy/70">Payment Method: Credit Card</p>
              <p className="text-navy/70">Transaction ID: {order.id}</p>
            </div>
            <div>
              <h3 className="font-semibold text-navy mb-2">Shipping Information</h3>
              <p className="text-navy/70">Standard Shipping: 3-5 business days</p>
              <p className="text-navy/70">Tracking Number: Will be provided</p>
            </div>
          </div>
          <div className="mt-8 text-center text-navy/70 text-sm">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice, no signature required.</p>
            <p className="mt-2">For any questions, please contact our support team.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 