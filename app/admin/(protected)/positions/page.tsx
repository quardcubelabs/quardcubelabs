"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Briefcase, Plus, Edit, Trash2, Search, Filter, MapPin, Clock, DollarSign } from "lucide-react"

interface Position {
  id: string
  title: string
  department: string
  location: string
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience_level: 'entry' | 'mid' | 'senior' | 'lead'
  salary_range?: string
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  status: 'open' | 'closed' | 'draft'
  application_deadline?: string
  posted_date: string
  created_at: string
  updated_at: string
}

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
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    employment_type: "full-time" as "full-time" | "part-time" | "contract" | "internship",
    experience_level: "mid" as "entry" | "mid" | "senior" | "lead",
    salary_range: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    status: "open" as "open" | "closed" | "draft",
    application_deadline: "",
    posted_date: ""
  })

  // Mock data - Replace with actual API calls
  const mockPositions: Position[] = [
    {
      id: "1",
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Remote / Dar es Salaam",
      employment_type: "full-time",
      experience_level: "senior",
      salary_range: "$60,000 - $80,000",
      description: "We are looking for a senior full stack developer to join our growing team and help build amazing web applications.",
      requirements: [
        "5+ years of experience in web development",
        "Strong proficiency in React and Node.js",
        "Experience with TypeScript",
        "Knowledge of database design and optimization",
        "Excellent problem-solving skills"
      ],
      responsibilities: [
        "Develop and maintain web applications",
        "Collaborate with cross-functional teams",
        "Code reviews and mentoring junior developers",
        "Architecture decisions and technical leadership",
        "Ensure code quality and best practices"
      ],
      benefits: [
        "Competitive salary and equity",
        "Remote work flexibility",
        "Health insurance",
        "Professional development budget",
        "Flexible working hours"
      ],
      status: "open",
      application_deadline: "2024-09-15",
      posted_date: "2024-07-01",
      created_at: "2024-07-01",
      updated_at: "2024-07-01"
    },
    {
      id: "2",
      title: "UI/UX Designer",
      department: "Design",
      location: "Dar es Salaam",
      employment_type: "full-time",
      experience_level: "mid",
      salary_range: "$40,000 - $55,000",
      description: "Join our design team to create beautiful and user-friendly interfaces for our digital products.",
      requirements: [
        "3+ years of UI/UX design experience",
        "Proficiency in Figma and Adobe Creative Suite",
        "Strong portfolio showcasing design work",
        "Understanding of user-centered design principles",
        "Experience with design systems"
      ],
      responsibilities: [
        "Design user interfaces for web and mobile applications",
        "Conduct user research and usability testing",
        "Create wireframes, prototypes, and design specifications",
        "Collaborate with developers and product managers",
        "Maintain and evolve design systems"
      ],
      benefits: [
        "Competitive salary",
        "Creative work environment",
        "Health insurance",
        "Professional development opportunities",
        "Team building events"
      ],
      status: "open",
      application_deadline: "2024-08-30",
      posted_date: "2024-07-15",
      created_at: "2024-07-15",
      updated_at: "2024-07-15"
    },
    {
      id: "3",
      title: "Marketing Intern",
      department: "Marketing",
      location: "Remote",
      employment_type: "internship",
      experience_level: "entry",
      description: "Great opportunity for students or recent graduates to gain hands-on experience in digital marketing.",
      requirements: [
        "Currently pursuing or recently completed degree in Marketing or related field",
        "Basic understanding of social media platforms",
        "Strong communication skills",
        "Eagerness to learn and grow",
        "Basic knowledge of content creation"
      ],
      responsibilities: [
        "Assist with social media management",
        "Create content for marketing campaigns",
        "Support email marketing initiatives",
        "Conduct market research",
        "Help organize marketing events"
      ],
      benefits: [
        "Mentorship from experienced professionals",
        "Hands-on learning experience",
        "Networking opportunities",
        "Potential for full-time offer",
        "Flexible schedule"
      ],
      status: "closed",
      posted_date: "2024-06-01",
      created_at: "2024-06-01",
      updated_at: "2024-07-20"
    }
  ]

  useEffect(() => {
    // Simulate API call
    const fetchPositions = async () => {
      setIsLoading(true)
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPositions(mockPositions)
        setFilteredPositions(mockPositions)
      } catch (error) {
        console.error("Error fetching positions:", error)
        toast({
          title: "Error",
          description: "Failed to load positions",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPositions()
  }, [toast])

  // Filter positions based on search and filters
  useEffect(() => {
    let filtered = positions

    if (searchTerm) {
      filtered = filtered.filter(position =>
        position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      const requirementsArray = formData.requirements.split('\n').filter(r => r.trim())
      const responsibilitiesArray = formData.responsibilities.split('\n').filter(r => r.trim())
      const benefitsArray = formData.benefits.split('\n').filter(b => b.trim())
      
      const newPosition: Position = {
        id: Date.now().toString(),
        ...formData,
        requirements: requirementsArray,
        responsibilities: responsibilitiesArray,
        benefits: benefitsArray,
        posted_date: formData.posted_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      }

      setPositions([newPosition, ...positions])
      setIsAddDialogOpen(false)
      resetForm()
      toast({
        title: "Position Added",
        description: "New position has been posted successfully",
      })
    } catch (error) {
      console.error("Error adding position:", error)
      toast({
        title: "Error",
        description: "Failed to add position",
        variant: "destructive",
      })
    }
  }

  const handleEditPosition = async () => {
    if (!selectedPosition) return

    try {
      const requirementsArray = formData.requirements.split('\n').filter(r => r.trim())
      const responsibilitiesArray = formData.responsibilities.split('\n').filter(r => r.trim())
      const benefitsArray = formData.benefits.split('\n').filter(b => b.trim())
      
      const updatedPosition: Position = {
        ...selectedPosition,
        ...formData,
        requirements: requirementsArray,
        responsibilities: responsibilitiesArray,
        benefits: benefitsArray,
        updated_at: new Date().toISOString().split('T')[0]
      }

      setPositions(positions.map(position => 
        position.id === selectedPosition.id ? updatedPosition : position
      ))
      setIsEditDialogOpen(false)
      setSelectedPosition(null)
      resetForm()
      toast({
        title: "Position Updated",
        description: "Position has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating position:", error)
      toast({
        title: "Error",
        description: "Failed to update position",
        variant: "destructive",
      })
    }
  }

  const handleDeletePosition = async (positionId: string) => {
    try {
      setPositions(positions.filter(position => position.id !== positionId))
      toast({
        title: "Position Deleted",
        description: "Position has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting position:", error)
      toast({
        title: "Error",
        description: "Failed to delete position",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "",
      employment_type: "full-time",
      experience_level: "mid",
      salary_range: "",
      description: "",
      requirements: "",
      responsibilities: "",
      benefits: "",
      status: "open",
      application_deadline: "",
      posted_date: ""
    })
  }

  const openEditDialog = (position: Position) => {
    setSelectedPosition(position)
    setFormData({
      title: position.title,
      department: position.department,
      location: position.location,
      employment_type: position.employment_type as "full-time" | "part-time" | "contract" | "internship",
      experience_level: position.experience_level as "entry" | "mid" | "senior" | "lead",
      salary_range: position.salary_range || "",
      description: position.description,
      requirements: position.requirements.join('\n'),
      responsibilities: position.responsibilities.join('\n'),
      benefits: position.benefits.join('\n'),
      status: position.status as "open" | "closed" | "draft",
      application_deadline: position.application_deadline || "",
      posted_date: position.posted_date
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

  const getExperienceBadgeVariant = (level: string) => {
    switch (level) {
      case 'entry': return 'secondary'
      case 'mid': return 'default'
      case 'senior': return 'default'
      case 'lead': return 'destructive'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Positions Management</h1>
          <p className="text-gray-600">Loading positions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Positions Management</h1>
          <p className="text-gray-600">Manage job openings and career opportunities</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Position</DialogTitle>
              <DialogDescription>
                Create a new job opening for your company
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Senior Full Stack Developer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({...formData, department: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Remote / Dar es Salaam"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
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
                      <SelectItem value="lead">Lead/Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary_range">Salary Range (Optional)</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                    placeholder="e.g., $50,000 - $70,000"
                  />
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="posted_date">Posted Date</Label>
                  <Input
                    id="posted_date"
                    type="date"
                    value={formData.posted_date}
                    onChange={(e) => setFormData({...formData, posted_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="application_deadline">Application Deadline (Optional)</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe the role and what you're looking for..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="5+ years of experience in web development&#10;Strong proficiency in React and Node.js&#10;Experience with TypeScript"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                <Textarea
                  id="responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                  placeholder="Develop and maintain web applications&#10;Collaborate with cross-functional teams&#10;Code reviews and mentoring"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                  placeholder="Competitive salary and equity&#10;Remote work flexibility&#10;Health insurance"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddPosition} className="bg-navy hover:bg-navy/90">
                  Add Position
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
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <div className="space-y-4">
        {filteredPositions.map((position) => (
          <Card key={position.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{position.title}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {position.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {position.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {position.employment_type.replace('-', ' ')}
                    </span>
                    {position.salary_range && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {position.salary_range}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={getStatusBadgeVariant(position.status)}>
                    {position.status}
                  </Badge>
                  <Badge variant={getExperienceBadgeVariant(position.experience_level)}>
                    {position.experience_level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 line-clamp-3">{position.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Key Requirements:</p>
                    <ul className="text-gray-600 space-y-1">
                      {position.requirements.slice(0, 3).map((req, index) => (
                        <li key={index} className="text-xs">• {req}</li>
                      ))}
                      {position.requirements.length > 3 && (
                        <li className="text-xs text-gray-500">+{position.requirements.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Responsibilities:</p>
                    <ul className="text-gray-600 space-y-1">
                      {position.responsibilities.slice(0, 3).map((resp, index) => (
                        <li key={index} className="text-xs">• {resp}</li>
                      ))}
                      {position.responsibilities.length > 3 && (
                        <li className="text-xs text-gray-500">+{position.responsibilities.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Benefits:</p>
                    <ul className="text-gray-600 space-y-1">
                      {position.benefits.slice(0, 3).map((benefit, index) => (
                        <li key={index} className="text-xs">• {benefit}</li>
                      ))}
                      {position.benefits.length > 3 && (
                        <li className="text-xs text-gray-500">+{position.benefits.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Posted: {position.posted_date}
                    {position.application_deadline && (
                      <span className="ml-4">Deadline: {position.application_deadline}</span>
                    )}
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
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
                ? "Try adjusting your filters to see more positions."
                : "Get started by posting your first job opening."}
            </p>
            {(!searchTerm && statusFilter === "all" && departmentFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-navy hover:bg-navy/90">
                <Plus className="h-4 w-4 mr-2" />
                Post Your First Position
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update job position information and details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label htmlFor="edit-title">Job Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Senior Full Stack Developer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData({...formData, department: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Remote / Dar es Salaam"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
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
                    <SelectItem value="lead">Lead/Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-salary_range">Salary Range (Optional)</Label>
                <Input
                  id="edit-salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g., $50,000 - $70,000"
                />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-posted_date">Posted Date</Label>
                <Input
                  id="edit-posted_date"
                  type="date"
                  value={formData.posted_date}
                  onChange={(e) => setFormData({...formData, posted_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-application_deadline">Application Deadline (Optional)</Label>
                <Input
                  id="edit-application_deadline"
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Job Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role and what you're looking for..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-requirements">Requirements (one per line)</Label>
              <Textarea
                id="edit-requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                placeholder="5+ years of experience in web development&#10;Strong proficiency in React and Node.js&#10;Experience with TypeScript"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-responsibilities">Responsibilities (one per line)</Label>
              <Textarea
                id="edit-responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                placeholder="Develop and maintain web applications&#10;Collaborate with cross-functional teams&#10;Code reviews and mentoring"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="edit-benefits">Benefits (one per line)</Label>
              <Textarea
                id="edit-benefits"
                value={formData.benefits}
                onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                placeholder="Competitive salary and equity&#10;Remote work flexibility&#10;Health insurance"
                rows={3}
              />
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
