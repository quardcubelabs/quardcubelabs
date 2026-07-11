// WhatsApp Business API service for sending notifications

interface WhatsAppTemplateMessage {
  messaging_product: "whatsapp"
  to: string
  type: "template"
  template: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: string
      parameters: Array<{
        type: string
        text: string
      }>
    }>
  }
}

interface WhatsAppTextMessage {
  messaging_product: "whatsapp"
  to: string
  type: "text"
  text: {
    body: string
  }
}

type WhatsAppMessage = WhatsAppTemplateMessage | WhatsAppTextMessage

export class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private businessPhone: string
  private baseUrl = "https://graph.facebook.com/v22.0"

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ""
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ""
    this.businessPhone = process.env.WHATSAPP_BUSINESS_PHONE || ""

    if (!this.accessToken || !this.phoneNumberId || !this.businessPhone) {
      console.warn("WhatsApp API credentials not properly configured")
    }
  }

  private async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("WhatsApp API Error:", response.status, errorText)
        return false
      }

      const result = await response.json()
      console.log("WhatsApp message sent successfully:", result)
      return true
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      return false
    }
  }

  // Send a simple text message
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    const whatsappMessage: WhatsAppTextMessage = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: message
      }
    }

    return this.sendMessage(whatsappMessage)
  }

  // Send the hello_world template
  async sendHelloWorldTemplate(to: string): Promise<boolean> {
    const templateMessage: WhatsAppTemplateMessage = {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    }

    return this.sendMessage(templateMessage)
  }

  // Notify admin about new customer signup
  async notifyNewSignup(customerName: string, customerEmail: string): Promise<boolean> {
    const message = `🎉 NEW CUSTOMER SIGNUP\n\nName: ${customerName}\nEmail: ${customerEmail}\nTime: ${new Date().toLocaleString()}\n\nQuardCubeLabs`
    
    return this.sendTextMessage(this.businessPhone, message)
  }

  // Notify admin about new purchase
  async notifyNewPurchase(
    customerName: string,
    customerEmail: string,
    orderItems: Array<{ name: string; quantity: number; price: number }>,
    total: number,
    orderId?: string
  ): Promise<boolean> {
    const itemsList = orderItems.map(item => 
      `• ${item.name} (Qty: ${item.quantity}) - TZS ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n')

    const message = `💰 NEW PURCHASE ORDER\n\n` +
      `Customer: ${customerName}\n` +
      `Email: ${customerEmail}\n` +
      `${orderId ? `Order ID: ${orderId}\n` : ''}` +
      `\nItems:\n${itemsList}\n\n` +
      `Total: TZS ${total.toLocaleString()}\n` +
      `Time: ${new Date().toLocaleString()}\n\n` +
      `QuardCubeLabs`
    
    return this.sendTextMessage(this.businessPhone, message)
  }

  // Notify admin about new quote request
  async notifyNewQuoteRequest(
    customerName: string,
    customerEmail: string,
    serviceName: string,
    projectDescription: string,
    budget?: string
  ): Promise<boolean> {
    const message = `📋 NEW QUOTE REQUEST\n\n` +
      `Service: ${serviceName}\n` +
      `Customer: ${customerName}\n` +
      `Email: ${customerEmail}\n` +
      `${budget ? `Budget: ${budget}\n` : ''}` +
      `\nProject: ${projectDescription}\n\n` +
      `Time: ${new Date().toLocaleString()}\n\n` +
      `QuardCubeLabs`
    
    return this.sendTextMessage(this.businessPhone, message)
  }

  // Send order confirmation to customer
  async sendOrderConfirmation(
    customerPhone: string,
    customerName: string,
    orderItems: Array<{ name: string; quantity: number; price: number }>,
    total: number,
    orderId?: string
  ): Promise<boolean> {
    const itemsList = orderItems.map(item => 
      `• ${item.name} (${item.quantity}x)`
    ).join('\n')

    const message = `✅ ORDER CONFIRMED\n\n` +
      `Hi ${customerName}!\n\n` +
      `Your order has been confirmed:\n` +
      `${orderId ? `Order ID: ${orderId}\n` : ''}` +
      `\nItems:\n${itemsList}\n\n` +
      `Total: TZS ${total.toLocaleString()}\n\n` +
      `We'll process your order soon. Thank you for choosing QuardCubeLabs!`
    
    return this.sendTextMessage(customerPhone, message)
  }

  // Test WhatsApp connection
  async testConnection(): Promise<boolean> {
    console.log("Testing WhatsApp connection...")
    return this.sendTextMessage(this.businessPhone, "🧪 WhatsApp integration test - QuardCubeLabs")
  }
}

// Singleton instance
export const whatsappService = new WhatsAppService()