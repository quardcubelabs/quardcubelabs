"use client"

import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import AdminLoading from "@/components/admin/admin-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  AdminReceipt,
  ReceiptItem,
  ReceiptTemplateId,
  PaymentMethod,
  getAdminReceipts,
  createAdminReceipt,
  updateReceiptStatus,
  deleteAdminReceipt,
} from "@/lib/receipt-actions"
import { getAdminInvoices, type AdminInvoice } from "@/lib/invoice-actions"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import { getAllOrders } from "@/lib/admin-actions"
import ReceiptTemplateRenderer from "@/components/admin/receipt-templates"
import DocumentVerificationInfo from "@/components/admin/document-verification-info"
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
  AdminTextarea,
  AdminSelect,
  AdminConfirmDialog,
  AdminModalShell,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import {
  Receipt,
  Eye,
  Printer,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  CreditCard,
  DollarSign,
  User,
  ShieldCheck,
} from "lucide-react"

const TEMPLATE_OPTIONS: { id: ReceiptTemplateId; name: string; desc: string; badge: string }[] = [
  { id: "thermal-80", name: "Thermal 80mm (Standard POS)", desc: "Standard 80mm POS receipt roll with computerized stamp & QR verification", badge: "80mm" },
  { id: "thermal-58", name: "Thermal 58mm (Mini POS)", desc: "Compact 58mm mini roll format for handheld mobile thermal printers", badge: "58mm" },
  { id: "a5", name: "A5 Voucher (Full Page)", desc: "Formal A5 corporate settlement voucher with complete itemized breakdown", badge: "A5" },
]

const PAYMENT_METHODS: PaymentMethod[] = [
  "M-Pesa",
  "Airtel Money",
  "Tigo Pesa",
  "Bank Transfer",
  "Credit Card",
  "Cash",
  "Direct Settlement",
]

const STATUS_OPTIONS: Array<{ value: AdminReceipt["status"]; label: string }> = [
  { value: "issued", label: "Issued" },
  { value: "refunded", label: "Refunded" },
  { value: "voided", label: "Voided" },
]

