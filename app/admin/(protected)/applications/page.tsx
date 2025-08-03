"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  getApplications, 
  updateApplicationStatus, 
  scheduleInterview, 
  deleteApplication,
  getApplicationStats 
} from "@/lib/applications-actions"
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applications Management</h1>
          <p className="text-gray-600">Manage job applications and track hiring progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Interviews Scheduled</p>
                  <p className="text-2xl font-bold">{stats.interview_scheduled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Hired</p>
                  <p className="text-2xl font-bold">{stats.hired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Under Review</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="interview_completed">Interview Completed</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by position" />
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
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{application.first_name} {application.last_name}</p>
                        <p className="text-sm text-gray-600">{application.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{application.position_title}</p>
                        <p className="text-sm text-gray-600">{application.position_department}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(application.applied_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[application.status]}>
                        {statusLabels[application.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {application.experience_years ? `${application.experience_years} years` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(application)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(application)
                            setIsStatusDialogOpen(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {application.status !== 'interview_scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApplication(application)
                              setIsInterviewDialogOpen(true)
                            }}
                          >
                            <CalendarDays className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
