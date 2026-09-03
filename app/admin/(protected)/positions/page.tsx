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
import { Plus, Edit, Trash2, Search, Users, Calendar, MapPin, Clock, CheckCircle, XCircle, RefreshCw, Briefcase, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setSelectedPosition(null)
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
    } finally {
      setIsSubmitting(false)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': 
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold text-xs whitespace-nowrap">Open</Badge>
      case 'closed': 
        return <Badge className="bg-red-500/15 text-brand-red border-red-500/30 font-bold text-xs whitespace-nowrap">Closed</Badge>
      case 'draft': 
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-xs whitespace-nowrap">Draft</Badge>
      default: 
        return <Badge className="bg-gray-500/15 text-gray-700 dark:text-gray-300 font-bold text-xs whitespace-nowrap">{status}</Badge>
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

  const formatStatNumber = (num: number) => {
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

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 text-navy truncate">
              Position <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-navy/90 font-semibold line-clamp-1 sm:line-clamp-none">
              Manage company job openings, hiring criteria, and positions
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={loadPositions}
              className={cn("flex-1 sm:flex-initial font-bold rounded-xl h-10 px-3 sm:px-4 border-2 transition-all text-xs sm:text-sm", isDark ? "border-teal/40 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm")}
            >
              <RefreshCw className="h-4 w-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
            <Button 
              className="flex-1 sm:flex-initial bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-3 sm:px-4 shadow-md transition-all active:scale-95 text-xs sm:text-sm" 
              onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
              New Position
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { title: "Total Positions", value: formatStatNumber(totalPositions), icon: Users },
          { title: "Open Positions", value: formatStatNumber(openPositions), icon: CheckCircle },
          { title: "Closed Positions", value: formatStatNumber(closedPositions), icon: XCircle },
          { title: "Draft Positions", value: formatStatNumber(draftPositions), icon: Clock }
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

      {/* 3. Category & Search Filters Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
      )}>
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "open", "closed", "draft"].map((status) => (
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
              {status === "All" ? `All (${totalPositions})` : `${status.charAt(0).toUpperCase() + status.slice(1)} (${positions.filter(p => p.status === status).length})`}
            </button>
          ))}
        </div>

        {/* Search & Department Inputs */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search positions by title, department, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm w-full",
                isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
              )}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className={cn("w-full sm:w-[180px] h-10 sm:h-11 rounded-xl border-2 font-bold text-xs shrink-0", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

      {/* 4. Positions Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl border-2 overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[620px] sm:min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Job Title</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white hidden sm:table-cell">Department & Location</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white hidden md:table-cell">Type / Level</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Status</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white hidden lg:table-cell">Salary / Deadline</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredPositions.map((position) => (
                <tr 
                  key={position.id}
                  className={cn(
                    "transition-colors duration-150",
                    isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                  )}
                >
                  <td className="py-3.5 px-3 sm:px-4 max-w-[240px] sm:max-w-xs">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Total circle briefcase icon */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-navy text-teal flex items-center justify-center shrink-0 shadow-sm border border-navy/20">
                        <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
                          <span className="truncate">{position.title}</span>
                          {position.featured && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-amber-400/20 text-amber-600 dark:text-amber-400 shrink-0">
                              Featured
                            </span>
                          )}
                          {position.remote_allowed && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-teal-400/20 text-teal dark:text-teal-300 shrink-0">
                              Remote
                            </span>
                          )}
                        </div>
                        <p className={cn("text-[11px] sm:text-xs line-clamp-1 truncate font-medium", isDark ? "text-slate-400" : "text-navy/70")}>
                          {position.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-xs font-bold hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-xs sm:text-sm text-navy dark:text-teal-300">{position.department}</span>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <MapPin className="h-3 w-3" /> {position.location}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-xs font-semibold hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="capitalize text-xs">{position.employment_type.replace('_', ' ')}</span>
                      <span className="text-muted-foreground capitalize text-[11px]">{position.experience_level} level</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4">
                    {getStatusBadge(position.status)}
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-xs font-medium hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {position.salary_range ? (
                        <span className="font-bold text-navy dark:text-teal-300 text-xs">{position.salary_range}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Undisclosed</span>
                      )}
                      {position.application_deadline && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(position.application_deadline)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      <button 
                        onClick={() => openEditDialog(position)}
                        className="p-1.5 sm:p-2 rounded-lg bg-navy/10 text-navy dark:bg-teal/15 dark:text-teal hover:bg-navy hover:text-white dark:hover:bg-teal dark:hover:text-navy transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                        title="Edit Position"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePosition(position.id)}
                        className="p-1.5 sm:p-2 rounded-lg bg-red-50 text-brand-red dark:bg-red-950/30 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
                        title="Delete Position"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold text-base">No positions found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your department, status, or search filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Add Position Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-teal flex items-center justify-center shadow-xs border border-navy/20 shrink-0">
                <Briefcase className="h-4 w-4 text-teal" />
              </div>
              Create New Position
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Add a new job opening and hiring criteria to your careers portal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePosition} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Senior Fullstack Engineer"
                  required
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-bold uppercase tracking-wider">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g. Software Engineering"
                  required
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g. Dar es Salaam / Remote"
                  required
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salary_range" className="text-xs font-bold uppercase tracking-wider">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  placeholder="e.g. TZS 3,000,000 - 5,000,000"
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="employment_type" className="text-xs font-bold uppercase tracking-wider">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(value: any) => setFormData({...formData, employment_type: value})}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

              <div className="space-y-1.5">
                <Label htmlFor="experience_level" className="text-xs font-bold uppercase tracking-wider">Experience Level</Label>
                <Select 
                  value={formData.experience_level} 
                  onValueChange={(value: any) => setFormData({...formData, experience_level: value})}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 border-navy/10 dark:border-teal/20">
                <input
                  type="checkbox"
                  checked={formData.remote_allowed}
                  onChange={(e) => setFormData({...formData, remote_allowed: e.target.checked})}
                  className="rounded text-teal focus:ring-teal h-4 w-4"
                />
                <span className="text-xs font-bold">Remote Work Permitted</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 border-navy/10 dark:border-teal/20">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="rounded text-teal focus:ring-teal h-4 w-4"
                />
                <span className="text-xs font-bold">Featured Priority Opening</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider">Job Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe role objectives, daily tasks, and team alignment..."
                rows={3}
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="application_deadline" className="text-xs font-bold uppercase tracking-wider">Application Deadline</Label>
              <Input
                id="application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider">Key Requirements</Label>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="text-xs font-bold text-teal hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Requirement
                </button>
              </div>
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder="e.g. 3+ years experience with Next.js & TypeScript"
                      className={cn("h-10 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
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
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
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
                Create Position
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-teal flex items-center justify-center shadow-xs border border-navy/20 shrink-0">
                <Briefcase className="h-4 w-4 text-teal" />
              </div>
              Edit Position Details
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Update job specifications, experience criteria, and status
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePosition} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title" className="text-xs font-bold uppercase tracking-wider">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-department" className="text-xs font-bold uppercase tracking-wider">Department *</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-location" className="text-xs font-bold uppercase tracking-wider">Location *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-salary_range" className="text-xs font-bold uppercase tracking-wider">Salary Range</Label>
                <Input
                  id="edit-salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData({...formData, salary_range: e.target.value})}
                  className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-employment_type" className="text-xs font-bold uppercase tracking-wider">Employment Type</Label>
                <Select 
                  value={formData.employment_type} 
                  onValueChange={(value: any) => setFormData({...formData, employment_type: value})}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

              <div className="space-y-1.5">
                <Label htmlFor="edit-experience_level" className="text-xs font-bold uppercase tracking-wider">Experience Level</Label>
                <Select 
                  value={formData.experience_level} 
                  onValueChange={(value: any) => setFormData({...formData, experience_level: value})}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-bold uppercase tracking-wider">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 border-navy/10 dark:border-teal/20">
                <input
                  type="checkbox"
                  checked={formData.remote_allowed}
                  onChange={(e) => setFormData({...formData, remote_allowed: e.target.checked})}
                  className="rounded text-teal focus:ring-teal h-4 w-4"
                />
                <span className="text-xs font-bold">Remote Work Permitted</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 border-navy/10 dark:border-teal/20">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="rounded text-teal focus:ring-teal h-4 w-4"
                />
                <span className="text-xs font-bold">Featured Priority Opening</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-xs font-bold uppercase tracking-wider">Job Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-application_deadline" className="text-xs font-bold uppercase tracking-wider">Application Deadline</Label>
              <Input
                id="edit-application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider">Key Requirements</Label>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="text-xs font-bold text-teal hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Add Requirement
                </button>
              </div>
              <div className="space-y-2">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className={cn("h-10 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
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
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
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
                Update Position
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
