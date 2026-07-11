"use server"

// Mock email service implementation (nodemailer not installed)
// TODO: Install nodemailer when dependency conflicts are resolved
import type { Order } from '@/lib/order-actions'

/**
 * Generate HTML invoice email template
 */
function generateInvoiceHTML(order: Order): string {
  const items = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${item.name}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right;">TZS ${item.price.toLocaleString()}</td>
      <td style="padding: 12px; text-align: right;">TZS ${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - QuardCubeLabs</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .logo { color: #1e3a8a; font-size: 24px; font-weight: bold; }
        .invoice-title { color: #1e3a8a; font-size: 28px; font-weight: bold; margin: 0; }
        .order-id { color: #6b7280; margin: 5px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .details-section h3 { color: #1e3a8a; margin-bottom: 10px; font-size: 18px; }
        .details-section p { margin: 5px 0; color: #6b7280; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background-color: #f9fafb; color: #1e3a8a; padding: 15px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        .items-table td { padding: 12px; }
        .total-row { font-weight: bold; background-color: #f9fafb; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
        .thank-you { color: #1e3a8a; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <div class="logo">QUARDCUBELABS</div>
            <div style="color: #6b7280;">Innovative IT Solutions</div>
          </div>
          <div style="text-align: right;">
            <h1 class="invoice-title">INVOICE</h1>
            <p class="order-id">Order #${order.order_number || order.id}</p>
          </div>
        </div>

        <div class="details-grid">
          <div class="details-section">
            <h3>Order Details</h3>
            <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="text-transform: capitalize;">${order.status}</span></p>
            <p><strong>Order ID:</strong> ${order.id}</p>
          </div>
          ${order.customerName ? `
          <div class="details-section">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> ${order.customerName}</p>
            ${order.customerEmail ? `<p><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
            ${order.shippingAddress ? `<p><strong>Address:</strong> ${order.shippingAddress}</p>` : ''}
          </div>
          ` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
              <td style="text-align: right; font-weight: bold;">TZS ${order.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          <div class="thank-you">Thank you for your business!</div>
          <p>This is a computer-generated invoice, no signature required.</p>
          <p>For any questions, please contact our support team at info@quardcubelabs.com</p>
          <p style="margin-top: 20px;">
            <strong>QuardCubeLabs</strong><br>
            Email: info@quardcubelabs.com<br>
            Website: www.quardcubelabs.com
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Mock function: Send invoice email to customer
 * Currently logs to console instead of sending actual email
 */
export async function sendInvoiceEmail(order: Order, customerEmail: string): Promise<boolean> {
  try {
    // Mock implementation - log instead of sending email
    
    // Return true to simulate successful email sending
    return true
  } catch (error) {
    console.error('❌ Mock Email Service: Error in sendInvoiceEmail:', error)
    return false
  }
}

/**
 * Mock function: Send order confirmation email
 * Currently logs to console instead of sending actual email
 */
export async function sendOrderConfirmationEmail(order: Order, customerEmail: string): Promise<boolean> {
  try {
    // Mock implementation - log instead of sending email
    
    // Return true to simulate successful email sending
    return true
  } catch (error) {
    console.error('❌ Mock Email Service: Error in sendOrderConfirmationEmail:', error)
    return false
  }
}

/**
 * Mock function: Verify email configuration
 * Currently always returns true
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    return true
  } catch (error) {
    console.error('❌ Mock Email Service: Email configuration error (mock):', error)
    return false
  }
}

/**
 * Mock function: Send application confirmation email to applicant
 */
export async function sendApplicationConfirmationEmail(applicantData: {
  firstName: string
  lastName: string
  email: string
  positionTitle: string
  applicationDate: string
  applicationId?: string
}): Promise<boolean> {
  try {
    
    return true
  } catch (error) {
    console.error('❌ Mock Email Service: Error in sendApplicationConfirmationEmail:', error)
    return false
  }
}

/**
 * Mock function: Send application notification email to HR team
 */
export async function sendApplicationNotificationToHR(applicationData: {
  applicantName: string
  applicantEmail: string
  positionTitle: string
  applicationDate: string
  applicationId?: string
  coverLetter?: string
  experience?: string
}): Promise<boolean> {
  try {
    const hrEmail = process.env.HR_EMAIL || process.env.COMPANY_EMAIL || 'hr@quardcubelabs.com'
    
    
    return true
  } catch (error) {
    console.error('❌ Mock Email Service: Error in sendApplicationNotificationToHR:', error)
    return false
  }
}
