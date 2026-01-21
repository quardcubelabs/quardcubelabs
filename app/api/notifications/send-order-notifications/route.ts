import { NextRequest, NextResponse } from 'next/server'
import { sendInvoiceEmail, sendOrderConfirmationEmail } from '@/lib/email-service-mock'
import { sendOrderConfirmationSMS } from '@/lib/sms-service'

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
      sms: false,
      errors: [] as string[]
    }

    // Send email notifications
    if (customerInfo.email) {
      try {
        console.log("Sending order confirmation email...")
        results.emailConfirmation = await sendOrderConfirmationEmail(order, customerInfo.email)
        
        console.log("Sending invoice email...")
        results.emailInvoice = await sendInvoiceEmail(order, customerInfo.email)
      } catch (error) {
        results.errors.push(`Email error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Send SMS notification
    if (customerInfo.phone) {
      try {
        console.log("Sending SMS notification...")
        results.sms = await sendOrderConfirmationSMS(order, customerInfo.phone)
      } catch (error) {
        results.errors.push(`SMS error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
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
