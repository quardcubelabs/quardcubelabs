"use server"

import { createServerClient } from "@/lib/supabase"

// Types
type PaymentRequest = {
  amount: number
  phoneNumber: string
  reference: string
  description: string
}

type CardPaymentRequest = {
  amount: number
  cardDetails: {
    cardNumber: string
    cardholderName: string
    expiryDate: string
    cvv: string
  }
}

type PaypalPaymentRequest = {
  amount: number
  returnUrl: string
  cancelUrl: string
}

type PaymentResponse = {
  success: boolean
  transactionId?: string
  message: string
  redirectUrl?: string
  paymentId?: string
}

// Process mobile payment
export async function processMobilePayment(data: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Simulate API call to payment processor
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real app, this would make an API call to a payment processor
    const transactionId = `mob-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create a transaction record
    const supabase = createServerClient()
    await supabase.from("transactions").insert({
      transaction_id: transactionId,
      amount: data.amount,
      phone_number: data.phoneNumber,
      reference: data.reference,
      description: data.description,
      payment_method: "mobile",
      status: "completed",
    })

    return {
      success: true,
      transactionId,
      message: "Mobile payment processed successfully",
    }
  } catch (error) {
    console.error("Error processing mobile payment:", error)
    return {
      success: false,
      message: "Failed to process payment. Please try again.",
    }
  }
}

// Send USSD push notification for Tigo payments
export async function sendUssdPush(data: PaymentRequest): Promise<PaymentResponse> {
  try {
    // Simulate API call to Tigo payment gateway
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate a transaction ID
    const transactionId = `tigo-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create a transaction record with pending status
    const supabase = createServerClient()
    await supabase.from("transactions").insert({
      transaction_id: transactionId,
      amount: data.amount,
      phone_number: data.phoneNumber,
      reference: data.reference,
      description: data.description,
      payment_method: "tigo_ussd",
      status: "pending",
    })

    // In a real implementation, this would call the Tigo API to send a USSD push
    // For demo purposes, we'll simulate a successful USSD push

    return {
      success: true,
      transactionId,
      message: "USSD push notification sent successfully",
    }
  } catch (error) {
    console.error("Error sending USSD push:", error)
    return {
      success: false,
      message: "Failed to send USSD push. Please try again.",
    }
  }
}

// Process card payment
export async function processCardPayment(data: CardPaymentRequest): Promise<PaymentResponse> {
  try {
    // Simulate API call to card payment processor
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // In a real app, this would validate the card and process the payment
    // For demo purposes, we'll simulate a successful payment

    // Validate card number using Luhn algorithm (basic check)
    const cardNumber = data.cardDetails.cardNumber.replace(/\s/g, "")
    if (!isValidCardNumber(cardNumber)) {
      return {
        success: false,
        message: "Invalid card number. Please check and try again.",
      }
    }

    // Generate a transaction ID
    const transactionId = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create a transaction record
    const supabase = createServerClient()
    await supabase.from("transactions").insert({
      transaction_id: transactionId,
      amount: data.amount,
      reference: `Card-${cardNumber.slice(-4)}`,
      description: "Card payment for QuardCubeLabs order",
      payment_method: "card",
      status: "completed",
    })

    return {
      success: true,
      transactionId,
      message: "Card payment processed successfully",
    }
  } catch (error) {
    console.error("Error processing card payment:", error)
    return {
      success: false,
      message: "Failed to process card payment. Please try again.",
    }
  }
}

// Initiate PayPal payment
export async function initiatePaypalPayment(data: PaypalPaymentRequest): Promise<PaymentResponse> {
  try {
    // Simulate API call to PayPal
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In a real app, this would create a PayPal payment and return the approval URL
    // For demo purposes, we'll simulate a successful initiation

    // Generate a payment ID
    const paymentId = `pp-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create a transaction record with pending status
    const supabase = createServerClient()
    await supabase.from("transactions").insert({
      transaction_id: paymentId,
      amount: data.amount,
      reference: `PayPal-${paymentId}`,
      description: "PayPal payment for QuardCubeLabs order",
      payment_method: "paypal",
      status: "pending",
    })

    // Construct a mock PayPal redirect URL
    // In a real implementation, this would be the URL returned by PayPal
    const redirectUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${paymentId}`

    return {
      success: true,
      paymentId,
      redirectUrl,
      message: "PayPal payment initiated successfully",
    }
  } catch (error) {
    console.error("Error initiating PayPal payment:", error)
    return {
      success: false,
      message: "Failed to initiate PayPal payment. Please try again.",
    }
  }
}

// Check PayPal payment status
export async function checkPaypalPaymentStatus(paymentId: string): Promise<{ status: string; message: string }> {
  try {
    // In a real app, this would check the payment status with PayPal
    // For demo purposes, we'll simulate a completed payment after a delay

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("transactions")
      .select("status")
      .eq("transaction_id", paymentId)
      .single()

    if (error) {
      return { status: "failed", message: "Payment not found" }
    }

    // If the payment is still pending, randomly complete it (for demo purposes)
    if (data.status === "pending") {
      // 70% chance of success in our demo
      if (Math.random() < 0.7) {
        await supabase.from("transactions").update({ status: "completed" }).eq("transaction_id", paymentId)

        return { status: "completed", message: "Payment completed successfully" }
      }
    } else if (data.status === "completed") {
      return { status: "completed", message: "Payment completed successfully" }
    }

    return { status: data.status, message: `Payment status: ${data.status}` }
  } catch (error) {
    console.error("Error checking PayPal payment status:", error)
    return { status: "failed", message: "Failed to check payment status" }
  }
}

// Helper function to validate card number using Luhn algorithm
function isValidCardNumber(cardNumber: string): boolean {
  // Remove all non-digit characters
  const digits = cardNumber.replace(/\D/g, "")

  if (digits.length !== 16) return false

  let sum = 0
  let shouldDouble = false

  // Loop through digits in reverse
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(digits.charAt(i))

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

// API route to check payment status
export async function getPaymentStatus(transactionId: string) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("transactions")
      .select("status")
      .eq("transaction_id", transactionId)
      .single()

    if (error) {
      return { status: "unknown", message: "Payment not found" }
    }

    // For Tigo USSD payments, randomly complete them after a delay (for demo purposes)
    if (data.status === "pending" && transactionId.startsWith("tigo-")) {
      // 80% chance of success in our demo
      if (Math.random() < 0.8) {
        await supabase.from("transactions").update({ status: "completed" }).eq("transaction_id", transactionId)

        return { status: "completed", message: "Payment completed successfully" }
      }
    }

    return { status: data.status, message: `Payment status: ${data.status}` }
  } catch (error) {
    console.error("Error getting payment status:", error)
    return { status: "error", message: "Failed to get payment status" }
  }
}
