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
  ExternalLink,
  TrendingDown,
  DollarSign
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
              <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Customer <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Credit Notes</span>
              </h1>
              <p className={cn("text-xs sm:text-base font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300" : "text-navy/90")}>
                Sales returns, invoice adjustments, receivable write-backs, and cryptographic verification
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadData}
              className={cn(
                "rounded-lg sm:rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm flex-1 sm:flex-none justify-center",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-lg sm:rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Issue Credit Note</span>
              <span className="sm:hidden">Issue</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Credit Notes Issued", value: creditNotes.length.toString(), icon: RotateCcw, sub: "Customer adjustments on record" },
          { title: "Total Credit Valuation", value: `TZS ${totalCreditIssued.toLocaleString()}`, icon: TrendingDown, sub: "Reversed revenue & output VAT" },
          { title: "Unallocated Credit Float", value: `TZS ${totalCreditRemaining.toLocaleString()}`, icon: DollarSign, sub: "Available for future customer invoices" },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-2.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-base sm:text-lg font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
                <p className={cn("text-[10px] font-medium mt-0.5 sm:mt-1 truncate", isDark ? "text-slate-400" : "text-navy/60")}>
                  {stat.sub}
                </p>
              </div>
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search Bar */}
      <Card className={cn(
        "rounded-2xl p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
          <Input
            placeholder="Search credit note number, customer, invoice..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
              isDark ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500" : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40"
            )}
          />
        </div>
      </Card>

      {/* 4. Credit Notes Table */}
      <div className={cn(
        "rounded-2xl overflow-hidden",
        isDark ? "bg-[#080d2a]/80 border-none shadow-lg" : "border-2 bg-white border-navy/20 shadow-sm"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-navy/30 bg-navy text-white text-[11px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Credit Note</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Customer</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Invoice Ref</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Issue Date</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Credit Amount</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Remaining Float</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-center">Verification</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <RotateCcw className="h-12 w-12 text-navy/40 mx-auto mb-2" />
                    <p className={cn("font-black text-base", isDark ? "text-white" : "text-navy")}>No credit notes found</p>
                    <p className={cn("text-xs font-semibold mt-1", isDark ? "text-slate-400" : "text-navy/70")}>Click &quot;Issue Credit Note&quot; to register a customer adjustment</p>
                  </td>
                </tr>
              ) : (
                filtered.map(cnItem => (
                  <tr
                    key={cnItem.id}
                    className={cn(
                      "transition-colors cursor-pointer",
                      isDark ? "hover:bg-teal/20 hover:text-white" : "hover:bg-teal/40 hover:text-navy"
                    )}
                  >
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn(
                          "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                        )}>
                          <RotateCcw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")} />
                        </div>
                        <span className={cn("font-bold font-mono text-xs sm:text-sm", isDark ? "text-teal-400" : "text-navy")}>
                          {cnItem.credit_note_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4">
                      <p className={cn("font-bold text-xs sm:text-sm", isDark ? "text-white" : "text-navy")}>
                        {cnItem.customer_name}
                      </p>
                      {cnItem.customer_email && (
                        <p className={cn("text-[11px] font-medium truncate max-w-xs", isDark ? "text-slate-400" : "text-navy/60")}>
                          {cnItem.customer_email}
                        </p>
                      )}
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 font-mono text-xs font-semibold">
                      <span className={cn(isDark ? "text-slate-300" : "text-navy/80")}>
                        {cnItem.invoice_number || "General Credit"}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 text-xs font-medium text-slate-500">
                      {cnItem.credit_date}
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span className="font-black text-xs sm:text-sm font-mono text-rose-500">
                        TZS {cnItem.total_credit.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span className="font-black text-xs sm:text-sm font-mono text-teal-500">
                        TZS {cnItem.remaining_credit.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] sm:text-xs capitalize font-bold border",
                          cnItem.status === "closed" && "border-slate-500/30 text-slate-400 bg-slate-500/10",
                          cnItem.status === "open" && "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
                          cnItem.status === "partially_allocated" && "border-amber-500/30 text-amber-500 bg-amber-500/10"
                        )}
                      >
                        {cnItem.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-2 sm:py-3.5 px-3 sm:px-4 text-center">
                      {cnItem.verification_url ? (
                        <a
                          href={cnItem.verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:underline"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          Verify
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5">
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Description of item or service credit"
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
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={e => updateItemRow(idx, "unit_price", e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="w-24 sm:w-28 text-right font-mono text-xs font-semibold shrink-0">
                        TZS {item.total.toLocaleString()}
                      </div>
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
