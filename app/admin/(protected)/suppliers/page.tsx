"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getSuppliers, createSupplier } from "@/lib/supplier-actions"
import { Supplier } from "@/lib/erp/types"
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users
} from "lucide-react"

export default function SuppliersPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [country, setCountry] = useState("Tanzania")
  const [tinNumber, setTinNumber] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [notes, setNotes] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getSuppliers()
      setSuppliers(data || [])
    } catch (err: any) {
      toast({ title: "Error Loading Suppliers", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateSupplier = async () => {
    if (!name || !email) {
      toast({ title: "Missing Fields", description: "Supplier name and email are required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const created = await createSupplier({
        name,
        company_name: companyName || undefined,
        email,
        phone: phone || undefined,
        address: address || undefined,
        city,
        country,
        tin_number: tinNumber || undefined,
        vat_number: vatNumber || undefined,
        payment_terms: paymentTerms,
        opening_balance: openingBalance,
        current_balance: openingBalance,
        status: "active",
        notes: notes || undefined
      })

      toast({ title: "Supplier Registered", description: `Added ${created.name} (${created.supplier_code}).` })
      setSuppliers([created, ...suppliers])
      setIsCreateOpen(false)
      setName("")
      setCompanyName("")
      setEmail("")
      setPhone("")
      setAddress("")
      setTinNumber("")
      setVatNumber("")
      setOpeningBalance(0)
      setNotes("")
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const totalPayableBalance = suppliers.reduce((acc, s) => acc + (Number(s.current_balance) || 0), 0)
  const totalPurchasesVolume = suppliers.reduce((acc, s) => acc + (Number(s.total_purchases_amount) || 0), 0)

  const formatStatCurrency = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const millions = n / 1_000_000
      const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
      return `TSH ${formatted}M`
    }
    if (n >= 1_000) {
      const thousands = n / 1_000
      const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
      return `TSH ${formatted}K`
    }
    return `TSH ${n.toLocaleString()}`
  }

  const filteredSuppliers = suppliers.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (searchQuery) {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.supplier_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.company_name && s.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    return true
  })

  if (isLoading) return <AdminLoading />

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header Card in Teal */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              Supplier <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Directory</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Manage procurement partners, payables balances, payment terms, and vendor performance
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add New Vendor
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Total Active Vendors",
            value: suppliers.length.toString(),
            icon: Building2,
          },
          {
            title: "Accounts Payable",
            value: formatStatCurrency(totalPayableBalance),
            icon: CreditCard,
          },
          {
            title: "Procurement Volume",
            value: formatStatCurrency(totalPurchasesVolume),
            icon: TrendingUp,
          },
          {
            title: "Active Orders",
            value: suppliers.reduce((acc, s) => acc + (s.total_orders_count || 0), 0).toString(),
            icon: Users,
          }
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
              )}
            >
              <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <Icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-teal-400/80" />
          <Input
            placeholder="Search by vendor name, code, company, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(
              "pl-9 h-10 rounded-xl text-xs sm:text-sm font-medium border-2 border-navy/20 focus:border-navy",
              isDark ? "bg-[#080d2a] text-white placeholder:text-slate-400 border-slate-700" : "bg-white text-navy placeholder:text-navy/50"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "h-10 rounded-xl text-xs font-bold w-36 border-2 border-navy/20",
              isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy"
            )}>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadData} variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl border-2 shrink-0", isDark ? "border-slate-700 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50")}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 4. Suppliers Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl",
        isDark ? "bg-[#0a1033] border-none shadow-lg" : "bg-white border-2 border-navy/20 shadow-md hover:border-navy"
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 text-xs uppercase tracking-wider font-black bg-navy text-white border-navy/30">
                <th className="text-left py-3.5 px-4 md:px-6">Vendor / Supplier</th>
                <th className="text-left py-3.5 px-3 md:px-4">Contact Info</th>
                <th className="text-left py-3.5 px-3 md:px-4">Payment Terms</th>
                <th className="text-left py-3.5 px-3 md:px-4">TIN / VRN</th>
                <th className="text-right py-3.5 px-3 md:px-4">Payable Balance</th>
                <th className="text-center py-3.5 px-4 md:px-6">Status</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-slate-100")}>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-semibold text-navy/60 dark:text-teal-400/80">
                    No supplier records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(s => (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer group",
                      isDark ? "border-teal/10 hover:bg-teal/30 hover:text-white" : "border-navy/10 hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    <td className="py-3.5 md:py-4 px-4 md:px-6">
                      <p className={cn("text-sm font-black", isDark ? "text-white" : "text-navy")}>{s.name}</p>
                      {s.company_name && <p className="text-xs text-slate-400 font-medium">{s.company_name}</p>}
                      <p className={cn("text-[11px] font-mono font-bold mt-0.5", isDark ? "text-teal-400" : "text-navy/70")}>#{s.supplier_code}</p>
                    </td>
                    <td className="py-3.5 md:py-4 px-3 md:px-4 text-xs font-semibold">
                      <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-navy/60 dark:text-teal-400/80" /> {s.email}</p>
                      {s.phone && <p className="flex items-center gap-1.5 text-slate-400 mt-0.5"><Phone className="h-3.5 w-3.5 text-navy/60 dark:text-teal-400/80" /> {s.phone}</p>}
                    </td>
                    <td className="py-3.5 md:py-4 px-3 md:px-4 whitespace-nowrap">
                      <Badge variant="outline" className={cn("font-bold text-xs border", isDark ? "border-teal/40 bg-teal/10 text-teal-300" : "border-navy/20 bg-slate-50 text-navy")}>
                        {s.payment_terms}
                      </Badge>
                    </td>
                    <td className="py-3.5 md:py-4 px-3 md:px-4 font-mono text-xs font-semibold whitespace-nowrap">
                      <p>{s.tin_number ? `TIN: ${s.tin_number}` : "—"}</p>
                      {s.vat_number && <p className="text-[11px] text-slate-400">VRN: {s.vat_number}</p>}
                    </td>
                    <td className="py-3.5 md:py-4 px-3 md:px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                      <span className={Number(s.current_balance) > 0 ? "text-rose-500" : "text-emerald-500"}>
                        TSH {Number(s.current_balance || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 md:py-4 px-4 md:px-6 text-center whitespace-nowrap">
                      <Badge className={cn(
                        "text-[10px] font-bold uppercase",
                        s.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-500/15 text-slate-400 border border-slate-500/30"
                      )}>
                        {s.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. CREATE SUPPLIER MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto border-2",
          isDark ? "bg-[#0a1033] text-white border-teal/20" : "bg-white text-navy border-navy/20 shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-navy dark:text-white">
              <Building2 className="h-5 w-5 text-navy dark:text-teal-400" />
              Register New Vendor / Supplier
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Add verified corporate supplier credentials, payment terms, and tax records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Supplier Trade Name *
                </Label>
                <Input
                  placeholder="e.g. Hikvision East Africa"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Registered Legal Entity
                </Label>
                <Input
                  placeholder="e.g. Hikvision Digital Tech Co."
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Official Email *
                </Label>
                <Input
                  type="email"
                  placeholder="sales@supplier.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Phone Number
                </Label>
                <Input
                  placeholder="+255 7XX XXX XXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  TIN Number
                </Label>
                <Input
                  placeholder="123-456-789"
                  value={tinNumber}
                  onChange={e => setTinNumber(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  VRN / VAT Number
                </Label>
                <Input
                  placeholder="VRN-40019283"
                  value={vatNumber}
                  onChange={e => setVatNumber(e.target.value)}
                  className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                  Payment Terms
                </Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15 Days</SelectItem>
                    <SelectItem value="Net 30">Net 30 Days</SelectItem>
                    <SelectItem value="Net 45">Net 45 Days</SelectItem>
                    <SelectItem value="Net 60">Net 60 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Physical Address
              </Label>
              <Input
                placeholder="Plot / Street / District"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={cn("h-11 rounded-xl text-sm font-medium border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-navy/80 dark:text-teal-400/80">
                Opening Payable Balance (TZS)
              </Label>
              <Input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className={cn("h-11 rounded-xl text-sm font-mono font-bold border-2 border-navy/20", isDark ? "bg-[#080d2a] text-white border-slate-700" : "bg-white text-navy")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="h-11 rounded-xl px-5 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSupplier}
              disabled={isSaving}
              className="h-11 rounded-xl px-6 bg-navy hover:bg-navy/90 text-white font-bold transition-all shadow-md active:scale-95"
            >
              {isSaving ? "Saving..." : "Register Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
