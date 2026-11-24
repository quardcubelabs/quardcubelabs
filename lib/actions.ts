"use server"

import { createOrder } from "@/lib/order-actions"
import type { OrderItem } from "@/lib/order-actions"
import { sendContactFormEmail } from "@/lib/email-service"
import { checkRateLimit } from "@/lib/security/rate-limiter"
import { isValidEmail, sanitizeText } from "@/lib/security/validation"
import { headers } from "next/headers"

async function getCallerIp(): Promise<string> {
  try {
    const hdrs = await headers()
    return (
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip")?.trim() ||
      "unknown"
    )
  } catch {
    return "unknown"
  }
}

// Contact form submission
export async function submitContactForm(formData: FormData) {
  const ip = await getCallerIp()
  const rl = checkRateLimit(`contact:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    return {
      success: false,
      message: "Too many submissions. Please wait a few minutes and try again.",
    }
  }

  const name = sanitizeText(String(formData.get("name") || ""), 120)
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const phone = sanitizeText(String(formData.get("phone") || ""), 32)
  const subject = sanitizeText(String(formData.get("subject") || ""), 200)
  const message = sanitizeText(String(formData.get("message") || ""), 4000)

  if (!name || !isValidEmail(email) || !subject || !message) {
    return {
      success: false,
      message: "Please fill in all required fields with a valid email address.",
    }
  }

  try {
    await sendContactFormEmail({
      name,
      email,
      phone: phone || undefined,
      subject,
      message,
    })

    return {
      success: true,
      message: "Thank you for your message! We will get back to you soon.",
    }
  } catch (error) {
    console.error("Error processing contact form:", error)
    return {
      success: true,
      message: "Thank you for your message! We will get back to you soon.",
    }
  }
}

// Newsletter subscription
export async function subscribeToNewsletter(formData: FormData) {
  const ip = await getCallerIp()
  const rl = checkRateLimit(`newsletter:${ip}`, 8, 15 * 60 * 1000)
  if (!rl.allowed) {
    return {
      success: false,
      message: "Too many subscription requests. Please try again shortly.",
    }
  }

  const email = String(formData.get("email") || "").trim().toLowerCase()
  if (!isValidEmail(email)) {
    return {
      success: false,
      message: "Please provide a valid email address.",
    }
  }

  return {
    success: true,
    message: "Thank you for subscribing to our newsletter!",
  }
}

// Create order directly (delegates authoritative pricing, stock, and BOLA verification to createOrder)
export async function createDirectOrder(
  userId: string,
  productId: number,
  customerInfo?: {
    name: string
    email: string
    address: string
  },
  accessToken?: string | null
) {
  try {
    const orderItem: OrderItem = {
      id: String(productId),
      name: "",
      quantity: 1,
      price: 0,
      image: "",
    }

    const order = await createOrder(userId, [orderItem], 0, customerInfo, accessToken)

    return {
      success: true,
      message: "Order created successfully",
      order,
    }
  } catch (error: any) {
    console.error("Error creating direct order:", error)
    return {
      success: false,
      message: error?.message || "Failed to create order",
    }
  }
}
