"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import AdminLoading from "@/components/admin/admin-loading"
import {
  AdminPageHeader,
  AdminStats,
  AdminFilterBar,
  AdminTable,
  AdminPrimaryCell,
  AdminPill,
  AdminTag,
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
  type AdminFilterTab,
  type AdminDetailSectionData,
} from "@/components/admin/ui"
import {
  FolderOpen,
  FolderKanban,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  Edit,
  Trash2,
  ExternalLink,
  XCircle,
  Code,
  Calendar,
  Globe,
  Github,
  Eye,
} from "lucide-react"
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/projects-actions"
import type { Project, ProjectFormData } from "@/types/database"

const EMPTY_FORM: ProjectFormData = {
  title: "",
  client: "",
  description: "",
  short_description: "",
  technologies: [],
  category: "web-app",
  status: "completed",
  project_url: "",
  github_url: "",
  image_url: "",
  start_date: "",
  end_date: "",
  budget: 0,
  team_size: 1,
  featured: false,
  order_index: 0,
  meta_title: "",
  meta_description: "",
  challenge: "",
  solution: "",
}

const CATEGORIES = [
  "web-app",
  "mobile-app",
  "desktop-app",
  "cloud-solution",
  "hardware",
  "iot",
  "consulting",
]

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
}))

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProjectFormData>(EMPTY_FORM)

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getProjects()
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" })
      } else {
        setProjects(data || [])
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const projectData: Omit<Project, "id" | "created_at" | "updated_at"> = {
        title: formData.title,
        client: formData.client || "",
        description: formData.description || "",
        short_description: formData.short_description || "",
        technologies: (formData.technologies || []).filter((t) => t.trim() !== ""),
        category: formData.category,
        status: formData.status,
        project_url: formData.project_url || "",
        github_url: formData.github_url || "",
        image_url: formData.image_url || "",
        start_date: formData.start_date || "",
        end_date: formData.end_date || "",
        budget: Number(formData.budget) || 0,
        team_size: Number(formData.team_size) || 1,
        featured: Boolean(formData.featured),
        order_index: Number(formData.order_index) || 0,
        meta_title: formData.meta_title || "",
        meta_description: formData.meta_description || "",
        challenge: formData.challenge || "",
        solution: formData.solution || "",
      }

      const result = editingProject
        ? await updateProject(editingProject.id, projectData)
        : await createProject(projectData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: `Project ${editingProject ? "updated" : "created"} successfully!`,
        })
        await loadProjects()
        closeFormModal()
      }
    } catch (error) {
      console.error("Error submitting project:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)

    try {
      const result = await deleteProject(target.id)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({ title: "Success", description: "Project deleted successfully!" })
        setIsViewModalOpen(false)
        setSelectedProject(null)
        await loadProjects()
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      client: project.client || "",
      description: project.description || "",
      short_description: project.short_description || "",
      technologies: project.technologies || [],
      category: project.category,
      status: project.status,
      project_url: project.project_url || "",
      github_url: project.github_url || "",
      image_url: project.image_url || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      budget: project.budget || 0,
      team_size: project.team_size || 1,
      featured: project.featured || false,
      order_index: project.order_index || 0,
      meta_title: project.meta_title || "",
      meta_description: project.meta_description || "",
      challenge: project.challenge || "",
      solution: project.solution || "",
    })
    setIsCreateModalOpen(true)
  }

  const closeFormModal = () => {
    setIsCreateModalOpen(false)
    setEditingProject(null)
    setFormData(EMPTY_FORM)
  }

  const addTechnology = () => {
    setFormData((prev) => ({
      ...prev,
      technologies: [...(prev.technologies || []), ""],
    }))
  }

  const updateTechnology = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      technologies: (prev.technologies || []).map((t, i) => (i === index ? value : t)),
    }))
  }

  const removeTechnology = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      technologies: (prev.technologies || []).filter((_, i) => i !== index),
    }))
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getClientAbbreviation = (client: string) => {
    if (!client || !client.trim()) return "—"
    const cleaned = client.trim()
    const words = cleaned.split(/[\s-_]+/)
    if (words.length > 1) {
      return words.map((w) => w[0]).join("").toUpperCase().slice(0, 4)
    }
    return cleaned.slice(0, 4).toUpperCase()
  }

  const getCategoryAbbreviation = (cat: string) => {
    if (!cat) return "—"
    const map: Record<string, string> = {
      "web-app": "WEB",
      "mobile-app": "MOB",
      "desktop-app": "DESK",
      "cloud-solution": "CLOUD",
      hardware: "HW",
      iot: "IOT",
      consulting: "CONS",
    }
    return map[cat] || cat.toUpperCase().slice(0, 4)
  }

  const tabs: AdminFilterTab[] = [
    { key: "all", label: "All Projects", icon: FolderOpen, count: projects.length },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle,
      count: projects.filter((p) => p.status === "completed").length,
    },
    {
      key: "in_progress",
      label: "In Progress",
      icon: Clock,
      count: projects.filter((p) => p.status === "in_progress").length,
    },
    {
      key: "planned",
      label: "Planned",
      icon: Calendar,
      count: projects.filter((p) => p.status === "planned").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      icon: XCircle,
      count: projects.filter((p) => p.status === "cancelled").length,
    },
  ]

  const columns: AdminTableColumn<Project>[] = [
    {
      key: "project",
      header: "Project",
      cellClassName: "max-w-[130px] sm:max-w-xs",
      render: (project) => (
        <AdminPrimaryCell
          icon={FolderOpen}
          title={project.title}
          href={`/admin/projects/${project.id}`}
          subtitle={project.short_description || project.description || "No description provided"}
          badge={
            project.featured ? (
              <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0">
                Featured
              </span>
            ) : undefined
          }
        />
      ),
    },
    {
      key: "client",
      header: "Client",
      hidden: "sm",
      render: (project) =>
        project.client ? (
          <AdminPill title={project.client}>{getClientAbbreviation(project.client)}</AdminPill>
        ) : (
          <AdminMutedText>—</AdminMutedText>
        ),
    },
    {
      key: "category",
      header: "Cat",
      hidden: "md",
      render: (project) => (
        <AdminPill
          title={project.category}
          className="font-black"
        >
          {getCategoryAbbreviation(project.category)}
        </AdminPill>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (project) => <AdminStatusBadge status={project.status} />,
    },
    {
      key: "technologies",
      header: "Tech",
      hidden: "lg",
      render: (project) =>
        project.technologies && project.technologies.length > 0 ? (
          <div className="flex items-center flex-wrap gap-1">
            {project.technologies.slice(0, 2).map((tech, index) => (
              <AdminTag key={index} title={tech}>
                {tech}
              </AdminTag>
            ))}
            {project.technologies.length > 2 && (
              <span
                className="text-[10px] sm:text-[11px] font-black w-5 h-5 rounded-full inline-flex items-center justify-center border bg-teal/10 border-teal/20 text-teal dark:bg-white/10 dark:border-white/20 dark:text-white"
                title={project.technologies.slice(2).join(", ")}
              >
                +{project.technologies.length - 2}
              </span>
            )}
          </div>
        ) : (
          <AdminMutedText>—</AdminMutedText>
        ),
    },
  ]

  const actions: AdminTableAction<Project>[] = [
    {
      key: "view",
      label: "View Project Details",
      icon: Eye,
      variant: "view",
      onClick: (project) => {
        setSelectedProject(project)
        setIsViewModalOpen(true)
      },
    },
    {
      key: "live",
      label: "Open Live Project",
      icon: ExternalLink,
      variant: "soft",
      mobile: false,
      external: true,
      hide: (project) => !project.project_url,
      href: (project) => project.project_url as string,
    },
    {
      key: "edit",
      label: "Edit Project",
      icon: Edit,
      variant: "edit",
      onClick: handleEdit,
    },
    {
      key: "delete",
      label: "Delete Project",
      icon: Trash2,
      variant: "delete",
      onClick: (project) => setDeleteTarget(project),
    },
  ]

  const detailSections: AdminDetailSectionData[] = selectedProject
    ? [
        {
          key: "scope",
          title: "Project Summary & Scope",
          icon: Layers,
          span: 2,
          content: (
            <div className="space-y-3">
              {selectedProject.short_description && (
                <p className="text-sm font-semibold opacity-90 leading-relaxed">
                  {selectedProject.short_description}
                </p>
              )}
              <p className="text-xs leading-relaxed opacity-80 whitespace-pre-wrap">
                {selectedProject.description || "No extended scope description registered."}
              </p>
            </div>
          ),
        },
        ...(selectedProject.challenge || selectedProject.solution
          ? [
              {
                key: "engineering",
                title: "Engineering Challenge & Solution",
                icon: Code,
                span: 2 as const,
                content: (
                  <div className="space-y-3">
                    {selectedProject.challenge && (
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-1">
                          Architectural Challenge
                        </h4>
                        <p className="text-xs leading-relaxed opacity-90">
                          {selectedProject.challenge}
                        </p>
                      </div>
                    )}
                    {selectedProject.solution && (
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider opacity-70 mb-1">
                          Engineered Solution
                        </h4>
                        <p className="text-xs leading-relaxed opacity-90">
                          {selectedProject.solution}
                        </p>
                      </div>
                    )}
                  </div>
                ),
              },
            ]
          : []),
        {
          key: "technologies",
          title: `Technologies & Frameworks (${selectedProject.technologies?.length || 0})`,
          icon: Code,
          span: 2,
          content: (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedProject.technologies && selectedProject.technologies.length > 0 ? (
                selectedProject.technologies.map((tech, idx) => (
                  <Badge
                    key={idx}
                    className="font-bold text-xs px-2.5 py-1 rounded-lg bg-navy text-white dark:bg-teal dark:text-navy dark:font-black"
                  >
                    {tech}
                  </Badge>
                ))
              ) : (
                <span className="text-xs opacity-60">No technologies listed.</span>
              )}
            </div>
          ),
        },
        {
          key: "timeline",
          title: "Timeline & Delivery",
          icon: Calendar,
          span: 1,
          fields: [
            { label: "Client", value: selectedProject.client || "Internal" },
            { label: "Team Allocation", value: `${selectedProject.team_size || 1} Engineer(s)` },
            {
              label: "Start Date",
              value: selectedProject.start_date
                ? new Date(selectedProject.start_date).toLocaleDateString()
                : "—",
            },
            {
              label: "Completion Date",
              value: selectedProject.end_date
                ? new Date(selectedProject.end_date).toLocaleDateString()
                : "—",
            },
            ...(selectedProject.budget && selectedProject.budget > 0
              ? [
                  {
                    label: "Budget",
                    value: (
                      <span className="font-mono font-black text-sm">
                        TSH {Number(selectedProject.budget).toLocaleString()}
                      </span>
                    ),
                  },
                ]
              : []),
          ],
        },
      ]
    : []

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      <AdminPageHeader
        title="Projects"
        accent="Management"
        subtitle="Track, organize, and showcase company software, hardware, and engineering projects"
        icon={FolderKanban}
        onRefresh={loadProjects}
        onAdd={() => {
          setFormData(EMPTY_FORM)
          setEditingProject(null)
          setIsCreateModalOpen(true)
        }}
        addLabel="Add Project"
      />

      <AdminStats
        items={[
          { title: "Total Projects", value: projects.length, icon: FolderOpen },
          {
            title: "Completed",
            value: projects.filter((p) => p.status === "completed").length,
            icon: CheckCircle,
          },
          {
            title: "In Progress",
            value: projects.filter((p) => p.status === "in_progress").length,
            icon: Clock,
          },
          {
            title: "Planned",
            value: projects.filter((p) => p.status === "planned").length,
            icon: AlertTriangle,
          },
        ]}
      />

      <AdminFilterBar
        tabs={tabs}
        tabValue={statusFilter}
        onTabChange={setStatusFilter}
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search projects by title, client, or tech..."
        selects={[
          {
            value: categoryFilter,
            onValueChange: setCategoryFilter,
            placeholder: "Category",
            allLabel: "All Categories",
            options: CATEGORY_OPTIONS,
          },
        ]}
      />

      <AdminTable
        columns={columns}
        data={filteredProjects}
        rowKey={(project) => project.id}
        actions={actions}
        emptyIcon={FolderOpen}
        emptyTitle="No projects found"
      />

      {/* Create / Edit */}
      <AdminFormModal
        open={isCreateModalOpen || !!editingProject}
        onOpenChange={(open) => {
          if (!open) closeFormModal()
        }}
        icon={FolderOpen}
        title={editingProject ? "Edit Project" : "Create New Project"}
        description={
          editingProject
            ? "Update portfolio project specifications and metadata"
            : "Add a new software, hardware, or engineering project to showcase"
        }
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isEdit={!!editingProject}
        createLabel="Create Project"
        editLabel="Update Project"
      >
        <AdminFormGrid>
          <AdminFormField label="Project Title" required>
            <AdminInput
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              required
              placeholder="e.g. QuardCube Analytics Cloud"
            />
          </AdminFormField>
          <AdminFormField label="Client">
            <AdminInput
              value={formData.client}
              onChange={(e) => setFormData((prev) => ({ ...prev, client: e.target.value }))}
              placeholder="e.g. Internal / Enterprise Client"
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid>
          <AdminFormField label="Category" required>
            <AdminSelect
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              options={CATEGORY_OPTIONS}
            />
          </AdminFormField>
          <AdminFormField label="Status" required>
            <AdminSelect
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  status: value as ProjectFormData["status"],
                }))
              }
              options={[
                { value: "completed", label: "Completed" },
                { value: "in_progress", label: "In Progress" },
                { value: "planned", label: "Planned" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid>
          <AdminFormField label="Engineering Budget (TSH)" hint="Portfolio benchmark">
            <AdminInput
              type="number"
              min="0"
              step="500000"
              monospace
              value={formData.budget === 0 ? "" : (formData.budget ?? "")}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  budget: e.target.value === "" ? 0 : Number(e.target.value),
                }))
              }
              placeholder="e.g. 25000000"
            />
          </AdminFormField>
          <AdminFormField label="Assigned Team Size">
            <AdminInput
              type="number"
              min="1"
              value={formData.team_size ?? 1}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  team_size: Number(e.target.value) || 1,
                }))
              }
              placeholder="e.g. 4"
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormGrid>
          <AdminFormField label="Start Date">
            <AdminInput
              type="date"
              value={formData.start_date || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />
          </AdminFormField>
          <AdminFormField label="Target Delivery / End Date">
            <AdminInput
              type="date"
              value={formData.end_date || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            />
          </AdminFormField>
        </AdminFormGrid>

        <AdminFormField label="Short Summary">
          <AdminInput
            value={formData.short_description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, short_description: e.target.value }))
            }
            placeholder="Brief 1-sentence project summary"
          />
        </AdminFormField>

        <AdminFormField label="Detailed Description">
          <AdminTextarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            placeholder="Detailed project architecture, scope, and technical highlights"
          />
        </AdminFormField>

        <AdminFormGrid>
          <AdminFormField label="Problem Statement & Challenge">
            <AdminTextarea
              value={formData.challenge || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, challenge: e.target.value }))
              }
              rows={2}
              placeholder="Key technical hurdles, performance bottlenecks, or business problem"
            />
          </AdminFormField>
          <AdminFormField label="Engineered Solution">
            <AdminTextarea
              value={formData.solution || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, solution: e.target.value }))
              }
              rows={2}
              placeholder="Architectural design, microservices, frameworks and deliverable approach"
            />
          </AdminFormField>
        </AdminFormGrid>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Technologies Used</span>
            <button
              type="button"
              onClick={addTechnology}
              className="text-xs font-bold text-teal hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Add Tech Tag
            </button>
          </div>
          <div className="space-y-2">
            {(formData.technologies || []).map((tech, index) => (
              <div key={index} className="flex gap-2">
                <AdminInput
                  value={tech}
                  onChange={(e) => updateTechnology(index, e.target.value)}
                  placeholder="e.g. Next.js, Python, Supabase"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeTechnology(index)}
                  className="rounded-xl border-2 text-brand-red hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <AdminFormGrid>
          <AdminFormField label="Project URL">
            <AdminInput
              value={formData.project_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, project_url: e.target.value }))
              }
              placeholder="https://example.com"
            />
          </AdminFormField>
          <AdminFormField label="GitHub URL">
            <AdminInput
              value={formData.github_url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, github_url: e.target.value }))
              }
              placeholder="https://github.com/quardcube/repo"
            />
          </AdminFormField>
        </AdminFormGrid>
      </AdminFormModal>

      {/* Details */}
      <AdminDetailModal
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open)
          if (!open) setSelectedProject(null)
        }}
        icon={FolderOpen}
        title={selectedProject?.title ?? "Project Details"}
        badge={
          selectedProject ? <AdminStatusBadge status={selectedProject.status} /> : undefined
        }
        subtitle={
          selectedProject
            ? `Client: ${selectedProject.client || "Internal Project"} • Category: ${selectedProject.category.replace("-", " ")}`
            : undefined
        }
        sections={detailSections}
        headerActions={
          selectedProject ? (
            <>
              {selectedProject.project_url && (
                <a
                  href={selectedProject.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-teal hover:bg-teal-400 text-navy font-bold rounded-xl shadow-sm flex items-center gap-1.5 h-9 px-3.5 text-xs transition-all active:scale-95"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Live Demo
                </a>
              )}
              {selectedProject.github_url && (
                <a
                  href={selectedProject.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-navy/20 dark:border-teal/30 hover:bg-navy/10 dark:hover:bg-teal/10 rounded-xl font-bold flex items-center gap-1.5 h-9 px-3 text-xs transition-all"
                >
                  <Github className="h-3.5 w-3.5" />
                  Repository
                </a>
              )}
            </>
          ) : undefined
        }
        onEdit={
          selectedProject
            ? () => {
                const project = selectedProject
                setIsViewModalOpen(false)
                handleEdit(project)
              }
            : undefined
        }
        editLabel="Edit Project"
        onDelete={selectedProject ? () => setDeleteTarget(selectedProject) : undefined}
      />

      <AdminConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete project?"
        description={`“${deleteTarget?.title ?? ""}” will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Project"
        onConfirm={handleDelete}
      />
    </div>
  )
}
