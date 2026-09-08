"use client"

import { useRef, useState, useEffect } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import type { Order, OrderItem } from "@/lib/order-actions"
import { countries } from "@/lib/countries"

interface CustomerOverride {
  name: string
  email: string
  phone?: string
  country?: string
  address?: string
}

interface InvoiceProps {
  order: Order
  customerOverride?: CustomerOverride
  autoPrint?: boolean
  hidePrintButton?: boolean
}

export default function Invoice({ order, customerOverride, autoPrint = false, hidePrintButton = false }: InvoiceProps) {
  const componentRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [hasPrinted, setHasPrinted] = useState(false)

  // Fetch user profile information when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (order.userId && !order.customerName) {
        try {
          // If we have access to the user from auth context
          if (user && user.id === order.userId) {
            const countryName = user.user_metadata?.country 
              ? countries.find(c => c.code === user.user_metadata.country)?.name || user.user_metadata.country
              : 'Not provided'
            
            setUserProfile({
              name: user.user_metadata?.full_name || user.user_metadata?.name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Customer',
              email: user.email || 'Not provided',
              phone: user.phone || user.user_metadata?.phone || 'Not provided',
              country: countryName
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
    }

    fetchUserProfile()
  }, [order.userId, order.customerName, user])

  // Get customer information from order data or user profile
  const getCustomerInfo = () => {
    // First priority: explicit customer override (used by admin invoice page)
    if (customerOverride) {
      return {
        name: customerOverride.name || 'Customer',
        email: customerOverride.email || 'Not provided',
        phone: customerOverride.phone || 'Not provided',
        country: customerOverride.country || 'Not provided',
        address: customerOverride.address || order.shippingAddress || customerOverride.country || 'Not provided'
      }
    }
    // Then, try to use authenticated user profile
    if (user && user.user_metadata) {
      const countryName = user.user_metadata.country 
        ? countries.find(c => c.code === user.user_metadata.country)?.name || user.user_metadata.country
        : 'Not provided'
      
      return {
        name: user.user_metadata.full_name || user.user_metadata.name || `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Customer',
        email: user.email || 'Not provided',
        phone: user.user_metadata.phone || user.phone || 'Not provided',
        country: countryName,
        address: order.shippingAddress || countryName
      }
    }
    // Then, try to use order customer info
    else if (order.customerName || order.customerEmail) {
      return {
        name: order.customerName || 'Customer',
        email: order.customerEmail || 'Not provided',
        phone: 'Not provided',
        country: 'Not provided',
        address: order.shippingAddress || 'Address not provided'
      }
    } 
    // Then, try to use user profile from state
    else if (userProfile) {
      return {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        country: userProfile.country || 'Not provided',
        address: order.shippingAddress || userProfile.country || 'Address not provided'
      }
    }
    // Last resort fallback
    else {
      return {
        name: 'Customer',
        email: 'Not provided',
        phone: 'Not provided',
        country: 'Not provided',
        address: 'Not provided'
      }
    }
  }

  const customerInfo = getCustomerInfo()

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: " ",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 16mm 14mm 14mm 14mm;
      }
      
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        
        html, body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: #000080 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        
        .invoice-container {
          width: 100% !important;
          max-width: 100% !important;
          min-height: calc(297mm - 30mm) !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          margin: 0 auto !important;
          background: transparent !important;
          position: relative !important;
        }
        
        .print-watermark {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }
        .print-watermark img {
          width: 350px !important;
          height: 350px !important;
          object-fit: contain !important;
          opacity: 0.18 !important;
        }

        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Ensure content appears above watermark */
        .content-layer {
          position: relative;
          z-index: 1;
          background: transparent !important;
        }
        
        /* Table styling for print */
        .content-layer table {
          background: transparent !important;
        }
        
        .content-layer th,
        .content-layer td {
          background: transparent !important;
        }
      }
    `,
  })

  // Auto-print effect
  useEffect(() => {
    if (autoPrint && !hasPrinted) {
      handlePrint()
      setHasPrinted(true)
    }
  }, [autoPrint, hasPrinted, handlePrint])

  return (
    <div className="w-full">
      {!hidePrintButton && (
        <Button onClick={handlePrint} className="mb-4">
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
      )}

      <div ref={componentRef} className="invoice-container bg-white p-8 rounded-lg relative min-h-[1050px] flex flex-col justify-between">
        {/* Screen-only watermark - for preview (faded logo) */}
        <div className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-10 print:hidden">
          <div className="relative w-80 h-80 opacity-[0.08]">
            <Image
              src="/turquoise.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Print-only watermark (faded logo on every page) */}
        <div className="print-watermark hidden print:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
          <Image
            src="/turquoise.png"
            alt="QuardCubeLabs Watermark"
            width={350}
            height={350}
            className="object-contain opacity-20"
            priority
            unoptimized
          />
        </div>

        <div>
          {/* Header */}
          <div className="content-layer flex justify-between items-start mb-8 border-b border-navy/20 pb-8 relative z-20">
            <div>
              <h1 className="text-2xl font-bold text-navy">QuardCubeLabs</h1>
              <p className="text-cyan-600 text-[18px]">Your trusted partner in digital solutions</p>
              <p className="text-[18px] text-cyan-600">Email: info@quardcubelabs.com</p>
              <p className="text-[18px] text-cyan-600">Website: www.quardcubelabs.com</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-cyan-500 mb-2">INVOICE</h2>
              <p className="text-navy/70 text-[18px]">Invoice #{order.order_number || `QCL-${new Date(order.date).getFullYear()}-${order.id.slice(0, 4)}`}</p>
              <p className="text-navy/70 text-[18px]">Date: {new Date(order.date).toLocaleDateString()}</p>
              <p className="text-navy/70 text-[18px]">Order Status: <span className="capitalize font-semibold text-cyan-500">{order.status}</span></p>
            </div>
          </div>

          {/* From and To Section */}
          <div className="content-layer grid grid-cols-2 gap-8 mb-8 relative z-20">
            <div>
              <h3 className="font-semibold text-navy mb-4">From:</h3>
              <div className="space-y-1 text-[18px]">
                <p className="font-semibold text-cyan-600 text-[18px]">QuardCubeLabs</p>
                <p className="text-cyan-600 text-[18px]">123 Kigamboni</p>
                <p className="text-cyan-600 text-[18px]">Dar es Salaam, TC 12345</p>
                <p className="text-cyan-600 text-[18px]">Tanzania</p>
                <p className="text-cyan-600 text-[18px]">Phone: +255 652540496</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-navy mb-4">To:</h3>
              <div className="space-y-1 text-[18px]">
                <p className="font-semibold text-cyan-600 text-[18px]">{customerInfo.name}</p>
                <p className="text-cyan-600 text-[18px]">{customerInfo.email}</p>
                {customerInfo.phone !== 'Not provided' && (
                  <p className="text-cyan-600 text-[18px]">Phone: {customerInfo.phone}</p>
                )}
                {customerInfo.country !== 'Not provided' && (
                  <p className="text-cyan-600 text-[18px]">{customerInfo.country}</p>
                )}
                <p className="text-cyan-600 text-[18px]">{customerInfo.address}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="content-layer mb-8 relative z-20">
            <table className="w-full bg-white">
              <thead>
                <tr className="bg-cyan-500 text-white">
                  <th className="text-left py-3 px-4 text-[18px] font-black uppercase tracking-wider">Item</th>
                  <th className="text-center py-3 px-4 text-[18px] font-black uppercase tracking-wider">Qty</th>
                  <th className="text-right py-3 px-4 text-[18px] font-black uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-3 px-4 text-[18px] font-black uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: OrderItem) => (
                  <tr key={item.id} className="border-b border-navy/10">
                    <td className="py-3.5 px-4 bg-white text-[18px] font-medium">{item.name}</td>
                    <td className="text-center py-3.5 px-4 bg-white text-[18px]">{item.quantity}</td>
                    <td className="text-right py-3.5 px-4 bg-white text-[18px]">TZS {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="text-right py-3.5 px-4 bg-white text-[18px]">TZS {(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Information and Totals Section */}
          <div className="avoid-break content-layer grid grid-cols-2 gap-8 mb-8 pt-4 border-t border-navy/10 relative z-20">
            {/* Payment Information */}
            <div>
              <h3 className="font-bold text-navy text-[18px] mb-2.5 uppercase tracking-wider">Payment Information:</h3>
              <div className="space-y-1 text-navy/70 text-[18px] mb-5">
                <p className="text-[18px]">Payment Method: Office Pickup</p>
              </div>
              
              <h3 className="font-bold text-navy text-[18px] mb-2.5 uppercase tracking-wider">Terms & Conditions:</h3>
              <div className="space-y-1.5 text-[18px] text-navy/70">
                <p className="text-[18px]">1. Goods are shipped upon confirmation of 100% payment.</p>
                <p className="text-[18px]">2. Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</p>
                <p className="text-[18px]">3. All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</p>
              </div>
            </div>
            
            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72">
                <div className="flex justify-between py-2 border-b border-navy/10 text-[18px]">
                  <span className="text-navy/70 text-[18px]">Subtotal:</span>
                  <span className="text-cyan-600 text-[18px]">TZS {order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy/10 text-[18px]">
                  <span className="text-navy/70 text-[18px]">Shipping Cost:</span>
                  <span className="text-cyan-600 text-[18px]">TZS 0.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-navy/10 text-[18px]">
                  <span className="text-navy/70 text-[18px]">Tax:</span>
                  <span className="text-cyan-600 text-[18px]">TZS 0.00</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-navy/20 font-bold text-lg">
                  <span className="text-navy">TOTAL DUE:</span>
                  <span className="text-cyan-600">TZS {order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with thank you text pushed to bottom of page */}
        <div className="avoid-break content-layer border-t border-navy/20 pt-6 mt-auto relative z-20">
          <div className="text-center text-navy/70 text-[18px]">
            <p className="text-navy font-semibold text-[18px]">© {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
            <p className="mt-2 text-[18px] font-medium text-navy/90">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  )
}