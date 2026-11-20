"use client"

import { useMemo, useState } from "react"
import {
  FileText,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Edit,
  Eye,
  Building2,
  MapPin,
  Camera,
  BatteryCharging,
  ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CctvSiteSurvey, CctvSiteSurveyItem } from "@/types/cctv"
import {
  AdminBooleanBadge,
  AdminConfirmDialog,
  AdminDetailModal,
  AdminFilterBar,
  AdminMutedText,
  AdminPill,
  AdminPrimaryCell,
  AdminStatusBadge,
  AdminTable,
  AdminTag,
  type AdminDetailSectionData,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/ui"

interface CctvSurveysListProps {
  surveys: CctvSiteSurvey[]
  onNewSurvey: () => void
  onEditSurvey: (survey: CctvSiteSurvey) => void
  onConvertToProject: (surveyId: string) => Promise<void>
  onDeleteSurvey: (surveyId: string) => Promise<void>
  onPrintSurvey: (survey: CctvSiteSurvey) => void
}

const statusOptions = [
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "converted_to_project", label: "Converted to Project" },
]

const statusTabs = [
  { key: "all", label: "All Surveys" },
  ...statusOptions.map((option) => ({ key: option.value, label: option.label })),
]

const surveyItemColumns: AdminTableColumn<CctvSiteSurveyItem>[] = [
  { key: "location", header: "Location", render: (item) => <span className="font-bold">{item.location_name}</span> },
  { key: "area", header: "Area Type", render: (item) => <AdminPill title={item.area_type}>{item.area_type}</AdminPill> },
  {
    key: "camera",
    header: "Camera Spec",
    cellClassName: "max-w-[220px]",
    render: (item) => (
      <AdminMutedText className="line-clamp-1">
        {item.indoor_outdoor} • {item.camera_type} • {item.required_resolution}
      </AdminMutedText>
    ),
  },
  {
    key: "features",
    header: "Requirements",
    hidden: "lg",
    render: (item) => (
      <div className="flex flex-wrap gap-1">
        {item.night_vision_required && <AdminTag>Night Vision</AdminTag>}
        {item.colorvu_required && <AdminTag>ColorVu</AdminTag>}
        {item.audio_required && <AdminTag>Audio</AdminTag>}
        {item.ptz_required && <AdminTag>PTZ</AdminTag>}
        {item.varifocal_required && <AdminTag>Varifocal</AdminTag>}
        {item.analytics_required && <AdminTag>AcuSense</AdminTag>}
      </div>
    ),
  },
  { key: "quantity", header: "Qty", align: "right", render: (item) => <span className="font-mono font-bold">{item.quantity}</span> },
  {
    key: "cable",
    header: "Cable (m)",
    align: "right",
    render: (item) => <span className="font-mono">{item.estimated_cable_length_meters}</span>,
  },
]

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—"

