"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Edit,
  Trash2,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  Eye,
  Layers,
  FileText,
  Plus,
  DollarSign,
} from "lucide-react"
import { getPositions, createPosition, updatePosition, deletePosition } from "@/lib/positions-actions"
import AdminLoading from "@/components/admin/admin-loading"
import type { Position } from "@/types/database"
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
} from "@/components/admin/ui"

interface PositionFormData {
  title: string
  department: string
  location: string
  employment_type: "full_time" | "part_time" | "contract" | "internship"
  experience_level: "entry" | "mid" | "senior" | "lead"
  salary_range: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  status: "open" | "closed" | "draft"
  remote_allowed: boolean
  featured: boolean
  application_deadline: string
  order_index: number
}

const EMPTY_FORM: PositionFormData = {
  title: "",
  department: "",
  location: "",
  employment_type: "full_time",
  experience_level: "mid",
  salary_range: "",
  description: "",
  requirements: [],
  responsibilities: [],
  benefits: [],
  status: "open",
  remote_allowed: false,
  featured: false,
  application_deadline: "",
  order_index: 0,
}

export default function PositionsManagement() {
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [viewingPosition, setViewingPosition] = useState<Position | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [positionToDelete, setPositionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<PositionFormData>(EMPTY_FORM)

  const resetForm = () => {
    setFormData(EMPTY_FORM)
    setSelectedPosition(null)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  // Load positions
  const loadPositions = async () => {
    try {
      setIsLoading(true)
      const result = await getPositions()
      if (result.error) throw new Error(result.error)
      setPositions(result.data || [])
      setFilteredPositions(result.data || [])
    } catch (error) {
      console.error("Error loading positions:", error)
      toast({
        title: "Error",
        description: "Failed to load positions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPositions()
  }, [])

  // Filter positions
  useEffect(() => {
    let filtered = positions

    if (searchTerm) {
      filtered = filtered.filter(
        (pos) =>
          pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pos.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pos.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pos.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((pos) => pos.status === statusFilter)
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((pos) => pos.department === departmentFilter)
    }

    setFilteredPositions(filtered)
  }, [positions, searchTerm, statusFilter, departmentFilter])

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createPosition(formData)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Position created successfully",
      })
      closeForm()
      loadPositions()
    } catch (error) {
      console.error("Error creating position:", error)
      toast({
        title: "Error",
        description: "Failed to create position",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPosition) return
    setIsSubmitting(true)

    try {
      const result = await updatePosition(selectedPosition.id, formData)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Position updated successfully",
      })
      closeForm()
      loadPositions()
    } catch (error) {
      console.error("Error updating position:", error)
      toast({
        title: "Error",
        description: "Failed to update position",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const performDeletePosition = async (id: string) => {
    setIsDeleting(true)
    try {
      const result = await deletePosition(id)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Position deleted successfully",
      })
      setPositionToDelete(null)
      setIsViewModalOpen(false)
      loadPositions()
    } catch (error) {
      console.error("Error deleting position:", error)
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const addRequirement = () =>
    setFormData((prev) => ({ ...prev, requirements: [...prev.requirements, ""] }))
  const updateRequirement = (index: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => (i === index ? value : req)),
    }))
  const removeRequirement = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }))

  const addResponsibility = () =>
    setFormData((prev) => ({ ...prev, responsibilities: [...prev.responsibilities, ""] }))
  const updateResponsibility = (index: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.map((resp, i) => (i === index ? value : resp)),
    }))
  const removeResponsibility = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }))

  const addBenefit = () =>
    setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, ""] }))
  const updateBenefit = (index: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((ben, i) => (i === index ? value : ben)),
    }))
  const removeBenefit = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }))

  const openCreateDialog = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditDialog = (position: Position) => {
    setSelectedPosition(position)
    setFormData({
      title: position.title,
      department: position.department,
      location: position.location,
      employment_type: position.employment_type,
      experience_level: position.experience_level,
      salary_range: position.salary_range || "",
      description: position.description || "",
      requirements: position.requirements || [],
      responsibilities: position.responsibilities || [],
      benefits: position.benefits || [],
      status: position.status,
      remote_allowed: position.remote_allowed,
      featured: position.featured,
      application_deadline: position.application_deadline || "",
      order_index: position.order_index,
    })
    setIsFormOpen(true)
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const departments = Array.from(new Set(positions.map((p) => p.department))).filter(Boolean)

  if (isLoading) {
    return <AdminLoading />
  }

  const totalPositions = positions.length
  const openPositions = positions.filter((p) => p.status === "open").length
  const closedPositions = positions.filter((p) => p.status === "closed").length
  const draftPositions = positions.filter((p) => p.status === "draft").length

  const formatNumber = (num: number) => {
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

  const columns: AdminTableColumn<Position>[] = [
    {
      key: "title",
      header: "Job Title",
      render: (position) => (
        <AdminPrimaryCell
          icon={Briefcase}
          title={position.title}
          subtitle={position.description || "No description provided"}
          badge={
            <>
              {position.featured && (
                <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0">
                  Featured
                </span>
              )}
              {position.remote_allowed && (
                <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-teal-400/20 text-teal shrink-0">
                  Remote
                </span>
              )}
            </>
          }
        />
      ),
    },
    {
      key: "department",
      header: "Department & Location",
      hidden: "sm",
      render: (position) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs sm:text-sm">{position.department}</span>
          <AdminMutedText className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {position.location}
          </AdminMutedText>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type / Level",
      hidden: "md",
      render: (position) => (
        <div className="flex flex-col gap-0.5">
          <span className="capitalize text-xs font-semibold">
            {position.employment_type.replace("_", " ")}
          </span>
          <AdminMutedText className="capitalize">
            {position.experience_level} level
          </AdminMutedText>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (position) => <AdminStatusBadge status={position.status} />,
    },
    {
      key: "salary",
      header: "Salary / Deadline",
      hidden: "lg",
      render: (position) => (
        <div className="flex flex-col gap-0.5">
          {position.salary_range ? (
            <span className="font-bold text-xs whitespace-nowrap">{position.salary_range}</span>
          ) : (
            <AdminMutedText>Undisclosed</AdminMutedText>
          )}
          {position.application_deadline && (
            <AdminMutedText className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(position.application_deadline)}
            </AdminMutedText>
          )}
        </div>
      ),
    },
  ]

  const actions: AdminTableAction<Position>[] = [
    {
      key: "view",
      label: "View Position Details",
      icon: Eye,
      variant: "view",
      onClick: (position) => {
        setViewingPosition(position)
        setIsViewModalOpen(true)
      },
    },
    {
      key: "edit",
      label: "Edit Position",
      icon: Edit,
      variant: "edit",
      onClick: openEditDialog,
    },
    {
      key: "delete",
      label: "Delete Position",
      icon: Trash2,
      variant: "delete",
      onClick: (position) => setPositionToDelete(position.id),
    },
  ]

  const listField = (
    label: string,
    items: string[] | undefined,
    icon: typeof Layers
  ) => ({
    key: label,
    title: label,
    icon,
    span: 2 as const,
    content:
      items && items.length > 0 ? (
        <ul className="space-y-2 text-xs opacity-90">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-80" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs opacity-60 italic">None specified.</p>
      ),
  })

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Position"
        accent="Management"
        subtitle="Manage company job openings, hiring criteria, and positions"
        icon={Briefcase}
        onRefresh={loadPositions}
        onAdd={openCreateDialog}
        addLabel="New Position"
      />

      <AdminStats
        columns={4}
        items={[
          { title: "Total Positions", value: formatNumber(totalPositions), icon: Users },
          { title: "Open Positions", value: formatNumber(openPositions), icon: CheckCircle },
          { title: "Closed Positions", value: formatNumber(closedPositions), icon: XCircle },
          { title: "Draft Positions", value: formatNumber(draftPositions), icon: Clock },
        ]}
      />

      <AdminFilterBar
        tabs={[
          { key: "all", label: "All Positions", icon: Briefcase, count: totalPositions },
          { key: "open", label: "Open", icon: CheckCircle, count: openPositions },
          { key: "closed", label: "Closed", icon: XCircle, count: closedPositions },
          { key: "draft", label: "Draft", icon: Clock, count: draftPositions },
        ]}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search positions by title, department, or location..."
        selects={[
          {
            value: departmentFilter,
            onValueChange: setDepartmentFilter,
            placeholder: "Department",
            allLabel: "All Departments",
            options: departments.map((dept) => ({ value: dept, label: dept })),
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredPositions}
        rowKey={(position) => position.id}
        actions={actions}
        onRowClick={(position) => {
          setViewingPosition(position)
          setIsViewModalOpen(true)
        }}
        emptyIcon={Users}
        emptyTitle="No positions found"
        emptyDescription="Try adjusting your department, status, or search filters"
      />

      <AdminFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
          else setIsFormOpen(true)
        }}
        icon={Briefcase}
        title={selectedPosition ? "Edit Position Details" : "Create New Position"}
        description={
          selectedPosition
            ? "Update job specifications, experience criteria, and status"
            : "Add a new job opening and hiring criteria to your careers portal"
        }
        onSubmit={selectedPosition ? handleUpdatePosition : handleCreatePosition}
        isSubmitting={isSubmitting}
        isEdit={!!selectedPosition}
        createLabel="Create Position"
        editLabel="Update Position"
        size="lg"
      >
        <AdminFormGrid>
          <AdminFormField label="Job Title" required>
            <AdminInput
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Fullstack Engineer"
              required
            />
          </AdminFormField>
          <AdminFormField label="Department" required>
            <AdminInput
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g. Software Engineering"
              required
            />
          </AdminFormField>
          <AdminFormField label="Location" required>
            <AdminInput
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Dar es Salaam / Remote"
              required
            />
          </AdminFormField>
          <AdminFormField label="Salary Range">
            <AdminInput
              value={formData.salary_range}
              onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              placeholder="e.g. TZS 3,000,000 - 5,000,000"
            />
          </AdminFormField>
          <AdminFormField label="Employment Type">
            <AdminSelect
              value={formData.employment_type}
              onValueChange={(value) =>
                setFormData({ ...formData, employment_type: value as PositionFormData["employment_type"] })
              }
              options={[
                { value: "full_time", label: "Full-time" },
                { value: "part_time", label: "Part-time" },
                { value: "contract", label: "Contract" },
                { value: "internship", label: "Internship" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Experience Level">
            <AdminSelect
              value={formData.experience_level}
              onValueChange={(value) =>
                setFormData({ ...formData, experience_level: value as PositionFormData["experience_level"] })
              }
              options={[
                { value: "entry", label: "Entry Level" },
                { value: "mid", label: "Mid Level" },
                { value: "senior", label: "Senior Level" },
                { value: "lead", label: "Lead" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Status">
            <AdminSelect
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as PositionFormData["status"] })
              }
              options={[
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </AdminFormField>
          <AdminFormField label="Display Order">
            <AdminInput
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 border-navy/10 dark:border-teal/20">
            <input
              type="checkbox"
              checked={formData.remote_allowed}
              onChange={(e) => setFormData({ ...formData, remote_allowed: e.target.checked })}
              className="rounded text-teal focus:ring-teal h-4 w-4"
            />
            <span className="text-xs font-bold">Remote Work Permitted</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 border-navy/10 dark:border-teal/20">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded text-teal focus:ring-teal h-4 w-4"
            />
            <span className="text-xs font-bold">Featured Priority Opening</span>
          </label>
        </div>

        <AdminFormField label="Job Description">
          <AdminTextarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe role objectives, daily tasks, and team alignment..."
            rows={3}
          />
        </AdminFormField>

        <AdminFormField label="Application Deadline">
          <AdminInput
            type="date"
            value={formData.application_deadline}
            onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
          />
        </AdminFormField>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider">Key Requirements</p>
            <Button type="button" variant="ghost" size="sm" onClick={addRequirement} className="text-xs font-bold text-teal">
              <Plus className="h-3 w-3 mr-1" /> Add Requirement
            </Button>
          </div>
          {formData.requirements.map((req, index) => (
            <div key={index} className="flex gap-2">
              <AdminInput
                value={req}
                onChange={(e) => updateRequirement(index, e.target.value)}
                placeholder="e.g. 3+ years experience with Next.js & TypeScript"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeRequirement(index)}
                className="rounded-xl border-2 text-brand-red hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider">Key Responsibilities</p>
            <Button type="button" variant="ghost" size="sm" onClick={addResponsibility} className="text-xs font-bold text-teal">
              <Plus className="h-3 w-3 mr-1" /> Add Responsibility
            </Button>
          </div>
          {formData.responsibilities.map((item, index) => (
            <div key={index} className="flex gap-2">
              <AdminInput
                value={item}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                placeholder="e.g. Build and maintain client applications"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeResponsibility(index)}
                className="rounded-xl border-2 text-brand-red hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider">Benefits</p>
            <Button type="button" variant="ghost" size="sm" onClick={addBenefit} className="text-xs font-bold text-teal">
              <Plus className="h-3 w-3 mr-1" /> Add Benefit
            </Button>
          </div>
          {formData.benefits.map((item, index) => (
            <div key={index} className="flex gap-2">
              <AdminInput
                value={item}
                onChange={(e) => updateBenefit(index, e.target.value)}
                placeholder="e.g. Health insurance"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeBenefit(index)}
                className="rounded-xl border-2 text-brand-red hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </AdminFormModal>

      <AdminDetailModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        icon={Briefcase}
        title={viewingPosition?.title || "Position Details"}
        subtitle={
          viewingPosition
            ? `Department: ${viewingPosition.department} • Type: ${viewingPosition.employment_type?.replace("-", " ") || "Full-time"} • Location: ${viewingPosition.location || "Dar es Salaam, Tanzania"}`
            : undefined
        }
        badge={viewingPosition && <AdminStatusBadge status={viewingPosition.status} />}
        size="xl"
        headerActions={
          viewingPosition && (
            <span className="bg-teal text-navy font-black text-xs px-3 py-1 rounded-lg whitespace-nowrap">
              {(viewingPosition as any).applications_count || 0} Applicants
            </span>
          )
        }
        sections={[
          {
            key: "summary",
            title: "Role Summary & Scope",
            icon: FileText,
            span: 2,
            content: (
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap opacity-90">
                {viewingPosition?.description || "No description provided for this opening."}
              </p>
            ),
          },
          listField("Key Responsibilities & Deliverables", viewingPosition?.responsibilities, Layers),
          listField("Qualifications & Competencies", viewingPosition?.requirements, Users),
          listField("Benefits", viewingPosition?.benefits, CheckCircle),
          {
            key: "attributes",
            title: "Role Attributes",
            icon: Clock,
            fields: [
              { label: "Department", value: viewingPosition?.department || "—" },
              {
                label: "Employment Type",
                value: (
                  <span className="capitalize">
                    {viewingPosition?.employment_type?.replace("-", " ") || "Full-time"}
                  </span>
                ),
              },
              { label: "Experience Level", value: viewingPosition?.experience_level || "Not specified" },
              { label: "Location", value: viewingPosition?.location || "Dar es Salaam" },
              { label: "Compensation", value: viewingPosition?.salary_range || "Undisclosed" },
              {
                label: "Remote Allowed",
                value: viewingPosition?.remote_allowed ? "Yes" : "No",
              },
              { label: "Featured", value: viewingPosition?.featured ? "Yes" : "No" },
              {
                label: "Deadline",
                value: viewingPosition?.application_deadline
                  ? formatDate(viewingPosition.application_deadline)
                  : "—",
              },
            ],
          },
          {
            key: "meta",
            title: "Record Metadata",
            icon: DollarSign,
            fields: [
              { label: "Position ID", value: viewingPosition?.id || "—" },
              { label: "Display Order", value: viewingPosition?.order_index ?? 0 },
              {
                label: "Applicants",
                value: (viewingPosition as any)?.applications_count || 0,
              },
            ],
          },
        ]}
        onEdit={() => {
          if (viewingPosition) {
            setIsViewModalOpen(false)
            openEditDialog(viewingPosition)
          }
        }}
        editLabel="Edit Opening"
        onDelete={() => {
          if (viewingPosition) setPositionToDelete(viewingPosition.id)
        }}
        deleteLabel="Delete Position"
      />

      <AdminConfirmDialog
        open={!!positionToDelete}
        onOpenChange={(open) => {
          if (!open) setPositionToDelete(null)
        }}
        title="Delete Position"
        description="Are you sure you want to delete this position? This action cannot be undone."
        confirmLabel="Delete Position"
        isSubmitting={isDeleting}
        onConfirm={() => {
          if (positionToDelete) performDeletePosition(positionToDelete)
        }}
      />
    </div>
  )
}
