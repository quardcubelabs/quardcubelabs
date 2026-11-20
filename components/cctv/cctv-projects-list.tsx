"use client"

import { useMemo, useState } from "react"
import {
  FolderKanban,
  Plus,
  FileText,
  Trash2,
  Edit,
  Eye,
  Building2,
  Camera,
  DollarSign,
  ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { CctvProject, CctvProjectItem } from "@/types/cctv"
import {
  AdminConfirmDialog,
  AdminDetailModal,
  AdminFilterBar,
  AdminMutedText,
  AdminPill,
  AdminPrimaryCell,
  AdminStatusBadge,
  AdminTable,
  type AdminDetailSectionData,
  type AdminTableAction,
  type AdminTableColumn,
} from "@/components/admin/ui"

interface CctvProjectsListProps {
  projects: CctvProject[]
  onNewProject: () => void
  onSelectProject: (project: CctvProject) => void
  onDeleteProject: (projectId: string) => Promise<void>
  onGenerateQuotation: (projectId: string) => Promise<any>
}

const statusOptions = [
  { value: "draft", label: "Drafts" },
  { value: "planning", label: "Planning" },
  { value: "quoted", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

const statusTabs = [
  { key: "all", label: "All Projects" },
  ...statusOptions.map((option) => ({ key: option.value, label: option.label })),
]

const projectItemColumns: AdminTableColumn<CctvProjectItem>[] = [
  { key: "name", header: "Item", render: (item) => <span className="font-bold">{item.name}</span> },
  { key: "category", header: "Category", render: (item) => <AdminPill title={item.category}>{item.category}</AdminPill> },
  { key: "type", header: "Type", hidden: "lg", render: (item) => <AdminMutedText className="capitalize">{item.item_type}</AdminMutedText> },
  { key: "quantity", header: "Qty", align: "right", render: (item) => <span className="font-mono font-bold">{item.quantity}</span> },
  { key: "unitPrice", header: "Unit Price", align: "right", render: (item) => <span className="font-mono">{item.unit_price.toLocaleString()}</span> },
  { key: "subtotal", header: "Subtotal", align: "right", render: (item) => <span className="font-mono font-bold">{item.subtotal.toLocaleString()}</span> },
]

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—"

export default function CctvProjectsList({
  projects,
  onNewProject,
  onSelectProject,
  onDeleteProject,
  onGenerateQuotation,
}: CctvProjectsListProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProject, setSelectedProject] = useState<CctvProject | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CctvProject | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesSearch =
      (project.site_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.quotation_number || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  }), [projects, searchTerm, statusFilter])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      maximumFractionDigits: 0,
    }).format(val || 0).replace("TZS", "TZS ")

  const handleQuotation = async (project: CctvProject) => {
    setIsGenerating(true)
    try {
      await onGenerateQuotation(project.id)
      toast({
        title: project.quotation_number ? "Quotation Updated" : "Quotation Generated",
        description: `${project.project_number} is linked to an official quotation.`,
      })
    } catch (err: any) {
      toast({
        title: "Quotation Failed",
        description: err.message || "Failed to generate the quotation.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const columns: AdminTableColumn<CctvProject>[] = [
    {
      key: "project",
      header: "Project / Site",
      render: (project) => (
        <AdminPrimaryCell
          icon={FolderKanban}
          title={project.project_number}
          subtitle={project.site_name}
        />
      ),
    },
    {
      key: "customer",
      header: "Customer",
      hidden: "md",
      render: (project) => (
        <div className="min-w-0">
          <span className="font-bold block truncate">{project.customer_name}</span>
          <AdminMutedText className="text-[10px] truncate block">{project.customer_email}</AdminMutedText>
        </div>
      ),
    },
    {
      key: "cameras",
      header: "Cameras",
      align: "center",
      render: (project) => {
        const cameraCount = project.camera_count || project.items?.filter((item) => item.category === "Cameras").reduce((sum, item) => sum + item.quantity, 0) || 0
        return <AdminPill>{cameraCount} Points</AdminPill>
      },
    },
    {
      key: "system",
      header: "System",
      hidden: "lg",
      render: (project) => <AdminMutedText>{project.recording_type}</AdminMutedText>,
    },
    {
      key: "quotation",
      header: "Quotation",
      hidden: "lg",
      render: (project) => project.quotation_number
        ? <AdminPill title={project.quotation_number}>{project.quotation_number}</AdminPill>
        : <AdminMutedText>Not generated</AdminMutedText>,
    },
    {
      key: "value",
      header: "Project Value",
      align: "right",
      render: (project) => <span className="font-mono font-black whitespace-nowrap">{formatCurrency(project.grand_total)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (project) => <AdminStatusBadge status={project.status} />,
    },
  ]

  const actions: AdminTableAction<CctvProject>[] = [
    {
      key: "view",
      label: "View Project Details",
      icon: Eye,
      variant: "view",
      onClick: (project) => setSelectedProject(project),
    },
    {
      key: "edit",
      label: "Open Project Designer",
      icon: Edit,
      variant: "edit",
      onClick: (project) => onSelectProject(project),
    },
    {
      key: "quotation",
      label: "Generate / Update Quotation",
      icon: FileText,
      variant: "soft",
      mobile: false,
      onClick: (project) => handleQuotation(project),
    },
    {
      key: "delete",
      label: "Delete Project",
      icon: Trash2,
      variant: "danger-soft",
      mobile: false,
      onClick: (project) => setPendingDelete(project),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedProject
    ? [
        {
          key: "identity",
          title: "Project Identity",
          icon: FolderKanban,
          fields: [
            { label: "Project Number", value: selectedProject.project_number },
            { label: "Status", value: <AdminStatusBadge status={selectedProject.status} /> },
            { label: "Project Type", value: selectedProject.project_type },
            { label: "Site Name", value: selectedProject.site_name },
            { label: "Created", value: formatDate(selectedProject.created_at) },
            { label: "Updated", value: formatDate(selectedProject.updated_at) },
          ],
        },
        {
          key: "customer",
          title: "Customer",
          icon: Building2,
          fields: [
            { label: "Customer Name", value: selectedProject.customer_name },
            { label: "Email", value: selectedProject.customer_email || "—" },
            { label: "Phone", value: selectedProject.customer_phone || "—" },
            { label: "Address", value: selectedProject.customer_address || "—" },
            { label: "Created By", value: selectedProject.created_by || "—" },
          ],
        },
        {
          key: "system",
          title: "System Specification",
          icon: Camera,
          fields: [
            { label: "Cameras", value: selectedProject.camera_count },
            { label: "Recording Type", value: selectedProject.recording_type },
            { label: "Recommended NVR", value: selectedProject.recommended_nvr || "—" },
            { label: "Storage (TB)", value: selectedProject.recommended_storage_tb ?? "—" },
            { label: "Retention (Days)", value: selectedProject.retention_days ?? "—" },
            { label: "Cable (Meters)", value: selectedProject.total_cable_meters ?? "—" },
          ],
        },
        {
          key: "financials",
          title: "Financial Breakdown (TZS)",
          icon: DollarSign,
          fields: [
            { label: "Equipment Cost", value: selectedProject.equipment_cost.toLocaleString() },
            { label: "Services Cost", value: selectedProject.services_cost.toLocaleString() },
            { label: "Discount", value: selectedProject.discount_amount.toLocaleString() },
            { label: `VAT (${selectedProject.tax_rate_percent}%)`, value: selectedProject.tax_amount.toLocaleString() },
            { label: "Grand Total", value: <span className="font-mono font-black">{formatCurrency(selectedProject.grand_total)}</span> },
          ],
        },
        {
          key: "linked",
          title: "Linked Documents",
          icon: FileText,
          fields: [
            { label: "Source Survey ID", value: selectedProject.site_survey_id || "—" },
            { label: "Quotation Number", value: selectedProject.quotation_number || "—" },
            { label: "Quotation ID", value: selectedProject.quotation_id || "—" },
            { label: "Sales Order ID", value: selectedProject.sales_order_id || "—" },
            { label: "Invoice ID", value: selectedProject.invoice_id || "—" },
          ],
        },
        {
          key: "notes",
          title: "Project Notes",
          icon: ListChecks,
          span: 2,
          content: (
            <p className="text-xs leading-relaxed whitespace-pre-wrap">
              {selectedProject.notes || "No project notes recorded."}
            </p>
          ),
        },
        {
          key: "items",
          title: "Equipment & Services",
          icon: ListChecks,
          span: 3,
          content: (
            <AdminTable
              columns={projectItemColumns}
              data={selectedProject.items || []}
              rowKey={(item) => item.id}
              emptyTitle="No line items added"
              emptyDescription="Open the project designer to add equipment and services."
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
            <FolderKanban className="h-6 w-6 text-blue-500" />
            CCTV Engineering Projects
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage system architecture designs, equipment bills of material, and linked quotations
          </p>
        </div>
        <Button
          onClick={onNewProject}
          className="bg-teal hover:bg-teal-400 text-navy font-black text-xs px-5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Create CCTV Project</span>
        </Button>
      </div>

      <AdminFilterBar
        tabs={statusTabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          count: tab.key === "all"
            ? projects.length
            : projects.filter((project) => project.status === tab.key).length,
        }))}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by site name, customer, project #, quotation #..."
      />

      <AdminTable
        columns={columns}
        data={filteredProjects}
        rowKey={(project) => project.id}
        actions={actions}
        emptyIcon={FolderKanban}
        emptyTitle="No CCTV Projects Found"
        emptyDescription={searchTerm || statusFilter !== "all"
          ? "No projects matched your search criteria."
          : "Design your first CCTV project from scratch or convert a completed site survey."}
      />

      <AdminDetailModal
        open={!!selectedProject}
        onOpenChange={(open) => { if (!open) setSelectedProject(null) }}
        icon={FolderKanban}
        title={selectedProject?.project_number || "CCTV Project"}
        subtitle={selectedProject ? `${selectedProject.site_name} • ${selectedProject.customer_name}` : undefined}
        badge={selectedProject && <AdminStatusBadge status={selectedProject.status} />}
        sections={detailSections}
        size="xl"
        onEdit={selectedProject ? () => onSelectProject(selectedProject) : undefined}
        editLabel="Open Designer"
        footerActions={selectedProject && (
          <Button
            type="button"
            disabled={isGenerating}
            onClick={() => handleQuotation(selectedProject)}
            className="bg-teal hover:bg-teal-400 text-navy font-bold rounded-xl h-10 px-5"
          >
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : selectedProject.quotation_number ? "Update Quotation" : "Generate Quotation"}
          </Button>
        )}
      />

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title="Delete CCTV Project?"
        description={pendingDelete
          ? `${pendingDelete.project_number} — ${pendingDelete.site_name} will be permanently removed.`
          : undefined}
        confirmLabel="Delete Project"
        onConfirm={async () => {
          if (!pendingDelete) return
          await onDeleteProject(pendingDelete.id)
          if (selectedProject?.id === pendingDelete.id) setSelectedProject(null)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}
