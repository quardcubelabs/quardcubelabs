"use client"

import { useState } from "react"
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  Calendar, 
  Camera, 
  Printer, 
  Sparkles, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Eye,
  AlertCircle,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { CctvSiteSurvey } from "@/types/cctv"
import { useToast } from "@/hooks/use-toast"

interface CctvSurveysListProps {
  surveys: CctvSiteSurvey[]
  onNewSurvey: () => void
  onEditSurvey: (survey: CctvSiteSurvey) => void
  onConvertToProject: (surveyId: string) => Promise<void>
  onDeleteSurvey: (surveyId: string) => Promise<void>
  onPrintSurvey: (survey: CctvSiteSurvey) => void
}

export default function CctvSurveysList({
  surveys,
  onNewSurvey,
  onEditSurvey,
  onConvertToProject,
  onDeleteSurvey,
  onPrintSurvey
}: CctvSurveysListProps) {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isConverting, setIsConverting] = useState<string | null>(null)

  const filteredSurveys = surveys.filter(survey => {
    const matchesSearch = 
      (survey.site_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.survey_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (survey.site_address || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || survey.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleConvert = async (surveyId: string) => {
    setIsConverting(surveyId)
    try {
      await onConvertToProject(surveyId)
      toast({
        title: "Project Generated",
        description: "Site survey successfully converted to a CCTV Project with equipment and cable calculations.",
      })
    } catch (err: any) {
      toast({
        title: "Conversion Failed",
        description: err.message || "Failed to convert survey to project.",
        variant: "destructive"
      })
    } finally {
      setIsConverting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal" />
            CCTV Site Surveys
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage physical site inspection reports, camera location requirements, and infrastructure assessments
          </p>
        </div>

        <Button
          onClick={onNewSurvey}
          className="bg-teal hover:bg-teal-400 text-navy font-black text-xs px-5 py-5 rounded-xl shadow-md shadow-teal/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ New Site Survey</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className={cn(
        "p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm",
        isDark ? "bg-[#0a1033] border-slate-800" : "bg-white border-2 border-navy/20"
      )}>
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-2.5 h-4 w-4", isDark ? "text-slate-400" : "text-navy/50")} />
          <Input
            placeholder="Search by site name, customer, survey number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={cn(
              "pl-9 text-xs sm:text-sm h-9 rounded-xl",
              isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "w-44 text-xs h-9 font-semibold rounded-xl",
              isDark ? "bg-[#070d24] border-slate-700 text-white" : "border-2 border-navy/20 text-navy"
            )}>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({surveys.length})</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="converted_to_project">Converted to Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Surveys List Cards */}
      {filteredSurveys.length === 0 ? (
        <Card className={cn(
          "rounded-2xl border text-center py-12 px-4 shadow-sm",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <FileText className={cn("h-10 w-10 mx-auto mb-3", isDark ? "text-slate-600" : "text-navy/30")} />
          <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-navy")}>No Site Surveys Found</h3>
          <p className={cn("text-xs max-w-sm mx-auto mt-1", isDark ? "text-slate-400" : "text-navy/70")}>
            {searchTerm || statusFilter !== 'all' 
              ? "No surveys matched your search criteria. Try clearing the filter."
              : "Perform your first on-site survey to map camera angles, cable distances, and power availability."}
          </p>
          <Button
            onClick={onNewSurvey}
            size="sm"
            className="mt-4 bg-teal hover:bg-teal/90 text-navy font-bold text-xs rounded-xl"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create First Site Survey
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurveys.map(survey => {
            const cameraCount = survey.items?.reduce((s, i) => s + (i.quantity || 1), 0) || survey.estimated_camera_count || 0
            const outdoorCount = survey.items?.filter(i => i.indoor_outdoor === 'Outdoor').length || 0

            return (
              <Card key={survey.id} className={cn(
                "rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none text-white shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 hover:border-navy hover:shadow-md"
              )}>
                <div className="p-5 space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("font-mono text-[11px] font-bold", isDark ? "text-teal-400" : "text-navy/70")}>{survey.survey_number}</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-bold py-0 rounded-md",
                          survey.status === 'completed' ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
                          survey.status === 'converted_to_project' ? "border-teal text-teal bg-teal/10" :
                          "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        )}>
                          {survey.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <h3 className={cn("font-black text-base mt-1 group-hover:text-teal transition-colors line-clamp-1", isDark ? "text-white" : "text-navy")}>
                        {survey.site_name}
                      </h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", isDark ? "text-slate-400 hover:text-white" : "text-navy/60 hover:text-navy")}>
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => onEditSurvey(survey)}>
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Edit Survey
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrintSurvey(survey)}>
                          <Printer className="h-3.5 w-3.5 mr-2" />
                          Print / Export Survey
                        </DropdownMenuItem>
                        {survey.status !== 'converted_to_project' && (
                          <DropdownMenuItem onClick={() => handleConvert(survey.id)}>
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-teal" />
                            Convert to CCTV Project
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteSurvey(survey.id)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete Survey
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Customer and Location info */}
                  <div className={cn(
                    "space-y-1.5 text-xs border-y py-3 my-2",
                    isDark ? "border-slate-800 text-slate-400" : "border-navy/10 text-navy/70"
                  )}>
                    <div className={cn("flex items-center gap-2 font-bold", isDark ? "text-white" : "text-navy")}>
                      <Building2 className="h-3.5 w-3.5 text-teal shrink-0" />
                      <span className="truncate">{survey.customer_name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", isDark ? "text-slate-500" : "text-navy/50")} />
                      <span className="line-clamp-1">{survey.site_address}</span>
                    </div>
                  </div>

                  {/* Camera Spec tags */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={cn(
                      "p-2 rounded-xl border flex items-center justify-between",
                      isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/10"
                    )}>
                      <span className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Cameras:</span>
                      <strong className={cn("font-black", isDark ? "text-white" : "text-navy")}>{cameraCount} Points</strong>
                    </div>

                    <div className={cn(
                      "p-2 rounded-xl border flex items-center justify-between",
                      isDark ? "bg-[#070d24] border-slate-800" : "bg-teal/5 border-navy/10"
                    )}>
                      <span className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/70")}>Type:</span>
                      <strong className={cn("font-black truncate", isDark ? "text-white" : "text-navy")}>{survey.building_type}</strong>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {survey.internet_available && (
                      <Badge variant="outline" className="text-[10px] text-teal border-teal/40 bg-teal/10 font-bold">
                        Internet OK
                      </Badge>
                    )}
                    {survey.ups_required && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/40 bg-amber-500/10 font-bold">
                        UPS Backup
                      </Badge>
                    )}
                    {survey.remote_viewing_required && (
                      <Badge variant="outline" className="text-[10px] text-purple-500 border-purple-500/40 bg-purple-500/10 font-bold">
                        Remote Viewing
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className={cn(
                  "p-3.5 border-t flex items-center justify-between gap-2",
                  isDark ? "bg-[#070d24] border-slate-800" : "bg-slate-50 border-navy/10"
                )}>
                  <span className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                    {new Date(survey.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditSurvey(survey)}
                      className={cn(
                        "h-8 text-xs font-bold rounded-xl",
                        isDark ? "bg-[#0a1033] border-slate-700 text-white hover:bg-slate-800" : "bg-white border-2 border-navy/20 text-navy hover:bg-teal-50"
                      )}
                    >
                      Inspect / Edit
                    </Button>

                    {survey.status !== 'converted_to_project' && (
                      <Button
                        size="sm"
                        disabled={isConverting === survey.id}
                        onClick={() => handleConvert(survey.id)}
                        className="h-8 text-xs font-bold bg-teal hover:bg-teal/90 text-navy rounded-xl shadow-sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Design Project
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
