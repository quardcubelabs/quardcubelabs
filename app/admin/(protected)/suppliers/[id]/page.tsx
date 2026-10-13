"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { getSupplierDetail } from "@/lib/detail-actions"
import type { SupplierDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  DollarSign,
  PackageCheck,
  Receipt,
  FileText,
  Clock,
  TrendingUp,
  Tag,
  CheckCircle2,
  Boxes,
  ExternalLink,
} from "lucide-react"

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>
}

const spendChartConfig: ChartConfig = {
  ordered: {
    label: "Ordered (TSH)",
    color: "#000080",
  },
  paid: {
    label: "Paid (TSH)",
    color: "#40E0D0",
  },
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const resolvedParams = use(params)
  const supplierId = resolvedParams.id
  const router = useRouter()
  const { isDark } = useAdminTheme()

  const [data, setData] = useState<SupplierDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const res = await getSupplierDetail(supplierId)
        if (mounted) setData(res)
      } catch (err) {
        console.error("Failed to load supplier details:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [supplierId])

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

  const { supplier, orders, receipts, expenses, totals, monthly, statusDistribution, topProducts } = data

  const PIE_COLORS = isDark
    ? ["#40E0D0", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399"]
    : ["#000080", "#0891b2", "#2563eb", "#7c3aed", "#059669", "#d97706"]

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. SIGNATURE HEADER BANNER */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 text-navy transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0",
              isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
            )}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {supplier.name} <span className={cn(isDark ? "text-teal" : "text-white drop-shadow-sm")}>Ledger</span>
                </h1>
                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider", isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white")}>
                  {supplier.supplier_code}
                </Badge>
                <Badge className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                  supplier.status === "active" ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {supplier.status} Vendor
                </Badge>
              </div>
              <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-teal-300" : "text-navy/80")}>
                {supplier.company_name || supplier.name} • {supplier.city || "Dar es Salaam"}, {supplier.country || "Tanzania"} • Terms: {supplier.payment_terms || "Net 30"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/admin/suppliers">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
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
                  className={cn(
                    "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                    isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                  )}
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
                  className={cn(
                    "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                    isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                  )}
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </Button>
              </a>
            )}

            <Link href={`/admin/purchases?supplier=${supplier.id}`}>
              <Button
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2",
                  isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                )}
              >
                <Truck className="w-4 h-4" />
                <span>New PO</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Total Procurement Spend", value: `TSH ${Number(totals.totalSpend).toLocaleString()}`, icon: TrendingUp },
          { title: "Amount Settled", value: `TSH ${Number(totals.totalPaid).toLocaleString()}`, icon: CheckCircle2 },
          { title: "Payable Outstanding", value: `TSH ${Number(totals.outstanding).toLocaleString()}`, icon: DollarSign },
          { title: "Order Fulfilment Rate", value: `${totals.fulfilmentRate.toFixed(0)}% (${totals.orderCount} POs)`, icon: PackageCheck },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
              )}
            >
              <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 12-Month Outlay Bar Chart (2 cols) */}
        <Card
          className={cn(
            "lg:col-span-2 rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                    isDark
                      ? "bg-navy text-teal border-teal/30"
                      : "bg-teal text-navy border-teal/40"
                  )}
                >
                  <TrendingUp className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-black">
                    12-Month Spend vs Settlement
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Monthly procurement expenditure and completed payouts to {supplier.name}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/30 text-teal" : "border-navy/30 text-navy"
                )}
              >
                Avg PO: TSH {(totals.averageOrderValue / 1_000_000).toFixed(1)}M
              </Badge>
            </div>

            <div className="h-64 sm:h-72 w-full pt-4">
              <ChartContainer config={spendChartConfig} className="h-full w-full">
                <BarChart
                  data={monthly}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "rgba(64, 224, 208, 0.1)" : "rgba(0, 0, 128, 0.08)"}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDark ? "#94a3b8" : "#64748b"}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar
                    dataKey="ordered"
                    name="Ordered"
                    fill={isDark ? "#000080" : "#000080"}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="paid"
                    name="Paid"
                    fill={isDark ? "#40E0D0" : "#40E0D0"}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 pt-3 border-t flex items-center justify-between text-xs font-semibold opacity-75",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <span>Supplier represents {totals.spendShare.toFixed(1)}% of total company procurement</span>
            <span>Total Orders: {totals.orderCount}</span>
          </div>
        </Card>

        {/* Top Procured Products (1 col) */}
        <Card
          className={cn(
            "rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark
              ? "bg-[#0a1033] border-teal/20 text-white"
              : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                  isDark
                    ? "bg-navy text-teal border-teal/30"
                    : "bg-teal text-navy border-teal/40"
                )}
              >
                <Boxes className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black">
                  Top Procured SKUs
                </CardTitle>
                <CardDescription className="text-xs">
                  Highest volume items sourced from vendor
                </CardDescription>
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
                    key={p.name}
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
            <span>Direct expenses linked: TSH {Number(totals.expenseTotal).toLocaleString()}</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Purchase Orders</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-teal group-data-[state=active]:text-navy">
              {orders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="receipts">
            <PackageCheck className="h-4 w-4 shrink-0" />
            <span>Goods Received Notes</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-teal group-data-[state=active]:text-navy">
              {receipts.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span>Linked Direct Expenses</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-teal group-data-[state=active]:text-navy">
              {expenses.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Orders */}
        <TabsContent value="orders">
          <Card
            className={cn(
              "rounded-3xl border-2 overflow-hidden shadow-lg",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20">
              <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                <Truck className="h-5 w-5 text-teal" />
                Purchase Orders Issued to {supplier.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Historical purchase commitments, invoices, and delivery fulfillment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">PO Number</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Warehouse</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Total (TSH)</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Paid</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Balance</th>
                      <th className="text-center py-3.5 px-3 md:px-4">Status</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No purchase orders issued to this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map(o => (
                        <tr
                          key={o.id}
                          className={cn(
                            "border-b transition-colors cursor-pointer group",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-mono font-bold whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                                  isDark
                                    ? "bg-navy text-teal border-teal/30"
                                    : "bg-teal text-navy border-teal/40"
                                )}
                              >
                                <Truck
                                  className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
                                  isDark ? "text-teal-400" : "text-navy"
                                )}
                              >
                                #{o.po_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:px-4">{o.warehouse_name || "Main Depot"}</td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-black">
                            TSH {Number(o.total).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono text-emerald-500 font-bold">
                            TSH {Number(o.amount_paid).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-bold">
                            TSH {Number(o.balance_due).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-center">
                            <Badge
                              className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5",
                                o.status === "received"
                                  ? "bg-emerald-500 text-white"
                                  : o.status === "partially_received"
                                  ? "bg-blue-500 text-white"
                                  : o.status === "ordered"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-500 text-white"
                              )}
                            >
                              {o.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap font-mono opacity-75">
                            {new Date(o.order_date || o.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Receipts */}
        <TabsContent value="receipts" className="mt-0">
          <Card
            className={cn(
              "rounded-3xl border-2 p-6 shadow-lg",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <div className="mb-4">
              <h3 className="text-lg font-black flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-teal" />
                Goods Receiving Notes (GRNs)
              </h3>
              <p className="text-xs opacity-75">
                Physical shipments verified at QuardCube warehouse facilities
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {receipts.length === 0 ? (
                <p className="col-span-full text-center py-8 text-xs opacity-60">
                  No GRN inspection records archived for this vendor.
                </p>
              ) : (
                receipts.map(r => (
                  <div
                    key={r.id}
                    className={cn(
                      "p-4 rounded-2xl border-2 space-y-2",
                      isDark
                        ? "bg-[#0c1833] border-teal/20 text-white"
                        : "bg-white border-navy/15 text-navy shadow-xs"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-teal">
                        #{r.grn_number}
                      </span>
                      <Badge className="bg-emerald-500 text-white font-black text-[10px] uppercase">
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold">PO Reference: #{r.po_number}</p>
                    <div className="pt-2 border-t border-navy/10 dark:border-teal/10 flex items-center justify-between text-xs opacity-75">
                      <span>Warehouse: {r.warehouse_name || "Main"}</span>
                      <span>{new Date(r.receipt_date || r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Expenses */}
        <TabsContent value="expenses" className="mt-0">
          <Card
            className={cn(
              "rounded-3xl border-2 overflow-hidden shadow-lg",
              isDark
                ? "bg-[#0a1033] border-teal/20 text-white"
                : "bg-white border-navy/20 text-navy"
            )}
          >
            <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20">
              <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-teal" />
                Disbursements & Direct Expenses
              </CardTitle>
              <CardDescription className="text-xs">
                Business vouchers billed directly against this vendor
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Voucher #</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Title / Description</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Category</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Amount (TSH)</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {expenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No direct expense vouchers recorded for this supplier.
                        </td>
                      </tr>
                    ) : (
                      expenses.map(e => (
                        <tr
                          key={e.id}
                          className={cn(
                            "border-b transition-colors cursor-pointer group",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-mono font-bold whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                                  isDark
                                    ? "bg-navy text-teal border-teal/30"
                                    : "bg-teal text-navy border-teal/40"
                                )}
                              >
                                <DollarSign
                                  className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")}
                                />
                              </div>
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
                                  isDark ? "text-teal-400" : "text-navy"
                                )}
                              >
                                #{e.expense_number}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 md:px-4">{e.title || e.description}</td>
                          <td className="py-3 px-3 md:px-4 font-semibold">{e.category}</td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-black">
                            TSH {Number(e.amount).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap font-mono opacity-75">
                            {new Date(e.expense_date || e.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