export default function CctvSurveysList({
  surveys,
  onNewSurvey,
  onEditSurvey,
  onConvertToProject,
  onDeleteSurvey,
  onPrintSurvey,
}: CctvSurveysListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isConverting, setIsConverting] = useState<string | null>(null)
  const [selectedSurvey, setSelectedSurvey] = useState<CctvSiteSurvey | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CctvSiteSurvey | null>(null)

  const filteredSurveys = useMemo(() => surveys.filter((survey) => {
    const matchesSearch =
      (survey.site_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.survey_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.site_address || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || survey.status === statusFilter
    return matchesSearch && matchesStatus
  }), [surveys, searchTerm, statusFilter])

  const handleConvert = async (surveyId: string) => {
    setIsConverting(surveyId)
    try {
      await onConvertToProject(surveyId)
      toast({
        title: "Project Generated",
        description: "Site survey successfully converted to a CCTV Project with equipment and cable calculations.",
      })
    } catch (err: any) {
      toast({
        title: "Conversion Failed",
        description: err.message || "Failed to convert survey to project.",
        variant: "destructive",
      })
    } finally {
      setIsConverting(null)
    }
  }

  const columns: AdminTableColumn<CctvSiteSurvey>[] = [
    {
      key: "survey",
      header: "Survey / Site",
      render: (survey) => (
        <AdminPrimaryCell
          icon={FileText}
          title={survey.survey_number}
          subtitle={survey.site_name}
        />
      ),
    },
    {
      key: "customer",
      header: "Customer",
      hidden: "md",
      render: (survey) => (
        <div className="min-w-0">
          <span className="font-bold block truncate">{survey.customer_name}</span>
          <AdminMutedText className="text-[10px] truncate block">{survey.customer_email}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "address",
      header: "Site Address",
      hidden: "lg",
      cellClassName: "max-w-[200px]",
      render: (survey) => <AdminMutedText className="line-clamp-1">{survey.site_address}</AdminMutedText>,
    },
    {
      key: "cameras",
      header: "Cameras",
      align: "center",
      render: (survey) => {
        const cameraCount = survey.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || survey.estimated_camera_count || 0
        return <AdminPill>{cameraCount} Points</AdminPill>
      },
    },
    {
      key: "building",
      header: "Building",
      hidden: "lg",
      render: (survey) => <AdminMutedText className="capitalize">{survey.building_type}</AdminMutedText>,
    },
    {
      key: "status",
      header: "Status",
      render: (survey) => <AdminStatusBadge status={survey.status} />,
    },
    {
      key: "created",
      header: "Created",
      hidden: "md",
      render: (survey) => <AdminMutedText className="font-mono whitespace-nowrap">{formatDate(survey.created_at)}</AdminMutedText>,
    },
  ]

  const actions: AdminTableAction<CctvSiteSurvey>[] = [
    {
      key: "view",
      label: "View Survey Details",
      icon: Eye,
      variant: "view",
      onClick: (survey) => setSelectedSurvey(survey),
    },
    {
      key: "edit",
      label: "Edit Survey",
      icon: Edit,
      variant: "edit",
      onClick: (survey) => onEditSurvey(survey),
    },
    {
      key: "print",
      label: "Print / Export Survey",
      icon: Printer,
      variant: "soft",
      mobile: false,
      onClick: (survey) => onPrintSurvey(survey),
    },
    {
      key: "convert",
      label: "Convert to CCTV Project",
      icon: Sparkles,
      variant: "soft",
      mobile: false,
      hide: (survey) => survey.status === "converted_to_project",
      onClick: (survey) => handleConvert(survey.id),
    },
    {
      key: "delete",
      label: "Delete Survey",
      icon: Trash2,
      variant: "danger-soft",
      mobile: false,
      onClick: (survey) => setPendingDelete(survey),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedSurvey
    ? [
        {
          key: "identity",
          title: "Survey Identity",
          icon: FileText,
          fields: [
            { label: "Survey Number", value: selectedSurvey.survey_number },
            { label: "Status", value: <AdminStatusBadge status={selectedSurvey.status} /> },
            { label: "Survey Date", value: formatDate(selectedSurvey.survey_date) },
            { label: "Technician", value: selectedSurvey.technician_name || "—" },
            { label: "Created", value: formatDate(selectedSurvey.created_at) },
            { label: "Updated", value: formatDate(selectedSurvey.updated_at) },
          ],
        },
        {
          key: "customer",
          title: "Customer",
          icon: Building2,
          fields: [
            { label: "Customer Name", value: selectedSurvey.customer_name },
            { label: "Email", value: selectedSurvey.customer_email || "—" },
            { label: "Phone", value: selectedSurvey.customer_phone || "—" },
            { label: "Address", value: selectedSurvey.customer_address || "—" },
          ],
        },
        {
          key: "site",
          title: "Site Assessment",
          icon: MapPin,
          fields: [
            { label: "Site Name", value: selectedSurvey.site_name },
            { label: "Site Address", value: selectedSurvey.site_address || "—" },
            { label: "Building Type", value: selectedSurvey.building_type },
            { label: "Buildings", value: selectedSurvey.number_of_buildings },
            { label: "Floors", value: selectedSurvey.number_of_floors },
            { label: "Environment", value: selectedSurvey.environment },
            { label: "Estimated Cameras", value: selectedSurvey.estimated_camera_count },
          ],
        },
        {
          key: "infrastructure",
          title: "Infrastructure & Power",
          icon: BatteryCharging,
          fields: [
            { label: "Internet Available", value: <AdminBooleanBadge value={selectedSurvey.internet_available} /> },
            { label: "Internet Speed", value: selectedSurvey.internet_speed_mbps ? `${selectedSurvey.internet_speed_mbps} Mbps` : "—" },
            { label: "Remote Viewing", value: <AdminBooleanBadge value={selectedSurvey.remote_viewing_required} /> },
            { label: "Existing CCTV", value: <AdminBooleanBadge value={selectedSurvey.existing_cctv} /> },
            { label: "Existing CCTV Details", value: selectedSurvey.existing_cctv_details || "—" },
            { label: "Existing NVR / DVR", value: <AdminBooleanBadge value={selectedSurvey.existing_nvr_dvr} /> },
            { label: "Existing Network", value: <AdminBooleanBadge value={selectedSurvey.existing_network} /> },
            { label: "Power Available", value: <AdminBooleanBadge value={selectedSurvey.power_available} /> },
            { label: "UPS Required", value: <AdminBooleanBadge value={selectedSurvey.ups_required} /> },
            { label: "Monitor Required", value: <AdminBooleanBadge value={selectedSurvey.monitor_required} /> },
          ],
        },
        {
          key: "notes",
          title: "Requirements & Notes",
          icon: ListChecks,
          span: 2,
          fields: [
            { label: "Special Requirements", value: selectedSurvey.special_requirements || "—" },
            { label: "Notes", value: selectedSurvey.notes || "—" },
            { label: "Linked Project ID", value: selectedSurvey.project_id || "—" },
          ],
        },
        {
          key: "cameras",
          title: "Camera Locations",
          icon: Camera,
          span: 3,
          content: (
            <AdminTable
              columns={surveyItemColumns}
              data={selectedSurvey.items || []}
              rowKey={(item) => item.id}
              emptyTitle="No camera locations captured"
              emptyDescription="Add camera points during the site survey to see them here."
            />
          ),
        },
      ]
    : []

  return (
    <div className="space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal" />
            CCTV Site Surveys
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage physical site inspection reports, camera location requirements, and infrastructure assessments
          </p>
        </div>
        <Button
          onClick={onNewSurvey}
          className="bg-teal hover:bg-teal-400 text-navy font-black text-xs px-5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ New Site Survey</span>
        </Button>
      </div>

      {/* Shared filter bar with status chips */}
      <AdminFilterBar
        tabs={statusTabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          count: tab.key === "all"
            ? surveys.length
            : surveys.filter((survey) => survey.status === tab.key).length,
        }))}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by site name, customer, survey number..."
      />

      <AdminTable
        columns={columns}
        data={filteredSurveys}
        rowKey={(survey) => survey.id}
        actions={actions}
        emptyIcon={FileText}
        emptyTitle="No Site Surveys Found"
        emptyDescription={searchTerm || statusFilter !== "all"
          ? "No surveys matched your search criteria. Try clearing the filter."
          : "Perform your first on-site survey to map camera angles, cable distances, and power availability."}
      />

      <AdminDetailModal
        open={!!selectedSurvey}
        onOpenChange={(open) => { if (!open) setSelectedSurvey(null) }}
        icon={FileText}
        title={selectedSurvey?.survey_number || "Site Survey"}
        subtitle={selectedSurvey ? `${selectedSurvey.site_name} • ${selectedSurvey.customer_name}` : undefined}
        badge={selectedSurvey && <AdminStatusBadge status={selectedSurvey.status} />}
        sections={detailSections}
        size="xl"
        onEdit={selectedSurvey ? () => onEditSurvey(selectedSurvey) : undefined}
        footerActions={selectedSurvey && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onPrintSurvey(selectedSurvey)}
              className="rounded-xl font-bold h-10 px-5"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Survey
            </Button>
            {selectedSurvey.status !== "converted_to_project" && (
              <Button
                type="button"
                disabled={isConverting === selectedSurvey.id}
                onClick={() => handleConvert(selectedSurvey.id)}
                className="bg-teal hover:bg-teal-400 text-navy font-bold rounded-xl h-10 px-5"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isConverting === selectedSurvey.id ? "Converting..." : "Convert to Project"}
              </Button>
            )}
          </>
        )}
      />

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete Site Survey?"
        description={pendingDelete
          ? `${pendingDelete.survey_number} — ${pendingDelete.site_name} will be permanently removed.`
          : undefined}
        confirmLabel="Delete Survey"
        onConfirm={async () => {
          if (!pendingDelete) return
          await onDeleteSurvey(pendingDelete.id)
          if (selectedSurvey?.id === pendingDelete.id) setSelectedSurvey(null)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
