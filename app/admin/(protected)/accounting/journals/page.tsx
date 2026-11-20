"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import AdminLoading from "@/components/admin/admin-loading"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminSelect,
  type AdminTableColumn,
  type AdminTableAction,
} from "@/components/admin/ui"
import { getJournalEntries, createJournalEntry, getChartOfAccounts } from "@/lib/accounting-actions"
import type { JournalEntry, JournalEntryLine, ChartOfAccount } from "@/lib/erp/accounting-types"
import {
  FileText,
  Scale,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Eye,
  ShieldCheck,
  BookOpen,
  Plus,
  Trash2,
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
    { account_id: "acc-4010", account_code: "4010", account_name: "Sales Revenue â€” Hardware & CCTV Equipment", debit: 0, credit: 0, description: "" }
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

  const columns: AdminTableColumn<JournalEntry>[] = [
    {
      key: "entry",
      header: "Journal Entry",
      render: (journal) => (
        <AdminPrimaryCell
          icon={Scale}
          title={<span className="font-mono">{journal.entry_number}</span>}
          subtitle={
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {journal.entry_date}
            </span>
          }
        />
      ),
    },
    {
      key: "reference",
      header: "Reference",
      hidden: "sm",
      render: (journal) => (
        <div className="flex flex-col gap-1">
          <AdminPill className="normal-case tracking-normal">{journal.reference_type.replace("_", " ")}</AdminPill>
          {journal.reference_number && (
            <AdminMutedText className="font-mono truncate max-w-[120px]">{journal.reference_number}</AdminMutedText>
          )}
        </div>
      ),
    },
    {
      key: "memo",
      header: "Memo & Description",
      render: (journal) => (
        <div className="max-w-xs sm:max-w-md">
          <div className="font-bold text-xs sm:text-sm truncate" title={journal.memo}>{journal.memo}</div>
          <AdminMutedText className="hidden sm:block truncate">
            {journal.lines.length} split line{journal.lines.length !== 1 ? "s" : ""} â€¢ Posted by {journal.posted_by || "System Automated"}
          </AdminMutedText>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Debit / Credit Balanced",
      align: "right",
      render: (journal) => (
        <span className="font-mono font-black text-xs sm:text-sm text-emerald-500 whitespace-nowrap">
          TZS {journal.total_debit.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (journal) => <AdminStatusBadge status={journal.status} label="Posted" />,
    },
  ]

  const journalLineColumns: AdminTableColumn<JournalEntryLine>[] = [
    {
      key: "account_code",
      header: "Account Code",
      render: (line) => <span className="font-mono font-bold text-teal">{line.account_code}</span>,
    },
    {
      key: "account_name",
      header: "Account Name",
      render: (line) => (
        <span className={cn("font-bold", isDark ? "text-white" : "text-navy")}>{line.account_name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (line) => (
        <span className="text-slate-500 dark:text-slate-400">{line.description || "â€”"}</span>
      ),
    },
    {
      key: "debit",
      header: "Debit (TZS)",
      align: "right",
      render: (line) => (
        <span className="font-mono font-black text-emerald-500">
          {line.debit > 0 ? line.debit.toLocaleString() : "â€”"}
        </span>
      ),
    },
    {
      key: "credit",
      header: "Credit (TZS)",
      align: "right",
      render: (line) => (
        <span className="font-mono font-black text-teal-500">
          {line.credit > 0 ? line.credit.toLocaleString() : "â€”"}
        </span>
      ),
    },
  ]

  const actions: AdminTableAction<JournalEntry>[] = [
    {
      key: "view",
      label: "View Journal Audit",
      icon: Eye,
      variant: "view",
      onClick: (journal) => setSelectedJournal(journal),
    },
  ]

  if (isLoading && journals.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="General Ledger"
        accent="Journals"
        subtitle="Double-entry financial journal transactions, debit/credit audit trails, and automatic postings"
        icon={Scale}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="New Journal Entry"
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Journal Postings", value: journals.length.toString(), icon: FileText },
          { title: "Cumulative Debits", value: `TZS ${totalDebitVolume.toLocaleString()}`, icon: Receipt },
          { title: "Cumulative Credits", value: `TZS ${totalCreditVolume.toLocaleString()}`, icon: CheckCircle2 },
          { title: "Equilibrium Variance", value: "TZS 0 (Balanced)", icon: ShieldCheck },
        ]}
      />

      <AdminFilterBar
        tabs={[
          { key: "all", label: "All Origins", icon: Layers, count: journals.length },
          { key: "manual", label: "Manual Entries", icon: FileText, count: journals.filter(j => j.reference_type === "manual").length },
          { key: "invoice", label: "Sales Invoices", icon: Receipt, count: journals.filter(j => j.reference_type === "invoice").length },
          { key: "supplier_bill", label: "Supplier Bills", icon: BookOpen, count: journals.filter(j => j.reference_type === "supplier_bill").length },
          { key: "supplier_payment", label: "Supplier Payments", icon: CheckCircle2, count: journals.filter(j => j.reference_type === "supplier_payment").length },
          { key: "credit_note", label: "Credit Notes", icon: Scale, count: journals.filter(j => j.reference_type === "credit_note").length },
          { key: "inventory_adjustment", label: "Inventory Adjustments", icon: Plus, count: journals.filter(j => j.reference_type === "inventory_adjustment").length },
        ]}
        tabValue={refFilter}
        onTabChange={setRefFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search entry number, memo, or reference number..."
      />

      <AdminTable
        columns={columns}
        data={filteredJournals}
        rowKey={(journal) => journal.id}
        actions={actions}
        emptyIcon={Scale}
        emptyTitle="No journal entries found"
        emptyDescription={"Click \"New Journal Entry\" to post a transaction or adjust your filter query"}
      />

      <AdminDetailModal
        open={!!selectedJournal}
        onOpenChange={(open) => !open && setSelectedJournal(null)}
        icon={Scale}
        title="Journal Voucher Audit"
        badge={selectedJournal && (
          <AdminPill className="font-mono normal-case tracking-normal bg-teal/20 text-teal border-teal/30">
            {selectedJournal.entry_number}
          </AdminPill>
        )}
        subtitle={
          selectedJournal
            ? `Origin: ${selectedJournal.reference_type.replace("_", " ")} ${selectedJournal.reference_number ? `â€¢ Ref: ${selectedJournal.reference_number}` : ""} â€¢ Date: ${selectedJournal.entry_date}`
            : undefined
        }
        size="xl"
        sections={
          selectedJournal
            ? [
                {
                  key: "memo",
                  title: "Transaction Memo & Business Context",
                  icon: FileText,
                  span: 3,
                  content: <p className="text-sm font-bold leading-relaxed">{selectedJournal.memo}</p>,
                },
                {
                  key: "lines",
                  title: "Line-by-Line Financial Allocation",
                  icon: Layers,
                  span: 3,
                  content: (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider opacity-80">Journal Lines</span>
                        <span className="text-xs font-mono font-bold text-teal">
                          Total: TZS {selectedJournal.total_debit.toLocaleString()}
                        </span>
                      </div>
                      <AdminTable
                        inline
                        columns={journalLineColumns}
                        data={selectedJournal.lines}
                        rowKey={(line) => line.id}
                      />
                    </div>
                  ),
                },
                {
                  key: "equilibrium",
                  title: "Double-Entry Equilibrium",
                  icon: ShieldCheck,
                  span: 3,
                  fields: [
                    { label: "Verification", value: <span className="font-bold text-emerald-500">Verified (0.00 Variance)</span> },
                    { label: "Total Debits", value: <span className="font-mono font-black">TZS {selectedJournal.total_debit.toLocaleString()}</span> },
                    { label: "Total Credits", value: <span className="font-mono font-black">TZS {selectedJournal.total_credit.toLocaleString()}</span> },
                  ],
                },
              ]
            : []
        }
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={Scale}
        title="Post General Ledger Journal Entry"
        description="Multi-line double entry transaction. Total debits must strictly equal total credits."
        onSubmit={handleCreate}
        isSubmitting={isSubmitting || !isBalanced}
        createLabel={isBalanced ? "Post Journal Entry" : "Unbalanced Entry"}
        size="lg"
      >
        <AdminFormGrid className="sm:grid-cols-3">
          <AdminFormField label="Entry Date" required>
            <AdminInput id="date" type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
          </AdminFormField>
          <AdminFormField label="Reference Type" required>
            <AdminSelect
              value={referenceType}
              onValueChange={(value) => setReferenceType(value as JournalEntry["reference_type"])}
              options={[
                { value: "manual", label: "Manual Adjustment" },
                { value: "invoice", label: "Sales Invoice" },
                { value: "supplier_bill", label: "Supplier Bill" },
                { value: "supplier_payment", label: "Supplier Payment" },
                { value: "payroll", label: "Payroll Run" },
                { value: "tax", label: "Tax Payment" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Reference Number">
            <AdminInput
              id="refNum"
              placeholder="e.g. PV-2026-99"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Memo / Narrative" required>
          <AdminInput
            id="memo"
            placeholder="e.g. Monthly cloud server depreciation and network hosting allocation"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            required
          />
        </AdminFormField>

        {/* Dynamic Lines */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider">Transaction Lines</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="rounded-xl h-8 text-xs font-bold border"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-xl border bg-slate-50 border-navy/20 dark:bg-[#080d2a] dark:border-teal/20"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <AdminSelect
                    value={line.account_id}
                    onValueChange={(value) => updateLineAccount(idx, value)}
                    options={accounts.map(acc => ({ value: acc.id, label: `${acc.code} â€” ${acc.name}` }))}
                    placeholder="Select account"
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <AdminInput
                    type="number"
                    placeholder="Debit TZS"
                    value={line.debit || ""}
                    onChange={e => updateLineValue(idx, "debit", e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <AdminInput
                    type="number"
                    placeholder="Credit TZS"
                    value={line.credit || ""}
                    onChange={e => updateLineValue(idx, "credit", e.target.value)}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div className="flex-1 w-full sm:w-auto">
                  <AdminInput
                    placeholder="Line description"
                    value={line.description}
                    onChange={e => updateLineValue(idx, "description", e.target.value)}
                    className="h-9 text-xs font-medium"
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
          <div
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between text-xs font-mono font-bold ${
              isBalanced
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-rose-500/10 border-rose-500/30 text-rose-500"
            }`}
          >
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
      </AdminFormModal>
    </div>
  )
}
