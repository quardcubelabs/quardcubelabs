"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminFilterTabs,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminMutedText,
  AdminStatusBadge,
  AdminDetailModal,
  AdminDetailSection,
  AdminFormModal,
  AdminFormGrid,
  AdminFormField,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  type AdminTableColumn,
  type AdminTableAction,
  type AdminStatItem,
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import { getActivities, createActivity, completeActivity, getDeals } from "@/lib/crm-actions"
import type { CrmActivity, ActivityType, CrmDeal } from "@/lib/erp/crm-types"
import type { LucideIcon } from "lucide-react"
import {
  CheckSquare,
  Phone,
  Video,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Mail,
  FileText,
  Eye,
  Briefcase,
  Check,
} from "lucide-react"

const ACTIVITY_TYPES: { id: ActivityType; label: string; icon: LucideIcon }[] = [
  { id: "call", label: "Phone Call", icon: Phone },
  { id: "meeting", label: "Client Meeting", icon: Video },
  { id: "site_visit", label: "Site Inspection / Survey", icon: MapPin },
  { id: "task", label: "Follow-up Task", icon: CheckSquare },
  { id: "email", label: "Email Dispatch", icon: Mail },
  { id: "note", label: "Technical Note", icon: FileText }
]

const typeLabel = (type: ActivityType) =>
  ACTIVITY_TYPES.find((item) => item.id === type)?.label ?? type.replace(/_/g, " ")

const typeIcon = (type: ActivityType): LucideIcon =>
  ACTIVITY_TYPES.find((item) => item.id === type)?.icon ?? CheckSquare

