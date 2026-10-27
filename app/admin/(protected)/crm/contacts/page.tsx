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
  Receipt
} from "lucide-react"

export default function CustomerAccountsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredCustomers = customers.filter(c =>
    c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.customer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  )

  const totalSpendAll = customers.reduce((s, c) => s + (c.total_spend || 0), 0)
  const totalReceivables = customers.reduce((s, c) => s + (c.outstanding_receivables || 0), 0)

  if (isLoading && customers.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className={cn(
        "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <Building2 className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black mb-0.5 sm:mb-1 truncate">
                Customer <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>360 & Accounts</span>
              </h1>
              <p className={cn("text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300/80" : "text-navy/90")}>
                Unified commercial directory, receivables tracking, and transaction history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 text-xs sm:text-sm font-bold border shadow-sm transition-all active:scale-95",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className={cn(
                "font-bold rounded-xl h-8 sm:h-11 px-3 sm:px-5 text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        <Card
          className={cn(
            "rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate", isDark ? "text-slate-400" : "text-navy/60")}>Total Accounts</p>
              <p className={cn("text-base sm:text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>{customers.length}</p>
            </div>
            <div
              className={cn(
                "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate", isDark ? "text-slate-400" : "text-navy/60")}>Cumulative Spend</p>
              <p className="text-base sm:text-2xl font-black font-mono text-emerald-500 truncate">
                TZS {(totalSpendAll / 1000000).toFixed(1)}M
              </p>
            </div>
            <div
              className={cn(
                "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"
                  : "bg-emerald-100/80 border-emerald-400/30 text-emerald-600"
              )}
            >
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate", isDark ? "text-slate-400" : "text-navy/60")}>Open Receivables</p>
              <p className="text-base sm:text-2xl font-black font-mono text-amber-500 truncate">
                TZS {(totalReceivables / 1000000).toFixed(1)}M
              </p>
            </div>
            <div
              className={cn(
                "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                  : "bg-amber-100/80 border-amber-400/30 text-amber-600"
              )}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-2.5 sm:p-5 flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate", isDark ? "text-slate-400" : "text-navy/60")}>Corporate Accounts</p>
              <p className={cn("text-base sm:text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>
                {customers.filter(c => c.category.includes("Corporate") || c.category.includes("Government")).length}
              </p>
            </div>
            <div
              className={cn(
                "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card
        className={cn(
          "rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-6 transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        <div className="relative w-full">
          <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-400" : "text-navy/40")} />
          <Input
            placeholder="Search by company name, contact person, customer code, TIN, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
              isDark
                ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500 focus:border-teal"
                : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40 focus:border-navy focus:bg-white"
            )}
          />
        </div>
      </Card>

      {/* Customers Table */}
      <Card
        className={cn(
          "rounded-2xl overflow-hidden transition-all duration-300",
          isDark
            ? "bg-[#080d2a]/80 border-none shadow-lg"
            : "border-2 bg-white border-navy/20 shadow-sm"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-navy/30 bg-navy text-white text-[11px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Customer Account</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Classification</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Contact Info</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Fiscal Tax ID</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right font-mono">Total Spend</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right font-mono">Outstanding (AR)</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-xs sm:text-sm">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className={cn(
                    "transition-colors",
                    isDark
                      ? "border-b border-navy/20 hover:bg-teal/20 hover:text-white"
                      : "border-b border-navy/10 hover:bg-teal/40 hover:text-navy"
                  )}
                >
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                    <p className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                      {cust.company_name || cust.contact_person}
                    </p>
                    <p className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold">{cust.customer_code}</p>
                    {cust.company_name && cust.contact_person && (
                      <p className="text-xs text-gray-400">Attn: {cust.contact_person}</p>
                    )}
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border",
                      isDark ? "bg-teal/15 text-teal-300 border-teal/30" : "bg-navy/10 text-navy border-navy/20"
                    )}>
                      {cust.category}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1">Terms: {cust.payment_terms}</p>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-xs space-y-0.5 text-gray-400">
                    <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-teal-600 dark:text-teal-400" />{cust.email}</p>
                    <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-teal-600 dark:text-teal-400" />{cust.phone}</p>
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-teal-600 dark:text-teal-400" />{cust.city}, {cust.region}</p>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono text-xs">
                    <p className="font-semibold">TIN: {cust.tin_number || "Unregistered"}</p>
                    <p className="text-gray-400">VAT: {cust.vat_number || "N/A"}</p>
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-black text-right text-emerald-500">
                    TZS {cust.total_spend.toLocaleString()}
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-black text-right text-amber-500">
                    TZS {cust.outstanding_receivables.toLocaleString()}
                  </td>
                  <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/admin/invoices")}
                        className={cn(
                          "h-8 text-xs font-bold rounded-lg border px-2.5 flex items-center gap-1 transition-all active:scale-95",
                          isDark ? "border-teal/30 hover:bg-teal/10 text-teal-300" : "border-navy/20 hover:bg-slate-100 text-navy"
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        Invoices
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              No customer records match your query.
            </div>
          )}
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-2xl border-2 p-6",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Register Commercial Customer</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Create a unified Customer 360 profile linked across Invoicing, Quotations, and CRM.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Company / Organization</Label>
                <Input
                  placeholder="e.g. Serengeti Freight Logistics Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Primary Contact Person *</Label>
                <Input
                  required
                  placeholder="e.g. Baraka Massawe"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="contact@company.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Phone Number *</Label>
                <Input
                  required
                  placeholder="+255 7..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">TIN Number (TRA)</Label>
                <Input
                  placeholder="100-221-998"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">VAT Number</Label>
                <Input
                  placeholder="40-001928-V"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as CustomerAccount["category"])}>
                  <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Corporate Enterprise">Corporate Enterprise</SelectItem>
                    <SelectItem value="Government / Parastatal">Government / Parastatal</SelectItem>
                    <SelectItem value="SME">SME</SelectItem>
                    <SelectItem value="Retail Client">Retail Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">City / Region</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Physical Address / Office Location</Label>
              <Input
                placeholder="Plot number, street, commercial building..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl mt-1 h-10 text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl text-xs px-5"
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
