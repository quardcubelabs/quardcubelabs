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
  UserCheck
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

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
        description: "Follow-up activity logged."
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
        description: "Marked task as done."
      })
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
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = typeFilter === "all" || a.activity_type === typeFilter
    return matchesSearch && matchesType
  })

  const pendingCount = activities.filter(a => a.status === "pending").length
  const completedCount = activities.filter(a => a.status === "completed").length

  if (isLoading && activities.length === 0) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark 
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" 
                : "bg-navy text-teal border border-navy/20"
            )}>
              <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1">
                Sales <span className={cn(isDark ? "text-teal-300" : "text-white drop-shadow-sm")}>Activities & Tasks</span>
              </h1>
              <p className={cn("text-xs sm:text-sm font-semibold", isDark ? "text-teal-300/80" : "text-navy/90")}>
                Client follow-ups, scheduled calls, technical site surveys, and reminders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl h-10 sm:h-11 px-3 sm:px-4 font-bold border shadow-sm transition-all active:scale-95",
                isDark
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                  : "bg-white/80 hover:bg-white text-navy border-navy/20"
              )}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className={cn(
                "font-bold rounded-xl h-10 sm:h-11 px-4 sm:px-5 gap-2 shadow-lg transition-all active:scale-95 shrink-0",
                isDark
                  ? "bg-teal-500 hover:bg-teal-600 text-slate-950 font-black"
                  : "bg-navy hover:bg-navy/90 text-white"
              )}
            >
              <Plus className="w-4 h-4" />
              Schedule Activity
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Total Logged</p>
              <p className={cn("text-2xl font-black font-mono", isDark ? "text-white" : "text-navy")}>{activities.length}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <CheckSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Pending Tasks</p>
              <p className="text-2xl font-black font-mono text-amber-500">{pendingCount}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                  : "bg-amber-100/80 border-amber-400/30 text-amber-600"
              )}
            >
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Completed</p>
              <p className="text-2xl font-black font-mono text-emerald-500">{completedCount}</p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-emerald-400/10 border-emerald-400/30 text-emerald-300"
                  : "bg-emerald-100/80 border-emerald-400/30 text-emerald-600"
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
            isDark
              ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
              : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
          )}
        >
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDark ? "text-slate-400" : "text-navy/60")}>Site Surveys</p>
              <p className="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                {activities.filter(a => a.activity_type === "site_visit").length}
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                isDark
                  ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                  : "bg-teal-100/80 border-navy/15 text-navy"
              )}
            >
              <MapPin className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card
        className={cn(
          "rounded-2xl p-4 mb-6 transition-all duration-300",
          isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
        )}
      >
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4", isDark ? "text-slate-400" : "text-navy/40")} />
            <Input
              placeholder="Search activities, client names, subjects, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark
                  ? "bg-slate-900/60 border-teal/20 text-white placeholder:text-slate-500 focus:border-teal"
                  : "bg-slate-50 border-navy/20 text-navy placeholder:text-navy/40 focus:border-navy focus:bg-white"
              )}
            />
          </div>
          <div className="w-full sm:w-56 shrink-0">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className={cn(
                "w-full h-10 sm:h-11 rounded-xl border-2 font-medium text-xs sm:text-sm",
                isDark ? "bg-slate-900/60 border-teal/20 text-white" : "bg-slate-50 border-navy/20 text-navy"
              )}>
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity Types</SelectItem>
                {ACTIVITY_TYPES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Activities Feed */}
      <div className="space-y-3">
        {filteredActivities.map((act) => {
          const typeConfig = ACTIVITY_TYPES.find(t => t.id === act.activity_type) || ACTIVITY_TYPES[0]
          const Icon = typeConfig.icon
          const isDone = act.status === "completed"

          return (
            <Card
              key={act.id}
              className={cn(
                "rounded-2xl transition-all p-4",
                isDark
                  ? "bg-[#080d2a]/80 border-none shadow-md hover:bg-[#0c1438]"
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md",
                isDone && "opacity-60"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                    isDone 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                      : isDark
                        ? "bg-teal-400/10 border-teal-400/30 text-teal-300"
                        : "bg-teal-100/80 border-navy/15 text-navy"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={cn("font-black text-sm", isDone && "line-through text-gray-400", isDark ? "text-white" : "text-navy")}>
                        {act.subject}
                      </h4>
                      <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-lg border", isDark ? "border-teal/30 text-teal-300 bg-teal/10" : "border-navy/20 text-navy bg-slate-50")}>
                        {typeConfig.label}
                      </Badge>
                    </div>

                    {act.customer_name && (
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                        Client: {act.customer_name}
                      </p>
                    )}

                    {act.description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center self-end">
                  <div className="text-right text-xs text-gray-400">
                    <p className="flex items-center gap-1 font-mono font-semibold">
                      <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      Due: {act.due_date || "Today"}
                    </p>
                    <p className="text-[11px] font-medium">Rep: {act.assigned_to_name || "Sales Team"}</p>
                  </div>

                  {!isDone ? (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(act.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-8 px-3 flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Done
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {filteredActivities.length === 0 && (
          <Card className="p-12 text-center text-gray-400 text-sm rounded-2xl">
            No scheduled activities found matching your search.
          </Card>
        )}
      </div>

      {/* Schedule Activity Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "max-w-xl rounded-2xl border-2 p-6",
          isDark ? "bg-[#0a1033] border-teal/30 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("text-xl font-black", isDark ? "text-white" : "text-navy")}>Schedule Sales Activity</DialogTitle>
            <DialogDescription className={isDark ? "text-teal-300" : "text-navy/70"}>
              Log phone calls, site surveys, client meetings, and pipeline reminders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateActivity} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold">Activity Subject *</Label>
              <Input
                required
                placeholder="e.g. Follow up on CCTV quotation approval with General Manager"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl mt-1 h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Activity Type *</Label>
                <Select value={activityType} onValueChange={(val) => setActivityType(val as ActivityType)}>
                  <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Linked Sales Deal</Label>
                <Select value={selectedDealId} onValueChange={setSelectedDealId}>
                  <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Standalone Task --</SelectItem>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.title.slice(0, 35)}...</SelectItem>
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
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-xl mt-1 h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Details & Discussion Agenda</Label>
              <Textarea
                rows={3}
                placeholder="Notes for the call, technician equipment to carry, key questions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl mt-1 text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-teal hover:bg-teal/90 text-navy font-bold rounded-xl text-xs px-5"
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
