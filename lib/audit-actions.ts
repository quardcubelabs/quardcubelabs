"use server"

import { createServerClient } from "@/lib/supabase"
import { AuditLogEntry } from "./erp/types"
import fs from "fs"
import path from "path"

const AUDIT_STORAGE_FILE = path.join(process.cwd(), "db", "audit_logs_data.json")

async function readFallbackAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    if (fs.existsSync(AUDIT_STORAGE_FILE)) {
      const data = await fs.promises.readFile(AUDIT_STORAGE_FILE, "utf-8")
      return JSON.parse(data) || []
    }
  } catch (err) {
    // Graceful fallback
  }
  return []
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
}): Promise<AuditLogEntry> {
  const newLog: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    module: entry.module,
    action: entry.action,
    record_id: entry.record_id,
    record_number: entry.record_number,
    description: entry.description,
    previous_state: entry.previous_state || null,
    new_state: entry.new_state || null,
    user_email: entry.user_email || "admin@quardcubelabs.co.tz",
    user_name: entry.user_name || "Administrator",
    created_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("audit_logs").insert([newLog])
  } catch {
    // Fallback store
  }

  const logs = await readFallbackAuditLogs()
  logs.unshift(newLog)
  await writeFallbackAuditLogs(logs)

  return newLog
}

/**
 * Get recent system audit logs with filtering.
 */
export async function getAuditLogs(options?: {
  module?: string
  limit?: number
}): Promise<AuditLogEntry[]> {
  try {
    const supabase = createServerClient()
    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false })
    
    if (options?.module && options.module !== "all") {
      query = query.eq("module", options.module)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    } else {
      query = query.limit(100)
    }

    const { data, error } = await query
    if (!error && data && data.length > 0) {
      return data as AuditLogEntry[]
    }
  } catch {
    // Fallback
  }

  const localLogs = await readFallbackAuditLogs()
  if (options?.module && options.module !== "all") {
    return localLogs.filter(l => l.module === options.module)
  }
  return localLogs.slice(0, options?.limit || 100)
}
