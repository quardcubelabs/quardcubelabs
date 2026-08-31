"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { Plus, Edit, Trash2, Search, Users, Calendar, MapPin, Clock, CheckCircle, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getPositions, createPosition, updatePosition, deletePosition } from "@/lib/positions-actions"
import AdminLoading from "@/components/admin/admin-loading"
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
  const { isDark } = useAdminTheme()
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
      filtered = filtered.filter(pos =>
        pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(pos => pos.status === statusFilter)
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(pos => pos.department === departmentFilter)
    }

    setFilteredPositions(filtered)
  }, [positions, searchTerm, statusFilter, departmentFilter])

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault()

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
      setIsAddDialogOpen(false)
      resetForm()
      loadPositions()
    } catch (error) {
      console.error("Error creating position:", error)
      toast({
        title: "Error",
        description: "Failed to create position",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPosition) return

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
      setIsEditDialogOpen(false)
      setSelectedPosition(null)
      resetForm()
      loadPositions()
    } catch (error) {
      console.error("Error updating position:", error)
      toast({
        title: "Error",
        description: "Failed to update position",
        variant: "destructive",
      })
    }
  }

  const handleDeletePosition = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return

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
      loadPositions()
    } catch (error) {
      console.error("Error deleting position:", error)
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive",
      })
    }
  }

  const handleAddPosition = handleCreatePosition
  const handleEditPosition = handleUpdatePosition

  const addRequirement = () => setFormData(prev => ({ ...prev, requirements: [...prev.requirements, ""] }))
  const updateRequirement = (index: number, value: string) => setFormData(prev => ({ ...prev, requirements: prev.requirements.map((req, i) => i === index ? value : req) }))
  const removeRequirement = (index: number) => setFormData(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== index) }))
  
  const addResponsibility = () => setFormData(prev => ({ ...prev, responsibilities: [...prev.responsibilities, ""] }))
  const updateResponsibility = (index: number, value: string) => setFormData(prev => ({ ...prev, responsibilities: prev.responsibilities.map((resp, i) => i === index ? value : resp) }))
  const removeResponsibility = (index: number) => setFormData(prev => ({ ...prev, responsibilities: prev.responsibilities.filter((_, i) => i !== index) }))
  
  const addBenefit = () => setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ""] }))
  const updateBenefit = (index: number, value: string) => setFormData(prev => ({ ...prev, benefits: prev.benefits.map((ben, i) => i === index ? value : ben) }))
  const removeBenefit = (index: number) => setFormData(prev => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }))

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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  const departments = Array.from(new Set(positions.map(p => p.department))).filter(Boolean)

  if (isLoading) {
    return <AdminLoading />
  }

  const totalPositions = positions.length
  const openPositions = positions.filter(p => p.status === 'open').length
  const closedPositions = positions.filter(p => p.status === 'closed').length
  const draftPositions = positions.filter(p => p.status === 'draft').length

  return (
    <div className="w-full space-y-6">
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Position <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Manage company job openings, hiring criteria, and positions
            </p>
          </div>
          <Button 
            className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95" 
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Position
          </Button>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {[
          { title: "Total Positions", value: totalPositions.toString(), icon: Users },
          { title: "Open Positions", value: openPositions.toString(), icon: CheckCircle },
          { title: "Closed Positions", value: closedPositions.toString(), icon: XCircle },
          { title: "Draft Positions", value: draftPositions.toString(), icon: Clock }
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

      {/* 3. Category & Search Filters Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
      )}>
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All", "open", "closed", "draft"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status === "All" ? "all" : status)}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 capitalize",
                (status === "All" && statusFilter === "all") || statusFilter === status
                  ? "bg-navy text-white shadow-md"
                  : isDark 
                    ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300" 
                    : "text-navy/70 hover:bg-teal-50 hover:text-navy"
              )}
            >
              {status === "All" ? "All Positions" : `${status.charAt(0).toUpperCase() + status.slice(1)} (${positions.filter(p => p.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search positions by title, department, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 rounded-xl border border-teal text-sm font-medium",
                isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
              )}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px] h-10 rounded-xl border border-teal font-bold text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Positions <span className="text-gray-400 font-normal">({filteredPositions.length})</span>
        </h2>
        <Button className="bg-navy hover:bg-navy/90" size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Position
        </Button>
      </div>

      {/* Positions List */}
      <div className="space-y-3">
        {filteredPositions.map((position) => (
          <div key={position.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{position.title}</h3>
                  <Badge variant={getStatusBadgeVariant(position.status)}>
                    {position.status}
                  </Badge>
                  <Badge variant="outline">{position.experience_level}</Badge>
                  {position.featured && <Badge className="bg-amber-100 text-amber-700">Featured</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
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
                    {position.employment_type.replace('_', ' ')}
                  </span>
                  {position.salary_range && (
                    <span className="font-medium text-navy">{position.salary_range}</span>
                  )}
                  {position.application_deadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Deadline: {formatDate(position.application_deadline)}
                    </span>
                  )}
                </div>
                {position.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{position.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(position)}
                  className="text-white bg-navy hover:text-navy hover:bg-brand-red"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeletePosition(position.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredPositions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No positions found matching your filters.</p>
            {(!searchTerm && statusFilter === "all" && departmentFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-navy hover:bg-navy/90 mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Position
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Position Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
