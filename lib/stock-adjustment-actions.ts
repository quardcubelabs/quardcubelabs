"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { StockAdjustment, StockAdjustmentReason } from "./erp/inventory-extra-types"
import { logAuditEvent } from "./audit-actions"
import { recordStockMovement } from "./inventory-actions"
import { createJournalEntry } from "./accounting-actions"
import { fetchErpRecords, persistErpRecords } from "./erp/erp-db-helper"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const ADJUSTMENTS_STORAGE = path.join(process.cwd(), "db", "stock_adjustments_data.json")

const DEFAULT_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: "adj-001",
    adjustment_number: "QCL-ADJ-2026-001",
    product_id: 1,
    product_name: "Hikvision 4K AcuSense ColorVu IP Dome Camera",
    warehouse_id: "wh-dar-main",
    warehouse_name: "QuardCube Central Hub — Kigamboni",
    previous_quantity: 45,
    quantity_adjusted: -1,
    new_quantity: 44,
    unit_cost: 285000,
    total_value_impact: -285000,
    reason: "Demonstration / Internal Lab Use",
    notes: "Allocated 1 unit to staging bench for client demo simulation",
    performed_by: "Administrator",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  }
]

export async function getStockAdjustments(): Promise<StockAdjustment[]> {
  return fetchErpRecords<StockAdjustment>("stock_adjustments", "erp_stock_adjustments", ADJUSTMENTS_STORAGE, DEFAULT_ADJUSTMENTS)
}

export async function createStockAdjustment(payload: {
  product_id: number
  product_name: string
  warehouse_id: string
  warehouse_name: string
  previous_quantity: number
  quantity_adjusted: number
  unit_cost: number
  reason: StockAdjustmentReason
  notes?: string
}): Promise<StockAdjustment> {
  const { user } = await verifyAdminSession()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const adjNumber = `QCL-ADJ-${new Date().getFullYear()}-${randomSuffix}`
  const newQuantity = payload.previous_quantity + payload.quantity_adjusted
  const totalImpact = payload.quantity_adjusted * payload.unit_cost

  const newAdjustment: StockAdjustment = {
    id: `adj-${Date.now()}`,
    adjustment_number: adjNumber,
    product_id: payload.product_id,
    product_name: payload.product_name,
    warehouse_id: payload.warehouse_id,
    warehouse_name: payload.warehouse_name,
    previous_quantity: payload.previous_quantity,
    quantity_adjusted: payload.quantity_adjusted,
    new_quantity: newQuantity,
    unit_cost: payload.unit_cost,
    total_value_impact: totalImpact,
    reason: payload.reason,
    notes: payload.notes,
    performed_by: user?.name || "Administrator",
    created_at: new Date().toISOString()
  }

  const list = await getStockAdjustments()
  const updated = [newAdjustment, ...list.filter(a => a.id !== newAdjustment.id)]
  await persistErpRecords("stock_adjustments", "erp_stock_adjustments", ADJUSTMENTS_STORAGE, updated)

  // Record traceable stock movement
  try {
    await recordStockMovement({
      productId: payload.product_id,
      productName: payload.product_name,
      warehouseId: payload.warehouse_id,
      movementType: payload.quantity_adjusted > 0 ? "manual_adjustment" : "damage_loss",
      quantity: payload.quantity_adjusted,
      unitCost: payload.unit_cost,
      reason: `${payload.reason}: ${payload.notes || ''}`
    })
  } catch (err) {
    console.error("Stock movement record failed:", err)
  }

  // Double-Entry Journal Entry:
  // If negative adjustment: Debit Inventory Loss/Expense (6010), Credit Inventory Asset (1300)
  // If positive adjustment: Debit Inventory Asset (1300), Credit Inventory Gain/Expense Contra
  try {
    const absVal = Math.abs(totalImpact)
    if (payload.quantity_adjusted < 0) {
      await createJournalEntry({
        entry_date: new Date().toISOString().split("T")[0],
        reference_type: "inventory_adjustment",
        reference_number: newAdjustment.adjustment_number,
        memo: `Physical stock write-down for ${newAdjustment.product_name} (${newAdjustment.reason})`,
        lines: [
          { account_id: "acc-6010", account_code: "6010", account_name: "Inventory Shrinkage & Loss", debit: absVal, credit: 0, description: `Write-off ${Math.abs(payload.quantity_adjusted)} units` },
          { account_id: "acc-1300", account_code: "1300", account_name: "Inventory Asset", debit: 0, credit: absVal, description: "Credit inventory asset valuation" }
        ]
      })
    }
  } catch (err) {
    console.error("Auto journal entry failed for stock adjustment:", err)
  }

  await logAuditEvent({
    module: "inventory",
    action: "stock_adjusted",
    record_id: newAdjustment.id,
    record_number: newAdjustment.adjustment_number,
    description: `Adjusted inventory for ${newAdjustment.product_name} by ${payload.quantity_adjusted > 0 ? '+' : ''}${payload.quantity_adjusted} units (${newAdjustment.reason})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/inventory/adjustments")
  revalidatePath("/admin/inventory")
  return newAdjustment
}