export default function ActivitiesPage() {
  const { toast } = useToast()

  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")

  // Modals
  const [selectedViewActivity, setSelectedViewActivity] = useState<CrmActivity | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create Form State
  const [subject, setSubject] = useState("")
  const [activityType, setActivityType] = useState<ActivityType>("call")
  const [selectedDealId, setSelectedDealId] = useState<string>("none")
  const [customerName, setCustomerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [assignedToName, setAssignedToName] = useState("Framani Mwamba")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [acts, dls] = await Promise.all([getActivities(), getDeals()])
      setActivities(acts)
      setDeals(dls)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load CRM activities.",
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
    setSubject("")
    setActivityType("call")
    setSelectedDealId("none")
    setCustomerName("")
    setDueDate("")
    setDescription("")
    setAssignedToName("Framani Mwamba")
  }

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject) {
      toast({
        title: "Missing Subject",
        description: "Please specify an activity subject.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const deal = deals.find(d => d.id === selectedDealId)
      await createActivity({
        subject,
        activity_type: activityType,
        deal_id: selectedDealId !== "none" ? selectedDealId : undefined,
        customer_name: customerName || (deal ? deal.customer_name : undefined),
        due_date: dueDate || new Date().toISOString().split("T")[0],
        description,
        status: "pending",
        assigned_to_name: assignedToName
      })
      toast({
        title: "Activity Scheduled",
        description: "Follow-up activity logged successfully."
      })
      setIsCreateOpen(false)
      resetCreateForm()
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Could not schedule activity.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async (activityId: string) => {
    try {
      await completeActivity(activityId)
      toast({
        title: "Activity Completed",
        description: "Marked task as completed."
      })
      if (selectedViewActivity?.id === activityId) {
        setSelectedViewActivity(prev => prev ? { ...prev, status: "completed" } : null)
      }
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Could not update activity.",
        variant: "destructive"
      })
    }
  }

  const filteredActivities = activities.filter(a => {
    const matchesSearch =
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.customer_name && a.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.assigned_to_name && a.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === "all" || a.activity_type === typeFilter
    const matchesStatus = statusFilter === "all" || a.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // KPI Calculations
  const pendingCount = activities.filter(a => a.status === "pending").length
  const completedCount = activities.filter(a => a.status === "completed").length
  const highTouchCount = activities.filter(a => ["call", "meeting", "site_visit"].includes(a.activity_type)).length

  const stats: AdminStatItem[] = [
    { title: "Total Activities", value: activities.length.toString(), icon: CheckSquare },
    { title: "Pending Tasks", value: pendingCount.toString(), icon: Clock },
    { title: "Completed Items", value: completedCount.toString(), icon: CheckCircle2 },
    { title: "Calls & Surveys", value: highTouchCount.toString(), icon: MapPin }
  ]

  const typeTabs: AdminFilterTab[] = [
    { key: "all", label: "All Types", count: activities.length },
    ...ACTIVITY_TYPES.map((type) => ({
      key: type.id,
      label: type.label,
      icon: type.icon,
      count: activities.filter((a) => a.activity_type === type.id).length
    }))
  ]

  const statusTabs: AdminFilterTab[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "completed", label: "Completed", count: completedCount }
  ]

  const columns: AdminTableColumn<CrmActivity>[] = [
    {
      key: "type",
      header: "Activity Type",
      render: (activity) => (
        <AdminPill title={typeLabel(activity.activity_type)}>
          {typeLabel(activity.activity_type)}
        </AdminPill>
      )
    },
    {
      key: "subject",
      header: "Subject & Task Details",
      render: (activity) => (
        <div className="min-w-0 max-w-xs sm:max-w-md">
          <p
            className={`font-bold text-xs sm:text-sm truncate ${activity.status === "completed" ? "line-through opacity-70" : ""}`}
            title={activity.subject}
          >
            {activity.subject}
          </p>
          {activity.description && (
            <AdminMutedText className="block text-[11px] line-clamp-1 truncate mt-0.5">
              {activity.description}
            </AdminMutedText>
          )}
        </div>
      )
    },
    {
      key: "client",
      header: "Client / Account",
      hidden: "sm",
      render: (activity) => (
        <div className="min-w-0">
          <span className="font-bold text-xs sm:text-sm truncate max-w-[160px] block" title={activity.customer_name || "Unassigned Client"}>
            {activity.customer_name || "Unassigned Client"}
          </span>
          {activity.deal_id && (
            <AdminMutedText className="block text-[10px] font-mono truncate">
              Deal #{activity.deal_id.slice(0, 8)}
            </AdminMutedText>
          )}
        </div>
      )
    },
    {
      key: "due",
      header: "Due Date & Rep",
      hidden: "md",
      render: (activity) => (
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-500">
            <Calendar className="w-3 h-3" />
            {activity.due_date || "Today"}
          </div>
          <AdminMutedText className="block text-[11px]">
            {activity.assigned_to_name || "Sales Team"}
          </AdminMutedText>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (activity) => (
        <AdminStatusBadge status={activity.status} />
      )
    }
  ]

  const actions: AdminTableAction<CrmActivity>[] = [
    {
      key: "view",
      label: "View Activity Details",
      icon: Eye,
      variant: "view",
      onClick: (activity) => setSelectedViewActivity(activity)
    },
    {
      key: "complete",
      label: "Mark Task Done",
      icon: Check,
      variant: "soft",
      hide: (activity) => activity.status === "completed",
      onClick: (activity) => handleComplete(activity.id)
    }
  ]

  const detailSections = (activity: CrmActivity): AdminDetailSectionData[] => [
    {
      key: "metadata",
      title: "Activity Metadata",
      icon: typeIcon(activity.activity_type),
      span: 1,
      fields: [
        { label: "Activity ID", value: <span className="font-mono">{activity.id.slice(0, 10)}</span> },
        { label: "Activity Type", value: typeLabel(activity.activity_type) },
        { label: "Status", value: <AdminStatusBadge status={activity.status} /> },
        { label: "Due Date", value: <span className="font-mono text-amber-500">{activity.due_date || "Immediate"}</span> },
        { label: "Client Name", value: activity.customer_name || "General Lead" },
        { label: "Assigned Rep", value: activity.assigned_to_name || "Sales Team" },
        { label: "Completed At", value: activity.completed_at ? <span className="font-mono">{activity.completed_at}</span> : "—" }
      ]
    },
    {
      key: "agenda",
      title: "Discussion Agenda & Technote",
      icon: FileText,
      span: 1,
      content: (
        <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">
          {activity.description || "No additional meeting notes recorded for this task."}
        </p>
      )
    },
    {
      key: "deal",
      title: "Linked CRM Context",
      icon: Briefcase,
      span: 1,
      fields: [
        { label: "Linked Opportunity Deal", value: activity.deal_id ? <span className="font-mono">{activity.deal_id}</span> : "Standalone activity" },
        { label: "Lead Reference", value: activity.lead_id ? <span className="font-mono">{activity.lead_id}</span> : "—" },
        { label: "Customer Reference", value: activity.customer_id ? <span className="font-mono">{activity.customer_id}</span> : "—" }
      ]
    }
  ]

  if (isLoading && activities.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Sales"
        accent="Activities & Tasks"
        subtitle="Client follow-ups, scheduled calls, technical site surveys, and reminders"
        icon={CheckSquare}
        onRefresh={loadData}
        refreshing={isLoading}
        onAdd={() => setIsCreateOpen(true)}
        addLabel="Schedule Activity"
      />

      <AdminStats items={stats} columns={4} />

      <AdminFilterBar
        tabs={typeTabs}
        tabValue={typeFilter}
        onTabChange={setTypeFilter}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search activity subject, client, notes, or sales rep..."
      >
        <AdminFilterTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as "all" | "pending" | "completed")}
        />
      </AdminFilterBar>

      <AdminTable
        columns={columns}
        data={filteredActivities}
        rowKey={(activity) => activity.id}
        actions={actions}
        emptyIcon={CheckSquare}
        emptyTitle="No sales activities found"
        emptyDescription="Adjust your search query or schedule a new task."
      />

      <AdminDetailModal
        open={!!selectedViewActivity}
        onOpenChange={(open) => !open && setSelectedViewActivity(null)}
        icon={selectedViewActivity ? typeIcon(selectedViewActivity.activity_type) : CheckSquare}
        title={selectedViewActivity ? selectedViewActivity.subject : ""}
        badge={selectedViewActivity && <AdminStatusBadge status={selectedViewActivity.status} />}
        subtitle={selectedViewActivity && `Activity: ${typeLabel(selectedViewActivity.activity_type)}`}
        sections={selectedViewActivity ? detailSections(selectedViewActivity) : []}
        footerActions={selectedViewActivity?.status !== "completed" ? (
          <Button
            onClick={() => selectedViewActivity && handleComplete(selectedViewActivity.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-5 gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark as Done
          </Button>
        ) : undefined}
      />

      <AdminFormModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetCreateForm()
        }}
        icon={CheckSquare}
        title="Schedule Sales Activity"
        description="Log phone calls, site surveys, client meetings, and pipeline follow-ups."
        onSubmit={handleCreateActivity}
        isSubmitting={isSubmitting}
        createLabel="Schedule Task"
        size="md"
      >
        <AdminFormField label="Activity Subject" required>
          <AdminInput
            required
            placeholder="e.g. Follow up on CCTV quotation approval with General Manager"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </AdminFormField>
        <AdminFormGrid>
          <AdminFormField label="Activity Type" required>
            <AdminSelect
              value={activityType}
              onValueChange={(val) => setActivityType(val as ActivityType)}
              options={ACTIVITY_TYPES.map((type) => ({ value: type.id, label: type.label }))}
            />
          </AdminFormField>
          <AdminFormField label="Linked Sales Deal">
            <AdminSelect
              value={selectedDealId}
              onValueChange={setSelectedDealId}
              options={[
                { value: "none", label: "-- Standalone Task --" },
                ...deals.map((deal) => ({
                  value: deal.id,
                  label: `${deal.title.slice(0, 35)}...`
                }))
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Client / Company Name">
            <AdminInput
              placeholder="e.g. Serengeti Freight Logistics Ltd"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Due Date">
            <AdminInput
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </AdminFormField>
          <AdminFormField label="Assigned Rep">
            <AdminInput
              value={assignedToName}
              onChange={(e) => setAssignedToName(e.target.value)}
            />
          </AdminFormField>
        </AdminFormGrid>
        <AdminFormField label="Details & Discussion Agenda">
          <AdminTextarea
            rows={3}
            placeholder="Notes for the call, technician equipment to carry, key questions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </AdminFormField>
      </AdminFormModal>
    </div>
  )
}
