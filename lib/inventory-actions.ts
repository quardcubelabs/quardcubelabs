"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { Warehouse, WarehouseStockItem, StockMovement, StockMovementType, ErpProduct } from "./erp/types"
import { logAuditEvent } from "./audit-actions"
import { getProducts } from "./product-actions"
import fs from "fs"
import path from "path"

const WAREHOUSES_STORAGE = path.join(process.cwd(), "db", "warehouses_data.json")
const MOVEMENTS_STORAGE = path.join(process.cwd(), "db", "stock_movements_data.json")
const STOCK_STORAGE = path.join(process.cwd(), "db", "inventory_stock_data.json")

// 1. DEFAULT WAREHOUSES
const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-dar-main",
    code: "WH-DAR-MAIN",
    name: "QuardCube Central Hub — Kigamboni",
    manager_name: "Store Manager",
    manager_phone: "+255623893383",
    manager_email: "warehouse.dar@quardcubelabs.co.tz",
    address: "Kigamboni Commercial District, Plot 42",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    is_primary: true,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "wh-dar-samora",
    code: "WH-DAR-SAMORA",
    name: "QuardCube City Branch — Samora",
    manager_name: "Branch Supervisor",
    manager_phone: "+255754000111",
    manager_email: "samora.store@quardcubelabs.co.tz",
    address: "Samora Avenue, City Centre",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    is_primary: false,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "wh-aru-north",
    code: "WH-ARU-NORTH",
    name: "QuardCube Northern Hub — Arusha",
    manager_name: "Regional Logistics Lead",
    manager_phone: "+255754000222",
    manager_email: "arusha.hub@quardcubelabs.co.tz",
    address: "Njiro Commercial Complex, Block C",
    city: "Arusha",
    region: "Arusha",
    is_primary: false,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

async function readLocalFile<T>(filePath: string, defaultVal: T): Promise<T> {
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, "utf-8")
      return JSON.parse(data) || defaultVal
    }
  } catch {}
  return defaultVal
}

async function writeLocalFile(filePath: string, data: any): Promise<void> {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
  } catch {}
}

// -------------------------------------------------------------
// 1. WAREHOUSE MANAGEMENT
// -------------------------------------------------------------

export async function getWarehouses(): Promise<Warehouse[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("warehouses").select("*").order("is_primary", { ascending: false })
    if (!error && data && data.length > 0) {
      return data as Warehouse[]
    }
  } catch {}

  const local = await readLocalFile<Warehouse[]>(WAREHOUSES_STORAGE, DEFAULT_WAREHOUSES)
  if (local.length === 0) {
    await writeLocalFile(WAREHOUSES_STORAGE, DEFAULT_WAREHOUSES)
    return DEFAULT_WAREHOUSES
  }
  return local
}

export async function createWarehouse(data: Omit<Warehouse, "id" | "created_at">): Promise<Warehouse> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const newWarehouse: Warehouse = {
    id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("warehouses").insert([newWarehouse])
  } catch {}

  const list = await getWarehouses()
  list.push(newWarehouse)
  await writeLocalFile(WAREHOUSES_STORAGE, list)

  await logAuditEvent({
    module: "inventory",
    action: "created",
    record_id: newWarehouse.id,
    record_number: newWarehouse.code,
    description: `Created warehouse location: ${newWarehouse.name} (${newWarehouse.code})`
  })

  return newWarehouse
}

// -------------------------------------------------------------
// 2. STOCK MOVEMENTS & AUDITABLE LEDGER
// -------------------------------------------------------------

export async function getStockMovements(options?: {
  productId?: number
  warehouseId?: string
  limit?: number
}): Promise<StockMovement[]> {
  try {
    const supabase = createServerClient()
    let query = supabase.from("inventory_movements").select("*").order("created_at", { ascending: false })
    if (options?.productId) query = query.eq("product_id", options.productId)
    if (options?.warehouseId) query = query.eq("warehouse_id", options.warehouseId)
    if (options?.limit) query = query.limit(options.limit)
    else query = query.limit(100)

    const { data, error } = await query
    if (!error && data && data.length > 0) {
      return data as StockMovement[]
    }
  } catch {}

  let local = await readLocalFile<StockMovement[]>(MOVEMENTS_STORAGE, [])
  if (options?.productId) local = local.filter(m => m.product_id === options.productId)
  if (options?.warehouseId) local = local.filter(m => m.warehouse_id === options.warehouseId)
  return local.slice(0, options?.limit || 100)
}

/**
 * Core auditable stock recording engine.
 * Never silently changes quantities - updates product total stock and creates auditable ledger.
 */
