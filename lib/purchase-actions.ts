"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, GoodsReceipt } from "./erp/types"
import { logAuditEvent } from "./audit-actions"
import { recordStockMovement } from "./inventory-actions"
import { getOrCreateDocumentVerification } from "./document-verification"
import fs from "fs"
import path from "path"

const PO_STORAGE = path.join(process.cwd(), "db", "purchase_orders_data.json")
const GRN_STORAGE = path.join(process.cwd(), "db", "goods_receipts_data.json")

async function readLocalData<T>(filePath: string, defaultVal: T): Promise<T> {
  try {
    if (fs.existsSync(filePath)) {
      const raw = await fs.promises.readFile(filePath, "utf-8")
      return JSON.parse(raw) || defaultVal
    }
  } catch {}
  return defaultVal
}

async function writeLocalData(filePath: string, data: any): Promise<void> {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
  } catch {}
}

function generatePoNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `QCL-PO-${year}-${rand}`
}

function generateGrnNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `QCL-GRN-${year}-${rand}`
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) {
      return data as PurchaseOrder[]
    }
  } catch {}

  return await readLocalData<PurchaseOrder[]>(PO_STORAGE, [])
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const orders = await getPurchaseOrders()
  return orders.find(po => po.id === id || po.po_number === id) || null
}

export async function createPurchaseOrder(data: {
  supplierId: string
  supplierName: string
  supplierEmail?: string
  supplierPhone?: string
  supplierAddress?: string
  warehouseId?: string
  warehouseName?: string
  expectedDeliveryDate?: string
  items: PurchaseOrderItem[]
  taxRate?: number
  discountAmount?: number
  shippingAmount?: number
  notes?: string
  termsConditions?: string
}): Promise<PurchaseOrder> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const poNumber = generatePoNumber()
  const now = new Date().toISOString()
  const subtotal = data.items.reduce((sum, it) => sum + Number(it.total_cost || (it.quantity * it.unit_cost)), 0)
  const taxRate = Number(data.taxRate || 0)
  const taxAmount = (subtotal * taxRate) / 100
  const discountAmount = Number(data.discountAmount || 0)
  const shippingAmount = Number(data.shippingAmount || 0)
  const total = subtotal + taxAmount + shippingAmount - discountAmount

  const newPo: PurchaseOrder = {
    id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    po_number: poNumber,
    supplier_id: data.supplierId,
    supplier_name: data.supplierName,
    supplier_email: data.supplierEmail,
    supplier_phone: data.supplierPhone,
    supplier_address: data.supplierAddress,
    warehouse_id: data.warehouseId || "wh-dar-main",
    warehouse_name: data.warehouseName || "QuardCube Central Hub — Kigamboni",
    order_date: now.split("T")[0],
    expected_delivery_date: data.expectedDeliveryDate,
    items: data.items.map(it => ({
      ...it,
      received_quantity: 0
    })),
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    shipping_amount: shippingAmount,
    total,
    amount_paid: 0,
    balance_due: total,
    status: "draft",
    payment_status: "unpaid",
    notes: data.notes,
    terms_conditions: data.termsConditions || "Standard Vendor Procurement Terms & Warranty Apply",
    created_by: "Administrator",
    created_at: now,
    updated_at: now
  }

  // Attach Document Verification
  try {
    const v = await getOrCreateDocumentVerification({
      documentType: "order",
      documentId: newPo.id,
      documentNumber: newPo.po_number,
      status: "valid",
      metadata: {
        customer_name: newPo.supplier_name,
        amount: newPo.total,
        currency: "TZS",
        issuer_name: "QuardCube Labs Limited"
      }
    })
    newPo.verification_token = v.verification_token
    newPo.verification_url = v.verification_url
  } catch {}

  try {
    const supabase = createServerClient()
    await supabase.from("purchase_orders").insert([newPo])
  } catch {}

  const list = await readLocalData<PurchaseOrder[]>(PO_STORAGE, [])
  list.unshift(newPo)
  await writeLocalData(PO_STORAGE, list)

  await logAuditEvent({
    module: "purchases",
    action: "created",
    record_id: newPo.id,
    record_number: newPo.po_number,
    description: `Created Purchase Order #${newPo.po_number} for supplier ${newPo.supplier_name} (TZS ${newPo.total.toLocaleString()})`
  })

  return newPo
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<PurchaseOrder | null> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const list = await readLocalData<PurchaseOrder[]>(PO_STORAGE, [])
  const idx = list.findIndex(p => p.id === id || p.po_number === id)
  if (idx === -1) return null

  list[idx].status = status
  list[idx].updated_at = new Date().toISOString()
  await writeLocalData(PO_STORAGE, list)

  try {
    const supabase = createServerClient()
    await supabase.from("purchase_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
  } catch {}

  await logAuditEvent({
    module: "purchases",
    action: "status_changed",
    record_id: id,
    record_number: list[idx].po_number,
    description: `Purchase order #${list[idx].po_number} status updated to "${status}"`
  })

  return list[idx]
}

