// WhatsApp Business API utility functions

interface WhatsAppSendOptions {
  phone: string
  message: string
}

interface OrderNotificationData {
  orderNumber: string
  customerName: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export async function sendWhatsAppMessage(options: WhatsAppSendOptions) {
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: options.phone,
        message: options.message,
        type: 'text',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to send WhatsApp message:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return null
  }
}

export async function sendOrderNotification(
  phone: string,
  data: OrderNotificationData
) {
  const itemsList = data.items
    .map((item) => `• ${item.name} (x${item.quantity}) - TZS ${item.price.toLocaleString()}`)
    .join('\n')

  const statusEmoji = {
    pending: '⏳',
    processing: '🔄',
    completed: '✅',
    cancelled: '❌',
  }[data.status]

  const message = `
🎉 *Order Update*

Order #${data.orderNumber}
Customer: ${data.customerName}
Status: ${statusEmoji} ${data.status.toUpperCase()}

*Items:*
${itemsList}

*Total:* TZS ${data.total.toLocaleString()}

Thank you for your order!
QuardCube Labs 🚀
+255 623 893 383
  `.trim()

  return sendWhatsAppMessage({
    phone,
    message,
  })
}

export async function sendOrderConfirmation(
  phone: string,
  orderNumber: string,
  customerName: string,
  total: number
) {
  const message = `
✅ *Order Confirmed*

Thank you ${customerName}!

Your order #${orderNumber} has been confirmed.
Total: TZS ${total.toLocaleString()}

We will send you a WhatsApp update when your order is being processed.

📞 Need help? Contact us:
+255 623 893 383

QuardCube Labs 🚀
  `.trim()

  return sendWhatsAppMessage({
    phone,
    message,
  })
}

export async function sendShippingNotification(
  phone: string,
  orderNumber: string,
  trackingInfo?: string
) {
  const message = `
📦 *Your Order is On Its Way!*

Order #${orderNumber} has been shipped!
${trackingInfo ? `Tracking: ${trackingInfo}` : ''}

You will receive it soon. Thank you for your patience!

📞 Questions? Chat with us:
+255 623 893 383

QuardCube Labs 🚀
  `.trim()

  return sendWhatsAppMessage({
    phone,
    message,
  })
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')

  // Handle Tanzanian phone numbers
  if (cleaned.startsWith('255')) {
    return cleaned // Already in international format
  } else if (cleaned.startsWith('0')) {
    return '255' + cleaned.slice(1) // Convert local to international
  }

  return cleaned
}

export function getBusinessWhatsAppUrl(phone: string = '255623893383'): string {
  const formatted = phone.replace(/\D/g, '')
  return `https://wa.me/${formatted}?text=Hello%20QuardCubeLabs%2C%20I%20have%20a%20question`
}
