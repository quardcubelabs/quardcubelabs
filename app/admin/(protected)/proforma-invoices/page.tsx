"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useReactToPrint } from "react-to-print"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { 
  AdminProformaInvoice, 
  ProformaItem, 
  getAdminProformaInvoices,
  createAdminProformaInvoice,
  updateProformaStatus,
  convertProformaToInvoice,
  deleteAdminProformaInvoice
} from "@/lib/proforma-actions"
import { getProducts, type Product } from "@/lib/product-actions"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import ProformaTemplateRenderer from "@/components/admin/proforma-templates"
import { printProformaDocument } from "@/lib/print-proforma"
import {
  FileSpreadsheet,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign,
  User,
  Calendar,
  Layers,
  ArrowUpRight,
  AlertCircle
} from "lucide-react"

export default function ProformaInvoicesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

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
    { id: "1", name: "", quantity: 1, price: 0, type: "custom" }
  ])
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)

  // Preview & Print State
  const [previewProforma, setPreviewProforma] = useState<AdminProformaInvoice | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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
        getAuthUsers().catch(() => ({ users: [], error: null }))
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
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const taxAmount = (subtotal * taxRate) / 100
  const grandTotal = Math.max(0, subtotal + taxAmount - discount)

  // Add line item
  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: "", quantity: 1, price: 0, type: "custom" }])
  }

  // Remove line item
  const removeItem = (index: number) => {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  // Select registered product
  const handleSelectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id.toString() === productId)
    if (!product) return
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      name: product.name,
      price: Number(product.price || 0),
      type: "product",
      description: product.description?.slice(0, 80)
    }
    setItems(newItems)
  }

  // Select registered user
  const handleSelectUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return
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
    const validItems = items.filter(it => it.name.trim().length > 0 && it.price > 0)
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
          address: customerAddress
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
        status: "draft"
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
      setDiscount(0)
      setTaxRate(0)
    } catch (err: any) {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  // Print trigger using react-to-print or direct popup print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: previewProforma ? `Proforma_${previewProforma.proforma_number}` : "Proforma_Invoice"
  })

  // Convert to Invoice
  const handleConvert = async (proforma: AdminProformaInvoice) => {
    try {
      const res = await convertProformaToInvoice(proforma.id)
      if (res.success) {
        toast({
          title: "Converted to Tax Invoice",
          description: `Generated official tax invoice from Proforma #${proforma.proforma_number}.`
        })
        setProformas(proformas.map(p => p.id === proforma.id ? { ...p, status: "converted" } : p))
      } else {
        toast({ title: "Conversion Failed", description: res.error, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    }
  }

  // Status update
  const handleStatusChange = async (id: string, newStatus: AdminProformaInvoice['status']) => {
    const updated = await updateProformaStatus(id, newStatus)
    if (updated) {
      setProformas(proformas.map(p => p.id === id ? updated : p))
      toast({ title: "Status Updated", description: `Status changed to ${newStatus}.` })
    }
  }

  // Delete
  const confirmDelete = async () => {
    if (!proformaToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminProformaInvoice(proformaToDelete.id)
      setProformas(proformas.filter(p => p.id !== proformaToDelete.id))
      toast({ title: "Deleted", description: `Proforma #${proformaToDelete.proforma_number} removed.` })
      setProformaToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Stats calculation
  const totalProformas = proformas.length
  const convertedCount = proformas.filter(p => p.status === "converted").length
  const acceptedCount = proformas.filter(p => p.status === "accepted").length
  const pendingCount = proformas.filter(p => p.status === "draft" || p.status === "sent").length
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
  const tabs = [
    { key: "all", label: "All Proformas", icon: FileSpreadsheet },
    { key: "sent", label: "Sent", icon: Clock },
    { key: "accepted", label: "Accepted", icon: CheckCircle },
    { key: "converted", label: "Converted", icon: ArrowRight },
    { key: "draft", label: "Draft", icon: FileText },
    { key: "expired", label: "Expired", icon: AlertCircle },
  ]

  // Filtered List
  const filteredProformas = proformas.filter(p => {
    // Tab filter
    if (activeTab !== "all" && p.status !== activeTab) {
      return false
    }
    // Dropdown status filter
    if (statusFilter !== "all" && p.status !== statusFilter) {
      return false
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchNumber = p.proforma_number.toLowerCase().includes(q)
      const matchName = p.customer_name?.toLowerCase().includes(q)
      const matchEmail = p.customer_email?.toLowerCase().includes(q)
      return matchNumber || matchName || matchEmail
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "converted":
        return "bg-green-600 text-white border-green-600 font-black shadow-xs"
      case "accepted":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black"
      case "sent":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-black"
      case "draft":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30 font-bold"
      case "expired":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 font-bold"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Proforma <span className="gradient-text">Invoices</span>
          </h1>
          <p className="text-gray-600">Create, manage and convert commercial proforma estimates</p>
        </div>
        <AdminLoading message="Loading proforma invoices..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Proforma <span className="gradient-text">Invoices</span>
          </h1>
          <p className="text-gray-600">Create, manage and convert commercial proforma estimates</p>
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
      {/* Page Header Card in Teal without borders */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Proforma <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Invoices</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Create, manage, and convert commercial proforma estimates with official document layout & digital verification
            </p>
          </div>
        </div>
      </div>

      {/* 1. Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Proformas", value: formatStatNumber(totalProformas), icon: FileSpreadsheet },
          { title: "Converted", value: formatStatNumber(convertedCount), icon: CheckCircle },
          { title: "Pending / Sent", value: formatStatNumber(pendingCount), icon: Clock },
          { title: "Accepted", value: formatStatNumber(acceptedCount), icon: TrendingUp },
          { 
            title: "Total Pipeline", 
            value: formatStatCurrency(totalValue), 
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

      {/* 2. Category / Status Tabs & Connected Content Container */}
      <div className="space-y-0 relative">
        <div className="relative z-10 flex items-end gap-1.5 overflow-x-auto pb-0 w-full px-0 -mb-[2px]">
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === tab.key
            const isFirst = idx === 0

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                  isSelected && isFirst
                    ? "rounded-tl-2xl sm:rounded-tl-3xl rounded-tr-xl sm:rounded-tr-2xl"
                    : "rounded-t-xl sm:rounded-t-2xl",
                  isSelected
                    ? cn(
                        "font-black border-2 border-b-0 border-navy/20 dark:border-teal/30 z-20 shadow-none",
                        isDark ? "bg-[#0c1833] text-teal" : "bg-[#e6f7f5] text-navy"
                      )
                    : "bg-transparent text-navy/70 hover:text-navy dark:text-slate-400 dark:hover:text-white border-0 hover:bg-teal-500/10 z-0"
                )}
              >
                {isSelected && (
                  <>
                    {/* Left concave fillet curve (only for non-first tabs) */}
                    {!isFirst && (
                      <span className="absolute -bottom-[2px] -left-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                        <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                          <path d="M12 0C12 6.627 6.627 12 0 12H12V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                          <path d="M0 12C6.627 12 12 6.627 12 0" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                        </svg>
                      </span>
                    )}
                    {/* Right concave fillet curve */}
                    <span className="absolute -bottom-[2px] -right-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                      <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                        <path d="M0 0C0 6.627 5.373 12 12 12H0V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                        <path d="M0 0C0 6.627 5.373 12 12 12H0V0Z" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                      </svg>
                    </span>
                    {/* Bottom bridge to erase content card top border under active tab */}
                    <span className={cn("absolute -bottom-[3px] -left-[2px] -right-[2px] h-[6px] z-30 pointer-events-none", isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]")} />
                  </>
                )}
                <tab.icon className={cn("h-4 w-4 shrink-0 relative z-40", isSelected ? "text-navy dark:text-teal" : "text-navy/60 dark:text-slate-400")} />
                <span className="relative z-40">{tab.label}</span>
                {tab.key !== "all" && (
                  <span className={cn(
                    "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold relative z-40 transition-colors",
                    isSelected 
                      ? isDark ? "bg-teal text-navy font-black" : "bg-navy text-white font-bold"
                      : isDark ? "bg-teal/20 text-teal" : "bg-teal-100/80 text-navy"
                  )}>
                    {proformas.filter(p => p.status === tab.key).length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main Tab Content Container */}
        <div className={cn(
          "border-2 border-navy/20 dark:border-teal/30 p-4 sm:p-5 shadow-sm space-y-4 relative z-0",
          activeTab === tabs[0].key 
            ? "rounded-b-2xl sm:rounded-b-3xl rounded-tr-2xl sm:rounded-tr-3xl rounded-tl-none" 
            : "rounded-2xl sm:rounded-3xl",
          isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]"
        )}>
          {/* 3. Search & Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
                <Input
                  placeholder="Search by proforma #, client name or email..."
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
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Action Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-2">
            <Button 
              onClick={loadData} 
              variant="outline" 
              size="sm" 
              className={cn("rounded-xl border-2 font-bold h-10 px-4", isDark ? "border-teal/30 text-teal-300 hover:bg-white/10" : "border-navy/20 text-navy hover:bg-navy/10")}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-teal text-navy font-black rounded-xl shadow-md hover:bg-teal-400 transition-colors h-10 px-5" 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Proforma Invoice
            </Button>
          </div>

          {/* 5. Proforma Records Table */}
          {filteredProformas.length === 0 ? (
            <div className={cn(
              "rounded-2xl sm:rounded-3xl p-12 text-center shadow-lg",
              isDark ? "bg-[#060a22]/90 border-none" : "border-2 bg-white border-navy/20"
            )}>
              <FileSpreadsheet className="h-12 w-12 text-navy/40 dark:text-teal-400/40 mx-auto mb-3" />
              <p className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>No proforma invoices found</p>
              <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
                Click &quot;Create Proforma Invoice&quot; to generate a new commercial estimate
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
                      <th className="text-left py-4 px-4 font-black text-white">Proforma #</th>
                      <th className="text-left py-4 px-4 font-black text-white">Client / Recipient</th>
                      <th className="text-left py-4 px-4 font-black text-white">Amount (TZS)</th>
                      <th className="text-left py-4 px-4 font-black text-white">Status</th>
                      <th className="text-left py-4 px-4 font-black text-white hidden md:table-cell">Valid Until</th>
                      <th className="text-right py-4 px-4 font-black text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                    {filteredProformas.map((p) => (
                      <tr
                        key={p.id}
                        className={cn(
                          "transition-colors duration-150 cursor-pointer group",
                          isDark 
                            ? "hover:bg-teal/30 hover:text-white" 
                            : "hover:bg-teal/50 hover:text-navy"
                        )}
                        onClick={() => {
                          setPreviewProforma(p)
                          setIsPreviewOpen(true)
                        }}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                              isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                            )}>
                              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal" />
                            </div>
                            <div className="min-w-0">
                              <span className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-navy")}>
                                #{p.proforma_number}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>
                              {p.customer_name || "Unknown Customer"}
                            </p>
                            <p className={cn("text-xs truncate max-w-xs", isDark ? "text-slate-300" : "text-navy/70")}>{p.customer_email}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={cn("font-black text-sm tracking-tight whitespace-nowrap", isDark ? "text-white" : "text-navy")}>
                            TZS {p.total.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={p.status}
                            onValueChange={(val: any) => handleStatusChange(p.id, val)}
                          >
                            <SelectTrigger className={cn(
                              "h-7 w-28 text-[11px] font-black uppercase rounded-lg border",
                              getStatusColor(p.status)
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="sent">Sent</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/70")}>
                            {p.valid_until
                              ? new Date(p.valid_until).toLocaleDateString()
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
                              title="Preview & Print"
                              onClick={() => {
                                setPreviewProforma(p)
                                setIsPreviewOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>

                            <button
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                                isDark ? "bg-teal/20 text-teal hover:bg-teal hover:text-navy" : "bg-teal-100/80 text-navy hover:bg-navy hover:text-white"
                              )}
                              title="Print Proforma Document"
                              onClick={() => printProformaDocument(p)}
                            >
                              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>

                            {p.status !== "converted" && (
                              <button
                                className={cn(
                                  "px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-150 shadow-xs active:scale-95 cursor-pointer flex items-center gap-1",
                                  isDark ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white"
                                )}
                                title="Convert to Official Tax Invoice"
                                onClick={() => handleConvert(p)}
                              >
                                <ArrowRight className="h-3 w-3" />
                                <span>Convert</span>
                              </button>
                            )}

                            <button
                              className={cn(
                                "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer text-red-500",
                                isDark ? "bg-white/10 hover:bg-red-500 hover:text-white" : "bg-red-50 hover:bg-red-500 hover:text-white"
                              )}
                              title="Delete Proforma"
                              onClick={() => setProformaToDelete(p)}
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
        </div>
      </div>

      {/* CREATE PROFORMA DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <FileSpreadsheet className="h-5 w-5 text-teal" />
              Create New Proforma Invoice
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Fill in client information and line items to generate an official proforma invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* 1. Customer Information */}
            <div className={cn("space-y-3 p-4 rounded-xl border", isDark ? "bg-[#060a22] border-slate-700" : "bg-slate-50 border-navy/15")}>
              <div className="flex justify-between items-center">
                <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy")}>Customer / Recipient Details</h4>
                {users.length > 0 && (
                  <Select onValueChange={handleSelectUser}>
                    <SelectTrigger className={cn("h-7 w-48 text-[11px] rounded-lg", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                      <SelectValue placeholder="Autofill from Users..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(users || []).map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {getUserDisplayName(u)} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Client Name *</Label>
                  <Input
                    placeholder="e.g. Acme Enterprises Ltd"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Client Email *</Label>
                  <Input
                    placeholder="billing@acme.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Client Phone</Label>
                  <Input
                    placeholder="+255 7XX XXX XXX"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Physical Address / City</Label>
                  <Input
                    placeholder="Dar es Salaam, Tanzania"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                  />
                </div>
              </div>
            </div>

            {/* 2. Items Builder */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-teal-300" : "text-navy")}>Line Items & Pricing</h4>
                <Button size="sm" variant="outline" onClick={addItem} className={cn("h-7 text-xs gap-1 rounded-lg font-bold", isDark ? "border-teal/30 text-teal-300" : "border-navy/20 text-navy")}>
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={it.id} className={cn("flex flex-col sm:flex-row gap-2 p-3 rounded-xl border items-start sm:items-center", isDark ? "bg-[#060a22] border-slate-700" : "bg-white border-navy/15")}>
                    {/* Catalog Picker */}
                    <div className="w-full sm:w-44 shrink-0">
                      <Select onValueChange={(val) => handleSelectProduct(idx, val)}>
                        <SelectTrigger className={cn("h-8 text-[11px] rounded-lg", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                          <SelectValue placeholder="Catalog product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.slice(0, 40).map(prod => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                              {prod.name} (TZS {Number(prod.price).toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description input */}
                    <Input
                      placeholder="Item name / specification..."
                      value={it.name}
                      onChange={e => {
                        const newItems = [...items]
                        newItems[idx].name = e.target.value
                        setItems(newItems)
                      }}
                      className={cn("h-8 text-xs flex-1 rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                    />

                    {/* Qty */}
                    <div className="w-20 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={e => {
                          const newItems = [...items]
                          newItems[idx].quantity = Math.max(1, parseInt(e.target.value) || 1)
                          setItems(newItems)
                        }}
                        className={cn("h-8 text-xs text-center rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                      />
                    </div>

                    {/* Price */}
                    <div className="w-32 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Price (TZS)"
                        value={it.price || ""}
                        onChange={e => {
                          const newItems = [...items]
                          newItems[idx].price = Math.max(0, parseFloat(e.target.value) || 0)
                          setItems(newItems)
                        }}
                        className={cn("h-8 text-xs text-right font-mono rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                      />
                    </div>

                    {/* Row total */}
                    <div className={cn("w-28 text-right font-bold text-xs font-mono shrink-0", isDark ? "text-teal-300" : "text-navy")}>
                      TZS {(it.quantity * it.price).toLocaleString()}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={items.length <= 1}
                      onClick={() => removeItem(idx)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Totals & Discounts Summary */}
              <div className={cn("flex flex-col sm:flex-row justify-between items-start pt-4 border-t gap-4", isDark ? "border-slate-800" : "border-navy/15")}>
                <div className="space-y-2 w-full sm:w-1/2">
                  <div className="space-y-1">
                    <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Payment Terms & Instructions</Label>
                    <Input
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value)}
                      className={cn("h-8 text-xs rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Valid Until</Label>
                      <Input
                        type="date"
                        value={validUntil}
                        onChange={e => setValidUntil(e.target.value)}
                        className={cn("h-8 text-xs rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>VAT Tax %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={taxRate}
                        onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                        className={cn("h-8 text-xs rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Special Notes (Optional)</Label>
                    <Input
                      placeholder="Special instructions or delivery notes..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className={cn("h-8 text-xs rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                    />
                  </div>
                </div>

                <div className={cn("w-full sm:w-64 space-y-2 text-xs p-3 rounded-xl border font-mono", isDark ? "bg-[#060a22] border-slate-700" : "bg-slate-50 border-navy/15")}>
                  <div className={cn("flex justify-between", isDark ? "text-slate-400" : "text-navy/70")}>
                    <span>Subtotal:</span>
                    <span>TZS {subtotal.toLocaleString()}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className={cn("flex justify-between", isDark ? "text-slate-400" : "text-navy/70")}>
                      <span>VAT ({taxRate}%):</span>
                      <span>TZS {taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className={cn("flex justify-between text-base font-black pt-2 border-t", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}>
                    <span>Total:</span>
                    <span className={cn(isDark ? "text-teal-400" : "text-navy")}>TZS {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreating}
              onClick={handleCreateProforma}
              className="bg-teal text-navy hover:bg-teal-400 font-black rounded-xl gap-1.5 shadow-md"
            >
              {isCreating ? "Generating Proforma..." : "Save & Generate Proforma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PREVIEW & PRINT MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className={cn("w-[95vw] sm:max-w-5xl max-h-[92vh] overflow-y-auto p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className={cn("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Printer className="h-4 w-4 text-teal" />
                  Proforma Document Viewer — #{previewProforma?.proforma_number}
                </DialogTitle>
                <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
                  Official commercial proforma invoice preview with real-time digital verification QR.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Rendered Template Document */}
          <div className={cn("py-4 rounded-2xl p-4 overflow-x-auto flex justify-center", isDark ? "bg-[#060a22]" : "bg-slate-100")}>
            {previewProforma && (
              <ProformaTemplateRenderer
                proforma={previewProforma}
                printRef={printRef}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)} className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (previewProforma) {
                  printProformaDocument(previewProforma)
                } else {
                  handlePrint()
                }
              }}
              className="bg-teal text-navy hover:bg-teal-400 font-black rounded-xl gap-1.5 shadow-md"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={!!proformaToDelete} onOpenChange={open => !open && setProformaToDelete(null)}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500">
              Confirm Delete
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Are you sure you want to delete Proforma #{proformaToDelete?.proforma_number}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setProformaToDelete(null)} className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDelete}
              className="rounded-xl font-bold"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
