"use server"

import { createServerClient } from "@/lib/supabase"
import { assertPermission } from "@/lib/rbac"
import { verifyCustomerOrAdmin } from "@/lib/security/customer-auth"
import { sanitizePostgrestFilterValue } from "@/lib/security/url-guard"
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationToAdmin,
  sendOrderStatusUpdateEmail,
} from "@/lib/email-service"
import {
  sendOrderConfirmationSMS,
  sendOrderStatusSMS,
  sendNewOrderAdminSMS,
} from "@/lib/sms-service"

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

export type OrderItem = {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export type Order = {
  id: string
  order_number?: string
  userId: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  customerName?: string
  customerEmail?: string
  shippingAddress?: string
  date: Date | string
  createdAt: Date | string
  updatedAt: Date | string
  created_at?: string
  updated_at?: string
}

/**
 * Authoritatively validates order items against server-side product catalog prices & stock,
 * and atomically decrements available inventory to prevent client-side price tampering and overselling.
 */
async function validateAndReserveOrderItems(
  supabase: ReturnType<typeof createServerClient>,
  rawItems: OrderItem[]
): Promise<{
  verifiedItems: OrderItem[]
  authoritativeTotal: number
  reservedStock: Array<{ productId: number; quantity: number; restoredStock: number }>
}> {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 100) {
    throw new Error("Order must contain between 1 and 100 items.")
  }

  // Consolidate duplicate product IDs so stock checks cannot be bypassed by splitting lines
  const requestedQtyByProductId = new Map<number, number>()
  for (const item of rawItems) {
    const pid = Number(item?.id)
    const qty = Math.floor(Number(item?.quantity))
    if (!Number.isFinite(pid) || pid <= 0) {
      throw new Error("Invalid product identifier in order items.")
    }
    if (!Number.isFinite(qty) || qty < 1 || qty > 1000) {
      throw new Error("Item quantity must be between 1 and 1,000.")
    }
    requestedQtyByProductId.set(pid, (requestedQtyByProductId.get(pid) || 0) + qty)
  }

  const productIds = Array.from(requestedQtyByProductId.keys())
  const { data: dbProducts, error: prodErr } = await supabase
    .from("products")
    .select("id, name, price, stock, image")
    .in("id", productIds)

  if (prodErr || !dbProducts) {
    throw new Error("Unable to verify product catalog prices and stock.")
  }

  const productMap = new Map<number, any>(dbProducts.map((p: any) => [Number(p.id), p]))

  // Verify every requested product exists, has valid positive price, and sufficient stock
  for (const [pid, totalQty] of requestedQtyByProductId.entries()) {
    const dbProd = productMap.get(pid)
    if (!dbProd) {
      throw new Error(`Product #${pid} is no longer available.`)
    }
    const unitPrice = Number(dbProd.price)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`Invalid catalog price for "${dbProd.name}".`)
    }
    const currentStock = Number(dbProd.stock ?? 0)
    if (currentStock < totalQty) {
      throw new Error(
        currentStock <= 0
          ? `"${dbProd.name}" is currently out of stock.`
          : `Insufficient stock for "${dbProd.name}" (available: ${currentStock}, requested: ${totalQty}).`
      )
    }
  }

  // Atomically decrement stock with optimistic `.gte("stock", qty)` guard; rollback if a race occurs
  const reservedStock: Array<{ productId: number; quantity: number; restoredStock: number }> = []
  for (const [pid, totalQty] of requestedQtyByProductId.entries()) {
    const dbProd = productMap.get(pid)
    const currentStock = Number(dbProd.stock ?? 0)
    const nextStock = Math.max(0, currentStock - totalQty)

    const { data: updatedProd, error: decErr } = await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", pid)
      .gte("stock", totalQty)
      .select("id")
      .maybeSingle()

    if (decErr || !updatedProd) {
      // Rollback any previously decremented items
      for (const prev of reservedStock) {
        try {
          await supabase.from("products").update({ stock: prev.restoredStock }).eq("id", prev.productId)
        } catch {}
      }
      throw new Error(`Stock changed while placing order for "${dbProd.name}". Please review availability and retry.`)
    }

    reservedStock.push({ productId: pid, quantity: totalQty, restoredStock: currentStock })
  }

  let authoritativeTotal = 0
  const verifiedItems: OrderItem[] = rawItems.map((item) => {
    const dbProd = productMap.get(Number(item.id))!
    const qty = Math.floor(Number(item.quantity))
    const unitPrice = Number(dbProd.price)
    authoritativeTotal += unitPrice * qty
    return {
      id: String(dbProd.id),
      name: String(dbProd.name),
      quantity: qty,
      price: unitPrice,
      image: String(dbProd.image || item.image || ""),
    }
  })

  authoritativeTotal = Math.round(authoritativeTotal * 100) / 100

  return { verifiedItems, authoritativeTotal, reservedStock }
}

