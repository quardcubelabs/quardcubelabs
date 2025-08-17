# Order Notification System Setup Guide

This guide explains how to set up and use the order notification system that sends invoices via email and confirmations via SMS when users place orders from the shop page.

## Overview

The notification system includes:
- **Email Service**: Sends order confirmations and detailed invoices
- **SMS Service**: Sends order confirmations and status updates
- **Automatic Triggers**: Notifications are sent automatically when orders are placed
- **Manual Resend**: Users can resend notifications from the orders page

## Files Added/Modified

### New Files
- `lib/email-service.ts` - Email service with nodemailer integration
- `lib/sms-service.ts` - SMS service (Twilio integration ready)
- `app/api/notifications/route.ts` - API endpoint for manual notifications
- `components/orders/notification-actions.tsx` - UI for resending notifications
- `components/admin/notification-tester.tsx` - Admin testing interface
- `.env.example` - Environment configuration template

### Modified Files
- `lib/order-actions.ts` - Added notification sending to order creation
- `components/shop/product-card.tsx` - Updated to pass user info for notifications
- `contexts/order-context.tsx` - Updated to handle customer info with phone
- `app/orders/page.tsx` - Added notification actions component

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```env
# Email Service (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-business-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS Service (Twilio example)
SMS_API_KEY=your-twilio-account-sid
SMS_API_SECRET=your-twilio-auth-token
SMS_FROM_NUMBER=+1234567890

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
COMPANY_NAME=QuardCubeLabs
COMPANY_EMAIL=info@quardcubelabs.com
```

### 2. Email Setup (Gmail)

1. Enable 2-factor authentication on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Use the App Password as `SMTP_PASSWORD` (not your regular password)

### 3. SMS Setup (Twilio)

1. Sign up for [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number for sending SMS
4. Configure the values in your `.env.local`

Alternative: Use local SMS gateway for Tanzania-based services.

### 4. Package Dependencies

The following packages are already installed:
```bash
npm install nodemailer @types/nodemailer
```

## How It Works

### Automatic Flow

1. **User Places Order**: From shop page product card
2. **Order Creation**: Order is saved to database
3. **Email Notifications**: 
   - Order confirmation email sent
   - Detailed invoice email sent
4. **SMS Notification**: Order confirmation SMS sent
5. **User Feedback**: Success message with notification info

### Manual Resend

From the orders page, users can:
- Resend email confirmations
- Resend email invoices  
- Resend SMS confirmations

### User Data Required

For notifications to work, users need:
- **Email**: From user account (required for email notifications)
- **Phone**: From user profile metadata (required for SMS notifications)
- **Name**: From user profile or email prefix

## Features

### Email Service
- ✅ HTML email templates
- ✅ Order confirmation emails
- ✅ Detailed invoice emails with order breakdown
- ✅ Professional styling with company branding
- ✅ Error handling and logging

### SMS Service
- ✅ Order confirmation messages
- ✅ Status update messages
- ✅ Phone number formatting for Tanzania (+255)
- ✅ Character-optimized messages
- ✅ Ready for Twilio integration

### User Interface
- ✅ Enhanced order success messages
- ✅ Notification resend options in orders page
- ✅ Service status indicators
- ✅ Admin testing interface

## Testing

### 1. Using the Admin Tester

Visit the notification tester component (add to admin dashboard):
```tsx
import NotificationTester from '@/components/admin/notification-tester'
```

### 2. Manual API Testing

```bash
# Check service status
curl http://localhost:3000/api/notifications

# Send test notification
curl -X POST http://localhost:3000/api/notifications \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderId": "your-order-id",
    "type": "invoice_email",
    "email": "test@example.com"
  }'
```

### 3. End-to-End Testing

1. Create a test user account
2. Add email and phone to profile
3. Place an order from shop page
4. Check email inbox and phone for notifications
5. Use resend options from orders page

## Troubleshooting

### Email Issues
- **Authentication Error**: Check Gmail App Password setup
- **SMTP Error**: Verify SMTP settings and network access
- **Missing Emails**: Check spam folder and email logs

### SMS Issues
- **SMS Not Sent**: Check Twilio credentials and account balance
- **Invalid Number**: Ensure phone number includes country code
- **Service Unavailable**: Check SMS service configuration

### Common Solutions
- Check environment variables are loaded
- Verify user has email/phone in profile
- Check server logs for detailed error messages
- Ensure proper permissions for external service access

## Security Considerations

- Store sensitive credentials in environment variables only
- Use App Passwords for email services
- Validate phone numbers before sending SMS
- Rate limit notification sending to prevent abuse
- Log notification attempts for audit purposes

## Future Enhancements

Potential improvements:
- Email templates with rich content
- SMS delivery status tracking
- Notification preferences for users
- Bulk notification capabilities
- Integration with push notifications
- WhatsApp Business API integration

## Support

For issues with the notification system:
1. Check the logs in browser console and server
2. Verify environment configuration
3. Test individual services (email/SMS) separately
4. Use the admin tester for debugging

## Configuration Examples

### Different Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**Custom SMTP:**
```env
SMTP_HOST=mail.your-domain.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=your-smtp-password
```

### SMS Providers

**Local Tanzania Gateway:**
```env
SMS_API_URL=http://your-sms-gateway.co.tz/api/send
SMS_API_TOKEN=your-api-token
SMS_FROM_NAME=QuardCubeLabs
```

---

The notification system is now ready to enhance your customer experience with automatic order confirmations and invoices!
