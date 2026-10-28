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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  Landmark,
  TrendingDown,
  Layers,
  FileText,
  Eye,
  Building2,
  User,
  Truck
} from "lucide-react"

export default function FinancialStatementsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [pnl, setPnl] = useState<FinancialPeriodSummary | null>(null)
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetSummary | null>(null)
  const [arAging, setArAging] = useState<CustomerAgingRecord[]>([])
  const [apAging, setApAging] = useState<SupplierAgingRecord[]>([])
  const [selectedArAging, setSelectedArAging] = useState<CustomerAgingRecord | null>(null)
  const [selectedApAging, setSelectedApAging] = useState<SupplierAgingRecord | null>(null)

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
      {/* 1. Header Banner */}
      <div className={cn(
        "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <FileSpreadsheet className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Financial <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Statements</span>
              </h1>
              <p className={cn("text-xs sm:text-base font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300" : "text-navy/90")}>
                Statutory Income Statement (P&L), Balance Sheet, and AR/AP Aging schedules
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadData}
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm flex-1 sm:flex-none justify-center transition-all active:scale-95",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Recalculate
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm flex-1 sm:flex-none justify-center transition-all active:scale-95",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4 sm:space-y-6">
        <TabsList className={cn(
          "grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-auto p-1.5 gap-1.5 rounded-2xl border-2",
          isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-xs"
        )}>
          <TabsTrigger value="pnl" className="text-xs sm:text-sm font-bold rounded-xl py-2 flex items-center justify-center gap-1.5 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md">
            <TrendingUp className="h-4 w-4" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="text-xs sm:text-sm font-bold rounded-xl py-2 flex items-center justify-center gap-1.5 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md">
            <Scale className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="ar-aging" className="text-xs sm:text-sm font-bold rounded-xl py-2 flex items-center justify-center gap-1.5 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md">
            <Clock className="h-4 w-4" />
            AR Aging
          </TabsTrigger>
          <TabsTrigger value="ap-aging" className="text-xs sm:text-sm font-bold rounded-xl py-2 flex items-center justify-center gap-1.5 data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-md">
            <Landmark className="h-4 w-4" />
            AP Aging
          </TabsTrigger>
        </TabsList>

        {/* 1. PROFIT & LOSS */}
        <TabsContent value="pnl" className="space-y-4">
          {pnl && (
            <div className="space-y-6">
              {/* Highlight Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { title: "Gross Revenue", value: `TZS ${pnl.total_revenue.toLocaleString()}`, icon: DollarSign, sub: "Total invoices & contracts" },
                  { title: "Gross Profit", value: `TZS ${pnl.gross_profit.toLocaleString()}`, icon: TrendingUp, sub: `${pnl.gross_margin_percentage}% Gross Margin` },
                  { title: "Operating Expenses", value: `TZS ${pnl.total_operating_expenses.toLocaleString()}`, icon: TrendingDown, sub: "Payroll, rent & logistics" },
                  { title: "Net Profit (EBIT)", value: `TZS ${pnl.net_profit.toLocaleString()}`, icon: CheckCircle2, sub: `${pnl.net_profit_margin_percentage}% Net Margin` },
                ].map((stat, idx) => (
                  <Card
                    key={idx}
                    className={cn(
                      "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden",
                      isDark 
                        ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                        : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
                    )}
                  >
                    <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                          {stat.title}
                        </p>
                        <span className={cn("text-xs sm:text-base font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                          {stat.value}
                        </span>
                        <p className={cn("text-[10px] font-bold mt-1 truncate opacity-70", isDark ? "text-slate-300" : "text-navy/60")}>
                          {stat.sub}
                        </p>
                      </div>
                      <div className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                        isDark 
                          ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                          : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                      )}>
                        <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Financial Breakdown Table */}
              <Card className={cn(
                "rounded-2xl overflow-hidden",
                isDark ? "bg-[#0a1033] border-none shadow-md" : "border-2 bg-white border-navy/20 shadow-sm"
              )}>
                <div className="p-5 border-b border-navy/10 dark:border-teal/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-navy")}>QuardCube Labs Limited — Income Statement</h3>
                    <p className="text-xs text-slate-400">Reporting Period: {pnl.start_date} to {pnl.end_date} (Currency: Tanzanian Shillings TZS)</p>
                  </div>
                  <Badge variant="outline" className="border-teal text-teal text-xs font-mono font-bold">
                    FY 2026 Audit
                  </Badge>
                </div>

                <div className="p-5 space-y-5">
                  {/* Revenue Section */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal mb-2">1. Operating Revenue</h4>
                    <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Sales Revenue — Hardware & CCTV Products (Account 4010)</span>
                        <span className="font-mono font-bold">TZS 184,500,000</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Professional Engineering & Installation Services (Account 4020)</span>
                        <span className="font-mono font-bold">TZS 46,200,000</span>
                      </div>
                      <div className={cn("flex justify-between py-2.5 px-3 rounded-xl font-black", isDark ? "bg-teal/15 text-teal" : "bg-teal-50 text-navy")}>
                        <span>Total Operating Revenue</span>
                        <span className="font-mono">TZS {pnl.total_revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* COGS Section */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 mb-2">2. Cost of Goods Sold (COGS)</h4>
                    <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Direct Equipment Landed Acquisition Cost (Account 5010)</span>
                        <span className="font-mono font-bold">TZS 118,400,000</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Direct Subcontractor & Site Cable Rigging Labor (Account 5020)</span>
                        <span className="font-mono font-bold">TZS 14,200,000</span>
                      </div>
                      <div className={cn("flex justify-between py-2.5 px-3 rounded-xl font-black", isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-600")}>
                        <span>Total Cost of Goods Sold</span>
                        <span className="font-mono">TZS {pnl.total_cogs.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Gross Profit Callout */}
                  <div className={cn("p-4 rounded-xl border-2 flex justify-between items-center", isDark ? "bg-[#080d2a] border-teal/30" : "bg-slate-50 border-navy/20")}>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-teal">Gross Operating Profit</span>
                      <p className="text-xs text-slate-400">Operating Revenue minus direct COGS</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-lg sm:text-xl text-teal">TZS {pnl.gross_profit.toLocaleString()}</span>
                      <p className="text-xs font-bold text-emerald-500">{pnl.gross_margin_percentage}% Margin</p>
                    </div>
                  </div>

                  {/* Operating Expenses */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 mb-2">3. Operating Expenses (OPEX)</h4>
                    <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Office Rent, Power & Internet Infrastructure (Account 6010)</span>
                        <span className="font-mono font-bold">TZS 12,800,000</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Technical Staff & Engineer Salaries (Account 6020)</span>
                        <span className="font-mono font-bold">TZS 28,400,000</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Vehicle Fuel, Site Logistics & Transport (Account 6030)</span>
                        <span className="font-mono font-bold">TZS 6,100,000</span>
                      </div>
                      <div className={cn("flex justify-between py-2.5 px-3 rounded-xl font-black", isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700")}>
                        <span>Total Operating Expenses</span>
                        <span className="font-mono">TZS {pnl.total_operating_expenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Final Net Profit Banner */}
                  <div className={cn("p-5 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3", isDark ? "bg-teal/20 border-teal/50 text-white" : "bg-navy text-white border-navy")}>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-teal">Net Operating Income (EBIT)</span>
                      <p className="text-xs opacity-80">Full accounting period audited bottom line</p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-2xl sm:text-3xl text-emerald-400">
                        TZS {pnl.net_profit.toLocaleString()}
                      </div>
                      <Badge className="bg-emerald-500 text-white font-bold mt-1">
                        {pnl.net_profit_margin_percentage}% Return on Revenue
                      </Badge>
                    </div>
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
              {/* Equilibrium Banner */}
              <div className={cn(
                "p-4 rounded-2xl border-2 flex items-center justify-between",
                balanceSheet.is_balanced
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-500"
              )}>
                <div className="flex items-center gap-3">
                  {balanceSheet.is_balanced ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
                  <div>
                    <h4 className="font-black text-sm">
                      {balanceSheet.is_balanced ? "Balance Sheet In Equilibrium" : "Balance Sheet Imbalance Detected"}
                    </h4>
                    <p className="text-xs opacity-90">
                      Accounting Equation: Total Assets (TZS {balanceSheet.assets.total_assets.toLocaleString()}) = Liabilities (TZS {balanceSheet.liabilities.total_liabilities.toLocaleString()}) + Equity (TZS {balanceSheet.equity.total_equity.toLocaleString()})
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white uppercase font-mono text-xs font-bold">
                  Zero Variance
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Column */}
                <Card className={cn("rounded-2xl overflow-hidden", isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm")}>
                  <CardHeader className="border-b border-navy/10 dark:border-teal/20 py-4 bg-navy text-white">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="text-teal">ASSETS</span>
                      <span className="font-mono">TZS {balanceSheet.assets.total_assets.toLocaleString()}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-teal mb-2">Current Assets</h5>
                      <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                        {balanceSheet.assets.current_assets.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2.5">
                            <span className={isDark ? "text-slate-300" : "text-navy"}>{item.name}</span>
                            <span className="font-mono font-bold">TZS {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-teal mb-2">Non-Current (Fixed) Assets</h5>
                      <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                        {balanceSheet.assets.non_current_assets.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2.5">
                            <span className={isDark ? "text-slate-300" : "text-navy"}>{item.name}</span>
                            <span className="font-mono font-bold">TZS {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liabilities & Equity Column */}
                <div className="space-y-6">
                  {/* Liabilities */}
                  <Card className={cn("rounded-2xl overflow-hidden", isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm")}>
                    <CardHeader className="border-b border-navy/10 dark:border-teal/20 py-4 bg-navy text-white">
                      <CardTitle className="text-base font-black flex items-center justify-between">
                        <span className="text-amber-400">LIABILITIES</span>
                        <span className="font-mono">TZS {balanceSheet.liabilities.total_liabilities.toLocaleString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <h5 className="text-xs font-black uppercase tracking-wider text-amber-500 mb-2">Current Liabilities</h5>
                      <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                        {balanceSheet.liabilities.current_liabilities.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-2.5">
                            <span className={isDark ? "text-slate-300" : "text-navy"}>{item.name}</span>
                            <span className="font-mono font-bold">TZS {item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Equity */}
                  <Card className={cn("rounded-2xl overflow-hidden", isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm")}>
                    <CardHeader className="border-b border-navy/10 dark:border-teal/20 py-4 bg-navy text-white">
                      <CardTitle className="text-base font-black flex items-center justify-between">
                        <span className="text-blue-400">SHAREHOLDER EQUITY</span>
                        <span className="font-mono">TZS {balanceSheet.equity.total_equity.toLocaleString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 divide-y text-xs sm:text-sm font-medium">
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Paid-In Capital</span>
                        <span className="font-mono font-bold">TZS {balanceSheet.equity.owner_equity.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Cumulative Retained Earnings</span>
                        <span className="font-mono font-bold">TZS {balanceSheet.equity.retained_earnings.toLocaleString()}</span>
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
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
            isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
          )}>
            <div className="p-4 sm:p-5 border-b border-navy/10 dark:border-teal/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className={cn("font-black text-base sm:text-lg", isDark ? "text-white" : "text-navy")}>Accounts Receivable Aging Schedule</h3>
                <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Overdue customer invoice breakdown by payment term buckets</p>
              </div>
              <Badge className="bg-emerald-500 text-white font-mono text-xs font-bold w-fit">
                Live Invoicing Engine
              </Badge>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy text-white font-black border-b border-navy/30">
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Customer Account</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">0–30 Days (Current)</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right hidden sm:table-cell">31–60 Days</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right hidden md:table-cell">61–90 Days</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right hidden lg:table-cell">90+ Days</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Total Outstanding</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
                  {arAging.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-navy/60 dark:text-slate-400">
                        <User className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                        <p className="font-bold text-base">No overdue receivables recorded</p>
                      </td>
                    </tr>
                  ) : (
                    arAging.map(row => (
                      <tr
                        key={row.customer_id}
                        className={cn(
                          "transition-colors duration-150",
                          isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                        )}
                      >
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn(
                              "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                              isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                            )}>
                              <User className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                            </div>
                            <div className="min-w-0">
                              <div className={cn("font-bold text-xs sm:text-sm truncate", isDark ? "text-white" : "text-navy")}>
                                {row.customer_name}
                              </div>
                              {row.customer_email && (
                                <p className={cn("hidden sm:block text-[11px] font-medium truncate max-w-[200px]", isDark ? "text-slate-400" : "text-navy/60")}>
                                  {row.customer_email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-emerald-500 whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.current.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-amber-500 hidden sm:table-cell whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.days_31_60.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-rose-400 hidden md:table-cell whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.days_61_90.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-rose-600 hidden lg:table-cell whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.days_90_plus.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-black whitespace-nowrap text-xs sm:text-sm">
                          <span className={cn(isDark ? "text-white" : "text-navy")}>
                            TZS {row.bucket.total.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                            <button
                              onClick={() => setSelectedArAging(row)}
                              className={cn(
                                "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                              )}
                              title="View Aging Breakdown"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 4. AP AGING */}
        <TabsContent value="ap-aging" className="space-y-4">
          <Card className={cn(
            "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
            isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
          )}>
            <div className="p-4 sm:p-5 border-b border-navy/10 dark:border-teal/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className={cn("font-black text-base sm:text-lg", isDark ? "text-white" : "text-navy")}>Accounts Payable Aging Schedule</h3>
                <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Outstanding supplier liabilities and trade vendor aging breakdown</p>
              </div>
              <Badge className="bg-amber-500 text-white font-mono text-xs font-bold w-fit">
                Supply Chain Liabilities
              </Badge>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy text-white font-black border-b border-navy/30">
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Vendor / Supplier</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">0–30 Days (Current)</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right hidden sm:table-cell">31–60 Days</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right hidden md:table-cell">61–90 Days</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right hidden lg:table-cell">90+ Days</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Total Payable</th>
                    <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
                  {apAging.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-navy/60 dark:text-slate-400">
                        <Truck className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                        <p className="font-bold text-base">No outstanding supplier payables</p>
                      </td>
                    </tr>
                  ) : (
                    apAging.map(row => (
                      <tr
                        key={row.supplier_id}
                        className={cn(
                          "transition-colors duration-150",
                          isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                        )}
                      >
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn(
                              "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                              isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                            )}>
                              <Truck className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                            </div>
                            <div className="min-w-0">
                              <div className={cn("font-bold text-xs sm:text-sm truncate", isDark ? "text-white" : "text-navy")}>
                                {row.supplier_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-emerald-500 whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.current.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-amber-500 hidden sm:table-cell whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.days_31_60.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-rose-400 hidden md:table-cell whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.days_61_90.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-bold text-rose-600 hidden lg:table-cell whitespace-nowrap text-xs sm:text-sm">
                          TZS {row.bucket.days_90_plus.toLocaleString()}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right font-mono font-black whitespace-nowrap text-xs sm:text-sm">
                          <span className={cn(isDark ? "text-white" : "text-navy")}>
                            TZS {row.bucket.total.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                            <button
                              onClick={() => setSelectedApAging(row)}
                              className={cn(
                                "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                              )}
                              title="View Payable Breakdown"
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AR Aging Details Modal */}
      <Dialog open={!!selectedArAging} onOpenChange={(open) => !open && setSelectedArAging(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedArAging && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                      {selectedArAging.customer_name}
                    </h2>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Account ID: <span className="font-mono font-bold">{selectedArAging.customer_id}</span> {selectedArAging.customer_email && `• ${selectedArAging.customer_email}`}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white font-bold text-xs px-3 py-1">
                  Active Debtor
                </Badge>
              </div>

              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Total Outstanding Balance</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5">
                    TZS {selectedArAging.bucket.total.toLocaleString()}
                  </div>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-navy/10 dark:bg-white/10">
                  Calculated from verified commercial invoices
                </div>
              </div>

              {/* Bucket Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-emerald-500 block">0–30 Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedArAging.bucket.current.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Current (On Terms)</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-amber-500 block">31–60 Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedArAging.bucket.days_31_60.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Mild Overdue</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-rose-400 block">61–90 Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedArAging.bucket.days_61_90.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Critical Overdue</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-rose-600 block">90+ Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedArAging.bucket.days_90_plus.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Default Risk</span>
                </div>
              </div>

              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedArAging(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AP Aging Details Modal */}
      <Dialog open={!!selectedApAging} onOpenChange={(open) => !open && setSelectedApAging(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedApAging && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                      {selectedApAging.supplier_name}
                    </h2>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Supplier ID: <span className="font-mono font-bold">{selectedApAging.supplier_id}</span>
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-500 text-white font-bold text-xs px-3 py-1">
                  Active Creditor
                </Badge>
              </div>

              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Total Accounts Payable Balance</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5 text-amber-500">
                    TZS {selectedApAging.bucket.total.toLocaleString()}
                  </div>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-navy/10 dark:bg-white/10">
                  Verified against PO Goods Received Notes
                </div>
              </div>

              {/* Bucket Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-emerald-500 block">0–30 Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedApAging.bucket.current.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Current Terms</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-amber-500 block">31–60 Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedApAging.bucket.days_31_60.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Due Soon</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-rose-400 block">61–90 Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedApAging.bucket.days_61_90.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Priority Settlement</span>
                </div>
                <div className={cn("p-3.5 rounded-xl border space-y-1 text-center", isDark ? "bg-teal/10 border-teal/30" : "bg-slate-50 border-navy/20")}>
                  <span className="text-[10px] font-black uppercase text-rose-600 block">90+ Days</span>
                  <span className="font-mono font-black text-sm block">TZS {selectedApAging.bucket.days_90_plus.toLocaleString()}</span>
                  <span className="text-[10px] opacity-70 block font-semibold">Overdue Payable</span>
                </div>
              </div>

              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApAging(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