export async function createOrder(
  userId: string,
  items: OrderItem[],
  _clientSubmittedTotal: number,
  customerInfo?: {
    name: string
    email: string
    address: string
    phone?: string
  },
  accessToken?: string | null
) {
  try {
    if (!userId || typeof userId !== "string") {
      throw new Error("Valid authenticated user ID is required.")
    }

    // Enforce authentication & strict BOLA user ownership
    const caller = await verifyCustomerOrAdmin(userId, accessToken)
    const effectiveUserId = caller.isAdmin ? userId : (caller.userId || userId)

    const supabase = createServerClient()

    // Server-side catalog price calculation + atomic stock reservation
    const { verifiedItems, authoritativeTotal, reservedStock } = await validateAndReserveOrderItems(supabase, items)

    const safeName = customerInfo?.name ? String(customerInfo.name).trim().slice(0, 150) : null
    const safeEmail = customerInfo?.email
      ? String(customerInfo.email).trim().toLowerCase().slice(0, 254)
      : (caller.email || null)
    const safeAddress = customerInfo?.address ? String(customerInfo.address).trim().slice(0, 400) : null
    const safePhone = customerInfo?.phone ? String(customerInfo.phone).trim().slice(0, 32) : undefined

    const orderData = {
      user_id: effectiveUserId,
      date: new Date().toISOString(),
      items: verifiedItems,
      total: authoritativeTotal.toString(),
      status: "pending" as const,
      customerName: safeName,
      customerEmail: safeEmail,
      shippingAddress: safeAddress,
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single()

    if (error || !order) {
      // Restore reserved stock on DB insert failure
      for (const prev of reservedStock) {
        try {
          await supabase.from("products").update({ stock: prev.restoredStock }).eq("id", prev.productId)
        } catch {}
      }
      console.error("Supabase error creating order:", error)
      throw new Error("Failed to create order.")
    }

    const formattedOrder = {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      createdAt: order.created_at || order.createdAt,
      updatedAt: order.updated_at || order.updatedAt,
      userId: order.user_id,
      order_number: order.order_number,
    }

    // Automatically generate draft invoice using authoritative server total & items
    try {
      const invNumber = `INV-${order.order_number || order.id.slice(0, 8).toUpperCase()}`
      await supabase.from("invoices").insert([
        {
          invoice_number: invNumber,
          user_id: effectiveUserId,
          items: verifiedItems,
          total: authoritativeTotal.toString(),
          status: "draft" as const,
          customer_name: safeName || "Customer",
          customer_email: safeEmail || "customer@example.com",
          customer_phone: safePhone || null,
          customer_address: safeAddress || null,
          notes: `Order ID: ${order.id}`,
          created_at: order.created_at || new Date().toISOString(),
          updated_at: order.updated_at || new Date().toISOString(),
        },
      ])
    } catch (invErr) {
      console.error("Auto-generating invoice failed:", invErr)
    }

    // Non-blocking notifications using verified prices & total
    const customerEmail = safeEmail || order.customerEmail
    if (customerEmail) {
      sendOrderConfirmationEmail(formattedOrder as Order, customerEmail).catch((err) =>
        console.error("Error sending order confirmation to customer:", err)
      )
    }

    if (safePhone) {
      sendOrderConfirmationSMS(formattedOrder as Order, safePhone).catch((err) =>
        console.error("Error sending order confirmation SMS to customer:", err)
      )
    }

    sendNewOrderAdminSMS({
      id: order.id,
      orderNumber: order.order_number || order.id,
      total: authoritativeTotal,
      customerName: safeName || order.customerName || "Customer",
      customerPhone: safePhone,
      itemCount: verifiedItems.length,
    }).catch((err) => console.error("Error sending admin order SMS notification:", err))

    sendNewOrderNotificationToAdmin({
      orderId: order.id,
      orderNumber: order.order_number || order.id,
      customerName: safeName || order.customerName || "Customer",
      customerEmail: customerEmail || "No email provided",
      customerPhone: safePhone,
      shippingAddress: safeAddress || order.shippingAddress || undefined,
      total: authoritativeTotal,
      items: verifiedItems,
    }).catch((err) => console.error("Error sending admin order notification:", err))

    return formattedOrder
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export async function getOrdersByUserId(userId: string, accessToken?: string | null) {
  if (!userId || typeof userId !== "string") {
    throw new Error("Valid user ID is required.")
  }

  // Enforce authentication & BOLA check BEFORE querying database
  await verifyCustomerOrAdmin(userId, accessToken)

  try {
    const supabase = createServerClient()

    const { data: userOrders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Supabase error fetching orders:", error)
      return []
    }

    if (!userOrders || userOrders.length === 0) {
      return []
    }

    return userOrders.map((order) => ({
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      createdAt: order.created_at || order.createdAt,
      updatedAt: order.updated_at || order.updatedAt,
      userId: order.user_id,
      order_number: order.order_number,
    }))
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function getOrderById(id: string, accessToken?: string | null) {
  if (!id || typeof id !== "string") return null

  const supabase = createServerClient()
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !order) {
    return null
  }

  // Enforce BOLA: either an admin OR the exact customer who owns `order.user_id`
  try {
    const caller = await verifyCustomerOrAdmin(order.user_id || "__admin_only__", accessToken)
    if (!caller.isAdmin && (!order.user_id || caller.userId !== order.user_id)) {
      return null
    }
  } catch {
    return null
  }

  return {
    ...order,
    items: order.items as OrderItem[],
    total: Number(order.total),
    createdAt: order.created_at || order.createdAt,
    updatedAt: order.updated_at || order.updatedAt,
    userId: order.user_id,
    order_number: order.order_number,
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    await assertPermission("orders:manage")

    const validStatuses: OrderStatus[] = ["pending", "processing", "completed", "cancelled"]
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid order status: ${status}`)
    }

    const safeOrderId = sanitizePostgrestFilterValue(id)
    if (!safeOrderId) {
      throw new Error("Invalid order identifier.")
    }

    const supabase = createServerClient()

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single()

    if (error || !order) {
      console.error("Supabase error updating order:", error)
      throw new Error("Failed to update order.")
    }

    const formattedOrder = {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      order_number: order.order_number,
    }

    if (order.customerEmail) {
      sendOrderStatusUpdateEmail({
        customerName: order.customerName || "Customer",
        customerEmail: order.customerEmail,
        orderNumber: order.order_number || order.id,
        orderId: order.id,
        newStatus: status,
        items: (order.items as OrderItem[]).map((item) => ({
          name: item.name,
          quantity: item.quantity,
        })),
      }).catch((err) => console.error("Error sending status update email:", err))
    }

    try {
      const { data: inv } = await supabase
        .from("invoices")
        .select("customer_phone")
        .like("notes", `%Order ID: ${safeOrderId}%`)
        .maybeSingle()

      const phone = inv?.customer_phone || (order as any).customerPhone || (order as any).phone
      if (phone) {
        sendOrderStatusSMS(formattedOrder as Order, phone, status).catch((err) =>
          console.error("Error sending status update SMS:", err)
        )
      }
    } catch (smsErr) {
      console.error("Error finding customer phone for status update SMS:", smsErr)
    }

    try {
      const invStatus =
        status === "completed"
          ? "paid"
          : status === "processing"
          ? "sent"
          : status === "cancelled"
          ? "cancelled"
          : "draft"
      await supabase
        .from("invoices")
        .update({ status: invStatus, updated_at: new Date().toISOString() })
        .like("notes", `%Order ID: ${safeOrderId}%`)
    } catch (invErr) {
      console.error("Error syncing invoice status:", invErr)
    }

    try {
      const { logAuditEvent } = await import("./audit-actions")
      await logAuditEvent({
        module: "orders",
        action: "status_changed",
        record_id: id,
        record_number: formattedOrder.order_number || id,
        description: `Updated order ${formattedOrder.order_number || id} status to "${status.toUpperCase()}"`,
        previous_state: { status: order.status },
        new_state: { status },
      })
    } catch (auditErr) {
      console.warn("[updateOrderStatus] Audit log warning:", auditErr)
    }

    return formattedOrder
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

export async function deleteOrder(id: string, accessToken?: string | null) {
  try {
    if (!id || typeof id !== "string") {
      throw new Error("Invalid order identifier.")
    }

    const supabase = createServerClient()
    const { data: existingOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchErr || !existingOrder) {
      throw new Error("Order not found.")
    }

    // Check caller authorization: Admin with orders:manage OR owning customer cancelling a pending order
    const caller = await verifyCustomerOrAdmin(existingOrder.user_id || "__admin_only__", accessToken)
    if (caller.isAdmin) {
      await assertPermission("orders:manage")
    } else {
      if (existingOrder.status !== "pending") {
        throw new Error("Forbidden: Only pending orders can be cancelled by the customer.")
      }
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single()

    if (error || !order) {
      throw new Error("Failed to cancel order.")
    }

    // Restore product stock when an uncancelled order transitions to cancelled
    if (existingOrder.status !== "cancelled" && Array.isArray(existingOrder.items)) {
      for (const item of existingOrder.items as OrderItem[]) {
        const pid = Number(item?.id)
        const qty = Math.floor(Number(item?.quantity))
        if (Number.isFinite(pid) && pid > 0 && Number.isFinite(qty) && qty > 0) {
          try {
            const { data: prod } = await supabase.from("products").select("stock").eq("id", pid).single()
            if (prod) {
              await supabase
                .from("products")
                .update({ stock: Number(prod.stock || 0) + qty })
                .eq("id", pid)
            }
          } catch {}
        }
      }
    }

    const safeOrderId = sanitizePostgrestFilterValue(id)
    if (safeOrderId) {
      try {
        await supabase
          .from("invoices")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .like("notes", `%Order ID: ${safeOrderId}%`)
      } catch (invErr) {
        console.error("Error syncing invoice cancellation:", invErr)
      }
    }

    if (caller.isAdmin) {
      try {
        const { logAuditEvent } = await import("./audit-actions")
        await logAuditEvent({
          module: "orders",
          action: "deleted",
          record_id: id,
          record_number: order.order_number || id,
          description: `Cancelled order reference ${order.order_number || id}`,
        })
      } catch (auditErr) {
        console.warn("[deleteOrder] Audit log warning:", auditErr)
      }
    }

    return {
      ...order,
      items: order.items as OrderItem[],
      total: Number(order.total),
      order_number: order.order_number,
    }
  } catch (error) {
    console.error("Error cancelling order:", error)
    throw error
  }
}
