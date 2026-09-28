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
  AdminReceipt, 
  ReceiptItem, 
  ReceiptTemplateId,
  PaymentMethod,
  getAdminReceipts,
  createAdminReceipt,
  updateReceiptStatus,
  deleteAdminReceipt
} from "@/lib/receipt-actions"
import { getAdminInvoices, type AdminInvoice } from "@/lib/invoice-actions"
import { getAuthUsers, type AuthUser } from "@/lib/auth-users-actions"
import ReceiptTemplateRenderer from "@/components/admin/receipt-templates"
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  User,
  LayoutTemplate,
  Calendar,
  CreditCard,
  Building2,
  ShieldCheck,
  AlertCircle
} from "lucide-react"

const TEMPLATE_OPTIONS: { id: ReceiptTemplateId; name: string; desc: string }[] = [
  { id: "modern-corporate", name: "Modern Corporate", desc: "Executive Navy & Green Paid Stamp with high-resolution centered QR" },
  { id: "minimalist-tech", name: "Minimalist Tech", desc: "Dark Cyber voucher theme with digital verification hash" },
  { id: "classic-enterprise", name: "Classic Enterprise", desc: "Formal boxed structure with official signature & stamp boxes" },
  { id: "emerald-cyber", name: "Emerald Cyber", desc: "Vivid emerald gradient header with bold financial clearance badge" },
  { id: "compact-retail", name: "Compact Retail", desc: "POS thermal style transaction voucher format" }
]

const PAYMENT_METHODS: PaymentMethod[] = [
  "M-Pesa",
  "Airtel Money",
  "Tigo Pesa",
  "Bank Transfer",
  "Credit Card",
  "Cash",
  "Direct Settlement"
]

