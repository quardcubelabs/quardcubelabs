"use client"

import { useEffect, useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, FileText, User, Eye, Printer, DollarSign, Clock, AlertCircle, XCircle, CheckCircle, RefreshCw, ShieldCheck, ExternalLink, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import { getProducts, type Product } from "@/lib/product-actions"
import { createAdminInvoice, getAdminInvoices, deleteAdminInvoice, updateInvoiceStatus, type AdminInvoice } from "@/lib/invoice-actions"
import { useAdminTheme } from "@/contexts/admin-theme-context"
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
  AdminDetailSection,
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

interface InvoiceItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

const STATUS_OPTIONS: Array<{ value: AdminInvoice["status"]; label: string }> = [
  { value: "draft", label: "Draft / Pending" },
  { value: "sent", label: "Sent / Processing" },
  { value: "paid", label: "Paid & Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminInvoicesPage() {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const [printingInvoice, setPrintingInvoice] = useState<AdminInvoice | null>(null)
  const printComponentRef = useRef<HTMLDivElement>(null)

  // Status change state
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [statusInvoice, setStatusInvoice] = useState<AdminInvoice | null>(null)
  const [editStatus, setEditStatus] = useState<AdminInvoice["status"]>("draft")
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    invoice: AdminInvoice
    status: AdminInvoice["status"]
  } | null>(null)

  // Delete state
  const [invoiceToDelete, setInvoiceToDelete] = useState<AdminInvoice | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Invoice creation form state
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [customItem, setCustomItem] = useState({ name: "", price: 0, quantity: 1 })
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })
  const [invoiceNotes, setInvoiceNotes] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")

  const handleTriggerPrint = useReactToPrint({
    contentRef: printComponentRef,
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
        .invoice-print-root {
          width: 100% !important;
          max-width: 100% !important;
          min-height: 297mm !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
          padding: 0.5in !important;
          background: transparent !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
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
        .print-watermark {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none !important;
          z-index: 0 !important;
        }
        .print-watermark img {
          width: 350px !important;
          height: 350px !important;
          object-fit: contain !important;
          opacity: 0.18 !important;
        }
        .invoice-print-root tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .invoice-print-root table,
        .invoice-print-root thead,
        .invoice-print-root tbody,
        .invoice-print-root tr,
        .invoice-print-root th,
        .invoice-print-root td,
        .invoice-print-root div,
        .invoice-print-root p,
        .invoice-print-root h1,
        .invoice-print-root h2,
        .invoice-print-root h3,
        .invoice-print-root span,
        .invoice-print-root ol,
        .invoice-print-root li {
          background-color: transparent !important;
          background: transparent !important;
        }
        .avoid-break {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `,
  })

  const handleOpenPreview = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice)
    setIsDetailOpen(true)
  }

  const handlePrintInvoice = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice)
    setPrintingInvoice(invoice)
  }

  useEffect(() => {
    if (printingInvoice && printComponentRef.current) {
      const timer = setTimeout(() => {
        handleTriggerPrint()
        setPrintingInvoice(null)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [printingInvoice, handleTriggerPrint])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (userSearchTerm.trim()) {
      const filtered = users.filter(user =>
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.user_metadata?.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.user_metadata?.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.user_metadata?.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.user_metadata?.lastName?.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [userSearchTerm, users])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [usersResult, productsData, invoicesData] = await Promise.all([
        getAuthUsers(),
        getProducts(),
        getAdminInvoices()
      ])

      if (usersResult.error) {
        setError(usersResult.error)
      } else {
        setUsers(usersResult.users)
        setFilteredUsers(usersResult.users)
      }

      setProducts(productsData)
      setInvoices(invoicesData)
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const getUserDisplayName = (user: AuthUser) => {
    return user.user_metadata?.full_name ||
           user.user_metadata?.name ||
           `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() ||
           user.email?.split('@')[0] ||
           'Unknown'
  }

  const handleSelectUser = (user: AuthUser) => {
    setSelectedUser(user)
    setCustomerInfo({
      name: getUserDisplayName(user),
      email: user.email || "",
      phone: user.user_metadata?.phone || "",
      address: user.user_metadata?.address || ""
    })
  }

  const handleAddProduct = (product: Product) => {
    const existingItem = invoiceItems.find(item => item.id === product.id.toString())

    if (existingItem) {
      setInvoiceItems(invoiceItems.map(item =>
        item.id === product.id.toString()
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setInvoiceItems([...invoiceItems, {
        id: product.id.toString(),
        name: product.name,
        quantity: 1,
        price: product.price,
        image: product.image || "/placeholder.png"
      }])
    }
  }

  const handleAddCustomItem = () => {
    if (!customItem.name.trim() || customItem.price <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please enter a valid name and price",
        variant: "destructive"
      })
      return
    }

    setInvoiceItems([...invoiceItems, {
      id: `custom-${Date.now()}`,
      name: customItem.name,
      quantity: customItem.quantity,
      price: customItem.price,
      image: "/placeholder.png"
    }])

    setCustomItem({ name: "", price: 0, quantity: 1 })
  }

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    setInvoiceItems(invoiceItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const handleRemoveItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== itemId))
  }

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const handleCreateInvoice = async () => {
    if (!selectedUser) {
      toast({
        title: "No Customer Selected",
        description: "Please select a customer for the invoice",
        variant: "destructive"
      })
      return
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the invoice",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)

      await createAdminInvoice({
        userId: selectedUser.id,
        items: invoiceItems,
        total: calculateTotal(),
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address
        },
        notes: invoiceNotes
      })

      toast({
        title: "Invoice Created",
        description: "Invoice has been created successfully"
      })

      setSelectedUser(null)
      setInvoiceItems([])
      setCustomerInfo({ name: "", email: "", phone: "", address: "" })
      setInvoiceNotes("")
      setUserSearchTerm("")
      setIsCreateOpen(false)

      await loadData()
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: AdminInvoice["status"]) => {
    try {
      const updated = await updateInvoiceStatus(invoiceId, newStatus)
      if (updated) {
        setInvoices(previous => previous.map(inv => inv.id === invoiceId ? updated : inv))
        setSelectedInvoice(previous => previous?.id === invoiceId ? updated : previous)
      }
      toast({
        title: "Invoice Status Updated",
        description: `Invoice status changed to "${newStatus}".`,
      })
    } catch (err) {
      console.error("Error updating invoice status:", err)
      toast({
        title: "Update Failed",
        description: "Could not update invoice status.",
        variant: "destructive"
      })
    }
  }

  const confirmDelete = async () => {
    if (!invoiceToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminInvoice(invoiceToDelete.id)
      toast({ title: "Invoice Deleted", description: "Invoice has been deleted successfully" })
      setInvoices(previous => previous.filter(inv => inv.id !== invoiceToDelete.id))
      setSelectedInvoice(previous => previous?.id === invoiceToDelete.id ? null : previous)
      setInvoiceToDelete(null)
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Stats
  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter(i => i.status === "paid").length
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "draft").length
  const overdueInvoices = invoices.filter(i => i.status === "overdue" || i.status === "cancelled").length
  const totalRevenue = invoices.filter(i => i.status !== "cancelled").reduce((sum, i) => sum + (Number(i.total) || 0), 0)

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

  const tabs: AdminFilterTab[] = [
    { key: "all", label: "All Invoices", icon: FileText, count: totalInvoices },
    { key: "paid", label: "Paid", icon: CheckCircle, count: paidInvoices },
    { key: "pending", label: "Pending", icon: Clock, count: pendingInvoices },
    { key: "overdue", label: "Overdue", icon: AlertCircle, count: overdueInvoices },
    { key: "cancelled", label: "Cancelled", icon: XCircle, count: invoices.filter(i => i.status === "cancelled").length },
  ]

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeTab === "pending") {
      if (invoice.status !== "draft" && invoice.status !== "sent") return false
    } else if (activeTab !== "all" && invoice.status !== activeTab) {
      return false
    }
    if (statusFilter !== "all" && invoice.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        invoice.invoice_number?.toLowerCase().includes(q) ||
        invoice.customer_name?.toLowerCase().includes(q) ||
        invoice.customer_email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const columns: AdminTableColumn<AdminInvoice>[] = [
    {
      key: "invoice",
      header: "Invoice #",
      render: (invoice) => (
        <AdminPrimaryCell
          icon={FileText}
          title={`#${invoice.invoice_number}`}
          subtitle={invoice.customer_email}
        />
      ),
    },
    {
      key: "client",
      header: "Client",
      hidden: "sm",
      render: (invoice) => <AdminPill>{invoice.customer_name || "Unknown Customer"}</AdminPill>,
    },
    {
      key: "amount",
      header: "Amount (TZS)",
      align: "right",
      render: (invoice) => (
        <span className="whitespace-nowrap font-black text-xs sm:text-sm tracking-tight">
          TZS {Number(invoice.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice) => <AdminStatusBadge status={invoice.status} />,
    },
    {
      key: "date",
      header: "Created",
      hidden: "md",
      render: (invoice) => <AdminMutedText>{new Date(invoice.created_at).toLocaleDateString()}</AdminMutedText>,
    },
  ]

  const actions: AdminTableAction<AdminInvoice>[] = [
    {
      key: "view",
      label: "View invoice details",
      icon: Eye,
      variant: "view",
      onClick: (invoice) => handleOpenPreview(invoice),
    },
    {
      key: "print",
      label: "Print Invoice",
      icon: Printer,
      variant: "soft",
      mobile: false,
      onClick: (invoice) => handlePrintInvoice(invoice),
    },
    {
      key: "status",
      label: "Update Status",
      icon: RefreshCw,
      variant: "soft",
      mobile: false,
      onClick: (invoice) => {
        setStatusInvoice(invoice)
        setEditStatus(invoice.status)
        setIsStatusOpen(true)
      },
    },
    {
      key: "delete",
      label: "Delete Invoice",
      icon: Trash2,
      variant: "delete",
      onClick: (invoice) => setInvoiceToDelete(invoice),
    },
  ]

  const invoiceDetailItemColumns: AdminTableColumn<InvoiceItem>[] = [
    {
      key: "item",
      header: "Item",
      render: (item) => (
        <div className="flex items-center gap-2 min-w-0 font-bold">
          <Image
            src={item.image || "/placeholder.png"}
            alt={item.name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover border border-navy/10 dark:border-teal/30"
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
          />
          <div className="min-w-0">
            <span className="block truncate">{item.name}</span>
            {!item.id?.startsWith("custom-") && (
              <Link
                href={`/shop/product/${item.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[10px] text-teal font-bold hover:underline"
              >
                View in Shop <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      ),
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
      key: "line-total",
      header: "Line Total",
      align: "right",
      render: (item) => (
        <span className="font-mono font-bold">
          TZS {(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString()}
        </span>
      ),
    },
  ]

  const invoiceFormItemColumns: AdminTableColumn<InvoiceItem>[] = [
    {
      key: "item",
      header: "Item",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Image
            src={item.image || "/placeholder.png"}
            alt={item.name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="truncate max-w-[160px]">{item.name}</span>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      render: (item) => (
        <AdminInput
          type="number"
          min="1"
          className="h-9 w-20 text-center"
          value={item.quantity}
          onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
        />
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      render: (item) => <span className="font-mono">TZS {item.price.toLocaleString()}</span>,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (item) => (
        <span className="font-mono font-bold">TZS {(item.price * item.quantity).toLocaleString()}</span>
      ),
    },
    {
      key: "remove",
      header: "Remove",
      align: "center",
      render: (item) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveItem(item.id)}
          className="h-9 w-9 text-brand-red"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedInvoice
    ? [
        {
          key: "items",
          title: `Invoice Items (${selectedInvoice.items?.length || 0})`,
          icon: Package,
          span: 2,
          content: (
            <AdminTable
              inline
              columns={invoiceDetailItemColumns}
              data={selectedInvoice.items || []}
              rowKey={(item) => item.id}
              footer={
                <tfoot>
                  <tr className="border-t-2 border-navy/20 dark:border-teal/40 font-black">
                    <td colSpan={3} className="py-2.5 px-2 text-right uppercase">Total</td>
                    <td className="py-2.5 px-2 text-right font-mono">TZS {Number(selectedInvoice.total || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              }
              className="text-xs"
            />
          ),
        },
        {
          key: "customer",
          title: "Customer Information",
          icon: User,
          fields: [
            { label: "Full Name", value: selectedInvoice.customer_name || "Customer Name Not Provided" },
            { label: "Email", value: selectedInvoice.customer_email || "No email on record" },
            { label: "Phone", value: selectedInvoice.customer_phone || "â€”" },
            { label: "Address", value: selectedInvoice.customer_address || "Tanzania" },
          ],
        },
        {
          key: "billing",
          title: "Billing & Status",
          icon: ShieldCheck,
          fields: [
            { label: "Status", value: <AdminStatusBadge status={selectedInvoice.status} /> },
            { label: "Due Date", value: selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : "â€”" },
            { label: "Items", value: `${selectedInvoice.items?.length || 0} line item(s)` },
            { label: "Reference / Notes", value: selectedInvoice.notes || "â€”" },
          ],
        },
        {
          key: "verification",
          title: "Document Verification",
          icon: ShieldCheck,
          content: (
            <div className="flex flex-col items-center gap-2 text-center">
              <QuardCubeQRCode
                value={selectedInvoice.verification_url || `https://quardcubelabs.co.tz/verify/${selectedInvoice.verification_token || selectedInvoice.invoice_number}`}
                size={140}
                label="SCAN TO AUTHENTICATE"
                clickable
              />
              <p className="text-[11px] font-mono text-teal font-semibold break-all">
                Verification ID: {selectedInvoice.verification_token || selectedInvoice.invoice_number}
              </p>
            </div>
          ),
          fields: [
            { label: "Token", value: selectedInvoice.verification_token || "â€”" },
            { label: "Verification URL", value: selectedInvoice.verification_url || "â€”" },
          ],
        },
      ]
    : []

  if (isLoading) {
    return <AdminLoading type="invoices" />
  }

  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
        <AdminPageHeader
          title="Invoice"
          accent="Management"
          subtitle="Create, track and manage customer billing and invoices"
          icon={FileText}
        />
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    )
  }

  const invoiceToPrint = printingInvoice || selectedInvoice

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Invoice"
        accent="Management"
        subtitle="Create, track and manage customer billing and invoices"
        icon={FileText}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Create Invoice"
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Invoices", value: formatStatNumber(totalInvoices), icon: FileText },
          { title: "Paid", value: formatStatNumber(paidInvoices), icon: CheckCircle, onClick: () => setActiveTab("paid") },
          { title: "Pending", value: formatStatNumber(pendingInvoices), icon: Clock, onClick: () => setActiveTab("pending") },
          { title: "Overdue", value: formatStatNumber(overdueInvoices), icon: AlertCircle, onClick: () => setActiveTab("overdue") },
          { title: "Total Revenue", value: formatStatCurrency(totalRevenue), icon: DollarSign },
        ]}
      />

      <AdminFilterBar
        tabs={tabs}
        tabValue={activeTab}
        onTabChange={setActiveTab}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by invoice number, customer name or email..."
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
        data={filteredInvoices}
        rowKey={(invoice) => invoice.id}
        actions={actions}
        emptyIcon={FileText}
        emptyTitle="No invoices found"
        emptyDescription='Click "Create Invoice" to get started'
      />

      <AdminDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        icon={FileText}
        title={`Invoice #${selectedInvoice?.invoice_number || "Details"}`}
        subtitle={
          selectedInvoice
            ? `Issued on ${new Date(selectedInvoice.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`
            : undefined
        }
        badge={selectedInvoice ? <AdminStatusBadge status={selectedInvoice.status} /> : undefined}
        sections={detailSections}
        fields={
          selectedInvoice
            ? [
                { label: "Invoice ID", value: selectedInvoice.id },
                { label: "User ID", value: selectedInvoice.user_id || "â€”" },
                { label: "Created", value: new Date(selectedInvoice.created_at).toLocaleString() },
                { label: "Updated", value: new Date(selectedInvoice.updated_at).toLocaleString() },
              ]
            : undefined
        }
        size="xl"
        footerActions={
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => selectedInvoice && handlePrintInvoice(selectedInvoice)}
              className="bg-teal text-navy font-black rounded-xl h-10 px-4 gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!selectedInvoice) return
                setStatusInvoice(selectedInvoice)
                setEditStatus(selectedInvoice.status)
                setIsDetailOpen(false)
                setIsStatusOpen(true)
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              Change Status
            </Button>
          </>
        }
        onDelete={() => selectedInvoice && setInvoiceToDelete(selectedInvoice)}
        deleteLabel="Delete Invoice"
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={FileText}
        title="Create New Invoice"
        description="Select a customer and add items to create a new invoice."
        onSubmit={(event) => {
          event.preventDefault()
          void handleCreateInvoice()
        }}
        isSubmitting={isCreating}
        createLabel="Create Invoice"
        size="lg"
      >
        <AdminFormGrid>
          <AdminFormField label="Search Customers">
            <AdminInput
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
            />
          </AdminFormField>
          <div className="max-h-40 overflow-y-auto rounded-xl border-2 border-navy/20 dark:border-teal/30 divide-y divide-navy/10 dark:divide-teal/20">
            {filteredUsers.slice(0, 10).map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={cn(
                  "w-full text-left p-2.5 hover:bg-teal/10 transition-colors",
                  selectedUser?.id === user.id && "bg-navy/10 border-l-4 border-navy"
                )}
              >
                <span className="block font-bold text-xs">{getUserDisplayName(user)}</span>
                <span className="block text-[11px] opacity-70">{user.email}</span>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-4 text-center text-xs opacity-60">No customers found</div>
            )}
          </div>
        </AdminFormGrid>

        {selectedUser && (
          <AdminDetailSection
            key="selected-customer"
            title="Customer Details"
            icon={User}
            fields={[
              { label: "Name", value: customerInfo.name },
              { label: "Email", value: customerInfo.email },
              { label: "Phone", value: customerInfo.phone || "â€”" },
              { label: "Address", value: customerInfo.address || "â€”" },
            ]}
          />
        )}

        <AdminFormGrid>
          <AdminFormField label="Customer Name" required>
            <AdminInput
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Customer Email" required>
            <AdminInput
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Customer Phone">
            <AdminInput
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            />
          </AdminFormField>
          <AdminFormField label="Customer Address">
            <AdminInput
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-3 border-t border-navy/10 pt-4 dark:border-teal/20">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider">Invoice Items</h4>
            <div className="flex items-center gap-2">
              <AdminSelect
                value=""
                onValueChange={(value) => {
                  const product = products.find(p => p.id.toString() === value)
                  if (product) handleAddProduct(product)
                }}
                placeholder="Add product..."
                options={products.slice(0, 40).map((product) => ({
                  value: product.id.toString(),
                  label: `${product.name} â€” TZS ${Number(product.price).toLocaleString()}`,
                }))}
              />
            </div>
          </div>

          <AdminFormGrid className="grid-cols-1 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_auto]">
            <AdminFormField label="Custom Item Name">
              <AdminInput
                value={customItem.name}
                onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                placeholder="Custom item name..."
              />
            </AdminFormField>
            <AdminFormField label="Qty">
              <AdminInput
                type="number"
                min="1"
                value={customItem.quantity}
                onChange={(e) => setCustomItem({ ...customItem, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </AdminFormField>
            <AdminFormField label="Price (TZS)">
              <AdminInput
                type="number"
                min="0"
                monospace
                value={customItem.price || ""}
                onChange={(e) => setCustomItem({ ...customItem, price: Math.max(0, parseFloat(e.target.value) || 0) })}
              />
            </AdminFormField>
            <div className="pt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomItem}
                className="h-10 gap-1 rounded-xl font-bold"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </AdminFormGrid>

          <AdminTable
            inline
            columns={invoiceFormItemColumns}
            data={invoiceItems}
            rowKey={(item) => item.id}
            emptyTitle="No items added yet. Add a product or custom item above."
            emptyDescription=""
            footer={
              <tfoot>
                <tr className="border-t-2 border-navy/20 dark:border-teal/40 font-black">
                  <td colSpan={3} className="py-2.5 px-2 text-right uppercase">Total</td>
                  <td className="py-2.5 px-2 text-right font-mono">TZS {calculateTotal().toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            }
            className="text-xs"
          />
        </div>

        <AdminFormField label="Invoice Notes / Reference (Optional)">
          <AdminTextarea
            value={invoiceNotes}
            onChange={(e) => setInvoiceNotes(e.target.value)}
            rows={2}
            placeholder="Additional payment reference or notes..."
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminFormModal
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        icon={RefreshCw}
        title="Update Invoice Status"
        description={`Change status for invoice #${statusInvoice?.invoice_number}`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!statusInvoice) return
          setPendingStatusChange({ invoice: statusInvoice, status: editStatus })
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
              onValueChange={(value) => setEditStatus(value as AdminInvoice["status"])}
              options={STATUS_OPTIONS}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      <AdminConfirmDialog
        open={invoiceToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setInvoiceToDelete(null)
        }}
        title="Delete Invoice"
        description={
          invoiceToDelete
            ? `Are you sure you want to delete Invoice #${invoiceToDelete.invoice_number}? This action cannot be undone.`
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
            ? `Change Invoice #${pendingStatusChange.invoice.invoice_number} status to ${pendingStatusChange.status}?`
            : undefined
        }
        confirmLabel="Confirm Change"
        destructive={false}
        onConfirm={async () => {
          if (!pendingStatusChange) return
          await handleUpdateInvoiceStatus(pendingStatusChange.invoice.id, pendingStatusChange.status)
          setPendingStatusChange(null)
        }}
      />

      {/* Hidden printable invoice container for react-to-print */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: "210mm" }}>
        <div ref={printComponentRef}>
          {invoiceToPrint && (
            <div className="invoice-print-root w-full font-sans text-navy bg-transparent relative">
              <div className="print-watermark absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <Image
                  src="/turquoise.png"
                  alt="QuardCubeLabs Watermark"
                  width={350}
                  height={350}
                  className="object-contain opacity-20"
                  priority
                  unoptimized
                />
              </div>

              <div className="relative z-10 bg-transparent flex flex-col justify-between flex-1 w-full min-h-[calc(297mm-1in)]">
                <div>
                  <div className="print-header-bar flex justify-between items-center text-[12px] text-navy/70 font-semibold border-b border-navy/15 pb-2 mb-4">
                    <span>QUARDCUBE LABS &bull; TAX INVOICE</span>
                    <span>{new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </div>

                  <div className="flex justify-between items-start mb-6 bg-transparent">
                    <div className="bg-transparent">
                      <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight uppercase">QUARDCUBELABS</h2>
                      <p className="text-[18px] font-medium text-navy/85 mt-1">Your trusted partner in digital solutions</p>
                      <p className="text-[18px] font-medium text-navy/85 mt-0.5">Email: info@quardcubelabs.co.tz</p>
                      <p className="text-[18px] font-medium text-navy/85">Website: www.quardcubelabs.co.tz</p>
                    </div>
                    <div className="text-right bg-transparent">
                      <h1 className="text-3xl sm:text-4xl font-black text-navy mb-1.5 tracking-tight uppercase">INVOICE</h1>
                      <p className="text-[18px] text-navy/85 font-medium">
                        Invoice #<span className="font-bold text-navy text-[18px]">{invoiceToPrint.invoice_number}</span>
                      </p>
                      <p className="text-[18px] text-navy/85 font-medium mt-0.5">
                        Date: <span className="font-bold text-navy text-[18px]">{new Date(invoiceToPrint.created_at).toLocaleDateString()}</span>
                      </p>
                      <p className="text-[18px] text-navy/85 mt-1.5 font-medium">
                        Order Status:{" "}
                        <span
                          className="font-bold capitalize text-[18px]"
                          style={{
                            color:
                              invoiceToPrint.status === "paid" ? "#16a34a" :
                              invoiceToPrint.status === "sent" ? "#2563eb" :
                              invoiceToPrint.status === "cancelled" ? "#dc2626" : "#f59e0b"
                          }}
                        >
                          {invoiceToPrint.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  <hr className="border-navy/30 mb-6" />

                  <div className="flex justify-between mb-7 bg-transparent">
                    <div className="w-1/2 pr-6 bg-transparent">
                      <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">From:</h3>
                      <p className="text-[18px] font-bold text-navy uppercase">QUARDCUBELABS</p>
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">24 Ferry, Kigamboni</p>
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">Dar es Salaam 17101</p>
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">Tanzania</p>
                      <p className="text-[18px] text-navy/85 font-medium mt-0.5">Phone: +255 652 540 496</p>
                    </div>
                    <div className="w-1/2 pl-6 text-right bg-transparent">
                      <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">To:</h3>
                      <p className="text-[18px] font-bold text-navy">{invoiceToPrint.customer_name || "Customer"}</p>
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">{invoiceToPrint.customer_email || ""}</p>
                      {invoiceToPrint.customer_phone && (
                        <p className="text-[18px] text-navy/85 font-medium leading-relaxed">Phone: {invoiceToPrint.customer_phone}</p>
                      )}
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">{invoiceToPrint.customer_address || "Tanzania, United Republic of"}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-7 bg-transparent">
                  <table className="w-full border-collapse bg-transparent">
                    <thead>
                      <tr className="border-b-2 border-navy/60 bg-transparent">
                        <th className="text-left text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider bg-transparent">Item</th>
                        <th className="text-right text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-20 bg-transparent">Qty</th>
                        <th className="text-right text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-36 bg-transparent">Unit Price</th>
                        <th className="text-right text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-36 bg-transparent">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent">
                      {(invoiceToPrint.items || []).map((item, index) => (
                        <tr key={item.id || index} className="border-b border-navy/15 bg-transparent avoid-break">
                          <td className="text-[18px] font-semibold text-navy/90 py-3.5 px-3 bg-transparent">{item.name}</td>
                          <td className="text-right text-[18px] font-bold text-navy/90 py-3.5 px-3 w-20 bg-transparent">{item.quantity}</td>
                          <td className="text-right text-[18px] font-bold text-navy/90 py-3.5 px-3 w-36 whitespace-nowrap bg-transparent">
                            TZS {Number(item.price).toFixed(2)}
                          </td>
                          <td className="text-right text-[18px] font-black text-navy py-3.5 px-3 w-36 whitespace-nowrap bg-transparent">
                            TZS {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-start bg-transparent avoid-break mb-6 pt-4 border-t border-navy/10">
                  <div className="w-1/2 pr-6 bg-transparent">
                    <h3 className="text-[18px] font-black text-navy mb-2.5 uppercase tracking-wider">Payment Information:</h3>
                    <p className="text-[18px] text-navy/85 font-medium mb-5">Payment Method: Office Pickup</p>
                    <h3 className="text-[18px] font-black text-navy mb-2.5 uppercase tracking-wider">Terms & Conditions:</h3>
                    <ol className="list-decimal list-inside text-[18px] text-navy/85 space-y-1 leading-relaxed bg-transparent">
                      <li>Goods are shipped upon confirmation of 100% payment.</li>
                      <li>Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</li>
                      <li>All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</li>
                    </ol>
                    {invoiceToPrint.notes && (
                      <p className="text-[18px] text-navy/85 mt-3 font-semibold bg-transparent">
                        Note: {invoiceToPrint.notes}
                      </p>
                    )}
                  </div>
                  <div className="w-1/2 pl-6 text-right bg-transparent">
                    <div className="space-y-2 bg-transparent">
                      <div className="flex justify-between text-[18px] text-navy/85 font-medium bg-transparent">
                        <span>Subtotal:</span>
                        <span className="font-bold text-navy">TZS {Number(invoiceToPrint.total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[18px] text-navy/85 font-medium bg-transparent">
                        <span>Shipping Cost:</span>
                        <span className="font-bold text-green-600">TZS 0.00</span>
                      </div>
                      <div className="flex justify-between text-[18px] text-navy/85 font-medium border-b border-navy/25 pb-2 bg-transparent">
                        <span>Tax:</span>
                        <span className="font-bold text-navy">TZS 0.00</span>
                      </div>
                      <div className="flex justify-between text-2xl sm:text-3xl font-black text-navy pt-2 bg-transparent">
                        <span>TOTAL DUE:</span>
                        <span>TZS {Number(invoiceToPrint.total).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="w-full flex justify-end items-center pt-8 pb-4 pr-1 sm:pr-3 bg-transparent">
                      <QuardCubeQRCode
                        value={invoiceToPrint.verification_url || `https://quardcubelabs.co.tz/verify/${invoiceToPrint.verification_token || invoiceToPrint.invoice_number}`}
                        size={210}
                        label="Scan to Verify"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 text-center text-[18px] text-navy/70 font-medium bg-transparent avoid-break border-t border-navy/20">
                  <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
                  <p className="mt-1 font-bold text-navy">Thank you for your business!</p>

                  <div className="print-footer-bar flex justify-between items-center text-[12px] text-navy/70 font-semibold border-t border-navy/15 pt-2 mt-4">
                    <span>Invoice Ref: #{invoiceToPrint.invoice_number}</span>
                    <span>Page 1 of 1</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
