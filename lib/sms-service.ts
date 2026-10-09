import type { Order } from '@/lib/order-actions'

// NextSMS Configuration
const NEXTSMS_CONFIG = {
  baseUrl: process.env.NEXTSMS_BASE_URL || 'https://messaging-service.co.tz',
  authToken: process.env.NEXTSMS_AUTH_TOKEN || 'Basic UXVhcmRjdWJlbGFiczpGcmFtYW4jMDAxQDM2MCE=',
  senderId: process.env.NEXTSMS_SENDER_ID || 'Quardcube',
  adminPhone: process.env.ADMIN_PHONE || '255623893383',
  serviceName: 'QuardCube Labs'
}

export interface NextSMSResponse {
  messages?: Array<{
    to: string
    status: {
      groupId: number
      groupName: string
      id: number
      name: string
      description: string
    }
    smsCount: number
    messageId?: string
  }>
  error?: string
  details?: any
}

/**
 * Format phone number for NextSMS API
 * NextSMS requires destination numbers in international format without '+' (e.g., 255716718040)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')

  // If local Tanzanian number starting with 0 (e.g. 0712345678 or 0612345678)
  if (cleanPhone.startsWith('0')) {
    return '255' + cleanPhone.substring(1)
  }
  // If already starts with 255
  if (cleanPhone.startsWith('255')) {
    return cleanPhone
  }
  // If 9 digits (e.g. 712345678 or 612345678)
  if (cleanPhone.length === 9) {
    return '255' + cleanPhone
  }
  
  return cleanPhone
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false
  const cleanPhone = formatPhoneNumber(phone)
  // Valid Tanzanian number with country code is 12 digits (255XXXXXXXXX) or general international 10-15 digits
  return cleanPhone.length >= 10 && cleanPhone.length <= 15
}

/**
 * Send SMS via NextSMS API (POST https://messaging-service.co.tz/api/sms/v1/text/single)
 */
export async function sendSMS(
  to: string | string[],
  text: string,
  reference?: string
): Promise<{ success: boolean; data?: NextSMSResponse; error?: string }> {
  try {
    const formattedRecipients = Array.isArray(to)
      ? to.map(formatPhoneNumber).filter(Boolean)
      : formatPhoneNumber(to)

    if (Array.isArray(formattedRecipients) && formattedRecipients.length === 0) {
      return { success: false, error: 'No valid recipient phone number provided' }
    }
    if (typeof formattedRecipients === 'string' && !formattedRecipients) {
      return { success: false, error: 'No valid recipient phone number provided' }
    }

    const payload: Record<string, any> = {
      from: NEXTSMS_CONFIG.senderId,
      to: formattedRecipients,
      text: text,
    }

    if (reference) {
      payload.reference = reference
    }

    const endpoint = `${NEXTSMS_CONFIG.baseUrl}/api/sms/v1/text/single`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': NEXTSMS_CONFIG.authToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      console.error('NextSMS API error:', response.status, responseData)
      return {
        success: false,
        error: responseData?.message || responseData?.error || `HTTP error ${response.status}`,
        data: responseData
      }
    }

    // Inspect individual message statuses for rejection by NextSMS gateway
    const firstMsg = responseData?.messages?.[0]
    if (firstMsg?.status?.groupName === 'REJECTED' || (firstMsg?.status?.groupId && firstMsg.status.groupId >= 4)) {
      const errMsg = firstMsg.status.description || firstMsg.status.name || 'Message rejected by NextSMS gateway'
      console.error(`NextSMS Gateway Rejection: ${errMsg} (Status Code: ${firstMsg.status.id}, Sender ID: "${NEXTSMS_CONFIG.senderId}")`)
      return {
        success: false,
        error: `${errMsg} (Sender ID: "${NEXTSMS_CONFIG.senderId}")`,
        data: responseData
      }
    }

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('Error in sendSMS via NextSMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown network error'
    }
  }
}

/**
 * Send order confirmation SMS notification to customer
 */
export async function sendOrderConfirmationSMS(order: Order, phoneNumber: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) return false

    const orderNum = order.order_number || order.id?.slice(0, 8).toUpperCase()
    const totalAmount = Number(order.total || 0).toLocaleString()

    const message = `QuardCube Labs: Order Confirmed!
Order #${orderNum}
Total: TZS ${totalAmount}
Status: ${order.status?.toUpperCase() || 'CONFIRMED'}

Thank you for choosing us! Track your order at https://quardcubelabs.co.tz/orders
Need help? Call +255 623 893 383`

    const result = await sendSMS(formattedPhone, message, `order_conf_${orderNum}`)
    return result.success
  } catch (error) {
    console.error('Error sending order confirmation SMS:', error)
    return false
  }
}

/**
 * Send order status update SMS notification to customer
 */
