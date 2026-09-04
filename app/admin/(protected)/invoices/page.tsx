"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useReactToPrint } from "react-to-print"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { AdminLoading } from "@/components/admin"
import { Plus, Trash2, FileText, User, Mail, Phone, MapPin, Search, Eye, Printer, Calendar, DollarSign, Clock, AlertCircle, XCircle, CheckCircle, Edit, RefreshCw, ShieldCheck, ExternalLink, Package } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import { getProducts, type Product } from "@/lib/product-actions"
import { createAdminInvoice, getAdminInvoices, deleteAdminInvoice, updateInvoiceStatus, type AdminInvoice } from "@/lib/invoice-actions"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { printInvoiceDocument } from "@/lib/print-invoice"

interface InvoiceItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export default function AdminInvoicesPage() {
  const router = useRouter()
  const { isDark } = useAdminTheme()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<AdminInvoice | null>(null)
  const [editStatus, setEditStatus] = useState<AdminInvoice['status']>("draft")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()
  const [printingInvoice, setPrintingInvoice] = useState<AdminInvoice | null>(null)
  const printComponentRef = useRef<HTMLDivElement>(null)

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: AdminInvoice['status']) => {
    try {
      const updated = await updateInvoiceStatus(invoiceId, newStatus)
      if (updated) {
        setInvoices(invoices.map(inv => inv.id === invoiceId ? updated : inv))
        if (selectedInvoice && selectedInvoice.id === invoiceId) {
          setSelectedInvoice(updated)
        }
      }
      toast({
        title: "Invoice Status Updated",
        description: `Invoice status changed to "${newStatus}".`,
      })
      setIsEditDialogOpen(false)
    } catch (err) {
      console.error("Error updating invoice status:", err)
      toast({
        title: "Update Failed",
        description: "Could not update invoice status.",
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
        .invoice-print-root {
          width: 210mm !important;
          max-width: 210mm !important;
          box-sizing: border-box !important;
          margin: 0 auto !important;
          padding: 10mm 10mm !important;
          background: white !important;
          position: relative !important;
          overflow: visible !important;
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
    setIsPreviewOpen(true)
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
      
      const invoice = await createAdminInvoice({
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
        description: `Invoice #${invoice.invoice_number} has been created successfully`
      })

      // Reset form
      setSelectedUser(null)
      setInvoiceItems([])
      setCustomerInfo({ name: "", email: "", phone: "", address: "" })
      setInvoiceNotes("")
      setIsCreateDialogOpen(false)

      // Refresh invoices list
      loadData()
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

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return
    try {
      await deleteAdminInvoice(invoiceId)
      toast({ title: "Invoice Deleted", description: "Invoice has been deleted successfully" })
      if (selectedInvoice?.id === invoiceId) setSelectedInvoice(null)
      loadData()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-600 text-white border-green-600 font-black shadow-xs"
      case "sent":
        return "bg-teal text-navy border-teal font-black"
      case "draft":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-black"
      case "overdue":
        return "bg-brand-red/20 text-brand-red border-brand-red/40 font-black"
      case "cancelled":
        return "bg-brand-red text-white border-brand-red font-black"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 font-bold"
    }
  }

  // Stats - Synchronized with Orders statistics
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

  // Tabs
  const tabs = [
    { key: "all", label: "All Invoices" },
    { key: "paid", label: "Paid" },
    { key: "pending", label: "Pending" },
    { key: "overdue", label: "Overdue" },
    { key: "cancelled", label: "Cancelled" },
  ]

  // Filtered invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Tab filter
    if (activeTab === "pending") {
      if (invoice.status !== "draft" && invoice.status !== "sent") return false
    } else if (activeTab !== "all" && invoice.status !== activeTab) {
      return false
    }
    // Status dropdown filter
    if (statusFilter !== "all" && invoice.status !== statusFilter) return false
    // Search query
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Invoice <span className="gradient-text">Management</span>
          </h1>
          <p className="text-gray-600">Create and manage customer invoices</p>
        </div>
        <AdminLoading message="Loading data..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Invoice <span className="gradient-text">Management</span>
          </h1>
          <p className="text-gray-600">Create and manage customer invoices</p>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    )
  }

  const invoiceToPrint = printingInvoice || selectedInvoice

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
            margin: 10mm;
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
      <div className="print:hidden space-y-6 sm:space-y-7">

      {/* Page Header Card in Teal without borders */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Invoice <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Create, track and manage customer billing and invoices
            </p>
          </div>
        </div>
      </div>

      {/* 1. Stats Cards Row - Analytics Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Invoices", value: formatStatNumber(totalInvoices), icon: FileText },
          { title: "Paid", value: formatStatNumber(paidInvoices), icon: CheckCircle },
          { title: "Pending", value: formatStatNumber(pendingInvoices), icon: Clock },
          { title: "Overdue", value: formatStatNumber(overdueInvoices), icon: AlertCircle },
          { 
            title: "Total Revenue", 
            value: formatStatCurrency(totalRevenue), 
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
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Category Tabs */}
      <div className="border-b border-navy/20 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-all",
                activeTab === tab.key
                  ? "bg-teal text-navy font-bold shadow-md shadow-teal/20"
                  : isDark 
                    ? "text-slate-300 hover:bg-white/10 hover:text-teal-300"
                    : "text-navy/70 hover:bg-teal/20 hover:text-navy"
              )}
            >
              {tab.label}
              {tab.key !== "all" && (
                <span className={cn(
                  "ml-2 text-xs px-2 py-0.5 rounded-full font-bold",
                  activeTab === tab.key 
                    ? "bg-navy/20 text-navy" 
                    : isDark ? "bg-white/10 text-teal-300" : "bg-slate-200 text-navy"
                )}>
                  {tab.key === "pending"
                    ? invoices.filter(i => i.status === "draft" || i.status === "sent").length
                    : invoices.filter(i => i.status === tab.key).length}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy" />
            <Input
              placeholder="Search by invoice number, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 rounded-xl border border-teal focus:border-teal focus:ring-1 focus:ring-teal text-navy placeholder:text-navy/50",
                isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400" : "bg-white text-navy"
              )}
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn(
            "w-full sm:w-[180px] rounded-xl border border-teal font-semibold text-navy",
            isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
          )}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4. Action Buttons Row */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <Button 
          onClick={loadData} 
          variant="outline" 
          size="sm" 
          className={cn("rounded-xl border border-navy/20 text-navy hover:bg-teal/20 font-bold", isDark ? "text-teal-300 hover:bg-white/10" : "text-navy hover:bg-teal-50")}
        >
            <RefreshCw className="h-4 w-4 mr-2 text-navy" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal text-navy font-black rounded-xl shadow-md hover:bg-teal/80 transition-colors" size="sm">
                <Plus className="h-4 w-4 mr-2 text-navy" />
                Create Invoice
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Select a customer and add items to create a new invoice
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Customer Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-navy">Select Customer</h3>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-teal" />
                  <Input
                    placeholder="Search customers..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10 border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {filteredUsers.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedUser?.id === user.id ? "bg-navy/10 border-navy" : ""
                      }`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="font-medium">{getUserDisplayName(user)}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="p-4 text-center text-gray-500">No customers found</div>
                  )}
                </div>

                {selectedUser && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Input
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Items Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-navy">Invoice Items</h3>

                {/* Add from Products */}
                <div>
                  <Label>Add Product</Label>
                  <Select onValueChange={(value) => {
                    const product = products.find(p => p.id.toString() === value)
                    if (product) handleAddProduct(product)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - TZS {product.price.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Custom Item */}
                <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
                  <Label>Or Add Custom Item</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Item name"
                      value={customItem.name}
                      onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={customItem.price || ""}
                      onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                    />
                    <Button onClick={handleAddCustomItem} variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Invoice Items List */}
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {invoiceItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No items added</div>
                  ) : (
                    invoiceItems.map((item) => (
                      <div key={item.id} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            TZS {item.price.toLocaleString()} x {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-16 h-8"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                            min={1}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label>Invoice Notes (Optional)</Label>
                  <Input
                    placeholder="Add any notes for this invoice..."
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                  />
                </div>

                {/* Total */}
                <div className="p-4 bg-navy/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-navy">
                      TZS {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-navy hover:bg-navy/90"
                  onClick={handleCreateInvoice}
                  disabled={isCreating || !selectedUser || invoiceItems.length === 0}
                >
                  {isCreating ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 5. Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className={cn(
          "rounded-2xl p-12 sm:p-16 text-center shadow-sm",
          isDark ? "bg-[#080d2a]/80 border-none" : "border-2 bg-white border-navy/20"
        )}>
          <FileText className="h-14 w-14 text-navy/40 mx-auto mb-3" />
          <p className={cn("font-black text-lg", isDark ? "text-white" : "text-navy")}>No invoices found</p>
          <p className={cn("text-sm font-bold mt-1 opacity-90", isDark ? "text-slate-400" : "text-navy")}>Click &quot;Create Invoice&quot; to get started</p>
        </div>
      ) : (
        <div className={cn(
          "rounded-2xl overflow-hidden",
          isDark ? "bg-[#080d2a]/80 border-none shadow-lg" : "border bg-white border-navy/20 shadow-sm"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/30 bg-navy text-white">
                  <th className="text-left py-3.5 px-4 font-black text-white uppercase text-xs tracking-wider">Invoice</th>
                  <th className="text-left py-3.5 px-4 font-black text-white uppercase text-xs tracking-wider">Customer</th>
                  <th className="text-left py-3.5 px-4 font-black text-white uppercase text-xs tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-4 font-black text-white uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-4 font-black text-white uppercase text-xs tracking-wider hidden md:table-cell">Due Date</th>
                  <th className="text-right py-3.5 px-4 font-black text-white uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={cn(
                      "transition-colors cursor-pointer",
                      selectedInvoice?.id === invoice.id 
                        ? (isDark ? "bg-teal-400/20 text-white" : "bg-teal/40 text-navy") 
                        : (isDark ? "hover:bg-teal/50 hover:text-navy" : "hover:bg-teal/50 hover:text-navy")
                    )}
                    onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-teal text-navy border-teal" : "bg-navy text-teal border-navy/20"
                        )}>
                          <FileText className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-navy" : "text-teal")} />
                        </div>
                        <div className="min-w-0">
                          <span className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>
                            #{invoice.invoice_number}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className={cn("font-semibold", isDark ? "text-white" : "text-navy")}>
                          {invoice.customer_name || "Customer"}
                        </p>
                        <p className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-navy/70")}>{invoice.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={cn("font-black tracking-tight whitespace-nowrap", isDark ? "text-white" : "text-navy")}>
                        TSH {invoice.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString()
                          : new Date(invoice.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          title="View Invoice Preview"
                          onClick={() => handleOpenPreview(invoice)}
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          title="Print / Preview Invoice"
                          onClick={() => handlePrintInvoice(invoice)}
                        >
                          <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                          )}
                          title="Delete Invoice"
                          onClick={() => handleDeleteInvoice(invoice.id)}
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

      {/* 5. Invoice Preview & Print Modal Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className={cn(
          "max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 rounded-3xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
        )}>
          <DialogHeader className="sr-only">
            <DialogTitle>Invoice #{selectedInvoice?.invoice_number || "Details"}</DialogTitle>
            <DialogDescription>Invoice preview and payment details</DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
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
                        Invoice #{selectedInvoice.invoice_number}
                      </h2>
                      <Badge className={cn("text-xs uppercase tracking-wider font-black px-3 py-1 shadow-xs", getStatusColor(selectedInvoice.status))}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      Issued on {new Date(selectedInvoice.created_at).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
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
                    Print Invoice
                  </Button>
                </div>
              </div>

              {/* 2-Column Responsive Grid matching Order Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Invoice Items & Financial Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-lg transition-all",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <CardHeader className="p-4 sm:p-6 border-b border-navy/10 dark:border-teal/20 bg-teal/10 dark:bg-[#070d2b]">
                      <CardTitle className="text-base sm:text-lg font-black flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-navy dark:text-white" />
                          Invoice Items ({selectedInvoice.items?.length || 0})
                        </span>
                        <span className="text-xs uppercase font-bold tracking-wider opacity-70">
                          ID: #{selectedInvoice.id.slice(0, 12)}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                              <th className="text-left py-3.5 px-4">Item Details</th>
                              <th className="text-center py-3.5 px-4">Qty</th>
                              <th className="text-right py-3.5 px-4">Unit Price</th>
                              <th className="text-right py-3.5 px-4">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                            {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                              selectedInvoice.items.map((item: any, idx: number) => (
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
                                        ) : (
                                          <Package className="h-6 w-6 text-navy/40" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-sm truncate max-w-xs">{item.name}</p>
                                        {item.id && (
                                          <Link 
                                            href={`/shop/${item.id}`} 
                                            target="_blank" 
                                            className="text-xs text-navy dark:text-white hover:underline flex items-center gap-1 font-medium mt-0.5"
                                          >
                                            View in Shop <ExternalLink className="h-3 w-3 text-navy dark:text-white" />
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-center font-bold">
                                    <span className="px-2.5 py-1 rounded-md bg-navy/10 dark:bg-white/10 text-xs">
                                      x{item.quantity}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-right font-medium">
                                    TZS {Number(item.price).toLocaleString()}
                                  </td>
                                  <td className="py-4 px-4 text-right font-black">
                                    TZS {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-sm opacity-60">
                                  No item records on this invoice.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Financial Totals */}
                      <div className="p-4 sm:p-6 border-t border-navy/10 dark:border-teal/20 bg-slate-50/50 dark:bg-[#070d2b]/50">
                        <div className="max-w-xs ml-auto space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="opacity-70">Subtotal:</span>
                            <span className="font-bold">TZS {Number(selectedInvoice.total).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="opacity-70">Shipping:</span>
                            <span className="font-bold text-green-600">FREE</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="opacity-70">Tax / VAT:</span>
                            <span className="font-bold">Included</span>
                          </div>
                          <div className="border-t border-navy/10 dark:border-teal/30 pt-2.5 flex justify-between items-baseline">
                            <span className="font-black text-base">Total Due:</span>
                            <span className="text-xl sm:text-2xl font-black text-navy dark:text-white">
                              TZS {Number(selectedInvoice.total).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right 1 Column: Invoice Status & Customer Information */}
                <div className="space-y-6">
                  {/* Status Card */}
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
                      <h3 className="text-base font-black flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-navy dark:text-white" />
                        Invoice Status
                      </h3>
                      <p className="text-xs opacity-70">Manage payment & billing status</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Status Phase:
                      </label>
                      <Select
                        value={selectedInvoice.status}
                        onValueChange={async (newStatus: any) => {
                          try {
                            await updateInvoiceStatus(selectedInvoice.id, newStatus)
                            setSelectedInvoice({ ...selectedInvoice, status: newStatus })
                            setInvoices(invoices.map(i => i.id === selectedInvoice.id ? { ...i, status: newStatus } : i))
                            toast({ title: "Status Updated", description: `Invoice status changed to ${newStatus}` })
                          } catch (err) {
                            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
                          }
                        }}
                      >
                        <SelectTrigger className={cn(
                          "h-11 rounded-xl border-2 font-bold text-sm",
                          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={cn("rounded-xl border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                          <SelectItem value="draft" className="font-bold">Draft / Pending</SelectItem>
                          <SelectItem value="sent" className="font-bold text-teal-600">Sent / Processing</SelectItem>
                          <SelectItem value="paid" className="font-bold text-green-600">Paid & Completed</SelectItem>
                          <SelectItem value="overdue" className="font-bold text-brand-red">Overdue</SelectItem>
                          <SelectItem value="cancelled" className="font-bold text-brand-red">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedInvoice.notes && (
                      <div className={cn(
                        "p-3 rounded-xl border text-xs leading-relaxed",
                        isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
                      )}>
                        <span className="font-bold">Reference:</span> {selectedInvoice.notes}
                      </div>
                    )}
                  </Card>

                  {/* Customer Information Card */}
                  <Card className={cn(
                    "rounded-2xl sm:rounded-3xl border-2 p-5 shadow-lg space-y-4",
                    isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}>
                    <div className="border-b border-navy/10 dark:border-teal/20 pb-3">
                      <h3 className="text-base font-black flex items-center gap-2">
                        <User className="h-5 w-5 text-navy dark:text-white" />
                        Customer Information
                      </h3>
                      <p className="text-xs opacity-70">Client profile & billing details</p>
                    </div>

                    <div className="space-y-3.5 text-sm">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-60">Full Name</p>
                          <p className="font-bold text-sm">{selectedInvoice.customer_name || "Customer Name Not Provided"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider opacity-60">Email Address</p>
                          <p className="font-medium text-sm truncate">{selectedInvoice.customer_email || "No email on record"}</p>
                        </div>
                      </div>

                      {selectedInvoice.customer_phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-60">Phone Contact</p>
                            <p className="font-medium text-sm">{selectedInvoice.customer_phone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-navy dark:text-white mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider opacity-60">Billing / Delivery Address</p>
                          <p className="font-medium text-sm leading-relaxed">{selectedInvoice.customer_address || "Tanzania"}</p>
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

      {/* Hidden printable invoice container for react-to-print */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", width: "210mm" }}>
        <div ref={printComponentRef}>
          {invoiceToPrint && (
            <div className="invoice-print-root w-full font-sans text-navy bg-white relative" style={{ padding: "10mm 10mm", boxSizing: "border-box" }}>
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
                  <div className="flex items-center gap-5 bg-transparent">
                    <img 
                      src="/turquoise.png" 
                      alt="QuardCubeLabs Logo" 
                      className="w-[150px] h-[150px] object-contain flex-shrink-0"
                    />
                    <div className="bg-transparent">
                      <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">QuardCubeLabs</h2>
                      <p className="text-[16px] font-medium text-navy/85 mt-1">Your trusted partner in digital solutions</p>
                      <p className="text-[16px] font-medium text-navy/85 mt-0.5">Email: info@quardcubelabs.co.tz</p>
                      <p className="text-[16px] font-medium text-navy/85">Website: www.quardcubelabs.co.tz</p>
                    </div>
                  </div>
                  <div className="text-right bg-transparent">
                    <h1 className="text-4xl sm:text-5xl font-black text-navy mb-1.5 tracking-tight">INVOICE</h1>
                    <p className="text-[15px] text-navy/85 font-medium">
                      Invoice #<span className="font-bold text-navy">{invoiceToPrint.invoice_number}</span>
                    </p>
                    <p className="text-[15px] text-navy/85 font-medium mt-0.5">
                      Date: <span className="font-bold text-navy">{new Date(invoiceToPrint.created_at).toLocaleDateString()}</span>
                    </p>
                    <p className="text-[15px] text-navy/85 mt-1.5 font-medium">
                      Order Status:{" "}
                      <span 
                        className="font-bold capitalize"
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
                    <p className="text-lg font-bold text-navy">{invoiceToPrint.customer_name || "Customer"}</p>
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">{invoiceToPrint.customer_email || ""}</p>
                    {invoiceToPrint.customer_phone && (
                      <p className="text-[15px] text-navy/85 font-medium leading-relaxed">Phone: {invoiceToPrint.customer_phone}</p>
                    )}
                    <p className="text-[15px] text-navy/85 font-medium leading-relaxed">{invoiceToPrint.customer_address || "Tanzania, United Republic of"}</p>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="mb-7 bg-transparent">
                  <table className="w-full border-collapse bg-transparent">
                    <thead>
                      <tr className="border-b-2 border-navy/60 bg-transparent">
                        <th className="text-left text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider bg-transparent">Item</th>
                        <th className="text-right text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-20 bg-transparent">Qty</th>
                        <th className="text-right text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-32 bg-transparent">Unit Price</th>
                        <th className="text-right text-[15px] font-black text-navy py-3 px-3 uppercase tracking-wider w-32 bg-transparent">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent">
                      {(invoiceToPrint.items || []).map((item, index) => (
                        <tr key={item.id || index} className="border-b border-navy/15 bg-transparent avoid-break">
                          <td className="text-[15px] font-semibold text-navy/90 py-3.5 px-3 bg-transparent">{item.name}</td>
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
                    <h3 className="text-lg font-black text-navy mb-2 uppercase tracking-wider">Payment Information:</h3>
                    <p className="text-[15px] text-navy/85 font-medium mb-3.5">Payment Method: Office Pickup</p>
                    <h3 className="text-lg font-black text-navy mb-2 uppercase tracking-wider">Terms & Conditions:</h3>
                    <ol className="list-decimal list-inside text-[15px] text-navy/85 space-y-1 leading-relaxed bg-transparent">
                      <li>Goods are shipped upon confirmation of 100% payment.</li>
                      <li>Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</li>
                      <li>All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</li>
                    </ol>
                    {invoiceToPrint.notes && (
                      <p className="text-[15px] text-navy/85 mt-3 font-semibold bg-transparent">
                        Note: {invoiceToPrint.notes}
                      </p>
                    )}
                  </div>
                  <div className="w-1/2 pl-6 text-right bg-transparent">
                    <div className="space-y-2 bg-transparent">
                      <div className="flex justify-between text-[15px] text-navy/85 font-medium bg-transparent">
                        <span>Subtotal:</span>
                        <span className="font-bold text-navy">TZS {Number(invoiceToPrint.total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[15px] text-navy/85 font-medium bg-transparent">
                        <span>Shipping Cost:</span>
                        <span className="font-bold text-green-600">TZS 0.00</span> 
                      </div>
                      <div className="flex justify-between text-[15px] text-navy/85 font-medium border-b border-navy/25 pb-2 bg-transparent">
                        <span>Tax:</span>
                        <span className="font-bold text-navy">TZS 0.00</span> 
                      </div>
                      <div className="flex justify-between text-2xl sm:text-3xl font-black text-navy pt-2 bg-transparent">
                        <span>TOTAL DUE:</span>
                        <span>TZS {Number(invoiceToPrint.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[15px] text-navy/70 font-medium bg-transparent avoid-break pt-3">
                  <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
                  <p className="mt-0.5">Thank you for your business!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Invoice Status Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(
          "max-w-md p-5 sm:p-6 rounded-2xl border-2 shadow-2xl",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="pb-3 border-b border-navy/10 dark:border-teal/20">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal" />
              Update Invoice Status
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
              Modify status for invoice #{editingInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">
                Select Invoice Status
              </label>
              <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val)}>
                <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold text-sm", isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue placeholder="Choose status..." />
                </SelectTrigger>
                <SelectContent className={cn("rounded-xl border-2", isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectItem value="draft" className="font-bold">Draft</SelectItem>
                  <SelectItem value="sent" className="font-bold text-blue-500">Sent</SelectItem>
                  <SelectItem value="paid" className="font-bold text-green-600">Paid</SelectItem>
                  <SelectItem value="overdue" className="font-bold text-amber-500">Overdue</SelectItem>
                  <SelectItem value="cancelled" className="font-bold text-brand-red">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn(
              "p-3 rounded-xl border text-xs leading-relaxed",
              isDark ? "bg-[#060a22]/80 border-teal/20 text-slate-300" : "bg-teal-50/70 border-navy/10 text-navy/90"
            )}>
              <span className="font-bold">Info:</span> Changing the invoice status will instantly update financial records and ledger balances.
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
                if (editingInvoice && editStatus) {
                  handleUpdateInvoiceStatus(editingInvoice.id, editStatus)
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
