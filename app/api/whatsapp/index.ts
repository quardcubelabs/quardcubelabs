import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage, sendOrderConfirmation } from '@/lib/whatsapp-utils'

interface WhatsAppNotificationBody {
  type: 'purchase' | 'order_confirmation' | 'order_status' | 'inquiry'
  data: {
    customerName?: string
    customerEmail?: string
    customerPhone?: string
    orderItems?: Array<{
      name: string
      quantity: number
      price: number
    }>
    total?: number
    orderId?: string
    status?: string
    message?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppNotificationBody = await request.json()
    const { type, data } = body

    let result = null

    switch (type) {
      case 'purchase':
        // Notify admin about new purchase
        if (data.customerPhone) {
          // Send order confirmation to customer
          result = await sendOrderConfirmation(
            data.customerPhone,
            data.orderId || 'Unknown',
            data.customerName || 'Valued Customer',
            data.total || 0
          )
        }

        // Send notification to business phone
        const adminMessage = `
🎉 *New Order Received!*

Customer: ${data.customerName || 'Unknown'}
Email: ${data.customerEmail || 'N/A'}
Phone: ${data.customerPhone || 'N/A'}

*Items Ordered:*
${(data.orderItems || [])
  .map((item) => `• ${item.name} (x${item.quantity}) - TZS ${item.price.toLocaleString()}`)
  .join('\n')}

*Total: TZS ${(data.total || 0).toLocaleString()}*

Order ID: ${data.orderId || 'Unknown'}

📞 Action Required: Process this order at your admin panel.
        `.trim()

        // Send to business admin
        result = await sendWhatsAppMessage({
          phone: process.env.WHATSAPP_BUSINESS_PHONE || '255623893383',
          message: adminMessage,
        })
        break

      case 'order_confirmation':
        // Send order confirmation to customer
        result = await sendOrderConfirmation(
          data.customerPhone || '',
          data.orderId || 'Unknown',
          data.customerName || 'Valued Customer',
          data.total || 0
        )
        break

      case 'order_status':
        // Send order status update
        if (data.customerPhone) {
          const statusEmoji = {
            pending: '⏳',
            processing: '🔄',
            completed: '✅',
            cancelled: '❌',
            shipped: '📦',
          }[data.status || 'pending'] || '📋'

          const statusMessage = `
${statusEmoji} *Order Status Update*

Order ID: ${data.orderId || 'Unknown'}
Status: ${(data.status || 'pending').toUpperCase()}

${data.message ? `Message: ${data.message}` : ''}

Thank you for shopping with QuardCube Labs! 🚀
For more info, visit: https://quardcubelabs.com
          `.trim()

          result = await sendWhatsAppMessage({
            phone: data.customerPhone,
            message: statusMessage,
          })
        }
        break

      case 'inquiry':
        // Send inquiry response
        if (data.customerPhone && data.message) {
          const inquiryMessage = `
📨 *Response to Your Inquiry*

${data.message}

We appreciate your interest in QuardCube Labs!
📞 Contact us: +255 623 893 383
🌐 Website: https://quardcubelabs.com
          `.trim()

          result = await sendWhatsAppMessage({
            phone: data.customerPhone,
            message: inquiryMessage,
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unknown notification type' },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to send WhatsApp notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      type,
      result,
      message: 'Notification sent successfully',
    })
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
