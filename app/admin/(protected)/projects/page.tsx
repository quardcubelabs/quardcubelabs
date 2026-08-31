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
import AdminLoading from "@/components/admin/admin-loading"
import { FolderOpen, Plus, Edit, Trash2, Search, ExternalLink, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/projects-actions"
import type { Project, ProjectFormData } from "@/types/database"

export default function AdminProjectsPage() {
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
    "api",
    "website",
    "other"
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
        client: formData.client,
        description: formData.description,
        short_description: formData.short_description,
        technologies: (formData.technologies || []).filter(t => t.trim() !== ""),
        category: formData.category,
        status: formData.status,
        project_url: formData.project_url,
        github_url: formData.github_url,
        image_url: formData.image_url,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: formData.budget,
        team_size: formData.team_size,
        featured: formData.featured ?? false,
        order_index: formData.order_index ?? 0,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
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
      featured: project.featured,
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
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header Card in Teal without borders */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
              Projects <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Track, organize, and showcase company software and hardware projects
            </p>
          </div>
          <Button 
            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Projects</p>
              <p className="text-2xl font-bold text-blue-700">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-green-600 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-700">{projects.filter(p => p.status === 'completed').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-yellow-600 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-yellow-700">{projects.filter(p => p.status === 'in_progress').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-red-600 font-medium">Planned</p>
              <p className="text-2xl font-bold text-red-700">{projects.filter(p => p.status === 'planned').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat === "All" ? "all" : cat)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              (cat === "All" && categoryFilter === "all") || categoryFilter === cat
                ? "text-red-500 border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {cat === "All" ? "All Projects" : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
          </button>
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
