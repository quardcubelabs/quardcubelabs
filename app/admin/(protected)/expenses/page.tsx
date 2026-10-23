"use client"

import React, { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  TrendingUp,
  Tag,
  CreditCard,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  ChevronDown,
  Eye,
  Trash2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getExpenses, createExpense, updateExpenseStatus, deleteExpense } from "@/lib/expense-actions"
import { getSuppliers } from "@/lib/supplier-actions"
import type { Expense, Supplier } from "@/lib/erp/types"

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
  "Other"
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
    "Other": "Other"
  }
  return map[cat] || cat
}

const abbreviatePaymentMethod = (method?: string) => {
  if (!method) return "—"
  if (method.includes("Bank")) return "Bank"
  if (method.includes("Mobile")) return "Mobile"
  if (method.includes("Credit") || method.includes("Card")) return "Card"
  if (method.includes("Cash")) return "Cash"
  if (method.includes("Cheque")) return "Cheque"
  return method
}

export default function ExpensesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [isPending, startTransition] = useTransition()

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
    expense_date: new Date().toISOString().split("T")[0]
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [expData, supData] = await Promise.all([
        getExpenses(),
        getSuppliers()
      ])
      setExpenses(expData)
      setSuppliers(supData)
    } catch (err) {
      console.error("Failed to load expenses data:", err)
      toast({
        title: "Error Loading Expenses",
        description: "Could not fetch expense records.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleVendorSelect = (vendorId: string) => {
    const sup = suppliers.find(s => s.id === vendorId)
    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      vendor_name: sup ? sup.name : ""
    }))
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount) {
      toast({
        title: "Missing Fields",
        description: "Please enter an expense title and valid amount.",
        variant: "destructive"
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
        expenseDate: formData.expense_date
      })

      if (res?.id) {
        toast({
          title: "Expense Recorded",
          description: `Successfully logged expense #${res.expense_number}.`
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
          expense_date: new Date().toISOString().split("T")[0]
        })
        loadData()
      } else {
        toast({
          title: "Save Failed",
          description: "Could not record expense.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({
        title: "Error Recording Expense",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: "approved" | "rejected" | "draft" | "submitted" | "paid") => {
    startTransition(async () => {
      await updateExpenseStatus(id, status as any)
      toast({
        title: "Status Updated",
        description: `Expense status changed to "${status}".`
      })
      loadData()
    })
  }

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
        setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id))
        setExpenseToDelete(null)
      } else {
        toast({
          title: "Delete Failed",
          description: "Could not remove this expense record.",
          variant: "destructive"
        })
      }
    } catch (err: any) {
      toast({
        title: "Delete Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Filtered expenses
  const filtered = expenses.filter(e => {
    const titleOrDesc = (e.title || e.description || "").toLowerCase()
    const matchesSearch =
      titleOrDesc.includes(searchTerm.toLowerCase()) ||
      (e.expense_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.vendor_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "ALL" || e.category === selectedCategory
    const matchesStatus = selectedStatus === "ALL" || e.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Metrics
  const totalExpenditure = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const paidExpenditure = expenses
    .filter(e => (e.payment_status || "paid") === "paid" || e.status === "paid")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const unpaidExpenditure = expenses
    .filter(e => e.payment_status === "unpaid" || e.payment_status === "partial")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const pendingApprovals = expenses.filter(e => e.status === "submitted" || e.status === "draft").length

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

  if (loading) return <AdminLoading />

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header Card in Teal */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
                Expense <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Management</span>
              </h1>
              <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                Track operational expenses, vendor bills, cost categories, and outflow telemetry
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 shrink-0 ml-auto">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Record Expense
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Total Expenses",
            value: formatStatCurrency(totalExpenditure),
            icon: DollarSign,
          },
          {
            title: "Settled & Paid",
            value: formatStatCurrency(paidExpenditure),
            icon: CheckCircle2,
          },
          {
            title: "Pending / Accrued",
            value: formatStatCurrency(unpaidExpenditure),
            icon: Clock,
          },
          {
            title: "Pending Approvals",
            value: formatStatNumber(pendingApprovals),
            icon: AlertCircle,
          }
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

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-teal-400/80" />
          <Input
            placeholder="Search by expense #, title, category, vendor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={cn(
              "pl-9 h-10 rounded-xl text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-600",
              isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400" : "bg-white text-navy placeholder:text-navy/50"
            )}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className={cn(
              "h-10 rounded-xl text-xs font-bold w-44 border border-slate-300 dark:border-slate-600",
              isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
            )}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className={cn(
              "h-10 rounded-xl text-xs font-bold w-36 border border-slate-300 dark:border-slate-600",
              isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
            )}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadData} variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl border-2 shrink-0", isDark ? "border-slate-700 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50")}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 4. Expenses Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
        isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                <th className="text-left py-3 px-3 md:px-4">
                  <span className="hidden sm:inline">Expense #</span>
                  <span className="sm:hidden">Exp #</span>
                </th>
                <th className="text-left py-3 px-2 md:px-3">
                  <span className="hidden sm:inline">Title / Purpose</span>
                  <span className="sm:hidden">Title</span>
                </th>
                <th className="text-left py-3 px-2 md:px-3">
                  <span className="hidden md:inline">Category</span>
                  <span className="md:hidden">Cat.</span>
                </th>
                <th className="text-left py-3 px-2 md:px-3">
                  <span className="hidden sm:inline">Vendor</span>
                  <span className="sm:hidden">Vend.</span>
                </th>
                <th className="text-left py-3 px-2 md:px-3">Date</th>
                <th className="text-right py-3 px-2 md:px-3">
                  <span className="hidden sm:inline">Amount</span>
                  <span className="sm:hidden">Amt</span>
                </th>
                <th className="text-center py-3 px-2 md:px-3">Status</th>
                <th className="text-right py-3 px-3 md:px-4">Actions</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                    No expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map(exp => (
                  <tr
                    key={exp.id}
                    onClick={() => router.push(`/admin/expenses/${exp.id}`)}
                    className={cn(
                      "border-b transition-colors cursor-pointer group",
                      isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3 px-3 md:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                        )}>
                          <DollarSign className={cn("h-3.5 w-3.5", isDark ? "text-teal" : "text-navy")} />
                        </div>
                        <span className={cn("font-mono font-bold text-xs", isDark ? "text-teal-400" : "text-navy")}>
                          #{exp.expense_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 max-w-[150px] lg:max-w-[200px]">
                      <div 
                        className={cn("font-bold text-xs truncate", isDark ? "text-white" : "text-navy")}
                        title={exp.title || exp.description}
                      >
                        {exp.title || exp.description}
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 whitespace-nowrap">
                      <span 
                        className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", isDark ? "bg-teal/15 text-teal-300 border-teal/30" : "bg-slate-50 text-navy border-navy/20")}
                        title={exp.category}
                      >
                        <Tag className="h-2.5 w-2.5 shrink-0 text-navy/60 dark:text-teal-400/80" />
                        <span className="truncate max-w-[85px]">{abbreviateCategory(exp.category)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 whitespace-nowrap">
                      {exp.vendor_name ? (
                        <span 
                          className={cn("text-xs font-semibold flex items-center gap-1 max-w-[110px] truncate", isDark ? "text-slate-200" : "text-navy")}
                          title={exp.vendor_name}
                        >
                          <Building2 className="h-3 w-3 shrink-0 text-navy/60 dark:text-teal-400/80" />
                          <span className="truncate">{exp.vendor_name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-xs font-semibold whitespace-nowrap font-mono">
                      {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-right font-black font-mono text-xs whitespace-nowrap">
                      TSH {Number(exp.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-2 md:px-3 text-center whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        exp.status === "approved" || exp.status === "paid"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : exp.status === "submitted"
                          ? "bg-teal-500/15 text-teal border border-teal/30"
                          : exp.status === "rejected"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-slate-500/15 text-slate-300 border border-slate-500/30"
                      )}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 md:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <Link href={`/admin/expenses/${exp.id}`}>
                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                            )}
                            title="View Expense Details"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </Link>

                        {(exp.status === "submitted" || exp.status === "draft") && (
                          <>
                            <button
                              onClick={() => handleStatusChange(exp.id, "approved")}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                              )}
                              title="Approve Voucher"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(exp.id, "rejected")}
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                              )}
                              title="Reject Voucher"
                            >
                              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </>
                        )}
                        {exp.status === "approved" && (
                          <button
                            onClick={() => handleStatusChange(exp.id, "paid")}
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-teal-500/20 text-teal-300 hover:bg-teal hover:text-navy" : "bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white"
                            )}
                            title="Mark Settled & Paid"
                          >
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                          )}
                          title="Delete Expense Voucher"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* 5. Record Expense Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className={cn(
          "rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border", isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40")}>
                <DollarSign className={cn("h-4 w-4", isDark ? "text-teal" : "text-navy")} />
              </div>
              Record Business Expense
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Log operational disbursements, utility bills, software subscriptions, and tax expenses.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
            <div className={cn(
              "p-4 sm:p-5 rounded-2xl space-y-4 shadow-sm",
              isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
            )}>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Expense Title / Purpose *
                </Label>
                <Input
                  required
                  placeholder="e.g. AWS Cloud Hosting - Sept 2026"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Expense Date *
                  </Label>
                  <Input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                    className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Total Amount (TZS) *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Currency
                  </Label>
                  <Select value={formData.currency} onValueChange={val => setFormData({ ...formData, currency: val })}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TZS">TZS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Associated Vendor / Supplier
                  </Label>
                  <Select value={formData.vendor_id || "none"} onValueChange={val => handleVendorSelect(val === "none" ? "" : val)}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue placeholder="Select vendor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Supplier Linked --</SelectItem>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Payment Method
                  </Label>
                  <Select value={formData.payment_method} onValueChange={val => setFormData({ ...formData, payment_method: val })}>
                    <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Notes & Reference
                </Label>
                <Input
                  placeholder="Invoice reference, authorization memo, or transaction ID..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2", isDark ? "bg-[#060a22]/80 border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="h-11 rounded-xl px-5 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
              >
                {isSubmitting ? "Recording..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation Dialog */}
      <Dialog open={!!expenseToDelete} onOpenChange={open => !open && setExpenseToDelete(null)}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Confirm Delete Expense Voucher
            </DialogTitle>
            <DialogDescription className={cn("text-xs pt-1", isDark ? "text-slate-300" : "text-navy/70")}>
              Are you sure you want to permanently delete Expense Voucher #{expenseToDelete?.expense_number}? This financial record cannot be recovered.
            </DialogDescription>
          </DialogHeader>

          {expenseToDelete && (
            <div className={cn(
              "p-3.5 rounded-2xl space-y-1.5 text-xs shadow-xs",
              isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
            )}>
              <div className="font-bold">{expenseToDelete.title || expenseToDelete.description}</div>
              <div className="text-[11px] opacity-80">Category: {expenseToDelete.category} • Date: {expenseToDelete.expense_date}</div>
              <div className="font-mono font-black text-sm">TZS {Number(expenseToDelete.amount || 0).toLocaleString()}</div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpenseToDelete(null)}
              className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteExpense}
              className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
