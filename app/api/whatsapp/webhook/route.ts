import { NextRequest, NextResponse } from 'next/server'

// Webhook for receiving WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log incoming message for debugging
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Check if this is a message event
    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || []

      for (const entry of entries) {
        const changes = entry.changes || []

        for (const change of changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages || []
            const contacts = change.value.contacts || []

            for (const message of messages) {
              const senderPhone = change.value.messages[0]?.from
              const senderName = contacts[0]?.profile?.name || 'Unknown'
              const messageText = message.text?.body || ''
              const timestamp = message.timestamp

              // Log message details
              console.log({
                from: senderPhone,
                name: senderName,
                message: messageText,
                timestamp: new Date(parseInt(timestamp) * 1000),
              })

              // TODO: Store message in database
              // TODO: Send auto-reply message
              // TODO: Notify admin via email
            }
          }
        }
      }

      // Return 200 to acknowledge receipt
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json({ success: false }, { status: 400 })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
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
      console.log('Webhook verified')
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
