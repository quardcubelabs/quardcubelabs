"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import AdminLoading from "@/components/admin/admin-loading"
import { cn } from "@/lib/utils"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import {
  AdminPageHeader,
  AdminStats,
  AdminTable,
  AdminPrimaryCell,
  AdminStatusBadge,
  AdminDetailModal,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"
import {
  getProfitAndLossStatement,
  getBalanceSheetSummary,
  getAccountsReceivableAging,
  getAccountsPayableAging
} from "@/lib/accounting-actions"
import type {
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
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Landmark,
  TrendingDown,
  Eye,
  User,
  Truck,
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

  const arColumns: AdminTableColumn<CustomerAgingRecord>[] = [
    {
      key: "customer",
      header: "Customer Account",
      render: (row) => (
        <AdminPrimaryCell
          icon={User}
          title={row.customer_name}
          subtitle={row.customer_email || undefined}
        />
      ),
    },
    {
      key: "current",
      header: "0â€“30 Days (Current)",
      align: "right",
      render: (row) => <span className="font-mono font-bold text-emerald-500 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.current.toLocaleString()}</span>,
    },
    {
      key: "days31_60",
      header: "31â€“60 Days",
      align: "right",
      hidden: "sm",
      render: (row) => <span className="font-mono font-bold text-amber-500 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.days_31_60.toLocaleString()}</span>,
    },
    {
      key: "days61_90",
      header: "61â€“90 Days",
      align: "right",
      hidden: "md",
      render: (row) => <span className="font-mono font-bold text-rose-400 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.days_61_90.toLocaleString()}</span>,
    },
    {
      key: "days90plus",
      header: "90+ Days",
      align: "right",
      hidden: "lg",
      render: (row) => <span className="font-mono font-bold text-rose-600 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.days_90_plus.toLocaleString()}</span>,
    },
    {
      key: "total",
      header: "Total Outstanding",
      align: "right",
      render: (row) => <span className="font-mono font-black whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.total.toLocaleString()}</span>,
    },
  ]

  const arActions: AdminTableAction<CustomerAgingRecord>[] = [
    {
      key: "view",
      label: "View Aging Breakdown",
      icon: Eye,
      variant: "view",
      onClick: (row) => setSelectedArAging(row),
    },
  ]

  const apColumns: AdminTableColumn<SupplierAgingRecord>[] = [
    {
      key: "supplier",
      header: "Vendor / Supplier",
      render: (row) => <AdminPrimaryCell icon={Truck} title={row.supplier_name} />,
    },
    {
      key: "current",
      header: "0â€“30 Days (Current)",
      align: "right",
      render: (row) => <span className="font-mono font-bold text-emerald-500 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.current.toLocaleString()}</span>,
    },
    {
      key: "days31_60",
      header: "31â€“60 Days",
      align: "right",
      hidden: "sm",
      render: (row) => <span className="font-mono font-bold text-amber-500 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.days_31_60.toLocaleString()}</span>,
    },
    {
      key: "days61_90",
      header: "61â€“90 Days",
      align: "right",
      hidden: "md",
      render: (row) => <span className="font-mono font-bold text-rose-400 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.days_61_90.toLocaleString()}</span>,
    },
    {
      key: "days90plus",
      header: "90+ Days",
      align: "right",
      hidden: "lg",
      render: (row) => <span className="font-mono font-bold text-rose-600 whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.days_90_plus.toLocaleString()}</span>,
    },
    {
      key: "total",
      header: "Total Payable",
      align: "right",
      render: (row) => <span className="font-mono font-black whitespace-nowrap text-xs sm:text-sm">TZS {row.bucket.total.toLocaleString()}</span>,
    },
  ]

  const apActions: AdminTableAction<SupplierAgingRecord>[] = [
    {
      key: "view",
      label: "View Payable Breakdown",
      icon: Eye,
      variant: "view",
      onClick: (row) => setSelectedApAging(row),
    },
  ]

  if (isLoading && !pnl) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Financial"
        accent="Statements"
        subtitle="Statutory Income Statement (P&L), Balance Sheet, and AR/AP Aging schedules"
        icon={FileSpreadsheet}
        onRefresh={loadData}
        actions={
          <Button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial font-bold rounded-xl h-10 px-3 sm:px-4 border-2 transition-all text-xs sm:text-sm border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm dark:border-teal/40 dark:bg-white/10 dark:text-teal-300"
          >
            <Printer className="h-4 w-4 mr-1.5 sm:mr-2" />
            Print
          </Button>
        }
      />

      <Tabs defaultValue="pnl" className="space-y-4 sm:space-y-6">
        <TabsList>
          <TabsTrigger value="pnl">
            <TrendingUp className="h-4 w-4" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="balance-sheet">
            <Scale className="h-4 w-4" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="ar-aging">
            <Clock className="h-4 w-4" />
            AR Aging
          </TabsTrigger>
          <TabsTrigger value="ap-aging">
            <Landmark className="h-4 w-4" />
            AP Aging
          </TabsTrigger>
        </TabsList>

        {/* 1. PROFIT & LOSS */}
        <TabsContent value="pnl" className="space-y-4">
          {pnl && (
            <div className="space-y-6">
              <AdminStats
                columns={4}
                items={[
                  { title: "Gross Revenue", value: `TZS ${pnl.total_revenue.toLocaleString()}`, icon: DollarSign },
                  { title: "Gross Profit", value: `TZS ${pnl.gross_profit.toLocaleString()}`, icon: TrendingUp },
                  { title: "Operating Expenses", value: `TZS ${pnl.total_operating_expenses.toLocaleString()}`, icon: TrendingDown },
                  { title: "Net Profit (EBIT)", value: `TZS ${pnl.net_profit.toLocaleString()}`, icon: CheckCircle2 },
                ]}
              />

              {/* Detailed Financial Breakdown Table */}
              <Card className={cn(
                "rounded-2xl overflow-hidden",
                isDark ? "bg-[#0a1033] border-none shadow-md" : "border-2 bg-white border-navy/20 shadow-sm"
              )}>
                <div className="p-5 border-b border-navy/10 dark:border-teal/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-navy")}>QuardCube Labs Limited â€” Income Statement</h3>
                    <p className="text-xs text-slate-400">Reporting Period: {pnl.start_date} to {pnl.end_date} (Currency: Tanzanian Shillings TZS)</p>
                  </div>
                  <Badge variant="outline" className="border-teal text-teal text-xs font-mono font-bold">
                    FY 2026 Audit
                  </Badge>
                </div>

                <div className="p-5 space-y-5">
                  {/* Revenue Section */}
                  <div>
                    <h4 className={cn("text-xs font-black uppercase tracking-wider mb-2", isDark ? "text-white" : "text-navy")}>1. Operating Revenue</h4>
                    <div className={cn("divide-y text-xs sm:text-sm font-medium", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Sales Revenue â€” Hardware & CCTV Products (Account 4010)</span>
                        <span className="font-mono font-bold">TZS 184,500,000</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className={isDark ? "text-slate-300" : "text-navy"}>Professional Engineering & Installation Services (Account 4020)</span>
                        <span className="font-mono font-bold">TZS 46,200,000</span>
                      </div>
                      <div className={cn("flex justify-between py-2.5 px-3 rounded-xl font-black", isDark ? "bg-teal/15 text-white" : "bg-teal-50 text-navy")}>
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
                      <span className={cn("text-xs font-black uppercase tracking-wider", isDark ? "text-white" : "text-navy")}>Gross Operating Profit</span>
                      <p className="text-xs text-slate-400">Operating Revenue minus direct COGS</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("font-mono font-black text-lg sm:text-xl", isDark ? "text-white" : "text-navy")}>TZS {pnl.gross_profit.toLocaleString()}</span>
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
                <AdminStatusBadge
                  status={balanceSheet.is_balanced ? "verified" : "overdue"}
                  label={balanceSheet.is_balanced ? "Zero Variance" : "Imbalance"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Column */}
                <Card className={cn("rounded-2xl overflow-hidden", isDark ? "bg-[#0a1033] border-none shadow-md" : "bg-white border-2 border-navy/20 shadow-sm")}>
                  <CardHeader className="border-b border-navy/10 dark:border-teal/20 py-4 bg-navy text-white">
                    <CardTitle className="text-base font-black flex items-center justify-between gap-2.5">
                      <span className="flex items-center gap-2.5">
                        <CardTitleIcon icon={Landmark} isDark={isDark} />
                        <span className="text-teal">ASSETS</span>
                      </span>
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
                      <CardTitle className="text-base font-black flex items-center justify-between gap-2.5">
                        <span className="flex items-center gap-2.5">
                          <CardTitleIcon icon={Scale} isDark={isDark} />
                          <span className="text-amber-400">LIABILITIES</span>
                        </span>
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
                      <CardTitle className="text-base font-black flex items-center justify-between gap-2.5">
                        <span className="flex items-center gap-2.5">
                          <CardTitleIcon icon={User} isDark={isDark} />
                          <span className="text-blue-400">SHAREHOLDER EQUITY</span>
                        </span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className={cn("font-black text-base sm:text-lg", isDark ? "text-white" : "text-navy")}>Accounts Receivable Aging Schedule</h3>
              <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Overdue customer invoice breakdown by payment term buckets</p>
            </div>
            <Badge className="bg-emerald-500 text-white font-mono text-xs font-bold w-fit">
              Live Invoicing Engine
            </Badge>
          </div>
          <AdminTable
            columns={arColumns}
            data={arAging}
            rowKey={(row) => row.customer_id}
            actions={arActions}
            emptyIcon={User}
            emptyTitle="No overdue receivables recorded"
          />
        </TabsContent>

        {/* 4. AP AGING */}
        <TabsContent value="ap-aging" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className={cn("font-black text-base sm:text-lg", isDark ? "text-white" : "text-navy")}>Accounts Payable Aging Schedule</h3>
              <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Outstanding supplier liabilities and trade vendor aging breakdown</p>
            </div>
            <Badge className="bg-amber-500 text-white font-mono text-xs font-bold w-fit">
              Supply Chain Liabilities
            </Badge>
          </div>
          <AdminTable
            columns={apColumns}
            data={apAging}
            rowKey={(row) => row.supplier_id}
            actions={apActions}
            emptyIcon={Truck}
            emptyTitle="No outstanding supplier payables"
          />
        </TabsContent>
      </Tabs>

      {/* AR Aging Details Modal */}
      <AdminDetailModal
        open={!!selectedArAging}
        onOpenChange={(open) => !open && setSelectedArAging(null)}
        icon={User}
        title={selectedArAging?.customer_name ?? "Customer Aging"}
        subtitle={
          selectedArAging
            ? `Account ID: ${selectedArAging.customer_id}${selectedArAging.customer_email ? ` â€¢ ${selectedArAging.customer_email}` : ""}`
            : undefined
        }
        badge={<AdminStatusBadge status="active" label="Active Debtor" />}
        sections={
          selectedArAging
            ? [
                {
                  key: "outstanding",
                  title: "Total Outstanding Balance",
                  icon: DollarSign,
                  span: 3,
                  fields: [
                    { label: "Balance", value: <span className="font-mono font-black text-xl">TZS {selectedArAging.bucket.total.toLocaleString()}</span> },
                    { label: "Source", value: "Calculated from verified commercial invoices" },
                  ],
                },
                {
                  key: "buckets",
                  title: "Aging Buckets",
                  icon: Clock,
                  span: 3,
                  fields: [
                    { label: "0â€“30 Days (Current, On Terms)", value: <span className="font-mono font-black text-emerald-500">TZS {selectedArAging.bucket.current.toLocaleString()}</span> },
                    { label: "31â€“60 Days (Mild Overdue)", value: <span className="font-mono font-black text-amber-500">TZS {selectedArAging.bucket.days_31_60.toLocaleString()}</span> },
                    { label: "61â€“90 Days (Critical Overdue)", value: <span className="font-mono font-black text-rose-400">TZS {selectedArAging.bucket.days_61_90.toLocaleString()}</span> },
                    { label: "90+ Days (Default Risk)", value: <span className="font-mono font-black text-rose-600">TZS {selectedArAging.bucket.days_90_plus.toLocaleString()}</span> },
                  ],
                },
              ]
            : []
        }
      />

      {/* AP Aging Details Modal */}
      <AdminDetailModal
        open={!!selectedApAging}
        onOpenChange={(open) => !open && setSelectedApAging(null)}
        icon={Truck}
        title={selectedApAging?.supplier_name ?? "Supplier Aging"}
        subtitle={selectedApAging ? `Supplier ID: ${selectedApAging.supplier_id}` : undefined}
        badge={<AdminStatusBadge status="warning" label="Active Creditor" />}
        sections={
          selectedApAging
            ? [
                {
                  key: "payable",
                  title: "Total Accounts Payable Balance",
                  icon: DollarSign,
                  span: 3,
                  fields: [
                    { label: "Balance", value: <span className="font-mono font-black text-xl text-amber-500">TZS {selectedApAging.bucket.total.toLocaleString()}</span> },
                    { label: "Source", value: "Verified against PO Goods Received Notes" },
                  ],
                },
                {
                  key: "buckets",
                  title: "Aging Buckets",
                  icon: Clock,
                  span: 3,
                  fields: [
                    { label: "0â€“30 Days (Current Terms)", value: <span className="font-mono font-black text-emerald-500">TZS {selectedApAging.bucket.current.toLocaleString()}</span> },
                    { label: "31â€“60 Days (Due Soon)", value: <span className="font-mono font-black text-amber-500">TZS {selectedApAging.bucket.days_31_60.toLocaleString()}</span> },
                    { label: "61â€“90 Days (Priority Settlement)", value: <span className="font-mono font-black text-rose-400">TZS {selectedApAging.bucket.days_61_90.toLocaleString()}</span> },
                    { label: "90+ Days (Overdue Payable)", value: <span className="font-mono font-black text-rose-600">TZS {selectedApAging.bucket.days_90_plus.toLocaleString()}</span> },
                  ],
                },
              ]
            : []
        }
      />
    </div>
  )
}
