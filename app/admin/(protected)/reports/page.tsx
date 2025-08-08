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
import { FileText, Download, Calendar, Filter, BarChart3, Users, ShoppingCart, DollarSign, Clock, Eye, Settings, Mail, RefreshCw, TrendingUp, PieChart } from "lucide-react"

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

  if (category === "all") {
    return baseReports
  }
  
  return baseReports.filter(report => report.category === category)
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
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
  const { toast } = useToast()

  const categories = ["all", "Sales", "Analytics", "Products", "Financial", "Operations", "Marketing", "Security", "Technical"]

  // Load reports on component mount and category change
  useEffect(() => {
    const loadReports = () => {
      const mockReports = generateMockReportData(selectedCategory)
      setReports(mockReports)
    }
    loadReports()
  }, [selectedCategory])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Sales": return <ShoppingCart className="h-4 w-4" />
      case "Analytics": return <TrendingUp className="h-4 w-4" />
      case "Products": return <BarChart3 className="h-4 w-4" />
      case "Financial": return <DollarSign className="h-4 w-4" />
      case "Operations": return <Settings className="h-4 w-4" />
      case "Marketing": return <Mail className="h-4 w-4" />
      case "Security": return <FileText className="h-4 w-4" />
      case "Technical": return <Settings className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800 border-green-200"
      case "generating": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed": return "bg-red-100 text-red-800 border-red-200"
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
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

  return (
    <div className="min-h-screen bg-teal">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-navy">
              Reports & <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-navy/80">Generate, schedule, and download business reports</p>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isCustomReportOpen} onOpenChange={setIsCustomReportOpen}>
              <DialogTrigger asChild>
                <Button className="bg-navy hover:bg-navy/90 text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Custom Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Custom Report</DialogTitle>
                  <DialogDescription>
                    Configure your custom report parameters and schedule
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      placeholder="Enter report name"
                      value={customConfig.name}
                      onChange={(e) => setCustomConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date-range">Date Range</Label>
                      <Select 
                        value={customConfig.dateRange} 
                        onValueChange={(value) => setCustomConfig(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                          <SelectItem value="1y">Last year</SelectItem>
                          <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="format">Format</Label>
                      <Select 
                        value={customConfig.format} 
                        onValueChange={(value) => setCustomConfig(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {customConfig.dateRange === "custom" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customConfig.startDate}
                          onChange={(e) => setCustomConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customConfig.endDate}
                          onChange={(e) => setCustomConfig(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label>Categories</Label>
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
                          <Label htmlFor={category} className="text-sm">{category}</Label>
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
                    <Label htmlFor="include-charts">Include charts and visualizations</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="schedule">Schedule Frequency</Label>
                    <Select 
                      value={customConfig.scheduleFrequency} 
                      onValueChange={(value) => setCustomConfig(prev => ({ ...prev, scheduleFrequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">One-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCustomReportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCustomReport} className="bg-navy hover:bg-navy/90">
                    Create Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" className="border-navy/20 text-navy hover:bg-navy/10">
              <Mail className="mr-2 h-4 w-4" />
              Email Reports
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-navy/20 bg-navy/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-navy/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{totalReports}</div>
              <p className="text-xs text-navy/70">
                Available reports
              </p>
            </CardContent>
          </Card>
          <Card className="border-navy/20 bg-navy/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Total Downloads</CardTitle>
              <Download className="h-4 w-4 text-navy/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{totalDownloads}</div>
              <p className="text-xs text-navy/70">
                All-time downloads
              </p>
            </CardContent>
          </Card>
          <Card className="border-navy/20 bg-navy/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-navy/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{scheduledReports}</div>
              <p className="text-xs text-navy/70">
                Upcoming reports
              </p>
            </CardContent>
          </Card>
          <Card className="border-navy/20 bg-navy/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-navy">Generating</CardTitle>
              <RefreshCw className="h-4 w-4 text-navy/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{generatingReports}</div>
              <p className="text-xs text-navy/70">
                In progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-navy">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`capitalize ${
                  selectedCategory === category 
                    ? "bg-navy hover:bg-navy/90 text-white" 
                    : "border-navy/20 text-navy hover:bg-navy hover:text-white"
                }`}
              >
                {category === "all" ? (
                  <Filter className="mr-2 h-4 w-4" />
                ) : (
                  getCategoryIcon(category)
                )}
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="group relative h-full border-2 border-navy/20 bg-navy/10 hover:border-navy hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(report.category)}
                    <div>
                      <CardTitle className="text-lg text-navy">{report.title}</CardTitle>
                      <CardDescription className="mt-1 text-navy/70">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-navy/70">Category</p>
                    <p className="font-medium text-navy">{report.category}</p>
                  </div>
                  <div>
                    <p className="text-navy/70">Size</p>
                    <p className="font-medium text-navy">{report.size}</p>
                  </div>
                  <div>
                    <p className="text-navy/70">Last Generated</p>
                    <p className="font-medium text-navy">{formatDate(report.lastgenerated)}</p>
                  </div>
                  <div>
                    <p className="text-navy/70">Downloads</p>
                    <p className="font-medium text-navy">{report.downloads}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-navy/70 mb-2">Available Formats</p>
                  <div className="flex gap-1">
                    {report.formats.map((format) => (
                      <Badge key={format} className="bg-brand-red text-white border-0 text-xs">
                        {format.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating === report.id || report.status === "generating"}
                    className="flex-1 bg-navy hover:bg-navy/90 text-white rounded-full"
                  >
                    {isGenerating === report.id ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report.id, report.formats[0])}
                    disabled={report.status !== "ready"}
                    className="flex-1 border-navy text-navy hover:bg-navy hover:text-white rounded-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-navy/50" />
            <h3 className="mt-4 text-lg font-semibold text-navy">No reports found</h3>
            <p className="text-navy/70">
              {selectedCategory === "all" 
                ? "No reports are available yet." 
                : `No reports found for category "${selectedCategory}".`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
