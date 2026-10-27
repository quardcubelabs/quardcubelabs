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
  Receipt
} from "lucide-react"

export default function SupplierBillsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [bills, setBills] = useState<SupplierBill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

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
                  "text-xs sm:text-sm font-medium line-clamp-1 sm:line-clamp-none",
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
                "rounded-lg sm:rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center",
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
              className={cn(
                "font-bold rounded-lg sm:rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Create Supplier Bill</span>
              <span className="sm:hidden">Create Bill</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                Total Billed Liabilities
              </p>
              <h3 className={cn("text-lg sm:text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>
                TZS {totalBillsVolume.toLocaleString()}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Across {bills.length} vendor supplier invoices
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                Outstanding Balance Due
              </p>
              <h3 className="text-lg sm:text-2xl font-black font-mono text-amber-500">
                TZS {totalBalanceDue.toLocaleString()}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Unsettled trade accounts payable
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                  : "bg-amber-100/80 border-amber-400/30 text-amber-600"
              )}
            >
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>
                Settled Supplier Payments
              </p>
              <h3 className="text-lg sm:text-2xl font-black font-mono text-emerald-500">
                TZS {totalPaidVolume.toLocaleString()}
              </h3>
              <p className={cn("text-[11px] font-medium mt-1", isDark ? "text-slate-500" : "text-navy/50")}>
                Disbursed via Bank &amp; Mobile Float
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"
                  : "bg-emerald-100/80 border-emerald-400/30 text-emerald-600"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card
        className={cn(
          "rounded-2xl p-4 mb-6 transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-400" : "text-navy/40")} />
            <Input
              placeholder="Search bill number, vendor, PO number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500 focus:border-teal"
                  : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40 focus:border-navy focus:bg-white"
              )}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(
                  "w-full sm:w-[180px] h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                  isDark
                    ? "bg-slate-900/60 border-teal/20 text-white"
                    : "bg-slate-50 border-navy/20 text-navy"
                )}
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open (Unpaid)</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Fully Settled</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bills Table */}
      <Card
        className={cn(
          "rounded-2xl overflow-hidden transition-all duration-300",
          isDark
            ? "bg-[#080d2a]/80 border-none shadow-lg"
            : "border-2 bg-white border-navy/20 shadow-sm"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy/30 bg-navy text-white text-[11px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Bill Number</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Vendor / Supplier</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">PO Reference</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Bill Date</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Due Date</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Total (Incl. VAT)</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Balance Due</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-xs sm:text-sm">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                    No supplier bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr
                    key={bill.id}
                    className={cn(
                      "transition-colors",
                      isDark
                        ? "border-b border-navy/20 hover:bg-teal/20 hover:text-white"
                        : "border-b border-navy/10 hover:bg-teal/40 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {bill.bill_number}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-bold">
                      <div className={cn(isDark ? "text-white" : "text-navy")}>{bill.supplier_name}</div>
                      {bill.supplier_email && (
                        <div className="text-[11px] text-slate-400 font-normal">{bill.supplier_email}</div>
                      )}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono text-xs text-slate-500">
                      {bill.po_number || "Direct Bill"}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs text-slate-500">
                      {bill.bill_date}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs text-slate-500">
                      {bill.due_date}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono font-black">
                      TZS {bill.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right font-mono font-black text-amber-500">
                      TZS {bill.balance_due.toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize font-bold border rounded-lg px-2.5 py-0.5",
                          bill.status === "paid" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                          bill.status === "partially_paid" && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                          bill.status === "open" && "border-blue-500/30 text-blue-600 bg-blue-500/10",
                          bill.status === "overdue" && "border-rose-500/30 text-rose-600 bg-rose-500/10"
                        )}
                      >
                        {bill.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      {bill.balance_due > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPayment(bill)}
                          className={cn(
                            "h-8 text-xs font-bold rounded-lg border shadow-sm transition-all active:scale-95",
                            isDark
                              ? "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10"
                              : "border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          )}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Pay Bill
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Supplier Bill Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-2xl rounded-2xl", isDark ? "bg-[#0a1033] border-teal-500/30 text-white" : "bg-white border-navy/20 text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Create Supplier Bill (Accounts Payable)</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Record official supplier liability and auto-post Inventory &amp; Accounts Payable GL journals.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBill} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="supName" className="text-xs">Supplier / Vendor Name *</Label>
                <Input
                  id="supName"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supEmail" className="text-xs">Supplier Email</Label>
                <Input
                  id="supEmail"
                  type="email"
                  value={supplierEmail}
                  onChange={e => setSupplierEmail(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="poNum" className="text-xs">Purchase Order Ref</Label>
                <Input
                  id="poNum"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bDate" className="text-xs">Bill Date *</Label>
                <Input
                  id="bDate"
                  type="date"
                  value={billDate}
                  onChange={e => setBillDate(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dDate" className="text-xs">Due Date *</Label>
                <Input
                  id="dDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider">Purchased Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5">
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Item name / description"
                        value={item.name}
                        onChange={e => updateItemRow(idx, "name", e.target.value)}
                        className="h-8 text-xs w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItemRow(idx, "quantity", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="flex-1 sm:w-32">
                        <Input
                          type="number"
                          placeholder="Unit Cost TZS"
                          value={item.unit_cost}
                          onChange={e => updateItemRow(idx, "unit_cost", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="w-24 sm:w-28 text-right font-mono text-xs font-semibold shrink-0">
                        TZS {item.total_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary totals */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-mono">TZS {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TRA VAT (18%):</span>
                  <span className="font-mono">TZS {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-800 text-teal-500">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono">TZS {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                {isSubmitting ? "Creating..." : "Post Supplier Bill"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className={cn("max-w-md rounded-2xl", isDark ? "bg-[#0a1033] border-teal-500/30 text-white" : "bg-white border-navy/20 text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Disburse Supplier Payment</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Clears trade accounts payable and credits corporate bank/cash.
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className={cn("p-3 rounded-xl border text-sm space-y-1.5", isDark ? "border-teal-500/20 bg-slate-900/60" : "border-navy/20 bg-slate-50")}>
                <div className="flex justify-between">
                  <span className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-navy/60")}>Bill Number:</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{selectedBill.bill_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-navy/60")}>Supplier:</span>
                  <span className="font-bold">{selectedBill.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={cn("text-xs font-semibold", isDark ? "text-slate-400" : "text-navy/60")}>Current Balance Due:</span>
                  <span className="font-mono font-black text-amber-500">TZS {selectedBill.balance_due.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="payMethod" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Payment Account / Channel *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRDB Bank Transfer">CRDB Corporate Operational Bank</SelectItem>
                    <SelectItem value="Main Office Vault Cash">Main Office Vault Cash</SelectItem>
                    <SelectItem value="Selcom Merchant Float">Selcom Merchant Gateway Float</SelectItem>
                    <SelectItem value="Vodacom M-Pesa Till">Vodacom M-Pesa Merchant Till</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="payAmount" className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>Disbursement Amount (TZS) *</Label>
                <Input
                  id="payAmount"
                  type="number"
                  value={paymentAmount || ""}
                  onChange={e => setPaymentAmount(Number(e.target.value) || 0)}
                  className={cn("rounded-xl border-2 font-mono font-black text-base sm:text-lg", isDark ? "bg-slate-900/60 border-teal/20 text-emerald-400" : "bg-slate-50 border-navy/20 text-emerald-600")}
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)} className={cn("rounded-xl font-bold", isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPaymentSubmitting} className="rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md">
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
