"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
  AdminMutedText,
  AdminStatusBadge,
  AdminBooleanBadge,
  AdminCountBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminSelect,
  AdminConfirmDialog,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { CardTitleIcon } from "@/components/admin/card-title-icon"
import { getExpenseDetail } from "@/lib/detail-actions"
import { updateExpenseStatus } from "@/lib/expense-actions"
import type { ExpenseDetailData } from "@/lib/detail-types"
import type { AuditLogEntry, BusinessExpense } from "@/lib/erp/types"
import {
  ArrowLeft,
  DollarSign,
  Receipt,
  Building2,
  CreditCard,
  Tag,
  Activity,
  FileText,
  ExternalLink,
  FileCheck,
  Percent,
  Layers,
  ArrowUpRight,
  Edit,
  Eye,
  Check,
} from "lucide-react"

interface ExpenseDetailPageProps {
  params?: Promise<{ id: string }>
}

type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected" | "paid"

const EXPENSE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
]

export default function ExpenseDetailPage({ params }: ExpenseDetailPageProps) {
  const routeParams = useParams()
  const rawParamId = (routeParams?.id as string) || ""
  const [expenseId, setExpenseId] = useState<string>(rawParamId)
  const { toast } = useToast()
  const { isDark } = useAdminTheme()
  const [mounted, setMounted] = useState(false)

  const [data, setData] = useState<ExpenseDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [statusDraft, setStatusDraft] = useState<ExpenseStatus>("draft")
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false)
  const [selectedRelated, setSelectedRelated] = useState<BusinessExpense | null>(null)
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)

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

  const openStatusModal = () => {
    if (!data?.expense) return
    setStatusDraft(data.expense.status)
    setIsStatusModalOpen(true)
  }

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (statusDraft === "rejected") {
      setIsStatusModalOpen(false)
      setIsRejectConfirmOpen(true)
      return
    }
    void handleStatusTransition(statusDraft)
  }

  const confirmReject = async () => {
    setIsRejectConfirmOpen(false)
    await handleStatusTransition("rejected")
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

  const relatedColumns: AdminTableColumn<BusinessExpense>[] = [
    {
      key: "voucher",
      header: "Voucher #",
      render: (rel) => (
        <AdminPrimaryCell
          icon={Receipt}
          title={`#${rel.expense_number}`}
          href={`/admin/expenses/${rel.id}`}
          subtitle={rel.title || rel.description}
        />
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      hidden: "md",
      render: (rel) =>
        rel.vendor_name ? (
          <AdminPill title={rel.vendor_name}>{rel.vendor_name}</AdminPill>
        ) : (
          <AdminMutedText>—</AdminMutedText>
        ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (rel) => (
        <span className="font-mono font-bold whitespace-nowrap">
          TSH {Number(rel.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (rel) => <AdminStatusBadge status={rel.status} />,
    },
  ]

  const relatedActions: AdminTableAction<BusinessExpense>[] = [
    {
      key: "view",
      label: "View Expense Details",
      icon: Eye,
      variant: "view",
      onClick: (rel) => {
        setSelectedRelated(rel)
        setIsRelatedModalOpen(true)
      },
    },
    {
      key: "open",
      label: "Open Expense Record",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      href: (rel) => `/admin/expenses/${rel.id}`,
    },
  ]

  const relatedDetailSections: AdminDetailSectionData[] = selectedRelated
    ? [
        {
          key: "purpose",
          title: "Expense Purpose",
          icon: Receipt,
          span: 2,
          content: (
            <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
              {selectedRelated.description || "No purpose description recorded."}
            </p>
          ),
        },
        {
          key: "record",
          title: "Voucher Record",
          icon: FileCheck,
          fields: [
            {
              label: "Voucher Number",
              value: <AdminPill>#{selectedRelated.expense_number}</AdminPill>,
            },
            { label: "Title", value: selectedRelated.title || "—" },
            { label: "Category", value: selectedRelated.category },
            {
              label: "Status",
              value: <AdminStatusBadge status={selectedRelated.status} />,
            },
            {
              label: "Amount",
              value: `TSH ${Number(selectedRelated.amount || 0).toLocaleString()}`,
            },
            {
              label: "Tax",
              value: `TSH ${Number(selectedRelated.tax_amount || 0).toLocaleString()}`,
            },
            {
              label: "Payment Method",
              value: selectedRelated.payment_method || "—",
            },
            {
              label: "Payment Reference",
              value: selectedRelated.payment_reference || "N/A (Direct)",
            },
            { label: "Vendor", value: selectedRelated.vendor_name || "—" },
            {
              label: "Billable",
              value: <AdminBooleanBadge value={selectedRelated.is_billable} />,
            },
            {
              label: "Expense Date",
              value: selectedRelated.expense_date
                ? new Date(selectedRelated.expense_date).toLocaleDateString()
                : "—",
            },
            {
              label: "Recorded By",
              value: selectedRelated.recorded_by || "Administrator",
            },
            {
              label: "Created",
              value: new Date(selectedRelated.created_at).toLocaleString(),
            },
          ],
        },
      ]
    : []

  const auditColumns: AdminTableColumn<AuditLogEntry>[] = [
    {
      key: "record",
      header: "Record / Ref",
      render: (log) => (
        <AdminPrimaryCell
          icon={Activity}
          title={log.record_number || log.record_id.slice(0, 10)}
          subtitle={log.module}
        />
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => <AdminTag className="uppercase">{log.action}</AdminTag>,
    },
    {
      key: "description",
      header: "Description",
      cellClassName: "max-w-[240px]",
      render: (log) => <AdminMutedText>{log.description}</AdminMutedText>,
    },
    {
      key: "actor",
      header: "Actor",
      render: (log) =>
        log.user_name ||
        (log.user_email
          ? log.user_email.split("@")[0].replace(/[._]/g, " ")
          : "System"),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      align: "right",
      render: (log) => (
        <span className="font-mono opacity-75 whitespace-nowrap">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
  ]

  const auditActions: AdminTableAction<AuditLogEntry>[] = [
    {
      key: "view",
      label: "View Audit Entry Details",
      icon: Eye,
      variant: "view",
      onClick: (log) => {
        setSelectedAudit(log)
        setIsAuditModalOpen(true)
      },
    },
  ]

  const auditDetailSections: AdminDetailSectionData[] = selectedAudit
    ? [
        {
          key: "event",
          title: "Audit Event",
          icon: Activity,
          span: 2,
          content: (
            <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
              {selectedAudit.description}
            </p>
          ),
        },
        {
          key: "metadata",
          title: "Governance Metadata",
          icon: FileCheck,
          fields: [
            {
              label: "Record Number",
              value: selectedAudit.record_number || "—",
            },
            { label: "Record ID", value: selectedAudit.record_id },
            { label: "Module", value: <AdminPill>{selectedAudit.module}</AdminPill> },
            { label: "Action", value: <AdminTag className="uppercase">{selectedAudit.action}</AdminTag> },
            {
              label: "Actor",
              value: selectedAudit.user_name || selectedAudit.user_email || "System",
            },
            { label: "Email", value: selectedAudit.user_email || "—" },
            { label: "Branch", value: selectedAudit.branch_name || selectedAudit.branch_id || "—" },
            { label: "IP Address", value: selectedAudit.ip_address || "—" },
            {
              label: "Timestamp",
              value: new Date(selectedAudit.created_at).toLocaleString(),
            },
          ],
        },
        {
          key: "state",
          title: "State Transition",
          icon: Layers,
          span: 3,
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-1">
                  Previous State
                </p>
                <pre className="text-[11px] font-mono rounded-xl border border-navy/15 dark:border-teal/30 p-3 overflow-x-auto bg-white/60 dark:bg-[#060a22]/60">
                  {selectedAudit.previous_state
                    ? JSON.stringify(selectedAudit.previous_state, null, 2)
                    : "—"}
                </pre>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-1">
                  New State
                </p>
                <pre className="text-[11px] font-mono rounded-xl border border-navy/15 dark:border-teal/30 p-3 overflow-x-auto bg-white/60 dark:bg-[#060a22]/60">
                  {selectedAudit.new_state
                    ? JSON.stringify(selectedAudit.new_state, null, 2)
                    : "—"}
                </pre>
              </div>
            </div>
          ),
        },
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden pb-16">
      <AdminPageHeader
        title={expense.title || expense.description || "Voucher"}
        accent={`#${expense.expense_number}`}
        subtitle={`${expense.category} • Recorded by ${expense.recorded_by || "Administrator"} • ${
          expense.expense_date
            ? new Date(expense.expense_date).toLocaleDateString()
            : new Date(expense.created_at).toLocaleDateString()
        }`}
        icon={DollarSign}
        onRefresh={() => loadData(expenseId)}
        actions={
          <>
            <AdminStatusBadge status={expense.status} />
            <Link href="/admin/expenses">
              <Button
                variant="outline"
                size="sm"
                className="font-bold rounded-xl h-10 px-3.5 gap-1.5 border-2 border-navy/20 bg-white text-navy hover:bg-teal-50 dark:border-teal/30 dark:bg-transparent dark:text-white dark:hover:bg-teal/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Expenses
              </Button>
            </Link>
            {supplier && (
              <Link href={`/admin/suppliers/${supplier.id}`}>
                <Button
                  size="sm"
                  className="font-bold rounded-xl h-10 px-4 bg-navy hover:bg-navy/90 text-white shadow-md gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Vendor Hub
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              onClick={openStatusModal}
              disabled={isUpdatingStatus}
              className="font-bold rounded-xl h-10 px-4 bg-teal text-navy hover:bg-teal-400 shadow-md gap-1.5"
            >
              <Edit className="w-4 h-4" />
              Update Status
            </Button>
          </>
        }
      />

      <AdminStats
        items={[
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
        ]}
      />

      {/* CORE SUMMARY SECTION */}
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
              <CardTitleIcon icon={FileCheck} isDark={isDark} />
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
              <div className={cn(
                "p-4 rounded-2xl border",
                isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
              )}>
                <p className="text-[11px] font-bold uppercase opacity-60">Net Base Disbursement</p>
                <p className="text-xl font-black mt-1">TSH {netAmount.toLocaleString()}</p>
                <p className="text-[11px] opacity-75 mt-0.5">Excludes statutory taxes</p>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border",
                isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
              )}>
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
                <AdminBooleanBadge value={expense.is_billable} />
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

          <div className={cn(
            "mt-5 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-75",
            isDark ? "border-teal/10" : "border-navy/10"
          )}>
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
              <CardTitleIcon icon={Building2} isDark={isDark} />
              <div>
                <CardTitle className="text-base sm:text-lg font-black">Vendor Information</CardTitle>
                <CardDescription className="text-xs">
                  Entity contracted for this expenditure
                </CardDescription>
              </div>
            </div>

            {supplier ? (
              <div className="space-y-3 pt-1">
                <div className={cn(
                  "p-4 rounded-2xl border space-y-1.5",
                  isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
                )}>
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
                    <AdminStatusBadge status={supplier.status} />
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
                    View Supplier Profile
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : expense.vendor_name ? (
              <div className="space-y-3 py-4 text-center">
                <div className={cn(
                  "p-4 rounded-2xl border text-left",
                  isDark ? "bg-[#060a22]/70 border-teal/20" : "bg-slate-50 border-navy/15"
                )}>
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

      {/* TABS DETAIL SECTION */}
      <Tabs defaultValue="specification" className="space-y-4">
        <TabsList>
          <TabsTrigger value="specification">
            <Receipt className="h-4 w-4 shrink-0" />
            <span>Voucher Allocation</span>
            <AdminCountBadge>TSH {(grossAmount / 1000).toFixed(0)}k</AdminCountBadge>
          </TabsTrigger>
          <TabsTrigger value="related">
            <Layers className="h-4 w-4 shrink-0" />
            <span>Category Peers</span>
            <AdminCountBadge>{relatedExpenses.length}</AdminCountBadge>
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 shrink-0" />
            <span>Audit Trail</span>
            <AdminCountBadge>{auditLogs.length}</AdminCountBadge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Voucher Line Allocation */}
        <TabsContent value="specification" className="mt-0">
          <div className={cn(
            "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
            isDark
              ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
              : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                )}>
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
              <AdminPill className="font-mono">Voucher #{expense.expense_number}</AdminPill>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { title: "Primary Category", value: expense.category, icon: Tag },
                { title: "Payment Instrument", value: expense.payment_method, icon: CreditCard },
                {
                  title: "Settlement Status",
                  value: (expense.payment_status || "PAID").toUpperCase(),
                  icon: Check,
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3.5 rounded-xl border flex items-start gap-2.5 transition-all shadow-xs",
                      isDark
                        ? "bg-teal/15 border-teal/40 text-white"
                        : "bg-teal/15 border-2 border-navy text-navy"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                      isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                    )}>
                      <Icon className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-navy font-black")}>
                        {item.title}
                      </p>
                      <p className={cn("text-[10px] leading-tight font-medium", isDark ? "text-teal-200/80" : "text-navy/70")}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {expense.receipt_url && (
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between gap-3",
                isDark ? "bg-[#060a22]/70 border-teal/30" : "bg-white border-2 border-navy"
              )}>
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
                    View Receipt
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Related Category Expenses */}
        <TabsContent value="related" className="mt-0">
          <div className={cn(
            "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
            isDark
              ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
              : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                )}>
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
              <AdminPill className="font-mono">{relatedExpenses.length} Records</AdminPill>
            </div>

            <AdminTable
              columns={relatedColumns}
              data={relatedExpenses}
              rowKey={(rel) => rel.id}
              actions={relatedActions}
              emptyIcon={Receipt}
              emptyTitle="No other expenses recorded in this category."
            />
          </div>
        </TabsContent>

        {/* Tab 3: System Audit Trail */}
        <TabsContent value="audit" className="mt-0">
          <div className={cn(
            "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-200 space-y-4",
            isDark
              ? "bg-teal/15 border-teal/40 text-white shadow-[0_0_15px_rgba(64,224,208,0.08)]"
              : "bg-teal/15 border-2 border-navy text-navy shadow-xs"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                  isDark ? "bg-teal text-navy font-black shadow-2xs" : "bg-navy text-white font-black shadow-2xs"
                )}>
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
              <AdminPill className="font-mono">{auditLogs.length} Events</AdminPill>
            </div>

            <AdminTable
              columns={auditColumns}
              data={auditLogs}
              rowKey={(log) => log.id}
              actions={auditActions}
              emptyIcon={Activity}
              emptyTitle="No specific audit entries matched for this expense identifier."
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Related expense row detail */}
      <AdminDetailModal
        open={isRelatedModalOpen}
        onOpenChange={(open) => {
          setIsRelatedModalOpen(open)
          if (!open) setSelectedRelated(null)
        }}
        icon={Receipt}
        title={selectedRelated?.title || (selectedRelated ? `Voucher #${selectedRelated.expense_number}` : "Expense Details")}
        badge={
          selectedRelated ? (
            <AdminStatusBadge status={selectedRelated.status} />
          ) : undefined
        }
        subtitle={
          selectedRelated
            ? `${selectedRelated.category} • ${selectedRelated.vendor_name || "Internal disbursement"}`
            : undefined
        }
        sections={relatedDetailSections}
        headerActions={
          selectedRelated ? (
            <Link
              href={`/admin/expenses/${selectedRelated.id}`}
              className="bg-teal hover:bg-teal-400 text-navy font-bold rounded-xl shadow-sm flex items-center gap-1.5 h-9 px-3.5 text-xs transition-all active:scale-95"
            >
              Open Voucher
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />

      {/* Audit ledger row detail */}
      <AdminDetailModal
        open={isAuditModalOpen}
        onOpenChange={(open) => {
          setIsAuditModalOpen(open)
          if (!open) setSelectedAudit(null)
        }}
        icon={Activity}
        title={selectedAudit?.record_number || (selectedAudit ? `Record ${selectedAudit.record_id.slice(0, 10)}` : "Audit Entry")}
        badge={selectedAudit ? <AdminTag className="uppercase">{selectedAudit.action}</AdminTag> : undefined}
        subtitle={selectedAudit ? `${selectedAudit.module} • ${new Date(selectedAudit.created_at).toLocaleString()}` : undefined}
        sections={auditDetailSections}
        size="xl"
      />

      {/* Status edit */}
      <AdminFormModal
        open={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        icon={DollarSign}
        title="Update Expense Status"
        description="Transition this voucher through the approval and settlement workflow."
        onSubmit={handleStatusSubmit}
        isSubmitting={isUpdatingStatus}
        isEdit
        editLabel="Update Status"
      >
        <AdminFormGrid>
          <AdminFormField label="Voucher Status" required>
            <AdminSelect
              value={statusDraft}
              onValueChange={(val) => setStatusDraft(val as ExpenseStatus)}
              options={EXPENSE_STATUS_OPTIONS}
            />
          </AdminFormField>
          <AdminFormField label="Current Status" hint="Shown for reference only">
            <AdminStatusBadge status={expense.status} />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* Destructive status confirmation */}
      <AdminConfirmDialog
        open={isRejectConfirmOpen}
        onOpenChange={setIsRejectConfirmOpen}
        title="Reject this expense voucher?"
        description={`Voucher #${expense.expense_number} will be marked as rejected. This status change is recorded in the audit trail.`}
        confirmLabel="Reject Voucher"
        onConfirm={confirmReject}
        isSubmitting={isUpdatingStatus}
      />
    </div>
  )
}