export async function sendOrderStatusSMS(order: Order, phoneNumber: string, newStatus: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) return false

    const orderNum = order.order_number || order.id?.slice(0, 8).toUpperCase()
    const totalAmount = Number(order.total || 0).toLocaleString()

    let statusText = ''
    switch (newStatus.toLowerCase()) {
      case 'processing':
        statusText = 'is now being PROCESSED 📦'
        break
      case 'shipped':
        statusText = 'has been SHIPPED 🚚'
        break
      case 'completed':
        statusText = 'has been COMPLETED & DELIVERED ✅'
        break
      case 'cancelled':
        statusText = 'has been CANCELLED ❌'
        break
      default:
        statusText = `status updated to ${newStatus.toUpperCase()}`
    }

    const message = `QuardCube Labs: Your order #${orderNum} ${statusText}.
Total: TZS ${totalAmount}

Check details: https://quardcubelabs.co.tz/orders/${order.id}
Support: +255 623 893 383`

    const result = await sendSMS(formattedPhone, message, `order_status_${orderNum}`)
    return result.success
  } catch (error) {
    console.error('Error sending order status SMS:', error)
    return false
  }
}

/**
 * Send payment received SMS notification to customer
 */
export async function sendPaymentReceivedSMS(
  payment: {
    amount: number
    paymentMethod: string
    transactionId?: string
    orderId?: string
    reference?: string
  },
  phoneNumber: string
): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) return false

    const amountFormatted = Number(payment.amount || 0).toLocaleString()
    const txId = payment.transactionId || 'N/A'

    const message = `QuardCube Labs: Payment Received!
Amount: TZS ${amountFormatted}
Method: ${payment.paymentMethod}
Tx ID: ${txId}

Thank you for your business!
QuardCube Labs: +255 623 893 383`

    const result = await sendSMS(formattedPhone, message, `pay_recv_${txId}`)
    return result.success
  } catch (error) {
    console.error('Error sending payment received SMS:', error)
    return false
  }
}

/**
 * Send payment reminder SMS to customer
 */
export async function sendPaymentReminderSMS(order: Order, phoneNumber: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) return false

    const orderNum = order.order_number || order.id?.slice(0, 8).toUpperCase()
    const totalAmount = Number(order.total || 0).toLocaleString()

    const message = `QuardCube Labs: Payment Reminder
Order #${orderNum}
Amount: TZS ${totalAmount}

Please complete payment to finalize processing: https://quardcubelabs.co.tz/orders/${order.id}
Support: +255 623 893 383`

    const result = await sendSMS(formattedPhone, message, `pay_rem_${orderNum}`)
    return result.success
  } catch (error) {
    console.error('Error sending payment reminder SMS:', error)
    return false
  }
}

/**
 * Send Admin SMS Notification when a new order is placed
 */
export async function sendNewOrderAdminSMS(order: {
  id: string
  orderNumber?: string
  total: number
  customerName?: string
  customerPhone?: string
  itemCount?: number
}): Promise<boolean> {
  try {
    const adminPhone = NEXTSMS_CONFIG.adminPhone
    if (!adminPhone) return false

    const orderNum = order.orderNumber || order.id.slice(0, 8).toUpperCase()
    const totalFormatted = Number(order.total || 0).toLocaleString()

    const message = `[ALERT - NEW ORDER] QuardCube Labs
Order: #${orderNum}
Customer: ${order.customerName || 'Anonymous'}
Phone: ${order.customerPhone || 'N/A'}
Total: TZS ${totalFormatted}
Items: ${order.itemCount || 1}

View dashboard: https://quardcubelabs.co.tz/admin/orders`

    const result = await sendSMS(adminPhone, message, `admin_order_${orderNum}`)
    return result.success
  } catch (error) {
    console.error('Error sending new order admin SMS:', error)
    return false
  }
}

/**
 * Send Admin SMS Notification when a payment is received
 */
export async function sendNewPaymentAdminSMS(payment: {
  amount: number
  paymentMethod: string
  transactionId: string
  customerName?: string
  customerPhone?: string
}): Promise<boolean> {
  try {
    const adminPhone = NEXTSMS_CONFIG.adminPhone
    if (!adminPhone) return false

    const amountFormatted = Number(payment.amount || 0).toLocaleString()

    const message = `[ALERT - PAYMENT RECEIVED] QuardCube Labs
Amount: TZS ${amountFormatted}
Method: ${payment.paymentMethod}
Tx ID: ${payment.transactionId}
Customer: ${payment.customerName || 'Customer'}
Phone: ${payment.customerPhone || 'N/A'}

Admin: https://quardcubelabs.co.tz/admin`

    const result = await sendSMS(adminPhone, message, `admin_pay_${payment.transactionId}`)
    return result.success
  } catch (error) {
    console.error('Error sending payment admin SMS:', error)
    return false
  }
}

/**
 * Send Admin SMS Notification when a service quote is requested/printed
 */
