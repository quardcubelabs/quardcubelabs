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
  Receipt
} from "lucide-react"

export default function JournalEntriesPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [refFilter, setRefFilter] = useState<string>("all")

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
      if (Number(val) > 0) updated[idx].credit = 0 // A line is usually debit OR credit
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#000080] to-[#40E0D0] text-white shadow-lg shadow-[#000080]/20">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">General Ledger Journals</h1>
            <p className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
              Double-entry financial journal transactions, debit/credit audit trails, and automatic postings
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
            New Journal Entry
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Total Journal Postings
              </span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">
              {journals.length}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Fully balanced double-entry vouchers
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Cumulative Debits
              </span>
              <Receipt className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-500">
              TZS {totalDebitVolume.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              All debited asset & expense lines
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                Cumulative Credits
              </span>
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-teal-500">
              TZS {totalCreditVolume.toLocaleString()}
            </div>
            <p className={cn("mt-1 text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
              Verified zero-variance GL equilibrium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", isDark ? "text-slate-500" : "text-slate-400")} />
          <Input
            placeholder="Search entry number, memo, or reference..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn("pl-9", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={refFilter} onValueChange={setRefFilter}>
            <SelectTrigger className={cn("w-[200px]", isDark ? "bg-[#0d0d12]/60 border-slate-800" : "bg-white border-slate-200")}>
              <SelectValue placeholder="All Origins" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Origins</SelectItem>
              <SelectItem value="manual">Manual Entry</SelectItem>
              <SelectItem value="invoice">Sales Invoice</SelectItem>
              <SelectItem value="supplier_bill">Supplier Bill</SelectItem>
              <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
              <SelectItem value="credit_note">Credit Note</SelectItem>
              <SelectItem value="inventory_adjustment">Inventory Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <Card className={cn("p-12 text-center", isDark ? "bg-[#0d0d12]/80 border-slate-800" : "bg-white border-slate-200")}>
            <p className="text-slate-500">No journal entries found matching criteria.</p>
          </Card>
        ) : (
          filteredJournals.map(journal => (
            <Card
              key={journal.id}
              className={cn("overflow-hidden border transition-all", isDark ? "bg-[#0d0d12]/80 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300")}
            >
              <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between border-b px-5 py-3 gap-2", isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/70")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-bold text-sm text-primary">
                    {journal.entry_number}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize font-normal border-teal-500/30 text-teal-500 bg-teal-500/10">
                    {journal.reference_type.replace("_", " ")}
                  </Badge>
                  {journal.reference_number && (
                    <span className="text-xs font-mono text-slate-500">
                      Ref: {journal.reference_number}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {journal.entry_date}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                    Balanced: TZS {journal.total_debit.toLocaleString()}
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/30 text-[10px] uppercase">
                    Posted
                  </Badge>
                </div>
              </div>

              <div className="px-5 py-3">
                <p className="text-sm font-medium mb-3">{journal.memo}</p>

                {/* Journal Lines Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className={cn("border-b font-medium uppercase tracking-wider", isDark ? "border-slate-800 bg-slate-900/30 text-slate-400" : "border-slate-200 bg-slate-100/50 text-slate-600")}>
                      <tr>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Account Name</th>
                        <th className="px-3 py-2">Line Description</th>
                        <th className="px-3 py-2 text-right">Debit (TZS)</th>
                        <th className="px-3 py-2 text-right">Credit (TZS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {journal.lines.map((line, idx) => (
                        <tr key={idx} className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50/50"}>
                          <td className="px-3 py-2 font-mono font-semibold text-primary">{line.account_code}</td>
                          <td className="px-3 py-2 font-medium">{line.account_name}</td>
                          <td className="px-3 py-2 text-slate-500">{line.description || "—"}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-500">
                            {line.debit > 0 ? line.debit.toLocaleString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-teal-500">
                            {line.credit > 0 ? line.credit.toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Posted by: {journal.posted_by || "System Automated"}</span>
                  <span>Timestamp: {new Date(journal.created_at).toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Journal Entry Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-3xl", isDark ? "bg-[#0d0d12] border-slate-800 text-slate-100" : "bg-white border-slate-200")}>
          <DialogHeader>
            <DialogTitle>Post General Ledger Journal Entry</DialogTitle>
            <DialogDescription className={isDark ? "text-slate-400" : "text-slate-500"}>
              Multi-line double entry transaction. Total debits must strictly equal total credits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs">Entry Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs">Reference Type *</Label>
                <Select value={referenceType} onValueChange={(val: any) => setReferenceType(val)}>
                  <SelectTrigger className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Adjustment</SelectItem>
                    <SelectItem value="invoice">Sales Invoice</SelectItem>
                    <SelectItem value="supplier_bill">Supplier Bill</SelectItem>
                    <SelectItem value="supplier_payment">Supplier Payment</SelectItem>
                    <SelectItem value="payroll">Payroll Run</SelectItem>
                    <SelectItem value="tax">Tax Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="refNum" className="text-xs">Reference Number</Label>
                <Input
                  id="refNum"
                  placeholder="e.g. PV-2026-99"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="memo" className="text-xs">Memo / Transaction Narrative *</Label>
              <Input
                id="memo"
                placeholder="e.g. Monthly cloud server depreciation and network hosting allocation"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className={isDark ? "bg-slate-900 border-slate-800" : "border-slate-200"}
                required
              />
            </div>

            {/* Dynamic Lines */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider">Transaction Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Row
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-500/5">
                    <div className="flex-1 w-full sm:w-auto">
                      <Select
                        value={line.account_id}
                        onValueChange={(val) => updateLineAccount(idx, val)}
                      >
                        <SelectTrigger className="h-8 text-xs font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder="Credit TZS"
                        value={line.credit || ""}
                        onChange={e => updateLineValue(idx, "credit", e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                      <Input
                        placeholder="Line description"
                        value={line.description}
                        onChange={e => updateLineValue(idx, "description", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(idx)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Equilibrium Tally Bar */}
              <div className={cn(
                "p-3 rounded-lg border flex flex-col sm:flex-row items-center justify-between text-xs font-mono font-semibold",
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

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isBalanced}
                className="bg-[#000080] text-white hover:bg-[#000080]/90"
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
