"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { getAuthUsers } from "./auth-users-actions"

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  type: string
  category: "Invoice" | "Order" | "Quotation" | "Proforma" | "Receipt" | "Product" | "Customer" | "Supplier" | "Purchase Order" | "Expense" | string
  url: string
  badge?: string
  date?: string
  amount?: number
}

// Keep each table query small; the final result list is still capped at 20.
const PER_TABLE_LIMIT = 6

type SearchRow = Record<string, any>

/**
 * Escape value fragments used inside a PostgREST `.or()` filter.
 * Backslashes must be escaped first, then the reserved/like characters.
 */
function escapeFilterValue(value: string): string {
  return value
    .replace(/[\r\n\t]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([,()%_])/g, "\\$1")
}

/** Build `col.ilike.%q%,col2.ilike.%q%` for the given columns. */
function ilikeAny(columns: string[], query: string): string {
  const pattern = `%${escapeFilterValue(query.toLowerCase().trim())}%`
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",")
}

/**
 * Run one bounded, server-side filtered query. Callers add `.catch(() => [])`
 * so a missing table/column never affects the other entity searches.
 */
async function queryRows(
  table: string,
  columns: string,
  filter: string,
  orderColumn: string,
  ascending = false
): Promise<SearchRow[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .or(filter)
    .order(orderColumn, { ascending })
    .limit(PER_TABLE_LIMIT)

  if (error || !data) return []
  return data as SearchRow[]
}

/**
 * Customers come from the `profiles` table (mirrors auth user metadata).
 * Only when that yields nothing AND the query is an email search do we fall
 * back to the Auth API, and that fallback is bounded to a handful of rows.
 */
async function searchCustomers(query: string): Promise<SearchRow[]> {
  const profiles = await queryRows(
    "profiles",
    "id,email,full_name",
    ilikeAny(["full_name", "first_name", "last_name", "email"], query),
    "created_at"
  ).catch(() => [])

  if (profiles.length > 0 || !query.includes("@")) return profiles

  const usersResult = await getAuthUsers().catch(() => ({ users: [] }))
  const users = Array.isArray(usersResult?.users) ? usersResult.users : []
  return users
    .filter((u: any) => (u.email || "").toLowerCase().includes(query.toLowerCase()))
    .slice(0, PER_TABLE_LIMIT)
    .map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Customer",
    }))
}

/**
 * Universal Global Search across all ERP business entities.
 * All Supabase entities are filtered and limited server-side; no full-table
 * fetches and no verification-record enrichment/writes are performed here.
 */
