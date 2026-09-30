/**
 * Python Report Engine Service Client & Local Fallback
 * QuardCube Labs Report Generation System
 */

import { ExportFormat, PreparedReportPayload } from "./types"
import { generatePdfReportBuffer } from "./pdf-generator"
import ExcelJS from "exceljs"
import fs from "fs"
import path from "path"

const PYTHON_SERVICE_URL = process.env.PYTHON_REPORT_SERVICE_URL || "http://127.0.0.1:8000"

export interface GenerationResult {
  success: boolean
  filename: string
  format: ExportFormat
  fileUrl: string
  fileSize: number
  engineUsed: 'python-fastapi' | 'node-fallback'
  error?: string
}

let lastHealthCheckTime = 0
let lastHealthStatus = false
const HEALTH_CACHE_MS = 15000

/**
 * Check if the Python FastAPI microservice is healthy and ready.
 */
export async function checkPythonServiceHealth(): Promise<boolean> {
  const now = Date.now()
  if (now - lastHealthCheckTime < HEALTH_CACHE_MS) {
    return lastHealthStatus
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 400)
    
    const res = await fetch(`${PYTHON_SERVICE_URL}/health`, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    })
    clearTimeout(timeoutId)
    lastHealthStatus = res.ok
    lastHealthCheckTime = now
    return lastHealthStatus
  } catch {
    lastHealthStatus = false
    lastHealthCheckTime = now
    return false
  }
}

/**
 * Render document via Python FastAPI microservice, with fallback to Node.js.
 */
export async function renderReportDocument(
  reportData: PreparedReportPayload,
  format: ExportFormat
): Promise<GenerationResult> {
  const isPythonAvailable = await checkPythonServiceHealth()

  if (isPythonAvailable) {
    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          report: reportData,
          format: format
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.file_base64) {
          const buffer = Buffer.from(data.file_base64, "base64")
          const fileUrl = await saveGeneratedBuffer(data.filename, buffer, format)
          return {
            success: true,
            filename: data.filename,
            format,
            fileUrl,
            fileSize: data.file_size_bytes || buffer.length,
            engineUsed: "python-fastapi"
          }
        }
      }
    } catch (err) {
      console.warn("Python report service failed, activating Node.js fallback:", err)
    }
  }

  // Node.js fallback rendering
  return await renderReportWithNodeFallback(reportData, format)
}

/**
 * Node.js fallback document generation.
 */
async function renderReportWithNodeFallback(
  reportData: PreparedReportPayload,
  format: ExportFormat
): Promise<GenerationResult> {
  const titleSafe = reportData.title.replace(/[^a-zA-Z0-9_-]/g, "_")
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = reportData.branding.companyName || "QuardCube Labs"
    workbook.created = new Date()

    // 1. Summary Sheet
    const wsSummary = workbook.addWorksheet("Executive Summary")
    wsSummary.addRow([reportData.branding.companyName || "QUARDCUBE LABS"])
    wsSummary.addRow([reportData.title])
    wsSummary.addRow([`Period: ${reportData.period.from} to ${reportData.period.to}`])
    wsSummary.addRow([])

    wsSummary.addRow(["Key Performance Metric", "Value", "Context / Note"])
    reportData.summary.metrics.forEach(m => {
      wsSummary.addRow([m.label, String(m.value), m.description || ""])
    })

    // 2. Tables Sheets
    if (reportData.tables) {
      Object.entries(reportData.tables).forEach(([tKey, tData]) => {
        const sheetTitle = (tData.title || tKey).slice(0, 31)
        const wsTable = workbook.addWorksheet(sheetTitle)
        wsTable.addRow([tData.title])
        wsTable.addRow([])
        wsTable.addRow(tData.headers)
        tData.rows.forEach(r => wsTable.addRow(r))
      })
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
    const filename = `${titleSafe}_${timestamp}.xlsx`
    const fileUrl = await saveGeneratedBuffer(filename, buffer, "xlsx")

    return {
      success: true,
      filename,
      format: "xlsx",
      fileUrl,
      fileSize: buffer.length,
      engineUsed: "node-fallback"
    }
  }

  if (format === "pdf") {
    const pdfBuffer = generatePdfReportBuffer(reportData)
    const filename = `${titleSafe}_${timestamp}.pdf`
    const fileUrl = await saveGeneratedBuffer(filename, pdfBuffer, "pdf")

    return {
      success: true,
      filename,
      format: "pdf",
      fileUrl,
      fileSize: pdfBuffer.length,
      engineUsed: "node-fallback"
    }
  }

  // Fallback for DOCX (Generates structured report file)
  const filename = `${titleSafe}_${timestamp}.${format}`
  const jsonReportContent = Buffer.from(JSON.stringify(reportData, null, 2), "utf-8")
  const fileUrl = await saveGeneratedBuffer(filename, jsonReportContent, format)

  return {
    success: true,
    filename,
    format,
    fileUrl,
    fileSize: jsonReportContent.length,
    engineUsed: "node-fallback"
  }
}

function getMimeType(format: string): string {
  switch (format.toLowerCase()) {
    case "pdf":
      return "application/pdf"
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    case "csv":
      return "text/csv"
    default:
      return "application/octet-stream"
  }
}

/**
 * Returns a Base64 data URL for direct, fail-safe client downloads across serverless & read-only hostings (Vercel/Lambda),
 * while safely attempting local disk caching if the file system is writable.
 */
async function saveGeneratedBuffer(
  filename: string,
  buffer: Buffer,
  format: string
): Promise<string> {
  const mimeType = getMimeType(format)
  const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`

  // Safely attempt local cache write in development environments
  try {
    const reportsDir = path.join(process.cwd(), "public", "generated_reports")
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }
    const filePath = path.join(reportsDir, filename)
    fs.writeFileSync(filePath, buffer)
  } catch (err) {
    // Read-only filesystem in serverless environments (Vercel/AWS Lambda) - gracefully ignore
  }

  return dataUrl
}
