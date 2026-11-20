"use client"

import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AdminProformaInvoice,
  ProformaItem,
  getAdminProformaInvoices,
  createAdminProformaInvoice,
  updateProformaStatus,
  convertProformaToInvoice,
  deleteAdminProformaInvoice,
} from "@/lib/proforma-actions"
import { getProducts, type Product } from "@/lib/product-actions"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import ProformaTemplateRenderer from "@/components/admin/proforma-templates"
import { printProformaDocument } from "@/lib/print-proforma"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
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
  type AdminTableColumn,
  type AdminTableAction,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import {
  FileSpreadsheet,
  Eye,
  Printer,
  ArrowRight,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  DollarSign,
  User,
  ShieldCheck,
  Layers,
  AlertCircle,
} from "lucide-react"

const STATUS_OPTIONS: Array<{ value: AdminProformaInvoice["status"]; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "converted", label: "Converted" },
  { value: "expired", label: "Expired" },
]

export default function ProformaInvoicesPage() {
  const { toast } = useToast()

  const [proformas, setProformas] = useState<AdminProformaInvoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("100% Advance settlement via Bank / M-Pesa")
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split("T")[0]
  })
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ProformaItem[]>([
    { id: "1", name: "", quantity: 1, price: 0, type: "custom" },
  ])
  const [productSelections, setProductSelections] = useState<string[]>([""])
  const [selectedUserValue, setSelectedUserValue] = useState("")
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)

  // Detail / Print State
  const [selectedProforma, setSelectedProforma] = useState<AdminProformaInvoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Status change state
  const [statusProforma, setStatusProforma] = useState<AdminProformaInvoice | null>(null)
  const [editStatus, setEditStatus] = useState<AdminProformaInvoice["status"]>("draft")
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    proforma: AdminProformaInvoice
    status: AdminProformaInvoice["status"]
  } | null>(null)

  // Delete State
  const [proformaToDelete, setProformaToDelete] = useState<AdminProformaInvoice | null>(null)
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
      const [proformasData, productsData, usersResult] = await Promise.all([
        getAdminProformaInvoices(),
        getProducts().catch(() => []),
        getAuthUsers().catch(() => ({ users: [], error: null })),
      ])
      setProformas(proformasData || [])
      setProducts(productsData || [])
      setUsers(Array.isArray(usersResult?.users) ? usersResult.users : [])
    } catch (err: any) {
      console.error(err)
      setError("Failed to fetch proforma invoices data. Please try again.")
      toast({ title: "Error Loading Data", description: "Failed to fetch proformas.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculation helpers
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = Math.max(0, subtotal + taxAmount - discount)

  // Add line item
  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", quantity: 1, price: 0, type: "custom" }])
    setProductSelections([...productSelections, ""])
  }

  // Remove line item
  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
    setProductSelections(productSelections.filter((_, i) => i !== index))
  }

  // Select registered product
  const handleSelectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id.toString() === productId)
    if (!product) return
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      name: product.name,
      price: Number(product.price || 0),
      type: "product",
      description: product.description?.slice(0, 80),
    }
    setItems(newItems)
    setProductSelections(productSelections.map((value, i) => (i === index ? productId : value)))
  }

  // Select registered user
  const handleSelectUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setSelectedUserValue(userId)
    setCustomerName(getUserDisplayName(user))
    setCustomerEmail(user.email || "")
    setCustomerPhone(user.phone || user.user_metadata?.phone || "")
  }

  // Handle Create Proforma
  const handleCreateProforma = async () => {
    if (!customerName || !customerEmail) {
      toast({ title: "Missing Information", description: "Customer name and email are required.", variant: "destructive" })
      return
    }
    const validItems = items.filter((it) => it.name.trim().length > 0 && it.price > 0)
    if (validItems.length === 0) {
      toast({ title: "Items Required", description: "Please add at least one line item with a name and price.", variant: "destructive" })
      return
    }

    setIsCreating(true)
    try {
      const created = await createAdminProformaInvoice({
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
        },
        items: validItems,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total: grandTotal,
        paymentTerms,
        notes,
        validUntil: validUntil ? `${validUntil}T23:59:59.000Z` : undefined,
        templateId: "modern-corporate",
        status: "draft",
      })

      toast({ title: "Proforma Created", description: `Proforma #${created.proforma_number} generated successfully.` })
      setProformas([created, ...proformas])
      setIsCreateOpen(false)

      // Reset form
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setCustomerAddress("")
      setItems([{ id: "1", name: "", quantity: 1, price: 0, type: "custom" }])
      setProductSelections([""])
      setSelectedUserValue("")
      setDiscount(0)
      setTaxRate(0)
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  // Print trigger using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: " ",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          color: #000080 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .print-header-bar {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: rgba(0, 0, 128, 0.7) !important;
          padding-bottom: 2mm !important;
          margin-bottom: 4mm !important;
          border-bottom: 1px solid rgba(0, 0, 128, 0.15) !important;
        }
        .print-footer-bar {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: rgba(0, 0, 128, 0.7) !important;
          padding-top: 2.5mm !important;
          margin-top: 4mm !important;
          border-top: 1px solid rgba(0, 0, 128, 0.15) !important;
        }
      }
    `,
  })

  // Convert to Invoice
  const handleConvert = async (proforma: AdminProformaInvoice) => {
    try {
      const res = await convertProformaToInvoice(proforma.id)
      if (res.success) {
        toast({
          title: "Converted to Tax Invoice",
          description: `Generated official tax invoice from Proforma #${proforma.proforma_number}.`,
        })
        setProformas((previous) =>
          previous.map((p) => (p.id === proforma.id ? { ...p, status: "converted" } : p))
        )
        setSelectedProforma((previous) =>
          previous?.id === proforma.id ? { ...previous, status: "converted" } : previous
        )
      } else {
        toast({ title: "Conversion Failed", description: res.error, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  // Status update
  const handleStatusChange = async (id: string, newStatus: AdminProformaInvoice["status"]) => {
    const updated = await updateProformaStatus(id, newStatus)
    if (updated) {
      setProformas((previous) => previous.map((p) => (p.id === id ? updated : p)))
      setSelectedProforma((previous) => (previous?.id === id ? updated : previous))
      toast({ title: "Status Updated", description: `Status changed to ${newStatus}.` })
    }
  }

  // Delete
  const confirmDelete = async () => {
    if (!proformaToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminProformaInvoice(proformaToDelete.id)
      setProformas((previous) => previous.filter((p) => p.id !== proformaToDelete.id))
      toast({ title: "Deleted", description: `Proforma #${proformaToDelete.proforma_number} removed.` })
      setProformaToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Stats calculation
  const totalProformas = proformas.length
  const convertedCount = proformas.filter((p) => p.status === "converted").length
  const acceptedCount = proformas.filter((p) => p.status === "accepted").length
  const pendingCount = proformas.filter((p) => p.status === "draft" || p.status === "sent").length
  const totalValue = proformas.reduce((sum, p) => sum + (Number(p.total) || 0), 0)

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
    { key: "all", label: "All Proformas", icon: FileSpreadsheet, count: proformas.length },
    { key: "sent", label: "Sent", icon: Clock, count: proformas.filter((p) => p.status === "sent").length },
    { key: "accepted", label: "Accepted", icon: CheckCircle, count: proformas.filter((p) => p.status === "accepted").length },
    { key: "converted", label: "Converted", icon: ArrowRight, count: proformas.filter((p) => p.status === "converted").length },
    { key: "draft", label: "Draft", icon: FileText, count: proformas.filter((p) => p.status === "draft").length },
    { key: "expired", label: "Expired", icon: AlertCircle, count: proformas.filter((p) => p.status === "expired").length },
  ]

  // Filtered List
  const filteredProformas = proformas.filter((p) => {
    if (activeTab !== "all" && p.status !== activeTab) return false
    if (statusFilter !== "all" && p.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchNumber = p.proforma_number.toLowerCase().includes(q)
      const matchName = p.customer_name?.toLowerCase().includes(q)
      const matchEmail = p.customer_email?.toLowerCase().includes(q)
      return matchNumber || matchName || matchEmail
    }
    return true
  })

  const columns: AdminTableColumn<AdminProformaInvoice>[] = [
    {
      key: "proforma",
      header: "Proforma #",
      render: (p) => <AdminPrimaryCell icon={FileSpreadsheet} title={`#${p.proforma_number}`} />,
    },
    {
      key: "client",
      header: "Client",
      render: (p) => <AdminPrimaryCell icon={User} title={p.customer_name || "Unknown Customer"} subtitle={p.customer_email} />,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p) => (
        <span className="whitespace-nowrap font-black text-xs sm:text-sm tracking-tight">
          TZS {Number(p.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <AdminStatusBadge status={p.status} />,
    },
    {
      key: "valid",
      header: "Valid Until",
      hidden: "md",
      render: (p) => <AdminMutedText>{p.valid_until ? new Date(p.valid_until).toLocaleDateString() : "30 Days"}</AdminMutedText>,
    },
  ]

  const actions: AdminTableAction<AdminProformaInvoice>[] = [
    {
      key: "view",
      label: "View proforma details",
      icon: Eye,
      variant: "view",
      onClick: (p) => {
        setSelectedProforma(p)
        setIsDetailOpen(true)
      },
    },
    {
      key: "print",
      label: "Print Proforma Document",
      icon: Printer,
      variant: "soft",
      mobile: false,
      onClick: (p) => printProformaDocument(p),
    },
    {
      key: "convert",
      label: "Convert to Official Tax Invoice",
      icon: ArrowRight,
      variant: "soft",
      mobile: false,
      hide: (p) => p.status === "converted",
      onClick: (p) => handleConvert(p),
    },
    {
      key: "delete",
      label: "Delete Proforma",
      icon: Trash2,
      variant: "delete",
      onClick: (p) => setProformaToDelete(p),
    },
  ]

  const proformaItemColumns: AdminTableColumn<ProformaItem>[] = [
    {
      key: "description",
      header: "Item Description",
      render: (item) => <span className="font-bold">{item.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      align: "center",
      render: (item) => <AdminTag>{item.type || "product"}</AdminTag>,
    },
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      render: (item) => <span className="font-mono font-bold">x{item.quantity}</span>,
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
          TZS {(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString()}
        </span>
      ),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedProforma
    ? [
        {
          key: "items",
          title: `Commercial Line Items (${selectedProforma.items?.length || 0})`,
          icon: Layers,
          span: 2,
          content: (
            <div className="space-y-3">
              <AdminTable
                inline
                columns={proformaItemColumns}
                data={selectedProforma.items || []}
                rowKey={(item) => item.id}
                emptyTitle="No commercial line items recorded on this proforma."
                emptyDescription=""
                className="text-xs"
              />
              <div className="space-y-1.5 border-t border-navy/15 pt-3 font-mono text-xs dark:border-teal/30">
                <div className="flex justify-between">
                  <span className="opacity-80">Subtotal:</span>
                  <span className="font-bold">TZS {Number(selectedProforma.subtotal || selectedProforma.total).toLocaleString()}</span>
                </div>
                {Number(selectedProforma.tax_amount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">VAT / Tax ({selectedProforma.tax_rate || 0}%):</span>
                    <span className="font-bold">TZS {Number(selectedProforma.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                {Number(selectedProforma.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Discount:</span>
                    <span className="font-bold">-TZS {Number(selectedProforma.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-navy/20 pt-2 text-sm font-black dark:border-teal/40">
                  <span className="uppercase">Grand Total:</span>
                  <span>TZS {Number(selectedProforma.total).toLocaleString()}</span>
                </div>
              </div>
              {selectedProforma.notes && (
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Terms & Execution Notes
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">{selectedProforma.notes}</p>
                </div>
              )}
            </div>
          ),
        },
        {
          key: "client",
          title: "Client Recipient",
          icon: User,
          fields: [
            { label: "Client Name", value: selectedProforma.customer_name || "Enterprise Customer" },
            { label: "Email", value: selectedProforma.customer_email || "â€”" },
            { label: "Phone", value: selectedProforma.customer_phone || "â€”" },
            { label: "Address", value: selectedProforma.customer_address || "Tanzania" },
          ],
        },
        {
          key: "terms",
          title: "Commercial Conditions",
          icon: ShieldCheck,
          fields: [
            { label: "Status", value: <AdminStatusBadge status={selectedProforma.status} /> },
            { label: "Settlement Terms", value: selectedProforma.payment_terms || "100% Advance settlement" },
            {
              label: "Estimate Validity",
              value: selectedProforma.valid_until ? new Date(selectedProforma.valid_until).toLocaleDateString() : "30 Calendar Days",
            },
            { label: "Verification", value: "Digital Signature Valid" },
          ],
        },
        {
          key: "verification",
          title: "Document Verification",
          icon: FileText,
          fields: [
            { label: "Verification Token", value: selectedProforma.verification_token || "â€”" },
            { label: "Verification URL", value: selectedProforma.verification_url || "â€”" },
            { label: "Converted Invoice ID", value: selectedProforma.converted_invoice_id || "â€”" },
          ],
        },
      ]
    : []

  if (isLoading) {
    return <AdminLoading type="proforma-invoices" />
  }

  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
        <AdminPageHeader
          title="Proforma"
          accent="Invoices"
          subtitle="Create, manage, and convert commercial proforma estimates with official document layout & digital verification"
          icon={FileSpreadsheet}
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
        title="Proforma"
        accent="Invoices"
        subtitle="Create, manage, and convert commercial proforma estimates with official document layout & digital verification"
        icon={FileSpreadsheet}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Create Proforma Invoice"
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Proformas", value: formatStatNumber(totalProformas), icon: FileSpreadsheet },
          { title: "Converted", value: formatStatNumber(convertedCount), icon: CheckCircle, onClick: () => setActiveTab("converted") },
          { title: "Pending / Sent", value: formatStatNumber(pendingCount), icon: Clock, onClick: () => setActiveTab("sent") },
          { title: "Accepted", value: formatStatNumber(acceptedCount), icon: TrendingUp, onClick: () => setActiveTab("accepted") },
          { title: "Total Pipeline", value: formatStatCurrency(totalValue), icon: DollarSign },
        ]}
      />

      <AdminFilterBar
        tabs={tabs}
        tabValue={activeTab}
        onTabChange={setActiveTab}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by proforma #, client name or email..."
        selects={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            placeholder: "Filter by status",
            allLabel: "All Statuses",
            options: STATUS_OPTIONS,
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredProformas}
        rowKey={(p) => p.id}
        actions={actions}
        emptyIcon={FileSpreadsheet}
        emptyTitle="No proforma invoices found"
        emptyDescription='Click "Create Proforma Invoice" to generate a new commercial estimate'
      />

      <AdminDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        icon={FileSpreadsheet}
        title={`Proforma #${selectedProforma?.proforma_number || "Details"}`}
        subtitle={
          selectedProforma
            ? `Issued on ${new Date(selectedProforma.created_at).toLocaleString("en-US", {
                dateStyle: "full",
                timeStyle: "short",
              })}${selectedProforma.valid_until ? ` â€¢ Valid until ${new Date(selectedProforma.valid_until).toLocaleDateString()}` : ""}`
            : undefined
        }
        badge={selectedProforma ? <AdminStatusBadge status={selectedProforma.status} /> : undefined}
        sections={detailSections}
        fields={
          selectedProforma
            ? [
                { label: "Proforma ID", value: selectedProforma.id },
                { label: "User ID", value: selectedProforma.user_id || "â€”" },
                { label: "Template", value: selectedProforma.template_id },
                { label: "Subtotal", value: `TZS ${Number(selectedProforma.subtotal || 0).toLocaleString()}` },
                { label: "Tax Rate", value: `${selectedProforma.tax_rate || 0}%` },
                { label: "Discount", value: `TZS ${Number(selectedProforma.discount || 0).toLocaleString()}` },
                { label: "Created", value: new Date(selectedProforma.created_at).toLocaleString() },
                { label: "Updated", value: new Date(selectedProforma.updated_at).toLocaleString() },
              ]
            : undefined
        }
        size="xl"
        footerActions={
          <>
            {selectedProforma?.status !== "converted" && (
              <Button
                type="button"
                size="sm"
                onClick={() => selectedProforma && handleConvert(selectedProforma)}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 text-xs"
              >
                <ArrowRight className="h-4 w-4 mr-1.5 text-teal" />
                Convert to Invoice
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => handlePrint()}
              className="font-bold rounded-xl h-10 px-4 text-xs border-2"
              variant="outline"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print Proforma
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!selectedProforma) return
                setStatusProforma(selectedProforma)
                setEditStatus(selectedProforma.status)
                setIsDetailOpen(false)
                setIsStatusOpen(true)
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 text-xs"
            >
              Change Status
            </Button>
          </>
        }
      >
        {selectedProforma && (
          <div className="hidden">
            <ProformaTemplateRenderer proforma={selectedProforma} printRef={printRef} />
          </div>
        )}
      </AdminDetailModal>

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={FileSpreadsheet}
        title="Create New Proforma Invoice"
        description="Fill in client information and line items to generate an official proforma invoice."
        onSubmit={(event) => {
          event.preventDefault()
          void handleCreateProforma()
        }}
        isSubmitting={isCreating}
        createLabel="Save & Generate Proforma"
        size="lg"
      >
        <AdminFormGrid>
          <AdminFormField label="Client Name" required>
            <AdminInput
              placeholder="e.g. Acme Enterprises Ltd"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Client Email" required>
            <AdminInput
              placeholder="billing@acme.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Client Phone">
            <AdminInput
              placeholder="+255 7XX XXX XXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Physical Address / City">
            <AdminInput
              placeholder="Dar es Salaam, Tanzania"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>

        {users.length > 0 && (
          <AdminFormField label="Autofill from Users">
            <AdminSelect
              value={selectedUserValue}
              onValueChange={handleSelectUser}
              placeholder="Select a registered user..."
              options={users.map((u) => ({ value: u.id, label: `${getUserDisplayName(u)} (${u.email})` }))}
            />
          </AdminFormField>
        )}

        <div className="space-y-3 border-t border-navy/10 pt-4 dark:border-teal/20">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider">Line Items & Pricing</h4>
            <Button type="button" size="sm" variant="outline" onClick={addItem} className="h-8 text-xs gap-1 rounded-xl font-bold">
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="grid grid-cols-1 gap-2 rounded-xl border-2 border-navy/20 p-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_5rem_7rem_auto_auto] sm:items-center dark:border-teal/30"
              >
                <AdminFormField label="Catalog Product">
                  <AdminSelect
                    value={productSelections[idx] || ""}
                    onValueChange={(value) => handleSelectProduct(idx, value)}
                    placeholder="Catalog product..."
                    options={products.slice(0, 40).map((product) => ({
                      value: product.id.toString(),
                      label: `${product.name} (TZS ${Number(product.price).toLocaleString()})`,
                    }))}
                  />
                </AdminFormField>
                <AdminFormField label="Item Name">
                  <AdminInput
                    placeholder="Item name / specification..."
                    value={it.name}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[idx].name = e.target.value
                      setItems(newItems)
                    }}
                  />
                </AdminFormField>
                <AdminFormField label="Qty">
                  <AdminInput
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1)
                      setItems(newItems)
                    }}
                  />
                </AdminFormField>
                <AdminFormField label="Price">
                  <AdminInput
                    type="number"
                    min="0"
                    monospace
                    value={it.price || ""}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[idx].price = Math.max(0, parseFloat(e.target.value) || 0)
                      setItems(newItems)
                    }}
                  />
                </AdminFormField>
                <div className="pt-6 text-right font-mono text-xs font-bold">
                  TZS {(it.quantity * it.price).toLocaleString()}
                </div>
                <div className="pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={items.length <= 1}
                    onClick={() => removeItem(idx)}
                    className="h-10 w-10 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 border-t border-navy/10 pt-4 sm:grid-cols-2 dark:border-teal/20">
            <AdminFormField label="Payment Terms & Instructions" className="sm:col-span-2">
              <AdminInput value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Valid Until">
              <AdminInput type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </AdminFormField>
            <AdminFormField label="VAT Tax %">
              <AdminInput
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </AdminFormField>
            <AdminFormField label="Discount (TZS)" className="sm:col-span-2">
              <AdminInput
                type="number"
                min="0"
                monospace
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </AdminFormField>
            <AdminFormField label="Special Notes (Optional)" className="sm:col-span-2">
              <AdminTextarea
                placeholder="Special instructions or delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </AdminFormField>
          </div>

          <div className="space-y-1.5 rounded-xl border-2 border-navy/20 p-3 font-mono text-xs dark:border-teal/30">
            <div className="flex justify-between">
              <span className="opacity-80">Subtotal:</span>
              <span className="font-bold">TZS {subtotal.toLocaleString()}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="opacity-80">VAT ({taxRate}%):</span>
                <span className="font-bold">TZS {taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-navy/20 pt-2 text-base font-black dark:border-teal/40">
              <span>Total:</span>
              <span>TZS {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </AdminFormModal>

      <AdminFormModal
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        icon={ShieldCheck}
        title="Update Proforma Status"
        description={`Change Proforma #${statusProforma?.proforma_number} status`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!statusProforma) return
          setPendingStatusChange({ proforma: statusProforma, status: editStatus })
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
              onValueChange={(value) => setEditStatus(value as AdminProformaInvoice["status"])}
              options={STATUS_OPTIONS}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      <AdminConfirmDialog
        open={proformaToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProformaToDelete(null)
        }}
        title="Delete Proforma"
        description={
          proformaToDelete
            ? `Are you sure you want to delete Proforma #${proformaToDelete.proforma_number}? This action cannot be undone.`
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
            ? `Change Proforma #${pendingStatusChange.proforma.proforma_number} status to ${pendingStatusChange.status}?`
            : undefined
        }
        confirmLabel="Confirm Change"
        destructive={false}
        onConfirm={async () => {
          if (!pendingStatusChange) return
          await handleStatusChange(pendingStatusChange.proforma.id, pendingStatusChange.status)
          setPendingStatusChange(null)
        }}
      />
    </div>
  )
}
