import { buildPreparedReportPayload, getDefaultSections, DEFAULT_BRANDING } from "../lib/report-engine/data-fetcher"
import { generatePdfReportBuffer } from "../lib/report-engine/pdf-generator"
import { renderReportDocument } from "../lib/report-engine/python-client"
import { ReportConfiguration, ReportType } from "../lib/report-engine/types"

async function runTest() {
  const types: ReportType[] = ["sales", "inventory", "customers", "financial", "purchases", "it_assets", "custom"]
  
  for (const type of types) {
    console.log(`\n=== Testing report type: ${type.toUpperCase()} ===`)
    const config: ReportConfiguration = {
      title: `Executive ${type.toUpperCase()} Audit Report`,
      description: `Authoritative analytics, variance metrics, and ledger for ${type} domain.`,
      type,
      period: {
        from: "2026-09-01",
        to: "2026-09-30"
      },
      comparison: {
        enabled: true,
        type: "previous_period",
        from: "2026-08-01",
        to: "2026-08-31"
      },
      branding: DEFAULT_BRANDING,
      sections: getDefaultSections(type)
    }

    const payload = await buildPreparedReportPayload(config)
    console.log(`[OK] Payload generated: Title="${payload.title}"`)
    console.log(`[OK] Metrics: ${payload.summary?.metrics?.length || 0} KPIs computed`)
    console.log(`[OK] Tables: ${Object.keys(payload.tables || {}).join(", ")}`)

    const renderResult = await renderReportDocument(payload, "pdf")
    console.log(`[OK] PDF Generated: ${renderResult.filename} (${renderResult.fileSize} bytes, engine: ${renderResult.engineUsed})`)

    if (!renderResult.success || !renderResult.fileUrl || renderResult.fileSize < 1000) {
      throw new Error(`PDF generation failed or file too small for ${type}`)
    }
  }

  console.log("\n>>> ALL 7 REPORT TYPES COMPILED AND GENERATED VALID PDF DOCUMENTS SUCCESSFULLY! <<<")
}

runTest().catch(err => {
  console.error("Test failed with error:", err)
  process.exit(1)
})
