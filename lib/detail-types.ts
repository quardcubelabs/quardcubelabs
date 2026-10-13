import type {
  AuditLogEntry,
  Branch,
  BusinessExpense,
  GoodsReceipt,
  PurchaseOrder,
  RoleDefinition,
  StaffMember,
  Supplier,
  Warehouse,
} from "@/lib/erp/types"
import type { Project } from "@/types/database"

export interface CountDatum {
  name: string
  value: number
}

export interface DailyDatum {
  date: string // ISO yyyy-mm-dd
  label: string
  count: number
}

export interface StaffDetailData {
  staff: StaffMember
  branch: Branch | null
  role: RoleDefinition | null
  permissionCoverage: { granted: number; total: number }
  peers: StaffMember[]
  companyStaffTotal: number
  tenureDays: number
  audit: {
    total: number
    last30Days: number
    lastActionAt: string | null
    byModule: CountDatum[]
    byAction: CountDatum[]
    byDay: DailyDatum[]
    recent: AuditLogEntry[]
  }
}

export interface BranchComparisonDatum {
  id: string
  name: string
  code: string
  daily_sales: number
  inventory_val: number
  staff: number
  isCurrent: boolean
}

export interface BranchDetailData {
  branch: Branch
  staff: StaffMember[]
  roleDistribution: CountDatum[]
  statusDistribution: CountDatum[]
  comparison: BranchComparisonDatum[]
  rank: { sales: number; inventory: number; staff: number; total: number }
  share: { sales: number; inventory: number; staff: number }
  metrics: { salesPerStaff: number; inventoryPerStaff: number; annualisedSales: number }
  warehouses: Warehouse[]
  activity: {
    total: number
    byDay: DailyDatum[]
    byModule: CountDatum[]
    recent: AuditLogEntry[]
  }
}

export interface MonthlySpendDatum {
  month: string
  label: string
  ordered: number
  paid: number
  orders: number
}

export interface TopProductDatum {
  name: string
  quantity: number
  spend: number
}

export interface SupplierDetailData {
  supplier: Supplier
  orders: PurchaseOrder[]
  receipts: GoodsReceipt[]
  expenses: BusinessExpense[]
  totals: {
    orderCount: number
    totalSpend: number
    totalPaid: number
    outstanding: number
    averageOrderValue: number
    fulfilmentRate: number
    expenseTotal: number
    spendShare: number
    spendRank: number
    supplierCount: number
    paymentRate: number
  }
  monthly: MonthlySpendDatum[]
  statusDistribution: CountDatum[]
  paymentDistribution: CountDatum[]
  topProducts: TopProductDatum[]
  expenseByCategory: CountDatum[]
}

export interface ProjectBudgetDatum {
  id: string
  name: string
  budget: number
  utilized: number
  benchmark: number
  isCurrent: boolean
}

export interface ProjectDetailData {
  project: Project
  progress: {
    percent: number
    elapsedDays: number
    totalDays: number
    daysRemaining: number | null
    state: "not_started" | "in_progress" | "finished" | "unscheduled"
  }
  portfolio: {
    total: number
    byStatus: CountDatum[]
    byCategory: CountDatum[]
    budgets: ProjectBudgetDatum[]
    averageBudget: number
    budgetRank: number | null
    budgetCount: number
    totalBudget: number
    budgetShare: number
    teamTotal: number
  }
  related: Project[]
}
