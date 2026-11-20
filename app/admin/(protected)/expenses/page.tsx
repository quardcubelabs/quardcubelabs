"use client"

import { useState, useEffect, useTransition, type FormEvent } from "react"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminConfirmDialog,
  AdminDetailModal,
  AdminFilterBar,
  AdminFormField,
  AdminFormGrid,
  AdminFormModal,
  AdminInput,
  AdminMutedText,
  AdminPageHeader,
  AdminPill,
  AdminPrimaryCell,
  AdminSelect,
  AdminStats,
  AdminStatusBadge,
  AdminTable,
  AdminTextarea,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/ui"
import { getExpenses, createExpense, updateExpenseStatus, deleteExpense } from "@/lib/expense-actions"
import { getSuppliers } from "@/lib/supplier-actions"
import type { Expense, Supplier } from "@/lib/erp/types"
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  Eye,
  Trash2,
  ExternalLink,
  Tag,
} from "lucide-react"

const CATEGORIES = [
  "Office Supplies",
  "Software & Subscriptions",
  "Utilities & Rent",
  "Salaries & Wages",
  "Logistics & Freight",
  "Marketing & Advertising",
  "Travel & Entertainment",
  "Equipment & Hardware",
  "Professional Services",
  "Taxes & Regulatory",
  "Maintenance & Repairs",
  "Other",
]

const PAYMENT_METHODS = ["Bank Transfer", "Credit Card", "Cash", "Mobile Money", "Cheque", "Other"]

const abbreviateCategory = (cat: string) => {
  const map: Record<string, string> = {
    "Office Supplies": "Supplies",
    "Software & Subscriptions": "Software",
    "Utilities & Rent": "Utilities",
    "Salaries & Wages": "Salaries",
    "Logistics & Freight": "Logistics",
    "Marketing & Advertising": "Marketing",
    "Travel & Entertainment": "Travel",
    "Equipment & Hardware": "Hardware",
    "Professional Services": "Prof. Serv.",
    "Taxes & Regulatory": "Taxes",
    "Maintenance & Repairs": "Maint.",
    Other: "Other",
  }
  return map[cat] || cat
}

const abbreviatePaymentMethod = (method?: string) => {
  if (!method) return "â€”"
  if (method.includes("Bank")) return "Bank"
  if (method.includes("Mobile")) return "Mobile"
  if (method.includes("Credit") || method.includes("Card")) return "Card"
  if (method.includes("Cash")) return "Cash"
  if (method.includes("Cheque")) return "Cheque"
  return method
}

type ExpenseStatusChange = "approved" | "rejected" | "paid"

