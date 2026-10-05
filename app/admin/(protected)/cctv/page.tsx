"use client"

import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { 
  Cctv, 
  LayoutDashboard, 
  FileText, 
  FolderKanban, 
  HardDrive, 
  Cable, 
  Sparkles, 
  ExternalLink,
  Plus,
  ArrowRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  getCctvSurveys, 
  getCctvSurveyById, 
  createCctvSurvey, 
  updateCctvSurvey, 
  deleteCctvSurvey, 
  convertSurveyToProject, 
  getCctvProjects, 
  getCctvProjectById, 
  createCctvProject, 
  updateCctvProject, 
  deleteCctvProject, 
  generateQuotationFromProject, 
  getCctvDashboardStats 
} from "@/lib/cctv-actions"
import { CctvSiteSurvey, CctvProject, QuickCctvPackage } from "@/types/cctv"
import { useToast } from "@/hooks/use-toast"
import { AdminLoading } from "@/components/admin"

// Import subcomponents
import CctvDashboard from "@/components/cctv/cctv-dashboard"
import CctvSurveysList from "@/components/cctv/cctv-surveys-list"
import CctvSurveyWizard from "@/components/cctv/cctv-survey-wizard"
import CctvProjectsList from "@/components/cctv/cctv-projects-list"
import CctvProjectDetail from "@/components/cctv/cctv-project-detail"
import CctvStorageCalculator from "@/components/cctv/cctv-storage-calculator"
import CctvCableCalculator from "@/components/cctv/cctv-cable-calculator"
import CctvPackagesView from "@/components/cctv/cctv-packages-modal"
import { CctvSurveyPrint } from "@/components/cctv/cctv-survey-print"

const HIK_PARTNER_URL = "https://cloudsso.hikvision.com/login?service=https://ieu.hik-partner.com%2F%23%2FticketJump%2Flogin&plateFormType=9&typeList=4,6,1,2,10,8,7&showAutoLogin=true&countryEditable=false&country=TZ&locale=en&regUrl=https://ieu.hik-partner.com%2F%23%2FRegister"