export default function ReceiptsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [receipts, setReceipts] = useState<AdminReceipt[]>([])
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplateId>("modern-corporate")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("M-Pesa")
  const [transactionRef, setTransactionRef] = useState("")
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  // Preview & Print State
  const [previewReceipt, setPreviewReceipt] = useState<AdminReceipt | null>(null)
  const [activePreviewTemplate, setActivePreviewTemplate] = useState<ReceiptTemplateId>("modern-corporate")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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
      const [receiptsData, invoicesData, usersResult] = await Promise.all([
        getAdminReceipts(),
        getAdminInvoices().catch(() => []),
        getAuthUsers().catch(() => ({ users: [], error: null }))
      ])
      setReceipts(receiptsData || [])
      setInvoices(invoicesData || [])
      setUsers(Array.isArray(usersResult?.users) ? usersResult.users : [])
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

  // Link invoice autofill
  const handleSelectInvoice = (invId: string) => {
    const inv = invoices.find(i => i.id === invId || i.invoice_number === invId)
    if (!inv) return
    setInvoiceNumber(inv.invoice_number)
    setCustomerName(inv.customer_name)
    setCustomerEmail(inv.customer_email)
    setCustomerPhone(inv.customer_phone || "")
    setAmountPaid(Number(inv.total || 0))
  }

  // User autofill
  const handleSelectUser = (userId: string) => {
    const u = users.find(user => user.id === userId)
    if (!u) return
    setCustomerName(getUserDisplayName(u))
    setCustomerEmail(u.email || "")
    setCustomerPhone(u.phone || u.user_metadata?.phone || "")
  }

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
          address: customerAddress
        },
        invoiceNumber: invoiceNumber || undefined,
        amountPaid,
        paymentMethod,
        transactionRef: transactionRef || undefined,
        paymentDate: paymentDate ? `${paymentDate}T12:00:00.000Z` : undefined,
        notes: notes || undefined,
        templateId: selectedTemplate,
        status: "issued"
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
      setTransactionRef("")
      setNotes("")
    } catch (err: any) {
      toast({ title: "Receipt Creation Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  // Print trigger
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: previewReceipt ? `Receipt_${previewReceipt.receipt_number}` : "Receipt"
  })

  // Delete
  const confirmDelete = async () => {
    if (!receiptToDelete) return
    setIsDeleting(true)
    try {
      await deleteAdminReceipt(receiptToDelete.id)
      setReceipts(receipts.filter(r => r.id !== receiptToDelete.id))
      toast({ title: "Deleted", description: `Receipt #${receiptToDelete.receipt_number} removed.` })
      setReceiptToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Status Change
  const handleStatusChange = async (id: string, newStatus: AdminReceipt['status']) => {
    const updated = await updateReceiptStatus(id, newStatus)
    if (updated) {
      setReceipts(receipts.map(r => r.id === id ? updated : r))
      toast({ title: "Status Updated", description: `Receipt status changed to ${newStatus}.` })
    }
  }

  // Stats
  const totalReceipts = receipts.length
  const issuedCount = receipts.filter(r => r.status === "issued").length
  const totalAmount = receipts.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0)
  const mpesaCount = receipts.filter(r => r.payment_method === "M-Pesa").length
  const thisMonthCount = receipts.filter(r => {
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
  const tabs = [
    { key: "all", label: "All Receipts" },
    { key: "issued", label: "Issued" },
    { key: "refunded", label: "Refunded" },
    { key: "voided", label: "Voided" },
  ]

  // Filtered List
  const filteredReceipts = receipts.filter(r => {
    // Tab filter
    if (activeTab !== "all" && r.status !== activeTab) {
      return false
    }
    // Method filter
    if (methodFilter !== "all" && r.payment_method !== methodFilter) {
      return false
    }
    // Search query
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-green-600 text-white border-green-600 font-black shadow-xs"
      case "refunded":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black"
      case "voided":
        return "bg-brand-red/20 text-brand-red border-brand-red/30 font-black"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 font-bold"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Official <span className="gradient-text">Receipts</span>
          </h1>
          <p className="text-gray-600">Issue and track official payment vouchers</p>
        </div>
        <AdminLoading message="Loading official receipts..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
            Official <span className="gradient-text">Receipts</span>
          </h1>
          <p className="text-gray-600">Issue and track official payment vouchers</p>
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
              Official <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Receipts</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Issue and track official payment vouchers with scannable QR authentication seals
            </p>
          </div>
        </div>
      </div>

      {/* 1. Stats Cards Row - Analytics Style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Receipts", value: formatStatNumber(totalReceipts), icon: Receipt },
          { title: "Settled / Issued", value: formatStatNumber(issuedCount), icon: CheckCircle },
          { title: "This Month", value: formatStatNumber(thisMonthCount), icon: Calendar },
          { title: "M-Pesa Settlements", value: formatStatNumber(mpesaCount), icon: CreditCard },
          { 
            title: "Total Collected", 
            value: formatStatCurrency(totalAmount), 
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
                  {receipts.filter(r => r.status === tab.key).length}
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
              placeholder="Search by receipt #, payer name, or transaction code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 rounded-xl border border-teal focus:border-teal focus:ring-1 focus:ring-teal",
                isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400" : "bg-white text-navy"
              )}
            />
          </div>
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className={cn(
            "w-full sm:w-[180px] rounded-xl border",
            isDark ? "bg-[#080d2a] border-teal/25 text-white" : "bg-white border-teal/25 text-navy"
          )}>
            <SelectValue placeholder="All Methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {PAYMENT_METHODS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4. Action Row */}
      <div className="flex items-center justify-end gap-2">
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
          Create Receipt
        </Button>
      </div>

      {/* 5. Receipts Records Table */}
      {filteredReceipts.length === 0 ? (
        <div className={cn(
          "rounded-2xl sm:rounded-3xl p-12 text-center shadow-lg",
          isDark ? "bg-[#060a22]/90 border-none" : "border-2 bg-white border-navy/20"
        )}>
          <Receipt className="h-12 w-12 text-navy/40 dark:text-teal-400/40 mx-auto mb-3" />
          <p className={cn("font-bold text-base", isDark ? "text-white" : "text-navy")}>No payment receipts found</p>
          <p className={cn("text-xs sm:text-sm font-medium mt-1", isDark ? "text-teal-400/80" : "text-navy/70")}>
            Click &quot;Create Receipt&quot; to issue a verified payment voucher
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
                  <th className="text-left py-4 px-4 font-black text-white">Receipt #</th>
                  <th className="text-left py-4 px-4 font-black text-white">Client / Payer</th>
                  <th className="text-left py-4 px-4 font-black text-white">Amount (TZS)</th>
                  <th className="text-left py-4 px-4 font-black text-white">Payment Method</th>
                  <th className="text-left py-4 px-4 font-black text-white">Tx Code</th>
                  <th className="text-left py-4 px-4 font-black text-white">Status</th>
                  <th className="text-left py-4 px-4 font-black text-white hidden md:table-cell">Date</th>
                  <th className="text-right py-4 px-4 font-black text-white">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
                {filteredReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "transition-colors duration-150 cursor-pointer group",
                      isDark 
                        ? "hover:bg-teal/30 hover:text-white" 
                        : "hover:bg-teal/50 hover:text-navy"
                    )}
                    onClick={() => {
                      setPreviewReceipt(r)
                      setActivePreviewTemplate(r.template_id || "modern-corporate")
                      setIsPreviewOpen(true)
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20"
                        )}>
                          <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal" />
                        </div>
                        <div className="min-w-0">
                          <span className={cn("font-black text-sm tracking-tight", isDark ? "text-white" : "text-navy")}>
                            #{r.receipt_number}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-navy")}>
                          {r.customer_name || "Unknown Customer"}
                        </p>
                        <p className={cn("text-xs truncate max-w-xs", isDark ? "text-slate-300" : "text-navy/70")}>{r.customer_email}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={cn("font-black text-sm tracking-tight whitespace-nowrap text-emerald-600 dark:text-emerald-400")}>
                        TZS {r.amount_paid.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className={cn(
                        "text-[10px] py-0 font-bold",
                        isDark ? "border-teal/30 text-teal-300 bg-teal/10" : "border-navy/20 text-navy bg-teal-50"
                      )}>
                        {r.payment_method}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className={cn("font-medium", isDark ? "text-slate-300" : "text-navy/80")}>
                        {r.transaction_ref || "-"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={r.status}
                        onValueChange={(val: any) => handleStatusChange(r.id, val)}
                      >
                        <SelectTrigger className={cn(
                          "h-7 w-24 text-[11px] font-black uppercase rounded-lg border",
                          getStatusColor(r.status)
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="issued">Issued</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                          <SelectItem value="voided">Voided</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className={cn("text-xs font-semibold", isDark ? "text-slate-300" : "text-navy/70")}>
                        {r.payment_date
                          ? new Date(r.payment_date).toLocaleDateString()
                          : new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          title="Preview & Print (5 Templates)"
                          onClick={() => {
                            setPreviewReceipt(r)
                            setActivePreviewTemplate(r.template_id || "modern-corporate")
                            setIsPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>

                        <button
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer text-red-500",
                            isDark ? "bg-white/10 hover:bg-red-500 hover:text-white" : "bg-red-50 hover:bg-red-500 hover:text-white"
                          )}
                          title="Delete Receipt"
                          onClick={() => setReceiptToDelete(r)}
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

      {/* CREATE RECEIPT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("max-w-3xl max-h-[90vh] overflow-y-auto", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Receipt className="h-5 w-5 text-teal" />
              Issue Official Payment Receipt
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Generate an authenticated payment voucher with verified transaction reference and QR code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", isDark ? "text-teal-400" : "text-navy")}>
                <LayoutTemplate className="h-3.5 w-3.5 text-teal" />
                Select Receipt Template (5 Options)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {TEMPLATE_OPTIONS.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all space-y-1",
                      selectedTemplate === tpl.id
                        ? isDark ? "ring-2 ring-teal-400 border-teal-400 bg-teal/10" : "ring-2 ring-teal-500 border-teal-500 bg-teal-50"
                        : isDark ? "border-slate-700 bg-white/5 hover:bg-white/10" : "border-navy/20 hover:bg-slate-50"
                    )}
                  >
                    <p className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-navy")}>{tpl.name}</p>
                    <p className={cn("text-[10px] line-clamp-2 leading-tight", isDark ? "text-slate-400" : "text-slate-500")}>{tpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Autofill from Invoices or Users */}
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border", isDark ? "bg-[#060a22] border-slate-700" : "bg-slate-50 border-navy/15")}>
              <div className="space-y-1">
                <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Link to Existing Invoice (Optional)</Label>
                <Select onValueChange={handleSelectInvoice}>
                  <SelectTrigger className={cn("h-8 text-xs rounded-lg", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                    <SelectValue placeholder="Select Invoice..." />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map(inv => (
                      <SelectItem key={inv.id} value={inv.id}>
                        #{inv.invoice_number} — {inv.customer_name} (TZS {Number(inv.total).toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Autofill from Registered User</Label>
                <Select onValueChange={handleSelectUser}>
                  <SelectTrigger className={cn("h-8 text-xs rounded-lg", isDark ? "bg-[#0a1033] border-slate-700 text-white" : "bg-white")}>
                    <SelectValue placeholder="Select User..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(users || []).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {getUserDisplayName(u)} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payer Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Payer / Customer Name *</Label>
                <Input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe / Tech Solutions"
                  className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Payer Email *</Label>
                <Input
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="client@email.com"
                  className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Payer Phone</Label>
                <Input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                />
              </div>
              <div className="space-y-1">
                <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className={cn("h-8 text-xs rounded-lg border border-teal focus:border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                />
              </div>
            </div>

            {/* Financial Specifics */}
            <div className={cn("p-4 rounded-xl border space-y-3", isDark ? "bg-[#060a22] border-emerald-500/30" : "bg-emerald-50/50 border-emerald-200")}>
              <h4 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-emerald-400" : "text-emerald-800")}>
                Settlement Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Amount Paid (TZS) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={amountPaid || ""}
                    onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={cn("h-9 text-sm font-bold font-mono rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                  />
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                    <SelectTrigger className={cn("h-9 text-xs rounded-lg", isDark ? "bg-[#080d2a] border-slate-700 text-white" : "bg-white")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Tx Code / Reference</Label>
                  <Input
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    placeholder="e.g. MP92819283"
                    className={cn("h-9 text-xs font-mono rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className={cn("text-[11px] font-semibold", isDark ? "text-slate-300" : "text-navy")}>Remarks / Payment Purpose</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Full settlement for IT equipment delivery..."
                rows={2}
                className={cn("text-xs resize-none rounded-lg border border-teal", isDark ? "bg-[#080d2a] text-white" : "bg-white")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isCreating}
              onClick={handleCreateReceipt}
              className="bg-teal text-navy hover:bg-teal-400 font-black rounded-xl gap-1.5 shadow-md"
            >
              {isCreating ? "Issuing Receipt..." : "Issue & Save Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PREVIEW & PRINT MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className={cn("max-w-4xl max-h-[92vh] overflow-y-auto", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className={cn("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Printer className="h-4 w-4 text-teal" />
                  Receipt Voucher Viewer — #{previewReceipt?.receipt_number}
                </DialogTitle>
                <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
                  Switch between 5 templates and export high-resolution print or PDF.
                </DialogDescription>
              </div>

              {/* 5 Templates Switcher */}
              <div className={cn("flex items-center gap-1 p-1 rounded-xl border text-xs", isDark ? "bg-[#060a22] border-slate-700" : "bg-slate-100 border-navy/15")}>
                {TEMPLATE_OPTIONS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActivePreviewTemplate(t.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-semibold transition-all text-[11px]",
                      activePreviewTemplate === t.id
                        ? "bg-teal text-navy font-bold shadow-sm"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-navy"
                    )}
                  >
                    {t.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className={cn("py-4 rounded-2xl p-4 overflow-x-auto flex justify-center", isDark ? "bg-[#060a22]" : "bg-slate-100")}>
            {previewReceipt && (
              <ReceiptTemplateRenderer
                receipt={previewReceipt}
                templateId={activePreviewTemplate}
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
              onClick={() => handlePrint()}
              className="bg-teal text-navy hover:bg-teal-400 font-black rounded-xl gap-1.5 shadow-md"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={!!receiptToDelete} onOpenChange={open => !open && setReceiptToDelete(null)}>
        <DialogContent className={cn("max-w-md", isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy")}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500">
              Confirm Delete
            </DialogTitle>
            <DialogDescription className={cn("text-xs", isDark ? "text-slate-300" : "text-navy/70")}>
              Are you sure you want to delete Receipt #{receiptToDelete?.receipt_number}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReceiptToDelete(null)} className={cn("rounded-xl font-bold", isDark ? "border-slate-700 text-white" : "border-navy/20 text-navy")}>
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
