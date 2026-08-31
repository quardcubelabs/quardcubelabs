"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { FolderOpen, Plus, Search, CheckCircle, Clock, AlertTriangle, Layers, Edit, Trash2, ExternalLink } from "lucide-react"
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

  const handleEdit = (project: Project) => {
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
      order_index: project.order_index,
      meta_title: project.meta_title || "",
      meta_description: project.meta_description || ""
    })
    setEditingProject(project)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const { error } = await deleteProject(id)
      if (error) {
        toast({
          title: "Error",
          description: error,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
      case 'in_progress': return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 font-bold'
      case 'planned': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
      case 'cancelled': return 'bg-brand-red/15 text-brand-red border-brand-red/30 font-bold'
      default: return 'bg-gray-500/15 text-gray-700 dark:text-gray-300 font-bold'
    }
  }

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header Card in Teal with website theme */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Projects <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Track, organize, and showcase company software, hardware, and engineering projects
            </p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {[
          { title: "Total Projects", value: projects.length.toString(), icon: FolderOpen },
          { title: "Completed", value: projects.filter(p => p.status === 'completed').length.toString(), icon: CheckCircle },
          { title: "In Progress", value: projects.filter(p => p.status === 'in_progress').length.toString(), icon: Clock },
          { title: "Planned", value: projects.filter(p => p.status === 'planned').length.toString(), icon: AlertTriangle }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-1 group cursor-pointer",
              isDark 
                ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20 hover:border-teal-400 hover:shadow-teal-950/40" 
                : "bg-white border-navy/20 shadow-md hover:border-navy hover:shadow-xl"
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-black whitespace-nowrap tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "p-2 sm:p-2.5 rounded-xl border-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isDark 
                    ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                    : "bg-teal-100 border-navy/10 text-navy group-hover:bg-teal-200"
                )}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
          <Button variant="outline" size="default">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          All Projects <span className="text-gray-400 font-normal">({filteredProjects.length})</span>
        </h2>
        <Dialog open={isCreateModalOpen || !!editingProject} onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false)
            setEditingProject(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm()
              setIsCreateModalOpen(true)
            }} className="bg-navy hover:bg-navy/90" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              + New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
              <DialogDescription>
                {editingProject ? "Update project information" : "Add a new project to your portfolio"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title*</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Input
                    id="client"
                    value={formData.client}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
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
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'completed' | 'in_progress' | 'planned' | 'cancelled') => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                  placeholder="Brief project description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Detailed project description"
                />
              </div>

              <div className="space-y-2">
                <Label>Technologies Used</Label>
                <div className="space-y-2">
                  {(formData.technologies || []).map((tech, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={tech}
                        onChange={(e) => updateTechnology(index, e.target.value)}
                        placeholder="Technology name"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTechnology(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTechnology}
                    className="w-full"
                  >
                    Add Technology
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_url">Project URL</Label>
                  <Input
                    id="project_url"
                    value={formData.project_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_url: e.target.value }))}
                    placeholder="https://project.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    placeholder="https://github.com/user/repo"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingProject(null)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <AdminLoading message="Loading projects..." size="lg" />
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderOpen className="h-4 w-4 text-navy flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    {project.featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    {project.client && `${project.client} • `}
                    {project.category.charAt(0).toUpperCase() + project.category.slice(1).replace('-', ' ')}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-1">{project.short_description || project.description}</p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.slice(0, 4).map((tech, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tech}</span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="text-xs text-gray-400">+{project.technologies.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {project.project_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProjects.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first project"}
            </p>
            {!(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