export async function sendQuoteRequestAdminSMS(quote: {
  quoteNumber: string
  serviceTitle: string
  customerName?: string
  customerPhone?: string
  priceEstimate?: string
}): Promise<boolean> {
  try {
    const adminPhone = NEXTSMS_CONFIG.adminPhone
    if (!adminPhone) return false

    const message = `[ALERT - NEW QUOTE REQUEST] QuardCube Labs
Quote: #${quote.quoteNumber}
Service: ${quote.serviceTitle}
Customer: ${quote.customerName || 'Visitor'}
Phone: ${quote.customerPhone || 'N/A'}
Estimate: ${quote.priceEstimate || 'Custom'}

Admin: https://quardcubelabs.co.tz/admin/quotations`

    const result = await sendSMS(adminPhone, message, `admin_quote_${quote.quoteNumber}`)
    return result.success
  } catch (error) {
    console.error('Error sending quote admin SMS:', error)
    return false
  }
}

/**
 * Send Admin SMS Notification when a job application or contact request is submitted
 */
export async function sendApplicationAdminSMS(application: {
  applicantName: string
  positionTitle: string
  applicantPhone?: string
}): Promise<boolean> {
  try {
    const adminPhone = NEXTSMS_CONFIG.adminPhone
    if (!adminPhone) return false

    const message = `[ALERT - NEW APPLICATION] QuardCube Labs
Position: ${application.positionTitle}
Applicant: ${application.applicantName}
Phone: ${application.applicantPhone || 'N/A'}

Review: https://quardcubelabs.co.tz/admin/applications`

    const result = await sendSMS(adminPhone, message, `admin_app_${Date.now()}`)
    return result.success
  } catch (error) {
    console.error('Error sending application admin SMS:', error)
    return false
  }
}

/**
 * Send welcome SMS for new customers
 */
export async function sendWelcomeSMS(phoneNumber: string, customerName?: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) return false

    const greeting = customerName ? `Hi ${customerName}! ` : ''
    const message = `Welcome to QuardCube Labs! ${greeting}🚀
Thank you for joining us. We provide top IT solutions, electronics, and digital services.

Website: https://quardcubelabs.co.tz
Support: +255 623 893 383`

    const result = await sendSMS(formattedPhone, message, `welcome_${Date.now()}`)
    return result.success
  } catch (error) {
    console.error('Error sending welcome SMS:', error)
    return false
  }
}

/**
 * Send promotional SMS (with opt-out option)
 */
export async function sendPromotionalSMS(phoneNumber: string, offerDetails: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) return false

    const message = `QuardCube Labs Special Offer:
${offerDetails}

Explore now: https://quardcubelabs.co.tz/shop
Reply STOP to opt-out.`

    const result = await sendSMS(formattedPhone, message, `promo_${Date.now()}`)
    return result.success
  } catch (error) {
    console.error('Error sending promotional SMS:', error)
    return false
  }
}

/**
 * Get NextSMS account credit balance
 */
export async function getNextSMSBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    if (!NEXTSMS_CONFIG.authToken) {
      return { success: false, error: 'NextSMS Auth Token is not configured.' }
    }

    const response = await fetch(`${NEXTSMS_CONFIG.baseUrl}/api/sms/v1/balance`, {
      method: 'GET',
      headers: {
        'Authorization': NEXTSMS_CONFIG.authToken,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return { success: false, error: `Balance check failed with status ${response.status}` }
    }

    const data = await response.json().catch(() => null)
    const balance = typeof data?.sms_balance === 'number' ? data.sms_balance : undefined
    return { success: true, balance }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

/**
 * Get NextSMS service status and verify configuration
 */
export async function getSMSServiceStatus(): Promise<{
  available: boolean
  message: string
  senderId: string
  provider: string
  balance?: number
  details?: any
}> {
  try {
    if (!NEXTSMS_CONFIG.authToken) {
      return {
        available: false,
        message: 'NextSMS Auth Token is not configured in environment variables.',
        senderId: NEXTSMS_CONFIG.senderId,
        provider: 'NextSMS'
      }
    }

    // Check balance endpoint for live connection and credit count
    const balanceRes = await getNextSMSBalance()

    if (balanceRes.success) {
      return {
        available: true,
        message: `NextSMS Gateway connected successfully (Balance: ${balanceRes.balance ?? 0} SMS)`,
        senderId: NEXTSMS_CONFIG.senderId,
        provider: 'NextSMS (messaging-service.co.tz)',
        balance: balanceRes.balance,
        details: { sms_balance: balanceRes.balance }
      }
    } else {
      return {
        available: false,
        message: `NextSMS connection error: ${balanceRes.error}`,
        senderId: NEXTSMS_CONFIG.senderId,
        provider: 'NextSMS'
      }
    }
  } catch (error) {
    return {
      available: false,
      message: `NextSMS connection error: ${error instanceof Error ? error.message : 'Network error'}`,
      senderId: NEXTSMS_CONFIG.senderId,
      provider: 'NextSMS'
    }
  }
}
