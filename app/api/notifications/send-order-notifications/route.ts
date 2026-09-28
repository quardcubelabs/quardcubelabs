import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceEmail, sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from '@/lib/email-service'
import { sendOrderConfirmationSMS, sendNewOrderAdminSMS } from '@/lib/sms-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, customerInfo, order } = body

    if (!order || !customerInfo) {
      return NextResponse.json(
        { error: 'Order and customer info are required' },
        { status: 400 }
      )
    }

    const results = {
      emailConfirmation: false,
      emailInvoice: false,
      emailAdmin: false,
      sms: false,
      errors: [] as string[]
    }

    // Send admin notification to quardcube.labs@gmail.com
    try {
      results.emailAdmin = await sendNewOrderNotificationToAdmin({
        orderId: order.id || orderId,
        orderNumber: order.order_number || order.id || orderId,
        customerName: customerInfo.name || order.customerName || 'Customer',
        customerEmail: customerInfo.email || order.customerEmail || 'No email',
        customerPhone: customerInfo.phone || undefined,
        shippingAddress: customerInfo.address || order.shippingAddress || undefined,
        total: Number(order.total || 0),
        items: order.items || []
      })
    } catch (adminError) {
      results.errors.push(`Admin email error: ${adminError instanceof Error ? adminError.message : 'Unknown error'}`)
    }

    // Send customer email notifications
    if (customerInfo.email) {
      try {
        results.emailConfirmation = await sendOrderConfirmationEmail(order, customerInfo.email)
        results.emailInvoice = await sendInvoiceEmail(order, customerInfo.email)
      } catch (error) {
        results.errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Send customer SMS notification
    if (customerInfo.phone) {
      try {
        results.sms = await sendOrderConfirmationSMS(order, customerInfo.phone)
      } catch (error) {
        results.errors.push(`SMS error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Send admin SMS alert via NextSMS
    try {
      await sendNewOrderAdminSMS({
        id: order.id || orderId,
        orderNumber: order.order_number || order.id || orderId,
        total: Number(order.total || 0),
        customerName: customerInfo.name || order.customerName || 'Customer',
        customerPhone: customerInfo.phone || undefined,
        itemCount: order.items?.length || 1,
      })
    } catch (smsAdminError) {
      console.error('Error sending admin SMS alert:', smsAdminError)
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Order notifications processed'
    })

  } catch (error) {
    console.error('Error sending order notifications:', error)
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
