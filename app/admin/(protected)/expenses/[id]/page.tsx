"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { getExpenseDetail } from "@/lib/detail-actions"
import { updateExpenseStatus } from "@/lib/expense-actions"
import type { ExpenseDetailData } from "@/lib/detail-types"
import {
  ArrowLeft,
  DollarSign,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  Tag,
  CheckCircle2,
  Clock,
  Activity,
  FileText,
  ExternalLink,
  ShieldCheck,
  Check,
  AlertCircle,
  FileCheck,
  Percent,
  Wallet,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react"

interface ExpenseDetailPageProps {
  params?: Promise<{ id: string }>
}

export default function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const routeParams = useParams()
  const rawParamId = (routeParams?.id as string) || ""
  const [expenseId, setExpenseId] = useState<string>(rawParamId)
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()
  const [mounted, setMounted] = useState(false)

  const [data, setData] = useState<ExpenseDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (routeParams?.id) {
      setExpenseId(String(routeParams.id))
    } else if (params) {
      if (typeof (params as any).then === "function") {
        (params as Promise<{ id: string }>).then(p => {
          if (p?.id) setExpenseId(p.id)
        }).catch(() => {})
      } else if ((params as any)?.id) {
        setExpenseId((params as any).id)
      }
    }
  }, [routeParams?.id, params])

  const loadData = async (targetId: string) => {
    setIsLoading(true)
    try {
      const res = await getExpenseDetail(targetId)
      setData(res)
    } catch (err) {
      console.error("Failed to load expense details:", err)
      toast({
        title: "Error Loading Expense",
        description: "Could not fetch expense record from database.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!expenseId) return
    loadData(expenseId)
  }, [expenseId])

  const handleStatusTransition = async (newStatus: "draft" | "submitted" | "approved" | "rejected" | "paid") => {
    if (!data?.expense?.id) return
    setIsUpdatingStatus(true)
    try {
      await updateExpenseStatus(data.expense.id, newStatus as any)
      toast({
        title: "Status Updated",
        description: `Expense voucher changed to "${newStatus.toUpperCase()}".`,
      })
      await loadData(expenseId)
    } catch (err: any) {
      toast({
        title: "Status Update Failed",
        description: err.message || "Failed to transition status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (isLoading) return <AdminLoading />

  if (!data || !data.expense) {
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
            <Receipt className={cn("h-8 w-8", isDark ? "text-teal" : "text-navy")} />
          </div>
          <h2 className="text-2xl font-black mb-2">Expense Not Found</h2>
          <p className="text-sm opacity-70 mb-6">
            No expense record matches the identifier "{expenseId}". It may have been removed or archived.
          </p>
          <Link href="/admin/expenses">
            <Button
              className={cn(
                "font-bold rounded-xl",
                isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
              )}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Expenses
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const { expense, supplier, relatedExpenses, totals, auditLogs } = data
  const grossAmount = Number(expense.amount) || 0
  const taxAmount = Number(expense.tax_amount) || 0
  const netAmount = grossAmount - taxAmount

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. SIGNATURE HEADER BANNER */}
      <div
        className={cn(
          "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 text-navy transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark 
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <DollarSign className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {expense.title || expense.description || `Voucher #${expense.expense_number}`}
                </h1>
                <Badge
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider font-mono",
                    isDark ? "bg-teal/20 text-teal border-teal/30" : "bg-navy text-white"
                  )}
                >
                  #{expense.expense_number}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                    expense.status === "approved" || expense.status === "paid"
                      ? "bg-emerald-500 text-white"
                      : expense.status === "submitted"
                      ? "bg-cyan-500 text-white"
                      : expense.status === "rejected"
                      ? "bg-rose-500 text-white"
                      : "bg-slate-500 text-white"
                  )}
                >
                  {expense.status}
                </Badge>
              </div>
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium mt-0.5",
                  isDark ? "text-teal-300" : "text-navy/80"
                )}
              >
                {expense.category} • Recorded by {expense.recorded_by || "Administrator"} •{" "}
                {expense.expense_date
                  ? new Date(expense.expense_date).toLocaleDateString()
                  : new Date(expense.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0 ml-auto">
            <Link href="/admin/expenses">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 shadow-sm transition-all border-2",
                  isDark
                    ? "border-teal/30 text-teal hover:bg-teal/10"
                    : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Expenses</span>
              </Button>
            </Link>

            {supplier && (
              <Link href={`/admin/suppliers/${supplier.id}`}>
                <Button
                  size="sm"
                  className={cn(
                    "font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95 gap-2",
                    isDark ? "bg-teal hover:bg-teal-400 text-navy" : "bg-navy hover:bg-navy/90 text-white"
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Vendor Hub</span>
                </Button>
              </Link>
            )}

            {/* Quick Status Action Buttons */}
            {expense.status === "submitted" || expense.status === "draft" ? (
              <>
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusTransition("approved")}
                  className="font-bold rounded-xl h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusTransition("rejected")}
                  className="font-bold rounded-xl h-10 px-4 bg-rose-600 hover:bg-rose-500 text-white shadow-md gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Reject</span>
                </Button>
              </>
            ) : expense.status === "approved" ? (
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusTransition("paid")}
                className="font-bold rounded-xl h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Mark as Paid</span>
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => handleStatusTransition("draft")}
                variant="outline"
                className={cn(
                  "font-bold rounded-xl h-10 px-3.5 gap-1.5 border-2",
                  isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 bg-white text-navy hover:bg-teal-50"
                )}
              >
                <span>Reopen / Draft</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Gross Voucher Outlay",
            value: `TSH ${grossAmount.toLocaleString()}`,
            icon: DollarSign,
          },
          {
            title: "Tax Assessment (VAT)",
            value: `TSH ${taxAmount.toLocaleString()}`,
            icon: Percent,
          },
          {
            title: "Payment Modality",
            value: expense.payment_method || "Bank Transfer",
            icon: CreditCard,
          },
          {
            title: "Category Total Outlay",
            value: `TSH ${(totals.categoryTotal / 1_000_000).toFixed(1)}M`,
            icon: Tag,
          },
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
                  <p
                    className={cn(
                      "text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block",
                      isDark ? "text-teal-400/80" : "text-navy/70"
                    )}
                  >
                    {stat.title}
                  </p>
                  <span
                    className={cn(
                      "text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight",
                      isDark ? "text-white" : "text-navy"
                    )}
                  >
                    {stat.value}
                  </span>
                </div>
                <div
                  className={cn(
                    "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                    isDark
                      ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                      : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. CORE SUMMARY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voucher Breakdown (2 cols) */}
        <Card
          className={cn(
            "lg:col-span-2 rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                  isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                )}
              >
                <FileCheck className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black">
                  Voucher Financial Specification
                </CardTitle>
                <CardDescription className="text-xs">
                  Official disbursement allocation recorded in ledger
                </CardDescription>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 rounded-2xl border",
                  isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
                )}
              >
                <p className="text-[11px] font-bold uppercase opacity-60">Net Base Disbursement</p>
                <p className="text-xl font-black mt-1">TSH {netAmount.toLocaleString()}</p>
                <p className="text-[11px] opacity-75 mt-0.5">Excludes statutory taxes</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-2xl border",
                  isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
                )}
              >
                <p className="text-[11px] font-bold uppercase opacity-60">Statutory Tax Portion</p>
                <p className="text-xl font-black mt-1">TSH {taxAmount.toLocaleString()}</p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  {totals.taxShare.toFixed(1)}% effective tax burden
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-navy/10 dark:border-teal/10">
                <span className="font-bold opacity-70">Payment Reference</span>
                <span className="font-mono font-bold">{expense.payment_reference || "N/A (Direct)"}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-navy/10 dark:border-teal/10">
                <span className="font-bold opacity-70">Operating Division / Branch</span>
                <span className="font-bold">{expense.branch_id ? `Branch ID: ${expense.branch_id}` : "Headquarters"}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-navy/10 dark:border-teal/10">
                <span className="font-bold opacity-70">Billable to Client Project</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    expense.is_billable
                      ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                      : "border-slate-500 text-slate-400"
                  )}
                >
                  {expense.is_billable ? "Billable Outlay" : "Internal Operational Cost"}
                </Badge>
              </div>
              {expense.notes && (
                <div className="pt-2">
                  <p className="text-xs font-bold opacity-70 mb-1">Administrative Notes:</p>
                  <p className="text-xs italic p-3 rounded-xl bg-teal/5 border border-teal/20">
                    "{expense.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "mt-5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-75",
              isDark ? "border-teal/10" : "border-navy/10"
            )}
          >
            <span>Voucher Serial: {expense.id}</span>
            <span>Created: {new Date(expense.created_at).toLocaleString()}</span>
          </div>
        </Card>

        {/* Vendor & Category Context (1 col) */}
        <Card
          className={cn(
            "rounded-3xl border-2 p-5 sm:p-6 shadow-md flex flex-col justify-between",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
          )}
        >
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                  isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                )}
              >
                <Building2 className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black">
                  Vendor Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Entity contracted for this expenditure
                </CardDescription>
              </div>
            </div>

            {supplier ? (
              <div className="space-y-3 pt-1">
                <div
                  className={cn(
                    "p-4 rounded-2xl border space-y-1.5",
                    isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
                  )}
                >
                  <p className="font-bold text-sm">{supplier.name}</p>
                  <p className="text-xs font-mono opacity-70">Code: {supplier.supplier_code}</p>
                  {supplier.company_name && (
                    <p className="text-xs opacity-80">Company: {supplier.company_name}</p>
                  )}
                  {supplier.email && (
                    <p className="text-xs opacity-80">Email: {supplier.email}</p>
                  )}
                  {supplier.phone && (
                    <p className="text-xs opacity-80">Tel: {supplier.phone}</p>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium opacity-70">Vendor All-Time Spend:</span>
                    <span className="font-bold font-mono">
                      TSH {totals.vendorTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium opacity-70">Status:</span>
                    <Badge className="bg-emerald-500 text-white text-[10px] uppercase font-bold">
                      {supplier.status}
                    </Badge>
                  </div>
                </div>

                <Link href={`/admin/suppliers/${supplier.id}`} className="block pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full rounded-xl font-bold text-xs h-9 border-2 gap-1.5",
                      isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 text-navy hover:bg-teal-50"
                    )}
                  >
                    <span>View Supplier Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : expense.vendor_name ? (
              <div className="space-y-3 py-4 text-center">
                <div
                  className={cn(
                    "p-4 rounded-2xl border text-left",
                    isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
                  )}
                >
                  <p className="font-bold text-sm">{expense.vendor_name}</p>
                  <p className="text-xs opacity-70 mt-1">Unregistered / One-off external payee</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs opacity-60">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No vendor or payee linked to this internal disbursement.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-navy/10 dark:border-teal/10 text-xs">
            <span className="font-bold opacity-70">Category: </span>
            <span className="font-semibold">{expense.category}</span>
          </div>
        </Card>
      </div>

      {/* 4. TABS DETAIL SECTION (APPLYING SELECTED PERMISSION CARDS THEME) */}
      <Tabs defaultValue="specification" className="space-y-4">
        <TabsList>
          <TabsTrigger value="specification">
            <Receipt className="h-4 w-4 shrink-0" />
            <span>Voucher Allocation</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              TSH {(grossAmount / 1000).toFixed(0)}k
            </span>
          </TabsTrigger>
          <TabsTrigger value="related">
            <Layers className="h-4 w-4 shrink-0" />
            <span>Category Peers</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {relatedExpenses.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 shrink-0" />
            <span>Audit Trail</span>
            <span className="ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors bg-navy/10 text-navy dark:bg-slate-800 dark:text-slate-300 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
              {auditLogs.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Voucher Line Allocation */}
        <TabsContent value="specification" className="mt-0">
          <div
            className={cn(
              "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
              isDark
                ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Expenditure Accounting Specifications
                  </h3>
                  <p className={cn("text-[11px] font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                    Line item allocation and legal authorization breakdown
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
                )}
              >
                Voucher #{expense.expense_number}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div
                className={cn(
                  "p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-xs",
                  isDark
                    ? "bg-teal/15 border-teal/40 text-white"
                    : "bg-teal/15 border-2 border-navy text-navy"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Primary Category
                  </p>
                  <p className={cn("text-[10px] leading-tight font-medium", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    {expense.category}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-xs",
                  isDark
                    ? "bg-teal/15 border-teal/40 text-white"
                    : "bg-teal/15 border-2 border-navy text-navy"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Payment Instrument
                  </p>
                  <p className={cn("text-[10px] leading-tight font-medium", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    {expense.payment_method}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-xs",
                  isDark
                    ? "bg-teal/15 border-teal/40 text-white"
                    : "bg-teal/15 border-2 border-navy text-navy"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Settlement Status
                  </p>
                  <p className={cn("text-[10px] leading-tight font-medium uppercase", isDark ? "text-teal-200/80" : "text-navy/70")}>
                    {expense.payment_status || "PAID"}
                  </p>
                </div>
              </div>
            </div>

            {expense.receipt_url && (
              <div
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between gap-3",
                  isDark ? "bg-[#060a22]/70 border-teal/30" : "bg-white border-2 border-navy"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal" />
                  <div>
                    <p className="text-xs font-bold">Attached Proof / Receipt Document</p>
                    <p className="text-[10px] opacity-70">Stored on secure cloud storage</p>
                  </div>
                </div>
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button
                    size="sm"
                    className={cn(
                      "text-xs font-bold rounded-lg h-8 gap-1",
                      isDark ? "bg-teal text-navy" : "bg-navy text-white"
                    )}
                  >
                    <span>View Receipt</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Related Category Expenses */}
        <TabsContent value="related" className="mt-0">
          <div
            className={cn(
              "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
              isDark
                ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    Related Expenditures in {expense.category}
                  </h3>
                  <p className={cn("text-[11px] font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                    Other company expenses cataloged under the same account
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
                )}
              >
                {relatedExpenses.length} Records
              </Badge>
            </div>

            <div
              className={cn(
                "rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs",
                isDark ? "bg-[#060a22]/85 border-teal/40" : "bg-white border-2 border-navy"
              )}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Voucher #</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Title / Purpose</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Vendor</th>
                      <th className="text-right py-3.5 px-3 md:px-4">Amount</th>
                      <th className="text-center py-3.5 px-3 md:px-4">Status</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {relatedExpenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No other expenses recorded in this category.
                        </td>
                      </tr>
                    ) : (
                      relatedExpenses.map(rel => (
                        <tr
                          key={rel.id}
                          onClick={() => router.push(`/admin/expenses/${rel.id}`)}
                          className={cn(
                            "border-b transition-colors cursor-pointer group",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-mono font-bold whitespace-nowrap">
                            #{rel.expense_number}
                          </td>
                          <td className="py-3 px-3 md:px-4 max-w-xs truncate font-bold">
                            {rel.title || rel.description}
                          </td>
                          <td className="py-3 px-3 md:px-4 whitespace-nowrap">
                            {rel.vendor_name || "—"}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-right font-mono font-bold whitespace-nowrap">
                            TSH {Number(rel.amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 md:px-4 text-center whitespace-nowrap">
                            <Badge
                              className={cn(
                                "text-[9px] uppercase font-bold",
                                rel.status === "approved" || rel.status === "paid"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-500 text-white"
                              )}
                            >
                              {rel.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap">
                            <Link href={`/admin/expenses/${rel.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className={cn(
                                  "h-6 px-2 text-[10px] font-bold rounded-md border",
                                  isDark ? "border-teal/30 text-teal" : "border-navy/20 text-navy"
                                )}
                              >
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: System Audit Trail */}
        <TabsContent value="audit" className="mt-0">
          <div
            className={cn(
              "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
              isDark
                ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
                : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                  )}
                >
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className={cn("text-xs sm:text-sm font-black leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                    System Audit Trace & Governance Log
                  </h3>
                  <p className={cn("text-[11px] font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                    Tamper-evident record of creations and status updates on this voucher
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-xs font-bold",
                  isDark ? "border-teal/40 text-teal bg-teal/10" : "border-navy text-navy bg-white"
                )}
              >
                {auditLogs.length} Events
              </Badge>
            </div>

            <div
              className={cn(
                "rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs",
                isDark ? "bg-[#060a22]/85 border-teal/40" : "bg-white border-2 border-navy"
              )}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                      <th className="text-left py-3.5 px-4 md:px-6">Record / Ref</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Action</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Description</th>
                      <th className="text-left py-3.5 px-3 md:px-4">Actor</th>
                      <th className="text-right py-3.5 px-4 md:px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody
                    className={cn(
                      "divide-y font-medium",
                      isDark ? "divide-slate-800" : "divide-slate-100"
                    )}
                  >
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center font-semibold text-navy/60 dark:text-teal-400/80"
                        >
                          No specific audit entries matched for this expense identifier.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map(l => (
                        <tr
                          key={l.id}
                          className={cn(
                            "border-b transition-colors",
                            isDark
                              ? "border-teal/10 hover:bg-teal/30 hover:text-white"
                              : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                          )}
                        >
                          <td className="py-3 px-4 md:px-6 font-mono font-bold whitespace-nowrap">
                            {l.record_number || l.record_id.slice(0, 10)}
                          </td>
                          <td className="py-3 px-3 md:px-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-mono font-bold uppercase",
                                isDark
                                  ? "border-teal/30 bg-teal/10 text-teal-300"
                                  : "border-navy/20 bg-slate-50 text-navy"
                              )}
                            >
                              {l.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 md:px-4 max-w-md truncate">
                            {l.description}
                          </td>
                          <td className="py-3 px-3 md:px-4 font-bold whitespace-nowrap capitalize">
                            {l.user_name || (l.user_email ? l.user_email.split('@')[0].replace(/[._]/g, ' ') : "System")}
                          </td>
                          <td className="py-3 px-4 md:px-6 text-right whitespace-nowrap opacity-75 font-mono">
                            {new Date(l.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
