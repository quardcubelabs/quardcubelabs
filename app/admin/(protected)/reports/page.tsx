
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
import { FileText, Download, Calendar, Filter, BarChart3, Users, ShoppingCart, DollarSign, Clock, Eye, Settings, Mail, RefreshCw } from "lucide-react"
import { getReports, generateReport, downloadReport, createCustomReport, type Report, type CustomReportConfig } from "@/lib/reports-actions"

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isCustomReportOpen, setIsCustomReportOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
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
  const [reports, setReports] = useState<Report[]>([])
  const { toast } = useToast()

  const categories = ["all", "Sales", "Analytics", "Products", "Financial", "Operations", "Marketing", "Security", "Technical", "Custom"]

  useEffect(() => {
    const fetchReports = async () => {
      const data = await getReports(selectedCategory)
      setReports(data)
    }
    fetchReports()
  }, [selectedCategory])

  const filteredReports = reports

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Sales": return <ShoppingCart className="h-4 w-4" />
      case "Analytics": return <Eye className="h-4 w-4" />
      case "Products": return <BarChart3 className="h-4 w-4" />
      case "Financial": return <DollarSign className="h-4 w-4" />
      case "Operations": return <Settings className="h-4 w-4" />
      case "Marketing": return <Mail className="h-4 w-4" />
      case "Security": return <FileText className="h-4 w-4" />
      case "Technical": return <Settings className="h-4 w-4" />
      case "Custom": return <RefreshCw className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
      case "generating":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Generating</Badge>
      case "scheduled":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Scheduled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId)
    try {
      await generateReport(reportId)
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully and is ready for download.",
      })
      // Refresh reports
      const data = await getReports(selectedCategory)
      setReports(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const handleDownloadReport = async (reportId: string, format: string) => {
    toast({
      title: "Download Started",
      description: `Downloading report in ${format.toUpperCase()} format...`,
    })
    const blob = await downloadReport(reportId, format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${reportId}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast({
      title: "Download Complete",
      description: "Report has been downloaded successfully.",
    })
  }

  const handleCreateCustomReport = async () => {
    if (!customConfig.name) {
      toast({
        title: "Validation Error",
        description: "Please enter a report name.",
        variant: "destructive",
      })
      return
    }
    await createCustomReport(customConfig)
    toast({
      title: "Custom Report Created",
      description: `Custom report "${customConfig.name}" has been created and scheduled for generation.`,
    })
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
    // Refresh reports
    const data = await getReports(selectedCategory)
    setReports(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate, schedule, and download comprehensive business reports with real data from your database</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCustomReportOpen} onOpenChange={setIsCustomReportOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Create Custom Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Configure a custom report with specific parameters and filters
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      value={customConfig.name}
                      onChange={(e) => setCustomConfig({...customConfig, name: e.target.value})}
                      placeholder="Enter report name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-range">Date Range</Label>
                    <Select value={customConfig.dateRange} onValueChange={(value) => setCustomConfig({...customConfig, dateRange: value})}>
                      <SelectTrigger>
                        <SelectValue />
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
                </div>

                {customConfig.dateRange === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customConfig.startDate}
                        onChange={(e) => setCustomConfig({...customConfig, startDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customConfig.endDate}
                        onChange={(e) => setCustomConfig({...customConfig, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Report Categories</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Sales", "Analytics", "Products", "Financial", "Operations", "Marketing"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={customConfig.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCustomConfig({
                                ...customConfig,
                                categories: [...customConfig.categories, category]
                              })
                            } else {
                              setCustomConfig({
                                ...customConfig,
                                categories: customConfig.categories.filter(c => c !== category)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={category} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select value={customConfig.format} onValueChange={(value) => setCustomConfig({...customConfig, format: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Schedule Frequency</Label>
                    <Select value={customConfig.scheduleFrequency} onValueChange={(value) => setCustomConfig({...customConfig, scheduleFrequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Generate Once</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={customConfig.includeCharts}
                    onCheckedChange={(checked) => setCustomConfig({...customConfig, includeCharts: !!checked})}
                  />
                  <Label htmlFor="include-charts">Include charts and visualizations</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCustomReportOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomReport}>
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email Reports
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category !== "all" && getCategoryIcon(category)}
            {category === "all" ? "All Reports" : category}
          </Button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(report.category)}
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {report.category}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>
              <CardDescription className="mt-2">
                {report.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-2 font-medium">{report.size}</span>
                </div>
                <div>
                  <span className="text-gray-600">Downloads:</span>
                  <span className="ml-2 font-medium">{report.downloads}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Last Generated:</span>
                  <span className="ml-2 font-medium">
                    {report.lastgenerated ? new Date(report.lastgenerated).toLocaleDateString() : 'Not generated yet'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-gray-600">Available Formats:</div>
                <div className="flex gap-1 flex-wrap">
                  {report.formats.map((format) => (
                    <Badge key={format} variant="secondary" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={isGenerating === report.id || report.status === "generating"}
                >
                  {isGenerating === report.id ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {report.status === "generating" ? "Generating..." : "Regenerate"}
                </Button>
                
                <Select onValueChange={(format) => handleDownloadReport(report.id, format)}>
                  <SelectTrigger className="w-24">
                    <Download className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {report.formats.map((format) => (
                      <SelectItem key={format} value={format.toLowerCase()}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-navy" />
              <div>
                <div className="text-2xl font-bold">{reports.length}</div>
                <div className="text-sm text-gray-600">Total Reports</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{reports.reduce((sum, r) => sum + r.downloads, 0)}</div>
                <div className="text-sm text-gray-600">Total Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{reports.filter(r => r.status === "scheduled").length}</div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{reports.filter(r => r.status === "generating").length}</div>
                <div className="text-sm text-gray-600">Generating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}