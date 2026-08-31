"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import AdminLoading from "@/components/admin/admin-loading"
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  Eye, 
  Settings, 
  Mail, 
  RefreshCw, 
  TrendingUp, 
  PieChart 
} from "lucide-react"

// Types
export type Report = {
  id: string
  title: string
  description: string
  category: string
  formats: string[]
  lastgenerated: string | null
  status: string
  size: string
  downloads: number
}

export type CustomReportConfig = {
  name: string
  dateRange: string
  startDate: string
  endDate: string
  categories: string[]
  format: string
  includeCharts: boolean
  scheduleFrequency: string
}

// Mock report generation function
const generateMockReportData = (category: string): Report[] => {
  const baseReports = [
    {
      id: `sales-monthly-${Date.now()}`,
      title: "Monthly Sales Report",
      description: "Comprehensive analysis of monthly sales performance and trends",
      category: "Sales",
      formats: ["pdf", "excel", "csv"],
      lastgenerated: new Date().toISOString(),
      status: "ready",
      size: "2.3 MB",
      downloads: 5
    },
    {
      id: `analytics-user-engagement-${Date.now()}`,
      title: "User Engagement Analytics",
      description: "Detailed insights into user behavior and engagement patterns",
      category: "Analytics",
      formats: ["pdf", "excel"],
      lastgenerated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "1.8 MB",
      downloads: 12
    },
    {
      id: `products-inventory-${Date.now()}`,
      title: "Product Inventory Analysis",
      description: "Current stock levels and product performance metrics",
      category: "Products",
      formats: ["pdf", "csv"],
      lastgenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "3.1 MB",
      downloads: 8
    },
    {
      id: `financial-quarterly-${Date.now()}`,
      title: "Quarterly Financial Summary",
      description: "Financial performance overview for the current quarter",
      category: "Financial",
      formats: ["pdf", "excel"],
      lastgenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "4.2 MB",
      downloads: 15
    },
    {
      id: `operations-efficiency-${Date.now()}`,
      title: "Operations Efficiency Report",
      description: "Analysis of operational processes and efficiency metrics",
      category: "Operations",
      formats: ["pdf"],
      lastgenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "2.7 MB",
      downloads: 3
    },
    {
      id: `marketing-campaign-${Date.now()}`,
      title: "Marketing Campaign Performance",
      description: "ROI and performance metrics for recent marketing campaigns",
      category: "Marketing",
      formats: ["pdf", "excel"],
      lastgenerated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "1.9 MB",
      downloads: 7
    },
    {
      id: `security-audit-${Date.now()}`,
      title: "Security Audit Report",
      description: "Comprehensive security assessment and recommendations",
      category: "Security",
      formats: ["pdf"],
      lastgenerated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "5.1 MB",
      downloads: 2
    },
    {
      id: `technical-performance-${Date.now()}`,
      title: "System Performance Analysis",
      description: "Technical performance metrics and system health status",
      category: "Technical",
      formats: ["pdf", "csv"],
      lastgenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready",
      size: "3.8 MB",
      downloads: 6
    },
    {
      id: `generating-report-${Date.now()}`,
      title: "Weekly Revenue Analysis",
      description: "Current week revenue breakdown and comparisons",
      category: "Financial",
      formats: ["pdf", "excel"],
      lastgenerated: null,
      status: "generating",
      size: "0 MB",
      downloads: 0
    },
    {
      id: `scheduled-report-${Date.now()}`,
      title: "Automated Monthly Summary",
      description: "Scheduled monthly business summary report",
      category: "Analytics",
      formats: ["pdf"],
      lastgenerated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "scheduled",
      size: "2.1 MB",
      downloads: 4
    }
  ]

  if (category === "all") return baseReports
  return baseReports.filter(report => report.category.toLowerCase() === category.toLowerCase())
}

