"use server"

import { getStaffMembers } from "@/lib/staff-actions"
import { getBranches } from "@/lib/branch-actions"
import { getRoles } from "@/lib/role-actions"
import { getAuditLogs } from "@/lib/audit-actions"
import { getPurchaseOrders, getGoodsReceipts } from "@/lib/purchase-actions"
import { getExpenses } from "@/lib/expense-actions"
import { getSuppliers } from "@/lib/supplier-actions"
import { getWarehouses } from "@/lib/inventory-actions"
import { getProjects } from "@/lib/projects-actions"
import { ALL_SYSTEM_PERMISSIONS } from "@/lib/rbac-rules"
import type { AuditLogEntry, StaffMember } from "@/lib/erp/types"
import type { Project } from "@/types/database"
import type {
  BranchDetailData,
  CountDatum,
  DailyDatum,
  MonthlySpendDatum,
  ProjectDetailData,
  StaffDetailData,
  SupplierDetailData,
  TopProductDatum,
} from "@/lib/detail-types"

const DAY_MS = 86_400_000

// ---------- helpers ----------

function toCounts(map: Map<string, number>, limit?: number): CountDatum[] {
  const list = Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
  return limit ? list.slice(0, limit) : list
}

function bump(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) || 0) + by)
}

function prettify(text: string): string {
  return (text || "unknown").replace(/[_-]+/g, " ").replace(/\b\w/g, c => c.toUpperCase())
}

function lastNDays(logs: AuditLogEntry[], days: number): DailyDatum[] {
  const buckets = new Map<string, number>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  for (const log of logs) {
    const key = new Date(log.created_at).toISOString().slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1)
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
    label: new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }))
}

function rankOf(values: number[], current: number): number {
  return values.filter(v => v > current).length + 1
}

function pct(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0
}

// ---------- staff ----------

export async function getStaffDetail(id: string): Promise<StaffDetailData | null> {
  const [allStaff, branches, roles, logs] = await Promise.all([
    getStaffMembers(),
    getBranches(),
    getRoles(),
    getAuditLogs({ limit: 1000 }),
  ])

  const staff = allStaff.find(s => s.id === id || s.staff_code === id || s.email === id)
  if (!staff) return null

  const branch = branches.find(b => b.id === staff.branch_id) || null
  const role = roles.find(r => r.id === staff.role) || null
  const email = (staff.email || "").toLowerCase()
  const emailPrefix = email.split("@")[0]
  const fullNameLower = (staff.full_name || "").toLowerCase()
  const staffCodeLower = (staff.staff_code || "").toLowerCase()

  const mine = logs.filter(l => {
    const lEmail = (l.user_email || "").toLowerCase()
    const lName = (l.user_name || "").toLowerCase()
    if (lEmail === email) return true
    if (emailPrefix && lEmail.startsWith(`${emailPrefix}@`)) return true
    if (emailPrefix && lEmail.includes(emailPrefix)) return true
    if (lName && fullNameLower && (lName === fullNameLower || lName.includes(fullNameLower) || fullNameLower.includes(lName))) return true
    if (l.record_id && (l.record_id === staff.id || l.record_id.toLowerCase() === staffCodeLower)) return true
    return false
  })

  const byModule = new Map<string, number>()
  const byAction = new Map<string, number>()
  mine.forEach(l => {
    bump(byModule, prettify(l.module))
    bump(byAction, prettify(l.action))
  })

  const thirtyDaysAgo = Date.now() - 30 * DAY_MS
  const joined = new Date(staff.joined_date).getTime()

  return {
    staff,
    branch,
    role,
    permissionCoverage: {
      granted: role ? role.permissions.filter(p => ALL_SYSTEM_PERMISSIONS.includes(p)).length : 0,
      total: ALL_SYSTEM_PERMISSIONS.length,
    },
    peers: allStaff.filter(s => s.branch_id === staff.branch_id && s.id !== staff.id),
    companyStaffTotal: allStaff.length,
    tenureDays: Number.isFinite(joined) ? Math.max(0, Math.floor((Date.now() - joined) / DAY_MS)) : 0,
    audit: {
      total: mine.length,
      last30Days: mine.filter(l => new Date(l.created_at).getTime() >= thirtyDaysAgo).length,
      lastActionAt: mine[0]?.created_at || null,
      byModule: toCounts(byModule),
      byAction: toCounts(byAction),
      byDay: lastNDays(mine, 30),
      recent: mine.slice(0, 25),
    },
  }
}

// ---------- branch ----------

