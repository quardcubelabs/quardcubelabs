"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
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
} from "@/components/admin/ui"
import {
  getApplications,
  updateApplicationStatus,
  scheduleInterview,
  deleteApplication,
  getApplicationStats
} from "@/lib/applications-actions"
import type { Application } from "@/types/database"
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  CalendarDays,
  Trash2,
  Briefcase,
  ExternalLink,
  Linkedin,
  Edit,
  ShieldCheck,
  DollarSign,
} from "lucide-react"

interface ApplicationWithPosition extends Application {
  position_title: string
  position_department: string
  position_location: string
  position_employment_type: string
  position_experience_level: string
}

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  reviewing: "Under Review",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  hired: "Hired",
  rejected: "Rejected"
}

/** Map domain statuses onto the shared badge vocabulary while keeping labels. */
const statusTone: Record<string, string> = {
  pending: "pending",
  reviewing: "reviewing",
  interview_scheduled: "scheduled",
  interview_completed: "completed",
  hired: "hired",
  rejected: "rejected",
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review" },
  { value: "reviewing", label: "Under Review" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interview_completed", label: "Interview Completed" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
]

const STAGES = [
  { key: "pending", label: "Pending Review", desc: "Initial receipt", icon: Clock },
  { key: "reviewing", label: "Under Review", desc: "Reviewing resume", icon: Users },
  { key: "interview_scheduled", label: "Interview Scheduled", desc: "Invited", icon: Calendar },
  { key: "interview_completed", label: "Interview Done", desc: "Under decision", icon: CheckCircle },
  { key: "hired", label: "Hired", desc: "Offer accepted", icon: ShieldCheck },
  { key: "rejected", label: "Rejected", desc: "Not selected", icon: XCircle },
]

export default function ApplicationsManagement() {
  const { isDark } = useAdminTheme()
  const [applications, setApplications] = useState<ApplicationWithPosition[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithPosition | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isInterviewOpen, setIsInterviewOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApplicationWithPosition | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")

  // Form states
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewNotes, setInterviewNotes] = useState("")
  const [newStatus, setNewStatus] = useState<Application['status']>("reviewing")
  const [statusNotes, setStatusNotes] = useState("")

  const { toast } = useToast()

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const result = await getApplications()
      if (result.error) throw new Error(result.error)
      setApplications((result.data || []) as ApplicationWithPosition[])
      setFilteredApplications((result.data || []) as ApplicationWithPosition[])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch applications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getApplicationStats()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    fetchApplications()
    fetchStats()
  }, [])

  useEffect(() => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(app =>
        `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position_department?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter(app => app.position_id === positionFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchTerm, statusFilter, positionFilter])

  const handleUpdateStatus = async (statusVal: Application['status']) => {
    if (!selectedApplication) return
    setIsSubmitting(true)

    try {
      const result = await updateApplicationStatus(
        selectedApplication.id,
        statusVal,
        statusNotes
      )

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Status Updated",
          description: `Application status changed to ${statusLabels[statusVal] || statusVal}`
        })
        await fetchApplications()
        await fetchStats()
        setIsStatusOpen(false)
        setStatusNotes("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !interviewDate) return
    setIsSubmitting(true)

    try {
      const result = await scheduleInterview(
        selectedApplication.id,
        interviewDate,
        interviewNotes
      )

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Interview Scheduled",
          description: "Interview has been scheduled successfully"
        })
        await fetchApplications()
        await fetchStats()
        setIsInterviewOpen(false)
        setInterviewDate("")
        setInterviewNotes("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteApplication = async (id: string) => {
    try {
      const result = await deleteApplication(id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Application Deleted",
          description: "Application record deleted successfully"
        })
        await fetchApplications()
        await fetchStats()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive"
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    await handleDeleteApplication(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const uniquePositions = Array.from(new Set(applications.map(app => app.position_id)))
    .map(id => applications.find(app => app.position_id === id))
    .filter(Boolean)

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

  const statusBadge = (status: string) => (
    <AdminStatusBadge
      status={statusTone[status] ?? status}
      label={statusLabels[status] || status}
    />
  )

  const columns: AdminTableColumn<ApplicationWithPosition>[] = [
    {
      key: "candidate",
      header: "Candidate",
      render: (application) => (
        <AdminPrimaryCell
          icon={FileText}
          title={`${application.first_name} ${application.last_name}`}
          subtitle={application.email}
        />
      ),
    },
    {
      key: "position",
      header: "Position & Department",
      hidden: "sm",
      render: (application) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs sm:text-sm">{application.position_title}</span>
          <AdminMutedText>{application.position_department}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "experience",
      header: "Experience / Applied",
      hidden: "md",
      render: (application) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-xs">
            {application.experience_years ? `${application.experience_years} yrs exp` : "Not specified"}
          </span>
          <AdminMutedText className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {new Date(application.applied_at).toLocaleDateString()}
          </AdminMutedText>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (application) => statusBadge(application.status),
    },
  ]

  const actions: AdminTableAction<ApplicationWithPosition>[] = [
    {
      key: "view",
      label: "View Full Profile",
      icon: Eye,
      variant: "view",
      onClick: (application) => { setSelectedApplication(application); setIsViewOpen(true) },
    },
    {
      key: "edit",
      label: "Edit Application Status",
      icon: Edit,
      variant: "edit",
      onClick: (application) => {
        setSelectedApplication(application)
        setNewStatus(application.status as Application['status'])
        setIsStatusOpen(true)
      },
    },
    {
      key: "interview",
      label: "Schedule Interview",
      icon: CalendarDays,
      variant: "soft",
      mobile: false,
      hide: (application) => application.status === "interview_scheduled",
      onClick: (application) => { setSelectedApplication(application); setIsInterviewOpen(true) },
    },
    {
      key: "delete",
      label: "Delete Applicant",
      icon: Trash2,
      variant: "delete",
      onClick: (application) => setDeleteTarget(application),
    },
  ]

  if (loading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Applications"
        accent="Management"
        subtitle="Review candidate submissions, schedule interviews, and manage hiring pipeline"
        icon={UserCheck}
        onRefresh={() => { fetchApplications(); fetchStats(); }}
      />

      {stats && (
        <AdminStats
          columns={4}
          items={[
            { title: "Total Applications", value: formatStatNumber(stats.total || 0), icon: Users },
            { title: "Pending Review", value: formatStatNumber(stats.pending || 0), icon: Clock },
            { title: "Interviews", value: formatStatNumber(stats.interview_scheduled || 0), icon: Calendar },
            { title: "Hired", value: formatStatNumber(stats.hired || 0), icon: CheckCircle },
          ]}
        />
      )}

      <AdminFilterBar
        tabs={[
          { key: "all", label: "All Applications", icon: Users, count: applications.length },
          { key: "pending", label: "Pending", icon: Clock, count: applications.filter(a => a.status === "pending").length },
          { key: "reviewing", label: "Reviewing", icon: Eye, count: applications.filter(a => a.status === "reviewing").length },
          { key: "interview_scheduled", label: "Interview Scheduled", icon: Calendar, count: applications.filter(a => a.status === "interview_scheduled").length },
          { key: "interview_completed", label: "Interview Done", icon: ShieldCheck, count: applications.filter(a => a.status === "interview_completed").length },
          { key: "hired", label: "Hired", icon: CheckCircle, count: applications.filter(a => a.status === "hired").length },
          { key: "rejected", label: "Rejected", icon: XCircle, count: applications.filter(a => a.status === "rejected").length },
        ]}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by candidate name, email, or position..."
        selects={[
          {
            value: positionFilter,
            onValueChange: setPositionFilter,
            placeholder: "All Positions",
            allLabel: "All Positions",
            options: uniquePositions.map((position) => ({
              value: position!.position_id,
              label: position!.position_title,
            })),
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredApplications}
        rowKey={(application) => application.id}
        actions={actions}
        emptyIcon={Users}
        emptyTitle="No candidate applications found"
        emptyDescription="Try adjusting your position or status filters"
      />

      <AdminDetailModal
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        icon={FileText}
        title="Applicant Profile Details"
        subtitle="Candidate credentials, application timeline, and evaluation notes"
        badge={selectedApplication && statusBadge(selectedApplication.status)}
        onEdit={() => {
          if (!selectedApplication) return
          setNewStatus(selectedApplication.status as Application['status'])
          setIsViewOpen(false)
          setIsStatusOpen(true)
        }}
        editLabel="Update Status"
        onDelete={() => {
          if (!selectedApplication) return
          const target = selectedApplication
          setIsViewOpen(false)
          setDeleteTarget(target)
        }}
        sections={
          selectedApplication
            ? [
                {
                  key: "personal",
                  title: "Personal Information",
                  icon: Users,
                  fields: [
                    { label: "Candidate Name", value: `${selectedApplication.first_name} ${selectedApplication.last_name}` },
                    { label: "Email Address", value: selectedApplication.email },
                    { label: "Phone Number", value: selectedApplication.phone || "Not provided" },
                    { label: "Location", value: selectedApplication.location || "Not provided" },
                  ],
                },
                {
                  key: "position",
                  title: "Target Opening",
                  icon: Briefcase,
                  fields: [
                    { label: "Position", value: selectedApplication.position_title },
                    { label: "Department", value: selectedApplication.position_department },
                    { label: "Date Applied", value: new Date(selectedApplication.applied_at).toLocaleDateString() },
                    { label: "Current Status", value: statusBadge(selectedApplication.status) },
                  ],
                },
                {
                  key: "professional",
                  title: "Professional Background & Compensation",
                  icon: DollarSign,
                  fields: [
                    { label: "Years Experience", value: selectedApplication.experience_years ? `${selectedApplication.experience_years} years` : "Not specified" },
                    { label: "Availability", value: selectedApplication.availability_date ? new Date(selectedApplication.availability_date).toLocaleDateString() : "Immediate / Flexible" },
                    { label: "Current Salary", value: selectedApplication.current_salary || "Not disclosed" },
                    { label: "Expected Salary", value: selectedApplication.expected_salary || "Negotiable" },
                  ],
                },
                ...(selectedApplication.linkedin_url || selectedApplication.portfolio_url || selectedApplication.resume_url
                  ? [{
                      key: "links",
                      title: "External Profiles & Documents",
                      icon: ExternalLink,
                      fields: [
                        ...(selectedApplication.linkedin_url ? [{ label: "LinkedIn", value: (
                          <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-teal font-bold hover:underline flex items-center gap-1 text-xs break-all">
                            <Linkedin className="h-3 w-3 shrink-0" /> {selectedApplication.linkedin_url}
                          </a>
                        ) }] : []),
                        ...(selectedApplication.portfolio_url ? [{ label: "Portfolio / GitHub", value: (
                          <a href={selectedApplication.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-teal font-bold hover:underline flex items-center gap-1 text-xs break-all">
                            <ExternalLink className="h-3 w-3 shrink-0" /> {selectedApplication.portfolio_url}
                          </a>
                        ) }] : []),
                        ...(selectedApplication.resume_url ? [{ label: "Resume", value: (
                          <a href={selectedApplication.resume_url} target="_blank" rel="noopener noreferrer" className="text-teal font-bold hover:underline flex items-center gap-1 text-xs break-all">
                            <FileText className="h-3 w-3 shrink-0" /> View Resume
                          </a>
                        ) }] : []),
                      ],
                    }]
                  : []),
                ...(selectedApplication.cover_letter
                  ? [{
                      key: "cover-letter",
                      title: "Cover Letter",
                      icon: FileText,
                      span: 3 as const,
                      content: <p className="whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed">{selectedApplication.cover_letter}</p>,
                    }]
                  : []),
              ]
            : []
        }
        footerActions={
          selectedApplication && selectedApplication.status !== "interview_scheduled" ? (
            <button
              type="button"
              onClick={() => {
                const target = selectedApplication
                setIsViewOpen(false)
                setIsInterviewOpen(true)
                setSelectedApplication(target)
              }}
              className="bg-teal text-navy hover:bg-teal-400 font-bold rounded-xl h-10 px-5 gap-1.5 shadow-md inline-flex items-center"
            >
              <CalendarDays className="h-4 w-4" /> Schedule Interview
            </button>
          ) : undefined
        }
      />

      <AdminFormModal
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        icon={MessageSquare}
        title="Update Candidate Status"
        description={`Select hiring pipeline stage for ${selectedApplication?.first_name ?? ""} ${selectedApplication?.last_name ?? ""}`}
        onSubmit={(event) => {
          event.preventDefault()
          handleUpdateStatus(newStatus)
        }}
        isSubmitting={isSubmitting}
        createLabel="Save Status"
      >
        <AdminFormField label="Select Pipeline Stage (6 Stages)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STAGES.map((stage) => {
              const isSelected = newStatus === stage.key
              const Icon = stage.icon
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => setNewStatus(stage.key as Application['status'])}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all duration-150 flex flex-col justify-between cursor-pointer",
                    isSelected
                      ? isDark
                        ? "bg-teal/25 border-teal text-white shadow-md ring-2 ring-teal/30"
                        : "bg-navy text-white border-navy shadow-md ring-2 ring-navy/20"
                      : isDark
                        ? "bg-white/5 border-teal/20 text-slate-300 hover:bg-white/10 hover:border-teal/40"
                        : "bg-slate-50 border-navy/15 text-navy hover:bg-slate-100 hover:border-navy/40"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={cn("h-4 w-4 shrink-0", isSelected ? (isDark ? "text-teal-300" : "text-teal") : "text-muted-foreground")} />
                    {isSelected && <span className="w-2 h-2 rounded-full bg-teal shrink-0" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs leading-tight">{stage.label}</p>
                    <p className={cn("text-[10px] mt-0.5 leading-snug line-clamp-1", isSelected ? (isDark ? "text-teal-200/80" : "text-slate-200") : "text-muted-foreground")}>
                      {stage.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </AdminFormField>

        <AdminFormGrid className="sm:grid-cols-1">
          <AdminFormField label="Or Select From Dropdown">
            <AdminSelect
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as Application['status'])}
              options={STATUS_OPTIONS}
            />
          </AdminFormField>

          <AdminFormField label="Stage Notes (Optional)">
            <AdminTextarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add evaluation feedback or rationale..."
              rows={3}
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      <AdminFormModal
        open={isInterviewOpen}
        onOpenChange={setIsInterviewOpen}
        icon={CalendarDays}
        title="Schedule Interview"
        description={`Set interview date and send invitation to ${selectedApplication?.first_name ?? ""} ${selectedApplication?.last_name ?? ""}`}
        onSubmit={(event) => {
          event.preventDefault()
          handleScheduleInterview()
        }}
        isSubmitting={isSubmitting}
        createLabel="Schedule Interview"
      >
        <AdminFormField label="Interview Date & Time" required>
          <AdminInput
            type="datetime-local"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            required
          />
        </AdminFormField>

        <AdminFormField label="Interview Details / Video Link">
          <AdminTextarea
            value={interviewNotes}
            onChange={(e) => setInterviewNotes(e.target.value)}
            placeholder="Meeting links, interview panel members, or instructions..."
            rows={3}
          />
        </AdminFormField>
      </AdminFormModal>

      <AdminConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete applicant record?"
        description={`This will permanently delete the application submitted by ${deleteTarget?.first_name ?? ""} ${deleteTarget?.last_name ?? ""}. This action cannot be undone.`}
        confirmLabel="Delete Application"
        onConfirm={handleConfirmDelete}
        isSubmitting={isDeleting}
        destructive
      />
    </div>
  )
}
