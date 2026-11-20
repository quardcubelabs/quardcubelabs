"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminConfirmDialog,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminStatItem,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getLeads, createLead, updateLeadStatus, deleteLead, createDeal } from "@/lib/crm-actions"
import type { CrmLead, LeadSource, LeadStatus } from "@/lib/erp/crm-types"
import {
  Target,
  Phone,
  Building2,
  DollarSign,
  UserCheck,
  Trash2,
  SlidersHorizontal,
  XCircle,
  Eye,
  Layers,
  Clock,
  CheckCircle,
  FileText,
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

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "unqualified"]

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "—"

export default function LeadsManagementPage() {
  const router = useRouter()
  const { toast } = useToast()

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

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CrmLead | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const resetCreateForm = () => {
    setFirstName("")
    setLastName("")
    setCompanyName("")
    setEmail("")
    setPhone("")
    setCity("Dar es Salaam")
    setRegion("Dar es Salaam")
    setSource("Website Form")
    setEstimatedValue(0)
    setAssignedToName("Framani Mwamba")
    setNotes("")
  }

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
      resetCreateForm()
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

  const handleDelete = async () => {
    const lead = deleteTarget
    if (!lead) return
    setIsDeleting(true)
    try {
      await deleteLead(lead.id)
      toast({
        title: "Lead Removed",
        description: "Prospect record deleted from CRM database."
      })
      setDeleteTarget(null)
      setSelectedViewLead((current) => (current?.id === lead.id ? null : current))
      loadData()
    } catch {
      toast({
        title: "Delete Error",
        description: "Could not remove lead.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
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

  const stats: AdminStatItem[] = [
    { title: "Total Inbound Leads", value: totalLeads.toString(), icon: Target },
    { title: "Qualified Prospects", value: qualifiedCount.toString(), icon: UserCheck },
    { title: "Converted to Deals", value: convertedCount.toString(), icon: SlidersHorizontal },
    { title: "Pipeline Potential", value: `TZS ${(totalValue / 1000000).toFixed(1)}M`, icon: DollarSign }
  ]

  const statusTabs: AdminFilterTab[] = [
    { key: "all", label: "All Leads", icon: Layers, count: leads.length },
    { key: "new", label: "New", icon: Clock, count: newLeadsCount },
    { key: "contacted", label: "Contacted", icon: Phone, count: leads.filter(l => l.status === "contacted").length },
    { key: "qualified", label: "Qualified", icon: UserCheck, count: qualifiedCount },
    { key: "converted", label: "Converted", icon: CheckCircle, count: convertedCount },
    { key: "unqualified", label: "Unqualified", icon: XCircle, count: leads.filter(l => l.status === "unqualified").length }
  ]

  const columns: AdminTableColumn<CrmLead>[] = [
    {
      key: "lead",
      header: "Lead # / Source",
      render: (lead) => (
        <AdminPrimaryCell
          icon={Target}
          title={lead.lead_number}
          subtitle={lead.source}
        />
      )
    },
    {
      key: "contact",
      header: "Contact & Company",
      render: (lead) => (
        <div className="min-w-0">
          <p className="font-bold text-xs sm:text-sm truncate max-w-[160px] sm:max-w-[220px]" title={`${lead.first_name} ${lead.last_name}`}>
            {lead.first_name} {lead.last_name}
          </p>
          <AdminMutedText className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-[220px]" >
            {lead.company_name ? (
              <>
                <Building2 className="w-3 h-3 text-teal shrink-0" />
                <span className="truncate">{lead.company_name}</span>
              </>
            ) : (
              <span className="truncate opacity-75">{lead.email}</span>
            )}
          </AdminMutedText>
        </div>
      )
    },
    {
      key: "value",
      header: "Estimated Value",
      hidden: "sm",
      render: (lead) => (
        <span className="font-mono font-black text-xs sm:text-sm whitespace-nowrap">
          TZS {(lead.estimated_value || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: "rep",
      header: "Assigned Rep",
      hidden: "md",
      render: (lead) => (
        <AdminPill title={lead.assigned_to_name}>
          {lead.assigned_to_name || "Unassigned"}
        </AdminPill>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (lead) => (
        <Select
          value={lead.status}
          onValueChange={(val) => handleStatusChange(lead.id, val as LeadStatus)}
        >
          <SelectTrigger className="h-8 w-fit px-2 rounded-lg border-0 bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
            <AdminStatusBadge status={lead.status} />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
  ]

  const actions: AdminTableAction<CrmLead>[] = [
    {
      key: "view",
      label: "View Details",
      icon: Eye,
      variant: "view",
      onClick: (lead) => setSelectedViewLead(lead)
    },
    {
      key: "convert",
      label: "Convert to Sales Deal",
      icon: SlidersHorizontal,
      variant: "soft",
      hide: (lead) => lead.status === "converted",
      onClick: (lead) => handleConvertToDeal(lead)
    },
    {
      key: "delete",
      label: "Delete Lead",
      icon: Trash2,
      variant: "danger-soft",
      onClick: (lead) => setDeleteTarget(lead)
    }
  ]

  const detailSections = (lead: CrmLead): AdminDetailSectionData[] => [
    {
      key: "pipeline",
      title: "Pipeline & Valuation",
      icon: DollarSign,
      span: 1,
      fields: [
        { label: "Lead Number", value: <span className="font-mono">{lead.lead_number}</span> },
        { label: "Status", value: <AdminStatusBadge status={lead.status} /> },
        { label: "Estimated Value", value: `TZS ${(lead.estimated_value || 0).toLocaleString()}` },
        { label: "Assigned Representative", value: lead.assigned_to_name || "Unassigned" },
        { label: "Lead Source", value: lead.source },
        { label: "Created", value: formatDate(lead.created_at) },
        { label: "Last Updated", value: formatDate(lead.updated_at) }
      ]
    },
    {
      key: "contact",
      title: "Direct Contact Channels",
      icon: Phone,
      span: 1,
      fields: [
        { label: "Company", value: lead.company_name || "Private Client" },
        { label: "Email", value: <span className="break-all">{lead.email}</span> },
        { label: "Phone / WhatsApp", value: lead.phone },
        { label: "City", value: lead.city || "Dar es Salaam" },
        { label: "Region", value: lead.region || "Tanzania" },
        { label: "Location", value: `${lead.city || "Dar es Salaam"}, ${lead.region || "Tanzania"}` }
      ]
    },
    {
      key: "notes",
      title: "Technical Scope & Notes",
      icon: FileText,
      span: 1,
      fields: [
        { label: "Inquiry Details", value: lead.notes || "No technical requirements or notes captured yet." }
      ]
    }
  ]

  if (isLoading && leads.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Sales Leads &"
        accent="Prospects"
        subtitle="Inbound inquiries, WhatsApp chats, survey requests, and client pipeline qualification"
        icon={Target}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Add Sales Lead"
      />

      <AdminStats items={stats} columns={4} />

      <AdminFilterBar
        tabs={statusTabs}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search leads by name, company, email, phone, or code..."
      />

      <AdminTable
        columns={columns}
        data={filteredLeads}
        rowKey={(lead) => lead.id}
        actions={actions}
        emptyIcon={Layers}
        emptyTitle="No leads found"
        emptyDescription="No leads match your search criteria. Try adjusting your filters."
      />

      <AdminDetailModal
        open={!!selectedViewLead}
        onOpenChange={(open) => !open && setSelectedViewLead(null)}
        icon={Target}
        title={selectedViewLead ? `${selectedViewLead.first_name} ${selectedViewLead.last_name}` : ""}
        badge={selectedViewLead && <AdminStatusBadge status={selectedViewLead.status} />}
        subtitle={selectedViewLead && (
          <>
            <span className="font-mono font-bold">{selectedViewLead.lead_number}</span>
            {" • Company: "}
            <span className="font-bold">{selectedViewLead.company_name || "Private Client"}</span>
            {" • Source: "}
            <span className="font-bold">{selectedViewLead.source}</span>
          </>
        )}
        sections={selectedViewLead ? detailSections(selectedViewLead) : []}
        footerActions={selectedViewLead && selectedViewLead.status !== "converted" ? (
          <Button
            onClick={() => {
              const lead = selectedViewLead
              setSelectedViewLead(null)
              handleConvertToDeal(lead)
            }}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal" />
            Convert to Deal
          </Button>
        ) : undefined}
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetCreateForm()
        }}
        icon={Target}
        title="Register New CRM Lead"
        description="Capture prospective commercial client inquiries for tracking and qualification."
        onSubmit={handleCreateLead}
        isSubmitting={isSubmitting}
        createLabel="Save Lead"
        size="md"
      >
        <AdminFormGrid>
          <AdminFormField label="First Name" required>
            <AdminInput
              required
              placeholder="e.g. Baraka"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Last Name">
            <AdminInput
              placeholder="e.g. Massawe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Company / Organization">
            <AdminInput
              placeholder="e.g. Serengeti Freight Logistics Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Lead Source" required>
            <AdminSelect
              value={source}
              onValueChange={(val) => setSource(val as LeadSource)}
              options={SOURCES.map((item) => ({ value: item, label: item }))}
            />
          </AdminFormField>
          <AdminFormField label="Email Address" required>
            <AdminInput
              required
              type="email"
              placeholder="lead@company.co.tz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Phone / WhatsApp" required>
            <AdminInput
              required
              placeholder="+255 7..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Estimated Deal Value (TZS)">
            <AdminInput
              monospace
              type="number"
              placeholder="e.g. 15000000"
              value={estimatedValue || ""}
              onChange={(e) => setEstimatedValue(Number(e.target.value))}
            />
          </AdminFormField>
          <AdminFormField label="Assigned Sales Specialist">
            <AdminInput
              placeholder="e.g. Framani Mwamba"
              value={assignedToName}
              onChange={(e) => setAssignedToName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="City">
            <AdminInput value={city} onChange={(e) => setCity(e.target.value)} />
          </AdminFormField>
          <AdminFormField label="Region">
            <AdminInput value={region} onChange={(e) => setRegion(e.target.value)} />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Inquiry Details & Technical Requirements">
          <AdminTextarea
            placeholder="Camera count, site dimensions, requested IT specs, or tender submission deadlines..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove sales lead?"
        description={
          deleteTarget
            ? `This will permanently delete lead ${deleteTarget.lead_number} (${deleteTarget.first_name} ${deleteTarget.last_name}) from the CRM database.`
            : undefined
        }
        confirmLabel="Delete Lead"
        onConfirm={handleDelete}
        isSubmitting={isDeleting}
      />
    </div>
  )
}
