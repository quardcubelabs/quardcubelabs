"use server"

import nodemailer from 'nodemailer'
import type { Order } from '@/lib/order-actions'

// Email configuration - in a real app, these would be environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'your-app-password',
  },
  tls: {
    rejectUnauthorized: false
  }
}

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
 * Send invoice email to customer
 */
export async function sendInvoiceEmail(order: Order, customerEmail: string): Promise<boolean> {
  try {
    // Verify connection first
    await transporter.verify()
    
    const mailOptions = {
      from: `"QuardCubeLabs" <${EMAIL_CONFIG.auth.user}>`,
      to: customerEmail,
      subject: `Invoice for Order #${order.order_number || order.id} - QuardCubeLabs`,
      html: generateInvoiceHTML(order),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Invoice email sent successfully:', info.messageId)
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
      from: `"QuardCubeLabs" <${EMAIL_CONFIG.auth.user}>`,
      to: customerEmail,
      subject: `Order Confirmation #${order.order_number || order.id} - QuardCubeLabs`,
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
            <p style="color: #6b7280;">Need help? Contact us at info@quardcubelabs.com</p>
            <p style="color: #1e3a8a; font-weight: bold;">QuardCubeLabs - Innovative IT Solutions</p>
          </div>
        </div>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Order confirmation email sent successfully:', info.messageId)
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
    console.log('Email server is ready to take our messages')
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
            <p>📧 careers@quardcubelabs.com</p>
            <p>📞 +255 XXX XXX XXX</p>
            <p>🌐 www.quardcubelabs.com</p>
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
      from: `"QuardCubeLabs HR Team" <${EMAIL_CONFIG.auth.user}>`,
      to: applicantData.email,
      subject: `Application Received: ${applicantData.positionTitle} Position - QuardCubeLabs`,
      html: generateApplicationConfirmationHTML(applicantData),
      attachments: [
        {
          filename: 'logo.png',
          path: process.cwd() + '/public/logo.png',
          cid: 'logo'
        }
      ]
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Application confirmation email sent successfully:', info.messageId)
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
    const hrEmail = process.env.HR_EMAIL || process.env.COMPANY_EMAIL || 'hr@quardcubelabs.com'
    
    const mailOptions = {
      from: `"QuardCubeLabs Application System" <${EMAIL_CONFIG.auth.user}>`,
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
    console.log('Application notification sent to HR successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending application notification to HR:', error)
    return false
  }
}
