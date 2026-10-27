"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { CrmLead, CrmDeal, CrmActivity, CustomerAccount, LeadStatus, DealStage } from "./erp/crm-types"
import { logAuditEvent } from "./audit-actions"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

const LEADS_FILE = path.join(process.cwd(), "db", "crm_leads_data.json")
const DEALS_FILE = path.join(process.cwd(), "db", "crm_deals_data.json")
const ACTIVITIES_FILE = path.join(process.cwd(), "db", "crm_activities_data.json")
const CUSTOMERS_FILE = path.join(process.cwd(), "db", "crm_customers_data.json")

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
// DEFAULT DATA
// -------------------------------------------------------------
const DEFAULT_LEADS: CrmLead[] = [
  {
    id: "lead-001",
    lead_number: "QCL-LD-2026-001",
    first_name: "Baraka",
    last_name: "Massawe",
    company_name: "Serengeti Freight Logistics Ltd",
    email: "b.massawe@serengetifreight.co.tz",
    phone: "+255 754 889 123",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    source: "CCTV Survey Request",
    status: "qualified",
    estimated_value: 18500000,
    assigned_to_name: "David Kimaro",
    notes: "Requires full yard surveillance with 16 4K AcuSense cameras and remote NVR viewing",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "lead-002",
    lead_number: "QCL-LD-2026-002",
    first_name: "Fatma",
    last_name: "Al-Jabri",
    company_name: "Zanzibar Oceanfront Resort",
    email: "fatma.aljabri@oceanfront.co.tz",
    phone: "+255 777 441 900",
    city: "Zanzibar City",
    region: "Zanzibar",
    source: "Website Form",
    status: "contacted",
    estimated_value: 34000000,
    assigned_to_name: "Kelvin Mushi",
    notes: "Inquiry for guest Wi-Fi 6 mesh infrastructure and 32 IP cameras for villas",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: "lead-003",
    lead_number: "QCL-LD-2026-003",
    first_name: "Geoffrey",
    last_name: "Mchau",
    company_name: "Kilimanjaro Agro-Processors",
    email: "gmchau@kiliagro.com",
    phone: "+255 784 102 334",
    city: "Moshi",
    region: "Kilimanjaro",
    source: "Corporate Tender",
    status: "new",
    estimated_value: 45000000,
    assigned_to_name: "Framani Mwamba",
    notes: "Tender published for factory perimeter optical beam detection and ANPR gates",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const DEFAULT_DEALS: CrmDeal[] = [
  {
    id: "deal-001",
    deal_number: "QCL-DL-2026-101",
    title: "Serengeti Logistics Yard Surveillance & Access Control",
    customer_name: "Serengeti Freight Logistics Ltd",
    customer_email: "b.massawe@serengetifreight.co.tz",
    customer_phone: "+255 754 889 123",
    stage: "proposal_quote",
    amount: 18500000,
    probability: 75,
    expected_close_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    assigned_to_name: "David Kimaro",
    notes: "Quotation QCL-QT-2026-1002 submitted to management board",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "deal-002",
    deal_number: "QCL-DL-2026-102",
    title: "CRDB Bank Branch Workstation Refresh (8 Units)",
    customer_name: "CRDB Bank Technical Division",
    customer_email: "procurement@crdbbank.co.tz",
    customer_phone: "+255 22 211 7441",
    stage: "negotiation",
    amount: 28400000,
    probability: 90,
    expected_close_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    assigned_to_name: "Framani Mwamba",
    notes: "Final discount terms approved by executive committee",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "deal-003",
    deal_number: "QCL-DL-2026-093",
    title: "Bakhresa Group Milling Facility Security Cameras",
    customer_name: "Bakhresa Food Products Ltd",
    customer_email: "security@bakhresa.com",
    customer_phone: "+255 22 286 1122",
    stage: "won",
    amount: 52000000,
    probability: 100,
    expected_close_date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    assigned_to_name: "Kelvin Mushi",
    notes: "Contract signed, converted to Sales Order SO-2026-081",
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString()
  }
]

const DEFAULT_ACTIVITIES: CrmActivity[] = [
  {
    id: "act-001",
    deal_id: "deal-001",
    customer_name: "Serengeti Freight Logistics Ltd",
    activity_type: "site_visit",
    subject: "On-site cable survey & camera angle verification",
    description: "Verify Cat6 length from gatehouse to central server room; check light conditions at night",
    due_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    status: "pending",
    assigned_to_name: "David Kimaro",
    created_at: new Date().toISOString()
  },
  {
    id: "act-002",
    deal_id: "deal-002",
    customer_name: "CRDB Bank Technical Division",
    activity_type: "call",
    subject: "Follow-up on purchase order approval with Finance Director",
    description: "Check if board resolution signed and Selcom bank transfer scheduled",
    due_date: new Date(Date.now() + 1 * 86400000).toISOString().split("T")[0],
    status: "pending",
    assigned_to_name: "Framani Mwamba",
    created_at: new Date().toISOString()
  },
  {
    id: "act-003",
    lead_id: "lead-002",
    customer_name: "Zanzibar Oceanfront Resort",
    activity_type: "meeting",
    subject: "Zoom technical discovery for Wi-Fi 6 coverage",
    description: "Discuss architectural floorplans and outdoor salt-fog resistant access points",
    due_date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    status: "completed",
    assigned_to_name: "Kelvin Mushi",
    completed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  }
]

const DEFAULT_CUSTOMERS: CustomerAccount[] = [
  {
    id: "cust-001",
    customer_code: "CUST-SERENGETI",
    company_name: "Serengeti Freight Logistics Ltd",
    contact_person: "Baraka Massawe",
    email: "b.massawe@serengetifreight.co.tz",
    phone: "+255 754 889 123",
    address: "Kurasini Depot Road, Plot 14",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    tin_number: "102-889-412",
    vat_number: "40-001928-V",
    total_spend: 34500000,
    total_orders_count: 4,
    total_invoices_count: 4,
    outstanding_receivables: 6500000,
    payment_terms: "Net 30",
    category: "Corporate Enterprise",
    status: "active",
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cust-002",
    customer_code: "CUST-CRDB",
    company_name: "CRDB Bank Technical Division",
    contact_person: "Eng. Robert Lyimo",
    email: "procurement@crdbbank.co.tz",
    phone: "+255 22 211 7441",
    address: "CRDB Head Office, Azikiwe Street",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    tin_number: "100-221-998",
    vat_number: "40-000101-B",
    total_spend: 89000000,
    total_orders_count: 8,
    total_invoices_count: 8,
    outstanding_receivables: 0,
    payment_terms: "Net 15",
    category: "Government / Parastatal",
    status: "active",
    created_at: new Date(Date.now() - 240 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "cust-003",
    customer_code: "CUST-BAKHRESA",
    company_name: "Bakhresa Food Products Ltd",
    contact_person: "Mwinyi Hassan",
    email: "security@bakhresa.com",
    phone: "+255 22 286 1122",
    address: "Vingunguti Industrial Estate",
    city: "Dar es Salaam",
    region: "Dar es Salaam",
    tin_number: "101-445-332",
    vat_number: "40-003881-F",
    total_spend: 142000000,
    total_orders_count: 12,
    total_invoices_count: 12,
    outstanding_receivables: 12400000,
    payment_terms: "Net 30",
    category: "Corporate Enterprise",
    status: "active",
    created_at: new Date(Date.now() - 360 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

// -------------------------------------------------------------
// LEADS API
// -------------------------------------------------------------
export async function getLeads(): Promise<CrmLead[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("crm_leads").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) return data as CrmLead[]
  } catch {}

  const local = await readLocalFile<CrmLead[]>(LEADS_FILE, DEFAULT_LEADS)
  if (local.length === 0) {
    await writeLocalFile(LEADS_FILE, DEFAULT_LEADS)
    return DEFAULT_LEADS
  }
  return local
}

export async function createLead(payload: Omit<CrmLead, "id" | "lead_number" | "created_at" | "updated_at">): Promise<CrmLead> {
  const { user } = await verifyAdminSession()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const newLead: CrmLead = {
    id: `lead-${Date.now()}`,
    lead_number: `QCL-LD-${new Date().getFullYear()}-${randomSuffix}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("crm_leads").insert([newLead])
  } catch {}

  const list = await getLeads()
  const updated = [newLead, ...list.filter(l => l.id !== newLead.id)]
  await writeLocalFile(LEADS_FILE, updated)

  await logAuditEvent({
    module: "customers",
    action: "created",
    record_id: newLead.id,
    record_number: newLead.lead_number,
    description: `Captured new CRM lead: ${newLead.first_name} ${newLead.last_name} (${newLead.company_name || 'Individual'})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/leads")
  return newLead
}

export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<CrmLead | null> {
  const { user } = await verifyAdminSession()
  const list = await getLeads()
  const index = list.findIndex(l => l.id === leadId)
  if (index === -1) return null

  list[index].status = status
  list[index].updated_at = new Date().toISOString()

  try {
    const supabase = createServerClient()
    await supabase.from("crm_leads").update({ status, updated_at: list[index].updated_at }).eq("id", leadId)
  } catch {}

  await writeLocalFile(LEADS_FILE, list)

  await logAuditEvent({
    module: "customers",
    action: "status_changed",
    record_id: leadId,
    record_number: list[index].lead_number,
    description: `Updated CRM lead status to '${status}' for ${list[index].company_name || list[index].first_name}`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/leads")
  return list[index]
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const { user } = await verifyAdminSession()
  try {
    const supabase = createServerClient()
    await supabase.from("crm_leads").delete().eq("id", leadId)
  } catch {}

  const list = await getLeads()
  const filtered = list.filter(l => l.id !== leadId)
  await writeLocalFile(LEADS_FILE, filtered)

  await logAuditEvent({
    module: "customers",
    action: "deleted",
    record_id: leadId,
    description: `Deleted CRM lead ${leadId}`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/leads")
  return true
}

// -------------------------------------------------------------
// DEALS API
// -------------------------------------------------------------
export async function getDeals(): Promise<CrmDeal[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("crm_deals").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) return data as CrmDeal[]
  } catch {}

  const local = await readLocalFile<CrmDeal[]>(DEALS_FILE, DEFAULT_DEALS)
  if (local.length === 0) {
    await writeLocalFile(DEALS_FILE, DEFAULT_DEALS)
    return DEFAULT_DEALS
  }
  return local
}

export async function createDeal(payload: Omit<CrmDeal, "id" | "deal_number" | "created_at" | "updated_at">): Promise<CrmDeal> {
  const { user } = await verifyAdminSession()
  const randomSuffix = Math.floor(100 + Math.random() * 900)
  const newDeal: CrmDeal = {
    id: `deal-${Date.now()}`,
    deal_number: `QCL-DL-${new Date().getFullYear()}-${randomSuffix}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("crm_deals").insert([newDeal])
  } catch {}

  const list = await getDeals()
  const updated = [newDeal, ...list.filter(d => d.id !== newDeal.id)]
  await writeLocalFile(DEALS_FILE, updated)

  await logAuditEvent({
    module: "orders",
    action: "created",
    record_id: newDeal.id,
    record_number: newDeal.deal_number,
    description: `Created sales pipeline deal: "${newDeal.title}" (TZS ${newDeal.amount.toLocaleString()})`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/deals")
  return newDeal
}

export async function updateDealStage(dealId: string, stage: DealStage, lostReason?: string): Promise<CrmDeal | null> {
  const { user } = await verifyAdminSession()
  const list = await getDeals()
  const index = list.findIndex(d => d.id === dealId)
  if (index === -1) return null

  list[index].stage = stage
  list[index].updated_at = new Date().toISOString()
  if (lostReason) list[index].lost_reason = lostReason
  if (stage === "won") list[index].probability = 100
  if (stage === "lost") list[index].probability = 0

  try {
    const supabase = createServerClient()
    await supabase.from("crm_deals").update({
      stage,
      lost_reason: lostReason || list[index].lost_reason,
      probability: list[index].probability,
      updated_at: list[index].updated_at
    }).eq("id", dealId)
  } catch {}

  await writeLocalFile(DEALS_FILE, list)

  await logAuditEvent({
    module: "orders",
    action: "status_changed",
    record_id: dealId,
    record_number: list[index].deal_number,
    description: `Progressed deal stage to '${stage}' for "${list[index].title}"`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/deals")
  return list[index]
}

export async function deleteDeal(dealId: string): Promise<boolean> {
  const { user } = await verifyAdminSession()
  try {
    const supabase = createServerClient()
    await supabase.from("crm_deals").delete().eq("id", dealId)
  } catch {}

  const list = await getDeals()
  const filtered = list.filter(d => d.id !== dealId)
  await writeLocalFile(DEALS_FILE, filtered)

  await logAuditEvent({
    module: "orders",
    action: "deleted",
    record_id: dealId,
    description: `Deleted pipeline deal ${dealId}`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/deals")
  return true
}

// -------------------------------------------------------------
// ACTIVITIES API
// -------------------------------------------------------------
export async function getActivities(): Promise<CrmActivity[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("crm_activities").select("*").order("created_at", { ascending: false })
    if (!error && data && data.length > 0) return data as CrmActivity[]
  } catch {}

  const local = await readLocalFile<CrmActivity[]>(ACTIVITIES_FILE, DEFAULT_ACTIVITIES)
  if (local.length === 0) {
    await writeLocalFile(ACTIVITIES_FILE, DEFAULT_ACTIVITIES)
    return DEFAULT_ACTIVITIES
  }
  return local
}

export async function createActivity(payload: Omit<CrmActivity, "id" | "created_at">): Promise<CrmActivity> {
  const { user } = await verifyAdminSession()
  const newActivity: CrmActivity = {
    id: `act-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("crm_activities").insert([newActivity])
  } catch {}

  const list = await getActivities()
  const updated = [newActivity, ...list.filter(a => a.id !== newActivity.id)]
  await writeLocalFile(ACTIVITIES_FILE, updated)

  revalidatePath("/admin/crm/activities")
  return newActivity
}

export async function completeActivity(activityId: string): Promise<CrmActivity | null> {
  const list = await getActivities()
  const index = list.findIndex(a => a.id === activityId)
  if (index === -1) return null

  list[index].status = "completed"
  list[index].completed_at = new Date().toISOString()

  try {
    const supabase = createServerClient()
    await supabase.from("crm_activities").update({
      status: "completed",
      completed_at: list[index].completed_at
    }).eq("id", activityId)
  } catch {}

  await writeLocalFile(ACTIVITIES_FILE, list)
  revalidatePath("/admin/crm/activities")
  return list[index]
}

// -------------------------------------------------------------
// CUSTOMER ACCOUNTS API (Customer 360)
// -------------------------------------------------------------
export async function getCustomerAccounts(): Promise<CustomerAccount[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("customer_accounts").select("*").order("total_spend", { ascending: false })
    if (!error && data && data.length > 0) return data as CustomerAccount[]
  } catch {}

  const local = await readLocalFile<CustomerAccount[]>(CUSTOMERS_FILE, DEFAULT_CUSTOMERS)
  if (local.length === 0) {
    await writeLocalFile(CUSTOMERS_FILE, DEFAULT_CUSTOMERS)
    return DEFAULT_CUSTOMERS
  }
  return local
}

export async function createCustomerAccount(payload: Omit<CustomerAccount, "id" | "created_at" | "updated_at">): Promise<CustomerAccount> {
  const { user } = await verifyAdminSession()
  const newAccount: CustomerAccount = {
    id: `cust-${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  try {
    const supabase = createServerClient()
    await supabase.from("customer_accounts").insert([newAccount])
  } catch {}

  const list = await getCustomerAccounts()
  const updated = [newAccount, ...list.filter(c => c.id !== newAccount.id)]
  await writeLocalFile(CUSTOMERS_FILE, updated)

  await logAuditEvent({
    module: "customers",
    action: "created",
    record_id: newAccount.id,
    record_number: newAccount.customer_code,
    description: `Created unified customer profile: ${newAccount.company_name || newAccount.contact_person}`,
    user_email: user?.email || "admin@quardcubelabs.com",
    user_name: user?.name || "Administrator"
  })

  revalidatePath("/admin/crm/contacts")
  return newAccount
}
