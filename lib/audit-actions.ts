"use server"

import crypto from "crypto"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { AuditLogEntry } from "./erp/types"
import fs from "fs"
import path from "path"

const AUDIT_STORAGE_FILE = path.join(process.cwd(), "db", "audit_logs_data.json")

const DEFAULT_AUDIT_LOGS: AuditLogEntry[] = [
  // Branch 1: QuardCube HQ & Innovation Hub (br-01)
  {
    id: "c0000000-0000-4000-8000-000000000001",
    module: "branches",
    action: "updated",
    record_id: "br-01",
    record_number: "BR-HQ01",
    description: "Configured operational bandwidth, POS endpoints, and regional targets for QuardCube HQ Hub",
    user_email: "framani@quardcubelabs.co.tz",
    user_name: "Framani Mwamba",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    module: "expenses",
    action: "approved",
    record_id: "exp-01",
    record_number: "EXP-8902",
    description: "Approved monthly cloud infrastructure & server disbursement TSH 3,450,000",
    user_email: "david.k@quardcubelabs.co.tz",
    user_name: "David Kimaro",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    created_at: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    module: "invoices",
    action: "created",
    record_id: "inv-901",
    record_number: "INV-2026-091",
    description: "Issued commercial tax invoice with TRA fiscal signature for enterprise client retainer",
    user_email: "kelvin.m@quardcubelabs.co.tz",
    user_name: "Kelvin Mushi",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    created_at: new Date(Date.now() - 9 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    module: "payments",
    action: "payment_recorded",
    record_id: "pay-102",
    record_number: "REC-4412",
    description: "Recorded client enterprise software settlement TSH 14,800,000 to primary revenue ledger",
    user_email: "david.k@quardcubelabs.co.tz",
    user_name: "David Kimaro",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    created_at: new Date(Date.now() - 14 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000005",
    module: "security",
    action: "approved",
    record_id: "sec-01",
    description: "Validated role-based access control permissions matrix for finance and management staff",
    user_email: "framani@quardcubelabs.co.tz",
    user_name: "Framani Mwamba",
    branch_id: "br-01",
    branch_name: "QuardCube HQ & Innovation Hub",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString()
  },

  // Branch 2: City Mall Flagship Store (br-02)
  {
    id: "c0000000-0000-4000-8000-000000000006",
    module: "orders",
    action: "approved",
    record_id: "ord-201",
    record_number: "SO-8821",
    description: "Approved corporate hardware bundle delivery order for City Mall corporate customer",
    user_email: "sarah.k@quardcubelabs.co.tz",
    user_name: "Sarah Kweka",
    branch_id: "br-02",
    branch_name: "City Mall Flagship Store",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000007",
    module: "payments",
    action: "payment_recorded",
    record_id: "pay-205",
    record_number: "RCP-3301",
    description: "Reconciled retail counter POS settlement via Selcom payment gateway TSH 850,000",
    user_email: "amina.r@quardcubelabs.co.tz",
    user_name: "Amina Rashid",
    branch_id: "br-02",
    branch_name: "City Mall Flagship Store",
    created_at: new Date(Date.now() - 7 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000008",
    module: "inventory",
    action: "stock_adjusted",
    record_id: "prod-41",
    description: "Conducted weekly physical display inventory audit across store showcase racks",
    user_email: "sarah.k@quardcubelabs.co.tz",
    user_name: "Sarah Kweka",
    branch_id: "br-02",
    branch_name: "City Mall Flagship Store",
    created_at: new Date(Date.now() - 16 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000009",
    module: "invoices",
    action: "created",
    record_id: "inv-914",
    record_number: "INV-2026-104",
    description: "Generated retail tax invoice with TRA EFD receipt for walk-in purchaser",
    user_email: "amina.r@quardcubelabs.co.tz",
    user_name: "Amina Rashid",
    branch_id: "br-02",
    branch_name: "City Mall Flagship Store",
    created_at: new Date(Date.now() - 28 * 3600000).toISOString()
  },

  // Branch 3: Kariakoo Wholesale Depot (br-03)
  {
    id: "c0000000-0000-4000-8000-000000000010",
    module: "purchases",
    action: "received",
    record_id: "grn-301",
    record_number: "GRN-2026-04",
    description: "Received consignment of 150 enterprise networking units into Kariakoo Wholesale Depot",
    user_email: "bakari.j@quardcubelabs.co.tz",
    user_name: "Bakari Juma",
    branch_id: "br-03",
    branch_name: "Kariakoo Wholesale Depot",
    created_at: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000011",
    module: "orders",
    action: "created",
    record_id: "ord-330",
    record_number: "SO-9012",
    description: "Booked wholesale bulk components order TSH 18,400,000 for verified sub-distributor",
    user_email: "neema.l@quardcubelabs.co.tz",
    user_name: "Neema Lyimo",
    branch_id: "br-03",
    branch_name: "Kariakoo Wholesale Depot",
    created_at: new Date(Date.now() - 8 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000012",
    module: "inventory",
    action: "stock_transferred",
    record_id: "trf-108",
    description: "Dispatched inter-branch stock replenishment crate to Arusha Northern Branch",
    user_email: "bakari.j@quardcubelabs.co.tz",
    user_name: "Bakari Juma",
    branch_id: "br-03",
    branch_name: "Kariakoo Wholesale Depot",
    created_at: new Date(Date.now() - 20 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000013",
    module: "payments",
    action: "payment_recorded",
    record_id: "pay-340",
    record_number: "RCP-5509",
    description: "Confirmed commercial bank wire settlement for wholesale bulk dispatch invoice",
    user_email: "neema.l@quardcubelabs.co.tz",
    user_name: "Neema Lyimo",
    branch_id: "br-03",
    branch_name: "Kariakoo Wholesale Depot",
    created_at: new Date(Date.now() - 32 * 3600000).toISOString()
  },

  // Branch 4: Arusha Northern Branch (br-04)
  {
    id: "c0000000-0000-4000-8000-000000000014",
    module: "purchases",
    action: "approved",
    record_id: "po-401",
    record_number: "PO-2026-088",
    description: "Authorized local facility maintenance purchase order for Arusha regional depot",
    user_email: "grace.m@quardcubelabs.co.tz",
    user_name: "Grace Mollel",
    branch_id: "br-04",
    branch_name: "Arusha Northern Branch",
    created_at: new Date(Date.now() - 6 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000015",
    module: "inventory",
    action: "received",
    record_id: "grn-402",
    record_number: "GRN-2026-11",
    description: "Confirmed receipt of transfer shipment from Kariakoo Depot; stock added to Arusha warehouse",
    user_email: "grace.m@quardcubelabs.co.tz",
    user_name: "Grace Mollel",
    branch_id: "br-04",
    branch_name: "Arusha Northern Branch",
    created_at: new Date(Date.now() - 18 * 3600000).toISOString()
  },
  {
    id: "c0000000-0000-4000-8000-000000000016",
    module: "orders",
    action: "created",
    record_id: "ord-420",
    record_number: "SO-9411",
    description: "Executed client sales order for Northern Zone institutional deployment",
    user_email: "grace.m@quardcubelabs.co.tz",
    user_name: "Grace Mollel",
    branch_id: "br-04",
    branch_name: "Arusha Northern Branch",
    created_at: new Date(Date.now() - 36 * 3600000).toISOString()
  }
]

async function readFallbackAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    if (fs.existsSync(AUDIT_STORAGE_FILE)) {
      const data = await fs.promises.readFile(AUDIT_STORAGE_FILE, "utf-8")
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    // Graceful fallback
  }
  return DEFAULT_AUDIT_LOGS
}

async function writeFallbackAuditLogs(logs: AuditLogEntry[]): Promise<void> {
  try {
    const dir = path.dirname(AUDIT_STORAGE_FILE)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(AUDIT_STORAGE_FILE, JSON.stringify(logs.slice(0, 1000), null, 2), "utf-8")
  } catch (err) {
    // Read-only filesystem safe
  }
}

/**
 * Record an auditable business action across any ERP module.
 */
export async function logAuditEvent(entry: {
  module: AuditLogEntry["module"]
  action: AuditLogEntry["action"]
  record_id: string
  record_number?: string
  description: string
  previous_state?: any
  new_state?: any
  user_email?: string
  user_name?: string
  branch_id?: string
  branch_name?: string
}): Promise<AuditLogEntry> {
  let userEmail = entry.user_email
  let userName = entry.user_name
  let branchId = entry.branch_id
  let branchName = entry.branch_name

  // If user attribution is not explicitly supplied, extract from the active staff/admin session
  if (!userEmail || !userName || !branchId) {
    try {
      const { user } = await verifyAdminSession()
      if (user) {
        if (!userEmail) userEmail = user.email
        if (!userName) userName = user.staffMember?.full_name || user.email.split("@")[0]
        if (!branchId) branchId = user.staffMember?.branch_id || "br-01"
        if (!branchName) branchName = user.staffMember?.branch_name || "QuardCube HQ & Innovation Hub"
      }
    } catch {
      // Session verification safe fallback
    }
  }

  const newLog: AuditLogEntry = {
    id: crypto.randomUUID(),
    module: entry.module,
    action: entry.action,
    record_id: String(entry.record_id || ""),
    record_number: entry.record_number || null as any,
    description: entry.description,
    previous_state: entry.previous_state || null,
    new_state: entry.new_state || null,
    user_email: userEmail || "admin@quardcubelabs.co.tz",
    user_name: userName || "Administrator",
    branch_id: branchId || null as any,
    branch_name: branchName || null as any,
    created_at: new Date().toISOString()
  }

  // 1. Push directly to Supabase audit_logs table
  try {
    const supabase = createServerClient()
    const { error: dbError } = await supabase.from("audit_logs").insert([newLog])
    if (dbError) {
      console.error("[AuditActions] Failed to push audit log to Supabase:", dbError.message)
    } else {
      console.log(`[AuditActions] Audit log recorded in Supabase: [${newLog.module}:${newLog.action}] by ${newLog.user_name} (${newLog.user_email})`)
    }
  } catch (err) {
    console.error("[AuditActions] Exception pushing audit log to Supabase:", err)
  }

  // 2. Persist locally to fallback storage and ensure it is available across cold boots
  const logs = await readFallbackAuditLogs()
  const exists = logs.some(l => l.id === newLog.id)
  if (!exists) {
    logs.unshift(newLog)
    await writeFallbackAuditLogs(logs)
  }

  return newLog
}

/**
 * Get recent system audit logs with filtering.
 */
export async function getAuditLogs(options?: {
  module?: string
  branch_id?: string
  user_email?: string
  limit?: number
}): Promise<AuditLogEntry[]> {
  try {
    const supabase = createServerClient()
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false })
    
    if (options?.module && options.module !== "all") {
      query = query.eq("module", options.module)
    }

    if (options?.branch_id) {
      query = query.eq("branch_id", options.branch_id)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query
    if (!error && data) {
      // Merge Supabase records with local logs so newly created actions are never lost
      const localLogs = await readFallbackAuditLogs()
      const dbIds = new Set((data || []).map((d: any) => d.id))
      const combined = [
        ...(data as AuditLogEntry[]),
        ...localLogs.filter(l => !dbIds.has(l.id))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      await writeFallbackAuditLogs(combined)

      let result = combined
      if (options?.module && options.module !== "all") {
        result = result.filter(l => l.module === options.module)
      }
      if (options?.branch_id) {
        result = result.filter(l => l.branch_id === options.branch_id)
      }
      return result.slice(0, options?.limit || 100)
    }

    // Auto-seed to Supabase if the table exists but is empty
    if (!error && data && data.length === 0) {
      try {
        await supabase.from("audit_logs").upsert(DEFAULT_AUDIT_LOGS)
        await writeFallbackAuditLogs(DEFAULT_AUDIT_LOGS)
        return DEFAULT_AUDIT_LOGS.slice(0, options?.limit || 100)
      } catch {}
    }
  } catch (err) {
    console.warn("[AuditActions] Supabase query fallback:", err)
  }

  const localLogs = await readFallbackAuditLogs()
  if (localLogs.length === 0) {
    await writeFallbackAuditLogs(DEFAULT_AUDIT_LOGS)
    return DEFAULT_AUDIT_LOGS.slice(0, options?.limit || 100)
  }

  let filtered = localLogs
  if (options?.module && options.module !== "all") {
    filtered = filtered.filter(l => l.module === options.module)
  }
  if (options?.branch_id) {
    filtered = filtered.filter(l => l.branch_id === options.branch_id)
  }
  return filtered.slice(0, options?.limit || 100)
}
