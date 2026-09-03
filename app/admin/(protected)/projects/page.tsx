"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { FolderOpen, Plus, Search, CheckCircle, Clock, AlertTriangle, Layers, Edit, Trash2, ExternalLink, RefreshCw, XCircle, Code, Calendar, User, Globe, Github } from "lucide-react"
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/projects-actions"
import type { Project, ProjectFormData } from "@/types/database"

export default function AdminProjectsPage() {
  const { isDark } = useAdminTheme()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProjectFormData>({
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
    meta_description: ""
  })

  const categories = [
    "web-app",
    "mobile-app",
    "desktop-app",
    "cloud-solution",
    "hardware",
    "iot",
    "consulting"
  ]

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getProjects()
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        setProjects(data || [])
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
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
      const projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
        title: formData.title,
        client: formData.client || "",
        description: formData.description || "",
        short_description: formData.short_description || "",
        technologies: (formData.technologies || []).filter(t => t.trim() !== ""),
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
        meta_description: formData.meta_description || ""
      }

      let result
      if (editingProject) {
        result = await updateProject(editingProject.id, projectData)
      } else {
        result = await createProject(projectData)
      }

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: `Project ${editingProject ? "updated" : "created"} successfully!`
        })
        
        await loadProjects()
        resetForm()
        setIsCreateModalOpen(false)
        setEditingProject(null)
      }
    } catch (error) {
      console.error("Error submitting project:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return

    try {
      const result = await deleteProject(id)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Project deleted successfully!"
        })
        await loadProjects()
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
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
      meta_description: project.meta_description || ""
    })
    setIsCreateModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
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
      meta_description: ""
    })
    setEditingProject(null)
  }

  const addTechnology = () => {
    setFormData(prev => ({
      ...prev,
      technologies: [...(prev.technologies || []), ""]
    }))
  }

  const updateTechnology = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: (prev.technologies || []).map((t, i) => i === index ? value : t)
    }))
  }

  const removeTechnology = (index: number) => {
    setFormData(prev => ({
      ...prev,
      technologies: (prev.technologies || []).filter((_, i) => i !== index)
    }))
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Helper to get compact client abbreviation (e.g., "QuardCube Labs" -> "QCL", "Acme Corp" -> "AC")
  const getClientAbbreviation = (client: string) => {
    if (!client || !client.trim()) return "—"
    const cleaned = client.trim()
    const words = cleaned.split(/[\s-_]+/)
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
    }
    return cleaned.slice(0, 4).toUpperCase()
  }

  // Helper to get category abbreviation
  const getCategoryAbbreviation = (cat: string) => {
    if (!cat) return "—"
    const map: Record<string, string> = {
      'web-app': 'WEB',
      'mobile-app': 'MOB',
      'desktop-app': 'DESK',
      'cloud-solution': 'CLOUD',
      'hardware': 'HW',
      'iot': 'IOT',
      'consulting': 'CONS',
    }
    return map[cat] || cat.toUpperCase().slice(0, 4)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': 
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold text-xs whitespace-nowrap">Completed</Badge>
      case 'in_progress': 
        return <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 font-bold text-xs whitespace-nowrap">In Progress</Badge>
      case 'planned': 
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs whitespace-nowrap">Planned</Badge>
      case 'cancelled': 
        return <Badge className="bg-red-500/15 text-brand-red border-red-500/30 font-bold text-xs whitespace-nowrap">Cancelled</Badge>
      default: 
        return <Badge className="bg-gray-500/15 text-gray-700 dark:text-gray-300 font-bold text-xs whitespace-nowrap">{status}</Badge>
    }
  }

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 text-navy truncate">
              Projects <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-navy/90 font-semibold line-clamp-1 sm:line-clamp-none">
              Track, organize, and showcase company software, hardware, and engineering projects
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={loadProjects}
              className={cn("flex-1 sm:flex-initial font-bold rounded-xl h-10 px-3 sm:px-4 border-2 transition-all text-xs sm:text-sm", isDark ? "border-teal/40 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm")}
            >
              <RefreshCw className="h-4 w-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
              className="flex-1 sm:flex-initial bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-3 sm:px-4 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
            >
              <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
              Add Project
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { title: "Total Projects", value: projects.length.toString(), icon: FolderOpen },
          { title: "Completed", value: projects.filter(p => p.status === 'completed').length.toString(), icon: CheckCircle },
          { title: "In Progress", value: projects.filter(p => p.status === 'in_progress').length.toString(), icon: Clock },
          { title: "Planned", value: projects.filter(p => p.status === 'planned').length.toString(), icon: AlertTriangle }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
              isDark 
                ? "bg-[#0a1033] border-teal/20 shadow-md hover:border-teal-400" 
                : "bg-white border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-3 sm:p-4.5 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  {stat.title}
                </p>
                <span className={cn("text-base sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
      )}>
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "completed", "in_progress", "planned", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status === "All" ? "all" : status)}
              className={cn(
                "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 capitalize shrink-0",
                (status === "All" && statusFilter === "all") || statusFilter === status
                  ? "bg-navy text-white shadow-md"
                  : isDark 
                    ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                    : "text-navy/70 hover:bg-teal-50 hover:text-navy"
              )}
            >
              {status === "All" ? `All (${projects.length})` : `${status.replace('_', ' ')} (${projects.filter(p => p.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Search & Category Inputs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search projects by title, client, or tech..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm w-full",
                isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
              )}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px] h-10 sm:h-11 rounded-xl border-2 font-bold text-xs shrink-0", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 4. Projects Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[620px] sm:min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Project</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Client</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Cat</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Status</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Tech</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id}
                  className={cn(
                    "transition-colors duration-150",
                    isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                  )}
                >
                  <td className="py-3.5 px-3 sm:px-4 max-w-[240px] sm:max-w-xs">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Total circle folder icon */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-navy text-teal flex items-center justify-center shrink-0 shadow-sm border border-navy/20">
                        <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span className="truncate">{project.title}</span>
                          {project.featured && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className={cn("text-[11px] sm:text-xs line-clamp-1 truncate font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                          {project.short_description || project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Client Abbreviation */}
                  <td className="py-3.5 px-3 sm:px-4">
                    {project.client ? (
                      <span 
                        className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-teal/20 text-navy dark:text-teal-300 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs inline-block"
                        title={project.client}
                      >
                        {getClientAbbreviation(project.client)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>

                  {/* Category Abbreviation */}
                  <td className="py-3.5 px-3 sm:px-4">
                    <span 
                      className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-teal/20 text-navy dark:text-teal-300 font-black tracking-wider text-[11px] sm:text-xs inline-block"
                      title={project.category}
                    >
                      {getCategoryAbbreviation(project.category)}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 sm:px-4">
                    {getStatusBadge(project.status)}
                  </td>

                  {/* Two short technologies + n remaining */}
                  <td className="py-3.5 px-3 sm:px-4">
                    {project.technologies && project.technologies.length > 0 ? (
                      <div className="flex items-center flex-wrap gap-1">
                        {project.technologies.slice(0, 2).map((tech, index) => (
                          <span 
                            key={index} 
                            className="text-[10px] sm:text-[11px] font-semibold bg-navy/5 dark:bg-white/5 border border-navy/10 dark:border-teal/20 px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-[80px] sm:max-w-[100px]" 
                            title={tech}
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 2 && (
                          <span 
                            className="text-[10px] sm:text-[11px] font-black text-teal bg-teal/10 px-1.5 py-0.5 rounded-md border border-teal/20" 
                            title={project.technologies.slice(2).join(', ')}
                          >
                            +{project.technologies.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-3 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      {project.project_url && (
                        <a 
                          href={project.project_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 rounded-lg bg-teal/15 text-teal hover:bg-teal hover:text-navy transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center"
                          title="Open Live Project"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </a>
                      )}
                      <button 
                        onClick={() => handleEdit(project)}
                        className="p-1.5 sm:p-2 rounded-lg bg-navy/10 text-navy dark:bg-teal/15 dark:text-teal hover:bg-navy hover:text-white dark:hover:bg-teal dark:hover:text-navy transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(project.id)}
                        className="p-1.5 sm:p-2 rounded-lg bg-red-50 text-brand-red dark:bg-red-950/30 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold text-base">No projects found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your filters or search keyword</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Create / Edit Project Modal */}
      <Dialog open={isCreateModalOpen || !!editingProject} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false)
          setEditingProject(null)
          resetForm()
        }
      }}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-teal flex items-center justify-center shadow-xs border border-navy/20 shrink-0">
                <FolderOpen className="h-4 w-4 text-teal" />
              </div>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              {editingProject ? "Update portfolio project specifications and metadata" : "Add a new software, hardware, or engineering project to showcase"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g. QuardCube Analytics Cloud"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="client" className="text-xs font-bold uppercase tracking-wider">Client</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="e.g. Internal / Enterprise Client"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider">Status *</Label>
                <Select value={formData.status} onValueChange={(value: 'completed' | 'in_progress' | 'planned' | 'cancelled') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="short_description" className="text-xs font-bold uppercase tracking-wider">Short Summary</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief 1-sentence project summary"
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Detailed project architecture, scope, and technical highlights"
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider">Technologies Used</Label>
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
                    <Input
                      value={tech}
                      onChange={(e) => updateTechnology(index, e.target.value)}
                      placeholder="e.g. Next.js, Python, Supabase"
                      className={cn("h-10 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="project_url" className="text-xs font-bold uppercase tracking-wider">Project URL</Label>
                <Input
                  id="project_url"
                  value={formData.project_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_url: e.target.value }))}
                  placeholder="https://example.com"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="github_url" className="text-xs font-bold uppercase tracking-wider">GitHub URL</Label>
                <Input
                  id="github_url"
                  value={formData.github_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                  placeholder="https://github.com/quardcube/repo"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingProject(null)
                  resetForm()
                }}
                className={cn("rounded-xl border-2 font-bold h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-teal text-navy font-black hover:bg-teal-400 rounded-xl h-10 sm:h-11 px-5 sm:px-6 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                {editingProject ? "Update Project" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
