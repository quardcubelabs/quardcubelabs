const SELCOM_BASE_URL = process.env.SELCOM_BASE_URL || "https://apigw.selcommobile.com"
const SELCOM_API_KEY = process.env.SELCOM_API_KEY || ""
const SELCOM_API_SECRET = process.env.SELCOM_API_SECRET || ""
const SELCOM_VENDOR = process.env.SELCOM_VENDOR || ""

// eslint-disable-next-line @typescript-eslint/no-require-imports
let apigwCLient: any = null

function getClient() {
  if (!apigwCLient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("selcom-apigw-client")
    apigwCLient = mod.apigwCLient
  }
  return new apigwCLient(SELCOM_BASE_URL, SELCOM_API_KEY, SELCOM_API_SECRET)
}

type SelcomOrderData = {
  vendor?: string
  order_id: string
  buyer_email?: string
  buyer_name?: string
  buyer_phone?: string
  amount: number
  currency?: string
  payment_methods?: string
  redirect_url?: string
  cancel_url?: string
  webhook?: string
  buyer_remarks?: string
  merchant_remarks?: string
  no_of_items?: number
}

type SelcomOrderResponse = {
  reference?: string
  resultcode?: string
  result?: string
  message?: string
  data?: Array<{
    gateway_buyer_uuid?: string
    payment_token?: string
    qr?: string
    payment_gateway_url?: string
  }>
}

type SelcomOrderStatusResponse = {
  reference?: string
  resultcode?: string
  result?: string
  message?: string
  data?: Array<{
    order_id?: string
    creation_date?: string
    amount?: string
    payment_status?: string
    transid?: string | null
    channel?: string | null
    reference?: string | null
    phone?: string | null
  }>
}

export async function createSelcomOrder(orderData: SelcomOrderData): Promise<SelcomOrderResponse> {
  const client = getClient()

  const data: SelcomOrderData = {
    vendor: SELCOM_VENDOR,
    order_id: orderData.order_id,
    buyer_email: orderData.buyer_email || "",
    buyer_name: orderData.buyer_name || "",
    buyer_phone: orderData.buyer_phone || "",
    amount: orderData.amount,
    currency: "TZS",
    payment_methods: "ALL",
    redirect_url: orderData.redirect_url || "",
    cancel_url: orderData.cancel_url || "",
    webhook: orderData.webhook || "",
    buyer_remarks: orderData.buyer_remarks || "",
    merchant_remarks: orderData.merchant_remarks || "QuardCubeLabs order",
    no_of_items: orderData.no_of_items || 1,
  }

  const response = await client.postFunc("/v1/vcn/create", data)
  return response as SelcomOrderResponse
}

export async function getSelcomOrderStatus(orderId: string): Promise<SelcomOrderStatusResponse> {
  const client = getClient()

  const response = await client.getFunc("/v1/checkout/order-status", { order_id: orderId })
  return response as SelcomOrderStatusResponse
}

export function generateOrderId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `ORD-${timestamp}-${random}`
}
