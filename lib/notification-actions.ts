"use server"

import { getAuditLogs } from "./audit-actions"
import { createServerClient } from "./supabase"
import { AuditLogEntry } from "./erp/types"

export interface AdminNotification {
  id: string
  title: string
  message: string
  time: string
  category: "orders" | "inventory" | "finance" | "system"
  read: boolean
  url: string
  createdAt: string
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

    if (diffSec < 60) return "just now"
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
    return `${Math.floor(diffSec / 604800)}w ago`
  } catch {
    return "recent"
  }
}

function mapAuditLogToNotification(log: AuditLogEntry): AdminNotification | null {
  const time = formatRelativeTime(log.created_at)
  const num = log.record_number ? `#${log.record_number}` : ""

  switch (log.module) {
    case "orders":
      return {
        id: `audit-${log.id}`,
        title: log.action === "created" 
          ? `New Customer Order ${num}`.trim()
          : log.action === "approved"
          ? `Order Approved ${num}`.trim()
          : `Order Update ${num}`.trim(),
        message: log.description,
        time,
        category: "orders",
        read: false,
        url: "/admin/orders",
        createdAt: log.created_at
      }

    case "invoices":
      return {
        id: `audit-${log.id}`,
        title: log.action === "created"
          ? `Commercial Tax Invoice Issued ${num}`.trim()
          : `Invoice ${log.action.replace('_', ' ')} ${num}`.trim(),
        message: log.description,
        time,
        category: "finance",
        read: false,
        url: "/admin/invoices",
        createdAt: log.created_at
      }

    case "expenses":
      return {
        id: `audit-${log.id}`,
        title: log.action === "created"
          ? `Expense Voucher Submitted ${num}`.trim()
          : `Expense Voucher Approved ${num}`.trim(),
        message: log.description,
        time,
        category: "finance",
        read: false,
        url: "/admin/expenses",
        createdAt: log.created_at
      }

    case "payments":
      return {
        id: `audit-${log.id}`,
        title: `Payment Settlement Reconciled ${num}`.trim(),
        message: log.description,
        time,
        category: "finance",
        read: false,
        url: "/admin/receipts",
        createdAt: log.created_at
      }

    case "inventory":
    case "products":
      return {
        id: `audit-${log.id}`,
        title: log.action === "stock_adjusted" || log.action === "stock_transferred"
          ? `Stock Movement Registered`
          : `Inventory Stock Update`,
        message: log.description,
        time,
        category: "inventory",
        read: false,
        url: "/admin/inventory",
        createdAt: log.created_at
      }

    case "purchases":
      return {
        id: `audit-${log.id}`,
        title: log.action === "received"
          ? `Consignment Received ${num}`.trim()
          : `Purchase Order ${log.action} ${num}`.trim(),
        message: log.description,
        time,
        category: "inventory",
        read: false,
        url: "/admin/purchases",
        createdAt: log.created_at
      }

    case "security":
    case "staff":
      return {
        id: `audit-${log.id}`,
        title: log.action === "login"
          ? `Staff System Login`
          : log.action === "access_granted"
          ? `Security Access Dispatched`
          : `Staff Account Event`,
        message: log.description,
        time,
        category: "system",
        read: false,
        url: "/admin/staff",
        createdAt: log.created_at
      }

    case "operational":
    case "projects":
      return {
        id: `audit-${log.id}`,
        title: `Executive Report Generated`,
        message: log.description,
        time,
        category: "system",
        read: false,
        url: "/admin/reports",
        createdAt: log.created_at
      }

    case "quotations":
      return {
        id: `audit-${log.id}`,
        title: `Commercial Quotation ${log.action} ${num}`.trim(),
        message: log.description,
        time,
        category: "orders",
        read: false,
        url: "/admin/quotations",
        createdAt: log.created_at
      }

    default:
      return null
  }
}

/**
 * Fetch real admin notifications aggregated from true system activity,
 * including low-stock alerts, pending orders, and recent audit logs.
 */
export async function getRealAdminNotifications(): Promise<AdminNotification[]> {
  const notifications: AdminNotification[] = []

  // 1. Fetch live low-stock alerts (products with stock <= 8)
  try {
    const supabase = createServerClient()
    const { data: lowStock } = await supabase
      .from("products")
      .select("id, name, stock")
      .lte("stock", 8)
      .order("stock", { ascending: true })
      .limit(3)

    if (lowStock && lowStock.length > 0) {
      for (const p of lowStock) {
        notifications.push({
          id: `live-low-stock-${p.id}`,
          title: `Low Stock Alert: ${p.name}`,
          message: `Remaining stock (${p.stock} units) is below reorder threshold (10).`,
          time: "critical alert",
          category: "inventory",
          read: false,
          url: "/admin/inventory",
          createdAt: new Date().toISOString()
        })
      }
    }
  } catch (err) {
    console.warn("[NotificationActions] Low stock query fallback:", err)
  }

  // 2. Fetch pending customer orders awaiting fulfillment
  try {
    const supabase = createServerClient()
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("id, order_number, total, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(3)

    if (pendingOrders && pendingOrders.length > 0) {
      for (const ord of pendingOrders) {
        notifications.push({
          id: `live-order-${ord.id}`,
          title: `Order Awaiting Fulfillment #${ord.order_number || ord.id.slice(0, 8)}`,
          message: `Order totaling TZS ${Number(ord.total).toLocaleString()} is pending warehouse dispatch.`,
          time: formatRelativeTime(ord.created_at || new Date().toISOString()),
          category: "orders",
          read: false,
          url: "/admin/orders",
          createdAt: ord.created_at || new Date().toISOString()
        })
      }
    }
  } catch (err) {
    console.warn("[NotificationActions] Orders query fallback:", err)
  }

  // 3. Fetch real audit logs and convert to notification items
  try {
    const auditLogs = await getAuditLogs({ limit: 35 })
    for (const log of auditLogs) {
      const notif = mapAuditLogToNotification(log)
      if (notif) {
        // Prevent duplicate entries
        const exists = notifications.some(n => n.id === notif.id)
        if (!exists) {
          notifications.push(notif)
        }
      }
    }
  } catch (err) {
    console.warn("[NotificationActions] Audit logs fallback:", err)
  }

  // Sort by createdAt descending (newest first)
  notifications.sort((a, b) => {
    const tA = new Date(a.createdAt).getTime()
    const tB = new Date(b.createdAt).getTime()
    return tB - tA
  })

  return notifications.slice(0, 25)
}
