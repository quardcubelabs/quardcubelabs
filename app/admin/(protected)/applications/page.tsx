"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  CalendarDays,
  RefreshCw,
  Trash2,
  Briefcase,
  ExternalLink,
  Linkedin,
  Edit,
  ShieldCheck
} from "lucide-react"
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

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold",
  reviewing: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 font-bold",
  interview_scheduled: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold",
  interview_completed: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold",
  hired: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold",
  rejected: "bg-red-500/15 text-brand-red border-red-500/30 font-bold"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  
  // Form states
  const [interviewDate, setInterviewDate] = useState("")
  const [interviewNotes, setInterviewNotes] = useState("")
  const [newStatus, setNewStatus] = useState<Application['status']>("reviewing")
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
        app.position_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position_department?.toLowerCase().includes(searchTerm.toLowerCase())
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
    setIsSubmitting(true)

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
        await fetchApplications()
        await fetchStats()
        setIsStatusDialogOpen(false)
        setStatusNotes("")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !interviewDate) return
    setIsSubmitting(true)

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
        await fetchApplications()
        await fetchStats()
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this applicant record?")) return

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
          description: "Application record deleted successfully"
        })
        await fetchApplications()
        await fetchStats()
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

  if (loading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 sm:space-y-6 overflow-hidden">
      {/* 1. Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-4 sm:mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 truncate">
              Applications <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Management</span>
            </h1>
            <p className={cn("text-xs sm:text-sm md:text-base font-semibold line-clamp-1 sm:line-clamp-none", isDark ? "text-teal-300" : "text-navy/90")}>
              Review candidate submissions, schedule interviews, and manage hiring pipeline
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={() => { fetchApplications(); fetchStats(); }}
              className={cn("flex-1 sm:flex-initial font-bold rounded-xl h-10 px-3 sm:px-4 border-2 transition-all text-xs sm:text-sm", isDark ? "border-teal/40 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm")}
            >
              <RefreshCw className="h-4 w-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { title: "Total Applications", value: formatStatNumber(stats.total || 0), icon: Users },
            { title: "Pending Review", value: formatStatNumber(stats.pending || 0), icon: Clock },
            { title: "Interviews", value: formatStatNumber(stats.interview_scheduled || 0), icon: Calendar },
            { title: "Hired", value: formatStatNumber(stats.hired || 0), icon: CheckCircle }
          ].map((stat, idx) => (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
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
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
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
      )}

      {/* 3. Category & Search Filters Bar */}
      <Card className={cn(
        "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "pending", "reviewing", "interview_scheduled", "interview_completed", "hired", "rejected"].map((status) => (
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
              {status === "All" ? `All (${applications.length})` : (statusLabels[status] || status.replace("_", " "))}
            </button>
          ))}
        </div>

        {/* Search & Position Dropdown */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
            <Input
              placeholder="Search by candidate name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm w-full",
                isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
              )}
            />
          </div>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className={cn("w-full sm:w-[220px] h-10 sm:h-11 rounded-xl border-2 font-bold text-xs shrink-0", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
              <SelectValue placeholder="All Positions" />
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

      {/* 4. Applications Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[620px] sm:min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Candidate</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white hidden sm:table-cell">Position & Department</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white hidden md:table-cell">Experience / Applied</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white">Status</th>
                <th className="py-3 sm:py-3.5 px-3 sm:px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredApplications.map((application) => (
                <tr 
                  key={application.id}
                  className={cn(
                    "transition-colors duration-150",
                    isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                  )}
                >
                  <td className="py-3.5 px-3 sm:px-4 max-w-[240px] sm:max-w-xs">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Total circle file icon */}
                      <div className={cn(
                        "w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                        isDark ? "bg-teal text-navy border-teal" : "bg-navy text-teal border-navy/20"
                      )}>
                        <FileText className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-navy" : "text-teal")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("font-bold text-xs sm:text-sm truncate", isDark ? "text-white" : "text-navy")}>
                          {application.first_name} {application.last_name}
                        </div>
                        <p className={cn("text-[11px] sm:text-xs truncate font-medium", isDark ? "text-slate-300" : "text-navy/70")}>
                          {application.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-xs font-bold hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("font-bold text-xs sm:text-sm", isDark ? "text-white" : "text-navy")}>{application.position_title}</span>
                      <span className="text-muted-foreground text-[11px]">{application.position_department}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-xs font-medium hidden md:table-cell">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-xs">{application.experience_years ? `${application.experience_years} yrs exp` : "Not specified"}</span>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3" /> {new Date(application.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4">
                    <Badge className={cn("text-xs whitespace-nowrap font-bold", statusColors[application.status] || "bg-gray-500/15")}>
                      {statusLabels[application.status] || application.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      <button 
                        onClick={() => { setSelectedApplication(application); setIsViewDialogOpen(true) }}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                          isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                        )}
                        title="View Full Profile"
                      >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedApplication(application); 
                          setNewStatus(application.status as Application['status']);
                          setIsStatusDialogOpen(true) 
                        }}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                          isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                        )}
                        title="Edit Application Status"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      {application.status !== 'interview_scheduled' && (
                        <button 
                          onClick={() => { setSelectedApplication(application); setIsInterviewDialogOpen(true) }}
                          className={cn(
                            "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                            isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-teal/15 text-teal hover:bg-teal hover:text-navy"
                          )}
                          title="Schedule Interview"
                        >
                          <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteApplication(application.id)}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                          isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                        )}
                        title="Delete Applicant"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold text-base">No candidate applications found</p>
                    <p className="text-xs font-medium mt-1">Try adjusting your position or status filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. View Application Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-teal flex items-center justify-center shadow-xs border border-navy/20 shrink-0">
                <FileText className="h-4 w-4 text-teal" />
              </div>
              Applicant Profile Details
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Candidate credentials, application timeline, and evaluation notes
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 pt-2">
              {/* Personal & Contact Details */}
              <div className={cn("p-3.5 sm:p-4 rounded-2xl border-2", isDark ? "bg-white/5 border-teal/20" : "bg-slate-50 border-navy/10")}>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Candidate Name</span>
                    <span className="font-bold">{selectedApplication.first_name} {selectedApplication.last_name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Email Address</span>
                    <span className="font-bold">{selectedApplication.email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Phone Number</span>
                    <span>{selectedApplication.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Location</span>
                    <span>{selectedApplication.location || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Position & Application Info */}
              <div className={cn("p-3.5 sm:p-4 rounded-2xl border-2", isDark ? "bg-white/5 border-teal/20" : "bg-slate-50 border-navy/10")}>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-teal" /> Target Opening
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Position</span>
                    <span className="font-bold">{selectedApplication.position_title}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Department</span>
                    <span>{selectedApplication.position_department}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Date Applied</span>
                    <span>{new Date(selectedApplication.applied_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Current Status</span>
                    <Badge className={statusColors[selectedApplication.status]}>
                      {statusLabels[selectedApplication.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Professional & Compensation Info */}
              <div className={cn("p-3.5 sm:p-4 rounded-2xl border-2", isDark ? "bg-white/5 border-teal/20" : "bg-slate-50 border-navy/10")}>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal" /> Professional Background & Compensation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Years Experience</span>
                    <span className="font-bold">{selectedApplication.experience_years ? `${selectedApplication.experience_years} years` : 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Availability</span>
                    <span>{selectedApplication.availability_date ? new Date(selectedApplication.availability_date).toLocaleDateString() : 'Immediate / Flexible'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Current Salary</span>
                    <span>{selectedApplication.current_salary || 'Not disclosed'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase block">Expected Salary</span>
                    <span>{selectedApplication.expected_salary || 'Negotiable'}</span>
                  </div>
                  {selectedApplication.linkedin_url && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">LinkedIn</span>
                      <a href={selectedApplication.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-teal font-bold hover:underline flex items-center gap-1 text-xs">
                        <Linkedin className="h-3 w-3" /> {selectedApplication.linkedin_url}
                      </a>
                    </div>
                  )}
                  {selectedApplication.portfolio_url && (
                    <div className="sm:col-span-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase block">Portfolio / GitHub</span>
                      <a href={selectedApplication.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-teal font-bold hover:underline flex items-center gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" /> {selectedApplication.portfolio_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div className={cn("p-3.5 sm:p-4 rounded-2xl border-2", isDark ? "bg-white/5 border-teal/20" : "bg-slate-50 border-navy/10")}>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal" /> Cover Letter
                  </h3>
                  <p className="whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed">
                    {selectedApplication.cover_letter}
                  </p>
                </div>
              )}

              <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4">
                <Button 
                  onClick={() => setIsViewDialogOpen(false)}
                  className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 sm:h-11 px-5 sm:px-6 shadow-md text-xs sm:text-sm"
                >
                  Close Profile
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-xl rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-teal flex items-center justify-center shadow-xs border border-navy/20 shrink-0">
                <MessageSquare className="h-4 w-4 text-teal" />
              </div>
              Update Candidate Status
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Select hiring pipeline stage for {selectedApplication?.first_name} {selectedApplication?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Visual 6-Stage Selection Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Select Pipeline Stage (6 Stages)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: "pending", label: "Pending Review", desc: "Initial receipt", icon: Clock },
                  { key: "reviewing", label: "Under Review", desc: "Reviewing resume", icon: Users },
                  { key: "interview_scheduled", label: "Interview Scheduled", desc: "Invited", icon: Calendar },
                  { key: "interview_completed", label: "Interview Done", desc: "Under decision", icon: CheckCircle },
                  { key: "hired", label: "Hired", desc: "Offer accepted", icon: ShieldCheck },
                  { key: "rejected", label: "Rejected", desc: "Not selected", icon: XCircle }
                ].map((stage) => {
                  const isSelected = newStatus === stage.key
                  const Icon = stage.icon
                  return (
                    <button
                      key={stage.key}
                      type="button"
                      onClick={() => setNewStatus(stage.key as Application['status'])}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all duration-150 flex flex-col justify-between cursor-pointer",
                        isSelected
                          ? isDark
                            ? "bg-teal/25 border-teal text-white shadow-md ring-2 ring-teal/30"
                            : "bg-navy text-white border-navy shadow-md ring-2 ring-navy/20"
                          : isDark
                            ? "bg-white/5 border-teal/20 text-slate-300 hover:bg-white/10 hover:border-teal/40"
                            : "bg-slate-50 border-navy/15 text-navy hover:bg-slate-100 hover:border-navy/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected ? (isDark ? "text-teal-300" : "text-teal") : "text-muted-foreground")} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-teal shrink-0"></span>}
                      </div>
                      <div>
                        <p className="font-bold text-xs leading-tight">{stage.label}</p>
                        <p className={cn("text-[10px] mt-0.5 leading-snug line-clamp-1", isSelected ? (isDark ? "text-teal-200/80" : "text-slate-200") : "text-muted-foreground")}>
                          {stage.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dropdown Alternative */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Or Select From Dropdown</Label>
              <Select 
                value={newStatus} 
                onValueChange={(value) => setNewStatus(value as Application['status'])}
              >
                <SelectTrigger className={cn("h-10 sm:h-11 rounded-xl border-2 font-bold text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(
                  "rounded-xl border-2 shadow-xl z-50",
                  isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
                )}>
                  <SelectItem value="pending" className="font-bold text-xs sm:text-sm cursor-pointer">Pending Review</SelectItem>
                  <SelectItem value="reviewing" className="font-bold text-xs sm:text-sm cursor-pointer">Under Review</SelectItem>
                  <SelectItem value="interview_scheduled" className="font-bold text-xs sm:text-sm cursor-pointer">Interview Scheduled</SelectItem>
                  <SelectItem value="interview_completed" className="font-bold text-xs sm:text-sm cursor-pointer">Interview Completed</SelectItem>
                  <SelectItem value="hired" className="font-bold text-xs sm:text-sm cursor-pointer">Hired</SelectItem>
                  <SelectItem value="rejected" className="font-bold text-xs sm:text-sm cursor-pointer">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Stage Notes (Optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add evaluation feedback or rationale..."
                rows={3}
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsStatusDialogOpen(false)}
                className={cn("rounded-xl border-2 font-bold h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpdateStatus(newStatus)}
                disabled={isSubmitting}
                className="bg-teal text-navy font-black hover:bg-teal-400 rounded-xl h-10 sm:h-11 px-5 sm:px-6 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Save Status
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. Schedule Interview Dialog */}
      <Dialog open={isInterviewDialogOpen} onOpenChange={setIsInterviewDialogOpen}>
        <DialogContent className={cn(
          "w-[95vw] sm:max-w-md rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 sm:p-6",
          isDark ? "bg-[#060a22] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader className="border-b border-navy/10 dark:border-teal/20 pb-4">
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-navy text-teal flex items-center justify-center shadow-xs border border-navy/20 shrink-0">
                <CalendarDays className="h-4 w-4 text-teal" />
              </div>
              Schedule Interview
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Set interview date and send invitation to {selectedApplication?.first_name} {selectedApplication?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Interview Date & Time *</Label>
              <Input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                required
                className={cn("h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Interview Details / Video Link</Label>
              <Textarea
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Meeting links, interview panel members, or instructions..."
                rows={3}
                className={cn("rounded-xl border-2 font-medium text-xs sm:text-sm", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}
              />
            </div>

            <DialogFooter className="border-t border-navy/10 dark:border-teal/20 pt-4 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsInterviewDialogOpen(false)}
                className={cn("rounded-xl border-2 font-bold h-10 sm:h-11 px-4 sm:px-5 text-xs sm:text-sm", isDark ? "border-teal/30 text-white hover:bg-white/10" : "border-navy/20 text-navy hover:bg-slate-100")}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleScheduleInterview}
                disabled={isSubmitting || !interviewDate}
                className="bg-teal text-navy font-black hover:bg-teal-400 rounded-xl h-10 sm:h-11 px-5 sm:px-6 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                Schedule Interview
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