export default function ReportsPage() {
  const { isDark } = useAdminTheme()
  const [reports, setReports] = useState<Report[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [customConfig, setCustomConfig] = useState<CustomReportConfig>({
    name: "",
    dateRange: "30d",
    startDate: "",
    endDate: "",
    categories: [],
    format: "pdf",
    includeCharts: true,
    scheduleFrequency: "none"
  })

  const categories = [
    "all",
    "Sales",
    "Analytics", 
    "Products",
    "Financial",
    "Operations",
    "Marketing",
    "Security",
    "Technical"
  ]

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setReports(generateMockReportData(selectedCategory))
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [selectedCategory])

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "sales": return <ShoppingCart className="h-4 w-4 text-teal" />
      case "analytics": return <BarChart3 className="h-4 w-4 text-teal" />
      case "products": return <FileText className="h-4 w-4 text-teal" />
      case "financial": return <DollarSign className="h-4 w-4 text-teal" />
      case "operations": return <Settings className="h-4 w-4 text-teal" />
      case "marketing": return <TrendingUp className="h-4 w-4 text-teal" />
      case "security": return <Eye className="h-4 w-4 text-teal" />
      case "technical": return <PieChart className="h-4 w-4 text-teal" />
      default: return <FileText className="h-4 w-4 text-teal" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
      case "generating": return "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
      case "failed": return "bg-brand-red/15 text-brand-red border-brand-red/30"
      case "scheduled": return "bg-navy/15 text-navy dark:text-teal-300 border-navy/30 dark:border-teal/30"
      default: return "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30"
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId)
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update the report status
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: "ready", 
              lastgenerated: new Date().toISOString(),
              size: `${(Math.random() * 5 + 1).toFixed(1)} MB`
            }
          : report
      ))
      
      toast({
        title: "Report Generated",
        description: "The report has been successfully generated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while generating the report.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDownloadReport = async (reportId: string, format: string = 'pdf') => {
    try {
      // Simulate download
      toast({
        title: "Download Started",
        description: `Your ${format.toUpperCase()} report download has begun.`,
      })
      
      // Update download count
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, downloads: report.downloads + 1 }
          : report
      ))
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.", 
        variant: "destructive"
      })
    }
  }

  const handleCreateCustomReport = async () => {
    try {
      if (!customConfig.name) {
        toast({
          title: "Validation Error",
          description: "Please enter a report name.",
          variant: "destructive"
        })
        return
      }

      // Simulate custom report creation
      const newReport: Report = {
        id: `custom-${Date.now()}`,
        title: customConfig.name,
        description: `Custom ${customConfig.categories.join(', ')} report for ${customConfig.dateRange}`,
        category: customConfig.categories[0] || "Custom",
        formats: [customConfig.format],
        lastgenerated: new Date().toISOString(),
        status: "ready",
        size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        downloads: 0
      }
      
      setReports(prev => [newReport, ...prev])
      setIsCustomReportOpen(false)
      setCustomConfig({
        name: "",
        dateRange: "30d",
        startDate: "",
        endDate: "",
        categories: [],
        format: "pdf",
        includeCharts: true,
        scheduleFrequency: "none"
      })
      
      toast({
        title: "Custom Report Created",
        description: "Your custom report has been successfully created.",
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "An error occurred while creating the custom report.",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate stats
  const totalReports = reports.length
  const totalDownloads = reports.reduce((sum, report) => sum + report.downloads, 0)
  const scheduledReports = reports.filter(report => report.status === "scheduled").length
  const generatingReports = reports.filter(report => report.status === "generating").length

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Card in Teal with website theme */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Reports & <span className="text-white drop-shadow-sm">Intelligence</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Generate, schedule, and download business reports and analytics telemetry
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={isCustomReportOpen} onOpenChange={setIsCustomReportOpen}>
              <DialogTrigger asChild>
                <Button className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Custom Report
                </Button>
              </DialogTrigger>
              <DialogContent className={cn("sm:max-w-[600px] rounded-2xl border-2", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                <DialogHeader>
                  <DialogTitle className={cn("text-xl font-bold", isDark ? "text-white" : "text-navy")}>Create Custom Report</DialogTitle>
                  <DialogDescription className={cn("text-sm font-medium", isDark ? "text-teal-300" : "text-navy/70")}>
                    Configure your custom report parameters and automated delivery schedule
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-5 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="report-name" className={cn("font-bold text-xs uppercase", isDark ? "text-teal-300" : "text-navy")}>Report Name</Label>
                    <Input
                      id="report-name"
                      placeholder="e.g. Q3 Sales & Performance Audit"
                      value={customConfig.name}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, name: e.target.value }))}
                      className={cn("rounded-xl border border-teal text-sm", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date-range" className={cn("font-bold text-xs uppercase", isDark ? "text-teal-300" : "text-navy")}>Date Range</Label>
                      <Select 
                        value={customConfig.dateRange} 
                        onValueChange={(value) => setCustomConfig(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger className={cn("rounded-xl border border-teal", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 Days</SelectItem>
                          <SelectItem value="30d">Last 30 Days</SelectItem>
                          <SelectItem value="90d">Last Quarter (90 Days)</SelectItem>
                          <SelectItem value="1y">Last Year (12 Months)</SelectItem>
                          <SelectItem value="custom">Custom Date Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="format" className={cn("font-bold text-xs uppercase", isDark ? "text-teal-300" : "text-navy")}>Export Format</Label>
                      <Select 
                        value={customConfig.format} 
                        onValueChange={(value) => setCustomConfig(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger className={cn("rounded-xl border border-teal", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                          <SelectItem value="excel">Excel Spreadsheet (.xlsx)</SelectItem>
                          <SelectItem value="csv">CSV Data (.csv)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label className={cn("font-bold text-xs uppercase", isDark ? "text-teal-300" : "text-navy")}>Categories Included</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {categories.filter(cat => cat !== "all").map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={customConfig.categories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCustomConfig(prev => ({ 
                                  ...prev, 
                                  categories: [...prev.categories, category] 
                                }))
                              } else {
                                setCustomConfig(prev => ({ 
                                  ...prev, 
                                  categories: prev.categories.filter(c => c !== category) 
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={category} className={cn("text-xs font-semibold cursor-pointer", isDark ? "text-slate-200" : "text-navy")}>{category}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-charts"
                      checked={customConfig.includeCharts}
                      onCheckedChange={(checked) => setCustomConfig(prev => ({ ...prev, includeCharts: !!checked }))}
                    />
                    <Label htmlFor="include-charts" className={cn("text-sm font-semibold cursor-pointer", isDark ? "text-slate-200" : "text-navy")}>Include visual charts and graphical breakdowns</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="schedule" className={cn("font-bold text-xs uppercase", isDark ? "text-teal-300" : "text-navy")}>Schedule Frequency</Label>
                    <Select 
                      value={customConfig.scheduleFrequency} 
                      onValueChange={(value) => setCustomConfig(prev => ({ ...prev, scheduleFrequency: value }))}
                    >
                      <SelectTrigger className={cn("rounded-xl border border-teal", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">One-time Export</SelectItem>
                        <SelectItem value="daily">Daily Automated Report</SelectItem>
                        <SelectItem value="weekly">Weekly Automated Report</SelectItem>
                        <SelectItem value="monthly">Monthly Automated Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsCustomReportOpen(false)} className={cn("rounded-xl border-2 font-bold", isDark ? "border-teal/30 text-teal-300 hover:bg-teal-400/10" : "border-navy/20 text-navy hover:bg-navy/5")}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCustomReport} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-md">
                    Create Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" className={cn("font-bold rounded-xl h-10 px-4 border-2 transition-all", isDark ? "border-teal/40 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm")}>
              <Mail className="mr-2 h-4 w-4" />
              Email Reports
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Stats Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {[
          {
            title: "Total Reports",
            value: totalReports.toString(),
            subtitle: "Available reports",
            icon: FileText,
          },
          {
            title: "Total Downloads",
            value: totalDownloads.toString(),
            subtitle: "All-time exports",
            icon: Download,
          },
          {
            title: "Scheduled",
            value: scheduledReports.toString(),
            subtitle: "Automated jobs",
            icon: Clock,
          },
          {
            title: "Generating",
            value: generatingReports.toString(),
            subtitle: "In progress",
            icon: RefreshCw,
          },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
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
                    <div className="flex flex-col gap-0.5">
                      <span className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-black whitespace-nowrap tracking-tight", isDark ? "text-white" : "text-navy")}>
                        {stat.value}
                      </span>
                      <span className={cn("text-[10px] sm:text-xs font-medium", isDark ? "text-teal-400/70" : "text-navy/60")}>
                        {stat.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-2.5 rounded-xl border-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isDark 
                      ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                      : "bg-teal-100 border-navy/10 text-navy group-hover:bg-teal-200"
                  )}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 3. Category Filter Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-4 transition-all duration-300",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className={cn("text-sm sm:text-base font-bold uppercase tracking-wide", isDark ? "text-teal-300" : "text-navy")}>
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "capitalize text-xs font-bold rounded-xl h-8 sm:h-9 px-3 transition-all duration-200",
                  selectedCategory === category
                    ? "bg-navy text-white shadow-md hover:bg-navy/90"
                    : isDark 
                      ? "bg-transparent border border-teal/20 text-slate-300 hover:border-teal hover:text-teal-300 hover:bg-teal-400/10" 
                      : "bg-slate-50 border border-navy/15 text-navy hover:border-navy hover:bg-white"
                )}
              >
                {category === "all" ? (
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <span className="mr-1.5">{getCategoryIcon(category)}</span>
                )}
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. Reports Grid */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card 
            key={report.id} 
            className={cn(
              "group relative h-full rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1",
              isDark 
                ? "bg-[#0a1033] border-teal/20 shadow-lg hover:border-teal-400 hover:shadow-teal-950/30" 
                : "bg-white border-navy/20 shadow-md hover:border-navy hover:shadow-xl"
            )}
          >
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={cn(
                    "p-2 rounded-xl border flex-shrink-0 mt-0.5",
                    isDark ? "bg-teal-400/10 border-teal-400/30" : "bg-teal-100 border-navy/10"
                  )}>
                    {getCategoryIcon(report.category)}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className={cn("text-base font-bold truncate", isDark ? "text-white" : "text-navy")}>
                      {report.title}
                    </CardTitle>
                    <CardDescription className={cn("mt-1 text-xs line-clamp-2", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide flex-shrink-0", getStatusColor(report.status))}>
                  {report.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className={cn(
                "grid grid-cols-2 gap-2.5 p-3 rounded-xl text-xs border",
                isDark ? "bg-slate-900/60 border-teal/10" : "bg-slate-50 border-navy/10"
              )}>
                <div>
                  <p className={cn("text-[10px] uppercase font-bold", isDark ? "text-teal-400/70" : "text-navy/60")}>Category</p>
                  <p className={cn("font-bold truncate", isDark ? "text-slate-200" : "text-navy")}>{report.category}</p>
                </div>
                <div>
                  <p className={cn("text-[10px] uppercase font-bold", isDark ? "text-teal-400/70" : "text-navy/60")}>File Size</p>
                  <p className={cn("font-bold", isDark ? "text-slate-200" : "text-navy")}>{report.size}</p>
                </div>
                <div>
                  <p className={cn("text-[10px] uppercase font-bold", isDark ? "text-teal-400/70" : "text-navy/60")}>Generated</p>
                  <p className={cn("font-bold truncate", isDark ? "text-slate-200" : "text-navy")}>{formatDate(report.lastgenerated)}</p>
                </div>
                <div>
                  <p className={cn("text-[10px] uppercase font-bold", isDark ? "text-teal-400/70" : "text-navy/60")}>Downloads</p>
                  <p className={cn("font-bold", isDark ? "text-slate-200" : "text-navy")}>{report.downloads}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-xs font-bold", isDark ? "text-teal-400/80" : "text-navy/70")}>Formats:</p>
                <div className="flex flex-wrap gap-1">
                  {report.formats.map((format) => (
                    <Badge key={format} className="bg-brand-red text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={isGenerating === report.id || report.status === "generating"}
                  className="flex-1 bg-teal hover:bg-teal/80 text-navy font-bold rounded-xl h-9 shadow-sm active:scale-95 transition-all text-xs"
                >
                  {isGenerating === report.id ? (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Generate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(report.id, report.formats[0])}
                  disabled={report.status !== "ready"}
                  className={cn(
                    "flex-1 font-bold rounded-xl h-9 border-2 text-xs transition-all active:scale-95",
                    isDark 
                      ? "border-teal/30 text-teal-300 hover:bg-teal-400/15" 
                      : "border-navy/20 text-navy hover:bg-navy hover:text-white"
                  )}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reports.length === 0 && (
        <div className={cn(
          "text-center py-16 rounded-2xl border-2 border-dashed p-6",
          isDark ? "border-teal/20 bg-[#0a1033]/50 text-slate-300" : "border-navy/20 bg-white/50 text-navy"
        )}>
          <FileText className="mx-auto h-12 w-12 text-teal opacity-60" />
          <h3 className="mt-4 text-lg font-bold">No reports found</h3>
          <p className={cn("text-sm mt-1", isDark ? "text-slate-400" : "text-navy/70")}>
            {selectedCategory === "all" 
              ? "No reports are available yet." 
              : `No reports found for category "${selectedCategory}".`
            }
          </p>
        </div>
      )}
    </div>
  )
}
