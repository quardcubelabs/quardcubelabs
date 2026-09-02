"use server"

import { createServerClient } from "@/lib/supabase"
import { 
  generateSalesReport, 
  generateUserReport, 
  generateProductsReport, 
  generateFinancialReport, 
  generateOperationsReport,
  type ReportData 
} from "@/lib/real-reports-generator"

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

export async function getReports(category?: string): Promise<Report[]> {
  try {
    
    const supabase = createServerClient()
    
    let query = supabase.from("reports").select("*")
    if (category && category !== 'all') {
      query = query.eq("category", category)
    }
    
    const { data, error } = await query.order('lastgenerated', { ascending: false, nullsFirst: false })
    
    if (error) {
      console.error('Error fetching reports:', error)
      return []
    }
    
    // Transform data to match expected interface
    const transformedData = (data || []).map((report: any) => ({
      id: report.id || '',
      title: report.title || report.id?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Untitled Report',
      description: report.description || `Generated report for ${report.category || 'general'} analysis`,
      category: report.category || 'General',
      formats: report.formats || ['pdf'],
      lastgenerated: report.lastgenerated || null,
      status: report.status || 'ready',
      size: report.size || '0 MB',
      downloads: report.downloads || 0
    }))
    
    
    return transformedData
  } catch (error) {
    console.error('Error fetching reports:', error)
    return []
  }
}