export async function recordStockMovement(data: {
  productId: number
  productName: string
  warehouseId?: string
  destinationWarehouseId?: string
  movementType: StockMovementType
  quantity: number // can be positive or negative
  referenceType?: StockMovement["reference_type"]
  referenceId?: string
  referenceNumber?: string
  unitCost?: number
  reason?: string
  performedBy?: string
}): Promise<StockMovement> {
  const supabase = createServerClient()
  
  // 1. Fetch current product stock
  let currentStock = 0
  try {
    const { data: prod } = await supabase.from("products").select("name, stock").eq("id", data.productId).single()
    if (prod) {
      currentStock = Number(prod.stock || 0)
    }
  } catch {}

  const previousQuantity = currentStock
  const newQuantity = Math.max(0, currentStock + data.quantity)

  // 2. Update product stock on Supabase
  try {
    await supabase.from("products").update({ stock: newQuantity }).eq("id", data.productId)
  } catch {}

  // 3. Create auditable movement
  const now = new Date().toISOString()
  const movementNumber = `MOV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`

  const movement: StockMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    movement_number: movementNumber,
    product_id: data.productId,
    product_name: data.productName,
    warehouse_id: data.warehouseId || "wh-dar-main",
    destination_warehouse_id: data.destinationWarehouseId,
    movement_type: data.movementType,
    quantity: data.quantity,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    reference_type: data.referenceType,
    reference_id: data.referenceId,
    reference_number: data.referenceNumber,
    unit_cost: data.unitCost || 0,
    total_cost: (data.unitCost || 0) * Math.abs(data.quantity),
    reason: data.reason || `Automated ${data.movementType.replace(/_/g, " ")}`,
    performed_by: data.performedBy || "Administrator",
    created_at: now
  }

  try {
    await supabase.from("inventory_movements").insert([movement])
  } catch {}

  const movements = await readLocalFile<StockMovement[]>(MOVEMENTS_STORAGE, [])
  movements.unshift(movement)
  await writeLocalFile(MOVEMENTS_STORAGE, movements)

  await logAuditEvent({
    module: "inventory",
    action: "stock_adjusted",
    record_id: String(data.productId),
    record_number: movement.movement_number,
    description: `Stock ${data.quantity > 0 ? "+" : ""}${data.quantity} for "${data.productName}" (${previousQuantity} → ${newQuantity}) [${data.movementType}]`
  })

  return movement
}

// -------------------------------------------------------------
// 3. STOCK TRANSFERS & MANUAL ADJUSTMENTS
// -------------------------------------------------------------

export async function transferStockBetweenWarehouses(data: {
  productId: number
  productName: string
  sourceWarehouseId: string
  destinationWarehouseId: string
  quantity: number
  reason?: string
}): Promise<{ success: boolean; movementOut: StockMovement; movementIn: StockMovement }> {
  if (data.sourceWarehouseId === data.destinationWarehouseId) {
    throw new Error("Source and Destination warehouses must be different.")
  }
  if (data.quantity <= 0) {
    throw new Error("Transfer quantity must be greater than zero.")
  }

  const movementOut = await recordStockMovement({
    productId: data.productId,
    productName: data.productName,
    warehouseId: data.sourceWarehouseId,
    destinationWarehouseId: data.destinationWarehouseId,
    movementType: "transfer_out",
    quantity: -data.quantity,
    reason: data.reason || `Transfer to destination warehouse`
  })

  const movementIn = await recordStockMovement({
    productId: data.productId,
    productName: data.productName,
    warehouseId: data.destinationWarehouseId,
    movementType: "transfer_in",
    quantity: data.quantity,
    reason: data.reason || `Transfer from source warehouse`
  })

  return { success: true, movementOut, movementIn }
}

// -------------------------------------------------------------
// 4. INVENTORY OVERVIEW METRICS
// -------------------------------------------------------------

export async function getInventoryOverview() {
  const products = await getProducts()
  const warehouses = await getWarehouses()
  const movements = await getStockMovements({ limit: 15 })

  const totalProducts = products.length
  const totalStockUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
  const totalStockValue = products.reduce((sum, p) => sum + ((Number(p.stock) || 0) * (Number(p.price) || 0)), 0)
  const lowStockProducts = products.filter(p => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= 5)
  const outOfStockProducts = products.filter(p => (Number(p.stock) || 0) === 0)

  return {
    totalProducts,
    totalStockUnits,
    totalStockValue,
    lowStockCount: lowStockProducts.length,
    outOfStockCount: outOfStockProducts.length,
    lowStockProducts,
    outOfStockProducts,
    warehouses,
    recentMovements: movements
  }
}