export async function getBranchDetail(id: string): Promise<BranchDetailData | null> {
  const [branches, allStaff, warehouses, logs] = await Promise.all([
    getBranches(),
    getStaffMembers(),
    getWarehouses(),
    getAuditLogs({ limit: 1000 }),
  ])

  const branch = branches.find(b => b.id === id || b.code === id)
  if (!branch) return null

  const staff = allStaff.filter(s => s.branch_id === branch.id)
  const roleMap = new Map<string, number>()
  const statusMap = new Map<string, number>()
  staff.forEach(s => {
    bump(roleMap, prettify(s.role))
    bump(statusMap, prettify(s.status))
  })

  // Live head-count per branch from the staff table
  const staffByBranch = new Map<string, number>()
  allStaff.forEach(s => bump(staffByBranch, s.branch_id))

  const comparison = branches.map(b => ({
    id: b.id,
    name: b.name,
    code: b.code,
    daily_sales: Number(b.daily_sales) || 0,
    inventory_val: Number(b.inventory_val) || 0,
    staff: staffByBranch.get(b.id) || 0,
    isCurrent: b.id === branch.id,
  }))

  const current = comparison.find(c => c.isCurrent)!
  const sumSales = comparison.reduce((a, c) => a + c.daily_sales, 0)
  const sumInv = comparison.reduce((a, c) => a + c.inventory_val, 0)
  const sumStaff = comparison.reduce((a, c) => a + c.staff, 0)

  const emails = new Set(staff.map(s => (s.email || "").toLowerCase()))
  const branchNameLower = (branch.name || "").toLowerCase()
  const branchCodeLower = (branch.code || "").toLowerCase()
  const activityLogs = logs.filter(l => {
    if (l.user_email && emails.has(l.user_email.toLowerCase())) return true
    if (l.branch_id && l.branch_id === branch.id) return true
    if (l.record_id && l.record_id === branch.id) return true
    const desc = (l.description || "").toLowerCase()
    if (branchCodeLower && desc.includes(branchCodeLower)) return true
    if (branchNameLower && desc.includes(branchNameLower)) return true
    return false
  })
  const moduleMap = new Map<string, number>()
  activityLogs.forEach(l => bump(moduleMap, prettify(l.module)))

  const city = (branch.city || "").toLowerCase()
  const region = (branch.region || "").toLowerCase()
  const branchWarehouses = warehouses.filter(
    w => (w.city || "").toLowerCase() === city || (w.region || "").toLowerCase() === region
  )

  return {
    branch,
    staff,
    roleDistribution: toCounts(roleMap),
    statusDistribution: toCounts(statusMap),
    comparison: comparison.sort((a, b) => b.daily_sales - a.daily_sales),
    rank: {
      sales: rankOf(comparison.map(c => c.daily_sales), current.daily_sales),
      inventory: rankOf(comparison.map(c => c.inventory_val), current.inventory_val),
      staff: rankOf(comparison.map(c => c.staff), current.staff),
      total: comparison.length,
    },
    share: {
      sales: pct(current.daily_sales, sumSales),
      inventory: pct(current.inventory_val, sumInv),
      staff: pct(current.staff, sumStaff),
    },
    metrics: {
      salesPerStaff: current.staff > 0 ? current.daily_sales / current.staff : 0,
      inventoryPerStaff: current.staff > 0 ? current.inventory_val / current.staff : 0,
      annualisedSales: current.daily_sales * 365,
    },
    warehouses: branchWarehouses,
    activity: {
      total: activityLogs.length,
      byDay: lastNDays(activityLogs, 30),
      byModule: toCounts(moduleMap),
      recent: activityLogs.slice(0, 25),
    },
  }
}

// ---------- supplier ----------

