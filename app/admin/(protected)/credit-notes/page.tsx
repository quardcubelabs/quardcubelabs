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
  DollarSign,
  Eye,
  Trash2,
  Printer,
  FileCheck
} from "lucide-react"

export default function CreditNotesPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modals
  const [selectedViewCreditNote, setSelectedViewCreditNote] = useState<CreditNote | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Issue Form State
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

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) {
      toast({ title: "Requirement", description: "At least one credit item is required.", variant: "destructive" })
      return
    }
    setItems(items.filter((_, i) => i !== idx))
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

      toast({ title: "Credit Note Issued", description: "Credit voucher issued with QR verification token." })
      setIsCreateOpen(false)
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setInvoiceNumber("")
      setReason("")
      setItems([{ id: "1", product_id: 1, name: "Hikvision Surveillance Hardware Return", quantity: 1, unit_price: 285000, total: 285000 }])
      loadData()
    } catch {
      toast({ title: "Error", description: "Failed to issue credit note.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = creditNotes.filter(cn => {
    const matchesSearch =
      cn.credit_note_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cn.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cn.invoice_number && cn.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cn.reason && cn.reason.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || cn.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // KPI calculations
  const totalCreditIssued = creditNotes.reduce((s, c) => s + c.total_credit, 0)
  const totalCreditRemaining = creditNotes.reduce((s, c) => s + c.remaining_credit, 0)
  const openCreditNotesCount = creditNotes.filter(c => c.status === "open" || c.status === "partially_allocated").length

  const statuses = [
    { id: "all", label: "All Notes", count: creditNotes.length },
    { id: "open", label: "Open Floating", count: creditNotes.filter(c => c.status === "open").length },
    { id: "partially_allocated", label: "Partially Allocated", count: creditNotes.filter(c => c.status === "partially_allocated").length },
    { id: "closed", label: "Fully Reconciled", count: creditNotes.filter(c => c.status === "closed").length },
  ]

  if (isLoading && creditNotes.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Banner */}
      <div
        className={cn(
          "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
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
              <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Customer <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Credit Notes</span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300/80" : "text-navy/90"
                )}
              >
                Sales returns, invoice adjustments, receivable write-backs, and cryptographic verification
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadData}
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm flex-1 sm:flex-none justify-center transition-all active:scale-95",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Issue Credit Note</span>
              <span className="sm:hidden">Issue</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 4-Card KPI Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { title: "Total Credit Notes", value: creditNotes.length.toString(), icon: RotateCcw, color: isDark ? "text-white" : "text-navy" },
          { title: "Issued Valuation", value: `TZS ${totalCreditIssued.toLocaleString()}`, icon: TrendingDown, color: "text-rose-500" },
          { title: "Unallocated Float", value: `TZS ${totalCreditRemaining.toLocaleString()}`, icon: DollarSign, color: isDark ? "text-white" : "text-navy" },
          { title: "Open Credit Files", value: openCreditNotesCount.toString(), icon: Receipt, color: "text-amber-500" }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
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
                <span className={cn("text-base sm:text-xl xl:text-2xl font-black truncate block font-mono leading-tight tracking-tight", stat.color)}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Card with Horizontal Scroll Tabs */}
      <Card
        className={cn(
          "rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 space-y-3 sm:space-y-4",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Horizontal Status Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statuses.map(st => {
            const isSelected = statusFilter === st.id
            return (
              <Button
                key={st.id}
                size="sm"
                onClick={() => setStatusFilter(st.id)}
                className={cn(
                  "rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all",
                  isSelected
                    ? "bg-navy text-white shadow-md hover:bg-navy/90"
                    : isDark
                    ? "bg-white/5 text-slate-300 hover:bg-white/10"
                    : "bg-slate-100 text-navy hover:bg-slate-200"
                )}
              >
                {st.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1.5 px-1.5 py-0.2 text-[10px] font-black rounded-full",
                    isSelected
                      ? "bg-teal text-navy"
                      : isDark
                      ? "bg-white/10 text-white"
                      : "bg-navy/10 text-navy"
                  )}
                >
                  {st.count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4",
              isDark ? "text-slate-400" : "text-navy/40"
            )}
          />
          <Input
            placeholder="Search credit note number, customer name, invoice ref, or return justification..."
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
      </Card>

      {/* 4. Credit Notes Data Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Credit Note</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Customer</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden sm:table-cell">Invoice Ref</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden md:table-cell">Issue Date</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Credit Amount</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Remaining Float</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center hidden md:table-cell">Verify</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <RotateCcw className="h-10 w-10 text-navy/40 mx-auto mb-2 opacity-50" />
                    <p className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>
                      No credit notes found
                    </p>
                    <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-navy/70")}>
                      Click &quot;Issue Credit Note&quot; to register a customer adjustment.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(cnItem => (
                  <tr
                    key={cnItem.id}
                    className={cn(
                      "transition-colors duration-150",
                      isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    {/* Credit Note Number */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={cn(
                            "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                          )}
                        >
                          <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className={cn("font-black font-mono text-xs sm:text-sm", isDark ? "text-slate-300" : "text-navy")}>
                          {cnItem.credit_note_number}
                        </span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4">
                      <div className={cn("font-bold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs", isDark ? "text-white" : "text-navy")} title={cnItem.customer_name}>
                        {cnItem.customer_name}
                      </div>
                      {cnItem.customer_email && (
                        <p className={cn("hidden sm:block text-[11px] font-medium truncate max-w-[150px] sm:max-w-xs", isDark ? "text-slate-400" : "text-navy/60")}>
                          {cnItem.customer_email}
                        </p>
                      )}
                    </td>

                    {/* Invoice Ref */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden sm:table-cell whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg border font-mono font-bold text-[10px] sm:text-[11px] inline-block",
                        isDark ? "bg-white/10 border-white/20 text-white" : "bg-navy/5 border-navy/10 text-navy"
                      )}>
                        {cnItem.invoice_number || "FLOAT"}
                      </span>
                    </td>

                    {/* Issue Date */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-xs font-mono font-medium hidden md:table-cell whitespace-nowrap text-slate-400">
                      {cnItem.credit_date}
                    </td>

                    {/* Total Credit */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span className="font-black text-xs sm:text-sm font-mono text-rose-500">
                        TZS {cnItem.total_credit.toLocaleString()}
                      </span>
                    </td>

                    {/* Remaining Float */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <span className={cn("font-black text-xs sm:text-sm font-mono", isDark ? "text-white" : "text-navy")}>
                        TZS {cnItem.remaining_credit.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
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

                    {/* Verification */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap hidden md:table-cell">
                      {cnItem.verification_url ? (
                        <a
                          href={cnItem.verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "p-1 sm:p-1.5 rounded-full transition-all duration-150 shadow-xs inline-flex items-center justify-center",
                            isDark ? "bg-teal/20 text-teal-300 hover:bg-teal hover:text-navy" : "bg-teal-100 text-teal-800 hover:bg-teal hover:text-white"
                          )}
                          title="Verified Anti-Fraud QR Code"
                        >
                          <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Verified</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          onClick={() => setSelectedViewCreditNote(cnItem)}
                          className={cn(
                            "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                          )}
                          title="View Credit Note Details"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* 5. Credit Note Details View Modal */}
      <Dialog open={!!selectedViewCreditNote} onOpenChange={open => !open && setSelectedViewCreditNote(null)}>
        {selectedViewCreditNote && (
          <DialogContent
            className={cn(
              "max-w-3xl rounded-2xl border-2 p-5 sm:p-6",
              isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy text-navy"
            )}
          >
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-lg border",
                    selectedViewCreditNote.status === "closed"
                      ? "border-slate-500/30 text-slate-400 bg-slate-500/10"
                      : selectedViewCreditNote.status === "open"
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  )}
                >
                  {selectedViewCreditNote.status.replace("_", " ")}
                </Badge>
                <span className="text-xs font-mono text-slate-400">
                  Issued: {selectedViewCreditNote.credit_date}
                </span>
              </div>
              <DialogTitle className={cn("text-xl sm:text-2xl font-black mt-2 font-mono", isDark ? "text-teal-300" : "text-navy")}>
                {selectedViewCreditNote.credit_note_number}
              </DialogTitle>
              <DialogDescription className={isDark ? "text-teal-300/80" : "text-navy/70"}>
                Anti-fraud verified customer credit adjustment voucher
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Metadata Grid */}
              <div
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs",
                  isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/15"
                )}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Customer Name
                  </span>
                  <span className="font-bold truncate block">
                    {selectedViewCreditNote.customer_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Invoice Ref
                  </span>
                  <span className="font-bold font-mono">
                    {selectedViewCreditNote.invoice_number || "Standalone Credit"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Total Credit Value
                  </span>
                  <span className="font-black font-mono text-rose-500">
                    TZS {selectedViewCreditNote.total_credit.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Remaining Float
                  </span>
                  <span className="font-black font-mono text-teal-500">
                    TZS {selectedViewCreditNote.remaining_credit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Return Justification */}
              {selectedViewCreditNote.reason && (
                <div
                  className={cn(
                    "p-3 rounded-xl border text-xs",
                    isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/15"
                  )}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Return / Credit Reason
                  </span>
                  <p className="font-medium text-slate-300 dark:text-slate-200">
                    {selectedViewCreditNote.reason}
                  </p>
                </div>
              )}

              {/* Credit Line Items Table */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider block mb-2">
                  Itemized Credit Schedule
                </Label>
                <div
                  className={cn(
                    "rounded-xl overflow-hidden border",
                    isDark ? "border-teal/20 bg-[#080d2a]" : "border-navy/15 bg-white"
                  )}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-navy text-white text-[10px] uppercase font-black">
                        <th className="py-2 px-3 text-left">Description</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price (TZS)</th>
                        <th className="py-2 px-3 text-right">Total (TZS)</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      {selectedViewCreditNote.items.map((item, idx) => (
                        <tr key={idx} className="font-medium">
                          <td className="py-2 px-3">{item.name}</td>
                          <td className="py-2 px-3 text-right font-mono">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono">{item.unit_price.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div
                className={cn(
                  "p-3.5 rounded-xl border space-y-1.5 text-xs font-mono",
                  isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/15"
                )}
              >
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Credit:</span>
                  <span>TZS {selectedViewCreditNote.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TRA 18% Output VAT Reversal:</span>
                  <span>TZS {selectedViewCreditNote.tax_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-slate-700/40 text-rose-500">
                  <span>Total Credit Issued:</span>
                  <span>TZS {selectedViewCreditNote.total_credit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-teal-400 pt-0.5">
                  <span>Allocated to Invoices:</span>
                  <span>TZS {selectedViewCreditNote.amount_allocated.toLocaleString()}</span>
                </div>
              </div>

              {/* Cryptographic Verification Box */}
              {selectedViewCreditNote.verification_token && (
                <div
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between text-xs",
                    isDark ? "bg-teal/5 border-teal/20 text-teal-300" : "bg-teal/10 border-teal/30 text-navy"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal" />
                    <span>Cryptographic Verification Token:</span>
                  </div>
                  <span className="font-mono font-bold text-[11px] truncate max-w-xs">
                    {selectedViewCreditNote.verification_token}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedViewCreditNote(null)}
                className={cn(
                  "rounded-xl text-xs font-bold",
                  isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy"
                )}
              >
                Close
              </Button>
              {selectedViewCreditNote.verification_url && (
                <a
                  href={selectedViewCreditNote.verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs px-4 flex items-center gap-1.5 shadow-md"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal" />
                  Public Verification QR
                </a>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* 6. Issue Credit Note Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          className={cn(
            "max-w-2xl rounded-2xl border-2 p-5 sm:p-6",
            isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy text-navy"
          )}
        >
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>
              Issue Customer Credit Note
            </DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300/80" : "text-navy/70"}>
              Creates an anti-fraud verified credit voucher and adjusts Accounts Receivable in General Ledger.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="custName" className="text-xs font-bold">
                  Customer Name *
                </Label>
                <Input
                  id="custName"
                  placeholder="e.g. Bakhresa Food Products Ltd"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className={cn(
                    "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                    isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                  required
                />
              </div>
              <div>
                <Label htmlFor="custEmail" className="text-xs font-bold">
                  Customer Email *
                </Label>
                <Input
                  id="custEmail"
                  type="email"
                  placeholder="e.g. security@bakhresa.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className={cn(
                    "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                    isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="invNum" className="text-xs font-bold">
                  Original Invoice Ref
                </Label>
                <Input
                  id="invNum"
                  placeholder="e.g. INV-2026-1001"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className={cn(
                    "rounded-xl mt-1 h-10 text-sm border-2 font-mono",
                    isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>
              <div>
                <Label htmlFor="reason" className="text-xs font-bold">
                  Reason for Credit
                </Label>
                <Input
                  id="reason"
                  placeholder="e.g. Return of 1 uninstalled 4K Dome Camera"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className={cn(
                    "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                    isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Credit Line Items
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className={cn(
                    "h-7 text-xs font-bold rounded-lg border",
                    isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100"
                  )}
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border",
                      isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/15"
                    )}
                  >
                    <div className="flex-1 w-full">
                      <Input
                        placeholder="Description of item or service credit"
                        value={item.name}
                        onChange={e => updateItemRow(idx, "name", e.target.value)}
                        className={cn(
                          "h-8 text-xs w-full rounded-lg border",
                          isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-16">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItemRow(idx, "quantity", e.target.value)}
                          className={cn(
                            "h-8 text-xs font-mono rounded-lg border",
                            isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                          )}
                        />
                      </div>
                      <div className="flex-1 sm:w-28">
                        <Input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={e => updateItemRow(idx, "unit_price", e.target.value)}
                          className={cn(
                            "h-8 text-xs font-mono rounded-lg border",
                            isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                          )}
                        />
                      </div>
                      <div className="w-24 text-right font-mono text-xs font-bold text-rose-500 shrink-0">
                        TZS {item.total.toLocaleString()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemRow(idx)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div
                className={cn(
                  "p-3 rounded-xl border space-y-1 text-xs font-mono",
                  isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/15"
                )}
              >
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Credit:</span>
                  <span>TZS {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TRA VAT Credit (18%):</span>
                  <span>TZS {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-700/30 text-rose-500">
                  <span>Total Credit Issued:</span>
                  <span>TZS {totalCredit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={cn(
                  "rounded-xl text-xs font-bold",
                  isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy"
                )}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs px-5 shadow-md transition-all active:scale-95"
              >
                {isSubmitting ? "Issuing..." : "Issue & Verify Credit Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
