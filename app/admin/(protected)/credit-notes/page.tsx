"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
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
  type AdminTableColumn,
  type AdminTableAction,
  type AdminStatItem,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getCreditNotes, createCreditNote } from "@/lib/credit-note-actions"
import type { CreditNote, CreditNoteItem } from "@/lib/erp/types"
import {
  RotateCcw,
  TrendingDown,
  DollarSign,
  Receipt,
  QrCode,
  ShieldCheck,
  Eye,
  Plus,
  Trash2,
  FileText,
} from "lucide-react"

const DEFAULT_ITEM: CreditNoteItem = {
  id: "1",
  product_id: 1,
  name: "Hikvision Surveillance Hardware Return",
  quantity: 1,
  unit_price: 285000,
  total: 285000
}

const formatMoney = (value: number) => `TZS ${(value || 0).toLocaleString()}`

export default function CreditNotesPage() {
  const { toast } = useToast()

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedViewCreditNote, setSelectedViewCreditNote] = useState<CreditNote | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [reason, setReason] = useState("")
  const [items, setItems] = useState<CreditNoteItem[]>([DEFAULT_ITEM])

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

  const resetForm = () => {
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
    setInvoiceNumber("")
    setReason("")
    setItems([{ ...DEFAULT_ITEM }])
  }

  const addItemRow = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        product_id: Date.now(),
        name: "Surplus Component Return",
        quantity: 1,
        unit_price: 50000,
        total: 50000
      }
    ])
  }

  const removeItemRow = (idx: number) => {
    if (items.length <= 1) {
      toast({
        title: "Requirement",
        description: "At least one credit item is required.",
        variant: "destructive"
      })
      return
    }
    setItems(items.filter((_, i) => i !== idx))
  }

  const updateItemRow = (idx: number, field: "name" | "quantity" | "unit_price", val: string) => {
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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = Math.round(subtotal * 0.18)
  const totalCredit = subtotal + taxAmount

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!customerName || !customerEmail) {
      toast({
        title: "Validation Error",
        description: "Customer name and email are required.",
        variant: "destructive"
      })
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
      toast({
        title: "Credit Note Issued",
        description: "Credit voucher issued with QR verification token."
      })
      setIsCreateOpen(false)
      resetForm()
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Failed to issue credit note.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = creditNotes.filter((cn) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      cn.credit_note_number.toLowerCase().includes(q) ||
      cn.customer_name.toLowerCase().includes(q) ||
      (cn.invoice_number && cn.invoice_number.toLowerCase().includes(q)) ||
      (cn.reason && cn.reason.toLowerCase().includes(q))
    const matchesStatus = statusFilter === "all" || cn.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCreditIssued = creditNotes.reduce((sum, cn) => sum + cn.total_credit, 0)
  const totalCreditRemaining = creditNotes.reduce((sum, cn) => sum + cn.remaining_credit, 0)
  const openCreditNotesCount = creditNotes.filter(
    (cn) => cn.status === "open" || cn.status === "partially_allocated"
  ).length

  const stats: AdminStatItem[] = [
    { title: "Total Credit Notes", value: creditNotes.length.toString(), icon: RotateCcw },
    { title: "Issued Valuation", value: formatMoney(totalCreditIssued), icon: TrendingDown },
    { title: "Unallocated Float", value: formatMoney(totalCreditRemaining), icon: DollarSign },
    { title: "Open Credit Files", value: openCreditNotesCount.toString(), icon: Receipt }
  ]

  const statuses: AdminFilterTab[] = [
    { key: "all", label: "All Notes", icon: Receipt, count: creditNotes.length },
    {
      key: "open",
      label: "Open Floating",
      icon: RotateCcw,
      count: creditNotes.filter((cn) => cn.status === "open").length
    },
    {
      key: "partially_allocated",
      label: "Partially Allocated",
      icon: DollarSign,
      count: creditNotes.filter((cn) => cn.status === "partially_allocated").length
    },
    {
      key: "closed",
      label: "Fully Reconciled",
      icon: ShieldCheck,
      count: creditNotes.filter((cn) => cn.status === "closed").length
    }
  ]

  const columns: AdminTableColumn<CreditNote>[] = [
    {
      key: "number",
      header: "Credit Note",
      render: (cn) => (
        <AdminPrimaryCell
          icon={RotateCcw}
          title={<span className="font-mono">{cn.credit_note_number}</span>}
          subtitle={`Issued ${cn.credit_date}`}
        />
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (cn) => (
        <div className="min-w-0">
          <span
            className="font-bold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs block"
            title={cn.customer_name}
          >
            {cn.customer_name}
          </span>
          <AdminMutedText className="block truncate max-w-[150px] sm:max-w-xs">
            {cn.customer_email}
          </AdminMutedText>
        </div>
      )
    },
    {
      key: "invoice",
      header: "Invoice Ref",
      hidden: "sm",
      render: (cn) => (
        <AdminPill className="font-mono">{cn.invoice_number || "FLOAT"}</AdminPill>
      )
    },
    {
      key: "credit",
      header: "Credit Amount",
      align: "right",
      render: (cn) => (
        <span className="font-black font-mono text-xs sm:text-sm text-rose-500 whitespace-nowrap">
          {formatMoney(cn.total_credit)}
        </span>
      )
    },
    {
      key: "remaining",
      header: "Remaining Float",
      align: "right",
      render: (cn) => (
        <span className="font-black font-mono text-xs sm:text-sm whitespace-nowrap">
          {formatMoney(cn.remaining_credit)}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (cn) => <AdminStatusBadge status={cn.status} />
    }
  ]

  const actions: AdminTableAction<CreditNote>[] = [
    {
      key: "view",
      label: "View Credit Note Details",
      icon: Eye,
      variant: "view",
      onClick: (cn) => setSelectedViewCreditNote(cn)
    },
    {
      key: "verify",
      label: "Public Verification QR",
      icon: QrCode,
      variant: "soft",
      mobile: false,
      hide: (cn) => !cn.verification_url,
      href: (cn) => cn.verification_url || "",
      external: true
    }
  ]

  const creditItemColumns: AdminTableColumn<CreditNoteItem>[] = [
    {
      key: "description",
      header: "Description",
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "quantity",
      header: "Qty",
      align: "right",
      render: (item) => <span className="font-medium font-mono">{item.quantity}</span>,
    },
    {
      key: "unit-price",
      header: "Unit Price (TZS)",
      align: "right",
      render: (item) => <span className="font-medium font-mono">{item.unit_price.toLocaleString()}</span>,
    },
    {
      key: "total",
      header: "Total (TZS)",
      align: "right",
      render: (item) => <span className="font-medium font-mono font-bold">{item.total.toLocaleString()}</span>,
    },
  ]

  const detailSections = (cn: CreditNote): AdminDetailSectionData[] => [
    {
      key: "summary",
      title: "Credit Voucher Summary",
      icon: Receipt,
      span: 1,
      fields: [
        { label: "Credit Note Number", value: <span className="font-mono">{cn.credit_note_number}</span> },
        { label: "Customer", value: cn.customer_name },
        { label: "Customer Email", value: <span className="break-all">{cn.customer_email}</span> },
        { label: "Customer Phone", value: cn.customer_phone || "—" },
        { label: "Invoice Reference", value: <span className="font-mono">{cn.invoice_number || "Standalone Credit"}</span> },
        { label: "Issue Date", value: <span className="font-mono">{cn.credit_date}</span> },
        { label: "Status", value: <AdminStatusBadge status={cn.status} /> },
        { label: "Created", value: new Date(cn.created_at).toLocaleDateString() }
      ]
    },
    {
      key: "financial",
      title: "Financial Breakdown",
      icon: DollarSign,
      span: 1,
      fields: [
        { label: "Subtotal Credit", value: <span className="font-mono">{formatMoney(cn.subtotal)}</span> },
        { label: "TRA 18% Output VAT Reversal", value: <span className="font-mono">{formatMoney(cn.tax_amount)}</span> },
        { label: "Total Credit Issued", value: <span className="font-mono font-black text-rose-500">{formatMoney(cn.total_credit)}</span> },
        { label: "Allocated to Invoices", value: <span className="font-mono font-bold text-teal-500">{formatMoney(cn.amount_allocated)}</span> },
        { label: "Remaining Float", value: <span className="font-mono font-bold text-teal-500">{formatMoney(cn.remaining_credit)}</span> }
      ]
    },
    {
      key: "items",
      title: "Itemized Credit Schedule",
      icon: FileText,
      span: 2,
      content: (
        <AdminTable
          inline
          columns={creditItemColumns}
          data={cn.items}
          rowKey={(item) => `${cn.id}-item-${item.id}`}
          className="text-xs"
        />
      )
    },
    ...(cn.reason
      ? [{
          key: "reason",
          title: "Return / Credit Reason",
          icon: FileText,
          span: 1 as const,
          content: <p className="text-xs leading-relaxed whitespace-pre-wrap">{cn.reason}</p>
        }]
      : []),
    ...(cn.verification_token
      ? [{
          key: "verification",
          title: "Cryptographic Verification",
          icon: ShieldCheck,
          span: 1 as const,
          fields: [
            {
              label: "Verification Token",
              value: <span className="font-mono text-[11px] break-all">{cn.verification_token}</span>
            }
          ]
        }]
      : [])
  ]

  if (isLoading && creditNotes.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Customer"
        accent="Credit Notes"
        subtitle="Sales returns, invoice adjustments, receivable write-backs, and cryptographic verification"
        icon={RotateCcw}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Issue Credit Note"
      />

      <AdminStats items={stats} columns={4} />

      <AdminFilterBar
        tabs={statuses}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search credit note number, customer name, invoice ref, or return justification..."
      />

      <AdminTable
        columns={columns}
        data={filtered}
        rowKey={(cn) => cn.id}
        actions={actions}
        emptyIcon={RotateCcw}
        emptyTitle="No credit notes found"
        emptyDescription="Click ‘Issue Credit Note’ to register a customer adjustment."
      />

      <AdminDetailModal
        open={!!selectedViewCreditNote}
        onOpenChange={(open) => !open && setSelectedViewCreditNote(null)}
        icon={RotateCcw}
        title={
          selectedViewCreditNote ? (
            <span className="font-mono">{selectedViewCreditNote.credit_note_number}</span>
          ) : (
            ""
          )
        }
        badge={selectedViewCreditNote && <AdminStatusBadge status={selectedViewCreditNote.status} />}
        subtitle={
          selectedViewCreditNote &&
          `Issued: ${selectedViewCreditNote.credit_date} • Customer: ${selectedViewCreditNote.customer_name}`
        }
        sections={selectedViewCreditNote ? detailSections(selectedViewCreditNote) : []}
        size="xl"
        footerActions={
          selectedViewCreditNote?.verification_url ? (
            <a
              href={selectedViewCreditNote.verification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md inline-flex items-center text-xs"
            >
              <QrCode className="w-4 h-4 text-teal" />
              Public Verification QR
            </a>
          ) : undefined
        }
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}
        icon={RotateCcw}
        title="Issue Customer Credit Note"
        description="Creates an anti-fraud verified credit voucher and adjusts Accounts Receivable in General Ledger."
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        createLabel="Issue & Verify Credit Note"
        size="xl"
      >
        <AdminFormGrid>
          <AdminFormField label="Customer Name" required>
            <AdminInput
              required
              placeholder="e.g. Bakhresa Food Products Ltd"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Customer Email" required>
            <AdminInput
              required
              type="email"
              placeholder="e.g. security@bakhresa.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Customer Phone">
            <AdminInput
              placeholder="+255 7..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Original Invoice Ref">
            <AdminInput
              monospace
              placeholder="e.g. INV-2026-1001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Reason for Credit">
          <AdminInput
            placeholder="e.g. Return of 1 uninstalled 4K Dome Camera"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </AdminFormField>

        <div className="space-y-2 border-t border-navy/10 dark:border-teal/20 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider">Credit Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-navy/15 dark:border-teal/20">
                <AdminInput
                  className="flex-1"
                  placeholder="Description of item or service credit"
                  value={item.name}
                  onChange={(e) => updateItemRow(idx, "name", e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <AdminInput
                    monospace
                    className="w-20"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                  />
                  <AdminInput
                    monospace
                    className="w-32"
                    type="number"
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) => updateItemRow(idx, "unit_price", e.target.value)}
                  />
                  <span className="w-24 text-right font-mono text-xs font-bold text-rose-500 shrink-0">
                    {formatMoney(item.total)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItemRow(idx)}
                    className="h-9 w-9 p-0 shrink-0"
                    title="Remove credit line item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-navy/15 dark:border-teal/20 p-3 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Credit:</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>TRA VAT Credit (18%):</span>
              <span>{formatMoney(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-700/30 text-rose-500">
              <span>Total Credit Issued:</span>
              <span>{formatMoney(totalCredit)}</span>
            </div>
          </div>
        </div>
      </AdminFormModal>
    </div>
  )
}