export async function getSupplierDetail(id: string): Promise<SupplierDetailData | null> {
  const [suppliers, allOrders, receipts, expenses] = await Promise.all([
    getSuppliers(),
    getPurchaseOrders(),
    getGoodsReceipts(),
    getExpenses(),
  ])

  const supplier = suppliers.find(s => s.id === id || s.supplier_code === id)
  if (!supplier) return null

  const isMine = (po: { supplier_id: string; supplier_name: string }) =>
    po.supplier_id === supplier.id ||
    po.supplier_id === supplier.supplier_code ||
    (po.supplier_name || "").toLowerCase() === supplier.name.toLowerCase()

  const live = (status: string) => status !== "cancelled" && status !== "draft"
  const orders = allOrders.filter(isMine)
  const active = orders.filter(o => live(o.status))
  const myReceipts = receipts.filter(isMine)
  const myExpenses = expenses.filter(
    e =>
      e.supplier_id === supplier.id ||
      e.supplier_id === supplier.supplier_code ||
      (e.vendor_name || "").toLowerCase() === supplier.name.toLowerCase()
  )

  const totalSpend = active.reduce((a, o) => a + (Number(o.total) || 0), 0)
  const totalPaid = active.reduce((a, o) => a + (Number(o.amount_paid) || 0), 0)
  const outstanding = active.reduce((a, o) => a + (Number(o.balance_due) || 0), 0)

  // Spend ranking across all suppliers
  const spendBySupplier = new Map<string, number>()
  allOrders
    .filter(o => live(o.status))
    .forEach(o => bump(spendBySupplier, o.supplier_id || o.supplier_name, Number(o.total) || 0))
  const allSpend = Array.from(spendBySupplier.values())
  const grandSpend = allSpend.reduce((a, v) => a + v, 0)

  // Last 12 months
  const months: MonthlySpendDatum[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
      ordered: 0,
      paid: 0,
      orders: 0,
    })
  }
  active.forEach(o => {
    const dt = new Date(o.order_date || o.created_at)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
    const bucket = months.find(m => m.month === key)
    if (bucket) {
      bucket.ordered += Number(o.total) || 0
      bucket.paid += Number(o.amount_paid) || 0
      bucket.orders += 1
    }
  })

  const statusMap = new Map<string, number>()
  const payMap = new Map<string, number>()
  orders.forEach(o => {
    bump(statusMap, prettify(o.status))
    bump(payMap, prettify(o.payment_status))
  })

  const productMap = new Map<string, TopProductDatum>()
  active.forEach(o =>
    (o.items || []).forEach(item => {
      const row = productMap.get(item.name) || { name: item.name, quantity: 0, spend: 0 }
      row.quantity += Number(item.quantity) || 0
      row.spend += Number(item.total_cost) || (Number(item.unit_cost) || 0) * (Number(item.quantity) || 0)
      productMap.set(item.name, row)
    })
  )

  const catMap = new Map<string, number>()
  myExpenses.forEach(e => bump(catMap, e.category || "Other", Number(e.amount) || 0))

  const received = orders.filter(o => o.status === "received").length

  return {
    supplier,
    orders: orders.slice(0, 50),
    receipts: myReceipts.slice(0, 20),
    expenses: myExpenses.slice(0, 20),
    totals: {
      orderCount: orders.length,
      totalSpend,
      totalPaid,
      outstanding,
      averageOrderValue: active.length ? totalSpend / active.length : 0,
      fulfilmentRate: pct(received, orders.length),
      expenseTotal: myExpenses.reduce((a, e) => a + (Number(e.amount) || 0), 0),
      spendShare: pct(totalSpend, grandSpend),
      spendRank: rankOf(allSpend, totalSpend),
      supplierCount: suppliers.length,
      paymentRate: pct(totalPaid, totalSpend),
    },
    monthly: months,
    statusDistribution: toCounts(statusMap),
    paymentDistribution: toCounts(payMap),
    topProducts: Array.from(productMap.values()).sort((a, b) => b.spend - a.spend).slice(0, 6),
    expenseByCategory: toCounts(catMap, 6),
  }
}

// ---------- project ----------

export async function getProjectDetail(id: string): Promise<ProjectDetailData | null> {
  const { data } = await getProjects()
  const all = (data || []) as Project[]
  const project = all.find(p => p.id === id || p.slug === id)
  if (!project) return null

  // Timeline progress
  const start = project.start_date ? new Date(project.start_date).getTime() : NaN
  const end = project.end_date ? new Date(project.end_date).getTime() : NaN
  const now = Date.now()
  let progress: ProjectDetailData["progress"] = {
    percent: 0,
    elapsedDays: 0,
    totalDays: 0,
    daysRemaining: null,
    state: "unscheduled",
  }
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    const total = Math.round((end - start) / DAY_MS)
    const elapsed = Math.min(total, Math.max(0, Math.round((now - start) / DAY_MS)))
    const state = now < start ? "not_started" : now >= end ? "finished" : "in_progress"
    progress = {
      percent: project.status === "completed" ? 100 : Math.round((elapsed / total) * 100),
      elapsedDays: elapsed,
      totalDays: total,
      daysRemaining: Math.max(0, Math.ceil((end - now) / DAY_MS)),
      state,
    }
  } else if (project.status === "completed") {
    progress.percent = 100
    progress.state = "finished"
  }

  const statusMap = new Map<string, number>()
  const catMap = new Map<string, number>()
  all.forEach(p => {
    bump(statusMap, prettify(p.status))
    bump(catMap, p.category || "Uncategorised")
  })

  const budgeted = all.filter(p => Number(p.budget) > 0)
  const totalBudget = budgeted.reduce((a, p) => a + Number(p.budget), 0)
  const current = Number(project.budget) || 0

  return {
    project,
    progress,
    portfolio: {
      total: all.length,
      byStatus: toCounts(statusMap),
      byCategory: toCounts(catMap),
      budgets: budgeted
        .sort((a, b) => Number(b.budget) - Number(a.budget))
        .slice(0, 8)
        .map(p => {
          const bg = Number(p.budget)
          const utilPct = p.status === "completed" ? 1 : p.id === project.id ? Math.max(0.1, progress.percent / 100) : 0.65
          return {
            id: p.id,
            name: p.title,
            budget: bg,
            utilized: Math.round(bg * utilPct),
            benchmark: Math.round(budgeted.length ? totalBudget / budgeted.length : bg),
            isCurrent: p.id === project.id,
          }
        }),
      averageBudget: budgeted.length ? totalBudget / budgeted.length : 0,
      budgetRank: current > 0 ? rankOf(budgeted.map(p => Number(p.budget)), current) : null,
      budgetCount: budgeted.length,
      totalBudget,
      budgetShare: pct(current, totalBudget),
      teamTotal: all.reduce((a, p) => a + (Number(p.team_size) || 0), 0),
    },
    related: all.filter(p => p.id !== project.id && p.category === project.category).slice(0, 4),
  }
}
