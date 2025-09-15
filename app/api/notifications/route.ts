import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceEmail, sendOrderConfirmationEmail } from '@/lib/email-service'
import { sendOrderConfirmationSMS, sendOrderStatusSMS } from '@/lib/sms-service'
import { getOrderById } from '@/lib/order-actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, type, email, phone } = body

    if (!orderId || !type) {
      return NextResponse.json(
        { error: 'Order ID and notification type are required' },
        { status: 400 }
      )
    }

    // Get order details
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const results = {
      email: false,
      sms: false,
      errors: [] as string[]
    }

    // Send email notifications
    if (email && type.includes('email')) {
      try {
        if (type === 'invoice' || type === 'invoice_email') {
          results.email = await sendInvoiceEmail(order, email)
        } else if (type === 'confirmation' || type === 'confirmation_email') {
          results.email = await sendOrderConfirmationEmail(order, email)
        }
      } catch (error) {
        results.errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Send SMS notifications
    if (phone && type.includes('sms')) {
      try {
        if (type === 'confirmation' || type === 'confirmation_sms') {
          results.sms = await sendOrderConfirmationSMS(order, phone)
        } else if (type === 'status_sms') {
          results.sms = await sendOrderStatusSMS(order, phone, order.status)
        }
      } catch (error) {
        results.errors.push(`SMS error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Notifications processed'
    })

  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check notification service status
export async function GET() {
  try {
    return NextResponse.json({
      emailService: {
        configured: !!process.env.SMTP_USER,
        host: process.env.SMTP_HOST || 'Not configured'
      },
      smsService: {
        configured: !!process.env.SMS_API_KEY,
        provider: process.env.SMS_API_KEY ? 'Configured' : 'Not configured'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    )
  }
}
