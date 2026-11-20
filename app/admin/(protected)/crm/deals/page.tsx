"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminStatusBadge,
  AdminMutedText,
  AdminDetailModal,
  AdminDetailSection,
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
import { getDeals, createDeal, updateDealStage, deleteDeal } from "@/lib/crm-actions"
import type { CrmDeal, DealStage } from "@/lib/erp/crm-types"
import {
  SlidersHorizontal,
  Layers,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  FileText,
  Trash2,
  Eye,
  Building2,
  Calendar,
  Briefcase,
} from "lucide-react"

const STAGES: { id: DealStage; label: string }[] = [
  { id: "qualification", label: "Qualification" },
  { id: "site_survey", label: "Site Survey" },
  { id: "proposal_quote", label: "Proposal Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Closed Won" },
  { id: "lost", label: "Closed Lost" }
]

const stageLabel = (stage: DealStage) =>
  STAGES.find((item) => item.id === stage)?.label ?? stage.replace(/_/g, " ")

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString() : "Open"

export default function DealsPipelinePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all")

  // View Deal Modal
  const [selectedViewDeal, setSelectedViewDeal] = useState<CrmDeal | null>(null)

  // Create Deal Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [amount, setAmount] = useState<number>(0)
  const [stage, setStage] = useState<DealStage>("qualification")
  const [probability, setProbability] = useState<number>(50)
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [assignedToName, setAssignedToName] = useState("Framani Mwamba")
  const [notes, setNotes] = useState("")

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<CrmDeal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getDeals()
      setDeals(data)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load sales deals.",
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
    setTitle("")
    setCustomerName("")
    setCustomerEmail("")
    setCustomerPhone("")
    setAmount(0)
    setStage("qualification")
    setProbability(50)
    setExpectedCloseDate("")
    setAssignedToName("Framani Mwamba")
    setNotes("")
  }

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !customerName || !amount) {
      toast({
        title: "Required Fields",
        description: "Please specify deal title, customer name, and contract amount.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createDeal({
        title,
        customer_name: customerName,
        customer_email: customerEmail || "client@company.co.tz",
        customer_phone: customerPhone,
        stage,
        amount: Number(amount) || 0,
        probability: Number(probability) || 50,
        expected_close_date: expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        assigned_to_name: assignedToName,
        notes
      })
      toast({
        title: "Deal Created",
        description: "New pipeline opportunity entered into CRM."
      })
      setIsCreateOpen(false)
      resetCreateForm()
      loadData()
    } catch {
      toast({
        title: "Submission Error",
        description: "Could not create deal record.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      await updateDealStage(dealId, newStage)
      toast({
        title: "Deal Stage Advanced",
        description: `Deal moved to ${newStage.replace("_", " ")}.`
      })
      if (selectedViewDeal?.id === dealId) {
        setSelectedViewDeal((prev) => (prev ? { ...prev, stage: newStage } : null))
      }
      loadData()
    } catch {
      toast({
        title: "Update Error",
        description: "Failed to advance deal stage.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    const deal = deleteTarget
    if (!deal) return
    setIsDeleting(true)
    try {
      await deleteDeal(deal.id)
      toast({
        title: "Deal Deleted",
        description: "Opportunity removed from pipeline."
      })
      setDeleteTarget(null)
      setSelectedViewDeal((current) => (current?.id === deal.id ? null : current))
      loadData()
    } catch {
      toast({
        title: "Delete Error",
        description: "Could not remove deal record.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredDeals = deals.filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      d.deal_number.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.customer_name.toLowerCase().includes(q)

    const matchesStage = selectedStageFilter === "all" || d.stage === selectedStageFilter
    return matchesSearch && matchesStage
  })

  // Pipeline Metrics
  const totalDeals = deals.length
  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const wonDeals = deals.filter(d => d.stage === "won")
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0

  const stats: AdminStatItem[] = [
    { title: "Total Opportunities", value: totalDeals.toString(), icon: SlidersHorizontal },
    { title: "Total Pipeline Value", value: `TZS ${(totalPipelineValue / 1000000).toFixed(1)}M`, icon: DollarSign },
    { title: "Closed Won Revenue", value: `TZS ${(wonValue / 1000000).toFixed(1)}M`, icon: CheckCircle2 },
    { title: "Win Rate", value: `${winRate}%`, icon: TrendingUp }
  ]

  const stageTabs: AdminFilterTab[] = [
    { key: "all", label: "All Stages", icon: Layers, count: deals.length },
    ...STAGES.map((item) => ({
      key: item.id,
      label: item.label,
      count: deals.filter((d) => d.stage === item.id).length
    }))
  ]

  const columns: AdminTableColumn<CrmDeal>[] = [
    {
      key: "deal",
      header: "Opportunity Deal",
      render: (deal) => (
        <AdminPrimaryCell
          icon={SlidersHorizontal}
          title={deal.title}
          subtitle={<span className="font-mono">{deal.deal_number}</span>}
        />
      )
    },
    {
      key: "customer",
      header: "Client Account",
      hidden: "sm",
      render: (deal) => (
        <span className="font-bold text-xs sm:text-sm truncate max-w-[150px] block" title={deal.customer_name}>
          {deal.customer_name}
        </span>
      )
    },
    {
      key: "stage",
      header: "Pipeline Stage",
      render: (deal) => (
        <AdminStatusBadge status={deal.stage} label={stageLabel(deal.stage)} />
      )
    },
    {
      key: "amount",
      header: "Contract Value",
      align: "right",
      render: (deal) => (
        <span className="font-mono font-black text-xs sm:text-sm text-emerald-500 whitespace-nowrap">
          TZS {deal.amount.toLocaleString()}
        </span>
      )
    },
    {
      key: "probability",
      header: "Win Prob.",
      align: "center",
      hidden: "md",
      render: (deal) => (
        <span className="font-mono font-bold text-xs whitespace-nowrap">{deal.probability}%</span>
      )
    },
    {
      key: "close",
      header: "Expected Close",
      hidden: "lg",
      render: (deal) => (
        <div className="whitespace-nowrap text-xs">
          <div className="flex items-center gap-1 font-mono font-medium text-slate-400">
            <Calendar className="w-3 h-3 text-teal" />
            {deal.expected_close_date || "Open"}
          </div>
          <AdminMutedText className="block text-[10px]">
            Rep: {deal.assigned_to_name || "Sales Team"}
          </AdminMutedText>
        </div>
      )
    }
  ]

  const actions: AdminTableAction<CrmDeal>[] = [
    {
      key: "view",
      label: "View Deal Details",
      icon: Eye,
      variant: "view",
      onClick: (deal) => setSelectedViewDeal(deal)
    },
    {
      key: "quotation",
      label: "Issue Quotation",
      icon: FileText,
      variant: "soft",
      mobile: false,
      href: () => "/admin/quotations"
    },
    {
      key: "delete",
      label: "Delete Opportunity",
      icon: Trash2,
      variant: "delete",
      onClick: (deal) => setDeleteTarget(deal)
    }
  ]

  const detailSections = (deal: CrmDeal): AdminDetailSectionData[] => [
    {
      key: "financial",
      title: "Financial Value & Stage",
      icon: DollarSign,
      span: 1,
      fields: [
        { label: "Deal Number", value: <span className="font-mono">{deal.deal_number}</span> },
        { label: "Current Stage", value: <AdminStatusBadge status={deal.stage} label={stageLabel(deal.stage)} /> },
        { label: "Contract Value", value: `TZS ${deal.amount.toLocaleString()}` },
        { label: "Win Probability", value: `${deal.probability}%` },
        { label: "Expected Close", value: formatDate(deal.expected_close_date) },
        { label: "Created", value: formatDate(deal.created_at) },
        { label: "Last Updated", value: formatDate(deal.updated_at) }
      ]
    },
    {
      key: "customer",
      title: "Customer & Assignment",
      icon: Building2,
      span: 1,
      fields: [
        { label: "Customer", value: deal.customer_name },
        { label: "Email", value: <span className="break-all">{deal.customer_email}</span> },
        { label: "Phone", value: deal.customer_phone || "—" },
        { label: "Assigned Rep", value: deal.assigned_to_name || "Sales Team" },
        { label: "Linked Lead", value: deal.lead_id ? <span className="font-mono">{deal.lead_id}</span> : "—" }
      ]
    },
    {
      key: "scope",
      title: "Deal Narrative & Scope",
      icon: Briefcase,
      span: 1,
      content: (
        <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
          {deal.notes || "No detailed scope notes registered for this deal."}
        </p>
      )
    }
  ]

  if (isLoading && deals.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Commercial Deals &"
        accent="Pipeline"
        subtitle="Enterprise contract negotiations, site surveys, multi-camera scopes, and win-rate analytics"
        icon={SlidersHorizontal}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Add Sales Opportunity"
      />

      <AdminStats items={stats} columns={4} />

      <AdminFilterBar
        tabs={stageTabs}
        tabValue={selectedStageFilter}
        onTabChange={setSelectedStageFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search deals by title, customer, or deal code..."
      />

      <AdminTable
        columns={columns}
        data={filteredDeals}
        rowKey={(deal) => deal.id}
        actions={actions}
        emptyIcon={SlidersHorizontal}
        emptyTitle="No sales deals found"
        emptyDescription="Try adjusting your filters or search keywords"
      />

      <AdminDetailModal
        open={!!selectedViewDeal}
        onOpenChange={(open) => !open && setSelectedViewDeal(null)}
        icon={SlidersHorizontal}
        title={selectedViewDeal ? selectedViewDeal.title : ""}
        badge={selectedViewDeal && (
          <AdminStatusBadge status={selectedViewDeal.stage} label={stageLabel(selectedViewDeal.stage)} />
        )}
        subtitle={selectedViewDeal && (
          <>
            <span className="font-mono font-bold">{selectedViewDeal.deal_number}</span>
            {" • Customer: "}
            <span className="font-bold">{selectedViewDeal.customer_name}</span>
            {" • Rep: "}
            <span className="font-bold">{selectedViewDeal.assigned_to_name || "Sales Team"}</span>
          </>
        )}
        sections={selectedViewDeal ? detailSections(selectedViewDeal) : []}
        footerActions={
          <Button
            onClick={() => router.push("/admin/quotations")}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md"
          >
            <FileText className="w-4 h-4 text-teal" />
            Issue Quotation
          </Button>
        }
      >
        {selectedViewDeal && (
          <AdminDetailSection
            key="stage-change"
            title="Update Pipeline Stage"
            icon={SlidersHorizontal}
            fields={[
              {
                label: "Move deal to",
                value: (
                  <AdminSelect
                    value={selectedViewDeal.stage}
                    onValueChange={(value) => handleStageChange(selectedViewDeal.id, value as DealStage)}
                    options={STAGES.map((item) => ({ value: item.id, label: item.label }))}
                  />
                )
              }
            ]}
          />
        )}
      </AdminDetailModal>

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetCreateForm()
        }}
        icon={SlidersHorizontal}
        title="Create Sales Opportunity"
        description="Register a commercial opportunity into the revenue pipeline."
        onSubmit={handleCreateDeal}
        isSubmitting={isSubmitting}
        createLabel="Save Deal"
        size="md"
      >
        <AdminFormField label="Opportunity Title" required>
          <AdminInput
            required
            placeholder="e.g. 16-Channel 4K ColorVu IP Surveillance & Access Control System"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </AdminFormField>
        <AdminFormGrid>
          <AdminFormField label="Customer / Company" required>
            <AdminInput
              required
              placeholder="e.g. Serengeti Breweries HQ"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Contract Value (TZS)" required>
            <AdminInput
              monospace
              required
              type="number"
              placeholder="e.g. 35000000"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </AdminFormField>
          <AdminFormField label="Initial Pipeline Stage">
            <AdminSelect
              value={stage}
              onValueChange={(val) => setStage(val as DealStage)}
              options={STAGES.map((item) => ({ value: item.id, label: item.label }))}
            />
          </AdminFormField>
          <AdminFormField label="Win Probability (%)">
            <AdminInput
              monospace
              type="number"
              placeholder="50"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
            />
          </AdminFormField>
          <AdminFormField label="Expected Close Date">
            <AdminInput
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Assigned Rep">
            <AdminInput
              placeholder="e.g. Framani Mwamba"
              value={assignedToName}
              onChange={(e) => setAssignedToName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Customer Email">
            <AdminInput
              type="email"
              placeholder="client@company.co.tz"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Customer Phone">
            <AdminInput
              placeholder="+255 7..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Deal Highlights & Scope Requirements">
          <AdminTextarea
            rows={3}
            placeholder="Hardware specs, NVR channels, storage days, or client SLA parameters..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete sales opportunity?"
        description={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.title} (${deleteTarget.deal_number}) from the sales pipeline.`
            : undefined
        }
        confirmLabel="Delete Opportunity"
        onConfirm={handleDelete}
        isSubmitting={isDeleting}
      />
    </div>
  )
}
