"use server"

import { products } from "@/lib/data"
import { createOrder } from "@/lib/order-actions"
import type { OrderItem } from "@/lib/order-actions"
import { sendContactFormEmail } from "@/lib/email-service"

// Contact form submission
export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string | undefined
  const subject = formData.get("subject") as string
  const message = formData.get("message") as string


  try {
    // Send email notification to admin
    const emailSent = await sendContactFormEmail({
      name,
      email,
      phone: phone || undefined,
      subject,
      message
    })

    if (!emailSent) {
    }

    return {
      success: true,
      message: "Thank you for your message! We will get back to you soon.",
    }
  } catch (error) {
    console.error("Error processing contact form:", error)
    return {
      success: true, // Still return success to user even if email fails
      message: "Thank you for your message! We will get back to you soon.",
    }
  }
}

// Newsletter subscription
export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get("email")


  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    success: true,
    message: "Thank you for subscribing to our newsletter!",
  }
}

// Create order directly
export async function createDirectOrder(
  userId: string,
  productId: number,
  customerInfo?: {
    name: string
    email: string
    address: string
  }
) {
  try {
    const product = products.find((p) => p.id === productId)

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      }
    }

    // Create order item
    const orderItem: OrderItem = {
      id: String(product.id),
      name: product.name,
      quantity: 1,
      price: product.price,
      image: product.image,
    }

    // Create the order
    const order = await createOrder(
      userId,
      [orderItem],
      product.price,
      customerInfo
    )

    return {
      success: true,
      message: "Order created successfully",
      order,
    }
  } catch (error) {
    console.error("Error creating order:", error)
    return {
      success: false,
      message: "Failed to create order",
    }
  }
}
