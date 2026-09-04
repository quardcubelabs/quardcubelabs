"use client"

import { useEffect, useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { AdminLoading } from "@/components/admin"
import { 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
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
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Edit
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  type QuotationItem 
} from "@/lib/quotation-actions"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

export default function AdminQuotationsPage() {
  const { isDark } = useAdminTheme()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [quotations, setQuotations] = useState<AdminQuotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<AdminQuotation | null>(null)
  const [editStatus, setEditStatus] = useState<AdminQuotation['status']>("draft")
  const [selectedQuotation, setSelectedQuotation] = useState<AdminQuotation | null>(null)
  const [printingQuotation, setPrintingQuotation] = useState<AdminQuotation | null>(null)
  const printComponentRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: AdminQuotation['status']) => {
    try {
      const updated = await updateQuotationStatus(quoteId, newStatus)
      if (updated) {
        setQuotations(quotations.map(q => q.id === quoteId ? updated : q))
        if (selectedQuotation && selectedQuotation.id === quoteId) {
          setSelectedQuotation(updated)
        }
      }
      toast({
        title: "Quotation Status Updated",
        description: `Quotation status changed to "${newStatus}".`,
      })
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error("Error updating quote status:", err)
      toast({
        title: "Update Failed",
        description: "Could not update quotation status.",
        variant: "destructive"
      })
    }
  }

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
          width: 210mm !important;
          max-width: 210mm !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
          padding: 10mm 10mm !important;
          background: white !important;
          position: relative !important;
          overflow: visible !important;
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
    setIsPreviewOpen(true)
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
  
  // Item adding tab
  const [itemTypeTab, setItemTypeTab] = useState<"product" | "service" | "custom">("product")
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  
  // Service selection custom state
  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [serviceCustomPrice, setServiceCustomPrice] = useState<number>(0)
  const [serviceCustomNotes, setServiceCustomNotes] = useState<string>("")
  
  // Custom item state
  const [customItem, setCustomItem] = useState({
    name: "",
    price: 0,
    quantity: 1,
    description: "",
    type: "custom" as "product" | "service" | "custom"
  })

  // Product search filter in dialog
  const [productSearch, setProductSearch] = useState("")
  // Service search filter in dialog
  const [serviceSearch, setServiceSearch] = useState("")

  // Quote Meta
  const [validityDays, setValidityDays] = useState<string>("30")
  const [customValidUntil, setCustomValidUntil] = useState<string>("")
  const [quoteNotes, setQuoteNotes] = useState("")
  const [quoteStatus, setQuoteStatus] = useState<"draft" | "sent" | "accepted" | "declined" | "expired">("draft")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Filter users based on search term
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

  const handleUpdateItemPrice = (itemId: string, price: number) => {
    setQuotationItems(quotationItems.map(item =>
      item.id === itemId ? { ...item, price: Math.max(0, price) } : item
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
      
      const quotation = await createAdminQuotation({
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
        description: `Quotation #${quotation.quote_number} has been created successfully`
      })

      // Reset form
      setSelectedUser(null)
      setCustomerMode("registered")
      setQuotationItems([])
      setCustomerInfo({ name: "", email: "", phone: "", address: "" })
      setQuoteNotes("")
      setValidityDays("30")
      setCustomValidUntil("")
      setQuoteStatus("draft")
      setIsCreateDialogOpen(false)

      // Refresh list
      loadData()
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

  const handleDeleteQuotation = async (quotationId: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return
    try {
      await deleteAdminQuotation(quotationId)
      toast({ title: "Quotation Deleted", description: "Quotation has been deleted successfully" })
      if (selectedQuotation?.id === quotationId) setSelectedQuotation(null)
      loadData()
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({ title: "Error", description: "Failed to delete quotation", variant: "destructive" })
    }
  }

  const handleStatusChange = async (quotationId: string, newStatus: "draft" | "sent" | "accepted" | "declined" | "expired") => {
    try {
      const updated = await updateQuotationStatus(quotationId, newStatus)
      if (updated) {
        toast({ title: "Status Updated", description: `Quotation marked as ${newStatus}` })
        if (selectedQuotation?.id === quotationId) setSelectedQuotation(updated)
        loadData()
      }
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30 font-bold"
      case "sent":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-black"
      case "accepted":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black"
      case "declined":
        return "bg-brand-red/20 text-brand-red border-brand-red/40 font-black"
      case "expired":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 font-bold"
    }
  }

  // Stats calculation
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

  // Tabs configuration
  const tabs = [
    { key: "all", label: "All Quotations" },
    { key: "sent", label: "Sent" },
    { key: "accepted", label: "Accepted" },
    { key: "draft", label: "Draft" },
    { key: "expired", label: "Expired" },
    { key: "declined", label: "Declined" },
  ]

  // Filtered quotations
  const filteredQuotations = quotations.filter((quote) => {
    // Tab filter
    if (activeTab !== "all" && quote.status !== activeTab) {
      return false
    }
    // Status dropdown filter
    if (statusFilter !== "all" && quote.status !== statusFilter) return false
    // Search query
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

  // Filter products for modal
  const modalFilteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Filter services for modal
  const modalFilteredServices = services.filter(s => 
    s.title.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Quotation <span className="gradient-text">Management</span>
          </h1>
          <p className="text-gray-600">Create, estimate and manage customer quotations</p>
        </div>
        <AdminLoading message="Loading quotations data..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Quotation <span className="gradient-text">Management</span>
          </h1>
          <p className="text-gray-600">Create, estimate and manage customer quotations</p>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    )
  }

  const quotationToPrint = printingQuotation || selectedQuotation

  return (
    <div className="space-y-4 sm:space-y-6">
      <style jsx global>{`
        @media print {
          aside,
          nav,
          header,
          [role="navigation"],
          .pattern-grid,
          .pattern-grid-dark,
          .print\\:hidden,
          [data-radix-portal] {
            display: none !important;
          }
          * {
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-size: 11px;
            background: white !important;
            color: #000080 !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          section,
          main,
          div {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          main {
            margin-left: 0 !important;
            padding-top: 0 !important;
          }
        }
      `}</style>
      
      {/* Main content - hidden when printing */}
      <div className="print:hidden space-y-4 sm:space-y-6">

        {/* Page Header Card in Teal without borders */}
        <div className={cn(
          "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
          isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
        )}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
                Quotation <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Management</span>
              </h1>
              <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
                Create, estimate and manage customer price quotes
              </p>
            </div>
          </div>
        </div>

        {/* 1. Stats Cards Row - Analytics Style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {[
            { title: "Total Quotes", value: formatStatNumber(totalQuotations), icon: FileText },
            { title: "Accepted", value: formatStatNumber(acceptedQuotations), icon: CheckCircle },
            { title: "Sent / Pending", value: formatStatNumber(sentQuotations), icon: Clock },
            { title: "Drafts", value: formatStatNumber(draftQuotations), icon: AlertCircle },
            { 
              title: "Total Quoted", 
              value: formatStatCurrency(totalQuotedValue), 
              icon: DollarSign 
            }
          ].map((stat, idx) => (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
                idx === 4 ? "col-span-2 sm:col-span-1" : ""
              )}
            >
              <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-base sm:text-lg xl:text-xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
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

        {/* 2. Category / Status Tabs */}
        <div className="border-b border-teal/15">
          <div className="flex gap-2 overflow-x-auto -mb-px pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-all",
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-teal-400 to-teal-500 text-navy font-bold shadow-md shadow-teal-400/20"
                    : isDark 
                      ? "text-slate-300 hover:bg-white/10 hover:text-teal-300"
                      : "text-slate-600 hover:bg-teal-50 hover:text-navy"
                )}
              >
                {tab.label}
                {tab.key !== "all" && (
                  <span className={cn(
                    "ml-2 text-xs px-2 py-0.5 rounded-full font-bold",
                    activeTab === tab.key 
                      ? "bg-navy/20 text-navy" 
                      : isDark ? "bg-white/10 text-teal-300" : "bg-slate-100 text-slate-700"
                  )}>
                    {quotations.filter(q => q.status === tab.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
              <Input
                placeholder="Search by quote #, customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 rounded-xl border border-teal focus:border-teal focus:ring-1 focus:ring-teal",
                  isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400" : "bg-white text-navy"
                )}
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "w-full sm:w-[180px] rounded-xl border",
              isDark ? "bg-[#080d2a] border-teal/25 text-white" : "bg-white border-teal/25 text-navy"
            )}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Action Row without left count */}
        <div className="flex items-center justify-end gap-2">
          <Button 
            onClick={loadData} 
            variant="outline" 
            size="sm" 
            className={cn("rounded-xl border-2 font-bold h-10 px-4", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-navy/20 text-navy hover:bg-navy/10")}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal text-navy font-black rounded-xl shadow-md hover:bg-teal-400 transition-colors h-10 px-5" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Quotation
              </Button>
            </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl text-navy flex items-center gap-2">
                    <FileText className="h-5 w-5 text-cyan-600" />
                    Create New Quotation
                  </DialogTitle>
                  <DialogDescription>
                    Select existing products/services from the database or enter custom items manually.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Left Column: Customer & Quote Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-navy">Customer Information</h3>
                      <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          onClick={() => setCustomerMode("registered")}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            customerMode === "registered" ? "bg-white font-medium shadow-sm text-navy" : "text-gray-600"
                          }`}
                        >
                          From Users
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode("manual")
                            setSelectedUser(null)
                          }}
                          className={`px-2.5 py-1 rounded-md transition-colors ${
                            customerMode === "manual" ? "bg-white font-medium shadow-sm text-navy" : "text-gray-600"
                          }`}
                        >
                          Manual Input
                        </button>
                      </div>
                    </div>

                    {customerMode === "registered" ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-teal" />
                          <Input
                            placeholder="Search registered customers..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10 border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
                          />
                        </div>

                        <div className="max-h-36 overflow-y-auto border rounded-lg">
                          {filteredUsers.slice(0, 8).map((user) => (
                            <div
                              key={user.id}
                              className={`p-2.5 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 text-sm ${
                                selectedUser?.id === user.id ? "bg-navy/10 border-navy font-medium" : ""
                              }`}
                              onClick={() => handleSelectUser(user)}
                            >
                              <div className="text-gray-900">{getUserDisplayName(user)}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          ))}
                          {filteredUsers.length === 0 && (
                            <div className="p-3 text-center text-xs text-gray-500">No customers found</div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Customer Info Form */}
                    <Card className="bg-gray-50/50">
                      <CardContent className="p-3.5 space-y-3">
                        <div>
                          <Label className="text-xs">Customer Name *</Label>
                          <Input
                            placeholder="e.g. John Doe / Tech Corp"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Customer Email *</Label>
                          <Input
                            placeholder="e.g. client@example.com"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Phone</Label>
                            <Input
                              placeholder="+255..."
                              value={customerInfo.phone}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Address</Label>
                            <Input
                              placeholder="Location..."
                              value={customerInfo.address}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quote Parameters: Validity & Initial Status */}
                    <div className="space-y-3 pt-1">
                      <h3 className="font-semibold text-navy text-sm">Quote Validity & Settings</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Valid For</Label>
                          <Select value={validityDays} onValueChange={(val) => {
                            setValidityDays(val)
                            setCustomValidUntil("")
                          }}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Validity period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 Days</SelectItem>
                              <SelectItem value="14">14 Days</SelectItem>
                              <SelectItem value="30">30 Days (Default)</SelectItem>
                              <SelectItem value="60">60 Days</SelectItem>
                              <SelectItem value="90">90 Days</SelectItem>
                              <SelectItem value="custom">Custom Date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Initial Status</Label>
                          <Select value={quoteStatus} onValueChange={(val: any) => setQuoteStatus(val)}>
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {validityDays === "custom" && (
                        <div>
                          <Label className="text-xs">Custom Expiry Date</Label>
                          <Input
                            type="date"
                            value={customValidUntil}
                            onChange={(e) => setCustomValidUntil(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-xs">Quotation Notes / Terms</Label>
                        <Textarea
                          placeholder="Special terms, inclusions, discounts, or project assumptions..."
                          value={quoteNotes}
                          onChange={(e) => setQuoteNotes(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Items Selection (Products / Services / Custom) */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-navy">Add Items to Quotation</h3>

                    {/* Navigation Tabs for Item Types */}
                    <div className="flex border-b text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setItemTypeTab("product")}
                        className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-colors ${
                          itemTypeTab === "product"
                            ? "border-navy text-navy font-semibold"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Package className="h-3.5 w-3.5" />
                        Products ({products.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemTypeTab("service")}
                        className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-colors ${
                          itemTypeTab === "service"
                            ? "border-navy text-navy font-semibold"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Services ({services.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemTypeTab("custom")}
                        className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-colors ${
                          itemTypeTab === "custom"
                            ? "border-navy text-navy font-semibold"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Manual Entry
                      </button>
                    </div>

                    {/* Tab 1: Database Products */}
                    {itemTypeTab === "product" && (
                      <div className="space-y-2.5">
                        <Input
                          placeholder="Search database products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-8 text-xs border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
                        />
                        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                          {modalFilteredProducts.map((product) => (
                            <div key={product.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {product.image ? (
                                  <div className="w-8 h-8 rounded bg-gray-100 relative shrink-0 overflow-hidden">
                                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-900 truncate">{product.name}</div>
                                  <div className="text-xs text-cyan-600 font-semibold">
                                    TZS {product.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddProduct(product)}
                                className="h-7 px-2.5 text-xs shrink-0"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                            </div>
                          ))}
                          {modalFilteredProducts.length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-500">No products match search</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Database Services */}
                    {itemTypeTab === "service" && (
                      <div className="space-y-3">
                        <Input
                          placeholder="Search database services..."
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          className="h-8 text-xs border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
                        />
                        <div className="space-y-2">
                          <Label className="text-xs">Select Service</Label>
                          <Select 
                            value={selectedServiceId} 
                            onValueChange={(val) => {
                              setSelectedServiceId(val)
                              const s = services.find(srv => srv.id === val)
                              if (s && s.price_range) {
                                // Try to extract numeric price if present
                                const match = s.price_range.replace(/,/g, '').match(/\d+/)
                                if (match) setServiceCustomPrice(parseInt(match[0]))
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Choose a service to configure..." />
                            </SelectTrigger>
                            <SelectContent>
                              {modalFilteredServices.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.title} ({service.category}) {service.price_range ? `— ${service.price_range}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedServiceId && (
                          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg space-y-2 text-xs">
                            <div className="font-semibold text-navy">
                              {services.find(s => s.id === selectedServiceId)?.title}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Quoted Price (TZS) *</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter price"
                                  value={serviceCustomPrice || ""}
                                  onChange={(e) => setServiceCustomPrice(parseFloat(e.target.value) || 0)}
                                  className="h-8 bg-white"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Scope / Scope Notes</Label>
                                <Input
                                  placeholder="e.g. 3 Months, Standard Package..."
                                  value={serviceCustomNotes}
                                  onChange={(e) => setServiceCustomNotes(e.target.value)}
                                  className="h-8 bg-white"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              className="w-full bg-navy hover:bg-navy/90 h-7 text-xs mt-1"
                              onClick={() => {
                                const s = services.find(srv => srv.id === selectedServiceId)
                                if (s) handleAddService(s)
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Add Service to Quotation
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Custom Manual Entry */}
                    {itemTypeTab === "custom" && (
                      <div className="space-y-2.5 p-3 border rounded-lg bg-gray-50/70">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Label className="text-xs">Item or Service Name *</Label>
                            <Input
                              placeholder="e.g. Network Cabling / Custom Software"
                              value={customItem.name}
                              onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Select 
                              value={customItem.type} 
                              onValueChange={(val: any) => setCustomItem({ ...customItem, type: val })}
                            >
                              <SelectTrigger className="h-8 text-xs bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="service">Service</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Label className="text-xs">Unit Price (TZS) *</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customItem.price || ""}
                              onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min={1}
                              value={customItem.quantity}
                              onChange={(e) => setCustomItem({ ...customItem, quantity: parseInt(e.target.value) || 1 })}
                              className="h-8 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Description (Optional)</Label>
                          <Input
                            placeholder="Specification details, warranty, or scope..."
                            value={customItem.description}
                            onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                            className="h-8 text-xs bg-white"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddCustomItem}
                          className="w-full h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Manual Item
                        </Button>
                      </div>
                    )}

                    {/* Added Quotation Items List */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-navy">
                        <span>Items in Quotation ({quotationItems.length})</span>
                      </div>
                      <div className="border rounded-lg max-h-44 overflow-y-auto divide-y bg-white">
                        {quotationItems.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400">
                            No items added yet. Select products, services, or add manual items above.
                          </div>
                        ) : (
                          quotationItems.map((item) => (
                            <div key={item.id} className="p-2.5 flex justify-between items-center text-xs">
                              <div className="min-w-0 pr-2">
                                <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 capitalize">
                                    {item.type}
                                  </Badge>
                                  <span className="truncate">{item.name}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  TZS {item.price.toLocaleString()} × {item.quantity} = <strong className="text-navy">TZS {(item.price * item.quantity).toLocaleString()}</strong>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Input
                                  type="number"
                                  className="w-14 h-7 text-xs text-center p-1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                                  min={1}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Grand Total Box */}
                    <div className="p-3 bg-navy/10 rounded-lg flex justify-between items-center">
                      <span className="font-semibold text-sm text-navy">Total Quoted Amount:</span>
                      <span className="text-lg font-bold text-navy">
                        TZS {calculateTotal().toLocaleString()}
                      </span>
                    </div>

                    {/* Submit Button */}
                    <Button
                      className="w-full bg-navy hover:bg-navy/90"
                      onClick={handleCreateQuotation}
                      disabled={isCreating || !customerInfo.name || !customerInfo.email || quotationItems.length === 0}
                    >
                      {isCreating ? "Creating Quotation..." : "Generate Quotation"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        {/* 5. Quotations Table */}
        {filteredQuotations.length === 0 ? (
          <div className={cn(
            "rounded-2xl sm:rounded-3xl p-12 text-center shadow-lg",
            isDark ? "bg-[#060a22]/90 border-none" : "border-2 bg-white border-navy/20"
          )}>
            <FileText className="h-12 w-12 text-navy/40 dark:text-teal-400/40 mx-auto mb-3" />
            <p className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>No quotations found</p>
            <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Click &quot;Create Quotation&quot; to generate a new price quote
            </p>
          </div>
        ) : (
          <div className={cn(
            "rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all",
            isDark ? "bg-[#060a22] border-none shadow-black/40" : "border-2 bg-white border-navy/20 shadow-xl"
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                    <th className="text-left py-4 px-4 font-black text-white">Quote #</th>
                    <th className="text-left py-4 px-4 font-black text-white">Customer Details</th>
                    <th className="text-left py-4 px-4 font-black text-white">Quoted Amount</th>
                    <th className="text-left py-4 px-4 font-black text-white">Status</th>
                    <th className="text-left py-4 px-4 font-black text-white hidden md:table-cell">Valid Until</th>
                    <th className="text-right py-4 px-4 font-black text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                  {filteredQuotations.map((quote) => (
                    <tr
                      key={quote.id}
                      className={cn(
                        "transition-colors duration-150 cursor-pointer group",
                        isDark 
                          ? "hover:bg-teal/30 hover:text-white" 
                          : "hover:bg-teal/50 hover:text-navy"
                      )}
                      onClick={() => handleOpenPreview(quote)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                            isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                          )}>
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal" />
                          </div>
                          <div className="min-w-0">
                            <span className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-navy")}>
                              #{quote.quote_number}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>
                            {quote.customer_name || "Unknown Customer"}
                          </p>
                          <p className={cn("text-xs truncate max-w-xs", isDark ? "text-slate-300" : "text-navy/70")}>{quote.customer_email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={cn("font-black text-sm tracking-tight whitespace-nowrap", isDark ? "text-white" : "text-navy")}>
                          TSH {quote.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge className={cn("text-xs uppercase tracking-wider font-black px-2.5 py-0.5", getStatusColor(quote.status))}>
                          {quote.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/70")}>
                          {quote.valid_until
                            ? new Date(quote.valid_until).toLocaleDateString()
                            : "30 Days"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="View Quotation Preview"
                            onClick={() => handleOpenPreview(quote)}
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                              isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                            )}
                            title="Print Quotation"
                            onClick={() => handlePrintQuotation(quote)}
                          >
                            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            className={cn(
                              "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                              isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                            )}
                            title="Delete Quotation"
                            onClick={() => handleDeleteQuotation(quote.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Quotation Preview & Print Modal Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className={cn(
            "max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-3xl border-2 shadow-2xl",
            isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
          )}>
            <DialogHeader className="sr-only">
              <DialogTitle>Quotation #{selectedQuotation?.quote_number || "Details"}</DialogTitle>
              <DialogDescription>Quotation estimate breakdown and scope details</DialogDescription>
            </DialogHeader>

            {selectedQuotation && (
              <div className="space-y-6">
                {/* Top Bar Header Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/turquoise.png" 
                      alt="QuardCubeLabs Logo" 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                          Quotation #{selectedQuotation.quote_number}
                        </h2>
                        <Badge className={cn("text-xs uppercase tracking-wider font-black px-3 py-1 shadow-xs", getStatusColor(selectedQuotation.status))}>
                          {selectedQuotation.status}
                        </Badge>
                      </div>
                      <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
                        Issued on {new Date(selectedQuotation.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
                        {selectedQuotation.valid_until && ` • Valid until ${new Date(selectedQuotation.valid_until).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleTriggerPrint()}
                      className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 h-10 px-4"
                    >
                      <Printer className="h-4 w-4 text-white" />
                      Print Quotation
                    </Button>
                  </div>
                </div>

                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Columns: Items & Scope */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className={cn(
                      "rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-lg transition-all",
                      isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                    )}>
                      <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20 bg-teal/10 dark:bg-[#070d2b]">
                        <CardTitle className="text-base sm:text-lg font-black flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-navy dark:text-white" />
                            Quoted Items ({selectedQuotation.items?.length || 0})
                          </span>
                          <span className="text-xs uppercase font-bold tracking-wider opacity-70">
                            ID: #{selectedQuotation.id.slice(0, 12)}
                          </span>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                                <th className="text-left py-3.5 px-4">Item Details</th>
                                <th className="text-center py-3.5 px-4">Type</th>
                                <th className="text-center py-3.5 px-4">Qty</th>
                                <th className="text-right py-3.5 px-4">Unit Price</th>
                                <th className="text-right py-3.5 px-4">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                              {selectedQuotation.items && selectedQuotation.items.length > 0 ? (
                                selectedQuotation.items.map((item, idx) => (
                                  <tr key={idx} className={cn("transition-colors", isDark ? "hover:bg-slate-900/40" : "hover:bg-teal-50/40")}>
                                    <td className="py-4 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl border-2 border-navy/15 bg-white p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                          {item.image ? (
                                            <img 
                                              src={item.image} 
                                              alt={item.name} 
                                              className="w-full h-full object-contain"
                                              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                                            />
                                          ) : item.type === "service" ? (
                                            <Wrench className="h-6 w-6 text-navy/40" />
                                          ) : item.type === "custom" ? (
                                            <Sparkles className="h-6 w-6 text-navy/40" />
                                          ) : (
                                            <Package className="h-6 w-6 text-navy/40" />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-sm truncate max-w-xs">{item.name}</p>
                                          {item.description && (
                                            <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{item.description}</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-center py-4 px-4">
                                      <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
                                        {item.type}
                                      </Badge>
                                    </td>
                                    <td className="text-center py-4 px-4 font-bold">{item.quantity}</td>
                                    <td className="text-right py-4 px-4 font-semibold text-xs whitespace-nowrap">
                                      TZS {Number(item.price).toLocaleString()}
                                    </td>
                                    <td className="text-right py-4 px-4 font-black whitespace-nowrap">
                                      TZS {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center opacity-60">
                                    No item records found for this quotation
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Scope & Notes Card */}
                    {selectedQuotation.notes && (
                      <Card className={cn(
                        "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-3",
                        isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                      )}>
                        <div className="border-b border-navy/10 dark:border-teal/20 pb-2 flex items-center justify-between">
                          <h3 className="text-base font-black flex items-center gap-2">
                            <FileText className="h-5 w-5 text-navy dark:text-white" />
                            Notes & Project Scope
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">{selectedQuotation.notes}</p>
                      </Card>
                    )}

                    {/* Terms Notice */}
                    <Card className={cn(
                      "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-2",
                      isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
                    )}>
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-teal" />
                        Quotation Validity & Terms
                      </h4>
                      <p className="text-xs leading-relaxed opacity-80">
                        • This estimate is valid for {selectedQuotation.valid_until ? `until ${new Date(selectedQuotation.valid_until).toLocaleDateString()}` : "30 days from issuance"}.
                        <br />
                        • A 50% advance deposit is required to initiate execution of the quoted scope.
                      </p>
                    </Card>
                  </div>

                  {/* Right Column: Status, Totals & Customer Card */}
                  <div className="space-y-6">
                    {/* Status Management Card */}
                    <Card className={cn(
                      "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-3",
                      isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                    )}>
                      <div className="border-b border-navy/10 dark:border-teal/20 pb-2 flex items-center justify-between">
                        <h3 className="text-base font-black flex items-center gap-2">
                          <Clock className="h-5 w-5 text-navy dark:text-white" />
                          Quote Status
                        </h3>
                        <Badge className={cn("text-xs uppercase font-bold", getStatusColor(selectedQuotation.status))}>
                          {selectedQuotation.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Update Status</Label>
                        <Select 
                          value={selectedQuotation.status} 
                          onValueChange={(val: any) => handleStatusChange(selectedQuotation.id, val)}
                        >
                          <SelectTrigger className="rounded-xl border-2 font-bold h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>

                    {/* Cost Breakdown Card */}
                    <Card className={cn(
                      "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                      isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                    )}>
                      <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
                        <h3 className="text-base font-black flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-navy dark:text-white" />
                          Financial Breakdown
                        </h3>
                        <p className="text-xs opacity-70">Estimated pricing summary</p>
                      </div>

                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between items-center opacity-80">
                          <span>Subtotal Items</span>
                          <span className="font-bold">TZS {Number(selectedQuotation.total).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-80">
                          <span>Estimated Shipping / Logistics</span>
                          <span className="font-bold text-green-600">TZS 0.00</span>
                        </div>
                        <div className="flex justify-between items-center opacity-80 border-b border-navy/10 dark:border-teal/20 pb-2.5">
                          <span>Estimated Tax</span>
                          <span className="font-bold">TZS 0.00</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-black pt-1 text-navy dark:text-teal-300">
                          <span>TOTAL ESTIMATE</span>
                          <span>TZS {Number(selectedQuotation.total).toLocaleString()}</span>
                        </div>
                      </div>
                    </Card>

                    {/* Customer Information Card */}
                    <Card className={cn(
                      "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                      isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                    )}>
                      <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
                        <h3 className="text-base font-black flex items-center gap-2">
                          <User className="h-5 w-5 text-navy dark:text-white" />
                          Customer Profile
                        </h3>
                        <p className="text-xs opacity-70">Client contact & location info</p>
                      </div>

                      <div className="space-y-3.5 text-sm">
                        <div className="flex items-start gap-3">
                          <User className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</p>
                            <p className="font-bold text-sm">{selectedQuotation.customer_name || "Customer Name Not Provided"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</p>
                            <p className="font-medium text-sm truncate">{selectedQuotation.customer_email || "No email on record"}</p>
                          </div>
                        </div>

                        {selectedQuotation.customer_phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Contact</p>
                              <p className="font-medium text-sm">{selectedQuotation.customer_phone}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Location / Address</p>
                            <p className="font-medium text-sm leading-relaxed">{selectedQuotation.customer_address || "Tanzania"}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Hidden printable quotation container for react-to-print */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: "210mm" }}>
        <div ref={printComponentRef}>
          {quotationToPrint && (
            <div className="quotation-print-root w-full font-sans text-navy bg-white relative" style={{ padding: "10mm 10mm", boxSizing: "border-box" }}>
              {/* Centered Large Watermark with full transparency for text above */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="relative w-[500px] h-[500px] opacity-[0.22]">
                  <img
                    src="/turquoise.png"
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="relative z-10 bg-transparent">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 bg-transparent">
                  <div className="flex items-center gap-4 bg-transparent">
                    <img 
                      src="/turquoise.png" 
                      alt="QuardCubeLabs Logo" 
                      className="w-[150px] h-[150px] object-contain flex-shrink-0"
                    />
                    <div className="bg-transparent">
                      <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">QuardCubeLabs</h2>
                      <p className="text-[15px] font-medium text-navy/85 mt-1">Your trusted partner in digital solutions</p>
                      <p className="text-[15px] font-medium text-navy/85 mt-0.5">Email: info@quardcubelabs.co.tz</p>
                      <p className="text-[15px] font-medium text-navy/85">Website: www.quardcubelabs.co.tz</p>
                    </div>
                  </div>
                  <div className="text-right bg-transparent">
                    <h1 className="text-4xl sm:text-5xl font-black text-navy mb-1.5 tracking-tight">QUOTATION</h1>
                    <p className="text-[15px] text-navy/85 font-medium">
                      Quote #<span className="font-bold text-navy">{quotationToPrint.quote_number}</span>
                    </p>
                    <p className="text-[15px] text-navy/85 font-medium mt-0.5">
                      Date: <span className="font-bold text-navy">{new Date(quotationToPrint.created_at).toLocaleDateString()}</span>
                    </p>
                    <p className="text-[15px] text-navy/85 font-medium mt-0.5">
                      Valid Until: <span className="font-bold text-navy">{quotationToPrint.valid_until ? new Date(quotationToPrint.valid_until).toLocaleDateString() : "30 Days from issue"}</span>
                    </p>
                    <p className="text-[15px] text-navy/85 mt-1.5 font-medium">
                      Status:{" "}
                      <span 
                        className="font-bold capitalize"
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

                {/* Client and Company Address Details */}
                <div className="flex justify-between mb-7 bg-transparent">
                  <div className="w-1/2 pr-6 bg-transparent">
                    <h3 className="text-lg font-black text-navy mb-2 uppercase tracking-wider">From:</h3>
                    <p className="text-lg font-bold text-navy">QuardCubeLabs</p>
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">24 Ferry, Kigamboni</p>
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">Dar es Salaam 17101</p>
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">Tanzania</p>
                    <p className="text-[15px] text-navy/85 font-medium mt-0.5">Phone: +255 652 540 496</p>
                  </div>
                  <div className="w-1/2 pl-6 text-right bg-transparent">
                    <h3 className="text-lg font-black text-navy mb-2 uppercase tracking-wider">To:</h3>
                    <p className="text-lg font-bold text-navy">{quotationToPrint.customer_name || "Customer"}</p>
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">{quotationToPrint.customer_email || ""}</p>
                    {quotationToPrint.customer_phone && (
                      <p className="text-[15px] text-navy/85 font-medium leading-relaxed">Phone: {quotationToPrint.customer_phone}</p>
                    )}
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">{quotationToPrint.customer_address || "Tanzania, United Republic of"}</p>
                  </div>
                </div>

                {/* Quotation Items Table */}
                <div className="mb-7 bg-transparent">
                  <table className="w-full border-collapse bg-transparent">
                    <thead>
                      <tr className="border-b-2 border-navy/60 bg-transparent">
                        <th className="text-left text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider bg-transparent">Item / Service Description</th>
                        <th className="text-center text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-24 bg-transparent">Type</th>
                        <th className="text-right text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-20 bg-transparent">Qty</th>
                        <th className="text-right text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-32 bg-transparent">Unit Price</th>
                        <th className="text-right text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-32 bg-transparent">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent">
                      {(quotationToPrint.items || []).map((item, index) => (
                        <tr key={item.id || index} className="border-b border-navy/15 bg-transparent avoid-break">
                          <td className="text-[15px] font-semibold text-navy/90 py-3.5 px-3 bg-transparent">
                            <div className="font-bold text-navy">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-navy/70 mt-0.5">{item.description}</div>
                            )}
                          </td>
                          <td className="text-center text-[15px] font-medium text-navy/80 py-3.5 px-3 capitalize bg-transparent">{item.type}</td>
                          <td className="text-right text-[15px] font-bold text-navy/90 py-3.5 px-3 w-20 bg-transparent">{item.quantity}</td>
                          <td className="text-right text-[15px] font-bold text-navy/90 py-3.5 px-3 w-32 whitespace-nowrap bg-transparent">
                            TZS {Number(item.price).toFixed(2)}
                          </td>
                          <td className="text-right text-[15px] font-black text-navy py-3.5 px-3 w-32 whitespace-nowrap bg-transparent">
                            TZS {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals and Terms */}
                <div className="flex justify-between items-start bg-transparent avoid-break mb-6">
                  <div className="w-1/2 pr-6 bg-transparent">
                    {quotationToPrint.notes && (
                      <div className="mb-4 bg-transparent">
                        <h3 className="text-lg font-black text-navy mb-1.5 uppercase tracking-wider">Notes & Scope:</h3>
                        <p className="text-[15px] text-navy/85 font-medium leading-relaxed">{quotationToPrint.notes}</p>
                      </div>
                    )}
                    <h3 className="text-lg font-black text-navy mb-2 uppercase tracking-wider">Terms & Conditions:</h3>
                    <ol className="list-decimal list-inside text-[15px] text-navy/85 space-y-1 leading-relaxed bg-transparent">
                      <li>This quotation is valid for the duration specified from date of issue.</li>
                      <li>A 50% advance deposit is required upon confirmation to initiate the service/order.</li>
                      <li>Final prices are subject to agreed project scope and change order requests.</li>
                      <li>All payments should be made through official QuardCubeLabs Company Limited channels.</li>
                    </ol>
                  </div>
                  <div className="w-1/2 pl-6 text-right bg-transparent">
                    <div className="space-y-2 bg-transparent">
                      <div className="flex justify-between text-[15px] text-navy/85 font-medium bg-transparent">
                        <span>Subtotal Items:</span>
                        <span className="font-bold text-navy">TZS {Number(quotationToPrint.total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[15px] text-navy/85 font-medium bg-transparent">
                        <span>Estimated Shipping:</span>
                        <span className="font-bold text-green-600">TZS 0.00</span> 
                      </div>
                      <div className="flex justify-between text-[15px] text-navy/85 font-medium border-b border-navy/25 pb-2 bg-transparent">
                        <span>Estimated Tax:</span>
                        <span className="font-bold text-navy">TZS 0.00</span> 
                      </div>
                      <div className="flex justify-between text-2xl sm:text-3xl font-black text-navy pt-2 bg-transparent">
                        <span>TOTAL ESTIMATE:</span>
                        <span>TZS {Number(quotationToPrint.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[15px] text-navy/70 font-medium bg-transparent avoid-break pt-3">
                  <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
                  <p className="mt-0.5">We look forward to doing business with you!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Quotation Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(
          "max-w-md p-5 sm:p-6 rounded-2xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="pb-3 border-b border-navy/10 dark:border-teal/20">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal" />
              Update Quotation Status
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
              Modify status for quotation #{editingQuotation?.quote_number}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">
                Select Quotation Status
              </label>
              <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val)}>
                <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold text-sm", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue placeholder="Choose status..." />
                </SelectTrigger>
                <SelectContent className={cn("rounded-xl border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectItem value="draft" className="font-bold">Draft</SelectItem>
                  <SelectItem value="sent" className="font-bold text-blue-500">Sent</SelectItem>
                  <SelectItem value="accepted" className="font-bold text-green-600">Accepted</SelectItem>
                  <SelectItem value="rejected" className="font-bold text-brand-red">Rejected</SelectItem>
                  <SelectItem value="expired" className="font-bold text-amber-500">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs leading-relaxed",
              isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
            )}>
              <span className="font-bold">Info:</span> Updating the quotation status will synchronize the quote lifecycle and client estimates.
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 pt-3 border-t border-navy/10 dark:border-teal/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-xl border-navy/20 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (editingQuotation && editStatus) {
                  handleUpdateQuoteStatus(editingQuotation.id, editStatus)
                }
              }}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs px-5 shadow-sm"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
