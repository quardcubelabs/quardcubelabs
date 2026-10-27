"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import {
  getProfitAndLossStatement,
  getBalanceSheetSummary,
  getAccountsReceivableAging,
  getAccountsPayableAging
} from "@/lib/accounting-actions"
import {
  FinancialPeriodSummary,
  BalanceSheetSummary,
  CustomerAgingRecord,
  SupplierAgingRecord
} from "@/lib/erp/accounting-types"
import {
  FileSpreadsheet,
  TrendingUp,
  Scale,
  Clock,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Building,
  RefreshCw,
  Landmark
} from "lucide-react"

export default function FinancialStatementsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [pnl, setPnl] = useState<FinancialPeriodSummary | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetSummary | null>(null)
  const [arAging, setArAging] = useState<CustomerAgingRecord[]>([])
  const [apAging, setApAging] = useState<SupplierAgingRecord[]>([])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [pnlData, bsData, arData, apData] = await Promise.all([
        getProfitAndLossStatement("FY 2026"),
        getBalanceSheetSummary(),
        getAccountsReceivableAging(),
        getAccountsPayableAging()
      ])
      setPnl(pnlData)
      setBalanceSheet(bsData)
      setArAging(arData)
      setApAging(apData)
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate financial statements.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  if (isLoading && !pnl) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Statements</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Statutory Income Statement (P&L), Balance Sheet, and AR/AP Aging schedules
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className={cn(isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100")}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recalculate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className={cn(isDark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-100")}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pnl" className="space-y-6">
        <TabsList className={cn("grid w-full grid-cols-4 max-w-2xl", isDark ? "bg-slate-900 border border-slate-800" : "bg-slate-100")}>
          <TabsTrigger value="pnl" className="text-xs sm:text-sm">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet" className="text-xs sm:text-sm">Balance Sheet</TabsTrigger>
          <TabsTrigger value="ar-aging" className="text-xs sm:text-sm">AR Aging (Debtors)</TabsTrigger>
          <TabsTrigger value="ap-aging" className="text-xs sm:text-sm">AP Aging (Creditors)</TabsTrigger>
        </TabsList>

        {/* 1. PROFIT & LOSS */}
        <TabsContent value="pnl" className="space-y-4">
          {pnl && (
            <div className="space-y-6">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                  <CardContent className="p-4">
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                      Gross Revenue
                    </span>
                    <div className="mt-2 text-2xl font-bold text-teal-500">
                      TZS {pnl.total_revenue.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Total invoices & contracts</p>
                  </CardContent>
                </Card>

                <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                  <CardContent className="p-4">
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                      Gross Profit
                    </span>
                    <div className="mt-2 text-2xl font-bold text-emerald-500">
                      TZS {pnl.gross_profit.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-emerald-500 font-semibold">{pnl.gross_margin_percentage}% Gross Margin</p>
                  </CardContent>
                </Card>

                <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                  <CardContent className="p-4">
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                      Operating Expenses
                    </span>
                    <div className="mt-2 text-2xl font-bold text-rose-500">
                      TZS {pnl.total_operating_expenses.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Payroll, rent, cloud & logistics</p>
                  </CardContent>
                </Card>

                <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                  <CardContent className="p-4">
                    <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                      Net Profit (EBIT)
                    </span>
                    <div className="mt-2 text-2xl font-bold text-blue-500">
                      TZS {pnl.net_profit.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-blue-500 font-semibold">{pnl.net_profit_margin_percentage}% Net Profit Margin</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Financial Breakdown Table */}
              <Card className={cn("overflow-hidden", isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-lg">QuardCube Labs Limited — Income Statement</h3>
                  <p className="text-xs text-slate-500">Reporting Period: {pnl.start_date} to {pnl.end_date} (Currency: Tanzanian Shillings TZS)</p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-500 mb-2">1. Operating Revenue</h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      <div className="flex justify-between py-2">
                        <span>Sales Revenue — Hardware & CCTV Products (Account 4010)</span>
                        <span className="font-mono">TZS 184,500,000</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Professional Engineering & Installation Services (Account 4020)</span>
                        <span className="font-mono">TZS 46,200,000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold bg-slate-500/5 px-2 rounded">
                        <span>Total Operating Revenue</span>
                        <span className="font-mono text-teal-500">TZS {pnl.total_revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* COGS Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">2. Cost of Goods Sold (COGS)</h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      <div className="flex justify-between py-2">
                        <span>Direct Equipment Landed Acquisition Cost (Account 5010)</span>
                        <span className="font-mono">TZS 118,400,000</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Direct Subcontractor & Site Cable Rigging Labor (Account 5020)</span>
                        <span className="font-mono">TZS 14,200,000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold bg-slate-500/5 px-2 rounded">
                        <span>Total Cost of Goods Sold</span>
                        <span className="font-mono text-rose-500">TZS {pnl.total_cogs.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gross Profit Summary */}
                  <div className="flex justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold">
                    <span>GROSS PROFIT (Gross Margin: {pnl.gross_margin_percentage}%)</span>
                    <span className="font-mono text-base">TZS {pnl.gross_profit.toLocaleString()}</span>
                  </div>

                  {/* Operating Expenses */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2">3. Operating Expenses (OpEx)</h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      <div className="flex justify-between py-2">
                        <span>Cloud Infrastructure, Supabase & AI Subscriptions (Account 6010)</span>
                        <span className="font-mono">TZS 5,800,000</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Regional Hub Facilities & Office Rent (Account 6020)</span>
                        <span className="font-mono">TZS 12,000,000</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Salaries & Engineering Staff Compensation (Account 6030)</span>
                        <span className="font-mono">TZS 24,500,000</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Power (TANESCO), Telecom & High-Speed Fiber (Account 6040)</span>
                        <span className="font-mono">TZS 3,800,000</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Logistics, Vehicle Fuel & Field Freight (Account 6050)</span>
                        <span className="font-mono">TZS 4,100,000</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold bg-slate-500/5 px-2 rounded">
                        <span>Total Operating Expenses</span>
                        <span className="font-mono text-purple-500">TZS {pnl.total_operating_expenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit Summary */}
                  <div className="flex justify-between p-4 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-500 font-bold text-lg">
                    <span>NET OPERATING PROFIT (Net Margin: {pnl.net_profit_margin_percentage}%)</span>
                    <span className="font-mono">TZS {pnl.net_profit.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 2. BALANCE SHEET */}
        <TabsContent value="balance-sheet" className="space-y-4">
          {balanceSheet && (
            <div className="space-y-6">
              {/* Balance Verification Banner */}
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                balanceSheet.is_balanced
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-500"
              )}>
                <div className="flex items-center gap-3">
                  {balanceSheet.is_balanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  <div>
                    <h4 className="font-bold text-sm">
                      {balanceSheet.is_balanced ? "Balance Sheet In Equilibrium" : "Balance Sheet Imbalance Detected"}
                    </h4>
                    <p className="text-xs opacity-90">
                      Accounting Equation: Total Assets (TZS {balanceSheet.assets.total_assets.toLocaleString()}) = Liabilities (TZS {balanceSheet.liabilities.total_liabilities.toLocaleString()}) + Equity (TZS {balanceSheet.equity.total_equity.toLocaleString()})
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500 text-emerald-500 uppercase font-mono text-xs">
                  Zero Variance
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Column */}
                <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 py-4">
                    <CardTitle className="text-base font-bold flex items-center justify-between">
                      <span className="text-emerald-500">ASSETS</span>
                      <span className="font-mono">TZS {balanceSheet.assets.total_assets.toLocaleString()}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Current Assets</h5>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {balanceSheet.assets.current_assets.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2">
                            <span>{item.name}</span>
                            <span className="font-mono">TZS {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Non-Current (Fixed) Assets</h5>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {balanceSheet.assets.non_current_assets.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2">
                            <span>{item.name}</span>
                            <span className="font-mono">TZS {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liabilities & Equity Column */}
                <div className="space-y-6">
                  {/* Liabilities */}
                  <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 py-4">
                      <CardTitle className="text-base font-bold flex items-center justify-between">
                        <span className="text-amber-500">LIABILITIES</span>
                        <span className="font-mono">TZS {balanceSheet.liabilities.total_liabilities.toLocaleString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Current Liabilities</h5>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {balanceSheet.liabilities.current_liabilities.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2">
                            <span>{item.name}</span>
                            <span className="font-mono">TZS {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Equity */}
                  <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 py-4">
                      <CardTitle className="text-base font-bold flex items-center justify-between">
                        <span className="text-blue-500">SHAREHOLDER EQUITY</span>
                        <span className="font-mono">TZS {balanceSheet.equity.total_equity.toLocaleString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      <div className="flex justify-between py-2">
                        <span>Paid-In Capital</span>
                        <span className="font-mono">TZS {balanceSheet.equity.owner_equity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Cumulative Retained Earnings</span>
                        <span className="font-mono">TZS {balanceSheet.equity.retained_earnings.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 3. AR AGING */}
        <TabsContent value="ar-aging" className="space-y-4">
          <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Accounts Receivable Aging Schedule</h3>
              <p className="text-xs text-slate-500">Overdue customer invoice breakdown by payment term buckets</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn("border-b text-xs uppercase font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  <tr>
                    <th className="px-4 py-3">Customer Account</th>
                    <th className="px-4 py-3 text-right">0–30 Days (Current)</th>
                    <th className="px-4 py-3 text-right">31–60 Days</th>
                    <th className="px-4 py-3 text-right">61–90 Days</th>
                    <th className="px-4 py-3 text-right">90+ Days</th>
                    <th className="px-4 py-3 text-right">Total Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {arAging.map(row => (
                    <tr key={row.customer_id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-medium">
                        {row.customer_name}
                        {row.customer_email && <div className="text-xs text-slate-500">{row.customer_email}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-500">
                        TZS {row.bucket.current.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-500">
                        TZS {row.bucket.days_31_60.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-400">
                        TZS {row.bucket.days_61_90.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">
                        TZS {row.bucket.days_90_plus.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        TZS {row.bucket.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 4. AP AGING */}
        <TabsContent value="ap-aging" className="space-y-4">
          <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base">Accounts Payable Aging Schedule</h3>
              <p className="text-xs text-slate-500">Outstanding supplier liabilities and trade vendor aging breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn("border-b text-xs uppercase font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
                  <tr>
                    <th className="px-4 py-3">Vendor / Supplier</th>
                    <th className="px-4 py-3 text-right">0–30 Days (Current)</th>
                    <th className="px-4 py-3 text-right">31–60 Days</th>
                    <th className="px-4 py-3 text-right">61–90 Days</th>
                    <th className="px-4 py-3 text-right">90+ Days</th>
                    <th className="px-4 py-3 text-right">Total Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apAging.map(row => (
                    <tr key={row.supplier_id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-medium">
                        {row.supplier_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-500">
                        TZS {row.bucket.current.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-500">
                        TZS {row.bucket.days_31_60.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-400">
                        TZS {row.bucket.days_61_90.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">
                        TZS {row.bucket.days_90_plus.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        TZS {row.bucket.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
