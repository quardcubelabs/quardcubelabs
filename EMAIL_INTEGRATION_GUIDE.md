# Email Integration Guide - QuardCubeLabs

## Overview

This document describes the email integration system for QuardCubeLabs, powered by **Brevo SMTP** (formerly Sendinblue). The system handles transactional emails for user registration, orders, purchases, contact forms, and more.

## Configuration

### Environment Variables

Add these to your `.env.local` file and Vercel environment variables:

```env
# Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-user@smtp-brevo.com
SMTP_PASSWORD=your-brevo-smtp-password
BREVO_API_KEY=your-brevo-api-key

# Email Addresses
SMTP_FROM_EMAIL=noreply@quardcubelabs.com
SMTP_FROM_NAME=QuardCubeLabs
COMPANY_EMAIL=info@quardcubelabs.com
ADMIN_EMAIL=admin@quardcubelabs.com
HR_EMAIL=hr@quardcubelabs.com
SALES_EMAIL=sales@quardcubelabs.com
CONTACT_EMAIL=info@quardcubelabs.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://quardcubelabs.com
```

## Email Service Functions

The email service is located at `lib/email-service.ts` and provides the following functions:

### 1. Welcome Email (New Users)
```typescript
import { sendWelcomeEmail } from '@/lib/email-service'

await sendWelcomeEmail({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
})
```

### 2. Order Confirmation
```typescript
import { sendOrderConfirmationEmail } from '@/lib/email-service'

await sendOrderConfirmationEmail(order, customerEmail)
```
*Automatically sent when a new order is created.*

### 3. Invoice Email
```typescript
import { sendInvoiceEmail } from '@/lib/email-service'

await sendInvoiceEmail(order, customerEmail)
```

### 4. Purchase Confirmation
```typescript
import { sendPurchaseConfirmationEmail } from '@/lib/email-service'

await sendPurchaseConfirmationEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  orderId: 'order-123',
  orderNumber: 'ORD-001',
  items: [{ name: 'Product', quantity: 1, price: 100 }],
  total: 100,
  paymentMethod: 'Credit Card',
  transactionId: 'TXN-123'
})
```

### 5. Order Status Updates
```typescript
import { sendOrderStatusUpdateEmail } from '@/lib/email-service'

await sendOrderStatusUpdateEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  orderNumber: 'ORD-001',
  orderId: 'order-123',
  newStatus: 'shipped',
  items: [{ name: 'Product', quantity: 1 }],
  trackingNumber: 'TRK-123',
  estimatedDelivery: 'Dec 25, 2024'
})
```
*Automatically sent when order status is updated.*

### 6. Admin Notification (New Orders)
```typescript
import { sendNewOrderNotificationToAdmin } from '@/lib/email-service'

await sendNewOrderNotificationToAdmin({
  orderId: 'order-123',
  orderNumber: 'ORD-001',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  total: 1500,
  items: [{ name: 'Product', quantity: 1, price: 1500 }]
})
```
*Automatically sent when a new order is created.*

### 7. Contact Form
```typescript
import { sendContactFormEmail } from '@/lib/email-service'

await sendContactFormEmail({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+255123456789',
  subject: 'Inquiry',
  message: 'Hello, I have a question...'
})
```
*Automatically sent when contact form is submitted.*

### 8. Quote Request
```typescript
import { sendQuoteRequestEmail } from '@/lib/email-service'

await sendQuoteRequestEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  quoteId: 'quote-123',
  projectType: 'Web Development',
  budget: '$5,000 - $10,000',
  description: 'Project description...'
})
```

### 9. Password Reset
```typescript
import { sendPasswordResetEmail } from '@/lib/email-service'

await sendPasswordResetEmail({
  email: 'john@example.com',
  firstName: 'John',
  resetLink: 'https://quardcubelabs.com/reset-password?token=xyz'
})
```

### 10. Application Confirmation (Job Applications)
```typescript
import { sendApplicationConfirmationEmail } from '@/lib/email-service'

await sendApplicationConfirmationEmail({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  positionTitle: 'Software Developer',
  applicationDate: 'Dec 15, 2024',
  applicationId: 'app-123'
})
```

### 11. Verify Email Configuration
```typescript
import { verifyEmailConfig } from '@/lib/email-service'

const isConfigured = await verifyEmailConfig()
```

## API Endpoints

### Send Email API
**Endpoint:** `POST /api/email/send`

**Request Body:**
```json
{
  "type": "welcome|order_confirmation|invoice|purchase_confirmation|order_status_update|admin_new_order|contact_form|quote_request|password_reset",
  "data": { ... }
}
```

**Example - Send Welcome Email:**
```javascript
await fetch('/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'welcome',
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    }
  })
})
```

### Check Email Status API
**Endpoint:** `GET /api/email/send`

**Response:**
```json
{
  "configured": true,
  "smtp": {
    "host": "smtp-relay.brevo.com",
    "port": "587",
    "user": "Configured"
  },
  "brevo": {
    "apiKey": "Configured"
  }
}
```

## Automatic Email Triggers

The following emails are sent automatically:

1. **Order Creation** → Order Confirmation (customer) + Admin Notification
2. **Order Status Update** → Status Update Email (customer)
3. **Contact Form Submit** → Contact Form Email (admin)
4. **Job Application** → Application Confirmation (applicant) + HR Notification

## Email Templates

All emails use professional HTML templates with:
- QuardCubeLabs branding (navy blue #1e3a8a)
- Responsive design
- Clear call-to-action buttons
- Company contact information

## Brevo Dashboard

Access your Brevo dashboard to:
- Monitor email delivery rates
- View email logs
- Manage sender reputation
- Configure domain authentication (SPF, DKIM)

**Login:** https://app.brevo.com

## Troubleshooting

### Emails Not Sending
1. Check environment variables are set correctly
2. Verify SMTP credentials in Brevo dashboard
3. Check server logs for error messages
4. Ensure sender email is verified in Brevo

### Emails Going to Spam
1. Set up SPF record for your domain
2. Configure DKIM authentication
3. Add DMARC policy
4. Use consistent sender address

### Testing Locally
```bash
# Test email configuration
curl http://localhost:3000/api/email/send
```

## Deployment Checklist

- [ ] Add all environment variables to Vercel
- [ ] Verify sender domain in Brevo
- [ ] Set up SPF, DKIM, DMARC records
- [ ] Test all email types in production
- [ ] Monitor delivery rates in Brevo dashboard

## Support

For email-related issues, contact:
- **Technical:** dev@quardcubelabs.com
- **Brevo Support:** https://help.brevo.com
