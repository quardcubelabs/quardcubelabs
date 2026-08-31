"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
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
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  interview_scheduled: "bg-purple-100 text-purple-800",
  interview_completed: "bg-indigo-100 text-indigo-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
}

const statusLabels = {
  pending: "Pending",
  reviewing: "Under Review",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  hired: "Hired",
  rejected: "Rejected"
}

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<ApplicationWithPosition[]>([])
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithPosition[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithPosition | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false)
  const [statusNotes, setStatusNotes] = useState("")
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewNotes, setInterviewNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchApplications()
    fetchStats()
  }, [])

  useEffect(() => {
    filterApplications()
  }, [applications, searchTerm, statusFilter, positionFilter])

  const fetchApplications = async () => {
    try {
      const result = await getApplications()
      if (result.data && !result.error) {
        setApplications(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch applications",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await getApplicationStats()
      if (result.data && !result.error) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filterApplications = () => {
    let filtered = applications

    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position_title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter(app => app.position_id === positionFilter)
    }

    setFilteredApplications(filtered)
  }

  const handleUpdateStatus = async (newStatus: Application['status']) => {
    if (!selectedApplication) return

    try {
      const result = await updateApplicationStatus(
        selectedApplication.id, 
        newStatus, 
        statusNotes,
        "Admin" // You can get this from auth context
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
          description: `Application status updated to ${statusLabels[newStatus]}`
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
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Applications Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Review and manage job applications</p>
        </div>
        <AdminLoading message="Loading applications..." size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header Card in Teal without borders */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
              Applications <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Review and manage job applicant resumes, candidate submissions, and statuses
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Applications</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Interviews</p>
                <p className="text-2xl font-bold text-purple-700">{stats.interview_scheduled}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-green-600 font-medium">Hired</p>
                <p className="text-2xl font-bold text-green-700">{stats.hired}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {["All", "pending", "reviewing", "interview_scheduled", "interview_completed", "hired", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === "All" ? "all" : status)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              (status === "All" && statusFilter === "all") || statusFilter === status
                ? "text-red-500 border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {status === "All" ? "All Applications" : (statusLabels[status as keyof typeof statusLabels] || status)}
          </button>
        ))}
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search by name, email, or position..."
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
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[180px]">
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
