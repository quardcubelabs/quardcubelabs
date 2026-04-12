import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    let success = false

    switch (type) {
      case 'signup':
        success = await whatsappService.notifyNewSignup(data.name, data.email)
        break

      case 'purchase':
        success = await whatsappService.notifyNewPurchase(
          data.customerName,
          data.customerEmail,
          data.orderItems,
          data.total,
          data.orderId
        )
        break

      case 'quote':
        success = await whatsappService.notifyNewQuoteRequest(
          data.customerName,
          data.customerEmail,
          data.serviceName,
          data.projectDescription,
          data.budget
        )
        break

      case 'order_confirmation':
        success = await whatsappService.sendOrderConfirmation(
          data.customerPhone,
          data.customerName,
          data.orderItems,
          data.total,
          data.orderId
        )
        break

      case 'test':
        success = await whatsappService.testConnection()
        break

      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'WhatsApp API endpoint is active' })
}