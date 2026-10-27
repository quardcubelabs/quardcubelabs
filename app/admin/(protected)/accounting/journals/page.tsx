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
import { getJournalEntries, createJournalEntry, getChartOfAccounts } from "@/lib/accounting-actions"
import { JournalEntry, ChartOfAccount } from "@/lib/erp/accounting-types"
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Scale,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Trash2,
  Receipt,
  Eye,
  ShieldCheck,
  CheckCircle,
  BookOpen
} from "lucide-react"

export default function JournalEntriesPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [refFilter, setRefFilter] = useState<string>("all")
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0])
  const [referenceType, setReferenceType] = useState<JournalEntry["reference_type"]>("manual")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [memo, setMemo] = useState("")

  // Dynamic journal lines
  const [lines, setLines] = useState<Array<{
    account_id: string
    account_code: string
    account_name: string
    debit: number
    credit: number
    description: string
  }>>([
    { account_id: "acc-1020", account_code: "1020", account_name: "CRDB Bank Operational Account", debit: 0, credit: 0, description: "" },
    { account_id: "acc-4010", account_code: "4010", account_name: "Sales Revenue — Hardware & CCTV Equipment", debit: 0, credit: 0, description: "" }
  ])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [jData, aData] = await Promise.all([
        getJournalEntries(),
        getChartOfAccounts()
      ])
      setJournals(jData)
      setAccounts(aData)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load journal entries.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addLine = () => {
    const defaultAcc = accounts[0] || { id: "acc-1010", code: "1010", name: "Cash on Hand" }
    setLines([
      ...lines,
      {
        account_id: defaultAcc.id,
        account_code: defaultAcc.code,
        account_name: defaultAcc.name,
        debit: 0,
        credit: 0,
        description: ""
      }
    ])
  }

  const removeLine = (idx: number) => {
    if (lines.length <= 2) {
      toast({ title: "Rule", description: "A double-entry journal requires at least 2 lines.", variant: "destructive" })
      return
    }
    setLines(lines.filter((_, i) => i !== idx))
  }

  const updateLineAccount = (idx: number, accountId: string) => {
    const acc = accounts.find(a => a.id === accountId)
    if (!acc) return
    const updated = [...lines]
    updated[idx].account_id = acc.id
    updated[idx].account_code = acc.code
    updated[idx].account_name = acc.name
    setLines(updated)
  }

  const updateLineValue = (idx: number, field: "debit" | "credit" | "description", val: any) => {
    const updated = [...lines]
    if (field === "debit") {
      updated[idx].debit = Number(val) || 0
      if (Number(val) > 0) updated[idx].credit = 0
    } else if (field === "credit") {
      updated[idx].credit = Number(val) || 0
      if (Number(val) > 0) updated[idx].debit = 0
    } else {
      updated[idx].description = val
    }
    setLines(updated)
  }

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01 && totalDebit > 0

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memo) {
      toast({ title: "Validation Error", description: "Entry memo is required.", variant: "destructive" })
      return
    }
    if (!isBalanced) {
      toast({
        title: "Unbalanced Entry",
        description: `Total Debits (TZS ${totalDebit.toLocaleString()}) must equal Total Credits (TZS ${totalCredit.toLocaleString()}).`,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createJournalEntry({
        entry_date: entryDate,
        reference_type: referenceType,
        reference_number: referenceNumber || undefined,
        memo,
        lines
      })

      if (!res.success) {
        toast({ title: "Posting Failed", description: res.error, variant: "destructive" })
      } else {
        toast({ title: "Journal Entry Posted", description: `Transaction ${res.entry?.entry_number} recorded.` })
        setIsCreateOpen(false)
        setMemo("")
        setReferenceNumber("")
        loadData()
      }
    } catch {
      toast({ title: "Posting Error", description: "Failed to persist journal entry.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredJournals = journals.filter(j => {
    const matchesSearch =
      j.entry_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.memo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.reference_number && j.reference_number.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesRef = refFilter === "all" || j.reference_type === refFilter
    return matchesSearch && matchesRef
  })

  const totalDebitVolume = journals.reduce((s, j) => s + j.total_debit, 0)
  const totalCreditVolume = journals.reduce((s, j) => s + j.total_credit, 0)

  if (isLoading && journals.length === 0) {
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
              <Scale className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                General Ledger <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Journals</span>
              </h1>
              <p className={cn("text-xs sm:text-base font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300" : "text-navy/90")}>
                Double-entry financial journal transactions, debit/credit audit trails, and automatic postings
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95",
                isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 sm:h-11 px-3 sm:px-5 text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Journal Entry</span>
              <span className="sm:hidden">New Entry</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Journal Postings", value: journals.length.toString(), icon: FileText, color: "text-blue-500", sub: "Balanced vouchers" },
          { title: "Cumulative Debits", value: `TZS ${totalDebitVolume.toLocaleString()}`, icon: Receipt, color: "text-emerald-500", sub: "Assets & expenses" },
          { title: "Cumulative Credits", value: `TZS ${totalCreditVolume.toLocaleString()}`, icon: CheckCircle2, color: "text-teal-500", sub: "Revenue & liabilities" },
          { title: "Equilibrium Variance", value: "TZS 0 (Balanced)", icon: ShieldCheck, color: "text-emerald-500", sub: "Zero discrepancies" }
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

      {/* 3. Search and Filters */}
      <Card className={cn(
        "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        {/* Origin Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Origins", icon: Layers, count: journals.length },
            { key: "manual", label: "Manual Entries", icon: FileText, count: journals.filter(j => j.reference_type === "manual").length },
            { key: "invoice", label: "Sales Invoices", icon: Receipt, count: journals.filter(j => j.reference_type === "invoice").length },
            { key: "supplier_bill", label: "Supplier Bills", icon: BookOpen, count: journals.filter(j => j.reference_type === "supplier_bill").length },
            { key: "supplier_payment", label: "Supplier Payments", icon: CheckCircle, count: journals.filter(j => j.reference_type === "supplier_payment").length },
            { key: "credit_note", label: "Credit Notes", icon: Scale, count: journals.filter(j => j.reference_type === "credit_note").length },
            { key: "inventory_adjustment", label: "Inventory Adjustments", icon: Plus, count: journals.filter(j => j.reference_type === "inventory_adjustment").length }
          ].map((tab) => {
            const isSelected = refFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                onClick={() => setRefFilter(tab.key)}
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
              placeholder="Search entry number, memo, or reference number..."
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

      {/* 4. Journal Entries List */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <Card className={cn("rounded-2xl p-12 sm:p-16 text-center", isDark ? "bg-[#0a1033] border-none" : "bg-white border-2 border-navy/20")}>
            <Scale className="h-12 w-12 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
            <p className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>No journal entries found</p>
            <p className={cn("text-xs font-medium mt-1", isDark ? "text-slate-400" : "text-navy/60")}>Click &quot;New Journal Entry&quot; to post a transaction or adjust your filter query</p>
          </Card>
        ) : (
          filteredJournals.map(journal => (
            <Card
              key={journal.id}
              className={cn(
                "rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5",
                isDark ? "bg-[#0a1033] border-none shadow-md" : "border-2 bg-white border-navy/20 shadow-sm hover:border-navy"
              )}
            >
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between border-b px-5 py-3.5 gap-2",
                isDark ? "border-teal/20 bg-navy/60" : "border-navy/15 bg-navy text-white"
              )}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-black text-sm text-teal bg-teal/20 px-2 py-0.5 rounded-md border border-teal/30">
                    {journal.entry_number}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize font-bold border-teal text-teal bg-teal/15">
                    {journal.reference_type.replace("_", " ")}
                  </Badge>
                  {journal.reference_number && (
                    <span className="text-xs font-mono font-semibold opacity-90">
                      Ref: {journal.reference_number}
                    </span>
                  )}
                  <span className="text-xs font-medium flex items-center gap-1 opacity-80">
                    <Calendar className="h-3.5 w-3.5 text-teal" />
                    {journal.entry_date}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-teal font-mono">
                    Balanced: TZS {journal.total_debit.toLocaleString()}
                  </span>
                  <Badge className="bg-emerald-500 text-white text-[10px] uppercase font-bold">
                    Posted
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedJournal(journal)}
                    className={cn(
                      "rounded-xl h-8 px-2.5 text-xs font-bold border",
                      isDark ? "border-teal/30 hover:bg-teal/20 text-white" : "border-white/30 hover:bg-white/10 text-white"
                    )}
                    title="View Journal Audit"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Audit
                  </Button>
                </div>
              </div>

              <div className="p-5">
                <p className={cn("text-sm font-bold mb-3", isDark ? "text-white" : "text-navy")}>
                  {journal.memo}
                </p>

                {/* Journal Lines Table */}
                <div className="overflow-x-auto rounded-xl border border-navy/20 dark:border-teal/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-navy/20 bg-slate-100 dark:bg-slate-900/60 font-black uppercase tracking-wider text-[11px] text-navy dark:text-teal-300">
                        <th className="px-3.5 py-2.5">Code</th>
                        <th className="px-3.5 py-2.5">Account Name</th>
                        <th className="px-3.5 py-2.5">Line Description</th>
                        <th className="px-3.5 py-2.5 text-right">Debit (TZS)</th>
                        <th className="px-3.5 py-2.5 text-right">Credit (TZS)</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      {journal.lines.map((line, idx) => (
                        <tr key={idx} className={isDark ? "hover:bg-teal/10" : "hover:bg-teal-50/50"}>
                          <td className="px-3.5 py-2 font-mono font-bold text-teal">{line.account_code}</td>
                          <td className={cn("px-3.5 py-2 font-semibold", isDark ? "text-white" : "text-navy")}>{line.account_name}</td>
                          <td className="px-3.5 py-2 text-slate-500 dark:text-slate-400">{line.description || "—"}</td>
                          <td className="px-3.5 py-2 text-right font-mono font-black text-emerald-500">
                            {line.debit > 0 ? line.debit.toLocaleString() : "—"}
                          </td>
                          <td className="px-3.5 py-2 text-right font-mono font-black text-teal-500">
                            {line.credit > 0 ? line.credit.toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-medium opacity-60">
                  <span>Posted by: {journal.posted_by || "System Automated"}</span>
                  <span>Timestamp: {new Date(journal.created_at).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 5. Journal Audit / Details View Modal */}
      <Dialog open={!!selectedJournal} onOpenChange={(open) => !open && setSelectedJournal(null)}>
        <DialogContent className={cn("max-w-3xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedJournal && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedJournal.entry_number}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        Journal Voucher Audit
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Origin: <span className="font-bold uppercase">{selectedJournal.reference_type.replace("_", " ")}</span> {selectedJournal.reference_number ? `• Ref: ${selectedJournal.reference_number}` : ""} • Date: <span className="font-bold">{selectedJournal.entry_date}</span>
                    </p>
                  </div>
                </div>

                <Badge className="font-bold text-xs px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  Posted & Finalized
                </Badge>
              </div>

              {/* Memo Banner */}
              <div className={cn(
                "p-4 rounded-2xl border space-y-1.5",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Transaction Memo & Business Context</span>
                <p className="text-sm font-bold leading-relaxed">{selectedJournal.memo}</p>
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider opacity-80">Line-by-Line Financial Allocation</h3>
                  <span className="text-xs font-mono font-bold text-teal">
                    Total: TZS {selectedJournal.total_debit.toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-navy/20 dark:border-teal/20">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-navy/20 bg-slate-100 dark:bg-slate-900/60 font-black uppercase tracking-wider text-[11px] text-navy dark:text-teal-300">
                        <th className="px-3.5 py-2.5">Account Code</th>
                        <th className="px-3.5 py-2.5">Account Name</th>
                        <th className="px-3.5 py-2.5">Description</th>
                        <th className="px-3.5 py-2.5 text-right">Debit (TZS)</th>
                        <th className="px-3.5 py-2.5 text-right">Credit (TZS)</th>
                      </tr>
                    </thead>
                    <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                      {selectedJournal.lines.map((line, idx) => (
                        <tr key={idx} className={isDark ? "hover:bg-teal/10" : "hover:bg-teal-50/50"}>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-teal">{line.account_code}</td>
                          <td className={cn("px-3.5 py-2.5 font-bold", isDark ? "text-white" : "text-navy")}>{line.account_name}</td>
                          <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400">{line.description || "—"}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-500">
                            {line.debit > 0 ? line.debit.toLocaleString() : "—"}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-black text-teal-500">
                            {line.credit > 0 ? line.credit.toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Equilibrium Banner */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 flex items-center justify-between text-xs font-mono font-bold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Double-Entry Equilibrium Verified (0.00 Variance)</span>
                </div>
                <span>Debits: {selectedJournal.total_debit.toLocaleString()} = Credits: {selectedJournal.total_credit.toLocaleString()}</span>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJournal(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Create Journal Entry Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-3xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Post General Ledger Journal Entry
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Multi-line double entry transaction. Total debits must strictly equal total credits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider">Entry Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider">Reference Type *</Label>
                <Select value={referenceType} onValueChange={(val: any) => setReferenceType(val)}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                    <SelectItem value="manual">Manual Adjustment</SelectItem>
                    <SelectItem value="invoice">Sales Invoice</SelectItem>
                    <SelectItem value="supplier_bill">Supplier Bill</SelectItem>
                    <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
                    <SelectItem value="payroll">Payroll Run</SelectItem>
                    <SelectItem value="tax">Tax Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refNum" className="text-xs font-bold uppercase tracking-wider">Reference Number</Label>
                <Input
                  id="refNum"
                  placeholder="e.g. PV-2026-99"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memo" className="text-xs font-bold uppercase tracking-wider">Memo / Narrative *</Label>
              <Input
                id="memo"
                placeholder="e.g. Monthly cloud server depreciation and network hosting allocation"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                required
              />
            </div>

            {/* Dynamic Lines */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-wider">Transaction Lines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  className={cn("rounded-xl h-8 text-xs font-bold border", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {lines.map((line, idx) => (
                  <div key={idx} className={cn(
                    "flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border",
                    isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/20"
                  )}>
                    <div className="flex-1 w-full sm:w-auto">
                      <Select
                        value={line.account_id}
                        onValueChange={(val) => updateLineAccount(idx, val)}
                      >
                        <SelectTrigger className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.code} — {acc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder="Debit TZS"
                        value={line.debit || ""}
                        onChange={e => updateLineValue(idx, "debit", e.target.value)}
                        className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                      />
                    </div>

                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder="Credit TZS"
                        value={line.credit || ""}
                        onChange={e => updateLineValue(idx, "credit", e.target.value)}
                        className={cn("h-9 text-xs font-mono font-bold rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                      />
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                      <Input
                        placeholder="Line description"
                        value={line.description}
                        onChange={e => updateLineValue(idx, "description", e.target.value)}
                        className={cn("h-9 text-xs font-medium rounded-lg border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(idx)}
                      className="h-9 w-9 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Equilibrium Tally Bar */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between text-xs font-mono font-bold",
                isBalanced
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-500"
              )}>
                <div className="flex items-center gap-2">
                  {isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <span>{isBalanced ? "Entry Balanced" : `Unbalanced Variance: TZS ${Math.abs(totalDebit - totalCredit).toLocaleString()}`}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 sm:mt-0">
                  <span>Debits: TZS {totalDebit.toLocaleString()}</span>
                  <span>Credits: TZS {totalCredit.toLocaleString()}</span>
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
                disabled={isSubmitting || !isBalanced}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              >
                {isSubmitting ? "Posting..." : "Post Journal Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
