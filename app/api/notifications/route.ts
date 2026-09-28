import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceEmail, sendOrderConfirmationEmail } from '@/lib/email-service'
import { sendOrderConfirmationSMS, sendOrderStatusSMS, sendSMS, getSMSServiceStatus } from '@/lib/sms-service'
import { getOrderById } from '@/lib/order-actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, type, email, phone, message: customMessage } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Notification type is required' },
        { status: 400 }
      )
    }

    const results = {
      email: false,
      sms: false,
      errors: [] as string[]
    }

    // Direct test SMS or custom SMS
    if (phone && (type === 'test_sms' || type === 'custom_sms')) {
      try {
        const text = customMessage || 'Test notification from QuardCube Labs NextSMS integration.'
        const smsRes = await sendSMS(phone, text, `test_${Date.now()}`)
        results.sms = smsRes.success
        if (!smsRes.success && smsRes.error) {
          results.errors.push(`SMS error: ${smsRes.error}`)
        }
      } catch (error) {
        results.errors.push(`SMS error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      return NextResponse.json({
        success: results.sms,
        results,
        message: results.sms ? 'Test SMS sent successfully' : 'Failed to send test SMS'
      })
    }

    // Order-specific notifications
    if (orderId) {
      // Get order details
      const order = await getOrderById(orderId)
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
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
    }

    return NextResponse.json({
      success: results.email || results.sms,
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
    const isSmsConfigured = !!(process.env.NEXTSMS_AUTH_TOKEN || process.env.SMS_API_KEY)
    const smsStatus = await getSMSServiceStatus()

    return NextResponse.json({
      emailService: {
        configured: !!process.env.SMTP_USER,
        host: process.env.SMTP_HOST || 'Not configured'
      },
      smsService: {
        configured: isSmsConfigured,
        provider: isSmsConfigured ? 'NextSMS (messaging-service.co.tz)' : 'Not configured',
        senderId: process.env.NEXTSMS_SENDER_ID || 'NEXTSMS',
        status: smsStatus
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    )
  }
}
