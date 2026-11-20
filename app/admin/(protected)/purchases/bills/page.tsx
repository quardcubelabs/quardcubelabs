"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminDetailModal,
  AdminFilterBar,
  AdminFormField,
  AdminFormGrid,
  AdminFormModal,
  AdminInput,
  AdminMutedText,
  AdminPageHeader,
  AdminPill,
  AdminPrimaryCell,
  AdminSelect,
  AdminStats,
  AdminStatusBadge,
  AdminTable,
  AdminTextarea,
  type AdminFilterTab,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/ui"
import { getSupplierBills, createSupplierBill, recordBillPayment } from "@/lib/supplier-bill-actions"
import { SupplierBill, SupplierBillItem } from "@/lib/erp/accounting-types"
import {
  Receipt,
  Clock,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Eye,
  Layers,
  AlertTriangle,
  XCircle,
} from "lucide-react"

export default function SupplierBillsPage() {
  const { toast } = useToast()

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
    {
      product_id: 1,
      name: "Hikvision 4K AcuSense ColorVu IP Dome Camera",
      quantity: 5,
      unit_cost: 285000,
      total_cost: 1425000,
    },
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
        variant: "destructive",
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
      {
        product_id: Date.now(),
        name: "Surveillance / Network Accessory",
        quantity: 1,
        unit_cost: 50000,
        total_cost: 50000,
      },
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

  const handleCreateBill = async (e: FormEvent) => {
    e.preventDefault()
    if (!supplierName) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required.",
        variant: "destructive",
      })
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
        created_by: "Administrator",
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

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedBill) return
    if (paymentAmount <= 0 || paymentAmount > selectedBill.balance_due) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be between 1 and the balance due.",
        variant: "destructive",
      })
      return
    }

    setIsPaymentSubmitting(true)
    try {
      await recordBillPayment(selectedBill.id, paymentAmount, paymentMethod)
      toast({
        title: "Payment Recorded",
        description: `TZS ${paymentAmount.toLocaleString()} paid towards bill ${selectedBill.bill_number}.`,
      })
      setIsPaymentOpen(false)
      loadData()
    } catch {
      toast({ title: "Payment Error", description: "Failed to record bill payment.", variant: "destructive" })
    } finally {
      setIsPaymentSubmitting(false)
    }
  }

  const filteredBills = bills.filter((b) => {
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

  const statusTabs: AdminFilterTab[] = [
    { key: "all", label: "All Bills", icon: Layers, count: bills.length },
    {
      key: "open",
      label: "Open (Unpaid)",
      icon: Clock,
      count: bills.filter((b) => b.status === "open").length,
    },
    {
      key: "partially_paid",
      label: "Partially Paid",
      icon: AlertTriangle,
      count: bills.filter((b) => b.status === "partially_paid").length,
    },
    {
      key: "paid",
      label: "Fully Settled",
      icon: CheckCircle2,
      count: bills.filter((b) => b.status === "paid").length,
    },
    {
      key: "overdue",
      label: "Overdue",
      icon: XCircle,
      count: bills.filter((b) => b.status === "overdue").length,
    },
  ]

  const columns: AdminTableColumn<SupplierBill>[] = [
    {
      key: "bill",
      header: "Bill # & Vendor",
      render: (bill) => (
        <AdminPrimaryCell
          icon={Receipt}
          title={bill.bill_number}
          subtitle={bill.supplier_name}
        />
      ),
    },
    {
      key: "po_number",
      header: "PO Reference",
      hidden: "md",
      render: (bill) => <AdminPill>{bill.po_number || "Direct"}</AdminPill>,
    },
    {
      key: "dates",
      header: "Dates",
      hidden: "sm",
      render: (bill) => (
        <div className="min-w-0">
          <span className="block font-mono text-[11px]">{bill.bill_date}</span>
          <AdminMutedText className="block font-mono text-[10px]">Due: {bill.due_date}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total Volume",
      align: "right",
      render: (bill) => <span className="font-mono font-black">TZS {bill.total.toLocaleString()}</span>,
    },
    {
      key: "balance_due",
      header: "Balance Due",
      align: "right",
      render: (bill) => (
        <span className="font-mono font-black text-amber-500">
          TZS {bill.balance_due.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (bill) => (
        <AdminStatusBadge status={bill.status} label={bill.status.replace("_", " ")} />
      ),
    },
  ]

  const billItemColumns: AdminTableColumn<SupplierBillItem>[] = [
    {
      key: "item",
      header: "Item Description",
      render: (item) => <span className="font-bold">{item.name}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "center",
      render: (item) => <span className="font-mono font-bold">{item.quantity}</span>,
    },
    {
      key: "unit_cost",
      header: "Unit Cost (TZS)",
      align: "right",
      render: (item) => <span className="font-mono">{item.unit_cost.toLocaleString()}</span>,
    },
    {
      key: "total_cost",
      header: "Total Cost (TZS)",
      align: "right",
      render: (item) => (
        <span className="font-mono font-black text-teal">{item.total_cost.toLocaleString()}</span>
      ),
    },
  ]

  const actions: AdminTableAction<SupplierBill>[] = [
    {
      key: "view",
      label: "View Bill Details",
      icon: Eye,
      variant: "view",
      onClick: (bill) => setSelectedViewBill(bill),
    },
    {
      key: "payment",
      label: "Disburse Payment",
      icon: CreditCard,
      variant: "soft",
      hide: (bill) => bill.balance_due <= 0,
      onClick: handleOpenPayment,
    },
  ]

  if (isLoading && bills.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Supplier Bills &"
        accent="Payables"
        subtitle="Vendor invoice tracking, purchase order settlement, and trade liability management"
        icon={Receipt}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Create Supplier Bill"
      />

      <AdminStats
        columns={4}
        items={[
          {
            title: `Total Liabilities (${bills.length} invoices)`,
            value: `TZS ${totalBillsVolume.toLocaleString()}`,
            icon: Receipt,
          },
          {
            title: "Outstanding Balance (Unsettled)",
            value: `TZS ${totalBalanceDue.toLocaleString()}`,
            icon: Clock,
          },
          {
            title: "Disbursed Payments (Bank/Till)",
            value: `TZS ${totalPaidVolume.toLocaleString()}`,
            icon: CheckCircle2,
          },
          {
            title: "Settlement Rate (Disbursement Ratio)",
            value:
              totalBillsVolume > 0
                ? `${Math.round((totalPaidVolume / totalBillsVolume) * 100)}%`
                : "100%",
            icon: ShieldCheck,
          },
        ]}
      />

      <AdminFilterBar
        tabs={statusTabs}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search bill number, vendor, PO number..."
      />

      <AdminTable
        columns={columns}
        data={filteredBills}
        rowKey={(bill) => bill.id}
        actions={actions}
        emptyIcon={Receipt}
        emptyTitle="No supplier bills found"
        emptyDescription="Try adjusting your filters or search keyword"
      />

      {/* View Bill Details Modal */}
      <AdminDetailModal
        open={!!selectedViewBill}
        onOpenChange={(open) => !open && setSelectedViewBill(null)}
        icon={Receipt}
        title={selectedViewBill?.supplier_name || "Bill Details"}
        subtitle={
          selectedViewBill
            ? `PO Ref: ${selectedViewBill.po_number || "Direct"} â€¢ Bill Date: ${selectedViewBill.bill_date} â€¢ Due Date: ${selectedViewBill.due_date}`
            : undefined
        }
        badge={
          selectedViewBill ? (
            <span className="rounded-md border border-teal/30 bg-teal/20 px-2.5 py-0.5 font-mono text-sm font-black text-teal">
              {selectedViewBill.bill_number}
            </span>
          ) : undefined
        }
        size="lg"
        sections={[
          {
            key: "financial",
            title: "Financial Balance",
            icon: ShieldCheck,
            span: 3,
            content: (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="block text-xs font-black uppercase tracking-wider opacity-70">
                    Total Bill Amount
                  </span>
                  <div className="mt-0.5 font-mono text-2xl font-black tracking-tight sm:text-3xl">
                    TZS {selectedViewBill?.total.toLocaleString()}
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="block text-xs font-black uppercase tracking-wider opacity-70">
                    Outstanding Balance Due
                  </span>
                  <div className="mt-0.5 font-mono text-xl font-black text-amber-500 sm:text-2xl">
                    TZS {selectedViewBill?.balance_due.toLocaleString()}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "line_items",
            title: `Purchased Line Items (${selectedViewBill?.items.length || 0})`,
            icon: Receipt,
            span: 2,
            content: (
              <AdminTable
                inline
                columns={billItemColumns}
                data={selectedViewBill?.items ?? []}
                rowKey={(item) => item.id ?? item.product_id ?? item.name}
              />
            ),
          },
          {
            key: "bill_info",
            title: "Bill Information",
            icon: Layers,
            fields: [
              { label: "Bill Number", value: selectedViewBill?.bill_number || "â€”" },
              { label: "Supplier", value: selectedViewBill?.supplier_name || "â€”" },
              { label: "PO Reference", value: selectedViewBill?.po_number || "Direct" },
              { label: "Payment Terms", value: selectedViewBill?.payment_terms || "â€”" },
              { label: "Amount Paid", value: `TZS ${selectedViewBill?.amount_paid.toLocaleString()}` },
              {
                label: "Status",
                value: (
                  <AdminStatusBadge
                    status={selectedViewBill?.status}
                    label={selectedViewBill?.status.replace("_", " ")}
                  />
                ),
              },
            ],
          },
          ...(selectedViewBill?.notes
            ? [
                {
                  key: "notes",
                  title: "Notes",
                  icon: AlertTriangle,
                  span: 3 as const,
                  content: <p className="text-xs leading-relaxed opacity-90">{selectedViewBill.notes}</p>,
                },
              ]
            : []),
        ]}
        footerActions={
          selectedViewBill && selectedViewBill.balance_due > 0
            ? [
                <Button
                  key="pay"
                  onClick={() => {
                    const bill = selectedViewBill
                    setSelectedViewBill(null)
                    handleOpenPayment(bill)
                  }}
                  className="gap-1.5 bg-navy font-bold text-white hover:bg-navy/90"
                >
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  Pay Bill Now
                </Button>,
              ]
            : undefined
        }
      />

      {/* Create Supplier Bill Modal */}
      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={Receipt}
        title="Create Supplier Bill (Accounts Payable)"
        description="Record official supplier liability and auto-post Inventory & Accounts Payable GL journals."
        onSubmit={handleCreateBill}
        isSubmitting={isSubmitting}
        size="lg"
        createLabel="Post Supplier Bill"
      >
        <AdminFormGrid>
          <AdminFormField label="Supplier / Vendor Name" required>
            <AdminInput
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
            />
          </AdminFormField>
          <AdminFormField label="Supplier Email">
            <AdminInput
              type="email"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Purchase Order Ref">
            <AdminInput
              monospace
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Payment Terms">
            <AdminSelect
              value={paymentTerms}
              onValueChange={setPaymentTerms}
              options={[
                { value: "Net 15", label: "Net 15" },
                { value: "Net 30", label: "Net 30" },
                { value: "Net 60", label: "Net 60" },
                { value: "Due on Receipt", label: "Due on Receipt" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Bill Date" required>
            <AdminInput
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              required
            />
          </AdminFormField>
          <AdminFormField label="Due Date" required>
            <AdminInput
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider">Purchased Line Items</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItemRow}
              className="h-8 gap-1 text-xs font-bold"
            >
              <span className="text-base leading-none">+</span> Add Item
            </Button>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-xl border border-navy/20 p-2.5 sm:flex-row sm:items-center dark:border-teal/30"
              >
                <div className="w-full flex-1">
                  <AdminInput
                    placeholder="Item name / description"
                    value={item.name}
                    onChange={(e) => updateItemRow(idx, "name", e.target.value)}
                  />
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <div className="w-20">
                    <AdminInput
                      monospace
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                    />
                  </div>
                  <div className="flex-1 sm:w-32">
                    <AdminInput
                      monospace
                      type="number"
                      placeholder="Unit Cost TZS"
                      value={item.unit_cost}
                      onChange={(e) => updateItemRow(idx, "unit_cost", e.target.value)}
                    />
                  </div>
                  <div className="w-24 shrink-0 text-right font-mono text-xs font-black text-teal sm:w-28">
                    TZS {item.total_cost.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 rounded-xl border border-navy/20 p-3 text-xs font-medium dark:border-teal/30">
            <div className="flex justify-between">
              <span className="opacity-70">Subtotal:</span>
              <span className="font-mono font-bold">TZS {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">TRA VAT (18%):</span>
              <span className="font-mono font-bold">TZS {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-navy/10 pt-1 text-sm font-black text-teal dark:border-teal/20">
              <span>Total Bill Amount:</span>
              <span className="font-mono">TZS {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <AdminFormField label="Notes">
          <AdminTextarea
            placeholder="Optional payment terms, delivery references, or accounting notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>

      {/* Record Payment Modal */}
      <AdminFormModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        icon={CreditCard}
        title="Disburse Supplier Payment"
        description="Clears trade accounts payable and credits corporate bank/cash."
        onSubmit={handleRecordPayment}
        isSubmitting={isPaymentSubmitting}
        size="sm"
        createLabel="Confirm & Disburse Payment"
      >
        {selectedBill && (
          <>
            <div className="space-y-1.5 rounded-xl border border-navy/20 p-3.5 text-sm dark:border-teal/30">
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
                <span className="font-mono font-black text-amber-500">
                  TZS {selectedBill.balance_due.toLocaleString()}
                </span>
              </div>
            </div>

            <AdminFormField label="Payment Account / Channel" required>
              <AdminSelect
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                options={[
                  { value: "CRDB Bank Transfer", label: "CRDB Corporate Operational Bank" },
                  { value: "Main Office Vault Cash", label: "Main Office Vault Cash" },
                  { value: "Selcom Merchant Float", label: "Selcom Merchant Gateway Float" },
                  { value: "Vodacom M-Pesa Till", label: "Vodacom M-Pesa Merchant Till" },
                ]}
              />
            </AdminFormField>

            <AdminFormField label="Disbursement Amount (TZS)" required>
              <AdminInput
                monospace
                type="number"
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                className="text-base font-black sm:text-lg"
                required
              />
            </AdminFormField>
          </>
        )}
      </AdminFormModal>
    </div>
  )
}
