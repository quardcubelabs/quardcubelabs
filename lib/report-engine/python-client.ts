/**
 * Report Engine Document Generation Dispatcher
 * QuardCube Labs Enterprise Intelligence & Report Generation System
 * Orchestrates Python FastAPI document rendering microservice with seamless Node.js native fallback.
 */

import { ExportFormat, PreparedReportPayload } from "./types"
import { generatePdfReportBuffer } from "./pdf-generator"
import { generateDocxReportBuffer } from "./docx-generator"
import { generateXlsxReportBuffer } from "./xlsx-generator"
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
 * Render document via Python FastAPI microservice if running, with authoritative Node.js native generator.
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
      console.warn("Python report service failed or unavailable, using high-fidelity Node.js generator:", err)
    }
  }

  // Node.js native document generation
  return await renderReportWithNodeGenerator(reportData, format)
}

/**
 * Node.js native document generation for PDF, DOCX, and XLSX.
 */
async function renderReportWithNodeGenerator(
  reportData: PreparedReportPayload,
  format: ExportFormat
): Promise<GenerationResult> {
  const titleSafe = (reportData.title || "Report").replace(/[^a-zA-Z0-9_-]/g, "_")
  const periodFrom = reportData.period?.from || ""
  const periodTo = reportData.period?.to || ""
  const periodStr = periodFrom && periodTo ? `_${periodFrom}_to_${periodTo}` : ""

  if (format === "xlsx") {
    const buffer = await generateXlsxReportBuffer(reportData)
    const filename = `${titleSafe}${periodStr}.xlsx`
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

  if (format === "docx") {
    const buffer = await generateDocxReportBuffer(reportData)
    const filename = `${titleSafe}${periodStr}.docx`
    const fileUrl = await saveGeneratedBuffer(filename, buffer, "docx")

    return {
      success: true,
      filename,
      format: "docx",
      fileUrl,
      fileSize: buffer.length,
      engineUsed: "node-fallback"
    }
  }

  // Default: PDF
  const pdfBuffer = generatePdfReportBuffer(reportData)
  const filename = `${titleSafe}${periodStr}.pdf`
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
