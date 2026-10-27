"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getCreditNotes, createCreditNote } from "@/lib/credit-note-actions"
import { CreditNote, CreditNoteItem } from "@/lib/erp/types"
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  RotateCcw,
  ExternalLink
} from "lucide-react"

export default function CreditNotesPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Issue modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [reason, setReason] = useState("")
  const [items, setItems] = useState<CreditNoteItem[]>([
    { id: "1", product_id: 1, name: "Hikvision Surveillance Hardware Return", quantity: 1, unit_price: 285000, total: 285000 }
  ])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getCreditNotes()
      setCreditNotes(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load credit notes.",
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
      { id: String(Date.now()), product_id: Date.now(), name: "Surplus Component Return", quantity: 1, unit_price: 50000, total: 50000 }
    ])
  }

  const updateItemRow = (idx: number, field: "name" | "quantity" | "unit_price", val: any) => {
    const updated = [...items]
    if (field === "name") {
      updated[idx].name = val
    } else if (field === "quantity") {
      updated[idx].quantity = Number(val) || 1
      updated[idx].total = updated[idx].quantity * updated[idx].unit_price
    } else if (field === "unit_price") {
      updated[idx].unit_price = Number(val) || 0
      updated[idx].total = updated[idx].quantity * updated[idx].unit_price
    }
    setItems(updated)
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const taxAmount = Math.round(subtotal * 0.18) // 18% VAT reversal
  const totalCredit = subtotal + taxAmount

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerEmail) {
      toast({ title: "Validation Error", description: "Customer name and email are required.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      await createCreditNote({
        invoice_number: invoiceNumber || undefined,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || undefined,
        items,
        subtotal,
        tax_amount: taxAmount,
        total_credit: totalCredit,
        reason
      })

      toast({ title: "Credit Note Issued", description: `Credit voucher issued with QR verification token.` })
      setIsCreateOpen(false)
      setCustomerName("")
      setCustomerEmail("")
      setInvoiceNumber("")
      setReason("")
      loadData()
    } catch {
      toast({ title: "Error", description: "Failed to issue credit note.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = creditNotes.filter(cn =>
    cn.credit_note_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cn.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cn.invoice_number && cn.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalCreditIssued = creditNotes.reduce((s, c) => s + c.total_credit, 0)
  const totalCreditRemaining = creditNotes.reduce((s, c) => s + c.remaining_credit, 0)

  if (isLoading && creditNotes.length === 0) {
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
            <RotateCcw className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Credit Notes</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Sales returns, invoice adjustments, receivable write-backs, and cryptographic verification
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
            Issue Credit Note
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Total Credit Notes Issued
            </span>
            <div className="mt-2 text-2xl font-bold font-mono">
              {creditNotes.length}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Customer adjustments on record
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Total Credit Valuation
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-rose-500">
              TZS {totalCreditIssued.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Reversed revenue & output VAT
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
              Unallocated Credit Float
            </span>
            <div className="mt-2 text-2xl font-bold font-mono text-teal-500">
              TZS {totalCreditRemaining.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Available for future customer invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
        <Input
          placeholder="Search credit note number, customer, invoice..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={cn("pl-9", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}
        />
      </div>

      {/* Credit Notes Table */}
      <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={cn("border-b text-xs uppercase font-semibold", isDark ? "border-slate-800 bg-slate-900/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600")}>
              <tr>
                <th className="px-4 py-3">Credit Note #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Against Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Credit Amount</th>
                <th className="px-4 py-3 text-right">Remaining Float</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No credit notes found.
                  </td>
                </tr>
              ) : (
                filtered.map(cnItem => (
                  <tr key={cnItem.id} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                      {cnItem.credit_note_number}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {cnItem.customer_name}
                      {cnItem.customer_email && (
                        <div className="text-xs text-slate-400 font-normal">{cnItem.customer_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {cnItem.invoice_number || "General Credit"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {cnItem.credit_date}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-rose-500">
                      TZS {cnItem.total_credit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-teal-500">
                      TZS {cnItem.remaining_credit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize font-normal border",
                          cnItem.status === "closed" && "border-slate-500/30 text-slate-400 bg-slate-500/10",
                          cnItem.status === "open" && "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
                          cnItem.status === "partially_allocated" && "border-amber-500/30 text-amber-500 bg-amber-500/10"
                        )}
                      >
                        {cnItem.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cnItem.verification_url ? (
                        <a
                          href={cnItem.verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#000080] dark:text-[#40E0D0] hover:underline"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          Verify
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Verified</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Credit Note Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Issue Customer Credit Note</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Creates an anti-fraud verified credit voucher and automatically adjusts Accounts Receivable in the General Ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="custName" className="text-xs">Customer Name *</Label>
                <Input
                  id="custName"
                  placeholder="e.g. Bakhresa Food Products Ltd"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="custEmail" className="text-xs">Customer Email *</Label>
                <Input
                  id="custEmail"
                  type="email"
                  placeholder="e.g. security@bakhresa.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="invNum" className="text-xs">Original Invoice Ref</Label>
                <Input
                  id="invNum"
                  placeholder="e.g. INV-2026-1001"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800 font-mono" : "border-slate-200 font-mono"}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs">Reason for Credit</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Return of 1 uninstalled 4K Dome Camera"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider">Credit Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5">
                    <div className="flex-1">
                      <Input
                        placeholder="Description of item or service credit"
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
                        placeholder="Unit Price"
                        value={item.unit_price}
                        onChange={e => updateItemRow(idx, "unit_price", e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="w-32 text-right font-mono text-xs font-semibold">
                      TZS {item.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal Credit:</span>
                  <span className="font-mono">TZS {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TRA VAT Credit (18%):</span>
                  <span className="font-mono">TZS {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-800 text-rose-500">
                  <span>Total Credit Issued:</span>
                  <span className="font-mono">TZS {totalCredit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#000080] text-white hover:bg-[#000080]/90">
                {isSubmitting ? "Issuing..." : "Issue & Verify Credit Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
