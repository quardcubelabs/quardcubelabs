import type { Order } from '@/lib/order-actions'

// SMS service configuration - in a real app, these would be environment variables
const SMS_CONFIG = {
  apiKey: process.env.SMS_API_KEY || 'your-twilio-api-key',
  apiSecret: process.env.SMS_API_SECRET || 'your-twilio-api-secret',
  fromNumber: process.env.SMS_FROM_NUMBER || '+1234567890',
  serviceName: 'QuardCubeLabs'
}

/**
 * Send SMS using Twilio (placeholder implementation)
 * In a real implementation, you would use a service like Twilio, AWS SNS, or local SMS gateway
 */
async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    // This is a placeholder implementation
    // In a real app, you would integrate with Twilio or another SMS service
    
    console.log(`SMS would be sent to: ${to}`)
    console.log(`Message: ${message}`)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For now, we'll just log the SMS and return success
    // Replace this with actual SMS service integration
    
    /* 
    // Example Twilio integration:
    const twilio = require('twilio')(SMS_CONFIG.apiKey, SMS_CONFIG.apiSecret)
    
    const message = await twilio.messages.create({
      body: message,
      from: SMS_CONFIG.fromNumber,
      to: to
    })
    
    console.log('SMS sent successfully:', message.sid)
    return true
    */
    
    return true
  } catch (error) {
    console.error('Error sending SMS:', error)
    return false
  }
}

/**
 * Format phone number for SMS (ensure it has country code)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // If it doesn't start with country code, assume Tanzania (+255)
  if (cleanPhone.startsWith('0')) {
    return '+255' + cleanPhone.substring(1)
  } else if (cleanPhone.startsWith('255')) {
    return '+' + cleanPhone
  } else if (!cleanPhone.startsWith('+')) {
    return '+255' + cleanPhone
  }
  
  return cleanPhone
}

/**
 * Send order confirmation SMS notification
 */
export async function sendOrderConfirmationSMS(order: Order, phoneNumber: string): Promise<boolean> {
  "use server"
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const message = `🎉 Order Confirmed! 
Order #${order.order_number || order.id}
Total: TZS ${order.total.toLocaleString()}
Status: ${order.status}

We'll process your order within 24hrs. Check your email for invoice details.

- ${SMS_CONFIG.serviceName}
info@quardcubelabs.com`

    return await sendSMS(formattedPhone, message)
  } catch (error) {
    console.error('Error sending order confirmation SMS:', error)
    return false
  }
}

/**
 * Send order status update SMS notification
 */
export async function sendOrderStatusSMS(order: Order, phoneNumber: string, newStatus: string): Promise<boolean> {
  "use server"
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    let statusMessage = ''
    switch (newStatus.toLowerCase()) {
      case 'processing':
        statusMessage = '📦 Your order is now being processed!'
        break
      case 'shipped':
        statusMessage = '🚚 Your order has been shipped!'
        break
      case 'completed':
        statusMessage = '✅ Your order has been delivered!'
        break
      case 'cancelled':
        statusMessage = '❌ Your order has been cancelled.'
        break
      default:
        statusMessage = `📋 Your order status has been updated to: ${newStatus}`
    }

    const message = `${statusMessage}
Order #${order.order_number || order.id}
Total: TZS ${order.total.toLocaleString()}

Track your order: www.quardcubelabs.com/orders

- ${SMS_CONFIG.serviceName}
Need help? Reply or call us.`

    return await sendSMS(formattedPhone, message)
  } catch (error) {
    console.error('Error sending order status SMS:', error)
    return false
  }
}

/**
 * Send payment reminder SMS
 */
export async function sendPaymentReminderSMS(order: Order, phoneNumber: string): Promise<boolean> {
  "use server"
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const message = `💳 Payment Reminder
Order #${order.order_number || order.id}
Amount: TZS ${order.total.toLocaleString()}

Please complete your payment to process your order.
Pay online: www.quardcubelabs.com/orders

- ${SMS_CONFIG.serviceName}
Questions? Contact us anytime.`

    return await sendSMS(formattedPhone, message)
  } catch (error) {
    console.error('Error sending payment reminder SMS:', error)
    return false
  }
}

/**
 * Send welcome SMS for new customers
 */
export async function sendWelcomeSMS(phoneNumber: string, customerName?: string): Promise<boolean> {
  "use server"
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const message = `Welcome to ${SMS_CONFIG.serviceName}! ${customerName ? `Hi ${customerName}! ` : ''}🎉

Thank you for choosing us for your IT solutions. We're excited to serve you!

• Track orders online
• 24/7 customer support
• Quality guaranteed

Visit: www.quardcubelabs.com
Email: info@quardcubelabs.com

- QuardCubeLabs Team`

    return await sendSMS(formattedPhone, message)
  } catch (error) {
    console.error('Error sending welcome SMS:', error)
    return false
  }
}

/**
 * Send promotional SMS (with opt-out option)
 */
export async function sendPromotionalSMS(phoneNumber: string, offerDetails: string): Promise<boolean> {
  "use server"
  
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    const message = `🔥 Special Offer from ${SMS_CONFIG.serviceName}!

${offerDetails}

Shop now: www.quardcubelabs.com/shop
Valid for limited time only!

Reply STOP to opt-out.
- QuardCubeLabs`

    return await sendSMS(formattedPhone, message)
  } catch (error) {
    console.error('Error sending promotional SMS:', error)
    return false
  }
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '')
  // Check if it's a valid length (7-15 digits)
  return cleanPhone.length >= 7 && cleanPhone.length <= 15
}

/**
 * Get SMS service status
 */
export async function getSMSServiceStatus(): Promise<{ available: boolean; message: string }> {
  "use server"
  
  try {
    // In a real implementation, you would check the SMS service status
    // For now, we'll simulate this
    
    if (!SMS_CONFIG.apiKey || SMS_CONFIG.apiKey === 'your-twilio-api-key') {
      return {
        available: false,
        message: 'SMS service not configured. Please set up SMS_API_KEY in environment variables.'
      }
    }
    
    return {
      available: true,
      message: 'SMS service is ready'
    }
  } catch (error) {
    return {
      available: false,
      message: `SMS service error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
