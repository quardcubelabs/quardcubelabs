"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { AdminLoading } from "@/components/admin"
import { Plus, Trash2, FileText, User, Mail, Phone, MapPin, Search, Eye, Printer, Calendar, DollarSign, Clock, AlertCircle, XCircle, CheckCircle, Edit, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import { getProducts, type Product } from "@/lib/product-actions"
import { createAdminInvoice, getAdminInvoices, deleteAdminInvoice, type AdminInvoice } from "@/lib/invoice-actions"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface InvoiceItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string
}

export default function AdminInvoicesPage() {
  const { isDark } = useAdminTheme()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

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
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Stats
  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter(i => i.status === "paid").length
  const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "draft").length
  const overdueInvoices = invoices.filter(i => i.status === "overdue").length
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total, 0)

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <style jsx global>{`
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
          /* Reset all parent layout wrappers */
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
          /* Hide admin layout decorations */
          .bg-\\[\\#172c5e\\],
          .bg-\\[\\#40E0D0\\] {
            background: white !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide corner cover elements */
          .absolute.w-8.h-8 {
            display: none !important;
          }
          /* Remove all shadows and rounded corners */
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
          /* Hide relative positioned corner decorations in layout */
          .relative > .absolute.w-8 {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Main content - hidden when printing */}
      <div className="print:hidden">

      {/* Page Header */}
      <div className="pb-2 border-b border-teal/15">
        <h1 className={cn("text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight", isDark ? "text-white" : "text-navy")}>
          Invoice <span className="gradient-text">Management</span>
        </h1>
        <p className="text-xs sm:text-sm text-teal-400 mt-1">Create, track and manage customer billing and invoices</p>
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
              <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Total Invoices</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{totalInvoices}</p>
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
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Paid</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{paidInvoices}</p>
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
              <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Pending</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{pendingInvoices}</p>
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
              <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Overdue</p>
              <p className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>{overdueInvoices}</p>
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
              <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider">Total Revenue</p>
              <p className={cn("text-lg font-extrabold truncate", isDark ? "text-white" : "text-navy")}>
                TZS {(totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Tabs */}
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
            <Input
              placeholder="Search by invoice number, customer name or email..."
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
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 4. Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-navy")}>
            {activeTab === "all" ? "All Invoices" : tabs.find(t => t.key === activeTab)?.label}
            <span className="ml-2 text-sm font-semibold text-teal-400">({filteredInvoices.length})</span>
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
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
      </div>

      {/* 5. Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className={cn(
          "rounded-2xl border p-12 text-center",
          isDark ? "bg-[#080d2a]/80 border-teal/20" : "bg-white border-teal/20"
        )}>
          <FileText className="h-12 w-12 text-teal-400/40 mx-auto mb-3" />
          <p className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-700")}>No invoices found</p>
          <p className="text-xs text-teal-400 mt-1">Click &quot;Create Invoice&quot; to get started</p>
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
                  <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Invoice</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Customer</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider hidden md:table-cell">Due Date</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-teal-400 uppercase text-xs tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-teal/10" : "divide-slate-100")}>
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={cn(
                      "transition-colors cursor-pointer",
                      selectedInvoice?.id === invoice.id 
                        ? isDark ? "bg-teal-400/10" : "bg-teal-50" 
                        : isDark ? "hover:bg-white/5" : "hover:bg-teal-50/40"
                    )}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <td className="py-3.5 px-4">
                      <span className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                        #{invoice.invoice_number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className={cn("font-medium", isDark ? "text-slate-200" : "text-slate-800")}>
                          {invoice.customer_name || "Customer"}
                        </p>
                        <p className="text-xs text-teal-400">{invoice.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("font-bold", isDark ? "text-teal-300" : "text-navy")}>
                        TZS {invoice.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className={isDark ? "text-slate-300" : "text-slate-600"}>
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString()
                          : new Date(invoice.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-teal-400/15"
                          title="View"
                          onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); }}
                        >
                          <Eye className="h-4 w-4 text-teal-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-teal-400/15"
                          title="Print"
                          onClick={(e) => { e.stopPropagation(); setSelectedInvoice(invoice); setTimeout(() => window.print(), 200); }}
                        >
                          <Printer className="h-4 w-4 text-teal-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-rose-500/15"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); }}
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

      {/* Invoice Detail Panel */}
      {selectedInvoice && (
        <div className={cn(
          "rounded-2xl border p-6 space-y-4",
          isDark ? "bg-[#080d2a]/90 border-teal/25 text-white" : "bg-white border-teal/25 text-navy"
        )}>
          <div className="flex items-center justify-between pb-3 border-b border-teal/15">
            <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-navy")}>
              Invoice #{selectedInvoice.invoice_number}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className={cn("rounded-xl border", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-teal/30 text-navy hover:bg-teal-50")}
              >
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedInvoice(null)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className={cn("font-semibold text-sm", isDark ? "text-teal-300" : "text-navy")}>Customer Details</h4>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-teal-400" />
                <span className="font-medium">{selectedInvoice.customer_name || "Unknown Customer"}</span>
              </div>
              {selectedInvoice.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-teal-400" />
                  <span>{selectedInvoice.customer_email}</span>
                </div>
              )}
              {selectedInvoice.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-teal-400" />
                  <span>{selectedInvoice.customer_phone}</span>
                </div>
              )}
              {selectedInvoice.customer_address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-teal-400 mt-0.5" />
                  <span>{selectedInvoice.customer_address}</span>
                </div>
              )}
              {selectedInvoice.notes && (
                <div className="pt-2">
                  <h4 className="font-semibold text-xs text-teal-400 mb-1">Notes</h4>
                  <p className="text-xs text-slate-400">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className={cn("font-semibold text-sm mb-2", isDark ? "text-teal-300" : "text-navy")}>Invoice Items</h4>
              <div className="space-y-2">
                {selectedInvoice.items.map((item: any, index: number) => (
                  <div key={index} className={cn("flex justify-between text-sm py-1.5 border-b", isDark ? "border-teal/10" : "border-slate-100")}>
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-bold text-teal-400">TZS {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-teal/20 pt-3 mt-3">
                <div className="flex justify-between text-base font-extrabold">
                  <span>Total:</span>
                  <span className="text-teal-400">TZS {selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Printable Invoice - visible only when printing */}
      {selectedInvoice && (
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
          <div className="relative z-20" style={{ padding: '10mm 8mm' }}>
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
            {/* Right side: Invoice Details */}
            <div className="text-right">
              <h1 className="text-2xl font-bold text-navy mb-1">INVOICE</h1>
              <p className="text-xs text-navy/70">Invoice #<span className="font-semibold text-navy">{selectedInvoice.invoice_number}</span></p>
              <p className="text-xs text-navy/70">Date: <span className="font-semibold text-navy">{new Date(selectedInvoice.created_at).toLocaleDateString()}</span></p>
              <p className="text-xs text-navy/70 mt-2">Order Status: <span className="font-semibold capitalize text-navy">{selectedInvoice.status}</span></p>
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
              <p className="text-xs text-navy/80 font-semibold">{selectedInvoice.customer_name || "Customer"}</p>
              <p className="text-xs text-navy/70">{selectedInvoice.customer_email}</p>
              {selectedInvoice.customer_phone && (
                <p className="text-xs text-navy/70">Phone: {selectedInvoice.customer_phone}</p>
              )}
              {selectedInvoice.customer_address && (
                <p className="text-xs text-navy/70">{selectedInvoice.customer_address}</p>
              )}
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-navy/50 bg-transparent">
                  <th className="text-left text-xs font-bold text-navy py-2 px-2">Item</th>
                  <th className="text-right text-xs font-bold text-navy py-2 px-2 w-16">Qty</th>
                  <th className="text-right text-xs font-bold text-navy py-2 px-2 w-24">Unit Price</th>
                  <th className="text-right text-xs font-bold text-navy py-2 px-2 w-24">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-navy/10">
                    <td className="text-xs text-navy/80 py-2 px-2">{item.name}</td>
                    <td className="text-right text-xs text-navy/80 py-2 px-2 w-16">{item.quantity}</td>
                    <td className="text-right text-xs text-navy/80 py-2 px-2 w-24">TZS {item.price.toFixed(2)}</td>
                    <td className="text-right text-xs text-navy/80 py-2 px-2 w-24">TZS {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals and Terms */}
          <div className="flex justify-between">
             {/* Terms and Conditions */}
            <div className="w-1/2 pr-4">
               <h3 className="text-sm font-bold text-navy mb-2">Payment Information:</h3>
               <p className="text-xs text-navy/80 mb-3">Payment Method: Office Pickup</p>
              <h3 className="text-sm font-bold text-navy mb-2">Terms & Conditions:</h3>
              <ol className="list-decimal list-inside text-xs text-navy/80 space-y-0.5">
                <li>Goods are shipped upon confirmation of 100% payment.</li>
                <li>Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</li>
                <li>All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</li>
              </ol>
            </div>
            {/* Totals */}
            <div className="w-1/2 pl-4 text-right">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-navy/80">
                  <span>Subtotal:</span>
                  <span>TZS {selectedInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-navy/80">
                  <span>Shipping Cost:</span>
                  <span>TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-xs text-navy/80 border-b border-navy/20 pb-1">
                  <span>Tax:</span>
                  <span>TZS 0.00</span> 
                </div>
                <div className="flex justify-between text-lg font-bold text-navy pt-1">
                  <span>TOTAL DUE:</span>
                  <span>TZS {selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

           {/* Footer */}
           <div className="mt-6 text-center text-xs text-navy/70">
             <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
             <p className="mt-0.5">Thank you for your business!</p>
           </div>
          </div>
        </div>
      )}
    </div>
  )
}