export async function generateReport(reportId: string): Promise<boolean> {
  const supabase = createServerClient()
  
  try {
    // Get report details
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single()

    if (fetchError || !report) {
      console.error('Error fetching report:', fetchError)
      return false
    }

    // Set up date range (last 30 days by default)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const dateRange = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }

    let reportData: ReportData | null = null

    // Generate report based on category
    switch (report.category.toLowerCase()) {
      case 'sales':
        const salesResult = await generateSalesReport(dateRange)
        if (salesResult.success) reportData = salesResult.data!
        break
        
      case 'analytics':
        const userResult = await generateUserReport(dateRange)
        if (userResult.success) reportData = userResult.data!
        break
        
      case 'products':
        const productsResult = await generateProductsReport(dateRange)
        if (productsResult.success) reportData = productsResult.data!
        break
        
      case 'financial':
        const financialResult = await generateFinancialReport(dateRange)
        if (financialResult.success) reportData = financialResult.data!
        break
        
      case 'operations':
        const operationsResult = await generateOperationsReport(dateRange)
        if (operationsResult.success) reportData = operationsResult.data!
        break
        
      default:
        // For other categories, simulate generation
        await new Promise(res => setTimeout(res, 2000))
        reportData = {
          title: report.title,
          description: report.description,
          generatedAt: new Date().toISOString(),
          category: report.category,
          data: { message: "Report generated successfully" },
          summary: {
            totalRecords: Math.floor(Math.random() * 1000) + 100,
            dateRange: `${startDate.toDateString()} to ${endDate.toDateString()}`,
            keyMetrics: {
              totalItems: Math.floor(Math.random() * 500) + 50,
              averageValue: Math.floor(Math.random() * 1000) + 100
            }
          }
        }
    }

    if (!reportData) {
      return false
    }

    // Calculate realistic file size based on data
    const dataSize = JSON.stringify(reportData).length
    const sizeInKB = Math.ceil(dataSize / 1024)
    const sizeInMB = sizeInKB > 1024 ? (sizeInKB / 1024).toFixed(1) + ' MB' : sizeInKB + ' KB'

    // Update report status
    const { error } = await supabase
      .from("reports")
      .update({ 
        status: "ready", 
        lastgenerated: new Date().toISOString(),
        size: sizeInMB
      })
      .eq("id", reportId)
    
    if (error) {
      console.error('Error updating report:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error generating report:', error)
    return false
  }
}

export async function downloadReport(reportId: string, format: string): Promise<{ content: string, mimeType: string }> {
  const supabase = createServerClient()
  
  try {
    // Get report details
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single()

    if (fetchError || !report) {
      throw new Error('Report not found')
    }

    // Generate fresh report data for download
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    const dateRange = {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }

    let reportData: ReportData | null = null

    // Generate report data based on category
    switch (report.category.toLowerCase()) {
      case 'sales':
        const salesResult = await generateSalesReport(dateRange, format)
        if (salesResult.success) reportData = salesResult.data!
        break
        
      case 'analytics':
        const userResult = await generateUserReport(dateRange)
        if (userResult.success) reportData = userResult.data!
        break
        
      case 'products':
        const productsResult = await generateProductsReport(dateRange)
        if (productsResult.success) reportData = productsResult.data!
        break
        
      case 'financial':
        const financialResult = await generateFinancialReport(dateRange)
        if (financialResult.success) reportData = financialResult.data!
        break
        
      case 'operations':
        const operationsResult = await generateOperationsReport(dateRange)
        if (operationsResult.success) reportData = operationsResult.data!
        break
        
      default:
        reportData = {
          title: report.title,
          description: report.description,
          generatedAt: new Date().toISOString(),
          category: report.category,
          data: { message: "Sample report data" },
          summary: {
            totalRecords: 0,
            dateRange: `${startDate.toDateString()} to ${endDate.toDateString()}`,
            keyMetrics: {}
          }
        }
    }

    // Increment download count
    const { data: currentReport } = await supabase
      .from("reports")
      .select("downloads")
      .eq("id", reportId)
      .single()
    
    if (currentReport) {
      await supabase
        .from("reports")
        .update({ downloads: currentReport.downloads + 1 })
        .eq("id", reportId)
    }

    // Generate file content based on format
    let fileContent = ''
    let mimeType = 'text/plain'

    if (format === 'csv') {
      fileContent = generateCSV(reportData!)
      mimeType = 'text/csv'
    } else if (format === 'json') {
      fileContent = JSON.stringify(reportData, null, 2)
      mimeType = 'application/json'
    } else {
      // Default to plain text format
      fileContent = generateTextReport(reportData!)
      mimeType = 'text/plain'
    }
    
    return { content: fileContent, mimeType }
  } catch (error) {
    console.error('Error downloading report:', error)
    throw error
  }
}

export async function createCustomReport(config: CustomReportConfig): Promise<boolean> {
  const supabase = createServerClient()
  
  try {
    const reportId = `custom-${Date.now()}`
    
    const { error } = await supabase.from("reports").insert({
      id: reportId,
      title: config.name,
      description: `Custom report: ${config.name} | Date Range: ${config.dateRange} | Categories: ${config.categories.join(', ')}`,
      category: config.categories.length > 0 ? config.categories[0] : "Custom",
      formats: [config.format, "csv", "json"], // Always include multiple formats
      lastgenerated: null,
      status: config.scheduleFrequency === "none" ? "generating" : "scheduled",
      size: "0 KB",
      downloads: 0
    })
    
    if (error) {
      console.error('Error creating custom report:', error)
      return false
    }

    // If immediate generation is requested, generate the report
    if (config.scheduleFrequency === "none") {
      // Start generation in background
      setTimeout(async () => {
        await generateReport(reportId)
      }, 1000)
    }
    
    return true
  } catch (error) {
    console.error('Error creating custom report:', error)
    return false
  }
}

export interface GenerateReportRequest {
  title?: string
  category: 'sales' | 'analytics' | 'products' | 'financial' | 'operations' | 'comprehensive'
  dateRange: string
  startDate?: string
  endDate?: string
  format: 'pdf' | 'csv' | 'json' | 'txt'
  includeCharts?: boolean
}

// Generate an on-demand professional report with real database data
export async function generateCustomReportData(params: GenerateReportRequest): Promise<{ 
  success: boolean
  data?: ReportData
  error?: string 
}> {
  try {
    const { category, dateRange: rangePreset, startDate: customStart, endDate: customEnd, title } = params

    // Calculate dates
    let start: Date
    let end: Date = new Date()

    if (rangePreset === 'custom' && customStart && customEnd) {
      start = new Date(customStart)
      end = new Date(customEnd)
    } else {
      const daysAgo = rangePreset === '7d' ? 7 : rangePreset === '90d' ? 90 : rangePreset === '1y' ? 365 : 30
      start = new Date()
      start.setDate(start.getDate() - daysAgo)
    }

    const dateRange = {
      start: start.toISOString(),
      end: end.toISOString()
    }

    let reportData: ReportData | null = null

    switch (category) {
      case 'sales': {
        const res = await generateSalesReport(dateRange)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate sales report')
        reportData = res.data
        break
      }
      case 'analytics': {
        const res = await generateUserReport(dateRange)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate analytics report')
        reportData = res.data
        break
      }
      case 'products': {
        const res = await generateProductsReport(dateRange)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate products report')
        reportData = res.data
        break
      }
      case 'financial': {
        const res = await generateFinancialReport(dateRange)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate financial report')
        reportData = res.data
        break
      }
      case 'operations': {
        const res = await generateOperationsReport(dateRange)
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to generate operations report')
        reportData = res.data
        break
      }
      case 'comprehensive':
      default: {
        // Run all reports in parallel for an executive summary
        const [sales, user, products, financial, ops] = await Promise.all([
          generateSalesReport(dateRange),
          generateUserReport(dateRange),
          generateProductsReport(dateRange),
          generateFinancialReport(dateRange),
          generateOperationsReport(dateRange)
        ])

        const totalRevenue = financial.data?.summary.keyMetrics.totalRevenue || sales.data?.summary.keyMetrics.totalRevenue || 0
        const totalOrders = sales.data?.summary.keyMetrics.totalOrders || 0
        const totalCustomers = user.data?.summary.keyMetrics.totalCustomers || 0

        reportData = {
          title: title || 'Executive Comprehensive Business Intelligence Report',
          description: `Full multi-domain performance intelligence covering Sales, Financials, Customers, Products, and Operations (${start.toLocaleDateString()} to ${end.toLocaleDateString()})`,
          generatedAt: new Date().toISOString(),
          category: 'Comprehensive',
          data: {
            salesOverview: sales.data?.summary.keyMetrics || {},
            topCustomers: user.data?.data?.topCustomers || [],
            topProducts: products.data?.data?.topProducts || [],
            financials: financial.data?.summary.keyMetrics || {},
            operations: ops.data?.summary.keyMetrics || {}
          },
          summary: {
            totalRecords: totalOrders + totalCustomers + (products.data?.summary.totalRecords || 0),
            dateRange: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            keyMetrics: {
              totalRevenue,
              totalOrders,
              totalCustomers,
              topProduct: products.data?.summary.keyMetrics.topProduct || 'N/A',
              activeServices: ops.data?.summary.keyMetrics.activeServices || 0,
              completionRate: financial.data?.summary.keyMetrics.completionRate ? `${financial.data.summary.keyMetrics.completionRate.toFixed(1)}%` : '100%'
            }
          }
        }
        break
      }
    }

    if (title && reportData) {
      reportData.title = title
    }

    return { success: true, data: reportData }
  } catch (error: any) {
    console.error('Error generating custom report data:', error)
    return { success: false, error: error?.message || 'Failed to generate custom report' }
  }
}

// Helper functions for file generation
function generateCSV(reportData: ReportData): string {
  let csv = `Title,${reportData.title}\n`
  csv += `Description,${reportData.description}\n`
  csv += `Generated At,${reportData.generatedAt}\n`
  csv += `Category,${reportData.category}\n`
  csv += `Total Records,${reportData.summary.totalRecords}\n`
  csv += `Date Range,${reportData.summary.dateRange}\n\n`
  
  // Add key metrics
  csv += 'Key Metrics\n'
  Object.entries(reportData.summary.keyMetrics).forEach(([key, value]) => {
    csv += `${key},${value}\n`
  })
  
  // Add specific data based on category
  if (reportData.category === 'Sales' && reportData.data.orders) {
    csv += '\nOrders Data\n'
    csv += 'Order ID,Customer Name,Email,Total,Status,Date\n'
    reportData.data.orders.slice(0, 100).forEach((order: any) => {
      csv += `${order.id},${order.customerName},${order.customerEmail},${order.total},${order.status},${order.created_at}\n`
    })
  }
  
  return csv
}

function generateTextReport(reportData: ReportData): string {
  let report = `=== ${reportData.title} ===\n\n`
  report += `Description: ${reportData.description}\n`
  report += `Generated: ${new Date(reportData.generatedAt).toLocaleString()}\n`
  report += `Category: ${reportData.category}\n`
  report += `Date Range: ${reportData.summary.dateRange}\n`
  report += `Total Records: ${reportData.summary.totalRecords}\n\n`
  
  report += '=== KEY METRICS ===\n'
  Object.entries(reportData.summary.keyMetrics).forEach(([key, value]) => {
    report += `${key}: ${typeof value === 'number' && key.toLowerCase().includes('revenue') ? 'TZS ' + value.toLocaleString() : value}\n`
  })
  
  report += '\n=== DETAILED DATA ===\n'
  report += JSON.stringify(reportData.data, null, 2)
  
  report += '\n\n=== GENERATED BY QUARDCUBE LABS REPORTING SYSTEM ===\n'
  report += `Report ID: ${reportData.title.replace(/\s+/g, '-').toLowerCase()}\n`
  report += `Export Format: Text\n`
  report += `Export Time: ${new Date().toLocaleString()}\n`
  
  return report
}
