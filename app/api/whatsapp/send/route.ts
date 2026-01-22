import { NextRequest, NextResponse } from 'next/server'

// WhatsApp message type
interface WhatsAppMessage {
  phone: string
  message: string
  type?: 'text' | 'order_notification' | 'order_status'
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: 'WhatsApp Business API credentials not configured' },
        { status: 500 }
      )
    }

    const body: WhatsAppMessage = await request.json()
    const { phone, message, type = 'text' } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      )
    }

    // Format phone number (ensure it's international format without +)
    const formattedPhone = phone.replace(/\D/g, '').replace(/^255/, '255')

    // Send message via WhatsApp Business API
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: message,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('WhatsApp API error:', error)
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: error },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
      message: 'Message sent successfully',
    })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'quardcube_whatsapp_verify_token_2024'

    if (mode === 'subscribe' && token === verifyToken) {
      return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error verifying webhook:', error)
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 500 }
    )
  }
}
