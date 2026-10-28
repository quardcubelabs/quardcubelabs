"use client"

import { useState, useEffect } from "react"
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
import { getSupplierBills, createSupplierBill, recordBillPayment } from "@/lib/supplier-bill-actions"
import { SupplierBill, SupplierBillItem } from "@/lib/erp/accounting-types"
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowRight,
  DollarSign,
  Receipt,
  Eye,
  Layers,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  CheckCircle
} from "lucide-react"

export default function SupplierBillsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [bills, setBills] = useState<SupplierBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // View Bill Modal
  const [selectedViewBill, setSelectedViewBill] = useState<SupplierBill | null>(null)

  // Create Bill Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplierName, setSupplierName] = useState("Hikvision East Africa Logistics")
  const [supplierEmail, setSupplierEmail] = useState("sales.ea@hikvision.com")
  const [poNumber, setPoNumber] = useState("QCL-PO-2026-1002")
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0])
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<SupplierBillItem[]>([
    { product_id: 1, name: "Hikvision 4K AcuSense ColorVu IP Dome Camera", quantity: 5, unit_cost: 285000, total_cost: 1425000 }
  ])

  // Payment Record Modal
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState("CRDB Bank Transfer")
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getSupplierBills()
      setBills(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load supplier bills.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addItemRow = () => {
    setItems([
      ...items,
      { product_id: Date.now(), name: "Surveillance / Network Accessory", quantity: 1, unit_cost: 50000, total_cost: 50000 }
    ])
  }

  const updateItemRow = (idx: number, field: "name" | "quantity" | "unit_cost", val: any) => {
    const updated = [...items]
    if (field === "name") {
      updated[idx].name = val
    } else if (field === "quantity") {
      updated[idx].quantity = Number(val) || 1
      updated[idx].total_cost = updated[idx].quantity * updated[idx].unit_cost
    } else if (field === "unit_cost") {
      updated[idx].unit_cost = Number(val) || 0
      updated[idx].total_cost = updated[idx].quantity * updated[idx].unit_cost
    }
    setItems(updated)
  }

  const subtotal = items.reduce((s, i) => s + i.total_cost, 0)
  const taxAmount = Math.round(subtotal * 0.18) // TRA VAT 18%
  const total = subtotal + taxAmount

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierName) {
      toast({ title: "Validation Error", description: "Supplier name is required.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await createSupplierBill({
        po_number: poNumber || undefined,
        supplier_id: `sup-${Date.now()}`,
        supplier_name: supplierName,
        supplier_email: supplierEmail,
        bill_date: billDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        items,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: 0,
        discount_amount: 0,
        total,
        amount_paid: 0,
        balance_due: total,
        status: "open",
        notes,
        created_by: "Administrator"
      })

      toast({ title: "Supplier Bill Created", description: `Recognized liability for ${supplierName}.` })
      setIsCreateOpen(false)
      loadData()
    } catch {
      toast({ title: "Error", description: "Failed to create supplier bill.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenPayment = (bill: SupplierBill) => {
    setSelectedBill(bill)
    setPaymentAmount(bill.balance_due)
    setIsPaymentOpen(true)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBill) return
    if (paymentAmount <= 0 || paymentAmount > selectedBill.balance_due) {
      toast({ title: "Invalid Amount", description: "Payment amount must be between 1 and the balance due.", variant: "destructive" })
      return
    }

    setIsPaymentSubmitting(true)
    try {
      await recordBillPayment(selectedBill.id, paymentAmount, paymentMethod)
      toast({ title: "Payment Recorded", description: `TZS ${paymentAmount.toLocaleString()} paid towards bill ${selectedBill.bill_number}.` })
      setIsPaymentOpen(false)
      loadData()
    } catch {
      toast({ title: "Payment Error", description: "Failed to record bill payment.", variant: "destructive" })
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const filteredBills = bills.filter(b => {
    const matchesSearch =
      b.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.po_number && b.po_number.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Metrics
  const totalBillsVolume = bills.reduce((s, b) => s + b.total, 0)
  const totalBalanceDue = bills.reduce((s, b) => s + b.balance_due, 0)
  const totalPaidVolume = bills.reduce((s, b) => s + b.amount_paid, 0)

  if (isLoading && bills.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={cn(
          "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
          isDark
            ? "bg-[#0a1033] border-none text-white shadow-none"
            : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <Receipt className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Supplier Bills &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Payables
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Vendor invoice tracking, purchase order settlement, and trade liability management
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Create Supplier Bill</span>
              <span className="sm:hidden">Create Bill</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Liabilities", value: `TZS ${totalBillsVolume.toLocaleString()}`, icon: Receipt, color: "text-blue-500", sub: `${bills.length} vendor invoices` },
          { title: "Outstanding Balance", value: `TZS ${totalBalanceDue.toLocaleString()}`, icon: Clock, color: "text-amber-500", sub: "Unsettled payables" },
          { title: "Disbursed Payments", value: `TZS ${totalPaidVolume.toLocaleString()}`, icon: CheckCircle2, color: "text-emerald-500", sub: "Settled via Bank/Till" },
          { title: "Settlement Rate", value: totalBillsVolume > 0 ? `${Math.round((totalPaidVolume / totalBillsVolume) * 100)}%` : "100%", icon: ShieldCheck, color: "text-teal-500", sub: "Disbursement ratio" }
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
            <CardContent className="p-3 sm:p-4.5 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-xs sm:text-sm lg:text-base font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
                <p className={cn("text-[10px] font-medium mt-0.5 sm:mt-1 truncate opacity-70", isDark ? "text-slate-300" : "text-navy/60")}>
                  {stat.sub}
                </p>
              </div>
              <div
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}
              >
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search */}
      <Card
        className={cn(
          "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Bills", icon: Layers, count: bills.length },
            { key: "open", label: "Open (Unpaid)", icon: Clock, count: bills.filter(b => b.status === "open").length },
            { key: "partially_paid", label: "Partially Paid", icon: AlertTriangle, count: bills.filter(b => b.status === "partially_paid").length },
            { key: "paid", label: "Fully Settled", icon: CheckCircle, count: bills.filter(b => b.status === "paid").length },
            { key: "overdue", label: "Overdue", icon: XCircle, count: bills.filter(b => b.status === "overdue").length }
          ].map((tab) => {
            const isSelected = statusFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-navy text-white shadow-md"
                    : isDark 
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                      : "text-navy/70 hover:bg-teal-50 hover:text-navy"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
                <span>{tab.label}</span>
                <span className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  isSelected 
                    ? "bg-white/20 text-white"
                    : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search bill number, vendor, PO number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500 focus-visible:ring-teal/30"
                  : "bg-white border-navy/20 text-navy placeholder:text-navy/40 focus-visible:ring-navy/20"
              )}
            />
          </div>
        </div>
      </Card>

      {/* Bills Table */}
      <Card
        className={cn(
          "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
          isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">Bill # & Vendor</th>
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white hidden md:table-cell">PO Reference</th>
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white hidden sm:table-cell">Dates</th>
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Total Volume</th>
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Balance Due</th>
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15 text-xs sm:text-sm">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No supplier bills found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search keyword</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr
                    key={bill.id}
                    className={cn(
                      "transition-colors duration-150",
                      isDark
                        ? "hover:bg-teal/30 hover:text-white"
                        : "hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={cn(
                            "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                          )}
                        >
                          <Receipt className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-xs text-teal">{bill.bill_number}</p>
                          <p className={cn("font-bold text-xs truncate max-w-[140px] sm:max-w-[200px]", isDark ? "text-white" : "text-navy")} title={bill.supplier_name}>
                            {bill.supplier_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-mono text-xs opacity-75 hidden md:table-cell">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-semibold",
                        isDark ? "bg-white/5 text-slate-300" : "bg-navy/5 text-navy"
                      )}>
                        {bill.po_number || "Direct"}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-xs hidden sm:table-cell">
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] block">{bill.bill_date}</span>
                        <span className="text-[10px] opacity-70 font-mono block">Due: {bill.due_date}</span>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-mono font-black text-xs sm:text-sm">
                      TZS {bill.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-mono font-black text-xs sm:text-sm text-amber-500">
                      TZS {bill.balance_due.toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] sm:text-xs capitalize font-bold border rounded-lg px-2.5 py-0.5 whitespace-nowrap",
                          bill.status === "paid" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                          bill.status === "partially_paid" && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                          bill.status === "open" && "border-blue-500/30 text-blue-600 bg-blue-500/10",
                          bill.status === "overdue" && "border-rose-500/30 text-rose-600 bg-rose-500/10"
                        )}
                      >
                        {bill.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedViewBill(bill)}
                          className={cn(
                            "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark
                              ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy"
                              : "bg-navy text-white hover:bg-navy/90"
                          )}
                          title="View Bill Details"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        {bill.balance_due > 0 ? (
                          <button
                            onClick={() => handleOpenPayment(bill)}
                            className={cn(
                              "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark
                                ? "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                : "border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                            )}
                            title="Disburse Payment"
                          >
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        ) : (
                          <span className="p-1 sm:p-2 inline-flex items-center justify-center text-emerald-500" title="Fully Settled">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Bill Details Modal */}
      <Dialog open={!!selectedViewBill} onOpenChange={(open) => !open && setSelectedViewBill(null)}>
        <DialogContent className={cn("max-w-3xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedViewBill && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedViewBill.bill_number}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {selectedViewBill.supplier_name}
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      PO Ref: <span className="font-bold">{selectedViewBill.po_number || "Direct"}</span> • Bill Date: <span className="font-bold">{selectedViewBill.bill_date}</span> • Due Date: <span className="font-bold">{selectedViewBill.due_date}</span>
                    </p>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "text-xs capitalize font-bold rounded-lg px-3 py-1",
                    selectedViewBill.status === "paid" && "bg-emerald-500 text-white",
                    selectedViewBill.status === "partially_paid" && "bg-amber-500 text-white",
                    selectedViewBill.status === "open" && "bg-blue-500 text-white",
                    selectedViewBill.status === "overdue" && "bg-rose-500 text-white"
                  )}
                >
                  {selectedViewBill.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Financial Balance Banner */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Total Bill Amount</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5">
                    TZS {selectedViewBill.total.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Outstanding Balance Due</span>
                  <div className="font-mono font-black text-xl sm:text-2xl text-amber-500 mt-0.5">
                    TZS {selectedViewBill.balance_due.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider opacity-80">Purchased Line Items ({selectedViewBill.items.length})</h3>
                <div className="overflow-x-auto rounded-xl border border-navy/20 dark:border-teal/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-navy/20 bg-slate-100 dark:bg-slate-900/60 font-black uppercase tracking-wider text-[11px] text-navy dark:text-teal-300">
                        <th className="px-3.5 py-2.5">Item Description</th>
                        <th className="px-3.5 py-2.5 text-center">Qty</th>
                        <th className="px-3.5 py-2.5 text-right">Unit Cost (TZS)</th>
                        <th className="px-3.5 py-2.5 text-right">Total Cost (TZS)</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      {selectedViewBill.items.map((item, idx) => (
                        <tr key={idx} className={isDark ? "hover:bg-teal/10" : "hover:bg-teal-50/50"}>
                          <td className="px-3.5 py-2.5 font-bold">{item.name}</td>
                          <td className="px-3.5 py-2.5 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono">{item.unit_cost.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-black text-teal">
                            {item.total_cost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedViewBill(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
                {selectedViewBill.balance_due > 0 && (
                  <Button
                    onClick={() => {
                      const bill = selectedViewBill
                      setSelectedViewBill(null)
                      handleOpenPayment(bill)
                    }}
                    className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    Pay Bill Now
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Supplier Bill Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Create Supplier Bill (Accounts Payable)
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Record official supplier liability and auto-post Inventory &amp; Accounts Payable GL journals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBill} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="supName" className="text-xs font-bold uppercase tracking-wider">Supplier / Vendor Name *</Label>
                <Input
                  id="supName"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supEmail" className="text-xs font-bold uppercase tracking-wider">Supplier Email</Label>
                <Input
                  id="supEmail"
                  type="email"
                  value={supplierEmail}
                  onChange={e => setSupplierEmail(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="poNum" className="text-xs font-bold uppercase tracking-wider">Purchase Order Ref</Label>
                <Input
                  id="poNum"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bDate" className="text-xs font-bold uppercase tracking-wider">Bill Date *</Label>
                <Input
                  id="bDate"
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dDate" className="text-xs font-bold uppercase tracking-wider">Due Date *</Label>
                <Input
                  id="dDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-wider">Purchased Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className={cn("rounded-xl h-8 text-xs font-bold border", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className={cn("flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/20")}>
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Item name / description"
                        value={item.name}
                        onChange={e => updateItemRow(idx, "name", e.target.value)}
                        className={cn("h-9 text-xs font-medium rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItemRow(idx, "quantity", e.target.value)}
                          className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                        />
                      </div>
                      <div className="flex-1 sm:w-32">
                        <Input
                          type="number"
                          placeholder="Unit Cost TZS"
                          value={item.unit_cost}
                          onChange={e => updateItemRow(idx, "unit_cost", e.target.value)}
                          className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                        />
                      </div>
                      <div className="w-24 sm:w-28 text-right font-mono text-xs font-black text-teal shrink-0">
                        TZS {item.total_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary totals */}
              <div className={cn("p-3 rounded-xl border space-y-1.5 text-xs font-medium", isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/20")}>
                <div className="flex justify-between">
                  <span className="opacity-70">Subtotal:</span>
                  <span className="font-mono font-bold">TZS {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">TRA VAT (18%):</span>
                  <span className="font-mono font-bold">TZS {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-navy/10 dark:border-teal/20 text-teal">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono">TZS {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              >
                {isSubmitting ? "Creating..." : "Post Supplier Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Disburse Supplier Payment
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Clears trade accounts payable and credits corporate bank/cash.
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <form onSubmit={handleRecordPayment} className="space-y-4 pt-1">
              <div className={cn("p-3.5 rounded-xl border text-sm space-y-1.5", isDark ? "bg-[#080d2a] border-teal/30" : "bg-slate-50 border-navy/20")}>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold opacity-70">Bill Number:</span>
                  <span className="font-mono font-bold text-teal">{selectedBill.bill_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold opacity-70">Supplier:</span>
                  <span className="font-bold">{selectedBill.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold opacity-70">Current Balance Due:</span>
                  <span className="font-mono font-black text-amber-500">TZS {selectedBill.balance_due.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payMethod" className="text-xs font-bold uppercase tracking-wider">Payment Account / Channel *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                    <SelectItem value="CRDB Bank Transfer">CRDB Corporate Operational Bank</SelectItem>
                    <SelectItem value="Main Office Vault Cash">Main Office Vault Cash</SelectItem>
                    <SelectItem value="Selcom Merchant Float">Selcom Merchant Gateway Float</SelectItem>
                    <SelectItem value="Vodacom M-Pesa Till">Vodacom M-Pesa Merchant Till</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payAmount" className="text-xs font-bold uppercase tracking-wider">Disbursement Amount (TZS) *</Label>
                <Input
                  id="payAmount"
                  type="number"
                  value={paymentAmount || ""}
                  onChange={e => setPaymentAmount(Number(e.target.value) || 0)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-black text-base sm:text-lg", isDark ? "bg-[#080d2a] border-teal/30 text-emerald-400" : "bg-white border-navy/20 text-emerald-600")}
                  required
                />
              </div>

              <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentOpen(false)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPaymentSubmitting}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                >
                  {isPaymentSubmitting ? "Processing..." : "Confirm & Disburse Payment"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