/**
 * GOODS RECEIVING WORKFLOW:
 * When supplier delivers products against a Purchase Order,
 * receives quantities, increases inventory stock, and logs auditable movements.
 */
export async function createGoodsReceipt(data: {
  purchaseOrderId: string
  warehouseId?: string
  warehouseName?: string
  receivedItems: Array<{
    productId: number
    name: string
    quantityReceived: number
    unitCost: number
  }>
  deliveryNoteNumber?: string
  carrierName?: string
  notes?: string
}): Promise<GoodsReceipt> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const po = await getPurchaseOrderById(data.purchaseOrderId)
  if (!po) throw new Error("Purchase Order not found.")

  const grnNumber = generateGrnNumber()
  const now = new Date().toISOString()

  // 1. Process each received item into inventory stock ledger
  for (const item of data.receivedItems) {
    if (item.quantityReceived > 0) {
      await recordStockMovement({
        productId: item.productId,
        productName: item.name,
        warehouseId: data.warehouseId || po.warehouse_id || "wh-dar-main",
        movementType: "purchase_received",
        quantity: item.quantityReceived,
        referenceType: "purchase_order",
        referenceId: po.id,
        referenceNumber: po.po_number,
        unitCost: item.unitCost,
        reason: `Goods receipt for PO #${po.po_number} (GRN #${grnNumber})`
      })
    }
  }

  // 2. Update PO items received counts and determine completion status
  const updatedPoItems = po.items.map(poIt => {
    const matched = data.receivedItems.find(r => r.productId === poIt.product_id)
    const newRec = (poIt.received_quantity || 0) + (matched?.quantityReceived || 0)
    return {
      ...poIt,
      received_quantity: newRec
    }
  })

  const allFulfilled = updatedPoItems.every(it => (it.received_quantity || 0) >= it.quantity)
  const anyReceived = updatedPoItems.some(it => (it.received_quantity || 0) > 0)
  const newPoStatus: PurchaseOrderStatus = allFulfilled ? "received" : anyReceived ? "partially_received" : po.status

  const poList = await readLocalData<PurchaseOrder[]>(PO_STORAGE, [])
  const poIdx = poList.findIndex(p => p.id === po.id)
  if (poIdx !== -1) {
    poList[poIdx].items = updatedPoItems
    poList[poIdx].status = newPoStatus
    poList[poIdx].updated_at = now
    await writeLocalData(PO_STORAGE, poList)
  }

  // 3. Save Goods Receipt Record
  const newGrn: GoodsReceipt = {
    id: `grn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    grn_number: grnNumber,
    purchase_order_id: po.id,
    po_number: po.po_number,
    supplier_id: po.supplier_id,
    supplier_name: po.supplier_name,
    warehouse_id: data.warehouseId || po.warehouse_id,
    warehouse_name: data.warehouseName || po.warehouse_name,
    receipt_date: now.split("T")[0],
    received_items: data.receivedItems.map(it => ({
      product_id: it.productId,
      name: it.name,
      ordered_quantity: po.items.find(pi => pi.product_id === it.productId)?.quantity || it.quantityReceived,
      received_quantity: it.quantityReceived,
      unit_cost: it.unitCost
    })),
    delivery_note_number: data.deliveryNoteNumber,
    carrier_name: data.carrierName,
    status: "completed",
    received_by: "Administrator",
    notes: data.notes,
    created_at: now
  }

  const grnList = await readLocalData<GoodsReceipt[]>(GRN_STORAGE, [])
  grnList.unshift(newGrn)
  await writeLocalData(GRN_STORAGE, grnList)

  await logAuditEvent({
    module: "purchases",
    action: "received",
    record_id: newGrn.id,
    record_number: newGrn.grn_number,
    description: `Goods Received Note #${newGrn.grn_number} processed for PO #${po.po_number} (${data.receivedItems.reduce((s, i) => s + i.quantityReceived, 0)} units added to inventory)`
  })

  return newGrn
}
