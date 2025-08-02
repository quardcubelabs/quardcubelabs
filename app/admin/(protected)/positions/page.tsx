"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Search, Filter, Users, Calendar, MapPin, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPositions, createPosition, updatePosition, deletePosition } from "@/lib/positions-actions"
import type { Position } from "@/types/database"

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

export default function PositionsManagement() {
  const [positions, setPositions] = useState<Position[]>([])
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const { toast } = useToast()

  const [formData, setFormData] = useState<PositionFormData>({
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
    order_index: 0
  })

  const resetForm = () => {
    setFormData({
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
      order_index: 0
    })
  }

  useEffect(() => {
    loadPositions()
  }, [])

  const loadPositions = async () => {
    setIsLoading(true)
    try {
      const result = await getPositions()
      if (result.error) {
        throw new Error(result.error)
      }
      setPositions(result.data || [])
      setFilteredPositions(result.data || [])
    } catch (error) {
      console.error("Error fetching positions:", error)
      toast({
        title: "Error",
        description: "Failed to load positions",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter positions based on search and filter criteria
  useEffect(() => {
    let filtered = positions

    if (searchTerm) {
      filtered = filtered.filter(position =>
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAddPosition = async () => {
    try {
      const submitData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ""),
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ""),
        benefits: formData.benefits.filter(b => b.trim() !== "")
      }

      const result = await createPosition(submitData)
      if (result.error) {
        throw new Error(result.error)
      }

      setPositions([result.data, ...positions])
      setIsAddDialogOpen(false)
      resetForm()
      toast({
        title: "Position Added",
        description: "New position has been created successfully",
      })
    } catch (error: any) {
      console.error("Error adding position:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add position",
        variant: "destructive",
      })
    }
  }

  const handleEditPosition = async () => {
    if (!selectedPosition) return

    try {
      const submitData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ""),
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ""),
        benefits: formData.benefits.filter(b => b.trim() !== "")
      }

      const result = await updatePosition(selectedPosition.id, submitData)
      if (result.error) {
        throw new Error(result.error)
      }

      setPositions(positions.map(position => 
        position.id === selectedPosition.id ? result.data : position
      ))
      setIsEditDialogOpen(false)
      setSelectedPosition(null)
      resetForm()
      toast({
        title: "Position Updated",
        description: "Position has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating position:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update position",
        variant: "destructive",
      })
    }
  }

  const handleDeletePosition = async (positionId: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return

    try {
      const result = await deletePosition(positionId)
      if (result.error) {
        throw new Error(result.error)
      }
      setPositions(positions.filter(position => position.id !== positionId))
      toast({
        title: "Position Deleted",
        description: "Position has been deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting position:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete position",
        variant: "destructive",
      })
    }
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
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
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
      responsibilities: prev.responsibilities.map((resp, i) => i === index ? value : resp)
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
      benefits: prev.benefits.map((ben, i) => i === index ? value : ben)
    }))
  }

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }))
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
      order_index: position.order_index
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default'
      case 'closed': return 'secondary'
      case 'draft': return 'outline'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const departments = Array.from(new Set(positions.map(p => p.department))).filter(Boolean)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Position Management</h1>
          <p className="text-gray-600">Loading positions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Position Management</h1>
          <p className="text-gray-600">Manage job openings and career opportunities</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90">
              <Plus className="h-4 w-4 mr-2" />
              New Position
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Position</DialogTitle>
              <DialogDescription>
                Add a new job opening to your careers page
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter job title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    placeholder="e.g., Engineering, Marketing"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Remote, New York, NY"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                    placeholder="e.g., $80,000 - $120,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select 
                    value={formData.employment_type} 
                    onValueChange={(value: any) => setFormData({...formData, employment_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select 
                    value={formData.experience_level} 
                    onValueChange={(value: any) => setFormData({...formData, experience_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData({...formData, status: value})}
                  >
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
                <div>
                  <Label htmlFor="order_index">Order Index</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remote_allowed"
                    checked={formData.remote_allowed}
                    onChange={(e) => setFormData({...formData, remote_allowed: e.target.checked})}
                  />
                  <Label htmlFor="remote_allowed">Remote Work Allowed</Label>
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

              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the role and what the candidate will be doing..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="application_deadline">Application Deadline</Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                />
              </div>

              {/* Requirements */}
              <div>
                <Label>Requirements</Label>
                <div className="space-y-2">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder="Enter requirement"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRequirement}
                    className="w-full"
                  >
                    Add Requirement
                  </Button>
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <Label>Responsibilities</Label>
                <div className="space-y-2">
                  {formData.responsibilities.map((responsibility, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={responsibility}
                        onChange={(e) => updateResponsibility(index, e.target.value)}
                        placeholder="Enter responsibility"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeResponsibility(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addResponsibility}
                    className="w-full"
                  >
                    Add Responsibility
                  </Button>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <Label>Benefits</Label>
                <div className="space-y-2">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        placeholder="Enter benefit"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBenefit}
                    className="w-full"
                  >
                    Add Benefit
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddPosition} className="bg-navy hover:bg-navy/90">
                  Create Position
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Positions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by title, department, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department-filter">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions Grid */}
      <div className="space-y-4">
        {filteredPositions.map((position) => (
          <Card key={position.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl line-clamp-1">{position.title}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {position.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {position.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {position.employment_type}
                    </span>
                    {position.application_deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {formatDate(position.application_deadline)}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(position.status)}>
                    {position.status}
                  </Badge>
                  <Badge variant="outline">{position.experience_level}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {position.description && (
                  <p className="text-gray-600 line-clamp-3">{position.description}</p>
                )}

                {position.salary_range && (
                  <div className="text-sm font-medium text-navy">
                    Salary: {position.salary_range}
                  </div>
                )}

                {position.requirements && position.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Key Requirements:</h4>
                    <div className="text-sm text-gray-600">
                      {position.requirements.slice(0, 2).join(", ")}
                      {position.requirements.length > 2 && "..."}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <span>Posted: {formatDate(position.created_at)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(position)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePosition(position.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPositions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                ? "Try adjusting your filters to see more positions."
                : "Get started by creating your first job opening."}
            </p>
            {(!searchTerm && statusFilter === "all" && departmentFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-navy hover:bg-navy/90">
                <Plus className="h-4 w-4 mr-2" />
                Create First Position
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update position information and requirements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter job title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-department">Department *</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g., Engineering, Marketing"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Remote, New York, NY"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-salary_range">Salary Range</Label>
                <Input
                  id="edit-salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g., $80,000 - $120,000"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-employment_type">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(value: any) => setFormData({...formData, employment_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-experience_level">Experience Level</Label>
                <Select 
                  value={formData.experience_level} 
                  onValueChange={(value: any) => setFormData({...formData, experience_level: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
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
              <div>
                <Label htmlFor="edit-order_index">Order Index</Label>
                <Input
                  id="edit-order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-remote_allowed"
                  checked={formData.remote_allowed}
                  onChange={(e) => setFormData({...formData, remote_allowed: e.target.checked})}
                />
                <Label htmlFor="edit-remote_allowed">Remote Work Allowed</Label>
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

            <div>
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role and what the candidate will be doing..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-application_deadline">Application Deadline</Label>
              <Input
                id="edit-application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
              />
            </div>

            {/* Requirements */}
            <div>
              <Label>Requirements</Label>
              <div className="space-y-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder="Enter requirement"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                  className="w-full"
                >
                  Add Requirement
                </Button>
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <Label>Responsibilities</Label>
              <div className="space-y-2">
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={responsibility}
                      onChange={(e) => updateResponsibility(index, e.target.value)}
                      placeholder="Enter responsibility"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeResponsibility(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addResponsibility}
                  className="w-full"
                >
                  Add Responsibility
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <Label>Benefits</Label>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateBenefit(index, e.target.value)}
                      placeholder="Enter benefit"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addBenefit}
                  className="w-full"
                >
                  Add Benefit
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditPosition} className="bg-navy hover:bg-navy/90">
                Update Position
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
