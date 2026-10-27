"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { HardwareSerial, SerialWarrantyStatus } from "./erp/inventory-extra-types"
import { logAuditEvent } from "./audit-actions"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const SERIALS_STORAGE = path.join(process.cwd(), "db", "hardware_serials_data.json")

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

const DEFAULT_SERIALS: HardwareSerial[] = [
  {
    id: "ser-001",
    product_id: 1,
    product_name: "Hikvision 4K AcuSense ColorVu IP Dome Camera",
    serial_number: "DS-2CD2187G2-HIK-9921827",
    mac_address: "A4:14:37:88:9B:12",
    warehouse_id: "wh-dar-main",
    warehouse_name: "QuardCube Central Hub — Kigamboni",
    status: "in_stock",
    supplier_id: "sup-hik-001",
    supplier_name: "Hikvision East Africa Logistics",
    purchase_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
    warranty_months: 24,
    warranty_start_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
    warranty_end_date: new Date(Date.now() + 720 * 86400000).toISOString().split("T")[0],
    notes: "QC Tested - Passed 4K 30fps IR Night Vision Bench Test",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: "ser-002",
    product_id: 2,
    product_name: "Hikvision 16-Channel 4K NVR Network Video Recorder",
    serial_number: "DS-7616NXI-I2-HIK-8812903",
    mac_address: "A4:14:37:44:EE:80",
    warehouse_id: "wh-dar-main",
    warehouse_name: "QuardCube Central Hub — Kigamboni",
    status: "sold",
    supplier_id: "sup-hik-001",
    supplier_name: "Hikvision East Africa Logistics",
    invoice_number: "INV-2026-1001",
    customer_name: "Serengeti Freight Logistics Ltd",
    customer_phone: "+255 754 889 123",
    purchase_date: new Date(Date.now() - 20 * 86400000).toISOString().split("T")[0],
    warranty_months: 36,
    warranty_start_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    warranty_end_date: new Date(Date.now() + 1090 * 86400000).toISOString().split("T")[0],
    notes: "Installed at Central Control Room with 4x 8TB WD Purple Surveillance Drives",
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "ser-003",
    product_id: 3,
    product_name: "ASUS ExpertCenter D7 Mini Tower Core i7 Workstation",
    serial_number: "ASUS-D700MC-SN99182390",
    mac_address: "70:85:C2:55:10:4A",
    warehouse_id: "wh-dar-main",
    warehouse_name: "QuardCube Central Hub — Kigamboni",
    status: "reserved",
    supplier_id: "sup-asus-002",
    supplier_name: "ASUS Middle East & Africa FZE",
    purchase_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    warranty_months: 36,
    warranty_start_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    warranty_end_date: new Date(Date.now() + 1090 * 86400000).toISOString().split("T")[0],
    notes: "Allocated for CRDB Bank Technical Division Order",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

export async function getHardwareSerials(): Promise<HardwareSerial[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("hardware_serials").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) return data as HardwareSerial[]
  } catch {}

  const local = await readLocalFile<HardwareSerial[]>(SERIALS_STORAGE, DEFAULT_SERIALS)
  if (local.length === 0) {
    await writeLocalFile(SERIALS_STORAGE, DEFAULT_SERIALS)
    return DEFAULT_SERIALS
  }
  return local
}

export async function registerHardwareSerial(payload: Omit<HardwareSerial, "id" | "created_at" | "updated_at">): Promise<HardwareSerial> {
  const { user } = await verifyAdminSession()
  const newSerial: HardwareSerial = {
    id: `ser-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("hardware_serials").insert([newSerial])
  } catch {}

  const list = await getHardwareSerials()
  const updated = [newSerial, ...list.filter(s => s.id !== newSerial.id)]
  await writeLocalFile(SERIALS_STORAGE, updated)

  await logAuditEvent({
    module: "inventory",
    action: "created",
    record_id: newSerial.id,
    record_number: newSerial.serial_number,
    description: `Registered hardware serial ${newSerial.serial_number} for [${newSerial.product_name}]`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/inventory/serials")
  return newSerial
}

export async function updateSerialStatus(serialId: string, status: SerialWarrantyStatus, notes?: string): Promise<HardwareSerial | null> {
  const { user } = await verifyAdminSession()
  const list = await getHardwareSerials()
  const index = list.findIndex(s => s.id === serialId)
  if (index === -1) return null

  list[index].status = status
  if (notes) list[index].notes = notes
  list[index].updated_at = new Date().toISOString()

  try {
    const supabase = createServerClient()
    await supabase.from("hardware_serials").update({ status, notes: list[index].notes, updated_at: list[index].updated_at }).eq("id", serialId)
  } catch {}

  await writeLocalFile(SERIALS_STORAGE, list)

  await logAuditEvent({
    module: "inventory",
    action: "status_changed",
    record_id: serialId,
    record_number: list[index].serial_number,
    description: `Updated hardware serial ${list[index].serial_number} status to '${status}'`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/inventory/serials")
  return list[index]
}
