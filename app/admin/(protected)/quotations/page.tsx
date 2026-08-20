"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  ArrowRight
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
  const [selectedQuotation, setSelectedQuotation] = useState<AdminQuotation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

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
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Stats calculation
  const totalQuotations = quotations.length
  const acceptedQuotations = quotations.filter(q => q.status === "accepted").length
  const sentQuotations = quotations.filter(q => q.status === "sent").length
  const draftQuotations = quotations.filter(q => q.status === "draft").length
  const expiredQuotations = quotations.filter(q => q.status === "expired" || q.status === "declined").length
  const totalQuotedValue = quotations.reduce((sum, q) => sum + q.total, 0)

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > div:first-child,
          nav,
          header,
          aside,
          [role="navigation"],
          .print\\:hidden {
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
          }
          @page {
            size: A4;
            margin: 0;
          }
          section, div.container, main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          main {
            margin-left: 0 !important;
            padding-top: 0 !important;
          }
          .bg-\\[\\#172c5e\\],
          .bg-\\[\\#40E0D0\\] {
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .absolute.w-8.h-8 {
            display: none !important;
          }
          .shadow-2xl,
          .shadow-xl,
          .shadow-lg,
          .shadow-md {
            box-shadow: none !important;
          }
          .rounded-\\[2rem\\] {
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .relative > .absolute.w-8 {
            display: none !important;
          }
        }
      `}} />
      
      {/* Main content - hidden when printing */}
      <div className="print:hidden space-y-4 sm:space-y-6">

        {/* Page Header */}
        <div className="pb-2 border-b border-teal/15">
          <h1 className={cn("text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight", isDark ? "text-white" : "text-navy")}>
            Quotation <span className="gradient-text">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-teal-400 mt-1">Create, estimate and manage customer price quotes</p>
        </div>

        {/* 1. Stats Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className={cn(
            "rounded-2xl p-4 border transition-all hover:-translate-y-0.5",
            isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-md" : "bg-white border-teal/20 shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              <div className="bg-teal-400/15 border border-teal-400/30 rounded-xl p-2.5">
                <FileText className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Total Quotes</p>
                <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{totalQuotations}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border transition-all hover:-translate-y-0.5",
            isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-md" : "bg-white border-teal/20 shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-400/15 border border-emerald-400/30 rounded-xl p-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Accepted</p>
                <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{acceptedQuotations}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border transition-all hover:-translate-y-0.5",
            isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-md" : "bg-white border-teal/20 shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              <div className="bg-amber-400/15 border border-amber-400/30 rounded-xl p-2.5">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Sent / Pending</p>
                <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{sentQuotations}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border transition-all hover:-translate-y-0.5",
            isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-md" : "bg-white border-teal/20 shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              <div className="bg-rose-400/15 border border-rose-400/30 rounded-xl p-2.5">
                <AlertCircle className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Drafts</p>
                <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{draftQuotations}</p>
              </div>
            </div>
          </div>
          <div className={cn(
            "rounded-2xl p-4 border transition-all hover:-translate-y-0.5 col-span-2 sm:col-span-1",
            isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-md" : "bg-white border-teal/20 shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              <div className="bg-teal-400/15 border border-teal-400/30 rounded-xl p-2.5">
                <DollarSign className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Total Quoted</p>
                <p className={cn("text-lg font-extrabold truncate", isDark ? "text-white" : "text-navy")}>
                  TZS {(totalQuotedValue / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </div>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
              <Input
                placeholder="Search by quote #, customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10 rounded-xl border",
                  isDark ? "bg-[#080d2a] border-teal/25 text-white placeholder:text-slate-400" : "bg-white border-teal/25 text-navy"
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

        {/* 4. Header Row with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-navy")}>
              {activeTab === "all" ? "All Quotations" : tabs.find(t => t.key === activeTab)?.label}
              <span className="ml-2 text-sm font-semibold text-teal-400">({filteredQuotations.length})</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={loadData} 
              variant="outline" 
              size="sm" 
              className={cn("rounded-xl border", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-teal/30 text-navy hover:bg-teal-50")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-400 to-teal-500 text-navy font-bold rounded-xl shadow-md shadow-teal-400/20 hover:opacity-90 transition-opacity" size="sm">
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
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search registered customers..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-10"
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
                          className="h-8 text-xs"
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
                          className="h-8 text-xs"
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
        </div>

        {/* 5. Quotations Table */}
        {filteredQuotations.length === 0 ? (
          <div className={cn(
            "rounded-2xl border p-12 text-center",
            isDark ? "bg-[#080d2a]/80 border-teal/20" : "bg-white border-teal/20"
          )}>
            <FileText className="h-12 w-12 text-teal-400/40 mx-auto mb-3" />
            <p className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-700")}>No quotations found</p>
            <p className="text-xs text-teal-400 mt-1">Click &quot;Create Quotation&quot; to generate a new price quote</p>
          </div>
        ) : (
          <div className={cn(
            "rounded-2xl border overflow-hidden",
            isDark ? "bg-[#080d2a]/80 border-teal/20 shadow-lg" : "bg-white border-teal/20 shadow-sm"
          )}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn("border-b", isDark ? "border-teal/15 bg-white/5" : "border-slate-200 bg-teal-50/40")}>
                    <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Quote #</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Customer</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Amount</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Status</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider hidden md:table-cell">Valid Until</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                  {filteredQuotations.map((quote) => (
                    <tr
                      key={quote.id}
                      className={cn(
                        "transition-colors cursor-pointer",
                        selectedQuotation?.id === quote.id 
                          ? isDark ? "bg-teal-400/10" : "bg-teal-50" 
                          : isDark ? "hover:bg-white/5" : "hover:bg-teal-50/40"
                      )}
                      onClick={() => setSelectedQuotation(quote)}
                    >
                      <td className="py-3.5 px-4">
                        <span className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                          #{quote.quote_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <p className={cn("font-medium", isDark ? "text-slate-200" : "text-slate-800")}>
                            {quote.customer_name || "Unknown Customer"}
                          </p>
                          <p className="text-xs text-teal-400">{quote.customer_email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn("font-bold", isDark ? "text-teal-300" : "text-navy")}>
                          TZS {quote.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                          {quote.valid_until
                            ? new Date(quote.valid_until).toLocaleDateString()
                            : "30 Days"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-teal-400/15"
                            title="View Details"
                            onClick={(e) => { 
                              e.stopPropagation()
                              setSelectedQuotation(quote)
                            }}
                          >
                            <Eye className="h-4 w-4 text-teal-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-teal-400/15"
                            title="Print Quotation"
                            onClick={(e) => { 
                              e.stopPropagation()
                              setSelectedQuotation(quote)
                              setTimeout(() => window.print(), 200)
                            }}
                          >
                            <Printer className="h-4 w-4 text-teal-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-rose-500/15"
                            title="Delete Quotation"
                            onClick={(e) => { 
                              e.stopPropagation()
                              handleDeleteQuotation(quote.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Selected Quotation Detail Panel */}
        {selectedQuotation && (
          <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-navy flex items-center gap-2">
                  <span>Quotation #{selectedQuotation.quote_number}</span>
                  <Badge className={getStatusColor(selectedQuotation.status)}>
                    {selectedQuotation.status}
                  </Badge>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Created: {new Date(selectedQuotation.created_at).toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Select 
                  value={selectedQuotation.status} 
                  onValueChange={(val: any) => handleStatusChange(selectedQuotation.id, val)}
                >
                  <SelectTrigger className="h-8 text-xs w-32">
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

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  Print Quotation
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedQuotation(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 text-sm">Customer Details</h4>
                <div className="space-y-2 text-sm bg-gray-50/80 p-3.5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{selectedQuotation.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{selectedQuotation.customer_email}</span>
                  </div>
                  {selectedQuotation.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{selectedQuotation.customer_phone}</span>
                    </div>
                  )}
                  {selectedQuotation.customer_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-700">{selectedQuotation.customer_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 border-t text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span>Valid Until: {selectedQuotation.valid_until ? new Date(selectedQuotation.valid_until).toLocaleDateString() : "30 Days"}</span>
                  </div>
                </div>

                {selectedQuotation.notes && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">Notes & Scope:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedQuotation.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 text-sm mb-2">Itemized Breakdown</h4>
                <div className="border rounded-lg overflow-hidden divide-y text-sm">
                  {selectedQuotation.items.map((item, index) => (
                    <div key={index} className="p-3 flex justify-between items-start bg-white">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] py-0 px-1 capitalize">
                            {item.type}
                          </Badge>
                          <span>{item.name}</span>
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">
                          TZS {item.price.toLocaleString()} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-navy">
                        TZS {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-gray-50/80 flex justify-between items-center font-bold text-navy">
                    <span>Total Quoted Amount:</span>
                    <span className="text-base">TZS {selectedQuotation.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Quotation - visible only during print mode */}
      {selectedQuotation && (
        <div className="hidden print:block w-full p-0 m-0 font-sans text-navy bg-transparent relative">
          {/* Watermark Logo - centered faded */}
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0, pointerEvents: 'none' }}>
            <Image 
              src="/turquoise.png" 
              alt="" 
              width={350} 
              height={350} 
              style={{ opacity: 0.06 }}
              priority
              unoptimized
            />
          </div>
          
          {/* Content */}
          <div className="relative z-20 flex flex-col justify-between" style={{ padding: '10mm 8mm', minHeight: '277mm', boxSizing: 'border-box' }}>
            <div>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                {/* Left side: Logo and Company Info */}
                <div className="flex items-center gap-3">
                  <Image 
                    src="/turquoise.png" 
                    alt="QuardCubeLabs Logo" 
                    width={70} 
                    height={70} 
                    className="object-contain print:block"
                    priority
                    unoptimized
                  />
                  <div>
                    <h2 className="text-xl font-bold text-navy">QuardCubeLabs</h2>
                    <p className="text-xs text-navy/70">Your trusted partner in digital solutions</p>
                    <p className="text-xs text-navy/70 mt-0.5">Email: info@quardcubelabs.com</p>
                    <p className="text-xs text-navy/70">Website: www.quardcubelabs.com</p>
                  </div>
                </div>
                {/* Right side: Quotation Details */}
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-navy mb-1">QUOTATION</h1>
                  <p className="text-xs text-navy/70">Quote #<span className="font-semibold text-navy">{selectedQuotation.quote_number}</span></p>
                  <p className="text-xs text-navy/70">Date: <span className="font-semibold text-navy">{new Date(selectedQuotation.created_at).toLocaleDateString()}</span></p>
                  <p className="text-xs text-navy/70">Valid Until: <span className="font-semibold text-navy">{selectedQuotation.valid_until ? new Date(selectedQuotation.valid_until).toLocaleDateString() : "30 Days from issue"}</span></p>
                  <p className="text-xs text-navy/70 mt-1">Status: <span className="font-semibold capitalize text-navy">{selectedQuotation.status}</span></p>
                </div>
              </div>

              <hr className="border-navy/30 mb-6" />

              {/* Client and Company Address Details */}
              <div className="flex justify-between mb-6">
                {/* Company Address */}
                <div className="w-1/2 pr-4">
                  <h3 className="text-sm font-bold text-navy mb-2">From:</h3>
                  <p className="text-xs text-navy/80 font-semibold">QuardCubeLabs</p>
                  <p className="text-xs text-navy/70">123 Kigamboni</p>
                  <p className="text-xs text-navy/70">Dar es salaam, TC 12345</p>
                  <p className="text-xs text-navy/70">Tanzania</p>
                  <p className="text-xs text-navy/70 mt-1">Phone: +255 652540496</p>
                </div>
                {/* Client Address */}
                <div className="w-1/2 pl-4 text-right">
                  <h3 className="text-sm font-bold text-navy mb-2">To:</h3>
                  <p className="text-xs text-navy/80 font-semibold">{selectedQuotation.customer_name || "Customer"}</p>
                  <p className="text-xs text-navy/70">{selectedQuotation.customer_email}</p>
                  {selectedQuotation.customer_phone && (
                    <p className="text-xs text-navy/70">Phone: {selectedQuotation.customer_phone}</p>
                  )}
                  {selectedQuotation.customer_address && (
                    <p className="text-xs text-navy/70">{selectedQuotation.customer_address}</p>
                  )}
                </div>
              </div>

              {/* Quotation Items Table */}
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-navy/50 bg-transparent">
                      <th className="text-left text-xs font-bold text-navy py-2 px-2">Item / Service Description</th>
                      <th className="text-center text-xs font-bold text-navy py-2 px-2 w-20">Type</th>
                      <th className="text-right text-xs font-bold text-navy py-2 px-2 w-16">Qty</th>
                      <th className="text-right text-xs font-bold text-navy py-2 px-2 w-24">Unit Price</th>
                      <th className="text-right text-xs font-bold text-navy py-2 px-2 w-28">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuotation.items.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-navy/10">
                        <td className="text-xs text-navy/80 py-2 px-2">
                          <div className="font-semibold text-navy">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-navy/60 mt-0.5">{item.description}</div>
                          )}
                        </td>
                        <td className="text-center text-xs text-navy/70 py-2 px-2 capitalize">{item.type}</td>
                        <td className="text-right text-xs text-navy/80 py-2 px-2 w-16">{item.quantity}</td>
                        <td className="text-right text-xs text-navy/80 py-2 px-2 w-24">TZS {item.price.toFixed(2)}</td>
                        <td className="text-right text-xs text-navy/80 py-2 px-2 w-28 font-semibold">TZS {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals and Terms */}
              <div className="flex justify-between">
                {/* Terms and Conditions */}
                <div className="w-1/2 pr-4">
                  {selectedQuotation.notes && (
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-navy mb-1">Notes & Scope:</h3>
                      <p className="text-xs text-navy/80">{selectedQuotation.notes}</p>
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-navy mb-2">Terms & Conditions:</h3>
                  <ol className="list-decimal list-inside text-xs text-navy/80 space-y-0.5">
                    <li>This quotation is valid for the specified duration from the date of issue.</li>
                    <li>A 50% advance deposit is required upon confirmation to initiate the service/order.</li>
                    <li>Final prices are subject to agreed project scope and change order requests.</li>
                    <li>All payments should be made through official QuardCubeLabs Company Limited channels.</li>
                  </ol>
                </div>
                
                {/* Totals */}
                <div className="w-1/2 pl-4 text-right">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-navy/80">
                      <span>Subtotal:</span>
                      <span>TZS {selectedQuotation.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-navy/80">
                      <span>Estimated Shipping / Logistics:</span>
                      <span>TZS 0.00</span> 
                    </div>
                    <div className="flex justify-between text-xs text-navy/80 border-b border-navy/20 pb-1">
                      <span>Estimated Tax:</span>
                      <span>TZS 0.00</span> 
                    </div>
                    <div className="flex justify-between text-lg font-bold text-navy pt-1">
                      <span>TOTAL ESTIMATE:</span>
                      <span>TZS {selectedQuotation.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - at the very end/bottom of the page */}
            <div className="mt-auto pt-6 border-t border-navy/20 text-center text-xs text-navy/70">
              <p className="font-semibold text-navy">&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
              <p className="mt-0.5">We look forward to doing business with you!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
