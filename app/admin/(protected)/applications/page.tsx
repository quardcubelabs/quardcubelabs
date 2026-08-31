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
import { 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  Mail, 
  Phone, 
  Globe, 
  DollarSign,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  CalendarDays
} from "lucide-react"
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

import { 
  getApplications, 
  updateApplicationStatus, 
  scheduleInterview, 
  deleteApplication, 
  getApplicationStats 
} from "@/lib/applications-actions"
import AdminLoading from "@/components/admin/admin-loading"
import type { Application } from "@/types/database"

interface ApplicationWithPosition extends Application {
  position_title: string
  position_department: string
  position_location: string
  position_employment_type: string
  position_experience_level: string
}

const statusColors = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold",
  reviewing: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 font-bold",
  interview_scheduled: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold",
  interview_completed: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold",
  hired: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold",
  rejected: "bg-brand-red/15 text-brand-red border-brand-red/30 font-bold"
}

const statusLabels: Record<string, string> = {
  pending: "Pending Review",
  reviewing: "Under Review",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  hired: "Hired",
  rejected: "Rejected"
}

export default function ApplicationsManagement() {
  const { isDark } = useAdminTheme()
  const [applications, setApplications] = useState<ApplicationWithPosition[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithPosition | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  
  // Form states
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewNotes, setInterviewNotes] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")

  const { toast } = useToast()

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const result = await getApplications()
      if (result.error) throw new Error(result.error)
      setApplications((result.data || []) as ApplicationWithPosition[])
      setFilteredApplications((result.data || []) as ApplicationWithPosition[])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch applications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getApplicationStats()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  useEffect(() => {
    fetchApplications()
    fetchStats()
  }, [])

  useEffect(() => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(app => 
        `${app.first_name || ''} ${app.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter(app => app.position_id === positionFilter)
    }

    setFilteredApplications(filtered)
  }, [applications, searchTerm, statusFilter, positionFilter])

  const handleUpdateStatus = async (statusVal: Application['status']) => {
    if (!selectedApplication) return

    try {
      const result = await updateApplicationStatus(
        selectedApplication.id, 
        statusVal, 
        statusNotes
      )

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Status Updated",
          description: `Application status changed to ${statusLabels[statusVal] || statusVal}`
        })
        fetchApplications()
        fetchStats()
        setIsStatusDialogOpen(false)
        setStatusNotes("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    }
  }

  const handleStatusUpdate = handleUpdateStatus

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !interviewDate) return

    try {
      const result = await scheduleInterview(
        selectedApplication.id,
        interviewDate,
        interviewNotes
      )

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Interview Scheduled",
          description: "Interview has been scheduled successfully"
        })
        fetchApplications()
        fetchStats()
        setIsInterviewDialogOpen(false)
        setInterviewDate("")
        setInterviewNotes("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive"
      })
    }
  }

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return

    try {
      const result = await deleteApplication(id)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Application Deleted",
          description: "Application has been deleted successfully"
        })
        fetchApplications()
        fetchStats()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive"
      })
    }
  }

  const uniquePositions = Array.from(new Set(applications.map(app => app.position_id)))
    .map(id => applications.find(app => app.position_id === id))
    .filter(Boolean)

  if (loading) {
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
              Applications <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Review and manage job applicant resumes, candidate submissions, and hiring workflow
            </p>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {[
            { title: "Total Applications", value: (stats.total || 0).toString(), icon: Users },
            { title: "Pending Review", value: (stats.pending || 0).toString(), icon: Clock },
            { title: "Interviews", value: (stats.interview_scheduled || 0).toString(), icon: Calendar },
            { title: "Hired", value: (stats.hired || 0).toString(), icon: CheckCircle }
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
      )}

      {/* 3. Category & Search Filters Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
      )}>
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["All", "pending", "reviewing", "interview_scheduled", "interview_completed", "hired", "rejected"].map((status) => (
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
              {status === "All" ? "All Applications" : (statusLabels[status] || status.replace("_", " "))}
            </button>
          ))}
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search by candidate name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 rounded-xl border border-teal text-sm font-medium",
                isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
              )}
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className={cn("w-full sm:w-[200px] h-10 rounded-xl border border-teal font-bold text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {uniquePositions.map((position) => (
                <SelectItem key={position!.position_id} value={position!.position_id}>
                  {position!.position_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Header Row */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Applications <span className="text-gray-400 font-normal">({filteredApplications.length})</span>
        </h2>
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{application.first_name} {application.last_name}</h3>
                  <Badge className={statusColors[application.status]}>
                    {statusLabels[application.status]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{application.email}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {application.position_title}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {application.position_department}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(application.applied_at).toLocaleDateString()}
                  </span>
                  {application.experience_years && (
                    <span>{application.experience_years} yrs exp</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedApplication(application); setIsViewDialogOpen(true) }}
                  className="text-white bg-navy hover:text-navy hover:bg-brand-red"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedApplication(application); setIsStatusDialogOpen(true) }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                {application.status !== 'interview_scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedApplication(application); setIsInterviewDialogOpen(true) }}
                    className="text-white bg-navy hover:text-navy hover:bg-brand-red"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredApplications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No applications found matching your filters.</p>
          </div>
        )}
      </div>

      {/* View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p>{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p>{selectedApplication.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p>{selectedApplication.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p>{selectedApplication.location || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Position Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Position Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Position</Label>
                    <p>{selectedApplication.position_title}</p>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <p>{selectedApplication.position_department}</p>
                  </div>
                  <div>
                    <Label>Applied Date</Label>
                    <p>{new Date(selectedApplication.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={statusColors[selectedApplication.status]}>
                      {statusLabels[selectedApplication.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Experience</Label>
                    <p>{selectedApplication.experience_years ? `${selectedApplication.experience_years} years` : 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Current Salary</Label>
                    <p>{selectedApplication.current_salary || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Expected Salary</Label>
                    <p>{selectedApplication.expected_salary || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label>Availability</Label>
                    <p>{selectedApplication.availability_date ? new Date(selectedApplication.availability_date).toLocaleDateString() : 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>LinkedIn</Label>
                    <p>{selectedApplication.linkedin_url || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Portfolio</Label>
                    <p>{selectedApplication.portfolio_url || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cover Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedApplication.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Internal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedApplication.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedApplication?.first_name} {selectedApplication?.last_name}'s application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select onValueChange={(value) => handleUpdateStatus(value as Application['status'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Under Review</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="interview_completed">Interview Completed</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview for {selectedApplication?.first_name} {selectedApplication?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Interview Date & Time</Label>
              <Input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Add any notes about the interview..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInterviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleInterview}>
                Schedule Interview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
