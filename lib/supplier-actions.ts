"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { Supplier } from "./erp/types"
import { logAuditEvent } from "./audit-actions"
import fs from "fs"
import path from "path"

const SUPPLIERS_STORAGE = path.join(process.cwd(), "db", "suppliers_data.json")

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: "sup-hik-001",
    supplier_code: "SUP-HIK-001",
    name: "Hikvision East Africa Logistics",
    company_name: "Hikvision Digital Technology Co.",
    email: "sales.ea@hikvision.com",
    phone: "+255 768 111 222",
    address: "Ali Hassan Mwinyi Rd, Victoria",
    city: "Dar es Salaam",
    country: "Tanzania",
    tin_number: "102-394-881",
    vat_number: "VRN-40019283",
    payment_terms: "Net 30",
    opening_balance: 0,
    current_balance: 4500000,
    total_purchases_amount: 18500000,
    total_orders_count: 8,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "sup-asus-002",
    supplier_code: "SUP-ASUS-002",
    name: "ASUS Middle East & Africa FZE",
    company_name: "ASUSTeK Computer Inc.",
    email: "distribution@asus.me",
    phone: "+971 4 299 1234",
    address: "JAFZA South Zone 4",
    city: "Dubai",
    country: "UAE",
    tin_number: "990-234-112",
    vat_number: "VRN-99882211",
    payment_terms: "Net 45",
    opening_balance: 0,
    current_balance: 12800000,
    total_purchases_amount: 42000000,
    total_orders_count: 14,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "sup-tplink-003",
    supplier_code: "SUP-TPLINK-003",
    name: "TP-Link Tanzania Official Distributor",
    company_name: "TP-Link Technologies Africa",
    email: "orders.tz@tp-link.com",
    phone: "+255 712 345 678",
    address: "Nyerere Road, Industrial Area",
    city: "Dar es Salaam",
    country: "Tanzania",
    tin_number: "110-554-992",
    vat_number: "VRN-40098213",
    payment_terms: "Net 15",
    opening_balance: 0,
    current_balance: 1800000,
    total_purchases_amount: 9400000,
    total_orders_count: 6,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "sup-dahua-004",
    supplier_code: "SUP-DAHUA-004",
    name: "Dahua Technology Tanzania Depot",
    company_name: "Zhejiang Dahua Technology Co.",
    email: "tanzania@dahuatech.com",
    phone: "+255 744 555 666",
    address: "Bagamoyo Road, Mwenge",
    city: "Dar es Salaam",
    country: "Tanzania",
    tin_number: "105-882-334",
    vat_number: "VRN-40055211",
    payment_terms: "Net 30",
    opening_balance: 0,
    current_balance: 0,
    total_purchases_amount: 15200000,
    total_orders_count: 5,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

async function readFallbackSuppliers(): Promise<Supplier[]> {
  try {
    if (fs.existsSync(SUPPLIERS_STORAGE)) {
      const data = await fs.promises.readFile(SUPPLIERS_STORAGE, "utf-8")
      return JSON.parse(data) || DEFAULT_SUPPLIERS
    }
  } catch {}
  return DEFAULT_SUPPLIERS
}

async function writeFallbackSuppliers(suppliers: Supplier[]): Promise<void> {
  try {
    const dir = path.dirname(SUPPLIERS_STORAGE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(SUPPLIERS_STORAGE, JSON.stringify(suppliers, null, 2), "utf-8")
  } catch {}
}

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("suppliers").select("*").order("name")
    if (!error && data && data.length > 0) {
      return data as Supplier[]
    }
  } catch {}

  const local = await readFallbackSuppliers()
  if (local.length === 0) {
    await writeFallbackSuppliers(DEFAULT_SUPPLIERS)
    return DEFAULT_SUPPLIERS
  }
  return local
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const suppliers = await getSuppliers()
  return suppliers.find(s => s.id === id || s.supplier_code === id) || null
}

export async function createSupplier(data: Omit<Supplier, "id" | "supplier_code" | "created_at" | "updated_at">): Promise<Supplier> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const code = `SUP-${data.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
  const now = new Date().toISOString()

  const newSupplier: Supplier = {
    id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    supplier_code: code,
    ...data,
    current_balance: data.opening_balance || 0,
    created_at: now,
    updated_at: now
  }

  try {
    const supabase = createServerClient()
    await supabase.from("suppliers").insert([newSupplier])
  } catch {}

  const list = await readFallbackSuppliers()
  list.unshift(newSupplier)
  await writeFallbackSuppliers(list)

  await logAuditEvent({
    module: "suppliers",
    action: "created",
    record_id: newSupplier.id,
    record_number: newSupplier.supplier_code,
    description: `Registered new vendor/supplier: ${newSupplier.name} (${newSupplier.supplier_code})`
  })

  return newSupplier
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) throw new Error("Unauthorized: Admin access required")

  const now = new Date().toISOString()
  const list = await readFallbackSuppliers()
  const idx = list.findIndex(s => s.id === id || s.supplier_code === id)
  if (idx === -1) return null

  const updated: Supplier = {
    ...list[idx],
    ...updates,
    updated_at: now
  }
  list[idx] = updated
  await writeFallbackSuppliers(list)

  try {
    const supabase = createServerClient()
    await supabase.from("suppliers").update(updates).eq("id", id)
  } catch {}

  await logAuditEvent({
    module: "suppliers",
    action: "updated",
    record_id: id,
    record_number: updated.supplier_code,
    description: `Updated vendor details for: ${updated.name}`
  })

  return updated
}
