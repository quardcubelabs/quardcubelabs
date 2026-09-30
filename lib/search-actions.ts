"use server"

import { getAdminInvoices } from "./invoice-actions"
import { getAllOrders } from "./admin-actions"
import { getAdminQuotations } from "./quotation-actions"
import { getAdminProformas } from "./proforma-actions"
import { getAdminReceipts } from "./receipt-actions"
import { getProducts } from "./product-actions"
import { getAuthUsers } from "./auth-users-actions"
import { getSuppliers } from "./supplier-actions"
import { getPurchaseOrders } from "./purchase-actions"
import { getExpenses } from "./expense-actions"

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

/**
 * Universal Global Search across all ERP business entities.
 */
export async function universalSearch(query: string): Promise<SearchResultItem[]> {
  if (!query || query.trim().length < 2) return []

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
      usersResult,
      suppliers,
      purchaseOrders,
      expenses
    ] = await Promise.all([
      getAdminInvoices().catch(() => []),
      getAllOrders().catch(() => []),
      getAdminQuotations().catch(() => []),
      getAdminProformas().catch(() => []),
      getAdminReceipts().catch(() => []),
      getProducts().catch(() => []),
      getAuthUsers().catch(() => ({ users: [] })),
      getSuppliers().catch(() => []),
      getPurchaseOrders().catch(() => []),
      getExpenses().catch(() => [])
    ])

    // 1. Invoices
    invoices.forEach((inv: any) => {
      if (
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.customer_name?.toLowerCase().includes(q) ||
        inv.customer_email?.toLowerCase().includes(q)
      ) {
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
      }
    })

    // 2. Orders
    orders.forEach((ord: any) => {
      const ordNum = ord.order_number || ord.id
      if (
        ordNum.toLowerCase().includes(q) ||
        ord.customerName?.toLowerCase().includes(q) ||
        ord.customerEmail?.toLowerCase().includes(q)
      ) {
        results.push({
          id: ord.id,
          title: `Order #${ordNum} — ${ord.customerName || "Customer"}`,
          subtitle: `Total: TZS ${Number(ord.total).toLocaleString()}`,
          type: "order",
          category: "Order",
          url: `/admin/orders/${ord.id}`,
          badge: ord.status,
          amount: Number(ord.total)
        })
      }
    })

    // 3. Quotations
    quotations.forEach((qt: any) => {
      if (
        qt.quote_number?.toLowerCase().includes(q) ||
        qt.customer_name?.toLowerCase().includes(q) ||
        qt.customer_email?.toLowerCase().includes(q)
      ) {
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
      }
    })

    // 4. Proformas
    proformas.forEach((pf: any) => {
      if (
        pf.proforma_number?.toLowerCase().includes(q) ||
        pf.customer_name?.toLowerCase().includes(q)
      ) {
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
      }
    })

    // 5. Receipts
    receipts.forEach((rc: any) => {
      if (
        rc.receipt_number?.toLowerCase().includes(q) ||
        rc.customer_name?.toLowerCase().includes(q) ||
        rc.transaction_ref?.toLowerCase().includes(q)
      ) {
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
      }
    })

    // 6. Products
    products.forEach((p: any) => {
      if (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      ) {
        results.push({
          id: String(p.id),
          title: p.name,
          subtitle: `Category: ${p.category} • Stock: ${p.stock} units`,
          type: "product",
          category: "Product",
          url: `/admin/products/edit/${p.id}`,
          amount: Number(p.price)
        })
      }
    })

    // 7. Customers
    const users = Array.isArray(usersResult?.users) ? usersResult.users : []
    users.forEach((u: any) => {
      const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Customer"
      if (name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) {
        results.push({
          id: u.id,
          title: `${name}`,
          subtitle: `${u.email}`,
          type: "customer",
          category: "Customer",
          url: `/admin/users`
        })
      }
    })

    // 8. Suppliers
    suppliers.forEach((sup: any) => {
      if (
        sup.name?.toLowerCase().includes(q) ||
        sup.supplier_code?.toLowerCase().includes(q) ||
        sup.email?.toLowerCase().includes(q)
      ) {
        results.push({
          id: sup.id,
          title: `${sup.name} (${sup.supplier_code})`,
          subtitle: `Payable Balance: TZS ${Number(sup.current_balance).toLocaleString()} • ${sup.email}`,
          type: "supplier",
          category: "Supplier",
          url: `/admin/suppliers`,
          badge: sup.status
        })
      }
    })

    // 9. Purchase Orders
    purchaseOrders.forEach((po: any) => {
      if (
        po.po_number?.toLowerCase().includes(q) ||
        po.supplier_name?.toLowerCase().includes(q)
      ) {
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
      }
    })

    // 10. Expenses
    expenses.forEach((exp: any) => {
      if (
        exp.expense_number?.toLowerCase().includes(q) ||
        exp.description?.toLowerCase().includes(q) ||
        exp.vendor_name?.toLowerCase().includes(q) ||
        exp.category?.toLowerCase().includes(q)
      ) {
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
      }
    })

  } catch (err) {
    console.error("Error executing universal search:", err)
  }

  return results.slice(0, 20)
}
