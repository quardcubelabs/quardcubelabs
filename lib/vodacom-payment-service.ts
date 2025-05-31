"use server"

import { createServerClient } from "@/lib/supabase"

// Vodacom Payment Service
// This is a simplified version of the Vodacom payment integration
// In a real application, you would use the official Vodacom API

const VODACOM_MERCHANT_ID = "35428449"
const VODACOM_API_ENDPOINT = "https://api.vodacom.co.tz/payments/v1"

type PaymentRequest = {
  amount: number
  phoneNumber: string
  reference: string
  description: string
}

type PaymentResponse = {
  success: boolean
  transactionId?: string
  message: string
  code?: string
}

export async function initiateVodacomPayment(data: PaymentRequest): Promise<PaymentResponse> {
  try {
    // In a real implementation, you would make an API call to Vodacom
    // For now, we'll simulate the API call

    // Validate phone number format (Tanzania format: 255XXXXXXXXX)
    const phoneRegex = /^255\d{9}$/
    if (!phoneRegex.test(data.phoneNumber)) {
      return {
        success: false,
        message: "Invalid phone number format. Please use format: 255XXXXXXXXX",
      }
    }

    // Generate a transaction ID
    const transactionId = `VOD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // In a real implementation, you would store the transaction in your database
    const supabase = createServerClient()

    // Create a transaction record
    await supabase.from("transactions").insert({
      transaction_id: transactionId,
      merchant_id: VODACOM_MERCHANT_ID,
      amount: data.amount,
      phone_number: data.phoneNumber,
      reference: data.reference,
      description: data.description,
      status: "pending",
    })

    // Generate a verification code (in a real implementation, this would come from Vodacom)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    return {
      success: true,
      transactionId,
      message: "Payment initiated successfully. Please check your phone for confirmation.",
      code: verificationCode,
    }
  } catch (error) {
    console.error("Error initiating Vodacom payment:", error)
    return {
      success: false,
      message: "Failed to initiate payment. Please try again.",
    }
  }
}

export async function verifyVodacomPayment(transactionId: string, code: string): Promise<PaymentResponse> {
  try {
    // In a real implementation, you would verify the payment with Vodacom
    // For now, we'll simulate the verification

    // Get the transaction from the database
    const supabase = createServerClient()
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single()

    if (error || !transaction) {
      return {
        success: false,
        message: "Transaction not found.",
      }
    }

    // Update the transaction status
    await supabase.from("transactions").update({ status: "completed" }).eq("transaction_id", transactionId)

    return {
      success: true,
      transactionId,
      message: "Payment verified successfully.",
    }
  } catch (error) {
    console.error("Error verifying Vodacom payment:", error)
    return {
      success: false,
      message: "Failed to verify payment. Please try again.",
    }
  }
}

export async function getTransactionStatus(transactionId: string): Promise<string> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("transactions")
      .select("status")
      .eq("transaction_id", transactionId)
      .single()

    if (error || !data) {
      return "unknown"
    }

    return data.status
  } catch (error) {
    console.error("Error getting transaction status:", error)
    return "error"
  }
}
