# WhatsApp Business API Integration Guide

## Overview
This document explains the WhatsApp Business API integration implemented in the QuardCubeLabs application. The integration sends notifications for customer signups, purchases, and quote requests.

## Configuration

### Environment Variables
The following environment variables must be set in your `.env.local` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_PHONE=your_business_phone_number_here
```

### Where to Get These Values

1. **Access Token**: 
   - Go to Facebook Developer Console
   - Create a WhatsApp Business API app
   - Generate a permanent access token

2. **Phone Number ID**: 
   - Found in your WhatsApp Business API configuration
   - This is the ID of your WhatsApp Business phone number

3. **Business Phone**: 
   - Your WhatsApp Business phone number (e.g., 255623893383)
   - This is where notifications will be sent

## Features Implemented

### 1. Customer Signup Notifications
- **Trigger**: When a new customer registers
- **Recipient**: Business WhatsApp number
- **Content**: Customer name, email, and signup timestamp

### 2. Purchase Order Notifications
- **Trigger**: When a customer places an order
- **Recipients**: 
  - Business WhatsApp number (admin notification)
  - Customer's WhatsApp number (order confirmation) - if provided
- **Content**: Order details, items, total amount, customer info

### 3. Quote Request Notifications
- **Trigger**: When a customer requests a quote for services
- **Recipient**: Business WhatsApp number
- **Content**: Service name, customer info, project description, budget

## API Endpoints

### Main WhatsApp API: `/api/whatsapp`
- **POST**: Send various types of notifications
- **GET**: Check API status

### Test API: `/api/whatsapp/test`
- **GET**: Test basic connection
- **POST**: Test specific notification types

## Usage Examples

### Testing the Integration

1. **Access Admin Dashboard**: Go to `/admin/dashboard`
2. **Use WhatsApp Test Panel**: Scroll down to find the test panel
3. **Run Tests**: Click different test buttons to verify functionality

### Manual API Testing

```bash
# Test basic connection
curl https://your-domain.com/api/whatsapp/test

# Test signup notification
curl -X POST https://your-domain.com/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"type": "signup"}'

# Test purchase notification
curl -X POST https://your-domain.com/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"type": "purchase"}'
```

## Integration Points

### 1. Auth Context (`contexts/auth-context.tsx`)
- Automatically sends signup notifications when new users register
- Non-blocking - signup succeeds even if WhatsApp fails

### 2. Order Context (`contexts/order-context.tsx`)
- Sends purchase notifications to admin
- Sends order confirmation to customer (if phone provided)
- Non-blocking - order creation succeeds even if WhatsApp fails

### 3. Quote System (`components/quote/quote-content.tsx`)
- Sends quote request notifications to admin
- Triggered when customers download quote documents

## Message Templates

### Admin Notifications

**New Signup:**
```
🎉 NEW CUSTOMER SIGNUP

Name: [Customer Name]
Email: [Customer Email]
Time: [Timestamp]

QuardCubeLabs
```

**New Purchase:**
```
💰 NEW PURCHASE ORDER

Customer: [Name]
Email: [Email]
Order ID: [Order ID]

Items:
• [Product Name] (Qty: [Quantity]) - TZS [Amount]

Total: TZS [Total Amount]
Time: [Timestamp]

QuardCubeLabs
```

**Quote Request:**
```
📋 NEW QUOTE REQUEST

Service: [Service Name]
Customer: [Name]
Email: [Email]
Budget: [Budget Range]

Project: [Description]

Time: [Timestamp]

QuardCubeLabs
```

### Customer Notifications

**Order Confirmation:**
```
✅ ORDER CONFIRMED

Hi [Customer Name]!

Your order has been confirmed:
Order ID: [Order ID]

Items:
• [Product Name] ([Quantity]x)

Total: TZS [Total Amount]

We'll process your order soon. Thank you for choosing QuardCubeLabs!
```

## Error Handling

- All WhatsApp operations are wrapped in try-catch blocks
- Failures don't block the main business operations (signup, order, quote)
- Errors are logged to console for debugging
- User experience remains smooth even if WhatsApp is down

## Security Considerations

- Access tokens are stored securely in environment variables
- API endpoints don't expose sensitive information
- Rate limiting should be implemented for production use
- Consider using webhooks for two-way communication

## Testing Checklist

- [ ] Environment variables properly configured
- [ ] Admin dashboard test panel accessible
- [ ] Connection test passes
- [ ] Signup notification test works
- [ ] Purchase notification test works
- [ ] Quote notification test works
- [ ] Messages received on business WhatsApp
- [ ] Customer confirmations work (if phone provided)

## Troubleshooting

### Common Issues

1. **Token Expired**: WhatsApp access tokens have expiration dates
2. **Phone Number Not Verified**: Ensure your business number is verified
3. **Rate Limiting**: Don't exceed WhatsApp API rate limits
4. **Network Issues**: Check internet connectivity and firewall settings

### Debug Steps

1. Check environment variables are set correctly
2. Use the admin test panel to isolate issues
3. Check browser console for error messages
4. Verify WhatsApp Business API setup in Facebook Developer Console

## Production Deployment

1. **Secure Tokens**: Use secure token management
2. **Rate Limiting**: Implement API rate limiting
3. **Monitoring**: Set up logging and monitoring
4. **Backup Notification Methods**: Have email fallback for critical notifications
5. **Webhook Security**: Implement webhook verification if using bidirectional messaging

## Future Enhancements

- **Template Messages**: Use approved message templates for better delivery
- **Rich Media**: Send images, documents, or interactive messages
- **Two-way Communication**: Handle incoming WhatsApp messages
- **Message Status**: Track message delivery and read status
- **Customer Support**: Integrate WhatsApp for customer service

---

For support, contact the development team or refer to the WhatsApp Business API documentation.