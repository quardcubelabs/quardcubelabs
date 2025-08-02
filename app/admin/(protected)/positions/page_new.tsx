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
import { Briefcase, Plus, Edit, Trash2, Search, Filter, MapPin, Clock, DollarSign } from "lucide-react"
import { getPositions, createPosition, updatePosition, deletePosition } from "@/lib/positions-actions"
import type { Position, PositionFormData } from "@/types/database"

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState<PositionFormData>({
    title: "",
    department: "",
    location: "",
    employment_type: "full_time",
    experience_level: "mid",
    description: "",
    requirements: [],
    responsibilities: [],
    benefits: [],
    salary_range: "",
    status: "open",
    remote_allowed: false,
    featured: false,
    application_deadline: "",
    order_index: 0,
    meta_title: "",
    meta_description: ""
  })

  const loadPositions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await getPositions()
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      } else {
        setPositions(data || [])
      }
    } catch (error) {
      console.error("Error loading positions:", error)
      toast({
        title: "Error",
        description: "Failed to load positions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPositions()
  }, [])

  useEffect(() => {
    let filtered = positions

    if (searchTerm) {
      filtered = filtered.filter(position =>
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(position => position.status === statusFilter)
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(position => position.department === departmentFilter)
    }

    setFilteredPositions(filtered)
  }, [positions, searchTerm, statusFilter, departmentFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const positionData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ""),
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ""),
        benefits: formData.benefits.filter(b => b.trim() !== "")
      }

      let result
      if (selectedPosition) {
        result = await updatePosition(selectedPosition.id, positionData)
      } else {
        result = await createPosition(positionData)
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
          description: selectedPosition ? "Position updated successfully" : "Position created successfully"
        })
        resetForm()
        setIsAddDialogOpen(false)
        setIsEditDialogOpen(false)
        loadPositions()
      }
    } catch (error) {
      console.error("Error saving position:", error)
      toast({
        title: "Error",
        description: "Failed to save position",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return

    try {
      const result = await deletePosition(id)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Success",
          description: "Position deleted successfully"
        })
        loadPositions()
      }
    } catch (error) {
      console.error("Error deleting position:", error)
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "",
      employment_type: "full_time",
      experience_level: "mid",
      description: "",
      requirements: [],
      responsibilities: [],
      benefits: [],
      salary_range: "",
      status: "open",
      remote_allowed: false,
      featured: false,
      application_deadline: "",
      order_index: 0,
      meta_title: "",
      meta_description: ""
    })
    setSelectedPosition(null)
  }

  const handleEdit = (position: Position) => {
    setSelectedPosition(position)
    setFormData({
      title: position.title,
      department: position.department,
      location: position.location,
      employment_type: position.employment_type,
      experience_level: position.experience_level,
      description: position.description || "",
      requirements: position.requirements || [],
      responsibilities: position.responsibilities || [],
      benefits: position.benefits || [],
      salary_range: position.salary_range || "",
      status: position.status,
      remote_allowed: position.remote_allowed,
      featured: position.featured,
      application_deadline: position.application_deadline || "",
      order_index: position.order_index,
      meta_title: position.meta_title || "",
      meta_description: position.meta_description || ""
    })
    setIsEditDialogOpen(true)
  }

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""]
    }))
  }

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((r, i) => i === index ? value : r)
    }))
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      responsibilities: [...prev.responsibilities, ""]
    }))
  }

  const updateResponsibility = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.map((r, i) => i === index ? value : r)
    }))
  }

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }))
  }

  const addBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, ""]
    }))
  }

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b)
    }))
  }

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full Time'
      case 'part_time': return 'Part Time'
      case 'contract': return 'Contract'
      case 'internship': return 'Internship'
      default: return type
    }
  }

  const getExperienceLevelLabel = (level: string) => {
    switch (level) {
      case 'entry': return 'Entry Level'
      case 'mid': return 'Mid Level'
      case 'senior': return 'Senior Level'
      case 'lead': return 'Lead Level'
      default: return level
    }
  }

  const uniqueDepartments = Array.from(new Set(positions.map(p => p.department)))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Positions Management</h1>
          <p className="text-navy/70">Manage job openings and career opportunities</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-navy hover:bg-navy/90"
              onClick={resetForm}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Position</DialogTitle>
              <DialogDescription>
                Add a new job opening to your careers page
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select value={formData.employment_type} onValueChange={(value: any) => setFormData({...formData, employment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select value={formData.experience_level} onValueChange={(value: any) => setFormData({...formData, experience_level: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                    placeholder="e.g., $50,000 - $70,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Requirements</Label>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder="Enter requirement"
                    />
                    <Button type="button" variant="outline" onClick={() => removeRequirement(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addRequirement}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Responsibilities</Label>
                {formData.responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={resp}
                      onChange={(e) => updateResponsibility(index, e.target.value)}
                      placeholder="Enter responsibility"
                    />
                    <Button type="button" variant="outline" onClick={() => removeResponsibility(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addResponsibility}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Responsibility
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Benefits</Label>
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder="Enter benefit"
                    />
                    <Button type="button" variant="outline" onClick={() => removeBenefit(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addBenefit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remote_allowed"
                    checked={formData.remote_allowed}
                    onChange={(e) => setFormData({...formData, remote_allowed: e.target.checked})}
                  />
                  <Label htmlFor="remote_allowed">Remote Allowed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  />
                  <Label htmlFor="featured">Featured Position</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-navy hover:bg-navy/90" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Position"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.filter(p => p.status === 'open').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDepartments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.filter(p => p.featured).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <Card>
        <CardHeader>
          <CardTitle>Positions ({filteredPositions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPositions.map((position) => (
              <div
                key={position.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-lg">{position.title}</h3>
                    <Badge className={getStatusColor(position.status)}>
                      {position.status}
                    </Badge>
                    {position.featured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {position.department}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {position.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getEmploymentTypeLabel(position.employment_type)}
                    </div>
                    {position.salary_range && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {position.salary_range}
                      </div>
                    )}
                  </div>
                  {position.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {position.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(position)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(position.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredPositions.length === 0 && (
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No positions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Get started by creating your first position"
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update the position details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department *</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-employment_type">Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value: any) => setFormData({...formData, employment_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value: any) => setFormData({...formData, experience_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-salary_range">Salary Range</Label>
                <Input
                  id="edit-salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g., $50,000 - $70,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-application_deadline">Application Deadline</Label>
                <Input
                  id="edit-application_deadline"
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-remote_allowed"
                  checked={formData.remote_allowed}
                  onChange={(e) => setFormData({...formData, remote_allowed: e.target.checked})}
                />
                <Label htmlFor="edit-remote_allowed">Remote Allowed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                />
                <Label htmlFor="edit-featured">Featured Position</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-navy hover:bg-navy/90" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Position"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
