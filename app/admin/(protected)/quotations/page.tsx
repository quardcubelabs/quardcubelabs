"use client"

import { useEffect, useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Trash2,
  FileText,
  User,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  RefreshCw,
  Package,
  Wrench,
  Sparkles,
  Layers,
  ExternalLink,
  ShieldCheck,
  Edit,
} from "lucide-react"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import { getProducts, type Product } from "@/lib/product-actions"
import { getServices } from "@/lib/services-actions"
import type { Service } from "@/types/database"
import {
  createAdminQuotation,
  getAdminQuotations,
  deleteAdminQuotation,
  updateQuotationStatus,
  type AdminQuotation,
  type QuotationItem,
} from "@/lib/quotation-actions"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import QuardCubeQRCode from "@/components/ui/quardcube-qr-code"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminFilterTabs,
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

type QuoteStatus = AdminQuotation["status"]

const STATUS_OPTIONS: Array<{ value: QuoteStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
]

const INITIAL_STATUS_OPTIONS = STATUS_OPTIONS.filter((option) =>
  ["draft", "sent", "accepted"].includes(option.value)
)

const VALIDITY_OPTIONS = [
  { value: "7", label: "7 Days" },
  { value: "14", label: "14 Days" },
  { value: "30", label: "30 Days (Default)" },
  { value: "60", label: "60 Days" },
  { value: "90", label: "90 Days" },
  { value: "custom", label: "Custom Date" },
]