export default function ReceiptsPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [receipts, setReceipts] = useState<AdminReceipt[]>([])
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplateId>("thermal-80")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa")
  const [transactionRef, setTransactionRef] = useState("")
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [linkOrderValue, setLinkOrderValue] = useState("")
  const [linkInvoiceValue, setLinkInvoiceValue] = useState("")
  const [linkUserValue, setLinkUserValue] = useState("")

  // Detail / Preview & Print State
  const [selectedReceipt, setSelectedReceipt] = useState<AdminReceipt | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [previewReceipt, setPreviewReceipt] = useState<AdminReceipt | null>(null)
  const [activePreviewTemplate, setActivePreviewTemplate] = useState<ReceiptTemplateId>("thermal-80")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Status change state
  const [statusReceipt, setStatusReceipt] = useState<AdminReceipt | null>(null)
  const [editStatus, setEditStatus] = useState<AdminReceipt["status"]>("issued")
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    receipt: AdminReceipt
    status: AdminReceipt["status"]
  } | null>(null)

  // Delete State
  const [receiptToDelete, setReceiptToDelete] = useState<AdminReceipt | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getUserDisplayName = (u: AuthUser) => {
    return (
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      `${u.user_metadata?.firstName || ""} ${u.user_metadata?.lastName || ""}`.trim() ||
      u.email?.split("@")[0] ||
      "User"
    )
  }

  // Load Data
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [receiptsData, invoicesData, usersResult, ordersData] = await Promise.all([
        getAdminReceipts(),
        getAdminInvoices().catch(() => []),
        getAuthUsers().catch(() => ({ users: [], error: null })),
        getAllOrders().catch(() => []),
      ])
      setReceipts(receiptsData || [])
      setInvoices(invoicesData || [])
      setUsers(Array.isArray(usersResult?.users) ? usersResult.users : [])
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (err: any) {
      console.error(err)
      setError("Failed to fetch receipts data. Please try again.")
      toast({ title: "Error Loading Data", description: "Failed to fetch receipts.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-fill from Order
  const handleSelectOrder = (orderId: string) => {
    const o = orders.find((ord) => ord.id === orderId || ord.order_number === orderId)
    if (!o) return
    const oNum = o.order_number ? (o.order_number.startsWith("#") ? o.order_number : `#${o.order_number}`) : `#${o.id.slice(0, 8)}`
    setOrderNumber(oNum)
    setCustomerName(o.customerName || "")
    setCustomerEmail(o.customerEmail || "")
    setCustomerPhone(o.customerPhone || "")
    setCustomerAddress(o.shippingAddress || "")
    setAmountPaid(Number(o.total || 0))

    if (Array.isArray(o.items) && o.items.length > 0) {
      const mappedItems: ReceiptItem[] = o.items.map((it: any, idx: number) => ({
        id: String(it.id || idx + 1),
        name: it.product_name || it.name || "Product Item",
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0),
      }))
      setReceiptItems(mappedItems)
    }

    if (o.paymentMethod) {
      const pm = PAYMENT_METHODS.find((m) => m.toLowerCase() === o.paymentMethod?.toLowerCase())
      if (pm) setPaymentMethod(pm)
    }

    setNotes(`Payment settlement for Order ${oNum}`)
  }

  // Link invoice autofill
  const handleSelectInvoice = (invId: string) => {
    const inv = invoices.find((i) => i.id === invId || i.invoice_number === invId)
    if (!inv) return
    setInvoiceNumber(inv.invoice_number)
    setCustomerName(inv.customer_name)
    setCustomerEmail(inv.customer_email)
    setCustomerPhone(inv.customer_phone || "")
    setAmountPaid(Number(inv.total || 0))
    if (inv.items && inv.items.length > 0) {
      setReceiptItems(
        inv.items.map((it, idx) => ({
          id: String(it.id || idx + 1),
          name: it.name || "Service item",
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0),
        }))
      )
    }
  }

  // User autofill
  const handleSelectUser = (userId: string) => {
    const u = users.find((user) => user.id === userId)
    if (!u) return
    setCustomerName(getUserDisplayName(u))
    setCustomerEmail(u.email || "")
    setCustomerPhone(u.phone || u.user_metadata?.phone || "")
  }

  // Check URL query param for orderId / orderNumber
  useEffect(() => {
    if (typeof window !== "undefined" && orders.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const targetOrderId = params.get("orderId") || params.get("orderNumber")
      if (targetOrderId) {
        const existingReceipt = receipts.find(
          (r) => r.order_number === targetOrderId || r.order_number === `#${targetOrderId}` || r.id === targetOrderId
        )
        if (existingReceipt) {
          setPreviewReceipt(existingReceipt)
          setActivePreviewTemplate(existingReceipt.template_id || "qlabs-thermal")
          setIsPreviewOpen(true)
        } else {
          const targetOrder = orders.find((o) => o.id === targetOrderId || o.order_number === targetOrderId)
          if (targetOrder) {
            handleSelectOrder(targetOrder.id)
            setIsCreateOpen(true)
          }
        }
      }
    }
  }, [orders, receipts])

  // Handle Create Receipt
  const handleCreateReceipt = async () => {
    if (!customerName || !customerEmail || amountPaid <= 0) {
      toast({ title: "Missing Information", description: "Customer name, email and valid amount are required.", variant: "destructive" })
      return
    }

    setIsCreating(true)
    try {
      const created = await createAdminReceipt({
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
        },
        invoiceNumber: invoiceNumber || undefined,
        orderNumber: orderNumber || undefined,
        amountPaid,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        paymentDate: paymentDate ? `${paymentDate}T12:00:00.000Z` : undefined,
        items: receiptItems.length > 0 ? receiptItems : undefined,
        notes: notes || undefined,
        templateId: selectedTemplate,
        status: "issued",
      })

      toast({ title: "Receipt Issued", description: `Receipt #${created.receipt_number} created successfully.` })
      setReceipts([created, ...receipts])
      setIsCreateOpen(false)

      // Reset
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setCustomerAddress("")
      setAmountPaid(0)
      setInvoiceNumber("")
      setOrderNumber("")
      setReceiptItems([])
      setTransactionRef("")
      setNotes("")
      setLinkOrderValue("")
      setLinkInvoiceValue("")
      setLinkUserValue("")
    } catch (err: any) {
      toast({ title: "Receipt Creation Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const getPageStyle = () => {
    if (activePreviewTemplate === "a5") {
      return "@page { size: A5 portrait; margin: 8mm; } @media print { body { -webkit-print-color-adjust: exact; margin: 0; } }"
    }
    if (activePreviewTemplate === "thermal-58") {
      return "@page { size: 58mm auto; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; margin: 0; } }"
    }
    return "@page { size: 80mm auto; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; margin: 0; } }"
  }

  // Print trigger
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: previewReceipt ? `Receipt_${previewReceipt.receipt_number}_${activePreviewTemplate}` : "Receipt",
    pageStyle: getPageStyle(),
  })

  // Delete
  const confirmDelete = async () => {
    if (!receiptToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminReceipt(receiptToDelete.id)
      setReceipts((previous) => previous.filter((r) => r.id !== receiptToDelete.id))
      toast({ title: "Deleted", description: `Receipt #${receiptToDelete.receipt_number} removed.` })
      setReceiptToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Status Change
  const handleStatusChange = async (id: string, newStatus: AdminReceipt["status"]) => {
    const updated = await updateReceiptStatus(id, newStatus)
    if (updated) {
      setReceipts((previous) => previous.map((r) => (r.id === id ? updated : r)))
      setSelectedReceipt((previous) => (previous?.id === id ? updated : previous))
      toast({ title: "Status Updated", description: `Receipt status changed to ${newStatus}.` })
    }
  }

  // Stats
  const totalReceipts = receipts.length
  const issuedCount = receipts.filter((r) => r.status === "issued").length
  const totalAmount = receipts.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0)
  const mpesaCount = receipts.filter((r) => r.payment_method === "M-Pesa").length
  const thisMonthCount = receipts.filter((r) => {
    const d = new Date(r.payment_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      const formatted = m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      const formatted = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  // Tabs configuration
  const tabs: AdminFilterTab[] = [
    { key: "all", label: "All Receipts", icon: Receipt, count: receipts.length },
    { key: "issued", label: "Issued", icon: CheckCircle, count: receipts.filter((r) => r.status === "issued").length },
    { key: "refunded", label: "Refunded", icon: RefreshCw, count: receipts.filter((r) => r.status === "refunded").length },
    { key: "voided", label: "Voided", icon: Clock, count: receipts.filter((r) => r.status === "voided").length },
  ]

  // Filtered List
  const filteredReceipts = receipts.filter((r) => {
    if (activeTab !== "all" && r.status !== activeTab) return false
    if (methodFilter !== "all" && r.payment_method !== methodFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchNumber = r.receipt_number.toLowerCase().includes(q)
      const matchName = r.customer_name?.toLowerCase().includes(q)
      const matchRef = r.transaction_ref?.toLowerCase().includes(q)
      const matchEmail = r.customer_email?.toLowerCase().includes(q)
      return matchNumber || matchName || matchRef || matchEmail
    }
    return true
  })

  const columns: AdminTableColumn<AdminReceipt>[] = [
    {
      key: "receipt",
      header: "Receipt #",
      render: (r) => (
        <AdminPrimaryCell
          icon={Receipt}
          title={`#${r.receipt_number}`}
          subtitle={r.order_number ? `Order ${r.order_number}` : r.invoice_number ? `Invoice #${r.invoice_number}` : undefined}
          badge={r.order_number ? <AdminPill title="Linked order">{r.order_number}</AdminPill> : undefined}
        />
      ),
    },
    {
      key: "client",
      header: "Client / Payer",
      render: (r) => <AdminPrimaryCell icon={User} title={r.customer_name || "Unknown Customer"} subtitle={r.customer_email} />,
    },
    {
      key: "amount",
      header: "Amount (TZS)",
      align: "right",
      render: (r) => (
        <span className="whitespace-nowrap font-black text-xs sm:text-sm tracking-tight text-emerald-600 dark:text-emerald-400">
          TZS {Number(r.amount_paid || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "method",
      header: "Payment Method",
      hidden: "sm",
      render: (r) => <AdminPill>{r.payment_method}</AdminPill>,
    },
    {
      key: "tx",
      header: "Tx Code",
      hidden: "md",
      render: (r) => <AdminMutedText className="font-mono">{r.transaction_ref || "-"}</AdminMutedText>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <AdminStatusBadge status={r.status} />,
    },
    {
      key: "date",
      header: "Date",
      hidden: "md",
      render: (r) => (
        <AdminMutedText>
          {r.payment_date ? new Date(r.payment_date).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
        </AdminMutedText>
      ),
    },
  ]

  const actions: AdminTableAction<AdminReceipt>[] = [
    {
      key: "view",
      label: "View receipt details",
      icon: Eye,
      variant: "view",
      onClick: (r) => {
        setSelectedReceipt(r)
        setIsDetailOpen(true)
      },
    },
    {
      key: "preview",
      label: "Preview & Print",
      icon: Printer,
      variant: "soft",
      mobile: false,
      onClick: (r) => {
        setPreviewReceipt(r)
        setActivePreviewTemplate(r.template_id || "modern-corporate")
        setIsPreviewOpen(true)
      },
    },
    {
      key: "delete",
      label: "Delete Receipt",
      icon: Trash2,
      variant: "delete",
      onClick: (r) => setReceiptToDelete(r),
    },
  ]

  const receiptItemColumns: AdminTableColumn<ReceiptItem>[] = [
    {
      key: "item",
      header: "Item",
      render: (item) => <span className="font-bold">{item.name}</span>,
    },
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      render: (item) => <span className="font-mono font-bold">{item.quantity}</span>,
    },
    {
      key: "unit-price",
      header: "Unit Price",
      align: "right",
      render: (item) => <span className="font-mono">TZS {Number(item.price || 0).toLocaleString()}</span>,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      align: "right",
      render: (item) => (
        <span className="font-mono font-bold">
          TZS {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
        </span>
      ),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedReceipt
    ? [
        {
          key: "items",
          title: `Receipt Items (${selectedReceipt.items?.length || 0})`,
          icon: Receipt,
          span: 2,
          content: (
            <AdminTable
              inline
              columns={receiptItemColumns}
              data={selectedReceipt.items || []}
              rowKey={(item) => item.id}
              emptyTitle="No line items recorded on this receipt."
              emptyDescription=""
              className="text-xs"
            />
          ),
        },
        {
          key: "payer",
          title: "Payer",
          icon: User,
          fields: [
            { label: "Name", value: selectedReceipt.customer_name },
            { label: "Email", value: selectedReceipt.customer_email },
            { label: "Phone", value: selectedReceipt.customer_phone || "â€”" },
            { label: "Address", value: selectedReceipt.customer_address || "â€”" },
          ],
        },
        {
          key: "payment",
          title: "Payment",
          icon: CreditCard,
          fields: [
            { label: "Amount Paid", value: `TZS ${Number(selectedReceipt.amount_paid || 0).toLocaleString()}` },
            { label: "Method", value: selectedReceipt.payment_method },
            { label: "Transaction Ref", value: selectedReceipt.transaction_ref || "â€”" },
            {
              label: "Payment Date",
              value: selectedReceipt.payment_date ? new Date(selectedReceipt.payment_date).toLocaleString() : "â€”",
            },
            { label: "Status", value: <AdminStatusBadge status={selectedReceipt.status} /> },
          ],
        },
        {
          key: "verification",
          title: "Verification",
          icon: ShieldCheck,
          fields: [
            { label: "Verification Token", value: selectedReceipt.verification_token || "â€”" },
            { label: "Verification URL", value: selectedReceipt.verification_url || "â€”" },
            { label: "Template", value: selectedReceipt.template_id },
          ],
        },
      ]
    : []

  if (isLoading) {
    return <AdminLoading type="receipts" />
  }

  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
        <AdminPageHeader
          title="Official"
          accent="Receipts"
          subtitle="Issue and track official payment vouchers with scannable QR authentication seals"
          icon={Receipt}
        />
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Official"
        accent="Receipts"
        subtitle="Issue and track official payment vouchers with scannable QR authentication seals"
        icon={Receipt}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Create Receipt"
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Receipts", value: formatStatNumber(totalReceipts), icon: Receipt },
          { title: "Settled / Issued", value: formatStatNumber(issuedCount), icon: CheckCircle, onClick: () => setActiveTab("issued") },
          { title: "This Month", value: formatStatNumber(thisMonthCount), icon: Calendar },
          { title: "M-Pesa Settlements", value: formatStatNumber(mpesaCount), icon: CreditCard, onClick: () => setMethodFilter("M-Pesa") },
          { title: "Total Collected", value: formatStatCurrency(totalAmount), icon: DollarSign },
        ]}
      />

      <AdminFilterBar
        tabs={tabs}
        tabValue={activeTab}
        onTabChange={setActiveTab}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by receipt #, payer name, or transaction code..."
        selects={[
          {
            value: methodFilter,
            onValueChange: setMethodFilter,
            placeholder: "All Methods",
            allLabel: "All Methods",
            options: PAYMENT_METHODS.map((method) => ({ value: method, label: method })),
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredReceipts}
        rowKey={(r) => r.id}
        actions={actions}
        emptyIcon={Receipt}
        emptyTitle="No payment receipts found"
        emptyDescription='Click "Create Receipt" to issue a verified payment voucher'
      />

      <AdminDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        icon={Receipt}
        title={`Receipt #${selectedReceipt?.receipt_number}`}
        subtitle={selectedReceipt?.customer_name}
        badge={selectedReceipt ? <AdminStatusBadge status={selectedReceipt.status} /> : undefined}
        sections={detailSections}
        fields={
          selectedReceipt
            ? [
                { label: "Receipt ID", value: selectedReceipt.id },
                { label: "User ID", value: selectedReceipt.user_id || "â€”" },
                { label: "Invoice Number", value: selectedReceipt.invoice_number || "â€”" },
                { label: "Order Number", value: selectedReceipt.order_number || "â€”" },
                { label: "Notes", value: selectedReceipt.notes || "â€”" },
                { label: "Created", value: new Date(selectedReceipt.created_at).toLocaleString() },
                { label: "Updated", value: new Date(selectedReceipt.updated_at).toLocaleString() },
              ]
            : undefined
        }
        size="xl"
        footerActions={
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!selectedReceipt) return
                setPreviewReceipt(selectedReceipt)
                setActivePreviewTemplate(selectedReceipt.template_id || "modern-corporate")
                setIsDetailOpen(false)
                setIsPreviewOpen(true)
              }}
              className="bg-teal text-navy font-bold rounded-xl h-10 px-4 text-xs"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Preview / Print
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!selectedReceipt) return
                setStatusReceipt(selectedReceipt)
                setEditStatus(selectedReceipt.status)
                setIsDetailOpen(false)
                setIsStatusOpen(true)
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 text-xs"
            >
              Change Status
            </Button>
          </>
        }
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={Receipt}
        title="Issue Official Payment Receipt"
        description="Generate an authenticated payment voucher with verified transaction reference and QR code."
        onSubmit={(event) => {
          event.preventDefault()
          void handleCreateReceipt()
        }}
        isSubmitting={isCreating}
        createLabel="Issue & Save Receipt"
        size="lg"
      >
        <AdminFormGrid className="grid-cols-1 sm:grid-cols-3">
          <AdminFormField label="Link Order (Recommended)">
            <AdminSelect
              value={linkOrderValue}
              onValueChange={(value) => {
                setLinkOrderValue(value)
                handleSelectOrder(value)
              }}
              placeholder="Select Order..."
              options={orders.map((o) => ({
                value: o.id,
                label: `#${o.order_number || o.id.slice(0, 8)} â€” ${o.customerName || "Unknown"} (TZS ${Number(o.total || 0).toLocaleString()})`,
              }))}
            />
          </AdminFormField>
          <AdminFormField label="Link Invoice (Optional)">
            <AdminSelect
              value={linkInvoiceValue}
              onValueChange={(value) => {
                setLinkInvoiceValue(value)
                handleSelectInvoice(value)
              }}
              placeholder="Select Invoice..."
              options={invoices.map((inv) => ({
                value: inv.id,
                label: `#${inv.invoice_number} â€” ${inv.customer_name} (TZS ${Number(inv.total).toLocaleString()})`,
              }))}
            />
          </AdminFormField>
          <AdminFormField label="Autofill from User">
            <AdminSelect
              value={linkUserValue}
              onValueChange={(value) => {
                setLinkUserValue(value)
                handleSelectUser(value)
              }}
              placeholder="Select User..."
              options={users.map((u) => ({ value: u.id, label: `${getUserDisplayName(u)} (${u.email})` }))}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid>
          <AdminFormField label="Payer / Customer Name" required>
            <AdminInput
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe / Tech Solutions"
            />
          </AdminFormField>
          <AdminFormField label="Payer Email" required>
            <AdminInput
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="client@email.com"
            />
          </AdminFormField>
          <AdminFormField label="Payer Phone">
            <AdminInput
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+255 7XX XXX XXX"
            />
          </AdminFormField>
          <AdminFormField label="Payment Date">
            <AdminInput type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid className="grid-cols-1 sm:grid-cols-3">
          <AdminFormField label="Amount Paid (TZS)" required>
            <AdminInput
              type="number"
              min="1"
              monospace
              value={amountPaid || ""}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </AdminFormField>
          <AdminFormField label="Payment Method" required>
            <AdminSelect
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
            />
          </AdminFormField>
          <AdminFormField label="Tx Code / Reference">
            <AdminInput
              monospace
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. MP92819283"
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid className="grid-cols-1 sm:grid-cols-2">
          <AdminFormField label="Receipt Template">
            <AdminSelect
              value={selectedTemplate}
              onValueChange={(value) => setSelectedTemplate(value as ReceiptTemplateId)}
              options={TEMPLATE_OPTIONS.map((tmpl) => ({ value: tmpl.id, label: tmpl.name }))}
            />
          </AdminFormField>
          <AdminFormField label="Remarks / Payment Purpose">
            <AdminTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Full settlement for IT equipment delivery..."
              rows={2}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      <AdminFormModal
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        icon={RefreshCw}
        title="Update Receipt Status"
        description={`Change receipt #${statusReceipt?.receipt_number} settlement state`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!statusReceipt) return
          setPendingStatusChange({ receipt: statusReceipt, status: editStatus })
          setIsStatusOpen(false)
        }}
        isEdit
        submitLabel="Continue"
        editLabel="Continue"
        size="sm"
      >
        <AdminFormGrid className="grid-cols-1">
          <AdminFormField label="New Status" required>
            <AdminSelect
              value={editStatus}
              onValueChange={(value) => setEditStatus(value as AdminReceipt["status"])}
              options={STATUS_OPTIONS}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      <AdminModalShell
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        icon={Printer}
        title={`Official QLABS Receipt â€” #${previewReceipt?.receipt_number}`}
        description="Authenticated payment voucher with computerized corporate stamp and verification QR code."
        size="lg"
        footer={
          <div className="flex flex-row justify-end gap-2 border-t border-navy/10 pt-4 dark:border-teal/20">
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)} className="rounded-xl font-bold">
              Close
            </Button>
            <Button size="sm" onClick={() => handlePrint()} className="bg-teal text-navy font-black rounded-xl gap-1.5 shadow-md">
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </div>
        }
      >
        {previewReceipt && (
          <DocumentVerificationInfo
            documentType="receipt"
            documentNumber={previewReceipt.receipt_number}
            verificationToken={previewReceipt.verification_token}
            verificationUrl={previewReceipt.verification_url}
            status={previewReceipt.status}
            isDark={isDark}
            className="my-1"
          />
        )}

        <div className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl my-1",
          isDark ? "bg-teal/15 border border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
        )}>
          <div className="flex items-center gap-1.5 text-xs font-bold pl-1">
            <Printer className="w-3.5 h-3.5 text-teal" />
            <span>Print Paper Format:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-center">
            {TEMPLATE_OPTIONS.map((tmpl) => (
              <Button
                key={tmpl.id}
                type="button"
                size="sm"
                variant={activePreviewTemplate === tmpl.id ? "default" : "outline"}
                onClick={() => setActivePreviewTemplate(tmpl.id)}
                className="h-8 text-xs font-bold rounded-xl gap-1.5"
              >
                <span>{tmpl.name.split(" (")[0]}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                  {tmpl.badge}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <div className={cn("rounded-2xl p-4 overflow-x-auto flex justify-center", isDark ? "bg-[#060a22]" : "bg-slate-100")}>
          {previewReceipt && (
            <ReceiptTemplateRenderer
              receipt={previewReceipt}
              templateId={activePreviewTemplate}
              printRef={printRef}
            />
          )}
        </div>
      </AdminModalShell>

      <AdminConfirmDialog
        open={receiptToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setReceiptToDelete(null)
        }}
        title="Delete Receipt"
        description={
          receiptToDelete
            ? `Are you sure you want to delete Receipt #${receiptToDelete.receipt_number}?`
            : undefined
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        isSubmitting={isDeleting}
        onConfirm={confirmDelete}
      />

      <AdminConfirmDialog
        open={pendingStatusChange !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatusChange(null)
        }}
        title="Confirm Status Change"
        description={
          pendingStatusChange
            ? `Change Receipt #${pendingStatusChange.receipt.receipt_number} status to ${pendingStatusChange.status}?`
            : undefined
        }
        confirmLabel="Confirm Change"
        destructive={false}
        onConfirm={async () => {
          if (!pendingStatusChange) return
          await handleStatusChange(pendingStatusChange.receipt.id, pendingStatusChange.status)
          setPendingStatusChange(null)
        }}
      />
    </div>
  )
}
