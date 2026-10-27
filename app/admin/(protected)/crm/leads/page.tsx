"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getLeads, createLead, updateLeadStatus, deleteLead, createDeal } from "@/lib/crm-actions"
import { CrmLead, LeadSource, LeadStatus } from "@/lib/erp/crm-types"
import {
  Target,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Building2,
  TrendingUp,
  DollarSign,
  UserCheck,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  XCircle,
  Eye
} from "lucide-react"

const SOURCES: LeadSource[] = [
  "CCTV Survey Request",
  "Website Form",
  "WhatsApp Chat",
  "Corporate Tender",
  "Referral",
  "Direct Cold Call",
  "Social Media",
  "Exhibition",
  "Other"
]

export default function LeadsManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [leads, setLeads] = useState<CrmLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [region, setRegion] = useState("Dar es Salaam")
  const [source, setSource] = useState<LeadSource>("Website Form")
  const [estimatedValue, setEstimatedValue] = useState<number>(0)
  const [assignedToName, setAssignedToName] = useState("Framani Mwamba")
  const [notes, setNotes] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getLeads()
      setLeads(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load CRM leads.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !email || !phone) {
      toast({
        title: "Required Fields",
        description: "Please provide lead name, email, and contact phone.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createLead({
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        email,
        phone,
        city,
        region,
        source,
        status: "new",
        estimated_value: Number(estimatedValue) || 0,
        assigned_to_name: assignedToName,
        notes
      })
      toast({
        title: "Lead Created",
        description: "New prospective sales lead registered successfully."
      })
      setIsCreateOpen(false)
      // Reset form
      setFirstName("")
      setLastName("")
      setCompanyName("")
      setEmail("")
      setPhone("")
      setEstimatedValue(0)
      setNotes("")
      loadData()
    } catch {
      toast({
        title: "Submission Failed",
        description: "Could not create lead record.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus)
      toast({
        title: "Status Updated",
        description: `Lead status changed to "${newStatus}".`
      })
      loadData()
    } catch {
      toast({
        title: "Update Failed",
        description: "Could not update lead status.",
        variant: "destructive"
      })
    }
  }

  const handleConvertToDeal = async (lead: CrmLead) => {
    try {
      await createDeal({
        title: `${lead.company_name || `${lead.first_name} ${lead.last_name}`} — Commercial Hardware & Solutions`,
        customer_name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
        customer_email: lead.email,
        customer_phone: lead.phone,
        stage: "qualification",
        amount: lead.estimated_value || 5000000,
        probability: 50,
        expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        assigned_to_name: lead.assigned_to_name || "Framani Mwamba",
        notes: `Converted from Lead ${lead.lead_number}. Source: ${lead.source}. Notes: ${lead.notes || 'None'}`
      })
      await updateLeadStatus(lead.id, "converted")
      toast({
        title: "Converted to Deal!",
        description: "Lead successfully converted to an active sales pipeline deal."
      })
      loadData()
      router.push("/admin/crm/deals")
    } catch {
      toast({
        title: "Conversion Failed",
        description: "Could not convert lead into deal.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return
    try {
      await deleteLead(leadId)
      toast({
        title: "Lead Removed",
        description: "Lead record deleted."
      })
      loadData()
    } catch {
      toast({
        title: "Delete Failed",
        description: "Could not delete lead record.",
        variant: "destructive"
      })
    }
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company_name && l.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.lead_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery)

    const matchesStatus = statusFilter === "all" || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Telemetry metrics
  const totalValue = leads.reduce((sum, l) => sum + (l.estimated_value || 0), 0)
  const qualifiedCount = leads.filter(l => l.status === "qualified").length
  const convertedCount = leads.filter(l => l.status === "converted").length

  if (isLoading && leads.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <Target className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1">
                Leads <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>Management</span>
              </h1>
              <p className={cn("text-xs sm:text-sm font-semibold", isDark ? "text-teal-300/80" : "text-navy/90")}>
                Capture, qualify, and convert commercial sales opportunities (Zoho CRM Engine)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 sm:h-11 px-3 sm:px-4 font-bold border shadow-sm transition-all active:scale-95",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className={cn(
                "font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-4 h-4" />
              Add New Lead
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Total Leads</p>
              <p className={cn("text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>{leads.length}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Qualified Leads</p>
              <p className="text-2xl font-black font-mono text-emerald-500">{qualifiedCount}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"
                  : "bg-emerald-100/80 border-emerald-400/30 text-emerald-600"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Converted to Deals</p>
              <p className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">{convertedCount}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Pipeline Potential</p>
              <p className={cn("text-xl sm:text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>
                TZS {(totalValue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card
        className={cn(
          "rounded-2xl p-4 mb-6 transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-400" : "text-navy/40")} />
            <Input
              placeholder="Search leads by name, company, email, phone, or code..."
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
          <div className="w-full sm:w-56 shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className={cn(
                  "w-full h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                  isDark
                    ? "bg-slate-900/60 border-teal/20 text-white"
                    : "bg-slate-50 border-navy/20 text-navy"
                )}
              >
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
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
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Lead # / Source</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Contact / Company</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Estimated Value</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Assigned Rep</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-left">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black text-white uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 text-xs sm:text-sm">
              {filteredLeads.map((lead) => {
                const statusStyles: Record<LeadStatus, string> = {
                  new: "bg-blue-500/15 text-blue-500 border-blue-500/30",
                  contacted: "bg-amber-500/15 text-amber-500 border-amber-500/30",
                  qualified: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
                  converted: "bg-teal-500/20 text-teal-600 dark:text-teal-300 border-teal-500/40",
                  unqualified: "bg-rose-500/15 text-rose-500 border-rose-500/30"
                }

                return (
                  <tr 
                    key={lead.id} 
                    className={cn(
                      "transition-colors",
                      isDark
                        ? "border-b border-navy/20 hover:bg-teal/20 hover:text-white"
                        : "border-b border-navy/10 hover:bg-teal/40 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <p className="font-mono font-bold text-xs text-teal-600 dark:text-teal-400">{lead.lead_number}</p>
                      <span className={cn(
                        "inline-block px-2 py-0.5 mt-1 text-[10px] font-semibold rounded-full border",
                        isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-gray-100 border-gray-200 text-gray-700"
                      )}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <p className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                        {lead.first_name} {lead.last_name}
                      </p>
                      {lead.company_name && (
                        <p className={cn("text-xs flex items-center gap-1", isDark ? "text-slate-400" : "text-gray-600")}>
                          <Building2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          {lead.company_name}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-bold">
                      TZS {(lead.estimated_value || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-xs">
                      {lead.assigned_to_name || "Unassigned"}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                      <Select 
                        value={lead.status} 
                        onValueChange={(val) => handleStatusChange(lead.id, val as LeadStatus)}
                      >
                        <SelectTrigger className={cn("h-8 text-xs font-bold rounded-lg border uppercase tracking-wider", statusStyles[lead.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="unqualified">Unqualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.status !== "converted" && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToDeal(lead)}
                            className="bg-navy hover:bg-navy/90 text-white font-bold text-xs h-8 px-2.5 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="Convert to Sales Deal"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Convert
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(lead.id)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              No leads match your search criteria.
            </div>
          )}
        </div>
      </Card>

      {/* Add Lead Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-2xl rounded-2xl border-2 p-6",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Register New CRM Lead</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Capture prospective commercial client inquiries for tracking and qualification.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">First Name *</Label>
                <Input
                  required
                  placeholder="e.g. Baraka"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Last Name</Label>
                <Input
                  placeholder="e.g. Massawe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

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
                <Label className="text-xs font-bold">Lead Source *</Label>
                <Select value={source} onValueChange={(val) => setSource(val as LeadSource)}>
                  <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="lead@company.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Phone / WhatsApp *</Label>
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
                <Label className="text-xs font-bold">Estimated Deal Value (TZS)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 15000000"
                  value={estimatedValue || ""}
                  onChange={(e) => setEstimatedValue(Number(e.target.value))}
                  className="rounded-xl mt-1 h-10 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Assigned Sales Specialist</Label>
                <Input
                  placeholder="e.g. Framani Mwamba"
                  value={assignedToName}
                  onChange={(e) => setAssignedToName(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Inquiry Details & Technical Requirements</Label>
              <Textarea
                rows={3}
                placeholder="Camera count, site dimensions, requested IT specs, or tender submission deadlines..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl mt-1 text-sm"
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
                {isSubmitting ? "Saving..." : "Save Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
