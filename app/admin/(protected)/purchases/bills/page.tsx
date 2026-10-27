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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Supplier Bills (Accounts Payable)</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Vendor invoice tracking, purchase order settlement, and liability management
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
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#000080] text-white hover:bg-[#000080]/90 shadow-md shadow-[#000080]/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Supplier Bill
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Total Billed Liabilities
            </span>
            <div className="mt-2 text-2xl font-bold font-mono">
              TZS {totalBillsVolume.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Across {bills.length} vendor supplier invoices
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Outstanding Balance Due
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-amber-500">
              TZS {totalBalanceDue.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Unsettled accounts payable
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Settled Supplier Payments
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-500">
              TZS {totalPaidVolume.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Disbursed via Bank & Mobile Money
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
          <Input
            placeholder="Search bill number, vendor, PO number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn("pl-9", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-[180px]", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}>
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

      {/* Bills Table */}
      <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b text-xs uppercase font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
              <tr>
                <th className="px-4 py-3">Bill Number</th>
                <th className="px-4 py-3">Vendor / Supplier</th>
                <th className="px-4 py-3">PO Reference</th>
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Total (Incl. VAT)</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No supplier bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr key={bill.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      {bill.bill_number}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {bill.supplier_name}
                      {bill.supplier_email && (
                        <div className="text-xs text-slate-400 font-normal">{bill.supplier_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {bill.po_number || "Direct Bill"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {bill.bill_date}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {bill.due_date}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      TZS {bill.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-amber-500">
                      TZS {bill.balance_due.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize font-normal border",
                          bill.status === "paid" && "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
                          bill.status === "partially_paid" && "border-amber-500/30 text-amber-500 bg-amber-500/10",
                          bill.status === "open" && "border-blue-500/30 text-blue-500 bg-blue-500/10",
                          bill.status === "overdue" && "border-rose-500/30 text-rose-500 bg-rose-500/10"
                        )}
                      >
                        {bill.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bill.balance_due > 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPayment(bill)}
                          className="h-7 text-xs border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Pay Bill
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-500 font-medium inline-flex items-center gap-1">
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
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Create Supplier Bill (Accounts Payable)</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Record official supplier liability and auto-post Inventory & Accounts Payable GL journals.
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
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name / description"
                        value={item.name}
                        onChange={e => updateItemRow(idx, "name", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateItemRow(idx, "quantity", e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Unit Cost TZS"
                        value={item.unit_cost}
                        onChange={e => updateItemRow(idx, "unit_cost", e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="w-32 text-right font-mono text-xs font-semibold">
                      TZS {item.total_cost.toLocaleString()}
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
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Disburse Supplier Payment</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Clears trade accounts payable and credits corporate bank/cash.
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Bill Number:</span>
                  <span className="font-mono font-bold">{selectedBill.bill_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Supplier:</span>
                  <span>{selectedBill.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Current Balance Due:</span>
                  <span className="font-mono font-bold text-amber-500">TZS {selectedBill.balance_due.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="payMethod" className="text-xs">Payment Account / Channel *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}>
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
                <Label htmlFor="payAmount" className="text-xs">Disbursement Amount (TZS) *</Label>
                <Input
                  id="payAmount"
                  type="number"
                  value={paymentAmount || ""}
                  onChange={e => setPaymentAmount(Number(e.target.value) || 0)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono font-bold text-emerald-500" : "border-slate-200 font-mono font-bold text-emerald-600"}
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPaymentSubmitting} className="bg-emerald-600 text-white hover:bg-emerald-700">
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
