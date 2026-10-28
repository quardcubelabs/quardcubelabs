"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { getCustomerAccounts, createCustomerAccount } from "@/lib/crm-actions"
import { CustomerAccount } from "@/lib/erp/crm-types"
import {
  Users,
  Building2,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  CreditCard,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Receipt,
  Eye,
  Layers,
  ShieldCheck,
  CheckCircle
} from "lucide-react"

export default function CustomerAccountsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // View Customer Modal
  const [selectedViewCustomer, setSelectedViewCustomer] = useState<CustomerAccount | null>(null)

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [region, setRegion] = useState("Dar es Salaam")
  const [tinNumber, setTinNumber] = useState("")
  const [vatNumber, setVatNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("Net 30")
  const [category, setCategory] = useState<CustomerAccount["category"]>("Corporate Enterprise")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getCustomerAccounts()
      setCustomers(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load customer profiles.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactPerson || !email || !phone) {
      toast({
        title: "Missing Fields",
        description: "Please specify contact person, email, and phone.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const code = `CUST-${(companyName || contactPerson).slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      await createCustomerAccount({
        customer_code: code,
        company_name: companyName,
        contact_person: contactPerson,
        email,
        phone,
        address,
        city,
        region,
        tin_number: tinNumber,
        vat_number: vatNumber,
        total_spend: 0,
        total_orders_count: 0,
        total_invoices_count: 0,
        outstanding_receivables: 0,
        payment_terms: paymentTerms,
        category,
        status: "active"
      })
      toast({
        title: "Customer Profile Created",
        description: "New client record added to Customer 360 database."
      })
      setIsCreateOpen(false)
      setCompanyName("")
      setContactPerson("")
      setEmail("")
      setPhone("")
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Could not create customer profile.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)

    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Customer 360 Metrics
  const totalClients = customers.length
  const totalLTV = customers.reduce((sum, c) => sum + c.total_spend, 0)
  const totalAR = customers.reduce((sum, c) => sum + c.outstanding_receivables, 0)
  const corporateCount = customers.filter(c => c.category === "Corporate Enterprise").length

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <AdminLoading />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={cn(
          "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6 transition-all duration-300",
          isDark
            ? "bg-[#0a1033] border-none text-white shadow-none"
            : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <Users className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Customer 360 &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Accounts
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Corporate client directory, billing histories, TRA TIN/VAT tax records, and account receivables
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 w-full sm:w-auto">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 font-bold text-xs sm:text-sm border shadow-sm transition-all active:scale-95 flex-1 sm:flex-none justify-center",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-8 sm:h-11 text-xs sm:text-sm px-3 sm:px-5 gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 flex-1 sm:flex-none justify-center shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Customer Profile</span>
              <span className="sm:hidden">Add Customer</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Client Accounts", value: totalClients.toString(), icon: Users, color: "text-blue-500", sub: "Enterprise & SME accounts" },
          { title: "Cumulative Lifetime Spend", value: `TZS ${(totalLTV / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-emerald-500", sub: "Settled client invoices" },
          { title: "Outstanding Receivables (AR)", value: `TZS ${(totalAR / 1000000).toFixed(1)}M`, icon: Clock, color: "text-amber-500", sub: "Open trade receivables" },
          { title: "Enterprise Corporates", value: corporateCount.toString(), icon: Building2, color: "text-teal-500", sub: "Contract retainers" }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden",
              isDark
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-3 sm:p-4.5 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-xs sm:text-sm lg:text-base font-black truncate block font-mono leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
                <p className={cn("text-[10px] font-medium mt-0.5 sm:mt-1 truncate opacity-70", isDark ? "text-slate-300" : "text-navy/60")}>
                  {stat.sub}
                </p>
              </div>
              <div
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}
              >
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search */}
      <Card
        className={cn(
          "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Category Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Clients", icon: Layers, count: customers.length },
            { key: "Corporate Enterprise", label: "Corporate Enterprise", icon: Building2, count: customers.filter(c => c.category === "Corporate Enterprise").length },
            { key: "Government / Parastatal", label: "Government / Parastatal", icon: ShieldCheck, count: customers.filter(c => c.category === "Government / Parastatal").length },
            { key: "SME", label: "SME", icon: Briefcase, count: customers.filter(c => c.category === "SME").length },
            { key: "Retail Client", label: "Retail Client", icon: Users, count: customers.filter(c => c.category === "Retail Client").length }
          ].map((tab) => {
            const isSelected = categoryFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                onClick={() => setCategoryFilter(tab.key)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-navy text-white shadow-md"
                    : isDark 
                      ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                      : "text-navy/70 hover:bg-teal-50 hover:text-navy"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-white" : isDark ? "text-slate-400" : "text-navy/60")} />
                <span>{tab.label}</span>
                <span className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  isSelected 
                    ? "bg-white/20 text-white"
                    : isDark ? "bg-slate-800 text-slate-300" : "bg-navy/10 text-navy"
                )}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search customer by name, company, email, phone, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500 focus-visible:ring-teal/30"
                  : "bg-white border-navy/20 text-navy placeholder:text-navy/40 focus-visible:ring-navy/20"
              )}
            />
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Customer Account</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden sm:table-cell">Classification</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden md:table-cell">Contact Info</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden lg:table-cell">Tax ID</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Total Spend</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Outstanding (AR)</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15 text-xs sm:text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No customer records match your query</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your search query or filters</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className={cn(
                      "transition-colors duration-150",
                      isDark
                        ? "hover:bg-teal/30 hover:text-white"
                        : "hover:bg-teal/50 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={cn(
                          "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                          isDark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40"
                        )}>
                          <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={cn("font-bold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs", isDark ? "text-white" : "text-navy")} title={cust.company_name || cust.contact_person}>
                            {cust.company_name || cust.contact_person}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn("font-mono font-bold text-[10px] sm:text-[11px]", isDark ? "text-teal-400" : "text-navy/70")}>
                              {cust.customer_code}
                            </span>
                            {cust.company_name && cust.contact_person && (
                              <span className="hidden sm:inline text-[10px] text-slate-400 truncate max-w-[100px]">
                                • {cust.contact_person}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden sm:table-cell whitespace-nowrap">
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border",
                        isDark ? "bg-teal/15 text-teal border-teal/30" : "bg-navy/5 border-navy/15 text-navy"
                      )}>
                        {cust.category}
                      </span>
                      <p className="text-[11px] opacity-70 mt-0.5 font-semibold">Terms: {cust.payment_terms}</p>
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden md:table-cell text-xs">
                      <span className={cn("font-medium truncate max-w-[170px] block", isDark ? "text-slate-300" : "text-navy")} title={`${cust.email} • ${cust.phone}`}>
                        {cust.email || cust.phone}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">{cust.city || cust.region || "Tanzania"}</span>
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-mono text-xs hidden lg:table-cell whitespace-nowrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg border font-mono font-bold text-[10px] sm:text-[11px] inline-block",
                        isDark ? "bg-white/10 border-white/20 text-white" : "bg-navy/5 border-navy/10 text-navy"
                      )}>
                        {cust.tin_number ? `TIN: ${cust.tin_number}` : "Unregistered"}
                      </span>
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-mono font-black text-right text-emerald-500 whitespace-nowrap">
                      TZS {cust.total_spend.toLocaleString()}
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-mono font-black text-right text-amber-500 whitespace-nowrap">
                      TZS {cust.outstanding_receivables.toLocaleString()}
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <button
                          onClick={() => setSelectedViewCustomer(cust)}
                          className={cn(
                            "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                          )}
                          title="View Customer Profile"
                        >
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => router.push("/admin/invoices")}
                          className={cn(
                            "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          )}
                          title="View Invoices"
                        >
                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Customer Details Modal */}
      <Dialog open={!!selectedViewCustomer} onOpenChange={(open) => !open && setSelectedViewCustomer(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedViewCustomer && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedViewCustomer.customer_code}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {selectedViewCustomer.company_name || selectedViewCustomer.contact_person}
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Attn: <span className="font-bold">{selectedViewCustomer.contact_person}</span> • Classification: <span className="font-bold">{selectedViewCustomer.category}</span>
                    </p>
                  </div>
                </div>

                <Badge className="font-bold text-xs uppercase px-3 py-1 rounded-lg bg-teal text-navy">
                  Active Account
                </Badge>
              </div>

              {/* Financial Balance Summary */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Total Lifetime Revenue (LTV)</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl text-emerald-400 mt-0.5">
                    TZS {selectedViewCustomer.total_spend.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Current Outstanding Receivables</span>
                  <div className="font-mono font-black text-xl sm:text-2xl text-amber-500 mt-0.5">
                    TZS {selectedViewCustomer.outstanding_receivables.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Contact and Tax Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-2xl border space-y-2.5", isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy")}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <Phone className="h-4 w-4 text-teal" />
                    Contact &amp; Location
                  </h3>
                  <div className="space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="opacity-70">Email:</span>
                      <span className="font-bold">{selectedViewCustomer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Phone:</span>
                      <span className="font-bold">{selectedViewCustomer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">City / Region:</span>
                      <span className="font-bold">{selectedViewCustomer.city}, {selectedViewCustomer.region}</span>
                    </div>
                    {selectedViewCustomer.address && (
                      <div className="flex justify-between">
                        <span className="opacity-70">Address:</span>
                        <span className="font-bold">{selectedViewCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn("p-4 rounded-2xl border space-y-2.5", isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy")}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <Receipt className="h-4 w-4 text-teal" />
                    Tax &amp; Payment Terms
                  </h3>
                  <div className="space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="opacity-70">Payment Terms:</span>
                      <span className="font-bold">{selectedViewCustomer.payment_terms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">TRA TIN:</span>
                      <span className="font-mono font-bold">{selectedViewCustomer.tin_number || "Unregistered"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">TRA VAT:</span>
                      <span className="font-mono font-bold">{selectedViewCustomer.vat_number || "Not Applicable"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedViewCustomer(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
                <Button
                  onClick={() => router.push("/admin/invoices")}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                >
                  <FileText className="w-4 h-4 text-teal" />
                  View Account Invoices
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-xl",
          isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Register Commercial Customer
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Create a unified Customer 360 profile linked across Invoicing, Quotations, and CRM.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Company / Organization</Label>
                <Input
                  placeholder="e.g. Serengeti Freight Logistics Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Primary Contact Person *</Label>
                <Input
                  required
                  placeholder="e.g. Baraka Massawe"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="contact@company.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Phone Number *</Label>
                <Input
                  required
                  placeholder="+255 7..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">TIN Number (TRA)</Label>
                <Input
                  placeholder="100-221-998"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">VAT Number</Label>
                <Input
                  placeholder="40-001928-V"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as CustomerAccount["category"])}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                    <SelectItem value="Corporate Enterprise">Corporate Enterprise</SelectItem>
                    <SelectItem value="Government / Parastatal">Government / Parastatal</SelectItem>
                    <SelectItem value="SME">SME</SelectItem>
                    <SelectItem value="Retail Client">Retail Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">City / Region</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Physical Address / Office Location</Label>
              <Input
                placeholder="Plot number, street, commercial building..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-navy/10 dark:border-teal/20 flex flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
              >
                {isSubmitting ? "Saving..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
