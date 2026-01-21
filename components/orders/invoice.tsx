"use client"

import { useRef, useState, useEffect } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import type { Order, OrderItem } from "@/lib/order-actions"
import { countries } from "@/lib/countries"

interface InvoiceProps {
  order: Order
}

export default function Invoice({ order }: InvoiceProps) {
  const componentRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)

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
    // First, try to use authenticated user profile
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
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
        background: white;
      }
      
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          background: white;
        }
        
        /* Watermark using logo image for print */
        .logo-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 350px;
          height: 350px;
          opacity: 0.06;
          z-index: -1;
          pointer-events: none;
          background-image: url('/turquoise.png');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
        }
        
        /* Ensure content appears above watermark */
        .content-layer {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.95);
          padding: 4px;
          border-radius: 4px;
        }
        
        /* Table styling for print */
        .content-layer table {
          background: white !important;
        }
        
        .content-layer th,
        .content-layer td {
          background: white !important;
        }
        
        /* Ensure page breaks work correctly */
        .page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        /* Force minimum content on additional pages */
        .footer-spacer {
          min-height: 50vh;
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

      <div ref={componentRef} className="invoice-container bg-white p-8 rounded-lg relative">
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

        {/* Print-only watermark (faded logo) */}
        <div className="hidden print:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
          <div className="relative w-[350px] h-[350px] opacity-[0.06]">
            <Image
              src="/turquoise.png"
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Header */}
        <div className="content-layer flex justify-between items-start mb-8 border-b border-navy/20 pb-8 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 relative">
              <Image
                src="/turquoise.png"
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
        <div className="content-layer grid grid-cols-2 gap-8 mb-8 relative z-20">
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
              {customerInfo.phone !== 'Not provided' && (
                <p>Phone: {customerInfo.phone}</p>
              )}
              {customerInfo.country !== 'Not provided' && (
                <p>{customerInfo.country}</p>
              )}
              <p>{customerInfo.address}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="content-layer mb-8 relative z-20">
          <table className="w-full bg-white">
            <thead>
              <tr className="border-b-2 border-navy/20">
                <th className="text-left py-3 px-4 bg-white">Item</th>
                <th className="text-center py-3 px-4 bg-white">Qty</th>
                <th className="text-right py-3 px-4 bg-white">Unit Price</th>
                <th className="text-right py-3 px-4 bg-white">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: OrderItem) => (
                <tr key={item.id} className="border-b border-navy/10">
                  <td className="py-3 px-4 bg-white">{item.name}</td>
                  <td className="text-center py-3 px-4 bg-white">{item.quantity}</td>
                  <td className="text-right py-3 px-4 bg-white">TZS {item.price.toFixed(2)}</td>
                  <td className="text-right py-3 px-4 bg-white">TZS {(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="content-layer mb-8 relative z-20">
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
        <div className="content-layer grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative z-20 page-break">
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
              <p>3. All payments should be made through the designated payment methods of QUARDCUBELABS Company Limited.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="content-layer border-t border-navy/20 pt-6 relative z-20">
          <div className="text-center text-navy/70">
            <p className="text-navy font-semibold">© 2025 QuardCubeLabs. All rights reserved.</p>
            <p className="mt-1">Thank you for your business!</p>
          </div>
        </div>

        {/* Spacer to ensure watermark coverage on all pages */}
        <div className="footer-spacer print:block hidden"></div>
        
        {/* Force additional page for watermark demonstration */}
        <div className="page-break print:block hidden opacity-0 pointer-events-none">
          <div style={{ minHeight: '200px', padding: '20px' }}>
            <p className="text-transparent">Additional page content to ensure watermark appears on continuation pages</p>
          </div>
        </div>
      </div>
    </div>
  )
}