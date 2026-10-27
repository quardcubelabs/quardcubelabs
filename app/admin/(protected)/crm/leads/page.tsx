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
  Eye,
  Layers,
  CheckCircle,
  FileText
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

  // View Modal State
  const [selectedViewLead, setSelectedViewLead] = useState<CrmLead | null>(null)

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
        title: "Error",
        description: "Failed to register lead.",
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
        description: `Lead progression moved to ${newStatus}.`
      })
      loadData()
    } catch {
      toast({
        title: "Update Error",
        description: "Failed to update lead status.",
        variant: "destructive"
      })
    }
  }

  const handleConvertToDeal = async (lead: CrmLead) => {
    try {
      await createDeal({
        title: `${lead.company_name || lead.first_name} — Commercial CCTV & IT Solution`,
        customer_name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
        customer_email: lead.email || "lead@company.co.tz",
        customer_phone: lead.phone,
        stage: "proposal_quote",
        amount: lead.estimated_value || 10000000,
        probability: 60,
        expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        lead_id: lead.id,
        assigned_to_name: lead.assigned_to_name,
        notes: `Converted from lead ${lead.lead_number}. Initial requirements: ${lead.notes || "None"}`
      })
      await updateLeadStatus(lead.id, "converted")
      toast({
        title: "Deal Created",
        description: `Lead ${lead.lead_number} successfully converted to an active Sales Deal.`
      })
      loadData()
      router.push("/admin/crm/deals")
    } catch {
      toast({
        title: "Conversion Error",
        description: "Failed to convert lead to deal.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to remove this sales lead?")) return
    try {
      await deleteLead(leadId)
      toast({
        title: "Lead Removed",
        description: "Prospect record deleted from CRM database."
      })
      loadData()
    } catch {
      toast({
        title: "Delete Error",
        description: "Could not remove lead.",
        variant: "destructive"
      })
    }
  }

  const filteredLeads = leads.filter((l) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      l.lead_number.toLowerCase().includes(q) ||
      l.first_name.toLowerCase().includes(q) ||
      l.last_name.toLowerCase().includes(q) ||
      (l.company_name && l.company_name.toLowerCase().includes(q)) ||
      l.email.toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q)

    const matchesStatus = statusFilter === "all" || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // KPI Calculations
  const totalLeads = leads.length
  const newLeadsCount = leads.filter(l => l.status === "new").length
  const qualifiedCount = leads.filter(l => l.status === "qualified").length
  const convertedCount = leads.filter(l => l.status === "converted").length
  const totalValue = leads.reduce((s, l) => s + (l.estimated_value || 0), 0)

  if (isLoading && leads.length === 0) {
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
              <Target className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 truncate">
                Sales Leads &amp;{" "}
                <span
                  className={cn(
                    isDark ? "text-teal-400" : "text-white",
                    "drop-shadow-sm"
                  )}
                >
                  Prospects
                </span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300" : "text-navy/90"
                )}
              >
                Inbound inquiries, WhatsApp chats, survey requests, and client pipeline qualification
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
              <span className="hidden sm:inline">Add Sales Lead</span>
              <span className="sm:hidden">Add Lead</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        {[
          { title: "Total Inbound Leads", value: totalLeads.toString(), icon: Target, color: "text-blue-500", sub: `${newLeadsCount} awaiting contact` },
          { title: "Qualified Prospects", value: qualifiedCount.toString(), icon: UserCheck, color: "text-emerald-500", sub: "Ready for formal quotes" },
          { title: "Converted to Deals", value: convertedCount.toString(), icon: SlidersHorizontal, color: "text-teal-500", sub: "Active sales opportunities" },
          { title: "Pipeline Potential", value: `TZS ${(totalValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: "text-amber-500", sub: "Total estimated value" }
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

      {/* Search & Filter Bar */}
      <Card
        className={cn(
          "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All Leads", icon: Layers, count: leads.length },
            { key: "new", label: "New", icon: Clock, count: leads.filter(l => l.status === "new").length },
            { key: "contacted", label: "Contacted", icon: Phone, count: leads.filter(l => l.status === "contacted").length },
            { key: "qualified", label: "Qualified", icon: UserCheck, count: leads.filter(l => l.status === "qualified").length },
            { key: "converted", label: "Converted", icon: CheckCircle, count: leads.filter(l => l.status === "converted").length },
            { key: "unqualified", label: "Unqualified", icon: XCircle, count: leads.filter(l => l.status === "unqualified").length }
          ].map((tab) => {
            const isSelected = statusFilter === tab.key
            const Icon = tab.icon

            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
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
              placeholder="Search leads by name, company, email, phone, or code..."
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
              <tr className="border-b border-navy/30 bg-navy text-white text-[10px] sm:text-xs">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left">Lead # / Source</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left">Contact / Company</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left hidden sm:table-cell">Estimated Value</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left hidden md:table-cell">Assigned Rep</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-left">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-black uppercase tracking-wider text-right">Actions</th>
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
                      "transition-colors duration-150",
                      isDark
                        ? "hover:bg-teal/20 hover:text-white"
                        : "hover:bg-teal/40 hover:text-navy"
                    )}
                  >
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4">
                      <p className="font-mono font-bold text-xs text-teal">{lead.lead_number}</p>
                      <span className={cn(
                        "inline-block px-2 py-0.5 mt-1 text-[10px] font-semibold rounded-full border",
                        isDark ? "bg-white/5 border-white/10 text-slate-300" : "bg-gray-100 border-gray-200 text-gray-700"
                      )}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4">
                      <p className={cn("font-bold", isDark ? "text-white" : "text-navy")}>
                        {lead.first_name} {lead.last_name}
                      </p>
                      {lead.company_name && (
                        <p className={cn("text-xs flex items-center gap-1 font-semibold", isDark ? "text-slate-400" : "text-gray-600")}>
                          <Building2 className="w-3 h-3 text-teal" />
                          {lead.company_name}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs opacity-70">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-teal" />{lead.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-teal" />{lead.phone}</span>
                      </div>
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-mono font-bold hidden sm:table-cell">
                      TZS {(lead.estimated_value || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-medium text-xs hidden md:table-cell">
                      {lead.assigned_to_name || "Unassigned"}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4">
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
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedViewLead(lead)}
                          className={cn(
                            "h-8 px-2.5 text-xs font-bold rounded-xl border shadow-xs transition-all active:scale-95",
                            isDark ? "border-teal/30 hover:bg-teal/20 text-white" : "border-navy/20 hover:bg-teal-50 text-navy"
                          )}
                          title="View Lead Details"
                        >
                          <Eye className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Details</span>
                        </Button>
                        {lead.status !== "converted" && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertToDeal(lead)}
                            className="bg-navy hover:bg-navy/90 text-white font-bold text-xs h-8 px-2.5 rounded-xl flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="Convert to Sales Deal"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-teal" />
                            <span className="hidden sm:inline">Convert</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(lead.id)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0 rounded-xl"
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

      {/* View Lead Details Modal */}
      <Dialog open={!!selectedViewLead} onOpenChange={(open) => !open && setSelectedViewLead(null)}>
        <DialogContent className={cn("max-w-2xl", isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy")}>
          {selectedViewLead && (
            <div className="space-y-6">
              {/* Header Navigation Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy/10 dark:border-teal/20 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner", isDark ? "bg-teal/20 text-teal" : "bg-navy text-white")}>
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-md bg-teal/20 text-teal border border-teal/30">
                        {selectedViewLead.lead_number}
                      </span>
                      <h2 className={cn("text-xl sm:text-2xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {selectedViewLead.first_name} {selectedViewLead.last_name}
                      </h2>
                    </div>
                    <p className={cn("text-xs sm:text-sm font-medium mt-0.5", isDark ? "text-slate-300" : "text-navy/70")}>
                      Company: <span className="font-bold">{selectedViewLead.company_name || "Private Client"}</span> • Source: <span className="font-bold">{selectedViewLead.source}</span>
                    </p>
                  </div>
                </div>

                <Badge className="font-bold text-xs uppercase px-3 py-1 rounded-lg bg-teal text-navy">
                  {selectedViewLead.status}
                </Badge>
              </div>

              {/* Value & Pipeline Summary */}
              <div className={cn(
                "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3",
                isDark ? "bg-teal/15 border-teal/40 text-white" : "bg-teal/15 border-2 border-navy text-navy"
              )}>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Estimated Potential Value</span>
                  <div className="font-mono font-black text-2xl sm:text-3xl tracking-tight mt-0.5">
                    TZS {(selectedViewLead.estimated_value || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-wider opacity-70 block">Assigned Representative</span>
                  <div className="font-bold text-sm sm:text-base mt-0.5 text-teal">
                    {selectedViewLead.assigned_to_name || "Unassigned"}
                  </div>
                </div>
              </div>

              {/* Contact Information & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn("p-4 rounded-2xl border space-y-2.5", isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy")}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <Phone className="h-4 w-4 text-teal" />
                    Direct Contact Channels
                  </h3>
                  <div className="space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="opacity-70">Email:</span>
                      <span className="font-bold">{selectedViewLead.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Phone:</span>
                      <span className="font-bold">{selectedViewLead.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Location:</span>
                      <span className="font-bold">{selectedViewLead.city || "Dar es Salaam"}, {selectedViewLead.region || "Tanzania"}</span>
                    </div>
                  </div>
                </div>

                <div className={cn("p-4 rounded-2xl border space-y-2.5", isDark ? "bg-teal/10 border-teal/30 text-white" : "bg-slate-50 border-2 border-navy/20 text-navy")}>
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-navy/10 dark:border-teal/20 pb-2">
                    <FileText className="h-4 w-4 text-teal" />
                    Technical Scope &amp; Notes
                  </h3>
                  <p className="text-xs leading-relaxed opacity-90">
                    {selectedViewLead.notes || "No technical requirements or notes captured yet."}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedViewLead(null)}
                  className={cn("rounded-xl font-bold h-10 px-5", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
                >
                  Close
                </Button>
                {selectedViewLead.status !== "converted" && (
                  <Button
                    onClick={() => {
                      const l = selectedViewLead
                      setSelectedViewLead(null)
                      handleConvertToDeal(l)
                    }}
                    className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-teal" />
                    Convert to Deal
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-2xl",
          isDark ? "bg-[#0a1033] border-2 border-teal/30 text-white" : "bg-white border-2 border-navy text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-lg sm:text-xl font-black tracking-tight", isDark ? "text-white" : "text-navy")}>
              Register New CRM Lead
            </DialogTitle>
            <DialogDescription className={cn("text-xs sm:text-sm font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
              Capture prospective commercial client inquiries for tracking and qualification.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">First Name *</Label>
                <Input
                  required
                  placeholder="e.g. Baraka"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Last Name</Label>
                <Input
                  placeholder="e.g. Massawe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

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
                <Label className="text-xs font-bold uppercase tracking-wider">Lead Source *</Label>
                <Select value={source} onValueChange={(val) => setSource(val as LeadSource)}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-semibold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"}>
                    {SOURCES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Email Address *</Label>
                <Input
                  required
                  type="email"
                  placeholder="lead@company.co.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Phone / WhatsApp *</Label>
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
                <Label className="text-xs font-bold uppercase tracking-wider">Estimated Deal Value (TZS)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 15000000"
                  value={estimatedValue || ""}
                  onChange={(e) => setEstimatedValue(Number(e.target.value))}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-mono font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">Assigned Sales Specialist</Label>
                <Input
                  placeholder="e.g. Framani Mwamba"
                  value={assignedToName}
                  onChange={(e) => setAssignedToName(e.target.value)}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Inquiry Details &amp; Technical Requirements</Label>
              <Textarea
                rows={3}
                placeholder="Camera count, site dimensions, requested IT specs, or tender submission deadlines..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
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
                {isSubmitting ? "Saving..." : "Save Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
