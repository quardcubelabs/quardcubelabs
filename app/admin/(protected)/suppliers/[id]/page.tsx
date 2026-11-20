"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import {
  AdminPageHeader,
  AdminStats,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getSupplierDetail } from "@/lib/detail-actions"
import type { SupplierDetailData } from "@/lib/detail-types"
import type { BusinessExpense, GoodsReceipt, PurchaseOrder } from "@/lib/erp/types"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Truck,
  DollarSign,
  PackageCheck,
  FileText,
  TrendingUp,
  CheckCircle2,
  Boxes,
  ExternalLink,
  Eye,
  Receipt,
} from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class SupplierErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Supplier ledger boundary caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="p-6 rounded-3xl border-2 border-rose-500/30 bg-rose-500/10 text-rose-300 text-center space-y-3 my-4">
          <p className="font-bold text-sm">Visualisation Telemetry Temporarily Unavailable</p>
          <p className="text-xs opacity-80">{this.state.error?.message || "An unexpected error occurred while rendering this module."}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false })}
            className="text-xs font-bold rounded-xl"
          >
            Retry Component
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatDate(val: any): string {
  if (!val) return "—"
  try {
    const d = new Date(val)
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return "—"
  }
}

interface SpendBarItem {
  key: string
  label: string
  fullLabel: string
  ordered: number
  paid: number
  orders: number
  dayNum?: number
  monthIdx?: number
  year?: number
}

interface SpendSettlementSvgChartProps {
  data: SpendBarItem[]
  timeframe: "12months" | "30days" | "week"
  isDark: boolean
}

