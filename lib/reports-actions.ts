"use server"

import { createServerClient } from "@/lib/supabase"
import { 
  ReportType, 
  ExportFormat, 
  ReportConfiguration, 
  PreparedReportPayload, 
  GeneratedReportRecord, 
  ReportTemplateRecord,
  ReportSectionConfig
} from "./report-engine/types"
import { buildPreparedReportPayload, getDefaultSections, DEFAULT_BRANDING } from "./report-engine/data-fetcher"
import { renderReportDocument, checkPythonServiceHealth, GenerationResult } from "./report-engine/python-client"
import fs from "fs"
import path from "path"
import { 
  generateSalesReport, 
  generateUserReport, 
  generateProductsReport, 
  generateFinancialReport, 
  generateOperationsReport,
  generateComprehensiveReport,
  type ReportData 
} from "@/lib/real-reports-generator"

// Local fallback storage paths for zero-downtime persistence
const DB_DIR = path.join(process.cwd(), "db")
const REPORTS_STORAGE_FILE = path.join(DB_DIR, "reports_data.json")
const TEMPLATES_STORAGE_FILE = path.join(DB_DIR, "report_templates_data.json")

function ensureDbDir() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
  } catch (err) {
    // Read-only filesystem in serverless environments (Vercel/AWS Lambda)
  }
}

function readLocalReports(): GeneratedReportRecord[] {
  try {
    ensureDbDir()
    if (fs.existsSync(REPORTS_STORAGE_FILE)) {
      const raw = fs.readFileSync(REPORTS_STORAGE_FILE, "utf-8")
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error("Error reading local reports store:", err)
  }
  return []
}

function writeLocalReports(reports: GeneratedReportRecord[]) {
  try {
    ensureDbDir()
    fs.writeFileSync(REPORTS_STORAGE_FILE, JSON.stringify(reports, null, 2), "utf-8")
  } catch (err) {
    console.error("Error saving local reports store:", err)
  }
}

function readLocalTemplates(): ReportTemplateRecord[] {
  try {
    ensureDbDir()
    if (fs.existsSync(TEMPLATES_STORAGE_FILE)) {
      const raw = fs.readFileSync(TEMPLATES_STORAGE_FILE, "utf-8")
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error("Error reading local templates store:", err)
  }
  return []
}

function writeLocalTemplates(templates: ReportTemplateRecord[]) {
  try {
    ensureDbDir()
    fs.writeFileSync(TEMPLATES_STORAGE_FILE, JSON.stringify(templates, null, 2), "utf-8")
  } catch (err) {
    console.error("Error saving local templates store:", err)
  }
}

// -------------------------------------------------------------
// CORE REPORT SYSTEM SERVER ACTIONS
// -------------------------------------------------------------

/**
 * 1. LIVE PREVIEW ACTION
 * Computes authoritative report numbers server-side and returns prepared payload
 * for real-time live previewing in the Report Builder UI without generating files.
 */
export async function previewReportAction(
  config: ReportConfiguration
): Promise<{ success: boolean; data?: PreparedReportPayload; error?: string }> {
  try {
    if (!config || !config.type) {
      return { success: false, error: "Invalid report configuration provided." }
    }

    const payload = await buildPreparedReportPayload(config)
    return { success: true, data: payload }
  } catch (error: any) {
    console.error("Error preparing report preview:", error)
    return { success: false, error: error?.message || "Failed to prepare report preview." }
  }
}

/**
 * 2. GENERATE REPORT ACTION
 * Authoritatively aggregates data, delegates to Python FastAPI rendering engine (or Node fallback),
 * records generation history, and returns download URL.
 */
export async function generateReportAction(
  config: ReportConfiguration,
  format: ExportFormat = "pdf"
): Promise<{ 
  success: boolean
  reportRecord?: GeneratedReportRecord
  fileUrl?: string
  filename?: string
  engineUsed?: string
  error?: string 
}> {
  try {
    const supabase = createServerClient()
    
    // Server-side authoritative calculation
    const payload = await buildPreparedReportPayload(config)

    // Render document through Python FastAPI service (with Node.js fallback)
    const result: GenerationResult = await renderReportDocument(payload, format)

    if (!result.success) {
      throw new Error(result.error || "Document rendering engine failed.")
    }

    const recordId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const nowIso = new Date().toISOString()

    const newRecord: GeneratedReportRecord = {
      id: recordId,
      name: config.title || `${config.type.toUpperCase()} Report`,
      type: config.type,
      configuration: config,
      file_url: result.fileUrl,
      file_format: format,
      file_size: result.fileSize,
      status: "completed",
      created_by: "Administrator",
      created_at: nowIso,
      completed_at: nowIso
    }

    // Try saving to Supabase generated_reports table
    try {
      const { error: dbError } = await supabase.from("generated_reports").insert([newRecord])
      if (dbError) {
        console.warn("Supabase table 'generated_reports' not yet present or error, saving to local store:", dbError.message)
        const local = readLocalReports()
        local.unshift(newRecord)
        writeLocalReports(local)
      }
    } catch (e) {
      const local = readLocalReports()
      local.unshift(newRecord)
      writeLocalReports(local)
    }

    return {
      success: true,
      reportRecord: newRecord,
      fileUrl: result.fileUrl,
      filename: result.filename,
      engineUsed: result.engineUsed
    }
  } catch (error: any) {
    console.error("Error executing report generation:", error)
    return { success: false, error: error?.message || "Failed to generate business report." }
  }
}

/**
 * 3. GET GENERATED REPORTS LIST
 */
export async function getGeneratedReports(): Promise<GeneratedReportRecord[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("generated_reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) {
      // Fallback to local store
      return readLocalReports()
    }

    return data as GeneratedReportRecord[]
  } catch (error) {
    console.warn("Falling back to local report records:", error)
    return readLocalReports()
  }
}

/**
 * 4. SAVE REPORT TEMPLATE
 */
export async function saveReportTemplate(
  name: string,
  description: string,
  config: ReportConfiguration
): Promise<{ success: boolean; template?: ReportTemplateRecord; error?: string }> {
  try {
    const supabase = createServerClient()
    const templateId = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const nowIso = new Date().toISOString()

    const newTemplate: ReportTemplateRecord = {
      id: templateId,
      name,
      description,
      type: config.type,
      configuration: config,
      created_by: "Administrator",
      created_at: nowIso,
      updated_at: nowIso
    }

    try {
      const { error } = await supabase.from("report_templates").insert([newTemplate])
      if (error) {
        console.warn("Supabase report_templates insert fallback:", error.message)
        const localTpl = readLocalTemplates()
        localTpl.unshift(newTemplate)
        writeLocalTemplates(localTpl)
      }
    } catch (e) {
      const localTpl = readLocalTemplates()
      localTpl.unshift(newTemplate)
      writeLocalTemplates(localTpl)
    }

    return { success: true, template: newTemplate }
  } catch (error: any) {
    console.error("Error saving template:", error)
    return { success: false, error: error?.message || "Failed to save template." }
  }
}

/**
 * 5. GET REPORT TEMPLATES
 */
export async function getReportTemplates(): Promise<ReportTemplateRecord[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("report_templates")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data || data.length === 0) {
      return readLocalTemplates()
    }

    return data as ReportTemplateRecord[]
  } catch (error) {
    return readLocalTemplates()
  }
}

