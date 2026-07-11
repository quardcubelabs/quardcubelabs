import { NextRequest, NextResponse } from 'next/server'
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendInvoiceEmail,
  sendPurchaseConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendNewOrderNotificationToAdmin,
  sendContactFormEmail,
  sendQuoteRequestEmail,
  sendPasswordResetEmail,
  verifyEmailConfig
} from '@/lib/email-service'
import { getOrderById } from '@/lib/order-actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      )
    }

    let success = false
    let message = ''

    switch (type) {
      case 'welcome':
        if (!data.firstName || !data.lastName || !data.email) {
          return NextResponse.json(
            { error: 'firstName, lastName, and email are required for welcome emails' },
            { status: 400 }
          )
        }
        success = await sendWelcomeEmail(data)
        message = success ? 'Welcome email sent successfully' : 'Failed to send welcome email'
        break

      case 'order_confirmation':
        if (!data.orderId || !data.email) {
          return NextResponse.json(
            { error: 'orderId and email are required for order confirmation emails' },
            { status: 400 }
          )
        }
        const order = await getOrderById(data.orderId)
        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        success = await sendOrderConfirmationEmail(order, data.email)
        message = success ? 'Order confirmation email sent' : 'Failed to send order confirmation'
        break

      case 'invoice':
        if (!data.orderId || !data.email) {
          return NextResponse.json(
            { error: 'orderId and email are required for invoice emails' },
            { status: 400 }
          )
        }
        const invoiceOrder = await getOrderById(data.orderId)
        if (!invoiceOrder) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        success = await sendInvoiceEmail(invoiceOrder, data.email)
        message = success ? 'Invoice email sent' : 'Failed to send invoice'
        break

      case 'purchase_confirmation':
        if (!data.customerEmail || !data.orderId || !data.orderNumber) {
          return NextResponse.json(
            { error: 'customerEmail, orderId, and orderNumber are required' },
            { status: 400 }
          )
        }
        success = await sendPurchaseConfirmationEmail(data)
        message = success ? 'Purchase confirmation sent' : 'Failed to send purchase confirmation'
        break

      case 'order_status_update':
        if (!data.customerEmail || !data.orderNumber || !data.newStatus) {
          return NextResponse.json(
            { error: 'customerEmail, orderNumber, and newStatus are required' },
            { status: 400 }
          )
        }
        success = await sendOrderStatusUpdateEmail(data)
        message = success ? 'Order status update sent' : 'Failed to send status update'
        break

      case 'admin_new_order':
        if (!data.orderId || !data.orderNumber) {
          return NextResponse.json(
            { error: 'orderId and orderNumber are required' },
            { status: 400 }
          )
        }
        success = await sendNewOrderNotificationToAdmin(data)
        message = success ? 'Admin notification sent' : 'Failed to notify admin'
        break

      case 'contact_form':
        if (!data.name || !data.email || !data.subject || !data.message) {
          return NextResponse.json(
            { error: 'name, email, subject, and message are required' },
            { status: 400 }
          )
        }
        success = await sendContactFormEmail(data)
        message = success ? 'Contact form email sent' : 'Failed to send contact form email'
        break

      case 'quote_request':
        if (!data.customerName || !data.customerEmail || !data.quoteId || !data.projectType) {
          return NextResponse.json(
            { error: 'customerName, customerEmail, quoteId, and projectType are required' },
            { status: 400 }
          )
        }
        success = await sendQuoteRequestEmail(data)
        message = success ? 'Quote request emails sent' : 'Failed to send quote request emails'
        break

      case 'password_reset':
        if (!data.email || !data.firstName || !data.resetLink) {
          return NextResponse.json(
            { error: 'email, firstName, and resetLink are required' },
            { status: 400 }
          )
        }
        success = await sendPasswordResetEmail(data)
        message = success ? 'Password reset email sent' : 'Failed to send password reset email'
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success, message })

  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process email request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check email service status
export async function GET() {
  try {
    const isConfigured = await verifyEmailConfig()
    
    return NextResponse.json({
      configured: isConfigured,
      smtp: {
        host: process.env.SMTP_HOST || 'Not configured',
        port: process.env.SMTP_PORT || 'Not configured',
        user: process.env.SMTP_USER ? 'Configured' : 'Not configured'
      },
      brevo: {
        apiKey: process.env.BREVO_API_KEY ? 'Configured' : 'Not configured'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