export default function ExpensesPage() {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "Software & Subscriptions",
    amount: "",
    currency: "TZS",
    tax_amount: "",
    payment_method: "Bank Transfer",
    payment_status: "paid" as "paid" | "unpaid" | "partial",
    vendor_id: "",
    vendor_name: "",
    notes: "",
    expense_date: new Date().toISOString().split("T")[0],
  })

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [statusChange, setStatusChange] = useState<{
    expense: Expense
    status: ExpenseStatusChange
  } | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [expData, supData] = await Promise.all([getExpenses(), getSuppliers()])
      setExpenses(expData)
      setSuppliers(supData)
    } catch (err) {
      console.error("Failed to load expenses data:", err)
      toast({
        title: "Error Loading Expenses",
        description: "Could not fetch expense records.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVendorSelect = (vendorId: string) => {
    const sup = suppliers.find((s) => s.id === vendorId)
    setFormData((prev) => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: sup ? sup.name : "",
    }))
  }

  const handleCreateExpense = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!formData.title || !formData.amount) {
      toast({
        title: "Missing Fields",
        description: "Please enter an expense title and valid amount.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createExpense({
        category: (formData.category || "Software & Cloud Services") as any,
        amount: parseFloat(formData.amount),
        taxAmount: formData.tax_amount ? parseFloat(formData.tax_amount) : 0,
        paymentMethod: formData.payment_method,
        vendorName: formData.vendor_name || undefined,
        description: formData.title + (formData.notes ? ` - ${formData.notes}` : ""),
        expenseDate: formData.expense_date,
      })

      if (res?.id) {
        toast({
          title: "Expense Recorded",
          description: `Successfully logged expense #${res.expense_number}.`,
        })
        setShowAddModal(false)
        setFormData({
          title: "",
          category: "Software & Subscriptions",
          amount: "",
          currency: "TZS",
          tax_amount: "",
          payment_method: "Bank Transfer",
          payment_status: "paid",
          vendor_id: "",
          vendor_name: "",
          notes: "",
          expense_date: new Date().toISOString().split("T")[0],
        })
        loadData()
      } else {
        toast({
          title: "Save Failed",
          description: "Could not record expense.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error Recording Expense",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmStatusChange = async () => {
    if (!statusChange) return
    const { expense, status } = statusChange

    startTransition(async () => {
      try {
        await updateExpenseStatus(expense.id, status as any)
        toast({
          title: "Status Updated",
          description: `Expense status changed to "${status}".`,
        })
        setStatusChange(null)
        loadData()
      } catch (err: any) {
        toast({
          title: "Status Update Failed",
          description: err.message || "Could not update expense status.",
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return
    setIsDeleting(true)
    try {
      const ok = await deleteExpense(expenseToDelete.id)
      if (ok) {
        toast({
          title: "Expense Voucher Deleted",
          description: `Voucher #${expenseToDelete.expense_number} was permanently removed.`,
        })
        setExpenses((prev) => prev.filter((e) => e.id !== expenseToDelete.id))
        setExpenseToDelete(null)
      } else {
        toast({
          title: "Delete Failed",
          description: "Could not remove this expense record.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Delete Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered expenses
  const filtered = expenses.filter((e) => {
    const titleOrDesc = (e.title || e.description || "").toLowerCase()
    const matchesSearch =
      titleOrDesc.includes(searchTerm.toLowerCase()) ||
      (e.expense_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.vendor_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || e.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Metrics
  const totalExpenditure = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const paidExpenditure = expenses
    .filter((e) => (e.payment_status || "paid") === "paid" || e.status === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const unpaidExpenditure = expenses
    .filter((e) => e.payment_status === "unpaid" || e.payment_status === "partial")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const pendingApprovals = expenses.filter((e) => e.status === "submitted" || e.status === "draft").length

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  const columns: AdminTableColumn<Expense>[] = [
    {
      key: "expense_number",
      header: "Expense #",
      render: (exp) => (
        <AdminPrimaryCell icon={DollarSign} title={`#${exp.expense_number}`} subtitle={exp.expense_date} />
      ),
    },
    {
      key: "title",
      header: "Title / Purpose",
      render: (exp) => (
        <span className="block max-w-[100px] truncate font-bold sm:max-w-[150px] lg:max-w-[200px]">
          {exp.title || exp.description}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      hidden: "md",
      render: (exp) => (
        <AdminPill title={exp.category}>
          <span className="inline-flex items-center gap-1">
            <Tag className="h-2.5 w-2.5 shrink-0" />
            {abbreviateCategory(exp.category)}
          </span>
        </AdminPill>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      hidden: "sm",
      render: (exp) =>
        exp.vendor_name ? (
          <AdminMutedText className="flex max-w-[110px] items-center gap-1 font-bold">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{exp.vendor_name}</span>
          </AdminMutedText>
        ) : (
          <AdminMutedText>â€”</AdminMutedText>
        ),
    },
    {
      key: "expense_date",
      header: "Date",
      hidden: "md",
      render: (exp) =>
        exp.expense_date ? (
          <AdminMutedText className="font-mono">
            {new Date(exp.expense_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </AdminMutedText>
        ) : (
          <AdminMutedText>â€”</AdminMutedText>
        ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (exp) => (
        <span className="whitespace-nowrap font-mono font-black">
          TSH {Number(exp.amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (exp) => <AdminStatusBadge status={exp.status} />,
    },
  ]

  const actions: AdminTableAction<Expense>[] = [
    {
      key: "view",
      label: "View Expense Details",
      icon: Eye,
      variant: "view",
      onClick: (exp) => {
        setSelectedExpense(exp)
        setIsViewOpen(true)
      },
    },
    {
      key: "open",
      label: "Open Expense Voucher",
      icon: ExternalLink,
      variant: "soft",
      href: (exp) => `/admin/expenses/${exp.id}`,
      mobile: false,
    },
    {
      key: "approve",
      label: "Approve Voucher",
      icon: CheckCircle2,
      variant: "soft",
      hide: (exp) => exp.status !== "submitted" && exp.status !== "draft",
      mobile: false,
      onClick: (exp) => setStatusChange({ expense: exp, status: "approved" }),
    },
    {
      key: "reject",
      label: "Reject Voucher",
      icon: AlertCircle,
      variant: "danger-soft",
      hide: (exp) => exp.status !== "submitted" && exp.status !== "draft",
      mobile: false,
      onClick: (exp) => setStatusChange({ expense: exp, status: "rejected" }),
    },
    {
      key: "pay",
      label: "Mark Settled & Paid",
      icon: CreditCard,
      variant: "soft",
      hide: (exp) => exp.status !== "approved",
      mobile: false,
      onClick: (exp) => setStatusChange({ expense: exp, status: "paid" }),
    },
    {
      key: "delete",
      label: "Delete Expense Voucher",
      icon: Trash2,
      variant: "danger-soft",
      mobile: false,
      onClick: (exp) => setExpenseToDelete(exp),
    },
  ]

  if (loading) return <AdminLoading />

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Expense"
        accent="Management"
        subtitle="Track operational expenses, vendor bills, cost categories, and outflow telemetry"
        icon={CreditCard}
        onRefresh={loadData}
        onAdd={() => setShowAddModal(true)}
        addLabel="Record Expense"
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Expenses", value: formatStatCurrency(totalExpenditure), icon: DollarSign },
          { title: "Settled & Paid", value: formatStatCurrency(paidExpenditure), icon: CheckCircle2 },
          { title: "Pending / Accrued", value: formatStatCurrency(unpaidExpenditure), icon: Clock },
          { title: "Pending Approvals", value: formatStatNumber(pendingApprovals), icon: AlertCircle },
        ]}
      />

      <AdminFilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by expense #, title, category, vendor..."
        selects={[
          {
            value: selectedCategory,
            onValueChange: setSelectedCategory,
            placeholder: "All Categories",
            allLabel: "All Categories",
            options: CATEGORIES.map((c) => ({ value: c, label: c })),
          },
          {
            value: selectedStatus,
            onValueChange: setSelectedStatus,
            placeholder: "All Statuses",
            allLabel: "All Statuses",
            options: [
              { value: "approved", label: "Approved" },
              { value: "paid", label: "Paid" },
              { value: "submitted", label: "Submitted" },
              { value: "draft", label: "Draft" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(exp) => exp.id}
        actions={actions}
        emptyIcon={DollarSign}
        emptyTitle="No expense records found"
        emptyDescription="Try adjusting your filters or search keyword"
      />

      {/* DETAIL MODAL */}
      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={FileText}
        title={selectedExpense?.title || selectedExpense?.description || "Expense Details"}
        subtitle={`#${selectedExpense?.expense_number || ""}`}
        badge={selectedExpense ? <AdminStatusBadge status={selectedExpense.status} /> : undefined}
        size="lg"
        sections={[
          {
            key: "financial",
            title: "Financial Details",
            icon: DollarSign,
            fields: [
              {
                label: "Amount",
                value: `TSH ${Number(selectedExpense?.amount || 0).toLocaleString()}`,
              },
              {
                label: "Tax Amount",
                value: `TSH ${Number(selectedExpense?.tax_amount || 0).toLocaleString()}`,
              },
              { label: "Currency", value: selectedExpense?.currency || "TZS" },
              { label: "Payment Status", value: selectedExpense?.payment_status || "â€”" },
              {
                label: "Payment Method",
                value: abbreviatePaymentMethod(selectedExpense?.payment_method),
              },
              { label: "Payment Reference", value: selectedExpense?.payment_reference || "â€”" },
            ],
          },
          {
            key: "classification",
            title: "Classification",
            icon: Tag,
            fields: [
              { label: "Category", value: selectedExpense?.category || "â€”" },
              { label: "Vendor", value: selectedExpense?.vendor_name || "â€”" },
              { label: "Expense Date", value: selectedExpense?.expense_date || "â€”" },
              { label: "Recorded By", value: selectedExpense?.recorded_by || "â€”" },
              { label: "Billable", value: selectedExpense?.is_billable ? "Yes" : "No" },
              { label: "Customer", value: selectedExpense?.customer_name || "â€”" },
            ],
          },
          ...(selectedExpense?.notes
            ? [
                {
                  key: "notes",
                  title: "Notes & Reference",
                  icon: Calendar,
                  span: 3 as const,
                  content: <p className="text-xs leading-relaxed opacity-90">{selectedExpense.notes}</p>,
                },
              ]
            : []),
        ]}
        footerActions={
          <a
            href={`/admin/expenses/${selectedExpense?.id || ""}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-navy px-5 text-xs font-bold text-white hover:bg-navy/90"
          >
            <ExternalLink className="h-4 w-4" /> Open Voucher
          </a>
        }
        onDelete={
          selectedExpense
            ? () => {
                setIsViewOpen(false)
                setExpenseToDelete(selectedExpense)
              }
            : undefined
        }
        deleteLabel="Delete Voucher"
      />

      {/* RECORD EXPENSE MODAL */}
      <AdminFormModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        icon={DollarSign}
        title="Record Business Expense"
        description="Log operational disbursements, utility bills, software subscriptions, and tax expenses."
        onSubmit={handleCreateExpense}
        isSubmitting={isSubmitting}
        size="lg"
        createLabel="Save Expense"
      >
        <AdminFormField label="Expense Title / Purpose" required>
          <AdminInput
            required
            placeholder="e.g. AWS Cloud Hosting - Sept 2026"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </AdminFormField>

        <AdminFormGrid>
          <AdminFormField label="Category" required>
            <AdminSelect
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </AdminFormField>
          <AdminFormField label="Expense Date" required>
            <AdminInput
              type="date"
              required
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Total Amount (TZS)" required>
            <AdminInput
              monospace
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Tax Amount (TZS)">
            <AdminInput
              monospace
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.tax_amount}
              onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Currency">
            <AdminSelect
              value={formData.currency}
              onValueChange={(val) => setFormData({ ...formData, currency: val })}
              options={[
                { value: "TZS", label: "TZS" },
                { value: "USD", label: "USD" },
                { value: "EUR", label: "EUR" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Payment Method">
            <AdminSelect
              value={formData.payment_method}
              onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            />
          </AdminFormField>
          <AdminFormField label="Associated Vendor / Supplier">
            <AdminSelect
              value={formData.vendor_id || "none"}
              onValueChange={(val) => handleVendorSelect(val === "none" ? "" : val)}
              placeholder="Select vendor (optional)"
              options={[
                { value: "none", label: "-- No Supplier Linked --" },
                ...suppliers.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Notes & Reference">
          <AdminTextarea
            placeholder="Invoice reference, authorization memo, or transaction ID..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </AdminFormField>
      </AdminFormModal>

      {/* STATUS CHANGE CONFIRMATION */}
      <AdminConfirmDialog
        open={!!statusChange}
        onOpenChange={(open) => !open && setStatusChange(null)}
        title={`${statusChange?.status === "approved" ? "Approve" : statusChange?.status === "rejected" ? "Reject" : "Mark as Paid"} Expense Voucher`}
        description={`Change voucher #${statusChange?.expense.expense_number} status to "${statusChange?.status}"?`}
        confirmLabel={
          statusChange?.status === "approved"
            ? "Approve Voucher"
            : statusChange?.status === "rejected"
              ? "Reject Voucher"
              : "Mark as Paid"
        }
        destructive={statusChange?.status === "rejected"}
        isSubmitting={isPending}
        onConfirm={handleConfirmStatusChange}
      />

      {/* DELETE EXPENSE CONFIRMATION */}
      <AdminConfirmDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        title="Confirm Delete Expense Voucher"
        description={`Are you sure you want to permanently delete Expense Voucher #${expenseToDelete?.expense_number}? This financial record cannot be recovered.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete Permanently"}
        isSubmitting={isDeleting}
        onConfirm={handleDeleteExpense}
      />
    </div>
  )
}