/**
 * 6. DUPLICATE REPORT CONFIGURATION
 */
export async function duplicateReportAction(
  reportId: string
): Promise<{ success: boolean; configuration?: ReportConfiguration; error?: string }> {
  try {
    const reports = await getGeneratedReports()
    const found = reports.find(r => r.id === reportId)
    if (!found) {
      return { success: false, error: "Report not found." }
    }

    const clonedConfig: ReportConfiguration = {
      ...found.configuration,
      title: `${found.configuration.title} (Copy)`,
      id: undefined
    }

    return { success: true, configuration: clonedConfig }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to duplicate report." }
  }
}

/**
 * 7. DELETE GENERATED REPORT
 */
export async function deleteReportAction(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient()
    
    // Attempt Supabase deletion
    try {
      await supabase.from("generated_reports").delete().eq("id", reportId)
    } catch (e) {
      // ignore
    }

    // Always clean local fallback
    const local = readLocalReports()
    const filtered = local.filter(r => r.id !== reportId)
    writeLocalReports(filtered)

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to delete report." }
  }
}

/**
 * 8. CHECK PYTHON SERVICE STATUS
 */
export async function getReportEngineStatus(): Promise<{ pythonServiceOnline: boolean }> {
  const isOnline = await checkPythonServiceHealth()
  return { pythonServiceOnline: isOnline }
}


// -------------------------------------------------------------
// LEGACY BACKWARDS-COMPATIBILITY EXPORTS
// -------------------------------------------------------------

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
    if (error) return []
    return (data || []).map((report: any) => ({
      id: report.id || '',
      title: report.title || 'Untitled Report',
      description: report.description || `Generated report for ${report.category || 'general'} analysis`,
      category: report.category || 'General',
      formats: report.formats || ['pdf'],
      lastgenerated: report.lastgenerated || null,
      status: report.status || 'ready',
      size: report.size || '0 MB',
      downloads: report.downloads || 0
    }))
  } catch {
    return []
  }
}

export async function generateReport(reportId: string): Promise<boolean> {
  return true
}

export async function downloadReport(reportId: string, format: string): Promise<{ content: string, mimeType: string }> {
  return { content: "Report generated", mimeType: "text/plain" }
}

export async function createCustomReport(config: CustomReportConfig): Promise<boolean> {
  return true
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

export async function generateCustomReportData(params: GenerateReportRequest): Promise<{ 
  success: boolean
  data?: ReportData
  error?: string 
}> {
  try {
    const { category, dateRange: rangePreset, startDate: customStart, endDate: customEnd, title } = params
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

    const dateRange = { start: start.toISOString(), end: end.toISOString() }
    let reportData: ReportData | null = null

    switch (category) {
      case 'sales': {
        const res = await generateSalesReport(dateRange)
        if (res.success) reportData = res.data!
        break
      }
      case 'financial': {
        const res = await generateFinancialReport(dateRange)
        if (res.success) reportData = res.data!
        break
      }
      case 'products': {
        const res = await generateProductsReport(dateRange)
        if (res.success) reportData = res.data!
        break
      }
      case 'operations': {
        const res = await generateOperationsReport(dateRange)
        if (res.success) reportData = res.data!
        break
      }
      case 'analytics': {
        const res = await generateUserReport(dateRange)
        if (res.success) reportData = res.data!
        break
      }
      case 'comprehensive':
      default: {
        const res = await generateComprehensiveReport(dateRange, title)
        if (res.success) reportData = res.data!
        break
      }
    }

    if (title && reportData) reportData.title = title
    return { success: true, data: reportData || undefined }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to generate custom report' }
  }
}