export default function AdminCctvPage() {
  const { isDark } = useAdminTheme()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Data states
  const [stats, setStats] = useState<any>({
    totalSurveys: 0,
    pendingSurveys: 0,
    completedSurveys: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    quotedCount: 0,
    totalEstimatedPipeline: 0,
    totalCctvSales: 0,
    recentSurveys: [],
    recentProjects: []
  })
  const [surveys, setSurveys] = useState<CctvSiteSurvey[]>([])
  const [projects, setProjects] = useState<CctvProject[]>([])

  // Selected items for active editing
  const [selectedSurvey, setSelectedSurvey] = useState<CctvSiteSurvey | null>(null)
  const [selectedProject, setSelectedProject] = useState<CctvProject | null>(null)

  // Printing ref
  const [printingSurvey, setPrintingSurvey] = useState<CctvSiteSurvey | null>(null)
  const printComponentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: printingSurvey ? `QuardCube_Survey_${printingSurvey.survey_number}` : "CCTV_Survey",
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `
  })

  // Fetch initial data
  const loadData = async () => {
    try {
      const [statsData, surveysData, projectsData] = await Promise.all([
        getCctvDashboardStats(),
        getCctvSurveys(),
        getCctvProjects()
      ])

      setStats(statsData)
      setSurveys(surveysData)
      setProjects(projectsData)
    } catch (err) {
      console.error("Error loading CCTV data:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  // Survey Handlers
  const handleStartNewSurvey = () => {
    setSelectedSurvey(null)
    setActiveTab("survey-wizard")
  }

  const handleEditSurvey = (survey: CctvSiteSurvey) => {
    setSelectedSurvey(survey)
    setActiveTab("survey-wizard")
  }

  const handleSaveSurvey = async (
    surveyData: any,
    items: any[],
    convertToProject: boolean = false
  ) => {
    if (selectedSurvey) {
      const updated = await updateCctvSurvey(selectedSurvey.id, surveyData, items)
      if (updated && convertToProject) {
        const project = await convertSurveyToProject(updated.id)
        setSelectedProject(project)
        setActiveTab("project-detail")
      } else {
        setActiveTab("surveys")
      }
    } else {
      const created = await createCctvSurvey(surveyData, items)
      if (convertToProject) {
        const project = await convertSurveyToProject(created.id)
        setSelectedProject(project)
        setActiveTab("project-detail")
      } else {
        setActiveTab("surveys")
      }
    }
    await loadData()
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    await deleteCctvSurvey(surveyId)
    setSurveys(surveys.filter(s => s.id !== surveyId))
    toast({ title: "Survey Deleted", description: "Site survey has been removed." })
    await loadData()
  }

  const handleConvertToProject = async (surveyId: string) => {
    const project = await convertSurveyToProject(surveyId)
    setSelectedProject(project)
    setActiveTab("project-detail")
    await loadData()
  }

  const handlePrintSurvey = (survey: CctvSiteSurvey) => {
    setPrintingSurvey(survey)
    setTimeout(() => {
      handlePrint()
    }, 200)
  }

  // Project Handlers
  const handleStartNewProject = () => {
    // Create an empty skeleton project and navigate to detail
    const newProj: CctvProject = {
      id: crypto.randomUUID(),
      project_number: `QCL-CCTV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: "New Client",
      customer_email: "client@example.com",
      site_name: "CCTV Installation Site",
      project_type: "commercial",
      camera_count: 0,
      status: "planning",
      recording_type: "IP/NVR",
      equipment_cost: 0,
      services_cost: 0,
      discount_amount: 0,
      tax_rate_percent: 18.0,
      tax_amount: 0,
      grand_total: 0,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSelectedProject(newProj)
    setActiveTab("project-detail")
  }

  const handleSelectProject = (project: CctvProject) => {
    setSelectedProject(project)
    setActiveTab("project-detail")
  }

  const handleUpdateProject = async (
    id: string,
    projectData: Partial<CctvProject>,
    items?: any[]
  ) => {
    // If it's a freshly started project not yet in database
    const exists = projects.some(p => p.id === id)
    let res: CctvProject | null = null

    if (exists) {
      res = await updateCctvProject(id, projectData, items)
    } else {
      res = await createCctvProject(
        {
          ...(selectedProject || {}),
          ...projectData,
          site_name: projectData.site_name || selectedProject?.site_name || "New Site",
          customer_name: projectData.customer_name || selectedProject?.customer_name || "Client",
          customer_email: projectData.customer_email || selectedProject?.customer_email || "client@example.com"
        } as any,
        items || []
      )
    }

    if (res) {
      setSelectedProject(res)
    }
    await loadData()
    return res
  }

  const handleDeleteProject = async (projectId: string) => {
    await deleteCctvProject(projectId)
    setProjects(projects.filter(p => p.id !== projectId))
    toast({ title: "Project Deleted", description: "CCTV project removed." })
    await loadData()
  }

  const handleGenerateQuotation = async (projectId: string) => {
    const res = await generateQuotationFromProject(projectId)
    if (res?.project) {
      setSelectedProject(res.project)
    }
    await loadData()
    return res
  }

  const handleSelectPackage = (pkg: QuickCctvPackage) => {
    // Create new project with the package pre-applied
    const unitItems = pkg.items.map(pItem => {
      const unitPrice = Math.round(pItem.unitCost * (1 + pItem.defaultMarkup / 100))
      return {
        id: crypto.randomUUID(),
        project_id: "",
        product_id: null,
        item_type: pItem.type,
        name: pItem.name,
        description: pItem.description || "",
        category: pItem.category,
        quantity: pItem.quantity,
        unit_cost: pItem.unitCost,
        markup_percentage: pItem.defaultMarkup,
        unit_price: unitPrice,
        discount: 0,
        tax: 0,
        subtotal: unitPrice * pItem.quantity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const eqCost = unitItems.filter(i => i.item_type !== 'service').reduce((s, i) => s + i.subtotal, 0)
    const svCost = unitItems.filter(i => i.item_type === 'service').reduce((s, i) => s + i.subtotal, 0)
    const tax = Math.round(((eqCost + svCost) * 18) / 100)

    const newProj: CctvProject = {
      id: crypto.randomUUID(),
      project_number: `QCL-CCTV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: "Customer Name",
      customer_email: "customer@example.com",
      site_name: `${pkg.name} Installation`,
      project_type: pkg.targetSegment.includes("Residential") ? "residential" : "commercial",
      camera_count: pkg.cameraCount,
      status: "planning",
      recording_type: "IP/NVR",
      equipment_cost: eqCost,
      services_cost: svCost,
      discount_amount: 0,
      tax_rate_percent: 18.0,
      tax_amount: tax,
      grand_total: eqCost + svCost + tax,
      items: unitItems,
      notes: `Pre-configured package: ${pkg.name}. ${pkg.description}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setSelectedProject(newProj)
    setActiveTab("project-detail")
    toast({
      title: "Package Loaded",
      description: `${pkg.name} loaded into new project editor.`,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <AdminLoading type="dashboard" />
      </div>
    )
  }

  // Dynamic tabs configuration matching admin standard
  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "surveys", label: "Site Surveys", icon: FileText, badge: stats.pendingSurveys > 0 ? stats.pendingSurveys : undefined },
    ...(activeTab === "survey-wizard" || selectedSurvey ? [{ key: "survey-wizard", label: selectedSurvey ? `Survey: ${selectedSurvey.survey_number || "Draft"}` : "Survey Wizard", icon: ShieldCheck }] : []),
    { key: "projects", label: "CCTV Projects", icon: FolderKanban, badge: projects.length > 0 ? projects.length : undefined },
    ...(activeTab === "project-detail" || selectedProject ? [{ key: "project-detail", label: selectedProject ? `Project: ${selectedProject.project_number}` : "Project Details", icon: Cctv }] : []),
    { key: "storage-calc", label: "Storage Calc", icon: HardDrive },
    { key: "cable-calc", label: "Cable Calc", icon: Cable },
    { key: "packages", label: "Quick Packages", icon: Sparkles, iconColor: "text-amber-500" },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* 1. Standard Page Header Banner */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-6",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1">
              CCTV <span className={cn(isDark ? "text-teal-400" : "text-white", "drop-shadow-sm")}>Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Site surveys, system designs, storage & cable calculators, equipment selection, and quotations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className={cn(
                "font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm transition-all active:scale-95",
                isDark 
                  ? "bg-[#070d24] border-slate-700 text-white hover:bg-slate-800" 
                  : "bg-white border-2 border-navy/20 text-navy hover:bg-teal-50"
              )}
              title="Refresh CCTV Data"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-teal")} />
              Refresh
            </Button>
            <Button
              onClick={handleStartNewSurvey}
              className="bg-navy hover:bg-navy/90 text-white font-bold gap-2 rounded-xl shadow-lg h-10 px-4 transition-all hover:shadow-xl active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New Site Survey
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "font-bold rounded-xl h-10 px-4 gap-1.5 transition-all",
                isDark
                  ? "bg-[#080d28] border-teal/40 text-teal hover:bg-teal/10"
                  : "bg-white/90 border-2 border-navy/20 text-navy hover:bg-teal-50"
              )}
            >
              <a href={HIK_PARTNER_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                <span>Hik-Partner</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Folder-Fillet Tabs & Connected Content Container */}
      <div className="space-y-0 relative">
        <div className="relative z-10 flex items-end gap-1.5 overflow-x-auto pb-0 w-full px-0 -mb-[2px] scrollbar-thin">
          {tabs.map((tab, idx) => {
            const isSelected = activeTab === tab.key
            const isFirst = idx === 0

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer",
                  isSelected && isFirst
                    ? "rounded-tl-2xl sm:rounded-tl-3xl rounded-tr-xl sm:rounded-tr-2xl"
                    : "rounded-t-xl sm:rounded-t-2xl",
                  isSelected
                    ? cn(
                        "font-black border-2 border-b-0 border-navy/20 dark:border-teal/30 z-20 shadow-none",
                        isDark ? "bg-[#0c1833] text-teal" : "bg-[#e6f7f5] text-navy"
                      )
                    : "bg-transparent text-navy/70 hover:text-navy dark:text-slate-400 dark:hover:text-white border-0 hover:bg-teal-500/10 z-0"
                )}
              >
                {isSelected && (
                  <>
                    {/* Left concave fillet curve (only for non-first tabs) */}
                    {!isFirst && (
                      <span className="absolute -bottom-[2px] -left-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                        <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                          <path d="M12 0C12 6.627 6.627 12 0 12H12V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                          <path d="M0 12C6.627 12 12 6.627 12 0" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                        </svg>
                      </span>
                    )}
                    {/* Right concave fillet curve */}
                    <span className="absolute -bottom-[2px] -right-[12px] w-[12px] h-[12px] overflow-hidden pointer-events-none z-20">
                      <svg className="w-[12px] h-[12px]" viewBox="0 0 12 12" fill="none">
                        <path d="M0 0C0 6.627 5.373 12 12 12H0V0Z" fill={isDark ? "#0c1833" : "#e6f7f5"} />
                        <path d="M0 0C0 6.627 5.373 12 12 12" stroke="currentColor" strokeWidth="2" className="text-navy/20 dark:text-teal/30" />
                      </svg>
                    </span>
                    {/* Bottom bridge to erase content card top border under active tab */}
                    <span className={cn("absolute -bottom-[3px] -left-[2px] -right-[2px] h-[6px] z-30 pointer-events-none", isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]")} />
                  </>
                )}
                <tab.icon className={cn("h-4 w-4 shrink-0 relative z-40", isSelected ? "text-navy dark:text-teal" : "text-navy/60 dark:text-slate-400", tab.iconColor || "")} />
                <span className="relative z-40">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={cn(
                    "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold relative z-40 transition-colors",
                    isSelected 
                      ? isDark ? "bg-teal text-navy font-black" : "bg-navy text-white font-bold"
                      : isDark ? "bg-teal/20 text-teal" : "bg-teal-100/80 text-navy"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main Connected Content Container */}
        <div className={cn(
          "border-2 border-navy/20 dark:border-teal/30 p-4 sm:p-6 shadow-sm space-y-4 relative z-0",
          activeTab === tabs[0].key 
            ? "rounded-b-2xl sm:rounded-b-3xl rounded-tr-2xl sm:rounded-tr-3xl rounded-tl-none" 
            : "rounded-2xl sm:rounded-3xl",
          isDark ? "bg-[#0c1833]" : "bg-[#e6f7f5]"
        )}>
          {/* Tab Contents */}
          {activeTab === "dashboard" && (
            <CctvDashboard
              stats={stats}
              onNavigateTab={setActiveTab}
              onNewSurvey={handleStartNewSurvey}
              onNewProject={handleStartNewProject}
              onOpenStorageCalc={() => setActiveTab("storage-calc")}
              onOpenCableCalc={() => setActiveTab("cable-calc")}
              onOpenPackages={() => setActiveTab("packages")}
              onSelectSurvey={survey => {
                setSelectedSurvey(survey)
                setActiveTab("survey-wizard")
              }}
              onSelectProject={project => {
                setSelectedProject(project)
                setActiveTab("project-detail")
              }}
            />
          )}

          {activeTab === "surveys" && (
            <CctvSurveysList
              surveys={surveys}
              onNewSurvey={handleStartNewSurvey}
              onEditSurvey={handleEditSurvey}
              onConvertToProject={handleConvertToProject}
              onDeleteSurvey={handleDeleteSurvey}
              onPrintSurvey={handlePrintSurvey}
            />
          )}

          {activeTab === "survey-wizard" && (
            <CctvSurveyWizard
              initialSurvey={selectedSurvey}
              onSave={handleSaveSurvey}
              onCancel={() => {
                setSelectedSurvey(null)
                setActiveTab("surveys")
              }}
            />
          )}

          {activeTab === "projects" && (
            <CctvProjectsList
              projects={projects}
              onNewProject={handleStartNewProject}
              onSelectProject={handleSelectProject}
              onDeleteProject={handleDeleteProject}
              onGenerateQuotation={handleGenerateQuotation}
            />
          )}

          {activeTab === "project-detail" && selectedProject && (
            <CctvProjectDetail
              project={selectedProject}
              onUpdateProject={handleUpdateProject}
              onGenerateQuotation={handleGenerateQuotation}
              onBack={() => setActiveTab("projects")}
              onOpenStorageCalc={() => setActiveTab("storage-calc")}
              onOpenCableCalc={() => setActiveTab("cable-calc")}
            />
          )}

          {activeTab === "storage-calc" && (
            <CctvStorageCalculator
              onApplyToProject={recommendedTb => {
                if (selectedProject) {
                  setSelectedProject({
                    ...selectedProject,
                    recommended_storage_tb: recommendedTb
                  })
                  setActiveTab("project-detail")
                  toast({ title: "Storage Sizing Applied", description: `${recommendedTb}TB applied to active CCTV project.` })
                } else {
                  toast({ title: "Storage Calculated", description: `${recommendedTb}TB recommendation ready.` })
                }
              }}
            />
          )}

          {activeTab === "cable-calc" && (
            <CctvCableCalculator
              onApplyToProject={(boxes, meters) => {
                if (selectedProject) {
                  setSelectedProject({
                    ...selectedProject,
                    total_cable_meters: meters
                  })
                  setActiveTab("project-detail")
                  toast({ title: "Cabling Applied", description: `${boxes} boxes (${meters}m) applied to project.` })
                } else {
                  toast({ title: "Cables Calculated", description: `${boxes} boxes (${meters}m) required.` })
                }
              }}
            />
          )}

          {activeTab === "packages" && (
            <CctvPackagesView
              onSelectPackage={handleSelectPackage}
            />
          )}
        </div>
      </div>

      {/* Hidden Print Container for A4 Site Survey Sheet */}
      <div className="hidden">
        {printingSurvey && (
          <CctvSurveyPrint ref={printComponentRef} survey={printingSurvey} />
        )}
      </div>
    </div>
  )
}
