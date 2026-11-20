"use client"

import { useState } from "react"
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ExternalLink,
  Trash2,
  Edit,
  Layers
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
import { CctvProject } from "@/types/cctv"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface CctvProjectsListProps {
  projects: CctvProject[]
  onNewProject: () => void
  onSelectProject: (project: CctvProject) => void
  onDeleteProject: (projectId: string) => Promise<void>
  onGenerateQuotation: (projectId: string) => Promise<any>
}

export default function CctvProjectsList({
  projects,
  onNewProject,
  onSelectProject,
  onDeleteProject,
  onGenerateQuotation
}: CctvProjectsListProps) {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      (project.site_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.quotation_number || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0
    }).format(val).replace('TZS', 'TZS ')
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-blue-500" />
            CCTV Engineering Projects
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage system architecture designs, equipment bills of material, and linked quotations
          </p>
        </div>

        <Button
          onClick={onNewProject}
          className="bg-teal hover:bg-teal-400 text-navy font-black text-xs px-5 py-5 rounded-xl shadow-md shadow-teal/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>+ Create CCTV Project</span>
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
            placeholder="Search by site name, customer, project #, quotation #..."
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
              <SelectItem value="all">All Projects ({projects.length})</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="quoted">Quoted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid Cards */}
      {filteredProjects.length === 0 ? (
        <Card className={cn(
          "rounded-2xl border text-center py-12 px-4 shadow-sm",
          isDark ? "bg-[#0a1033] border-none text-white shadow-md" : "bg-white border-2 border-navy/20"
        )}>
          <FolderKanban className={cn("h-10 w-10 mx-auto mb-3", isDark ? "text-slate-600" : "text-navy/30")} />
          <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-navy")}>No CCTV Projects Found</h3>
          <p className={cn("text-xs max-w-sm mx-auto mt-1", isDark ? "text-slate-400" : "text-navy/70")}>
            {searchTerm || statusFilter !== 'all' 
              ? "No projects matched your search criteria."
              : "Design your first CCTV project from scratch or convert a completed site survey."}
          </p>
          <Button
            onClick={onNewProject}
            size="sm"
            className="mt-4 bg-teal hover:bg-teal/90 text-navy font-bold text-xs rounded-xl"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create First CCTV Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const cameraCount = project.camera_count || project.items?.filter(i => i.category === 'Cameras').reduce((s, i) => s + i.quantity, 0) || 0

            return (
              <Card key={project.id} className={cn(
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
                        <span className={cn("font-mono text-[11px] font-bold", isDark ? "text-teal-400" : "text-navy/70")}>{project.project_number}</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] uppercase font-bold py-0 rounded-md",
                          project.status === 'approved' || project.status === 'completed' ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" :
                          project.status === 'quoted' ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/10" :
                          "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                        )}>
                          {project.status}
                        </Badge>
                      </div>
                      <h3 className={cn("font-black text-base mt-1 group-hover:text-teal transition-colors line-clamp-1", isDark ? "text-white" : "text-navy")}>
                        {project.site_name}
                      </h3>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn("h-8 w-8 p-0", isDark ? "text-slate-400 hover:text-white" : "text-navy/60 hover:text-navy")}>
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => onSelectProject(project)}>
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Open Project Designer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGenerateQuotation(project.id)}>
                          <FileText className="h-3.5 w-3.5 mr-2 text-teal" />
                          {project.quotation_number ? "Update Quotation" : "Generate Quotation"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteProject(project.id)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Customer and Linked Quotation info */}
                  <div className={cn(
                    "space-y-1.5 text-xs border-y py-3 my-2",
                    isDark ? "border-slate-800 text-slate-400" : "border-navy/10 text-navy/70"
                  )}>
                    <div className={cn("flex items-center gap-2 font-bold", isDark ? "text-white" : "text-navy")}>
                      <Building2 className="h-3.5 w-3.5 text-teal shrink-0" />
                      <span className="truncate">{project.customer_name}</span>
                    </div>

                    {project.quotation_number ? (
                      <div className="flex items-center gap-1.5 text-purple-500 dark:text-purple-400 font-semibold">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span>Quote: <strong className="font-mono">{project.quotation_number}</strong></span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-500 font-medium">
                        Quote not generated yet
                      </div>
                    )}
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
                      <span className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/70")}>System:</span>
                      <strong className={cn("font-black truncate", isDark ? "text-white" : "text-navy")}>{project.recording_type}</strong>
                    </div>
                  </div>

                  {/* Financial Value Box */}
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center justify-between",
                    isDark ? "bg-[#070d24] border-teal/30" : "bg-teal/10 border-teal/30"
                  )}>
                    <span className={cn("text-[11px] font-bold uppercase", isDark ? "text-teal-300" : "text-navy/80")}>Project Value:</span>
                    <span className="font-mono font-black text-sm text-teal">
                      {formatCurrency(project.grand_total)}
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className={cn(
                  "p-3.5 border-t flex items-center justify-between gap-2",
                  isDark ? "bg-[#070d24] border-slate-800" : "bg-slate-50 border-navy/10"
                )}>
                  <span className={cn("text-[11px] font-medium", isDark ? "text-slate-400" : "text-navy/60")}>
                    {project.items?.length || 0} Components
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSelectProject(project)}
                      className="h-8 text-xs font-bold bg-teal hover:bg-teal/90 text-navy rounded-xl shadow-sm"
                    >
                      <span>Design & Pricing</span>
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
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
