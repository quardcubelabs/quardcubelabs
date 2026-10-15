"use server"

import { getStaffMembers } from "@/lib/staff-actions"
import { getBranches } from "@/lib/branch-actions"
import { getRoles } from "@/lib/role-actions"
import { getAuditLogs } from "@/lib/audit-actions"
import { createServerClient } from "@/lib/supabase"
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
  ExpenseDetailData,
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
  const staffRoleNorm = (staff.role || "").toLowerCase().trim()
  const role = roles.find(r => 
    r.id.toLowerCase() === staffRoleNorm ||
    r.name.toLowerCase() === staffRoleNorm
  ) || null
  const email = (staff.email || "").toLowerCase().trim()
  const emailPrefix = email.split("@")[0]
  const fullNameLower = (staff.full_name || "").toLowerCase().trim()
  const staffCodeLower = (staff.staff_code || "").toLowerCase().trim()

  const staffIdLower = (staff.id || "").toLowerCase().trim()

  // Augment with direct query to Supabase audit_logs to guarantee newly logged events are pulled
  let allLogs = [...logs]
  try {
    const supabase = createServerClient()
    const orParts: string[] = []
    if (email) orParts.push(`user_email.ilike.%${email}%`)
    if (emailPrefix) orParts.push(`user_email.ilike.%${emailPrefix}%`)
    if (fullNameLower) orParts.push(`user_name.ilike.%${fullNameLower}%`)
    if (staff.id) orParts.push(`record_id.eq.${staff.id}`)
    if (staff.staff_code) {
      orParts.push(`record_id.eq.${staff.staff_code}`)
      orParts.push(`record_number.eq.${staff.staff_code}`)
    }

    if (orParts.length > 0) {
      const { data: dbLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .or(orParts.join(","))
        .order("created_at", { ascending: false })
        .limit(500)

      if (dbLogs && dbLogs.length > 0) {
        const knownIds = new Set(allLogs.map(l => l.id))
        for (const dl of dbLogs) {
          if (!knownIds.has(dl.id)) {
            allLogs.push(dl as AuditLogEntry)
          }
        }
      }
    }
  } catch (err) {
    console.warn("[getStaffDetail] Supabase audit log query warning:", err)
  }

  const mine = allLogs.filter(l => {
    const lEmail = (l.user_email || "").toLowerCase().trim()
    const lName = (l.user_name || "").toLowerCase().trim()
    const lRecordId = (l.record_id || "").toLowerCase().trim()
    const lRecordNumber = (l.record_number || "").toLowerCase().trim()
    const lDesc = (l.description || "").toLowerCase().trim()

    // 1. Direct email match
    if (email && lEmail === email) return true
    if (emailPrefix && (lEmail.startsWith(`${emailPrefix}@`) || lEmail.includes(emailPrefix))) return true

    // 2. Full name match
    if (lName && fullNameLower && (lName === fullNameLower || lName.includes(fullNameLower) || fullNameLower.includes(lName))) return true

    // 3. Record ID or Record Number match (e.g. login/profile/staff updates)
    if (lRecordId && (lRecordId === staffIdLower || lRecordId === staffCodeLower)) return true
    if (lRecordNumber && (lRecordNumber === staffCodeLower || lRecordNumber.includes(staffCodeLower))) return true

    // 4. Description mentions staff name or staff code
    if (staffCodeLower && lDesc.includes(staffCodeLower)) return true
    if (fullNameLower && lDesc.includes(fullNameLower)) return true

    return false
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const byModule = new Map<string, number>()
  const byAction = new Map<string, number>()
  mine.forEach(l => {
    bump(byModule, prettify(l.module))
    bump(byAction, prettify(l.action))
  })

  const thirtyDaysAgo = Date.now() - 30 * DAY_MS
  const joined = new Date(staff.joined_date).getTime()

  // Calculate granted permissions count out of all 48 permissions
  const rolePermissions = role?.permissions || []
  const grantedCount = role
    ? Array.from(new Set(rolePermissions.map(p => ALL_SYSTEM_PERMISSIONS.includes(p) ? p : null).filter(Boolean))).length
    : 0

  return {
    staff,
    branch,
    role,
    permissionCoverage: {
      granted: grantedCount,
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
      recent: mine.slice(0, 50),
      allLogs: mine,
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
  try {
    const [suppliers, allOrders, receipts, expenses] = await Promise.all([
      getSuppliers().catch(() => []),
      getPurchaseOrders().catch(() => []),
      getGoodsReceipts().catch(() => []),
      getExpenses().catch(() => []),
    ])

    const rawId = (id || "").trim()
    const cleanId = decodeURIComponent(rawId).trim()
    const cleanIdLower = cleanId.toLowerCase()

    const supplierList = suppliers || []
    const supplier = supplierList.find(s => 
      s && (
        s.id === cleanId ||
        s.supplier_code === cleanId ||
        (s.id || "").toLowerCase() === cleanIdLower ||
        (s.supplier_code || "").toLowerCase() === cleanIdLower ||
        (s.name && s.name.toLowerCase() === cleanIdLower)
      )
    )
    if (!supplier) return null

    const supplierName = (supplier.name || "").toLowerCase()
    const supplierCode = supplier.supplier_code || ""

    const isMine = (po: any) =>
      Boolean(
        po && (
          (po.supplier_id && (po.supplier_id === supplier.id || (supplierCode && po.supplier_id === supplierCode))) ||
          (po.supplier_name && (po.supplier_name || "").toLowerCase() === supplierName)
        )
      )

    const live = (status: string) => status !== "cancelled" && status !== "draft"
    const orders = (allOrders || []).filter(isMine)
    const active = orders.filter(o => o && live(o.status || ""))
    const myReceipts = (receipts || []).filter(isMine)
    const myExpenses = (expenses || []).filter(
      e =>
        Boolean(
          e && (
            (e.supplier_id && (e.supplier_id === supplier.id || (supplierCode && e.supplier_id === supplierCode))) ||
            (e.vendor_name && (e.vendor_name || "").toLowerCase() === supplierName)
          )
        )
    )

    const totalSpend = active.reduce((a, o) => a + (Number(o.total) || 0), 0)
    const totalPaid = active.reduce((a, o) => a + (Number(o.amount_paid) || 0), 0)
    const outstanding = active.reduce((a, o) => a + (Number(o.balance_due) || 0), 0)

    // Spend ranking across all suppliers
    const spendBySupplier = new Map<string, number>()
    ;(allOrders || [])
      .filter(o => o && live(o.status || ""))
      .forEach(o => bump(spendBySupplier, o.supplier_id || o.supplier_name || "Unknown", Number(o.total) || 0))
    const allSpend = Array.from(spendBySupplier.values())
    const grandSpend = allSpend.reduce((a, v) => a + v, 0)

    // 12 Months: January to December of the calendar year
    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    const MONTH_SHORT = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonthIdx = now.getMonth()

    const months: MonthlySpendDatum[] = MONTH_SHORT.map((short, idx) => ({
      month: `${currentYear}-${String(idx + 1).padStart(2, "0")}`,
      label: short,
      fullLabel: `${MONTH_NAMES[idx]} ${currentYear}`,
      ordered: 0,
      paid: 0,
      orders: 0,
    }))

    // 30 Days of current month (Days 1 to 30)
    const daily: MonthlySpendDatum[] = []
    for (let d = 1; d <= 30; d++) {
      const pad = String(d).padStart(2, "0")
      daily.push({
        month: `${currentYear}-${String(currentMonthIdx + 1).padStart(2, "0")}-${pad}`,
        label: pad,
        fullLabel: `${d} ${MONTH_NAMES[currentMonthIdx]} ${currentYear}`,
        ordered: 0,
        paid: 0,
        orders: 0,
      })
    }

    // 7 Days of current week
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const currentDayOfWeek = now.getDay()
    const mondayOffset = (currentDayOfWeek + 6) % 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - mondayOffset)

    const weekly: MonthlySpendDatum[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dayName = DAY_NAMES[d.getDay()]
      const dNum = d.getDate()
      const dMonth = MONTH_NAMES[d.getMonth()]
      const padM = String(d.getMonth() + 1).padStart(2, "0")
      const padD = String(dNum).padStart(2, "0")
      weekly.push({
        month: `${d.getFullYear()}-${padM}-${padD}`,
        label: `${dayName} ${dNum}`,
        fullLabel: `${dayName}, ${dNum} ${dMonth} ${d.getFullYear()}`,
        ordered: 0,
        paid: 0,
        orders: 0,
      })
    }

    active.forEach(o => {
      if (!o) return
      const dt = new Date(o.order_date || o.created_at)
      if (isNaN(dt.getTime())) return
      const oTotal = Number(o.total) || 0
      const oPaid = Number(o.amount_paid) || 0

      // 12 Months: January to December of targeted year
      if (dt.getFullYear() === currentYear) {
        const mIdx = dt.getMonth()
        if (mIdx >= 0 && mIdx < 12) {
          months[mIdx].ordered += oTotal
          months[mIdx].paid += oPaid
          months[mIdx].orders += 1
        }
      }

      // 30 Days of current month
      if (dt.getFullYear() === currentYear && dt.getMonth() === currentMonthIdx) {
        const day = dt.getDate()
        if (day >= 1 && day <= 30) {
          daily[day - 1].ordered += oTotal
          daily[day - 1].paid += oPaid
          daily[day - 1].orders += 1
        }
      }

      // 7 Days of current week
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
      const wMatch = weekly.find(w => w.month === dateKey)
      if (wMatch) {
        wMatch.ordered += oTotal
        wMatch.paid += oPaid
        wMatch.orders += 1
      }
    })

    const statusMap = new Map<string, number>()
    const payMap = new Map<string, number>()
    orders.forEach(o => {
      if (!o) return
      bump(statusMap, prettify(o.status))
      bump(payMap, prettify(o.payment_status))
    })

    const productMap = new Map<string, TopProductDatum>()
    active.forEach(o => {
      if (!o) return
      const rawItems = Array.isArray(o.items)
        ? o.items
        : typeof o.items === "string"
        ? (() => {
            try {
              return JSON.parse(o.items)
            } catch {
              return []
            }
          })()
        : []

      rawItems.forEach((item: any) => {
        if (!item) return
        const itemName = item.name || "Procured Item"
        const row = productMap.get(itemName) || { name: itemName, quantity: 0, spend: 0 }
        row.quantity += Number(item.quantity) || 0
        row.spend += Number(item.total_cost) || (Number(item.unit_cost) || 0) * (Number(item.quantity) || 0)
        productMap.set(itemName, row)
      })
    })

    const catMap = new Map<string, number>()
    myExpenses.forEach(e => {
      if (!e) return
      bump(catMap, e.category || "Other", Number(e.amount) || 0)
    })

    const received = orders.filter(o => o && o.status === "received").length

    return {
      supplier,
      orders: orders,
      receipts: myReceipts.slice(0, 20),
      expenses: myExpenses.slice(0, 20),
      totals: {
        orderCount: orders.length,
        totalSpend,
        totalPaid,
        outstanding,
        averageOrderValue: active.length ? totalSpend / active.length : 0,
        fulfilmentRate: orders.length ? pct(received, orders.length) : 0,
        expenseTotal: myExpenses.reduce((a, e) => a + (Number(e?.amount) || 0), 0),
        spendShare: grandSpend > 0 ? pct(totalSpend, grandSpend) : 0,
        spendRank: rankOf(allSpend, totalSpend),
        supplierCount: supplierList.length,
        paymentRate: totalSpend > 0 ? pct(totalPaid, totalSpend) : 0,
      },
      monthly: months,
      daily,
      weekly,
      statusDistribution: toCounts(statusMap),
      paymentDistribution: toCounts(payMap),
      topProducts: Array.from(productMap.values()).sort((a, b) => b.spend - a.spend).slice(0, 6),
      expenseByCategory: toCounts(catMap, 6),
    }
  } catch (err) {
    console.error("Error in getSupplierDetail:", err)
    return null
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

// ---------- expense ----------

export async function getExpenseDetail(id: string): Promise<ExpenseDetailData | null> {
  const [expenses, suppliers, logs] = await Promise.all([
    getExpenses(),
    getSuppliers(),
    getAuditLogs({ limit: 1000 }),
  ])

  const expense = expenses.find(e => e && (e.id === id || e.expense_number === id))
  if (!expense) return null

  const supplier = suppliers.find(
    s =>
      s.id === expense.supplier_id ||
      (s.name && expense.vendor_name && s.name.toLowerCase() === expense.vendor_name.toLowerCase())
  ) || null

  const relatedExpenses = expenses.filter(
    e => e.id !== expense.id && (e.category === expense.category || (expense.vendor_name && e.vendor_name === expense.vendor_name))
  ).slice(0, 10)

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyExpenses = expenses.filter(e => (e.expense_date || e.created_at || "").startsWith(thisMonth))
  const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const categoryExpenses = expenses.filter(e => e.category === expense.category)
  const categoryTotal = categoryExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const vendorExpenses = expense.vendor_name
    ? expenses.filter(e => (e.vendor_name || "").toLowerCase() === (expense.vendor_name || "").toLowerCase())
    : []
  const vendorTotal = vendorExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const expNumLower = (expense.expense_number || "").toLowerCase()
  const expIdLower = (expense.id || "").toLowerCase()
  const auditLogs = logs.filter(l => {
    const rId = (l.record_id || "").toLowerCase()
    const rNum = (l.record_number || "").toLowerCase()
    const desc = (l.description || "").toLowerCase()
    return (
      (rId && (rId === expIdLower || rId === expNumLower)) ||
      (rNum && (rNum === expNumLower || rNum === expIdLower)) ||
      (expNumLower && desc.includes(expNumLower))
    )
  })

  const amount = Number(expense.amount) || 0
  const tax = Number(expense.tax_amount) || 0

  return {
    expense,
    supplier,
    relatedExpenses,
    totals: {
      categoryTotal,
      vendorTotal,
      monthlyExpenseTotal: monthlyTotal,
      taxShare: amount > 0 ? (tax / amount) * 100 : 0,
    },
    auditLogs: auditLogs.slice(0, 30),
  }
}
