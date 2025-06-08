"use server"

import { products, cartItems } from "@/lib/data"

// Contact form submission
export async function submitContactForm(formData: FormData) {
  // In a real application, you would send this data to your backend or a service like SendGrid
  const name = formData.get("name")
  const email = formData.get("email")
  const subject = formData.get("subject")
  const message = formData.get("message")

  console.log("Contact form submitted:", { name, email, subject, message })

  // Simulate a delay to mimic server processing
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    success: true,
    message: "Thank you for your message! We will get back to you soon.",
  }
}

// Newsletter subscription
export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get("email")

  console.log("Newsletter subscription:", email)

  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    success: true,
    message: "Thank you for subscribing to our newsletter!",
  }
}

// Add to cart
export async function addToCart(productId: number, quantity = 1) {
  const product = products.find((p) => p.id === productId)

  if (!product) {
    return {
      success: false,
      message: "Product not found",
    }
  }

  // Check if product is already in cart
  const existingItemIndex = cartItems.findIndex((item) => item.product?.id === productId)

  if (existingItemIndex >= 0) {
    // Update quantity
    cartItems[existingItemIndex].quantity += quantity
  } else {
    // Add new item
    cartItems.push({
      product,
      quantity,
    })
  }

  return {
    success: true,
    message: `${product.name} added to cart`,
    cartCount: cartItems.reduce((total, item) => total + item.quantity, 0),
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(productId: number, quantity: number) {
  const itemIndex = cartItems.findIndex((item) => item.product?.id === productId)

  if (itemIndex < 0) {
    return {
      success: false,
      message: "Product not found in cart",
    }
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    cartItems.splice(itemIndex, 1)
  } else {
    // Update quantity
    cartItems[itemIndex].quantity = quantity
  }

  return {
    success: true,
    message: "Cart updated",
    cartCount: cartItems.reduce((total, item) => total + item.quantity, 0),
  }
}

// Remove item from cart
export async function removeFromCart(productId: number) {
  const itemIndex = cartItems.findIndex((item) => item.product?.id === productId)

  if (itemIndex < 0) {
    return {
      success: false,
      message: "Product not found in cart",
    }
  }

  cartItems.splice(itemIndex, 1)

  return {
    success: true,
    message: "Item removed from cart",
    cartCount: cartItems.reduce((total, item) => total + item.quantity, 0),
  }
}

// Clear cart
export async function clearCart() {
  cartItems.length = 0

  return {
    success: true,
    message: "Cart cleared",
    cartCount: 0,
  }
}
