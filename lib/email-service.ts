"use server"

import nodemailer from 'nodemailer'
import type { Order } from '@/lib/order-actions'
import { sendQuoteRequestAdminSMS } from '@/lib/sms-service'

// Email configuration using SMTP (Gmail / Brevo)
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'quardcube.labs@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'qcjpweetjsjwcbug',
  },
  tls: {
    rejectUnauthorized: false
  }
}

// Company and Notification email configuration
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || process.env.SMTP_USER || 'quardcube.labs@gmail.com'
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL || process.env.COMPANY_EMAIL || 'quardcube.labs@gmail.com'
const COMPANY_NAME = 'QuardCubeLabs'

// Create reusable transporter object
const transporter = nodemailer.createTransport(EMAIL_CONFIG)

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
          <p>For any questions, please contact our support team at info@quardcubelabs.co.tz</p>
          <p style="margin-top: 20px;">
            <strong>QuardCubeLabs</strong><br>
            Email: info@quardcubelabs.co.tz<br>
            Website: www.quardcubelabs.co.tz
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(order: Order, customerEmail: string): Promise<boolean> {
  try {
    // Verify connection first
    await transporter.verify()
    
    const mailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: customerEmail,
      subject: `Invoice for Order #${order.order_number || order.id} - ${COMPANY_NAME}`,
      html: generateInvoiceHTML(order),
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending invoice email:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Email error details:', {
        message: error.message,
        code: (error as any).code,
        command: (error as any).command,
        response: (error as any).response
      })
    }
    return false
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order: Order, customerEmail: string): Promise<boolean> {
  try {
    // Verify connection first
    await transporter.verify()
    
    const mailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: customerEmail,
      subject: `Order Confirmation #${order.order_number || order.id} - ${COMPANY_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e3a8a;">Order Confirmed!</h1>
            <p style="color: #6b7280; font-size: 16px;">Thank you for your order with QuardCubeLabs</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #1e3a8a; margin-top: 0;">Order Details</h3>
            <p><strong>Order Number:</strong> #${order.order_number || order.id}</p>
            <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> TZS ${order.total.toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1e3a8a;">What's Next?</h3>
            <ul style="color: #6b7280;">
              <li>We'll process your order within 24 hours</li>
              <li>You'll receive a detailed invoice via email</li>
              <li>We'll notify you when your order ships</li>
              <li>Track your order status in your account</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280;">Need help? Contact us at info@quardcubelabs.co.tz</p>
            <p style="color: #1e3a8a; font-weight: bold;">QuardCubeLabs - Innovative IT Solutions</p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Email error details:', {
        message: error.message,
        code: (error as any).code,
        command: (error as any).command,
        response: (error as any).response
      })
    }
    return false
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('Email server configuration error:', error)
    return false
  }
}

/**
 * Generate HTML application confirmation email template
 */
function generateApplicationConfirmationHTML(applicantData: {
  firstName: string
  lastName: string
  positionTitle: string
  applicationDate: string
  applicationId?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Received - QuardCubeLabs</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .logo { color: #1e3a8a; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .title { color: #1e3a8a; font-size: 24px; font-weight: bold; margin: 0; }
        .subtitle { color: #6b7280; font-size: 16px; margin: 5px 0 0 0; }
        .content { margin: 30px 0; }
        .greeting { font-size: 18px; font-weight: 600; color: #1e3a8a; margin-bottom: 15px; }
        .message { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
        .application-details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e3a8a; }
        .detail-item { margin: 8px 0; }
        .detail-label { font-weight: 600; color: #374151; }
        .detail-value { color: #6b7280; }
        .next-steps { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .next-steps h3 { color: #1e3a8a; margin-top: 0; }
        .next-steps ul { color: #4b5563; margin: 10px 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
        .contact-info { margin-top: 20px; }
        .contact-info p { margin: 5px 0; }
        .signature { color: #1e3a8a; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">QUARDCUBELABS</div>
          <h1 class="title">Application Received!</h1>
          <p class="subtitle">Thank you for your interest in joining our team</p>
        </div>

        <div class="content">
          <div class="greeting">Dear ${applicantData.firstName} ${applicantData.lastName},</div>
          
          <div class="message">
            Thank you for your interest in the <strong>${applicantData.positionTitle}</strong> position at QuardCubeLabs. We have successfully received your application and are excited to review your qualifications.
          </div>

          <div class="application-details">
            <h3 style="margin-top: 0; color: #1e3a8a;">Application Details</h3>
            <div class="detail-item">
              <span class="detail-label">Position:</span> 
              <span class="detail-value">${applicantData.positionTitle}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Application Date:</span> 
              <span class="detail-value">${applicantData.applicationDate}</span>
            </div>
            ${applicantData.applicationId ? `
            <div class="detail-item">
              <span class="detail-label">Application ID:</span> 
              <span class="detail-value">#${applicantData.applicationId}</span>
            </div>
            ` : ''}
            <div class="detail-item">
              <span class="detail-label">Status:</span> 
              <span class="detail-value" style="color: #059669; font-weight: 600;">Under Review</span>
            </div>
          </div>

          <div class="next-steps">
            <h3>What Happens Next?</h3>
            <ul>
              <li><strong>Review Process:</strong> Our HR team will carefully review your application and qualifications</li>
              <li><strong>Initial Screening:</strong> If your profile matches our requirements, we'll contact you within 5-7 business days</li>
              <li><strong>Interview Process:</strong> Qualified candidates will be invited for interviews (technical and cultural fit)</li>
              <li><strong>Final Decision:</strong> We'll notify all applicants of our decision regardless of the outcome</li>
            </ul>
          </div>

          <div class="message">
            In the meantime, feel free to explore more about our company culture, projects, and values on our website. We appreciate the time you took to apply and look forward to potentially welcoming you to the QuardCubeLabs family.
          </div>

          <div class="message">
            If you have any questions about your application or the position, please don't hesitate to reach out to our HR team.
          </div>
        </div>

        <div class="footer">
          <div class="signature">Best regards,<br>QuardCubeLabs HR Team</div>
          
          <div class="contact-info">
            <p><strong>QuardCubeLabs</strong></p>
            <p>📧 careers@quardcubelabs.co.tz</p>
            <p>📞 +255 623 893 383</p>
            <p>🌐 www.quardcubelabs.co.tz</p>
            <p>📍 Dar es Salaam, Tanzania</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p>© 2025 QuardCubeLabs. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send application confirmation email to applicant
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
    const mailOptions = {
      from: `"${COMPANY_NAME} HR Team" <${COMPANY_EMAIL}>`,
      to: applicantData.email,
      subject: `Application Received: ${applicantData.positionTitle} Position - ${COMPANY_NAME}`,
      html: generateApplicationConfirmationHTML(applicantData),
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending application confirmation email:', error)
    return false
  }
}

/**
 * Send application notification email to HR team
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
    const hrEmail = process.env.HR_EMAIL || ADMIN_NOTIFICATION_EMAIL
    
    const mailOptions = {
      from: `"${COMPANY_NAME} Application System" <${COMPANY_EMAIL}>`,
      to: hrEmail,
      subject: `New Application: ${applicationData.positionTitle} - ${applicationData.applicantName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .applicant-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Job Application Received</h2>
            </div>
            <div class="content">
              <div class="applicant-info">
                <p><span class="label">Position:</span> ${applicationData.positionTitle}</p>
                <p><span class="label">Applicant:</span> ${applicationData.applicantName}</p>
                <p><span class="label">Email:</span> ${applicationData.applicantEmail}</p>
                <p><span class="label">Application Date:</span> ${applicationData.applicationDate}</p>
                ${applicationData.applicationId ? `<p><span class="label">Application ID:</span> #${applicationData.applicationId}</p>` : ''}
              </div>
              
              ${applicationData.coverLetter ? `
              <div class="applicant-info">
                <p class="label">Cover Letter:</p>
                <p style="font-style: italic; color: #6b7280;">${applicationData.coverLetter}</p>
              </div>
              ` : ''}
              
              <p style="margin-top: 20px;">
                Please review the application in the admin dashboard: 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/applications" style="color: #1e3a8a;">View Applications</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending application notification to HR:', error)
    return false
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(userData: {
  firstName: string
  lastName: string
  email: string
}): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: userData.email,
      subject: `Welcome to ${COMPANY_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${COMPANY_NAME}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .logo { color: #1e3a8a; font-size: 28px; font-weight: bold; }
            .welcome-title { color: #1e3a8a; font-size: 24px; font-weight: bold; margin: 20px 0 10px 0; }
            .content { margin: 20px 0; }
            .greeting { font-size: 18px; font-weight: 600; color: #1e3a8a; margin-bottom: 15px; }
            .message { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .features { background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .features h3 { color: #1e3a8a; margin-top: 0; }
            .features ul { color: #4b5563; margin: 10px 0; padding-left: 20px; }
            .features li { margin: 10px 0; }
            .cta-button { display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">QUARDCUBELABS</div>
              <p style="color: #6b7280;">Innovative IT Solutions</p>
              <h1 class="welcome-title">Welcome Aboard! 🎉</h1>
            </div>

            <div class="content">
              <div class="greeting">Hi ${userData.firstName} ${userData.lastName},</div>
              
              <div class="message">
                Welcome to QuardCubeLabs! We're thrilled to have you join our community of innovators and tech enthusiasts. Your account has been successfully created.
              </div>

              <div class="features">
                <h3>What You Can Do Now</h3>
                <ul>
                  <li><strong>Browse Our Shop:</strong> Discover high-quality computer products and accessories</li>
                  <li><strong>Request a Quote:</strong> Get customized solutions for your business needs</li>
                  <li><strong>Track Orders:</strong> Monitor your purchases in real-time</li>
                  <li><strong>Explore Services:</strong> Learn about our professional IT services</li>
                  <li><strong>Read Our Blog:</strong> Stay updated with the latest tech trends</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quardcubelabs.co.tz'}/shop" class="cta-button">
                  Explore Our Shop
                </a>
              </div>

              <div class="message">
                If you have any questions or need assistance, our support team is always here to help. Feel free to reach out anytime!
              </div>
            </div>

            <div class="footer">
              <p style="color: #1e3a8a; font-weight: bold;">QuardCubeLabs Team</p>
              <p>📧 info@quardcubelabs.co.tz</p>
              <p>🌐 www.quardcubelabs.co.tz</p>
              <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} QuardCubeLabs. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return false
  }
}

/**
 * Send purchase/payment confirmation email
 */
export async function sendPurchaseConfirmationEmail(purchaseData: {
  customerName: string
  customerEmail: string
  orderId: string
  orderNumber: string
  items: Array<{ name: string; quantity: number; price: number }>
  total: number
  paymentMethod: string
  transactionId?: string
}): Promise<boolean> {
  try {
    const itemsHtml = purchaseData.items.map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${item.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">TZS ${item.price.toLocaleString()}</td>
        <td style="padding: 12px; text-align: right;">TZS ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('')

    const mailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: purchaseData.customerEmail,
      subject: `Payment Confirmed - Order #${purchaseData.orderNumber} - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmed - ${COMPANY_NAME}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .logo { color: #1e3a8a; font-size: 28px; font-weight: bold; }
            .success-icon { font-size: 48px; margin: 20px 0; }
            .title { color: #059669; font-size: 24px; font-weight: bold; margin: 10px 0; }
            .order-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background-color: #f9fafb; color: #1e3a8a; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            .items-table td { padding: 12px; }
            .total-row { font-weight: bold; background-color: #f0fdf4; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">QUARDCUBELABS</div>
              <div class="success-icon">✅</div>
              <h1 class="title">Payment Successful!</h1>
              <p style="color: #6b7280;">Your payment has been processed successfully</p>
            </div>

            <div class="order-info">
              <p><strong>Order Number:</strong> #${purchaseData.orderNumber}</p>
              <p><strong>Payment Method:</strong> ${purchaseData.paymentMethod}</p>
              ${purchaseData.transactionId ? `<p><strong>Transaction ID:</strong> ${purchaseData.transactionId}</p>` : ''}
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; font-weight: bold;">Total Paid:</td>
                  <td style="text-align: right; font-weight: bold;">TZS ${purchaseData.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e3a8a; margin-top: 0;">What's Next?</h3>
              <ul style="color: #4b5563;">
                <li>We'll start processing your order immediately</li>
                <li>You'll receive shipping updates via email</li>
                <li>Track your order status in your account</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quardcubelabs.co.tz'}/orders/${purchaseData.orderId}" 
                 style="display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Order
              </a>
            </div>

            <div class="footer">
              <p style="color: #1e3a8a; font-weight: bold;">Thank you for shopping with us!</p>
              <p>📧 info@quardcubelabs.co.tz</p>
              <p>🌐 www.quardcubelabs.co.tz</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error)
    return false
  }
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdateEmail(orderData: {
  customerName: string
  customerEmail: string
  orderNumber: string
  orderId: string
  newStatus: string
  items: Array<{ name: string; quantity: number }>
  trackingNumber?: string
  estimatedDelivery?: string
}): Promise<boolean> {
  try {
    const statusMessages: Record<string, { title: string; message: string; icon: string; color: string }> = {
      processing: {
        title: 'Order Processing',
        message: 'Your order is being prepared and will be shipped soon.',
        icon: '⏳',
        color: '#f59e0b'
      },
      shipped: {
        title: 'Order Shipped',
        message: 'Great news! Your order has been shipped and is on its way.',
        icon: '🚚',
        color: '#3b82f6'
      },
      delivered: {
        title: 'Order Delivered',
        message: 'Your order has been delivered. We hope you love it!',
        icon: '📦',
        color: '#059669'
      },
      cancelled: {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact us.',
        icon: '❌',
        color: '#ef4444'
      },
      pending: {
        title: 'Order Pending',
        message: 'Your order is pending confirmation.',
        icon: '⏰',
        color: '#6b7280'
      }
    }

    const status = statusMessages[orderData.newStatus.toLowerCase()] || statusMessages.processing

    const itemsList = orderData.items.map(item => `<li>${item.name} x ${item.quantity}</li>`).join('')

    const mailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: orderData.customerEmail,
      subject: `${status.title} - Order #${orderData.orderNumber} - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${status.title} - ${COMPANY_NAME}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .logo { color: #1e3a8a; font-size: 28px; font-weight: bold; }
            .status-icon { font-size: 48px; margin: 20px 0; }
            .status-title { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .order-info { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">QUARDCUBELABS</div>
              <div class="status-icon">${status.icon}</div>
              <h1 class="status-title" style="color: ${status.color};">${status.title}</h1>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 16px; color: #4b5563;">Hi ${orderData.customerName},</p>
              <p style="font-size: 16px; color: #4b5563;">${status.message}</p>
            </div>

            <div class="order-info">
              <p><strong>Order Number:</strong> #${orderData.orderNumber}</p>
              <p><strong>Status:</strong> <span style="color: ${status.color}; font-weight: bold; text-transform: capitalize;">${orderData.newStatus}</span></p>
              ${orderData.trackingNumber ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
              ${orderData.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>` : ''}
            </div>

            <div style="margin: 20px 0;">
              <h3 style="color: #1e3a8a;">Order Items</h3>
              <ul style="color: #4b5563;">
                ${itemsList}
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quardcubelabs.co.tz'}/orders/${orderData.orderId}" 
                 style="display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Track Order
              </a>
            </div>

            <div class="footer">
              <p>Need help? Contact us at info@quardcubelabs.co.tz</p>
              <p style="color: #1e3a8a; font-weight: bold;">QuardCubeLabs Team</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending order status update email:', error)
    return false
  }
}

/**
 * Send admin notification for new order to quardcube.labs@gmail.com
 */
export async function sendNewOrderNotificationToAdmin(orderData: {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}): Promise<boolean> {
  try {
    const adminEmail = ADMIN_NOTIFICATION_EMAIL
    
    const itemsList = (orderData.items || []).map(item => 
      `<tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${item.name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">TZS ${Number(item.price).toLocaleString()}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #111827;">TZS ${(Number(item.price) * Number(item.quantity)).toLocaleString()}</td>
      </tr>`
    ).join('')

    const mailOptions = {
      from: `"${COMPANY_NAME} Notifications" <${COMPANY_EMAIL}>`,
      to: adminEmail,
      subject: `🛒 New Order #${orderData.orderNumber} - TZS ${Number(orderData.total).toLocaleString()} - ${orderData.customerName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f3f4f6; }
            .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #000080 0%, #0891b2 100%); color: white; padding: 28px 24px; text-align: center; }
            .content { padding: 28px 24px; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
            .card-title { font-size: 15px; font-weight: 700; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .info-row { margin-bottom: 6px; font-size: 14px; color: #475569; }
            .info-row strong { color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th { background-color: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #000080; border-bottom: 2px solid #cbd5e1; }
            .total-badge { font-size: 22px; font-weight: 800; color: #059669; }
            .btn { display: inline-block; background-color: #000080; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 24px;">🎉 New Customer Order Placed!</h1>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Order #${orderData.orderNumber}</p>
            </div>
            <div class="content">
              <div class="card">
                <div class="card-title">Customer Information</div>
                <div class="info-row"><strong>Name:</strong> ${orderData.customerName}</div>
                <div class="info-row"><strong>Email:</strong> <a href="mailto:${orderData.customerEmail}" style="color: #0891b2;">${orderData.customerEmail}</a></div>
                ${orderData.customerPhone ? `<div class="info-row"><strong>Phone:</strong> ${orderData.customerPhone}</div>` : ''}
                ${orderData.shippingAddress ? `<div class="info-row"><strong>Delivery Address:</strong> ${orderData.shippingAddress}</div>` : ''}
                <div class="info-row"><strong>Date:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })} (EAT)</div>
              </div>

              <div class="card">
                <div class="card-title">Order Items</div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                  </tbody>
                </table>
                <div style="text-align: right; margin-top: 16px; padding-top: 12px; border-top: 2px solid #cbd5e1;">
                  <span style="font-size: 15px; font-weight: 700; color: #1e293b; margin-right: 12px;">Grand Total:</span>
                  <span class="total-badge">TZS ${Number(orderData.total).toLocaleString()}</span>
                </div>
              </div>

              <div style="text-align: center; margin-top: 28px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quardcubelabs.co.tz'}/admin/orders" class="btn">
                  View Order in Admin Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              QuardCubeLabs Notification System &bull; quardcube.labs@gmail.com
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending admin order notification:', error)
    return false
  }
}

/**
 * Send admin notification for customer payment received to quardcube.labs@gmail.com
 */
export async function sendPaymentNotificationToAdmin(paymentData: {
  orderId?: string
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  amount: number
  paymentMethod: string
  transactionId?: string
  items?: Array<{ name: string; quantity: number; price: number }>
  notes?: string
}): Promise<boolean> {
  try {
    const adminEmail = ADMIN_NOTIFICATION_EMAIL

    const itemsHtml = paymentData.items && paymentData.items.length > 0 ? `
      <div class="card">
        <div class="card-title">Paid Items</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${paymentData.items.map(i => `
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${i.name}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${i.quantity}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">TZS ${(Number(i.price) * Number(i.quantity)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''

    const mailOptions = {
      from: `"${COMPANY_NAME} Payments" <${COMPANY_EMAIL}>`,
      to: adminEmail,
      subject: `💰 Payment Received: TZS ${Number(paymentData.amount).toLocaleString()} (${paymentData.paymentMethod.toUpperCase()}) - ${paymentData.customerName || 'Customer'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f3f4f6; }
            .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 28px 24px; text-align: center; }
            .content { padding: 28px 24px; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px; }
            .card-title { font-size: 15px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .info-row { margin-bottom: 6px; font-size: 14px; color: #475569; }
            .info-row strong { color: #1e293b; }
            .amount-badge { font-size: 26px; font-weight: 900; color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th { background-color: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #000080; border-bottom: 2px solid #cbd5e1; }
            .btn { display: inline-block; background-color: #000080; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 24px;">💳 Payment Successfully Received!</h1>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Method: ${paymentData.paymentMethod.toUpperCase()}</p>
            </div>
            <div class="content">
              <div class="card" style="text-align: center; background-color: #ecfdf5; border-color: #a7f3d0;">
                <div style="font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">Amount Received</div>
                <div class="amount-badge">TZS ${Number(paymentData.amount).toLocaleString()}</div>
                <div style="font-size: 13px; color: #047857; margin-top: 4px;">Status: <strong>COMPLETED / VERIFIED</strong></div>
              </div>

              <div class="card">
                <div class="card-title">Payment & Customer Details</div>
                ${paymentData.orderNumber ? `<div class="info-row"><strong>Order Number:</strong> #${paymentData.orderNumber}</div>` : ''}
                ${paymentData.orderId ? `<div class="info-row"><strong>Order ID:</strong> ${paymentData.orderId}</div>` : ''}
                ${paymentData.transactionId ? `<div class="info-row"><strong>Transaction / Reference ID:</strong> <code>${paymentData.transactionId}</code></div>` : ''}
                <div class="info-row"><strong>Payment Method:</strong> ${paymentData.paymentMethod}</div>
                ${paymentData.customerName ? `<div class="info-row"><strong>Customer Name:</strong> ${paymentData.customerName}</div>` : ''}
                ${paymentData.customerEmail ? `<div class="info-row"><strong>Customer Email:</strong> <a href="mailto:${paymentData.customerEmail}" style="color: #0891b2;">${paymentData.customerEmail}</a></div>` : ''}
                ${paymentData.customerPhone ? `<div class="info-row"><strong>Customer Phone:</strong> ${paymentData.customerPhone}</div>` : ''}
                ${paymentData.notes ? `<div class="info-row"><strong>Notes:</strong> ${paymentData.notes}</div>` : ''}
                <div class="info-row"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })} (EAT)</div>
              </div>

              ${itemsHtml}

              <div style="text-align: center; margin-top: 28px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quardcubelabs.co.tz'}/admin/invoices" class="btn">
                  View Invoices in Admin Dashboard
                </a>
              </div>
            </div>
            <div class="footer">
              QuardCubeLabs Notification System &bull; quardcube.labs@gmail.com
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending admin payment notification:', error)
    return false
  }
}

/**
 * Send admin notification when an invoice is printed/downloaded to quardcube.labs@gmail.com
 */
export async function sendInvoicePrintedNotificationToAdmin(invoiceData: {
  invoiceNumber?: string
  orderNumber?: string
  orderId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  total?: number
  items?: Array<{ name: string; quantity: number; price: number }>
  source?: string
  printedAt?: string
}): Promise<boolean> {
  try {
    const adminEmail = ADMIN_NOTIFICATION_EMAIL
    const invoiceNum = invoiceData.invoiceNumber || invoiceData.orderNumber || invoiceData.orderId || 'N/A'

    const itemsSummary = invoiceData.items && invoiceData.items.length > 0
      ? invoiceData.items.map(i => `<li>${i.name} (${i.quantity}x) - TZS ${(Number(i.price) * Number(i.quantity)).toLocaleString()}</li>`).join('')
      : ''

    const mailOptions = {
      from: `"${COMPANY_NAME} Alerts" <${COMPANY_EMAIL}>`,
      to: adminEmail,
      subject: `📄 Invoice Printed: #${invoiceNum} - ${invoiceData.customerName || 'Customer'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f3f4f6; }
            .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 24px; text-align: center; }
            .content { padding: 24px; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
            .card-title { font-size: 15px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
            .info-row { margin-bottom: 6px; font-size: 14px; color: #475569; }
            .info-row strong { color: #1e293b; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0; font-size: 22px;">🖨️ Customer Printed Invoice</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Invoice #${invoiceNum}</p>
            </div>
            <div class="content">
              <div class="card">
                <div class="card-title">Print & Invoice Information</div>
                <div class="info-row"><strong>Invoice / Order Number:</strong> #${invoiceNum}</div>
                ${invoiceData.orderId ? `<div class="info-row"><strong>Order ID:</strong> ${invoiceData.orderId}</div>` : ''}
                ${invoiceData.total !== undefined ? `<div class="info-row"><strong>Total Amount:</strong> <span style="font-weight: 800; color: #059669;">TZS ${Number(invoiceData.total).toLocaleString()}</span></div>` : ''}
                <div class="info-row"><strong>Customer:</strong> ${invoiceData.customerName || 'Customer'}</div>
                ${invoiceData.customerEmail ? `<div class="info-row"><strong>Email:</strong> <a href="mailto:${invoiceData.customerEmail}" style="color: #0891b2;">${invoiceData.customerEmail}</a></div>` : ''}
                ${invoiceData.customerPhone ? `<div class="info-row"><strong>Phone:</strong> ${invoiceData.customerPhone}</div>` : ''}
                <div class="info-row"><strong>Source:</strong> ${invoiceData.source || 'Order Details / Invoice Page'}</div>
                <div class="info-row"><strong>Printed At:</strong> ${invoiceData.printedAt || new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })} (EAT)</div>
              </div>

              ${itemsSummary ? `
                <div class="card">
                  <div class="card-title">Items on Invoice</div>
                  <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
                    ${itemsSummary}
                  </ul>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              QuardCubeLabs Notification System &bull; quardcube.labs@gmail.com
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending invoice print notification:', error)
    return false
  }
}

/**
 * Send admin notification when a quote is printed/downloaded to quardcube.labs@gmail.com
 */
export async function sendQuotePrintedNotificationToAdmin(quoteData: {
  quoteNumber?: string
  serviceTitle: string
  category?: string
  priceEstimate?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  source?: string
  printedAt?: string
}): Promise<boolean> {
  try {
    const adminEmail = ADMIN_NOTIFICATION_EMAIL

    const mailOptions = {
      from: `"${COMPANY_NAME} Quotes" <${COMPANY_EMAIL}>`,
      to: adminEmail,
      subject: `📋 Quote Downloaded/Printed: ${quoteData.serviceTitle} (${quoteData.quoteNumber || 'Estimate'})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f3f4f6; }
            .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: white; padding: 24px; text-align: center; }
            .content { padding: 24px; }
            .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 16px; }
            .card-title { font-size: 15px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
            .info-row { margin-bottom: 6px; font-size: 14px; color: #475569; }
            .info-row strong { color: #1e293b; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin:0; font-size: 22px;">📄 Service Quote Downloaded / Printed</h2>
              <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">Service: ${quoteData.serviceTitle}</p>
            </div>
            <div class="content">
              <div class="card">
                <div class="card-title">Quotation Details</div>
                ${quoteData.quoteNumber ? `<div class="info-row"><strong>Quote Number:</strong> ${quoteData.quoteNumber}</div>` : ''}
                <div class="info-row"><strong>Service Scope:</strong> ${quoteData.serviceTitle}</div>
                ${quoteData.category ? `<div class="info-row"><strong>Category:</strong> ${quoteData.category}</div>` : ''}
                <div class="info-row"><strong>Estimated Price:</strong> <span style="font-weight: 800; color: #0f766e;">${quoteData.priceEstimate || 'Custom Estimate'}</span></div>
                ${quoteData.customerName ? `<div class="info-row"><strong>Client Name:</strong> ${quoteData.customerName}</div>` : ''}
                ${quoteData.customerEmail ? `<div class="info-row"><strong>Client Email:</strong> <a href="mailto:${quoteData.customerEmail}" style="color: #0891b2;">${quoteData.customerEmail}</a></div>` : ''}
                ${quoteData.customerPhone ? `<div class="info-row"><strong>Client Phone:</strong> ${quoteData.customerPhone}</div>` : ''}
                <div class="info-row"><strong>Source:</strong> ${quoteData.source || 'Services Page (Get Quote)'}</div>
                <div class="info-row"><strong>Printed At:</strong> ${quoteData.printedAt || new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' })} (EAT)</div>
              </div>
            </div>
            <div class="footer">
              QuardCubeLabs Notification System &bull; quardcube.labs@gmail.com
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending quote print notification:', error)
    return false
  }
}

/**
 * Server Action: Notify Admin about Order Created
 */
export async function notifyAdminOrderCreatedAction(data: {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress?: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}): Promise<{ success: boolean }> {
  try {
    const success = await sendNewOrderNotificationToAdmin(data)
    return { success }
  } catch (err) {
    console.error("notifyAdminOrderCreatedAction error:", err)
    return { success: false }
  }
}

/**
 * Server Action: Notify Admin about Payment Received
 */
export async function notifyAdminPaymentReceivedAction(data: {
  orderId?: string
  orderNumber?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  amount: number
  paymentMethod: string
  transactionId?: string
  items?: Array<{ name: string; quantity: number; price: number }>
  notes?: string
}): Promise<{ success: boolean }> {
  try {
    const success = await sendPaymentNotificationToAdmin(data)
    return { success }
  } catch (err) {
    console.error("notifyAdminPaymentReceivedAction error:", err)
    return { success: false }
  }
}

/**
 * Server Action: Notify Admin about Invoice Printed
 */
export async function notifyAdminInvoicePrintedAction(data: {
  invoiceNumber?: string
  orderNumber?: string
  orderId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  total?: number
  items?: Array<{ name: string; quantity: number; price: number }>
  source?: string
}): Promise<{ success: boolean }> {
  try {
    const success = await sendInvoicePrintedNotificationToAdmin(data)
    return { success }
  } catch (err) {
    console.error("notifyAdminInvoicePrintedAction error:", err)
    return { success: false }
  }
}

/**
 * Server Action: Notify Admin about Quote Printed
 */
export async function notifyAdminQuotePrintedAction(data: {
  quoteNumber?: string
  serviceTitle: string
  category?: string
  priceEstimate?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  source?: string
}): Promise<{ success: boolean }> {
  try {
    const success = await sendQuotePrintedNotificationToAdmin(data)

    // Send admin SMS notification via NextSMS (non-blocking)
    sendQuoteRequestAdminSMS({
      quoteNumber: data.quoteNumber || 'N/A',
      serviceTitle: data.serviceTitle,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      priceEstimate: data.priceEstimate,
    }).catch(smsErr => console.error("Error sending quote request admin SMS:", smsErr))

    return { success }
  } catch (err) {
    console.error("notifyAdminQuotePrintedAction error:", err)
    return { success: false }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(userData: {
  email: string
  firstName: string
  resetLink: string
}): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: userData.email,
      subject: `Reset Your Password - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - ${COMPANY_NAME}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #1e3a8a; font-size: 28px; font-weight: bold; }
            .content { margin: 20px 0; }
            .button { display: inline-block; background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">QUARDCUBELABS</div>
              <h2 style="color: #1e3a8a;">Password Reset Request</h2>
            </div>

            <div class="content">
              <p>Hi ${userData.firstName},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${userData.resetLink}" class="button">Reset Password</a>
              </div>

              <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
              <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>

            <div class="footer">
              <p>Need help? Contact us at info@quardcubelabs.co.tz</p>
              <p>© ${new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

/**
 * Send contact form submission notification
 */
export async function sendContactFormEmail(contactData: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}): Promise<boolean> {
  try {
    const adminEmail = process.env.CONTACT_EMAIL || ADMIN_NOTIFICATION_EMAIL
    
    const mailOptions = {
      from: `"${COMPANY_NAME} Contact Form" <${COMPANY_EMAIL}>`,
      to: adminEmail,
      replyTo: contactData.email,
      subject: `📬 Contact Form: ${contactData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9fafb; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; }
            .message-box { background-color: white; padding: 20px; margin-top: 15px; border-radius: 8px; border-left: 4px solid #1e3a8a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="info-box">
                <p><span class="label">Name:</span> ${contactData.name}</p>
                <p><span class="label">Email:</span> ${contactData.email}</p>
                ${contactData.phone ? `<p><span class="label">Phone:</span> ${contactData.phone}</p>` : ''}
                <p><span class="label">Subject:</span> ${contactData.subject}</p>
              </div>
              
              <div class="message-box">
                <p class="label">Message:</p>
                <p style="white-space: pre-wrap;">${contactData.message}</p>
              </div>
              
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                You can reply directly to this email to respond to ${contactData.name}.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Error sending contact form email:', error)
    return false
  }
}

/**
 * Send quote request confirmation
 */
export async function sendQuoteRequestEmail(quoteData: {
  customerName: string
  customerEmail: string
  quoteId: string
  projectType: string
  budget?: string
  description: string
}): Promise<boolean> {
  try {
    // Send to customer
    const customerMailOptions = {
      from: `"${COMPANY_NAME}" <${COMPANY_EMAIL}>`,
      to: quoteData.customerEmail,
      subject: `Quote Request Received - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .logo { color: #1e3a8a; font-size: 28px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">QUARDCUBELABS</div>
              <h2 style="color: #1e3a8a;">Quote Request Received</h2>
            </div>

            <p>Hi ${quoteData.customerName},</p>
            <p>Thank you for your interest in our services! We've received your quote request and our team will review it shortly.</p>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Reference ID:</strong> #${quoteData.quoteId}</p>
              <p><strong>Project Type:</strong> ${quoteData.projectType}</p>
              ${quoteData.budget ? `<p><strong>Budget Range:</strong> ${quoteData.budget}</p>` : ''}
            </div>

            <p>We typically respond within 24-48 business hours. If you have any urgent questions, feel free to contact us directly.</p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #1e3a8a; font-weight: bold;">QuardCubeLabs Team</p>
              <p style="color: #6b7280;">quardcube.labs@gmail.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(customerMailOptions)

    // Send to admin
    const adminEmail = process.env.SALES_EMAIL || ADMIN_NOTIFICATION_EMAIL
    const adminMailOptions = {
      from: `"${COMPANY_NAME} Quotes" <${COMPANY_EMAIL}>`,
      to: adminEmail,
      subject: `📋 New Quote Request: ${quoteData.projectType}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .info-box { background-color: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .label { font-weight: bold; color: #374151; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Quote Request</h2>
            </div>
            <div class="content">
              <div class="info-box">
                <p><span class="label">Quote ID:</span> #${quoteData.quoteId}</p>
                <p><span class="label">Customer:</span> ${quoteData.customerName}</p>
                <p><span class="label">Email:</span> ${quoteData.customerEmail}</p>
                <p><span class="label">Project Type:</span> ${quoteData.projectType}</p>
                ${quoteData.budget ? `<p><span class="label">Budget:</span> ${quoteData.budget}</p>` : ''}
              </div>
              
              <div class="info-box">
                <p class="label">Project Description:</p>
                <p style="white-space: pre-wrap;">${quoteData.description}</p>
              </div>
              
              <p style="margin-top: 20px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/quotes" 
                   style="display: inline-block; background-color: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  View in Admin Dashboard
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(adminMailOptions)
    return true
  } catch (error) {
    console.error('Error sending quote request email:', error)
    return false
  }
}