export default function AdminQuotationsPage() {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [quotations, setQuotations] = useState<AdminQuotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<AdminQuotation | null>(null)
  const [printingQuotation, setPrintingQuotation] = useState<AdminQuotation | null>(null)
  const printComponentRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Status change state
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [statusQuotation, setStatusQuotation] = useState<AdminQuotation | null>(null)
  const [editStatus, setEditStatus] = useState<QuoteStatus>("draft")
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    quotation: AdminQuotation
    status: QuoteStatus
  } | null>(null)

  // Delete state
  const [quotationToDelete, setQuotationToDelete] = useState<AdminQuotation | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
        .quotation-print-root {
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
        .quotation-print-root tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .quotation-print-root table,
        .quotation-print-root thead,
        .quotation-print-root tbody,
        .quotation-print-root tr,
        .quotation-print-root th,
        .quotation-print-root td,
        .quotation-print-root div,
        .quotation-print-root p,
        .quotation-print-root h1,
        .quotation-print-root h2,
        .quotation-print-root h3,
        .quotation-print-root span,
        .quotation-print-root ol,
        .quotation-print-root li {
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

  const handleOpenPreview = (quote: AdminQuotation) => {
    setSelectedQuotation(quote)
    setIsDetailOpen(true)
  }

  const handlePrintQuotation = (quote: AdminQuotation) => {
    setSelectedQuotation(quote)
    setPrintingQuotation(quote)
  }

  useEffect(() => {
    if (printingQuotation && printComponentRef.current) {
      const timer = setTimeout(() => {
        handleTriggerPrint()
        setPrintingQuotation(null)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [printingQuotation, handleTriggerPrint])

  // Creation form state
  const [customerMode, setCustomerMode] = useState<"registered" | "manual">("registered")
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })

  const [itemTypeTab, setItemTypeTab] = useState<"product" | "service" | "custom">("product")
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])

  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [serviceCustomPrice, setServiceCustomPrice] = useState<number>(0)
  const [serviceCustomNotes, setServiceCustomNotes] = useState<string>("")

  const [customItem, setCustomItem] = useState({
    name: "",
    price: 0,
    quantity: 1,
    description: "",
    type: "custom" as "product" | "service" | "custom"
  })

  const [productSearch, setProductSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")

  const [validityDays, setValidityDays] = useState<string>("30")
  const [customValidUntil, setCustomValidUntil] = useState<string>("")
  const [quoteNotes, setQuoteNotes] = useState("")
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("draft")

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
      const [usersResult, productsData, servicesResult, quotationsData] = await Promise.all([
        getAuthUsers(),
        getProducts(),
        getServices(),
        getAdminQuotations()
      ])

      if (usersResult.error) {
        setError(usersResult.error)
      } else {
        setUsers(usersResult.users)
        setFilteredUsers(usersResult.users)
      }

      setProducts(productsData || [])
      setServices(servicesResult.data || [])
      setQuotations(quotationsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load quotations data")
    } finally {
      setIsLoading(false)
    }
  }

  const getUserDisplayName = (user: AuthUser) => {
    return user.user_metadata?.full_name ||
           user.user_metadata?.name ||
           `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim() ||
           user.email?.split('@')[0] ||
           'Unknown Customer'
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
    const existingItem = quotationItems.find(item => item.id === `prod-${product.id}`)

    if (existingItem) {
      setQuotationItems(quotationItems.map(item =>
        item.id === `prod-${product.id}`
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setQuotationItems([...quotationItems, {
        id: `prod-${product.id}`,
        name: product.name,
        type: "product",
        quantity: 1,
        price: product.price,
        image: product.image || "/placeholder.png",
        category: product.category,
        description: product.description?.slice(0, 100)
      }])
    }

    toast({
      title: "Product Added",
      description: `Added "${product.name}" to quotation`,
    })
  }

  const handleAddService = (service: Service) => {
    const price = serviceCustomPrice > 0 ? serviceCustomPrice : 0
    const itemId = `srv-${service.id}-${Date.now()}`

    setQuotationItems([...quotationItems, {
      id: itemId,
      name: service.title,
      type: "service",
      quantity: 1,
      price: price,
      image: service.image_url || "/placeholder.png",
      category: service.category,
      description: serviceCustomNotes || service.short_description || service.description?.slice(0, 120) || ""
    }])

    setSelectedServiceId("")
    setServiceCustomPrice(0)
    setServiceCustomNotes("")

    toast({
      title: "Service Added",
      description: `Added service "${service.title}" to quotation`,
    })
  }

  const handleAddCustomItem = () => {
    if (!customItem.name.trim() || customItem.price <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please enter a valid item name and price greater than 0",
        variant: "destructive"
      })
      return
    }

    setQuotationItems([...quotationItems, {
      id: `custom-${Date.now()}`,
      name: customItem.name,
      type: customItem.type,
      quantity: customItem.quantity > 0 ? customItem.quantity : 1,
      price: customItem.price,
      description: customItem.description
    }])

    setCustomItem({
      name: "",
      price: 0,
      quantity: 1,
      description: "",
      type: "custom"
    })

    toast({
      title: "Custom Item Added",
      description: "Item successfully added to quotation",
    })
  }

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    setQuotationItems(quotationItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const handleRemoveItem = (itemId: string) => {
    setQuotationItems(quotationItems.filter(item => item.id !== itemId))
  }

  const calculateTotal = () => {
    return quotationItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const computeValidUntilDate = (): string => {
    if (customValidUntil) {
      return new Date(customValidUntil).toISOString()
    }
    const days = parseInt(validityDays) || 30
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString()
  }

  const resetCreateForm = () => {
    setSelectedUser(null)
    setCustomerMode("registered")
    setQuotationItems([])
    setCustomerInfo({ name: "", email: "", phone: "", address: "" })
    setQuoteNotes("")
    setValidityDays("30")
    setCustomValidUntil("")
    setQuoteStatus("draft")
    setUserSearchTerm("")
    setProductSearch("")
    setServiceSearch("")
  }

  const handleCreateQuotation = async () => {
    if (!customerInfo.name.trim() || !customerInfo.email.trim()) {
      toast({
        title: "Missing Customer Details",
        description: "Please provide a customer name and email address",
        variant: "destructive"
      })
      return
    }

    if (quotationItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one product or service to the quotation",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)

      await createAdminQuotation({
        userId: selectedUser ? selectedUser.id : null,
        items: quotationItems,
        total: calculateTotal(),
        status: quoteStatus,
        customerInfo: {
          name: customerInfo.name.trim(),
          email: customerInfo.email.trim(),
          phone: customerInfo.phone.trim() || undefined,
          address: customerInfo.address.trim() || undefined
        },
        notes: quoteNotes.trim() || undefined,
        validUntil: computeValidUntilDate()
      })

      toast({
        title: "Quotation Created",
        description: "Quotation has been created successfully"
      })

      resetCreateForm()
      setIsCreateOpen(false)
      await loadData()
    } catch (error: any) {
      console.error("Error creating quotation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const confirmDelete = async () => {
    if (!quotationToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminQuotation(quotationToDelete.id)
      toast({ title: "Quotation Deleted", description: "Quotation has been deleted successfully" })
      setQuotations(previous => previous.filter(q => q.id !== quotationToDelete.id))
      setSelectedQuotation(previous => previous?.id === quotationToDelete.id ? null : previous)
      setQuotationToDelete(null)
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({ title: "Error", description: "Failed to delete quotation", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (quotationId: string, newStatus: QuoteStatus) => {
    try {
      const updated = await updateQuotationStatus(quotationId, newStatus)
      if (updated) {
        toast({ title: "Status Updated", description: `Quotation marked as ${newStatus}` })
        setQuotations(previous => previous.map(q => q.id === quotationId ? updated : q))
        setSelectedQuotation(previous => previous?.id === quotationId ? updated : previous)
      }
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" })
    }
  }

  // Stats
  const totalQuotations = quotations.length
  const acceptedQuotations = quotations.filter(q => q.status === "accepted").length
  const sentQuotations = quotations.filter(q => q.status === "sent").length
  const draftQuotations = quotations.filter(q => q.status === "draft").length
  const expiredQuotations = quotations.filter(q => q.status === "expired" || q.status === "declined").length
  const totalQuotedValue = quotations.reduce((sum, q) => sum + (Number(q.total) || 0), 0)

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
    { key: "all", label: "All Quotations", icon: FileText, count: totalQuotations },
    { key: "sent", label: "Sent", icon: Clock, count: sentQuotations },
    { key: "accepted", label: "Accepted", icon: CheckCircle, count: acceptedQuotations },
    { key: "draft", label: "Draft", icon: Edit, count: draftQuotations },
    { key: "expired", label: "Expired", icon: Calendar, count: quotations.filter(q => q.status === "expired").length },
    { key: "declined", label: "Declined", icon: XCircle, count: quotations.filter(q => q.status === "declined").length },
  ]

  const filteredQuotations = quotations.filter((quote) => {
    if (activeTab !== "all" && quote.status !== activeTab) {
      return false
    }
    if (statusFilter !== "all" && quote.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        quote.quote_number?.toLowerCase().includes(q) ||
        quote.customer_name?.toLowerCase().includes(q) ||
        quote.customer_email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const modalFilteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const modalFilteredServices = services.filter(s =>
    s.title.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  if (isLoading) {
    return <AdminLoading type="quotations" />
  }

  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
        <AdminPageHeader
          title="Quotation"
          accent="Management"
          subtitle="Create, estimate and manage customer quotations"
          icon={FileText}
        />
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    )
  }

  const quotationToPrint = printingQuotation || selectedQuotation

  const columns: AdminTableColumn<AdminQuotation>[] = [
    {
      key: "quote",
      header: "Quote #",
      render: (quote) => (
        <AdminPrimaryCell
          icon={FileText}
          title={`#${quote.quote_number}`}
          subtitle={quote.customer_email}
        />
      ),
    },
    {
      key: "client",
      header: "Customer",
      render: (quote) => (
        <AdminPrimaryCell
          icon={User}
          title={quote.customer_name || "Unknown Customer"}
          subtitle={quote.customer_email}
        />
      ),
    },
    {
      key: "amount",
      header: "Quoted Amount",
      align: "right",
      render: (quote) => (
        <span className="whitespace-nowrap font-black text-xs sm:text-sm tracking-tight">
          TSH {Number(quote.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (quote) => <AdminStatusBadge status={quote.status} />,
    },
    {
      key: "valid",
      header: "Valid Until",
      hidden: "md",
      render: (quote) => (
        <AdminMutedText>
          {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "30 Days"}
        </AdminMutedText>
      ),
    },
  ]

  const actions: AdminTableAction<AdminQuotation>[] = [
    {
      key: "view",
      label: "View quotation details",
      icon: Eye,
      variant: "view",
      onClick: (quote) => handleOpenPreview(quote),
    },
    {
      key: "print",
      label: "Print Quotation",
      icon: Printer,
      variant: "soft",
      mobile: false,
      onClick: (quote) => handlePrintQuotation(quote),
    },
    {
      key: "status",
      label: "Update Status",
      icon: RefreshCw,
      variant: "soft",
      mobile: false,
      onClick: (quote) => {
        setStatusQuotation(quote)
        setEditStatus(quote.status)
        setIsStatusOpen(true)
      },
    },
    {
      key: "delete",
      label: "Delete Quotation",
      icon: Trash2,
      variant: "delete",
      onClick: (quote) => setQuotationToDelete(quote),
    },
  ]

  const quotationItemColumns: AdminTableColumn<QuotationItem>[] = [
    {
      key: "details",
      header: "Item Details",
      render: (item) => (
        <div className="flex items-center gap-2 min-w-0 font-bold">
          <div className="h-9 w-9 shrink-0 rounded-lg border-2 border-navy/15 bg-white p-1 flex items-center justify-center overflow-hidden dark:border-teal/30">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.name}
                width={36}
                height={36}
                className="h-full w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
              />
            ) : item.type === "service" ? (
              <Wrench className="h-5 w-5 text-navy/40" />
            ) : item.type === "custom" ? (
              <Sparkles className="h-5 w-5 text-navy/40" />
            ) : (
              <Package className="h-5 w-5 text-navy/40" />
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate">{item.name}</span>
            {item.description && (
              <span className="block text-[10px] opacity-70 line-clamp-2">{item.description}</span>
            )}
            {item.type === "product" && !item.id?.startsWith("custom-") && (
              <Link
                href={`/shop/product/${item.id.replace(/^prod-/, "")}`}
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
      key: "type",
      header: "Type",
      align: "center",
      render: (item) => <AdminTag>{item.type || "product"}</AdminTag>,
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

  const detailSections: AdminDetailSectionData[] = selectedQuotation
    ? [
        {
          key: "items",
          title: `Quoted Items (${selectedQuotation.items?.length || 0})`,
          icon: Layers,
          span: 2,
          content: (
            <div className="space-y-3">
              <AdminTable
                inline
                columns={quotationItemColumns}
                data={selectedQuotation.items || []}
                rowKey={(item) => item.id}
                emptyTitle="No item records found for this quotation"
                emptyDescription=""
                footer={
                  <tfoot>
                    <tr className="border-t-2 border-navy/20 dark:border-teal/40 font-black">
                      <td colSpan={4} className="py-2.5 px-2 text-right uppercase">Total Estimate</td>
                      <td className="py-2.5 px-2 text-right font-mono">TZS {Number(selectedQuotation.total || 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                }
                className="text-xs"
              />
              <div className="space-y-1 text-xs leading-relaxed opacity-90">
                <p className="font-black uppercase tracking-wider">Quotation Validity & Terms</p>
                <p>
                  â€¢ This estimate is valid for {selectedQuotation.valid_until ? `until ${new Date(selectedQuotation.valid_until).toLocaleDateString()}` : "30 days from issuance"}.
                  <br />
                  â€¢ A 50% advance deposit is required to initiate execution of the quoted scope.
                </p>
                {selectedQuotation.notes && (
                  <div className="pt-2">
                    <p className="font-black uppercase tracking-wider">Notes & Project Scope</p>
                    <p className="whitespace-pre-wrap">{selectedQuotation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ),
        },
        {
          key: "status",
          title: "Quote Status & Financials",
          icon: DollarSign,
          fields: [
            { label: "Status", value: <AdminStatusBadge status={selectedQuotation.status} /> },
            { label: "Subtotal Items", value: `TZS ${Number(selectedQuotation.total || 0).toLocaleString()}` },
            { label: "Estimated Shipping", value: "TZS 0.00" },
            { label: "Estimated Tax", value: "TZS 0.00" },
            {
              label: "Valid Until",
              value: selectedQuotation.valid_until ? new Date(selectedQuotation.valid_until).toLocaleDateString() : "30 Days",
            },
          ],
        },
        {
          key: "customer",
          title: "Customer Profile",
          icon: User,
          fields: [
            { label: "Full Name", value: selectedQuotation.customer_name || "Customer Name Not Provided" },
            { label: "Email Address", value: selectedQuotation.customer_email || "No email on record" },
            { label: "Phone Contact", value: selectedQuotation.customer_phone || "â€”" },
            { label: "Location / Address", value: selectedQuotation.customer_address || "Tanzania" },
          ],
        },
        {
          key: "verification",
          title: "Document Verification",
          icon: ShieldCheck,
          content: (
            <div className="flex flex-col items-center gap-2 text-center">
              <QuardCubeQRCode
                value={selectedQuotation.verification_url || `https://quardcubelabs.co.tz/verify/${selectedQuotation.verification_token || selectedQuotation.quote_number}`}
                size={140}
                label="SCAN TO AUTHENTICATE"
                clickable
              />
              <p className="text-[11px] font-mono text-teal font-semibold break-all">
                Verification ID: {selectedQuotation.verification_token || selectedQuotation.quote_number}
              </p>
            </div>
          ),
          fields: [
            { label: "Token", value: selectedQuotation.verification_token || "â€”" },
            { label: "Verification URL", value: selectedQuotation.verification_url || "â€”" },
          ],
        },
      ]
    : []

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Quotation"
        accent="Management"
        subtitle="Create, estimate and manage customer price quotes"
        icon={FileText}
        onRefresh={loadData}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Create Quotation"
      />

      <AdminStats
        columns={5}
        items={[
          { title: "Total Quotes", value: formatStatNumber(totalQuotations), icon: FileText },
          { title: "Accepted", value: formatStatNumber(acceptedQuotations), icon: CheckCircle, onClick: () => setActiveTab("accepted") },
          { title: "Sent / Pending", value: formatStatNumber(sentQuotations), icon: Clock, onClick: () => setActiveTab("sent") },
          { title: "Drafts", value: formatStatNumber(draftQuotations), icon: AlertCircle, onClick: () => setActiveTab("draft") },
          { title: "Total Quoted", value: formatStatCurrency(totalQuotedValue), icon: DollarSign },
        ]}
      />

      <AdminFilterBar
        tabs={tabs}
        tabValue={activeTab}
        onTabChange={setActiveTab}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by quote #, customer name or email..."
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
        data={filteredQuotations}
        rowKey={(quote) => quote.id}
        actions={actions}
        emptyIcon={FileText}
        emptyTitle="No quotations found"
        emptyDescription='Click "Create Quotation" to generate a new price quote'
      />

      <AdminDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        icon={FileText}
        title={`Quotation #${selectedQuotation?.quote_number || "Details"}`}
        subtitle={
          selectedQuotation
            ? `Issued on ${new Date(selectedQuotation.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}${selectedQuotation.valid_until ? ` â€¢ Valid until ${new Date(selectedQuotation.valid_until).toLocaleDateString()}` : ""}`
            : undefined
        }
        badge={selectedQuotation ? <AdminStatusBadge status={selectedQuotation.status} /> : undefined}
        sections={detailSections}
        fields={
          selectedQuotation
            ? [
                { label: "Quote ID", value: selectedQuotation.id },
                { label: "User ID", value: selectedQuotation.user_id || "â€”" },
                { label: "Created", value: new Date(selectedQuotation.created_at).toLocaleString() },
                { label: "Updated", value: new Date(selectedQuotation.updated_at).toLocaleString() },
              ]
            : undefined
        }
        size="xl"
        footerActions={
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => selectedQuotation && handlePrintQuotation(selectedQuotation)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Print Quotation
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!selectedQuotation) return
                setStatusQuotation(selectedQuotation)
                setEditStatus(selectedQuotation.status)
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
        onDelete={() => selectedQuotation && setQuotationToDelete(selectedQuotation)}
        deleteLabel="Delete Quotation"
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        icon={FileText}
        title="Create New Quotation"
        description="Select existing products/services from the database or enter custom items manually."
        onSubmit={(event) => {
          event.preventDefault()
          void handleCreateQuotation()
        }}
        isSubmitting={isCreating}
        createLabel="Generate Quotation"
        size="lg"
      >
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider">Customer Information</h4>
          <AdminFilterTabs
            tabs={[
              { key: "registered", label: "From Users", icon: User },
              { key: "manual", label: "Manual Input", icon: Edit },
            ]}
            value={customerMode}
            onChange={(value) => {
              const mode = value as "registered" | "manual"
              setCustomerMode(mode)
              if (mode === "manual") setSelectedUser(null)
            }}
          />
        </div>

        {customerMode === "registered" && (
          <AdminFormField label="Registered Customers">
            <AdminInput
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search registered customers..."
            />
            <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border-2 border-navy/20 dark:border-teal/30 divide-y divide-navy/10 dark:divide-teal/20">
              {filteredUsers.slice(0, 8).map((user) => (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    "w-full text-left p-2.5 hover:bg-teal/10 transition-colors",
                    selectedUser?.id === user.id && "bg-navy/10 border-l-4 border-navy font-bold"
                  )}
                >
                  <span className="block text-xs font-bold">{getUserDisplayName(user)}</span>
                  <span className="block text-[11px] opacity-70">{user.email}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-3 text-center text-xs opacity-60">No customers found</div>
              )}
            </div>
          </AdminFormField>
        )}

        <AdminFormGrid>
          <AdminFormField label="Customer Name" required>
            <AdminInput
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              placeholder="e.g. John Doe / Tech Corp"
            />
          </AdminFormField>
          <AdminFormField label="Customer Email" required>
            <AdminInput
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              placeholder="e.g. client@example.com"
            />
          </AdminFormField>
          <AdminFormField label="Phone">
            <AdminInput
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="+255..."
            />
          </AdminFormField>
          <AdminFormField label="Address">
            <AdminInput
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              placeholder="Location..."
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-3 rounded-2xl border-2 border-navy/20 p-4 dark:border-teal/30">
          <h4 className="text-xs font-black uppercase tracking-wider">Quote Validity & Settings</h4>
          <AdminFormGrid>
            <AdminFormField label="Valid For">
              <AdminSelect
                value={validityDays}
                onValueChange={(value) => {
                  setValidityDays(value)
                  setCustomValidUntil("")
                }}
                options={VALIDITY_OPTIONS}
              />
            </AdminFormField>
            <AdminFormField label="Initial Status">
              <AdminSelect
                value={quoteStatus}
                onValueChange={(value) => setQuoteStatus(value as QuoteStatus)}
                options={INITIAL_STATUS_OPTIONS}
              />
            </AdminFormField>
          </AdminFormGrid>
          {validityDays === "custom" && (
            <AdminFormField label="Custom Expiry Date">
              <AdminInput
                type="date"
                value={customValidUntil}
                onChange={(e) => setCustomValidUntil(e.target.value)}
              />
            </AdminFormField>
          )}
          <AdminFormField label="Quotation Notes / Terms">
            <AdminTextarea
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              rows={2}
              placeholder="Special terms, inclusions, discounts, or project assumptions..."
            />
          </AdminFormField>
        </div>

        <div className="space-y-3 border-t border-navy/10 pt-4 dark:border-teal/20">
          <h4 className="text-xs font-black uppercase tracking-wider">Add Items to Quotation</h4>
          <AdminFilterTabs
            tabs={[
              { key: "product", label: `Products (${products.length})`, icon: Package },
              { key: "service", label: `Services (${services.length})`, icon: Wrench },
              { key: "custom", label: "Manual Entry", icon: Sparkles },
            ]}
            value={itemTypeTab}
            onChange={(value) => setItemTypeTab(value as "product" | "service" | "custom")}
          />

          {itemTypeTab === "product" && (
            <div className="space-y-2">
              <AdminInput
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search database products..."
              />
              <div className="max-h-48 overflow-y-auto rounded-xl border-2 border-navy/20 divide-y divide-navy/10 dark:border-teal/30 dark:divide-teal/20">
                {modalFilteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 p-2.5 hover:bg-teal/10">
                    <div className="flex items-center gap-2 min-w-0">
                      {product.image ? (
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-slate-100">
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <Package className="h-6 w-6 shrink-0 text-navy/40" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold">{product.name}</div>
                        <div className="text-xs font-bold text-teal">TZS {product.price.toLocaleString()}</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddProduct(product)}
                      className="h-7 shrink-0 gap-1 px-2.5 text-xs"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                ))}
                {modalFilteredProducts.length === 0 && (
                  <div className="p-4 text-center text-xs opacity-60">No products match search</div>
                )}
              </div>
            </div>
          )}

          {itemTypeTab === "service" && (
            <div className="space-y-3">
              <AdminInput
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search database services..."
              />
              <AdminFormField label="Select Service">
                <AdminSelect
                  value={selectedServiceId}
                  onValueChange={(value) => {
                    setSelectedServiceId(value)
                    const service = services.find(srv => srv.id === value)
                    if (service && service.price_range) {
                      const match = service.price_range.replace(/,/g, '').match(/\d+/)
                      if (match) setServiceCustomPrice(parseInt(match[0]))
                    }
                  }}
                  placeholder="Choose a service to configure..."
                  options={modalFilteredServices.map((service) => ({
                    value: service.id,
                    label: `${service.title} (${service.category})${service.price_range ? ` â€” ${service.price_range}` : ""}`,
                  }))}
                />
              </AdminFormField>

              {selectedServiceId && (
                <div className="space-y-2 rounded-xl border-2 border-blue-500/30 bg-blue-500/10 p-3">
                  <p className="text-xs font-black">{services.find(s => s.id === selectedServiceId)?.title}</p>
                  <AdminFormGrid>
                    <AdminFormField label="Quoted Price (TZS)" required>
                      <AdminInput
                        type="number"
                        monospace
                        value={serviceCustomPrice || ""}
                        onChange={(e) => setServiceCustomPrice(parseFloat(e.target.value) || 0)}
                        placeholder="Enter price"
                      />
                    </AdminFormField>
                    <AdminFormField label="Scope / Scope Notes">
                      <AdminInput
                        value={serviceCustomNotes}
                        onChange={(e) => setServiceCustomNotes(e.target.value)}
                        placeholder="e.g. 3 Months, Standard Package..."
                      />
                    </AdminFormField>
                  </AdminFormGrid>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const service = services.find(srv => srv.id === selectedServiceId)
                      if (service) handleAddService(service)
                    }}
                    className="w-full gap-1 bg-navy font-bold text-white hover:bg-navy/90"
                  >
                    <Plus className="h-3 w-3" /> Add Service to Quotation
                  </Button>
                </div>
              )}
            </div>
          )}

          {itemTypeTab === "custom" && (
            <div className="space-y-3 rounded-2xl border-2 border-navy/20 p-4 dark:border-teal/30">
              <AdminFormGrid className="grid-cols-1 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <AdminFormField label="Item or Service Name" required>
                  <AdminInput
                    value={customItem.name}
                    onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                    placeholder="e.g. Network Cabling / Custom Software"
                  />
                </AdminFormField>
                <AdminFormField label="Type">
                  <AdminSelect
                    value={customItem.type}
                    onValueChange={(value) => setCustomItem({ ...customItem, type: value as "product" | "service" | "custom" })}
                    options={[
                      { value: "product", label: "Product" },
                      { value: "service", label: "Service" },
                      { value: "custom", label: "Custom" },
                    ]}
                  />
                </AdminFormField>
              </AdminFormGrid>
              <AdminFormGrid>
                <AdminFormField label="Unit Price (TZS)" required>
                  <AdminInput
                    type="number"
                    monospace
                    value={customItem.price || ""}
                    onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </AdminFormField>
                <AdminFormField label="Quantity">
                  <AdminInput
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={(e) => setCustomItem({ ...customItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </AdminFormField>
              </AdminFormGrid>
              <AdminFormField label="Description (Optional)">
                <AdminInput
                  value={customItem.description}
                  onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                  placeholder="Specification details, warranty, or scope..."
                />
              </AdminFormField>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomItem}
                className="w-full gap-1 border-2 font-bold"
              >
                <Plus className="h-3 w-3" /> Add Manual Item
              </Button>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-black uppercase tracking-wider">
              Items in Quotation ({quotationItems.length})
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border-2 border-navy/20 divide-y divide-navy/10 dark:border-teal/30 dark:divide-teal/20">
              {quotationItems.length === 0 ? (
                <div className="p-4 text-center text-xs opacity-60">
                  No items added yet. Select products, services, or add manual items above.
                </div>
              ) : quotationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 p-2.5 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AdminTag>{item.type}</AdminTag>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] opacity-70">
                      TZS {item.price.toLocaleString()} Ã— {item.quantity} ={" "}
                      <strong className="text-teal">TZS {(item.price * item.quantity).toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <AdminInput
                      type="number"
                      min="1"
                      className="h-9 w-16 text-center"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-9 w-9 text-brand-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border-2 border-navy/20 p-4 dark:border-teal/30">
            <span className="font-bold text-sm">Total Quoted Amount:</span>
            <span className="text-xl font-black text-teal">TZS {calculateTotal().toLocaleString()}</span>
          </div>
        </div>
      </AdminFormModal>

      <AdminFormModal
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        icon={RefreshCw}
        title="Update Quotation Status"
        description={`Change status for quotation #${statusQuotation?.quote_number}`}
        onSubmit={(event) => {
          event.preventDefault()
          if (!statusQuotation) return
          setPendingStatusChange({ quotation: statusQuotation, status: editStatus })
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
              onValueChange={(value) => setEditStatus(value as QuoteStatus)}
              options={STATUS_OPTIONS}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      <AdminConfirmDialog
        open={quotationToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setQuotationToDelete(null)
        }}
        title="Delete Quotation"
        description={
          quotationToDelete
            ? `Are you sure you want to delete Quotation #${quotationToDelete.quote_number}? This action cannot be undone.`
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
            ? `Change Quotation #${pendingStatusChange.quotation.quote_number} status to ${pendingStatusChange.status}?`
            : undefined
        }
        confirmLabel="Confirm Change"
        destructive={false}
        onConfirm={async () => {
          if (!pendingStatusChange) return
          await handleStatusChange(pendingStatusChange.quotation.id, pendingStatusChange.status)
          setPendingStatusChange(null)
        }}
      />

      {/* Hidden printable quotation container for react-to-print */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: "210mm" }}>
        <div ref={printComponentRef}>
          {quotationToPrint && (
            <div className="quotation-print-root w-full font-sans text-navy bg-transparent relative">
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
                    <span>QUARDCUBE LABS &bull; COMMERCIAL QUOTATION</span>
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
                      <h1 className="text-3xl sm:text-4xl font-black text-navy mb-1.5 tracking-tight uppercase">QUOTATION</h1>
                      <p className="text-[18px] text-navy/85 font-medium">
                        Quote #<span className="font-bold text-navy text-[18px]">{quotationToPrint.quote_number}</span>
                      </p>
                      <p className="text-[18px] text-navy/85 font-medium mt-0.5">
                        Date: <span className="font-bold text-navy text-[18px]">{new Date(quotationToPrint.created_at).toLocaleDateString()}</span>
                      </p>
                      <p className="text-[18px] text-navy/85 font-medium mt-0.5">
                        Valid Until: <span className="font-bold text-navy text-[18px]">{quotationToPrint.valid_until ? new Date(quotationToPrint.valid_until).toLocaleDateString() : "30 Days from issue"}</span>
                      </p>
                      <p className="text-[18px] text-navy/85 mt-1.5 font-medium">
                        Status:{" "}
                        <span
                          className="font-bold capitalize text-[18px]"
                          style={{
                            color:
                              quotationToPrint.status === "accepted" ? "#16a34a" :
                              quotationToPrint.status === "sent" ? "#2563eb" :
                              quotationToPrint.status === "declined" ? "#dc2626" : "#f59e0b"
                          }}
                        >
                          {quotationToPrint.status}
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
                      <p className="text-[18px] font-bold text-navy">{quotationToPrint.customer_name || "Customer"}</p>
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">{quotationToPrint.customer_email || ""}</p>
                      {quotationToPrint.customer_phone && (
                        <p className="text-[18px] text-navy/85 font-medium leading-relaxed">Phone: {quotationToPrint.customer_phone}</p>
                      )}
                      <p className="text-[18px] text-navy/85 font-medium leading-relaxed">{quotationToPrint.customer_address || "Tanzania, United Republic of"}</p>
                    </div>
                  </div>

                  <div className="mb-8 bg-transparent">
                    <table className="w-full border-collapse bg-transparent">
                      <thead>
                        <tr className="border-b-2 border-navy/60 bg-transparent">
                          <th className="text-left text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider bg-transparent">Item / Service Description</th>
                          <th className="text-center text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-24 bg-transparent">Type</th>
                          <th className="text-right text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-20 bg-transparent">Qty</th>
                          <th className="text-right text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-36 bg-transparent">Unit Price</th>
                          <th className="text-right text-[18px] font-black text-navy py-3 px-3 uppercase tracking-wider w-36 bg-transparent">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-transparent">
                        {(quotationToPrint.items || []).map((item, index) => (
                          <tr key={item.id || index} className="border-b border-navy/15 bg-transparent avoid-break">
                            <td className="text-[18px] font-semibold text-navy/90 py-3.5 px-3 bg-transparent">
                              <div className="font-bold text-navy">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-navy/70 mt-0.5">{item.description}</div>
                              )}
                            </td>
                            <td className="text-center text-[18px] font-medium text-navy/80 py-3.5 px-3 capitalize bg-transparent">{item.type}</td>
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
                      {quotationToPrint.notes && (
                        <div className="mb-4 bg-transparent">
                          <h3 className="text-[18px] font-black text-navy mb-1.5 uppercase tracking-wider">Notes & Scope:</h3>
                          <p className="text-[18px] text-navy/85 font-medium leading-relaxed">{quotationToPrint.notes}</p>
                        </div>
                      )}
                      <h3 className="text-[18px] font-black text-navy mb-2 uppercase tracking-wider">Terms & Conditions:</h3>
                      <ol className="list-decimal list-inside text-[18px] text-navy/85 space-y-1.5 leading-relaxed bg-transparent font-medium">
                        <li>This quotation is valid for the duration specified from date of issue.</li>
                        <li>A 50% advance deposit is required upon confirmation to initiate the service/order.</li>
                        <li>Final prices are subject to agreed project scope and change order requests.</li>
                        <li>All payments should be made through official QuardCubeLabs Company Limited channels.</li>
                      </ol>
                    </div>
                    <div className="w-1/2 pl-6 text-right bg-transparent">
                      <div className="space-y-1.5 bg-transparent">
                        <div className="flex justify-between text-[18px] text-navy/85 font-medium bg-transparent">
                          <span>Subtotal Items:</span>
                          <span className="font-bold text-navy">TZS {Number(quotationToPrint.total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[18px] text-navy/85 font-medium bg-transparent">
                          <span>Estimated Shipping:</span>
                          <span className="font-bold text-green-600">TZS 0.00</span>
                        </div>
                        <div className="flex justify-between text-[18px] text-navy/85 font-medium border-b border-navy/25 pb-1.5 bg-transparent">
                          <span>Estimated Tax:</span>
                          <span className="font-bold text-navy">TZS 0.00</span>
                        </div>
                        <div className="flex justify-between text-2xl sm:text-3xl font-black text-navy pt-2 bg-transparent">
                          <span>TOTAL ESTIMATE:</span>
                          <span>TZS {Number(quotationToPrint.total).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="w-full flex justify-end items-center pt-8 pb-4 pr-1 sm:pr-3 bg-transparent">
                        <QuardCubeQRCode
                          value={quotationToPrint.verification_url || `https://quardcubelabs.co.tz/verify/${quotationToPrint.verification_token || quotationToPrint.quote_number}`}
                          size={210}
                          label="Scan to Verify"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 text-center text-[18px] text-navy/70 font-medium bg-transparent avoid-break border-t border-navy/20">
                  <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
                  <p className="mt-1 font-bold text-navy">Thank you for your business!</p>

                  <div className="print-footer-bar flex justify-between items-center text-[12px] text-navy/70 font-semibold border-t border-navy/15 pt-2 mt-4">
                    <span>Quote Ref: #{quotationToPrint.quote_number}</span>
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