function SpendSettlementSvgChart({ data, timeframe, isDark }: SpendSettlementSvgChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs opacity-50 font-medium">
        No order telemetry data for this period
      </div>
    )
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(Number(d.ordered) || 0, Number(d.paid) || 0)),
    100_000
  ) * 1.15

  const chartHeight = 220
  const chartWidth = 800
  const paddingLeft = 55
  const paddingRight = 15
  const paddingTop = 20
  const paddingBottom = 35

  const plotWidth = chartWidth - paddingLeft - paddingRight
  const plotHeight = chartHeight - paddingTop - paddingBottom

  const stepX = plotWidth / data.length
  const groupBarWidth = Math.min(stepX * 0.75, timeframe === "30days" ? 12 : 36)
  const singleBarWidth = Math.max(2, (groupBarWidth - 2) / 2)

  const formatYAxis = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
    return `${val}`
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: paddingTop + plotHeight - pct * plotHeight,
  }))

  const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null

  return (
    <div className="relative w-full h-full select-none flex flex-col justify-between">
      <div className="relative w-full h-[220px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke={isDark ? "rgba(64, 224, 208, 0.12)" : "rgba(0, 0, 128, 0.08)"}
                strokeDasharray={i === 0 ? "none" : "3 3"}
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="10"
                fill={isDark ? "#94a3b8" : "#64748b"}
                className="font-mono font-medium"
              >
                {formatYAxis(tick.val)}
              </text>
            </g>
          ))}

          {data.map((item, idx) => {
            const centerX = paddingLeft + idx * stepX + stepX / 2
            const orderedHeight = Math.max(0, ((item.ordered || 0) / maxVal) * plotHeight)
            const paidHeight = Math.max(0, ((item.paid || 0) / maxVal) * plotHeight)

            const orderedY = paddingTop + plotHeight - orderedHeight
            const paidY = paddingTop + plotHeight - paidHeight

            const bar1X = centerX - groupBarWidth / 2
            const bar2X = centerX - groupBarWidth / 2 + singleBarWidth + 2

            const isHovered = hoveredIdx === idx
            const showLabel =
              timeframe !== "30days" || idx === 0 || idx === 14 || idx === 29 || idx % 5 === 0

            return (
              <g
                key={item.key || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <rect
                    x={centerX - stepX / 2}
                    y={paddingTop}
                    width={stepX}
                    height={plotHeight}
                    fill={isDark ? "rgba(64, 224, 208, 0.08)" : "rgba(0, 0, 128, 0.05)"}
                    rx="4"
                  />
                )}

                <rect
                  x={bar1X}
                  y={orderedY}
                  width={singleBarWidth}
                  height={orderedHeight}
                  rx={singleBarWidth > 4 ? 3 : 1}
                  fill={isDark ? "#38bdf8" : "#000080"}
                  className="transition-all duration-200"
                  opacity={hoveredIdx !== null && !isHovered ? 0.6 : 1}
                />

                <rect
                  x={bar2X}
                  y={paidY}
                  width={singleBarWidth}
                  height={paidHeight}
                  rx={singleBarWidth > 4 ? 3 : 1}
                  fill={isDark ? "#40E0D0" : "#0d9488"}
                  className="transition-all duration-200"
                  opacity={hoveredIdx !== null && !isHovered ? 0.6 : 1}
                />

                {showLabel && (
                  <text
                    x={centerX}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fontSize={timeframe === "30days" ? "9.5" : "11"}
                    fontWeight={isHovered ? "bold" : "normal"}
                    fill={isHovered ? (isDark ? "#40E0D0" : "#000080") : isDark ? "#94a3b8" : "#64748b"}
                  >
                    {item.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {activeItem && hoveredIdx !== null && (
          <div
            className={cn(
              "absolute z-20 pointer-events-none rounded-xl p-2.5 shadow-xl border text-xs min-w-[190px] transition-transform duration-75",
              isDark
                ? "bg-[#060a22]/95 border-teal/40 text-white shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
                : "bg-white/95 border-navy/20 text-navy shadow-lg"
            )}
            style={{
              top: "10px",
              left: `${Math.min(
                Math.max(10, ((paddingLeft + hoveredIdx * stepX + stepX / 2) / chartWidth) * 100),
                70
              )}%`,
            }}
          >
            <p className="font-extrabold text-xs mb-1 border-b pb-1 text-teal-600 dark:text-teal-400">
              {activeItem.fullLabel || activeItem.label}
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 opacity-80">
                  <span className={cn("w-2 h-2 rounded-full", isDark ? "bg-sky-400" : "bg-navy")} />
                  Ordered:
                </span>
                <span className="font-mono font-black">
                  TSH {Number(activeItem.ordered || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 opacity-80">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Settled:
                </span>
                <span className="font-mono font-black text-emerald-500">
                  TSH {Number(activeItem.paid || 0).toLocaleString()}
                </span>
              </div>
              {activeItem.orders > 0 && (
                <div className="text-[10.5px] opacity-70 pt-0.5 text-right font-mono">
                  {activeItem.orders} order{activeItem.orders > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-4 pt-1 text-[11px] font-semibold opacity-80">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2.5 h-2.5 rounded-xs", isDark ? "bg-sky-400" : "bg-navy")} />
          <span>Ordered Spend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-teal-500" />
          <span>Settled (Paid)</span>
        </div>
      </div>
    </div>
  )
}

function DetailSectionHeading({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: React.ReactNode
}) {
  const { isDark } = useAdminTheme()
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black",
            isDark ? "bg-teal text-navy" : "bg-navy text-white"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-black leading-tight">{title}</h3>
          <p
            className={cn(
              "text-[11px] font-medium mt-0.5",
              isDark ? "text-slate-300" : "text-navy/70"
            )}
          >
            {description}
          </p>
        </div>
      </div>
      {badge && (
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-xs font-bold self-start sm:self-auto",
            isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
          )}
        >
          {badge}
        </Badge>
      )}
    </div>
  )
}

function SupplierDetailInner() {
  const routeParams = useParams()
  const supplierId = (routeParams?.id as string) || ""
  const { isDark } = useAdminTheme()
  const [mounted, setMounted] = useState(false)

  const [data, setData] = useState<SupplierDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<BusinessExpense | null>(null)
  const [viewModal, setViewModal] = useState<"order" | "receipt" | "expense" | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Spend vs Settlement timeframe and date selectors
  const [timeframe, setTimeframe] = useState<"12months" | "30days" | "week">("12months")
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear())
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const day = new Date().getDate()
    return Math.min(5, Math.max(1, Math.ceil(day / 7)))
  })

  useEffect(() => {
    if (!supplierId) return
    let isCancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const res = await getSupplierDetail(supplierId)
        if (!isCancelled) setData(res)
      } catch (err) {
        console.error("Failed to load supplier details:", err)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [supplierId])

  // Dynamic Chart Data based on user selection (12months: Jan-Dec, 30days: 1-30, week: 7 days)
  const chartData = useMemo(() => {
    if (!data) return []
    const ordersList = data.orders || []

    if (timeframe === "12months") {
      const result = MONTH_SHORT.map((short, idx) => ({
        key: `month-${idx}`,
        label: short,
        fullLabel: `${MONTH_NAMES[idx]} ${selectedYear}`,
        ordered: 0,
        paid: 0,
        orders: 0,
      }))

      ordersList.forEach(o => {
        if (o.status === "cancelled" || o.status === "draft") return
        const dt = new Date(o.order_date || o.created_at)
        if (isNaN(dt.getTime())) return

        if (dt.getFullYear() === selectedYear) {
          const mIdx = dt.getMonth()
          if (mIdx >= 0 && mIdx < 12) {
            result[mIdx].ordered += Number(o.total) || 0
            result[mIdx].paid += Number(o.amount_paid) || 0
            result[mIdx].orders += 1
          }
        }
      })

      return result
    }

    if (timeframe === "30days") {
      const result: SpendBarItem[] = []
      for (let d = 1; d <= 30; d++) {
        const pad = String(d).padStart(2, "0")
        result.push({
          key: `day-${d}`,
          label: pad,
          fullLabel: `${d} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
          ordered: 0,
          paid: 0,
          orders: 0,
        })
      }

      ordersList.forEach(o => {
        if (o.status === "cancelled" || o.status === "draft") return
        const dt = new Date(o.order_date || o.created_at)
        if (isNaN(dt.getTime())) return

        if (dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth) {
          const day = dt.getDate()
          if (day >= 1 && day <= 30) {
            result[day - 1].ordered += Number(o.total) || 0
            result[day - 1].paid += Number(o.amount_paid) || 0
            result[day - 1].orders += 1
          }
        }
      })

      return result
    }

    if (timeframe === "week") {
      const startDay = (selectedWeek - 1) * 7 + 1
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
      const result: SpendBarItem[] = []

      for (let offset = 0; offset < 7; offset++) {
        const dNum = startDay + offset
        if (dNum <= daysInMonth) {
          const dt = new Date(selectedYear, selectedMonth, dNum)
          const dayName = DAY_NAMES[dt.getDay()]
          result.push({
            key: `week-${dNum}`,
            label: `${dayName} ${dNum}`,
            dayNum: dNum,
            monthIdx: selectedMonth,
            year: selectedYear,
            fullLabel: `${dayName}, ${dNum} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
            ordered: 0,
            paid: 0,
            orders: 0,
          })
        } else {
          const overflow = dNum - daysInMonth
          const nextMonth = (selectedMonth + 1) % 12
          const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
          const dt = new Date(nextYear, nextMonth, overflow)
          const dayName = DAY_NAMES[dt.getDay()]
          result.push({
            key: `week-${dNum}`,
            label: `${dayName} ${overflow}`,
            dayNum: overflow,
            monthIdx: nextMonth,
            year: nextYear,
            fullLabel: `${dayName}, ${overflow} ${MONTH_NAMES[nextMonth]} ${nextYear}`,
            ordered: 0,
            paid: 0,
            orders: 0,
          })
        }
      }

      ordersList.forEach(o => {
        if (o.status === "cancelled" || o.status === "draft") return
        const dt = new Date(o.order_date || o.created_at)
        if (isNaN(dt.getTime())) return
        const oYear = dt.getFullYear()
        const oMonth = dt.getMonth()
        const oDay = dt.getDate()

        const match = result.find(r => r.year === oYear && r.monthIdx === oMonth && r.dayNum === oDay)
        if (match) {
          match.ordered += Number(o.total) || 0
          match.paid += Number(o.amount_paid) || 0
          match.orders += 1
        }
      })

      return result
    }

    return []
  }, [data, timeframe, selectedYear, selectedMonth, selectedWeek])

  const periodOrderedTotal = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.ordered || 0), 0),
    [chartData]
  )
  const periodPaidTotal = useMemo(
    () => chartData.reduce((acc, curr) => acc + (curr.paid || 0), 0),
    [chartData]
  )

  if (isLoading) return <AdminLoading />

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card
          className={cn(
            "max-w-md w-full p-8 text-center rounded-3xl border-2 shadow-xl",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border shadow-sm",
              isDark
                ? "bg-navy text-teal border-teal/30"
                : "bg-teal text-navy border-teal/40"
            )}
          >
            <Building2 className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Supplier Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No vendor profile matches "{supplierId}".
          </p>
          <Link href="/admin/suppliers">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Supplier Directory
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const supplier = data.supplier || {
    id: supplierId,
    supplier_code: supplierId,
    name: "Supplier",
    company_name: "",
    email: "",
    phone: "",
    city: "Dar es Salaam",
    country: "Tanzania",
    payment_terms: "Net 30",
    status: "active" as const,
  }
  const orders = data.orders || []
  const receipts = data.receipts || []
  const expenses = data.expenses || []
  const totals = data.totals || {
    orderCount: 0,
    totalSpend: 0,
    totalPaid: 0,
    outstanding: 0,
    averageOrderValue: 0,
    fulfilmentRate: 0,
    expenseTotal: 0,
    spendShare: 0,
    spendRank: 1,
    supplierCount: 1,
    paymentRate: 0,
  }
  const topProducts = data.topProducts || []

  const orderColumns: AdminTableColumn<PurchaseOrder>[] = [
    {
      key: "po",
      header: "PO Number",
      render: (o) => (
        <AdminPrimaryCell
          icon={Truck}
          title={`#${o.po_number}`}
          subtitle={o.supplier_name || supplier.name}
        />
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      hidden: "md",
      render: (o) => <AdminPill title={o.warehouse_name}>{o.warehouse_name || "Main Depot"}</AdminPill>,
    },
    {
      key: "total",
      header: "Total (TSH)",
      align: "right",
      render: (o) => <span className="font-mono font-black">TSH {Number(o.total || 0).toLocaleString()}</span>,
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      hidden: "md",
      render: (o) => <span className="font-mono font-bold text-emerald-500">TSH {Number(o.amount_paid || 0).toLocaleString()}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      hidden: "lg",
      render: (o) => <span className="font-mono font-bold">TSH {Number(o.balance_due || 0).toLocaleString()}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (o) => <AdminStatusBadge status={o.status} />,
    },
    {
      key: "date",
      header: "Date",
      align: "right",
      render: (o) => <span className="font-mono opacity-75 whitespace-nowrap">{formatDate(o.order_date || o.created_at)}</span>,
    },
  ]

  const orderActions: AdminTableAction<PurchaseOrder>[] = [
    {
      key: "view",
      label: "View Purchase Order",
      icon: Eye,
      variant: "view",
      onClick: (o) => {
        setSelectedOrder(o)
        setViewModal("order")
      },
    },
    {
      key: "profile",
      label: "Open Purchase Order",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (o) => `/admin/purchases/${o.id}`,
    },
  ]

  const receiptColumns: AdminTableColumn<GoodsReceipt>[] = [
    {
      key: "grn",
      header: "GRN Number",
      render: (r) => (
        <AdminPrimaryCell
          icon={PackageCheck}
          title={`#${r.grn_number}`}
          subtitle={`PO Ref: #${r.po_number}`}
        />
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "center",
      render: (r) => <AdminPill title="Received line items">{r.received_items?.length ?? 0} SKUs</AdminPill>,
    },
    {
      key: "warehouse",
      header: "Warehouse",
      hidden: "md",
      render: (r) => <AdminPill title={r.warehouse_name}>{r.warehouse_name || "Main Depot"}</AdminPill>,
    },
    {
      key: "receivedBy",
      header: "Received By",
      hidden: "lg",
      render: (r) => <AdminMutedText>{r.received_by}</AdminMutedText>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r) => <AdminStatusBadge status={r.status} />,
    },
    {
      key: "date",
      header: "Received Date",
      align: "right",
      render: (r) => <span className="font-mono opacity-75 whitespace-nowrap">{formatDate(r.receipt_date || r.created_at)}</span>,
    },
  ]

  const receiptActions: AdminTableAction<GoodsReceipt>[] = [
    {
      key: "view",
      label: "View GRN Details",
      icon: Eye,
      variant: "view",
      onClick: (r) => {
        setSelectedReceipt(r)
        setViewModal("receipt")
      },
    },
  ]

  const expenseColumns: AdminTableColumn<BusinessExpense>[] = [
    {
      key: "voucher",
      header: "Voucher #",
      render: (e) => (
        <AdminPrimaryCell
          icon={DollarSign}
          title={`#${e.expense_number}`}
          subtitle={e.vendor_name || supplier.name}
        />
      ),
    },
    {
      key: "title",
      header: "Title / Description",
      hidden: "md",
      render: (e) => <AdminMutedText>{e.title || e.description}</AdminMutedText>,
    },
    {
      key: "category",
      header: "Category",
      render: (e) => <AdminTag title={e.category}>{e.category}</AdminTag>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (e) => <AdminStatusBadge status={e.status} />,
    },
    {
      key: "amount",
      header: "Amount (TSH)",
      align: "right",
      render: (e) => <span className="font-mono font-black">TSH {Number(e.amount || 0).toLocaleString()}</span>,
    },
    {
      key: "date",
      header: "Date",
      align: "right",
      render: (e) => <span className="font-mono opacity-75 whitespace-nowrap">{formatDate(e.expense_date || e.created_at)}</span>,
    },
  ]

  const expenseActions: AdminTableAction<BusinessExpense>[] = [
    {
      key: "view",
      label: "View Expense Voucher",
      icon: Eye,
      variant: "view",
      onClick: (e) => {
        setSelectedExpense(e)
        setViewModal("expense")
      },
    },
  ]

  const orderDetailSections: AdminDetailSectionData[] = selectedOrder
    ? [
        {
          key: "order",
          title: "Purchase Order Record",
          icon: Truck,
          fields: [
            { label: "PO Number", value: `#${selectedOrder.po_number}` },
            { label: "Supplier", value: selectedOrder.supplier_name || supplier.name },
            { label: "Warehouse", value: selectedOrder.warehouse_name || "Main Depot" },
            { label: "Order Date", value: formatDate(selectedOrder.order_date || selectedOrder.created_at) },
            { label: "Expected Delivery", value: formatDate(selectedOrder.expected_delivery_date) },
            { label: "Status", value: <AdminStatusBadge status={selectedOrder.status} /> },
            { label: "Payment Status", value: <AdminPill>{selectedOrder.payment_status}</AdminPill> },
            { label: "Created By", value: selectedOrder.created_by },
            { label: "Created", value: new Date(selectedOrder.created_at).toLocaleString() },
            { label: "Updated", value: new Date(selectedOrder.updated_at).toLocaleString() },
          ],
        },
        {
          key: "amounts",
          title: "Financial Breakdown",
          icon: DollarSign,
          fields: [
            { label: "Subtotal", value: `TSH ${Number(selectedOrder.subtotal || 0).toLocaleString()}` },
            { label: "Tax Rate", value: `${selectedOrder.tax_rate}%` },
            { label: "Tax Amount", value: `TSH ${Number(selectedOrder.tax_amount || 0).toLocaleString()}` },
            { label: "Discount", value: `TSH ${Number(selectedOrder.discount_amount || 0).toLocaleString()}` },
            { label: "Shipping", value: `TSH ${Number(selectedOrder.shipping_amount || 0).toLocaleString()}` },
            { label: "Total", value: `TSH ${Number(selectedOrder.total || 0).toLocaleString()}` },
            { label: "Amount Paid", value: `TSH ${Number(selectedOrder.amount_paid || 0).toLocaleString()}` },
            { label: "Balance Due", value: `TSH ${Number(selectedOrder.balance_due || 0).toLocaleString()}` },
          ],
        },
        {
          key: "items",
          title: `Line Items (${selectedOrder.items?.length ?? 0})`,
          icon: Boxes,
          span: 2,
          content: (
            <div className="space-y-2">
              {(selectedOrder.items || []).length === 0 ? (
                <p className="text-xs opacity-70">No line items recorded.</p>
              ) : (
                selectedOrder.items.map((item, idx) => (
                  <div
                    key={`${item.product_id}-${idx}`}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg border border-navy/10 dark:border-teal/20"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{item.name}</p>
                      <p className="font-mono text-[10px] opacity-70">
                        {item.quantity} × TSH {Number(item.unit_cost || 0).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs shrink-0">
                      TSH {Number(item.total_cost || 0).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          ),
        },
        ...(selectedOrder.notes || selectedOrder.terms_conditions
          ? [
              {
                key: "notes",
                title: "Notes & Terms",
                icon: FileText,
                span: 2,
                content: (
                  <div className="space-y-3 text-xs leading-relaxed opacity-90">
                    {selectedOrder.notes && <p className="whitespace-pre-wrap">{selectedOrder.notes}</p>}
                    {selectedOrder.terms_conditions && <p className="whitespace-pre-wrap">{selectedOrder.terms_conditions}</p>}
                  </div>
                ),
              } as AdminDetailSectionData,
            ]
          : []),
      ]
    : []

  const receiptDetailSections: AdminDetailSectionData[] = selectedReceipt
    ? [
        {
          key: "grn",
          title: "Goods Receiving Note",
          icon: PackageCheck,
          fields: [
            { label: "GRN Number", value: `#${selectedReceipt.grn_number}` },
            { label: "PO Reference", value: `#${selectedReceipt.po_number}` },
            { label: "Supplier", value: selectedReceipt.supplier_name || supplier.name },
            { label: "Warehouse", value: selectedReceipt.warehouse_name || "Main Depot" },
            { label: "Receipt Date", value: formatDate(selectedReceipt.receipt_date || selectedReceipt.created_at) },
            { label: "Status", value: <AdminStatusBadge status={selectedReceipt.status} /> },
            { label: "Received By", value: selectedReceipt.received_by },
            { label: "Delivery Note", value: selectedReceipt.delivery_note_number || "—" },
            { label: "Carrier", value: selectedReceipt.carrier_name || "—" },
            { label: "Created", value: new Date(selectedReceipt.created_at).toLocaleString() },
          ],
        },
        {
          key: "items",
          title: `Received Items (${selectedReceipt.received_items?.length ?? 0})`,
          icon: Boxes,
          span: 2,
          content: (
            <div className="space-y-2">
              {(selectedReceipt.received_items || []).length === 0 ? (
                <p className="text-xs opacity-70">No received items recorded.</p>
              ) : (
                selectedReceipt.received_items.map((item, idx) => (
                  <div
                    key={`${item.product_id}-${idx}`}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg border border-navy/10 dark:border-teal/20"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{item.name}</p>
                      <p className="font-mono text-[10px] opacity-70">
                        {item.received_quantity}/{item.ordered_quantity} received × TSH {Number(item.unit_cost || 0).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs shrink-0">
                      TSH {Number(item.received_quantity * item.unit_cost || 0).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          ),
        },
        ...(selectedReceipt.notes
          ? [
              {
                key: "notes",
                title: "Inspection Notes",
                icon: FileText,
                span: 2,
                content: <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">{selectedReceipt.notes}</p>,
              } as AdminDetailSectionData,
            ]
          : []),
      ]
    : []

  const expenseDetailSections: AdminDetailSectionData[] = selectedExpense
    ? [
        {
          key: "voucher",
          title: "Expense Voucher",
          icon: Receipt,
          fields: [
            { label: "Voucher Number", value: `#${selectedExpense.expense_number}` },
            { label: "Title", value: selectedExpense.title || "—" },
            { label: "Description", value: selectedExpense.description || "—" },
            { label: "Category", value: <AdminPill>{selectedExpense.category}</AdminPill> },
            { label: "Amount", value: `TSH ${Number(selectedExpense.amount || 0).toLocaleString()}` },
            { label: "Tax Amount", value: `TSH ${Number(selectedExpense.tax_amount || 0).toLocaleString()}` },
            { label: "Expense Date", value: formatDate(selectedExpense.expense_date || selectedExpense.created_at) },
            { label: "Status", value: <AdminStatusBadge status={selectedExpense.status} /> },
            { label: "Payment Status", value: <AdminPill>{selectedExpense.payment_status || "—"}</AdminPill> },
            { label: "Vendor", value: selectedExpense.vendor_name || supplier.name },
          ],
        },
        {
          key: "payment",
          title: "Payment & Audit Trail",
          icon: DollarSign,
          fields: [
            { label: "Payment Method", value: selectedExpense.payment_method },
            { label: "Payment Reference", value: selectedExpense.payment_reference || "—" },
            { label: "Billable", value: <AdminPill>{selectedExpense.is_billable ? "Yes" : "No"}</AdminPill> },
            { label: "Customer", value: selectedExpense.customer_name || "—" },
            { label: "Recorded By", value: selectedExpense.recorded_by },
            { label: "Branch ID", value: selectedExpense.branch_id || "—" },
            { label: "Created", value: new Date(selectedExpense.created_at).toLocaleString() },
            { label: "Updated", value: new Date(selectedExpense.updated_at).toLocaleString() },
          ],
        },
        ...(selectedExpense.notes || selectedExpense.receipt_url
          ? [
              {
                key: "extras",
                title: "Notes & Attachments",
                icon: FileText,
                span: 2,
                content: (
                  <div className="space-y-2 text-xs leading-relaxed opacity-90">
                    {selectedExpense.notes && <p className="whitespace-pre-wrap">{selectedExpense.notes}</p>}
                    {selectedExpense.receipt_url && (
                      <a
                        href={selectedExpense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-teal hover:underline"
                      >
                        View Receipt <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ),
              } as AdminDetailSectionData,
            ]
          : []),
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16">
      <AdminPageHeader
        title={supplier.name}
        accent="Ledger"
        subtitle={`${supplier.company_name || supplier.name} • ${supplier.city || "Dar es Salaam"}, ${supplier.country || "Tanzania"} • Terms: ${supplier.payment_terms || "Net 30"}`}
        icon={Building2}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <AdminPill title="Supplier code">{supplier.supplier_code}</AdminPill>
              <AdminStatusBadge
                status={supplier.status === "active" ? "active" : "inactive"}
                label={`${supplier.status} Vendor`}
              />
            </div>
            <Link href="/admin/suppliers">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Suppliers</span>
              </Button>
            </Link>
            {supplier.email && (
              <a href={`mailto:${supplier.email}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </Button>
              </a>
            )}
            {supplier.phone && (
              <a href={`tel:${supplier.phone}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-teal dark:hover:bg-teal/10"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </Button>
              </a>
            )}
            <Link href={`/admin/purchases?supplier=${supplier.id}`}>
              <Button
                size="sm"
                className="font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2 bg-navy hover:bg-navy/90 text-white dark:bg-teal dark:text-navy dark:hover:bg-teal-400"
              >
                <Truck className="w-4 h-4" />
                <span>New PO</span>
              </Button>
            </Link>
          </div>
        }
      />

      <AdminStats
        items={[
          { title: "Total Spend", value: `TSH ${Number(totals.totalSpend || 0).toLocaleString()}`, icon: TrendingUp },
          { title: "Amount Settled", value: `TSH ${Number(totals.totalPaid || 0).toLocaleString()}`, icon: CheckCircle2 },
          { title: "Outstanding", value: `TSH ${Number(totals.outstanding || 0).toLocaleString()}`, icon: DollarSign },
          {
            title: "Fulfilment Rate",
            value: `${Number(totals.fulfilmentRate || 0).toFixed(0)}% (${totals.orderCount || 0} POs)`,
            icon: PackageCheck,
          },
        ]}
      />

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card
          className={cn(
            "lg:col-span-2 rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <CardTitleIcon icon={TrendingUp} isDark={isDark} />
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    {timeframe === "12months" && "Spend vs Settlement (Jan – Dec)"}
                    {timeframe === "30days" && `30-Day Spend vs Settlement (${MONTH_NAMES[selectedMonth]} ${selectedYear})`}
                    {timeframe === "week" && `Weekly Spend vs Settlement (Week ${selectedWeek} • ${MONTH_NAMES[selectedMonth]} ${selectedYear})`}
                  </h3>
                  <p className="text-xs opacity-70">
                    {timeframe === "12months" && `January to December procurement expenditure and completed payouts to ${supplier.name}`}
                    {timeframe === "30days" && `Daily breakdown across 30 days of ${MONTH_NAMES[selectedMonth]} ${selectedYear} for ${supplier.name}`}
                    {timeframe === "week" && `7-day breakdown of Week ${selectedWeek} in ${MONTH_NAMES[selectedMonth]} ${selectedYear} for ${supplier.name}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {timeframe !== "12months" && (
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(val) => setSelectedMonth(Number(val))}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 text-xs font-semibold rounded-lg w-[115px] border shadow-xs transition-colors",
                        isDark
                          ? "bg-[#070c24] border-teal/30 text-teal hover:border-teal/60"
                          : "bg-slate-50 border-navy/20 text-navy hover:border-navy/50"
                      )}
                    >
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20"}>
                      {MONTH_NAMES.map((m, idx) => (
                        <SelectItem key={m} value={String(idx)} className="text-xs">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {timeframe === "week" && (
                  <Select
                    value={String(selectedWeek)}
                    onValueChange={(val) => setSelectedWeek(Number(val))}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-8 text-xs font-semibold rounded-lg w-[100px] border shadow-xs transition-colors",
                        isDark
                          ? "bg-[#070c24] border-teal/30 text-teal hover:border-teal/60"
                          : "bg-slate-50 border-navy/20 text-navy hover:border-navy/50"
                      )}
                    >
                      <SelectValue placeholder="Week" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20"}>
                      <SelectItem value="1" className="text-xs">Week 1 (1–7)</SelectItem>
                      <SelectItem value="2" className="text-xs">Week 2 (8–14)</SelectItem>
                      <SelectItem value="3" className="text-xs">Week 3 (15–21)</SelectItem>
                      <SelectItem value="4" className="text-xs">Week 4 (22–28)</SelectItem>
                      <SelectItem value="5" className="text-xs">Week 5 (29–End)</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={timeframe}
                  onValueChange={(val: "12months" | "30days" | "week") => setTimeframe(val)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 text-xs font-bold rounded-lg w-[115px] border shadow-xs transition-colors",
                      isDark
                        ? "bg-[#0b132b] border-teal/40 text-teal hover:border-teal"
                        : "bg-white border-navy/30 text-navy hover:border-navy"
                    )}
                  >
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20"}>
                    <SelectItem value="12months" className="text-xs font-semibold">12 Months</SelectItem>
                    <SelectItem value="30days" className="text-xs font-semibold">30 Days</SelectItem>
                    <SelectItem value="week" className="text-xs font-semibold">Week</SelectItem>
                  </SelectContent>
                </Select>

                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-xs font-bold hidden xl:inline-flex",
                    isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                  )}
                >
                  Avg PO: TSH {(Number(totals.averageOrderValue || 0) / 1_000_000).toFixed(1)}M
                </Badge>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <SpendSettlementSvgChart
                data={chartData}
                timeframe={timeframe}
                isDark={isDark}
              />
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-85",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <div className="flex items-center gap-3">
              <span>
                Period Ordered:{" "}
                <strong className={isDark ? "text-sky-400" : "text-navy"}>
                  TSH {periodOrderedTotal.toLocaleString()}
                </strong>
              </span>
              <span>•</span>
              <span>
                Period Settled:{" "}
                <strong className={isDark ? "text-teal" : "text-teal-600"}>
                  TSH {periodPaidTotal.toLocaleString()}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Procurement Share: {Number(totals.spendShare || 0).toFixed(1)}%</span>
              <span>Total Orders: {totals.orderCount || 0}</span>
            </div>
          </div>
        </Card>

        <Card
          className={cn(
            "rounded-2xl sm:rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <CardTitleIcon icon={Boxes} isDark={isDark} />
              <div>
                <h3 className="text-base sm:text-lg font-black">Top Procured SKUs</h3>
                <p className="text-xs opacity-70">Highest volume items sourced from vendor</p>
              </div>
            </div>

            <div className="space-y-3 pt-3">
              {topProducts.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center opacity-60 text-xs">
                  <Boxes className="h-8 w-8 mb-2 opacity-40" />
                  No line items cataloged yet
                </div>
              ) : (
                topProducts.map((p, i) => (
                  <div
                    key={`${p.name}-${i}`}
                    className={cn(
                      "p-3 rounded-2xl border flex items-center justify-between text-xs",
                      isDark ? "bg-[#0c1833] border-teal/15" : "bg-teal-50/50 border-navy/10"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold truncate">{p.name}</p>
                      <p className="text-[10px] opacity-70 font-mono">
                        {p.quantity} Units supplied
                      </p>
                    </div>
                    <span className="font-mono font-black text-xs shrink-0">
                      TSH {Math.round(p.spend).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-navy/10 dark:border-teal/10 text-xs opacity-75">
            <span>Direct expenses linked: TSH {Number(totals.expenseTotal || 0).toLocaleString()}</span>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Purchase Orders</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">{orders.length}</span>
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <PackageCheck className="h-4 w-4 shrink-0" />
            <span>Goods Received Notes</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">{receipts.length}</span>
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>Linked Direct Expenses</span>
            <span className="tab-badge ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full">{expenses.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={Truck}
            title={`Purchase Orders Issued to ${supplier.name}`}
            description="Historical purchase commitments, invoices, and delivery fulfillment"
            badge={`${orders.length} Orders`}
          />
          <AdminTable
            columns={orderColumns}
            data={orders}
            rowKey={(o) => o.id}
            actions={orderActions}
            emptyIcon={Truck}
            emptyTitle="No purchase orders"
            emptyDescription="No purchase orders issued to this supplier yet."
          />
        </TabsContent>

        <TabsContent value="receipts" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={PackageCheck}
            title="Goods Receiving Notes (GRNs)"
            description="Physical shipments verified at QuardCube warehouse facilities"
            badge={`${receipts.length} GRNs`}
          />
          <AdminTable
            columns={receiptColumns}
            data={receipts}
            rowKey={(r) => r.id}
            actions={receiptActions}
            emptyIcon={PackageCheck}
            emptyTitle="No GRN records"
            emptyDescription="No GRN inspection records archived for this vendor."
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-0 space-y-3">
          <DetailSectionHeading
            icon={DollarSign}
            title="Disbursements & Direct Expenses"
            description="Business vouchers billed directly against this vendor"
            badge={`${expenses.length} Vouchers`}
          />
          <AdminTable
            columns={expenseColumns}
            data={expenses}
            rowKey={(e) => e.id}
            actions={expenseActions}
            emptyIcon={Receipt}
            emptyTitle="No expense vouchers"
            emptyDescription="No direct expense vouchers recorded for this supplier."
          />
        </TabsContent>
      </Tabs>

      <AdminDetailModal
        open={viewModal === "order"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedOrder(null)
          }
        }}
        icon={Truck}
        title={`PO #${selectedOrder?.po_number || ""}`}
        badge={selectedOrder ? <AdminStatusBadge status={selectedOrder.status} /> : undefined}
        subtitle={selectedOrder ? `${selectedOrder.supplier_name || supplier.name} • ${selectedOrder.warehouse_name || "Main Depot"}` : undefined}
        sections={orderDetailSections}
      />

      <AdminDetailModal
        open={viewModal === "receipt"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedReceipt(null)
          }
        }}
        icon={PackageCheck}
        title={`GRN #${selectedReceipt?.grn_number || ""}`}
        badge={selectedReceipt ? <AdminStatusBadge status={selectedReceipt.status} /> : undefined}
        subtitle={selectedReceipt ? `PO Ref #${selectedReceipt.po_number} • ${selectedReceipt.warehouse_name || "Main Depot"}` : undefined}
        sections={receiptDetailSections}
      />

      <AdminDetailModal
        open={viewModal === "expense"}
        onOpenChange={(open) => {
          if (!open) {
            setViewModal(null)
            setSelectedExpense(null)
          }
        }}
        icon={Receipt}
        title={`Voucher #${selectedExpense?.expense_number || ""}`}
        badge={selectedExpense ? <AdminStatusBadge status={selectedExpense.status} /> : undefined}
        subtitle={selectedExpense ? `${selectedExpense.category} • ${selectedExpense.title || selectedExpense.description}` : undefined}
        sections={expenseDetailSections}
      />
    </div>
  )
}

export default function SupplierDetailPage() {
  return (
    <SupplierErrorBoundary>
      <SupplierDetailInner />
    </SupplierErrorBoundary>
  )
}
