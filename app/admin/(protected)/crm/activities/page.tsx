"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminLoading } from "@/components/admin"
import { cn } from "@/lib/utils"
import { getActivities, createActivity, completeActivity, getDeals } from "@/lib/crm-actions"
import { CrmActivity, ActivityType, CrmDeal } from "@/lib/erp/crm-types"
import {
  CheckSquare,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Video,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Mail,
  FileText,
  UserCheck,
  Eye,
  Briefcase,
  Building2,
  User,
  Sparkles,
  Check
} from "lucide-react"

const ACTIVITY_TYPES: { id: ActivityType; label: string; icon: any }[] = [
  { id: "call", label: "Phone Call", icon: Phone },
  { id: "meeting", label: "Client Meeting", icon: Video },
  { id: "site_visit", label: "Site Inspection / Survey", icon: MapPin },
  { id: "task", label: "Follow-up Task", icon: CheckSquare },
  { id: "email", label: "Email Dispatch", icon: Mail },
  { id: "note", label: "Technical Note", icon: FileText }
]

export default function ActivitiesPage() {
  const { toast } = useToast()
  const { isDark } = useAdminTheme()

  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")

  // Modals
  const [selectedViewActivity, setSelectedViewActivity] = useState<CrmActivity | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create Form State
  const [subject, setSubject] = useState("")
  const [activityType, setActivityType] = useState<ActivityType>("call")
  const [selectedDealId, setSelectedDealId] = useState<string>("none")
  const [customerName, setCustomerName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [assignedToName, setAssignedToName] = useState("Framani Mwamba")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [acts, dls] = await Promise.all([getActivities(), getDeals()])
      setActivities(acts)
      setDeals(dls)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load CRM activities.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject) {
      toast({
        title: "Missing Subject",
        description: "Please specify an activity subject.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const deal = deals.find(d => d.id === selectedDealId)
      await createActivity({
        subject,
        activity_type: activityType,
        deal_id: selectedDealId !== "none" ? selectedDealId : undefined,
        customer_name: customerName || (deal ? deal.customer_name : undefined),
        due_date: dueDate || new Date().toISOString().split("T")[0],
        description,
        status: "pending",
        assigned_to_name: assignedToName
      })
      toast({
        title: "Activity Scheduled",
        description: "Follow-up activity logged successfully."
      })
      setIsCreateOpen(false)
      setSubject("")
      setDescription("")
      setCustomerName("")
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Could not schedule activity.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = async (activityId: string) => {
    try {
      await completeActivity(activityId)
      toast({
        title: "Activity Completed",
        description: "Marked task as completed."
      })
      if (selectedViewActivity?.id === activityId) {
        setSelectedViewActivity(prev => prev ? { ...prev, status: "completed" } : null)
      }
      loadData()
    } catch {
      toast({
        title: "Error",
        description: "Could not update activity.",
        variant: "destructive"
      })
    }
  }

  const filteredActivities = activities.filter(a => {
    const matchesSearch =
      a.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.customer_name && a.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.assigned_to_name && a.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === "all" || a.activity_type === typeFilter
    const matchesStatus = statusFilter === "all" || a.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // KPI Calculations
  const pendingCount = activities.filter(a => a.status === "pending").length
  const completedCount = activities.filter(a => a.status === "completed").length
  const highTouchCount = activities.filter(a => ["call", "meeting", "site_visit"].includes(a.activity_type)).length

  if (isLoading && activities.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <div
        className={cn(
          "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
          isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
                isDark
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "bg-navy text-teal border border-navy/20"
              )}
            >
              <CheckSquare className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-black mb-0.5 sm:mb-1 truncate">
                Sales <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>Activities & Tasks</span>
              </h1>
              <p
                className={cn(
                  "text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-none",
                  isDark ? "text-teal-300/80" : "text-navy/90"
                )}
              >
                Client follow-ups, scheduled calls, technical site surveys, and reminders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-8 sm:h-11 px-2.5 sm:px-4 text-xs sm:text-sm font-bold border shadow-sm transition-all active:scale-95",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className={cn(
                "font-bold rounded-xl h-8 sm:h-11 px-3 sm:px-5 text-xs sm:text-sm gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Schedule Activity</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 4-Card KPI Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { title: "Total Activities", value: activities.length.toString(), icon: CheckSquare, color: isDark ? "text-white" : "text-navy" },
          { title: "Pending Tasks", value: pendingCount.toString(), icon: Clock, color: "text-amber-500" },
          { title: "Completed Items", value: completedCount.toString(), icon: CheckCircle2, color: "text-emerald-500" },
          { title: "Calls & Surveys", value: highTouchCount.toString(), icon: MapPin, color: isDark ? "text-white" : "text-navy" }
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
                <span className={cn("text-base sm:text-xl xl:text-2xl font-black truncate block font-mono leading-tight tracking-tight", stat.color)}>
                  {stat.value}
                </span>
              </div>
              <div className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                isDark 
                  ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                  : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
              )}>
                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5 shrink-0", isDark ? "text-teal" : "")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Search & Filter Card with Horizontal Scroll Tabs */}
      <Card
        className={cn(
          "rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 space-y-3 sm:space-y-4",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        {/* Horizontal Scrollable Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button
            size="sm"
            onClick={() => setTypeFilter("all")}
            className={cn(
              "rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all",
              typeFilter === "all"
                ? "bg-navy text-white shadow-md hover:bg-navy/90"
                : isDark
                ? "bg-white/5 text-slate-300 hover:bg-white/10"
                : "bg-slate-100 text-navy hover:bg-slate-200"
            )}
          >
            All Types
            <Badge
              variant="secondary"
              className={cn(
                "ml-1.5 px-1.5 py-0.2 text-[10px] font-black rounded-full",
                typeFilter === "all"
                  ? "bg-teal text-navy"
                  : isDark
                  ? "bg-white/10 text-white"
                  : "bg-navy/10 text-navy"
              )}
            >
              {activities.length}
            </Badge>
          </Button>

          {ACTIVITY_TYPES.map(type => {
            const count = activities.filter(a => a.activity_type === type.id).length
            const isSelected = typeFilter === type.id
            const Icon = type.icon

            return (
              <Button
                key={type.id}
                size="sm"
                onClick={() => setTypeFilter(type.id)}
                className={cn(
                  "rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all gap-1.5",
                  isSelected
                    ? "bg-navy text-white shadow-md hover:bg-navy/90"
                    : isDark
                    ? "bg-white/5 text-slate-300 hover:bg-white/10"
                    : "bg-slate-100 text-navy hover:bg-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {type.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full",
                    isSelected
                      ? "bg-teal text-navy"
                      : isDark
                      ? "bg-white/10 text-white"
                      : "bg-navy/10 text-navy"
                  )}
                >
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Search Bar + Status Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              className={cn(
                "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4",
                isDark ? "text-slate-400" : "text-navy/40"
              )}
            />
            <Input
              placeholder="Search activity subject, client, notes, or sales rep..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500 focus:border-teal"
                  : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40 focus:border-navy focus:bg-white"
              )}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
            {(["all", "pending", "completed"] as const).map(status => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-xl text-xs font-bold capitalize h-9 px-3",
                  statusFilter === status
                    ? "bg-navy text-white hover:bg-navy/90"
                    : isDark
                    ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    : "bg-slate-50 border-navy/20 text-navy hover:bg-slate-100"
                )}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. Activities Data Table */}
      <Card className={cn(
        "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        isDark ? "bg-[#060a22] border-none text-white shadow-none" : "bg-white border-2 border-navy/20 text-navy"
      )}>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy text-white font-black border-b border-navy/30">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Activity Type</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left">Subject & Task Details</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden sm:table-cell">Client / Account</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-left hidden md:table-cell">Due Date & Rep</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-center">Status</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-navy/60 dark:text-slate-400">
                    <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-40 text-navy dark:text-teal" />
                    <p className="font-bold text-base">No sales activities found</p>
                    <p className="text-xs font-medium mt-1">Adjust your search query or schedule a new task.</p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => {
                  const typeConfig = ACTIVITY_TYPES.find(t => t.id === act.activity_type) || ACTIVITY_TYPES[0]
                  const Icon = typeConfig.icon
                  const isDone = act.status === "completed"

                  return (
                    <tr
                      key={act.id}
                      className={cn(
                        "transition-colors duration-150",
                        isDark ? "hover:bg-teal/30 hover:text-white" : "hover:bg-teal/50 hover:text-navy",
                        isDone && "opacity-70"
                      )}
                    >
                      {/* Activity Type */}
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div
                            className={cn(
                              "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
                              isDone
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : isDark
                                ? "bg-navy text-teal border-teal/30"
                                : "bg-teal text-navy border-teal/40"
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <span className={cn("font-bold text-xs sm:text-sm", isDark ? "text-slate-200" : "text-navy")}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>

                      {/* Subject & Details */}
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 max-w-xs sm:max-w-md">
                        <div
                          className={cn(
                            "font-bold text-xs sm:text-sm truncate",
                            isDone && "line-through opacity-70",
                            isDark ? "text-white" : "text-navy"
                          )}
                          title={act.subject}
                        >
                          {act.subject}
                        </div>
                        {act.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 truncate max-w-xs sm:max-w-md">
                            {act.description}
                          </p>
                        )}
                      </td>

                      {/* Client / Deal */}
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden sm:table-cell">
                        <div className={cn("font-bold text-xs sm:text-sm truncate max-w-[160px]", isDark ? "text-white" : "text-navy")} title={act.customer_name || "Unassigned Client"}>
                          {act.customer_name || "Unassigned Client"}
                        </div>
                        {act.deal_id && (
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            Deal #{act.deal_id.slice(0, 8)}
                          </span>
                        )}
                      </td>

                      {/* Due Date & Rep */}
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 hidden md:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-500">
                          <Calendar className="w-3 h-3" />
                          {act.due_date || "Today"}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {act.assigned_to_name || "Sales Team"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] sm:text-xs font-bold uppercase tracking-wider py-0.5 px-2 rounded-lg border",
                            isDone
                              ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                              : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                          )}
                        >
                          {act.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                          <button
                            onClick={() => setSelectedViewActivity(act)}
                            className={cn(
                              "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                              isDark ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy" : "bg-navy text-white hover:bg-navy/90"
                            )}
                            title="View Activity Details"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          {!isDone && (
                            <button
                              onClick={() => handleComplete(act.id)}
                              className={cn(
                                "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                                isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"
                              )}
                              title="Mark Task Done"
                            >
                              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Activity Details View Modal */}
      <Dialog open={!!selectedViewActivity} onOpenChange={open => !open && setSelectedViewActivity(null)}>
        {selectedViewActivity && (
          <DialogContent
            className={cn(
              "max-w-2xl rounded-2xl border-2 p-5 sm:p-6",
              isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy text-navy"
            )}
          >
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-lg border",
                    selectedViewActivity.status === "completed"
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                  )}
                >
                  {selectedViewActivity.status}
                </Badge>
                <span className="text-xs font-mono text-slate-400">
                  ID: {selectedViewActivity.id.slice(0, 10)}
                </span>
              </div>
              <DialogTitle className={cn("text-lg sm:text-xl font-black mt-2", isDark ? "text-white" : "text-navy")}>
                {selectedViewActivity.subject}
              </DialogTitle>
              <DialogDescription className={isDark ? "text-teal-300/80" : "text-navy/70"}>
                Comprehensive sales activity log and execution audit
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Metadata Grid */}
              <div
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs",
                  isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/15"
                )}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Activity Type
                  </span>
                  <span className="font-bold capitalize flex items-center gap-1">
                    {selectedViewActivity.activity_type.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Due Date
                  </span>
                  <span className="font-bold font-mono text-amber-500">
                    {selectedViewActivity.due_date || "Immediate"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Client Name
                  </span>
                  <span className="font-bold truncate block">
                    {selectedViewActivity.customer_name || "General Lead"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Assigned Rep
                  </span>
                  <span className="font-bold truncate block">
                    {selectedViewActivity.assigned_to_name || "Sales Team"}
                  </span>
                </div>
              </div>

              {/* Detailed Description / Agenda */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider block mb-1.5">
                  Discussion Agenda & Technote
                </Label>
                <div
                  className={cn(
                    "p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm whitespace-pre-wrap leading-relaxed",
                    isDark ? "bg-[#080d2a] border-teal/20 text-slate-200" : "bg-slate-50 border-navy/15 text-navy"
                  )}
                >
                  {selectedViewActivity.description || "No additional meeting notes recorded for this task."}
                </div>
              </div>

              {/* Linked Deal Context if available */}
              {selectedViewActivity.deal_id && (
                <div
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between text-xs",
                    isDark ? "bg-teal/5 border-teal/20 text-teal-300" : "bg-teal/10 border-teal/30 text-navy"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-teal" />
                    <span>Linked CRM Opportunity Deal:</span>
                  </div>
                  <span className="font-mono font-bold">{selectedViewActivity.deal_id}</span>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedViewActivity(null)}
                className={cn(
                  "rounded-xl text-xs font-bold",
                  isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy"
                )}
              >
                Close
              </Button>
              {selectedViewActivity.status !== "completed" && (
                <Button
                  type="button"
                  onClick={() => handleComplete(selectedViewActivity.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-4 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Done
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* 6. Schedule Activity Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          className={cn(
            "max-w-xl rounded-2xl border-2 p-5 sm:p-6",
            isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy text-navy"
          )}
        >
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>
              Schedule Sales Activity
            </DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Log phone calls, site surveys, client meetings, and pipeline follow-ups.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateActivity} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Activity Subject *</Label>
              <Input
                required
                placeholder="e.g. Follow up on CCTV quotation approval with General Manager"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className={cn(
                  "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                  isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Activity Type *</Label>
                <Select value={activityType} onValueChange={val => setActivityType(val as ActivityType)}>
                  <SelectTrigger
                    className={cn(
                      "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                      isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Linked Sales Deal</Label>
                <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                  <SelectTrigger
                    className={cn(
                      "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                      isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Standalone Task --</SelectItem>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title.slice(0, 35)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Client / Company Name</Label>
                <Input
                  placeholder="e.g. Serengeti Freight Logistics Ltd"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className={cn(
                    "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                    isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={cn(
                    "rounded-xl mt-1 h-10 text-sm border-2 font-medium",
                    isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                  )}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Details & Discussion Agenda</Label>
              <Textarea
                rows={3}
                placeholder="Notes for the call, technician equipment to carry, key questions..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={cn(
                  "rounded-xl mt-1 text-sm border-2 font-medium",
                  isDark ? "bg-[#080d2a] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
                )}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className={cn(
                  "rounded-xl text-xs font-bold",
                  isDark ? "border-white/20 text-white hover:bg-white/10" : "border-navy/20 text-navy"
                )}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl text-xs px-5 shadow-md transition-all active:scale-95"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