export async function universalSearch(query: string): Promise<SearchResultItem[]> {
  if (!query || query.trim().length < 2) return []

  // Server actions are publicly addressable; require an admin session so
  // search cannot be used to enumerate business data.
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) return []

  const q = query.toLowerCase().trim()
  const results: SearchResultItem[] = []

  try {
    const [
      invoices,
      orders,
      quotations,
      proformas,
      receipts,
      products,
      customers,
      suppliers,
      purchaseOrders,
      expenses
    ] = await Promise.all([
      queryRows(
        "invoices",
        "id,invoice_number,customer_name,customer_email,total,status",
        ilikeAny(["invoice_number", "customer_name", "customer_email"], q),
        "created_at"
      ).catch(() => []),
      queryRows(
        "orders",
        "id,order_number,customer_name,customer_email,total,status",
        ilikeAny(["order_number", "customer_name", "customer_email"], q),
        "created_at"
      ).catch(() => []),
      queryRows(
        "quotations",
        "id,quote_number,customer_name,customer_email,total,status",
        ilikeAny(["quote_number", "customer_name", "customer_email"], q),
        "created_at"
      ).catch(() => []),
      queryRows(
        "proforma_invoices",
        "id,proforma_number,customer_name,total,status",
        ilikeAny(["proforma_number", "customer_name"], q),
        "created_at"
      ).catch(() => []),
      queryRows(
        "receipts",
        "id,receipt_number,customer_name,transaction_ref,amount_paid,status",
        ilikeAny(["receipt_number", "customer_name", "transaction_ref"], q),
        "created_at"
      ).catch(() => []),
      queryRows(
        "products",
        "id,name,category,stock,price",
        ilikeAny(["name", "category", "description"], q),
        "id"
      ).catch(() => []),
      searchCustomers(q).catch(() => []),
      queryRows(
        "suppliers",
        "id,name,supplier_code,email,current_balance,status",
        ilikeAny(["name", "supplier_code", "email"], q),
        "name",
        true
      ).catch(() => []),
      queryRows(
        "purchase_orders",
        "id,po_number,supplier_name,total,status",
        ilikeAny(["po_number", "supplier_name"], q),
        "created_at"
      ).catch(() => []),
      queryRows(
        "expenses",
        "id,expense_number,description,vendor_name,category,amount,status",
        ilikeAny(["expense_number", "description", "vendor_name", "category"], q),
        "expense_date"
      ).catch(() => [])
    ])

    // 1. Invoices
    invoices.forEach((inv: any) => {
      results.push({
        id: inv.id,
        title: `#${inv.invoice_number} — ${inv.customer_name}`,
        subtitle: `Total: TZS ${Number(inv.total).toLocaleString()} • ${inv.customer_email}`,
        type: "invoice",
        category: "Invoice",
        url: `/admin/invoices`,
        badge: inv.status,
        amount: Number(inv.total)
      })
    })

    // 2. Orders
    orders.forEach((ord: any) => {
      const ordNum = ord.order_number || ord.id
      results.push({
        id: ord.id,
        title: `Order #${ordNum} — ${ord.customer_name || "Customer"}`,
        subtitle: `Total: TZS ${Number(ord.total).toLocaleString()}`,
        type: "order",
        category: "Order",
        url: `/admin/orders/${ord.id}`,
        badge: ord.status,
        amount: Number(ord.total)
      })
    })

    // 3. Quotations
    quotations.forEach((qt: any) => {
      results.push({
        id: qt.id,
        title: `Quotation #${qt.quote_number} — ${qt.customer_name}`,
        subtitle: `Total: TZS ${Number(qt.total).toLocaleString()}`,
        type: "quotation",
        category: "Quotation",
        url: `/admin/quotations`,
        badge: qt.status,
        amount: Number(qt.total)
      })
    })

    // 4. Proformas
    proformas.forEach((pf: any) => {
      results.push({
        id: pf.id,
        title: `Proforma #${pf.proforma_number} — ${pf.customer_name}`,
        subtitle: `Total: TZS ${Number(pf.total).toLocaleString()}`,
        type: "proforma",
        category: "Proforma",
        url: `/admin/proforma-invoices`,
        badge: pf.status,
        amount: Number(pf.total)
      })
    })

    // 5. Receipts
    receipts.forEach((rc: any) => {
      results.push({
        id: rc.id,
        title: `Receipt #${rc.receipt_number} — ${rc.customer_name}`,
        subtitle: `Ref: ${rc.transaction_ref || "-"} • TZS ${Number(rc.amount_paid).toLocaleString()}`,
        type: "receipt",
        category: "Receipt",
        url: `/admin/receipts`,
        badge: rc.status,
        amount: Number(rc.amount_paid)
      })
    })

    // 6. Products
    products.forEach((p: any) => {
      results.push({
        id: String(p.id),
        title: p.name,
        subtitle: `Category: ${p.category} • Stock: ${p.stock} units`,
        type: "product",
        category: "Product",
        url: `/admin/products/edit/${p.id}`,
        amount: Number(p.price)
      })
    })

    // 7. Customers (profiles, with bounded auth-user fallback for email queries)
    customers.forEach((u: any) => {
      const name = u.full_name || u.email?.split("@")[0] || "Customer"
      results.push({
        id: u.id,
        title: `${name}`,
        subtitle: `${u.email}`,
        type: "customer",
        category: "Customer",
        url: `/admin/users`
      })
    })

    // 8. Suppliers
    suppliers.forEach((sup: any) => {
      results.push({
        id: sup.id,
        title: `${sup.name} (${sup.supplier_code})`,
        subtitle: `Payable Balance: TZS ${Number(sup.current_balance).toLocaleString()} • ${sup.email}`,
        type: "supplier",
        category: "Supplier",
        url: `/admin/suppliers`,
        badge: sup.status
      })
    })

    // 9. Purchase Orders
    purchaseOrders.forEach((po: any) => {
      results.push({
        id: po.id,
        title: `PO #${po.po_number} — ${po.supplier_name}`,
        subtitle: `Total: TZS ${Number(po.total).toLocaleString()} • ${po.status}`,
        type: "purchase_order",
        category: "Purchase Order",
        url: `/admin/purchases`,
        badge: po.status,
        amount: Number(po.total)
      })
    })

    // 10. Expenses
    expenses.forEach((exp: any) => {
      results.push({
        id: exp.id,
        title: `Expense #${exp.expense_number} — ${exp.category}`,
        subtitle: `TZS ${Number(exp.amount).toLocaleString()} • ${exp.vendor_name || exp.description}`,
        type: "expense",
        category: "Expense",
        url: `/admin/expenses`,
        badge: exp.status,
        amount: Number(exp.amount)
      })
    })

  } catch (err) {
    console.error("Error executing universal search:", err)
  }

  return results.slice(0, 20)
}
