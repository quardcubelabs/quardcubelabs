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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/suppliers">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 px-3 font-bold border-2 transition-colors",
                isDark
                  ? "border-teal/30 text-white hover:bg-teal/20"
                  : "border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Suppliers
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                isDark
                  ? "bg-navy text-teal border-teal/30"
                  : "bg-teal text-navy border-teal/40"
              )}
            >
              <Building2 className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={cn(
                    "text-xl sm:text-2xl font-black tracking-tight",
                    isDark ? "text-white" : "text-navy"
                  )}
                >
                  {supplier.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono font-bold text-xs uppercase border",
                    isDark
                      ? "border-teal/40 bg-teal/15 text-teal"
                      : "border-navy/30 bg-teal text-navy"
                  )}
                >
                  {supplier.supplier_code}
                </Badge>
              </div>
              <p
                className={cn(
                  "text-xs font-semibold mt-0.5",
                  isDark ? "text-teal-400/80" : "text-navy/70"
                )}
              >
                {supplier.company_name || supplier.name} • {supplier.city || "Tanzania"},{" "}
                {supplier.country || "Tanzania"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {supplier.email && (
            <a href={`mailto:${supplier.email}`}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-xl h-10 px-3 font-bold border-2",
                  isDark
                    ? "border-teal/30 text-teal-300 hover:bg-teal/20"
                    : "border-navy/20 text-navy hover:bg-teal-50"
                )}
              >
                <Mail className="h-4 w-4 mr-1.5" />
                Email
              </Button>
            </a>
          )}
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`}>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-xl h-10 px-3 font-bold border-2",
                  isDark
                    ? "border-teal/30 text-teal-300 hover:bg-teal/20"
                    : "border-navy/20 text-navy hover:bg-teal-50"
                )}
              >
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </Button>
            </a>
          )}
          <Link href={`/admin/purchases?supplier=${supplier.id}`}>
            <Button
              size="sm"
              className={cn(
                "rounded-xl h-10 px-4 font-black shadow-md transition-all active:scale-95",
                isDark
                  ? "bg-navy text-teal hover:bg-navy/80 border border-teal/40"
                  : "bg-teal text-navy hover:bg-teal-400"
              )}
            >
              <Truck className="h-4 w-4 mr-1.5" />
              New PO
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Overview Card */}
      <Card
        className={cn(
          "rounded-3xl border-2 overflow-hidden shadow-lg",
          isDark
            ? "bg-[#0a1033] border-teal/20 text-white"
            : "bg-white border-navy/20 text-navy"
        )}
      >
        <div
          className={cn(
            "p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b",
            isDark ? "border-teal/10 bg-[#070d2b]" : "border-navy/10 bg-teal/10"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black">{supplier.name}</h2>
              <Badge
                className={cn(
                  "text-xs font-black uppercase tracking-wider px-3 py-0.5",
                  supplier.status === "active"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-500 text-white"
                )}
              >
                {supplier.status} Vendor
              </Badge>
              <Badge variant="outline" className="font-mono text-xs font-bold border">
                Terms: {supplier.payment_terms || "Net 30"}
              </Badge>
            </div>
            <p
              className={cn(
                "text-xs sm:text-sm font-semibold opacity-80 flex items-center gap-2",
                isDark ? "text-teal-300" : "text-navy"
              )}
            >
              <MapPin className="h-4 w-4 shrink-0 text-teal" />
              <span>
                {supplier.address || "Main Logistics Yard"}, {supplier.city},{" "}
                {supplier.country}
              </span>
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Total Spend
              </p>
              <p className="text-lg font-black mt-0.5">
                TSH {Number(totals.totalSpend).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono opacity-60">Rank #{totals.spendRank}</p>
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Amount Paid
              </p>
              <p className="text-lg font-black mt-0.5 text-emerald-500">
                TSH {Number(totals.totalPaid).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono opacity-60">
                {totals.paymentRate.toFixed(0)}% settled
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Payable Balance
              </p>
              <p
                className={cn(
                  "text-lg font-black mt-0.5",
                  totals.outstanding > 0 ? "text-rose-500" : "text-emerald-500"
                )}
              >
                TSH {Number(totals.outstanding).toLocaleString()}
              </p>
              <p className="text-[10px] font-mono opacity-60">Due</p>
            </div>
            <div
              className={cn(
                "p-3 rounded-2xl border text-center",
                isDark ? "bg-[#0c1833] border-teal/20" : "bg-white border-navy/10"
              )}
            >
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                Fulfilment Rate
              </p>
              <p className="text-lg font-black mt-0.5 text-teal-400">
                {totals.fulfilmentRate.toFixed(0)}%
              </p>
              <p className="text-[10px] font-mono opacity-60">{totals.orderCount} POs</p>
            </div>
          </div>
        </div>

        {/* Tax / Registry Info Strip */}
        <div
          className={cn(
            "p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold",
            isDark ? "bg-[#0a1033]" : "bg-white"
          )}
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-4 w-4 opacity-60 shrink-0" />
            <span>TIN: {supplier.tin_number || "Not recorded"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Receipt className="h-4 w-4 opacity-60 shrink-0" />
            <span>VAT / VRN: {supplier.vat_number || "Not registered"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 opacity-60 shrink-0" />
            <span>Onboarded: {new Date(supplier.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>

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
        <TabsList
          className={cn(
            "p-1 rounded-2xl border-2 flex items-center justify-start h-auto flex-wrap gap-1",
            isDark ? "bg-[#0c1833] border-teal/20" : "bg-teal-50 border-navy/20"
          )}
        >
          <TabsTrigger
            value="orders"
            className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-teal data-[state=active]:text-navy"
          >
            <Truck className="h-3.5 w-3.5 mr-1.5" />
            Purchase Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-teal data-[state=active]:text-navy"
          >
            <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
            Goods Received Notes ({receipts.length})
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="rounded-xl font-bold text-xs py-2 px-3 data-[state=active]:bg-teal data-[state=active]:text-navy"
          >
            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
            Linked Direct Expenses ({expenses.length})
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
        <TabsContent value="receipts">
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
        <TabsContent value="expenses">
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
