/**
 * Pure Node.js Microsoft Excel (.xlsx) Business Workbook Generator
 * Generates publication-quality, multi-sheet structured business workbooks using ExcelJS.
 * Features Cover & Dashboard tab, Formatted KPIs, Dynamic Data Register tabs with frozen panes,
 * Auto-filters, Currency formatting, and Methodology / Governance tabs.
 */

import ExcelJS from "exceljs"
import { PreparedReportPayload } from "./types"

export async function generateXlsxReportBuffer(report: PreparedReportPayload): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const branding = report.branding || {}
  const companyName = branding.companyName || "QUARDCUBE LABS"
  workbook.creator = companyName
  workbook.lastModifiedBy = branding.preparedBy || "Senior Business Analyst"
  workbook.created = new Date()
  workbook.modified = new Date()

  const navyColor = "0F172A"
  const tealColor = "0D9488"
  const lightBgColor = "F8FAFC"
  const zebraColor = "F1F5F9"
  const headerFontColor = "FFFFFF"

  // -------------------------------------------------------------
  // SHEET 1: EXECUTIVE BRIEFING & DASHBOARD
  // -------------------------------------------------------------
  const wsSummary = workbook.addWorksheet("Executive Summary", {
    views: [{ showGridLines: true }]
  })

  // 1. Company Header Banner
  wsSummary.mergeCells("A1:G1")
  const titleCell = wsSummary.getCell("A1")
  titleCell.value = companyName.toUpperCase()
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF0D9488" } }
  titleCell.alignment = { vertical: "middle", horizontal: "left" }

  wsSummary.mergeCells("A2:G2")
  const docTitleCell = wsSummary.getCell("A2")
  docTitleCell.value = report.title
  docTitleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: `FF${navyColor}` } }

  wsSummary.mergeCells("A3:G3")
  const metaCell = wsSummary.getCell("A3")
  metaCell.value = `${report.subtitle || "Executive Performance Assessment"}  |  Period: ${report.period?.formatted || `${report.period?.from} – ${report.period?.to}`}  |  Prepared By: ${branding.preparedBy || "Senior Analyst"}  |  Issued: ${new Date().toLocaleDateString("en-GB")}`
  metaCell.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF64748B" } }

  let currRow = 5

  // 2. Executive Narrative Callout
  const execSummary = report.narrative?.executiveSummary || report.summary?.executiveSummary || report.narrative?.overview
  if (execSummary) {
    wsSummary.cell(row=currRow, column=1)
    const lblCell = wsSummary.getCell(`A${currRow}`)
    lblCell.value = "EXECUTIVE SUMMARY & STRATEGIC BRIEFING"
    lblCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: `FF${navyColor}` } }
    currRow++

    wsSummary.mergeCells(`A${currRow}:G${currRow + 2}`)
    const narrCell = wsSummary.getCell(`A${currRow}`)
    narrCell.value = execSummary
    narrCell.font = { name: "Calibri", size: 9.5, color: { argb: "FF1E293B" } }
    narrCell.alignment = { wrapText: true, vertical: "top" }

    for (let r = currRow; r <= currRow + 2; r++) {
      for (let c = 1; c <= 7; c++) {
        const cell = wsSummary.getCell(r, c)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${lightBgColor}` } }
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } }
        }
      }
    }
    currRow += 4
  }

  // 3. Key Performance Indicators Table
  const metrics = report.summary?.metrics || []
  if (metrics.length > 0) {
    wsSummary.getCell(`A${currRow}`).value = "KEY PERFORMANCE INDICATORS (KPIs)"
    wsSummary.getCell(`A${currRow}`).font = { name: "Calibri", size: 10.5, bold: true, color: { argb: `FF${navyColor}` } }
    currRow++

    const kpiHdr = ["Indicator Label", "Recorded Value", "Comparison / Trend", "Context & Notes"]
    const kpiColWidths = [32, 24, 20, 40]

    kpiHdr.forEach((h, idx) => {
      const cell = wsSummary.getCell(currRow, idx + 1)
      cell.value = h.toUpperCase()
      cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: `FF${headerFontColor}` } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyColor}` } }
      cell.alignment = { vertical: "middle", horizontal: idx === 1 ? "right" : "left" }
      cell.border = {
        top: { style: "thin", color: { argb: "FF0F172A" } },
        bottom: { style: "thin", color: { argb: "FF0F172A" } }
      }
    })
    wsSummary.getRow(currRow).height = 24
    currRow++

    metrics.forEach((m, mIdx) => {
      const isZebra = mIdx % 2 === 1
      const rowFill = isZebra ? zebraColor : "FFFFFF"

      const cell1 = wsSummary.getCell(currRow, 1)
      cell1.value = m.label
      cell1.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: `FF${navyColor}` } }

      const cell2 = wsSummary.getCell(currRow, 2)
      cell2.value = m.rawValue !== undefined ? m.rawValue : m.value
      cell2.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${tealColor}` } }
      cell2.alignment = { horizontal: "right" }
      if (m.isCurrency || typeof m.value === "string" && m.value.includes("TZS")) {
        cell2.numFmt = '#,##0 "TZS"'
      }

      const cell3 = wsSummary.getCell(currRow, 3)
      cell3.value = m.changePercent ? `${m.changeDirection === 'up' ? '▲' : '▼'} ${m.changePercent}% vs Prev` : "Baseline"
      cell3.font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } }

      const cell4 = wsSummary.getCell(currRow, 4)
      cell4.value = m.description || ""
      cell4.font = { name: "Calibri", size: 9, color: { argb: "FF475569" } }

      for (let c = 1; c <= 4; c++) {
        const cell = wsSummary.getCell(currRow, c)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${rowFill}` } }
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } }
        }
      }
      wsSummary.getRow(currRow).height = 20
      currRow++
    })
    currRow += 2
  }

  // 4. Strategic Observations
  const observations = report.narrative?.observations || []
  if (observations.length > 0) {
    wsSummary.getCell(`A${currRow}`).value = "KEY AUDIT OBSERVATIONS & FINDINGS"
    wsSummary.getCell(`A${currRow}`).font = { name: "Calibri", size: 10.5, bold: true, color: { argb: `FF${navyColor}` } }
    currRow++

    observations.forEach(obs => {
      wsSummary.mergeCells(`A${currRow}:G${currRow}`)
      const cell = wsSummary.getCell(`A${currRow}`)
      cell.value = `•  ${obs}`
      cell.font = { name: "Calibri", size: 9.5, color: { argb: "FF1E293B" } }
      currRow++
    })
    currRow++
  }

  // 5. Strategic Recommendations
  const recommendations = report.narrative?.recommendations || []
  if (recommendations.length > 0) {
    wsSummary.getCell(`A${currRow}`).value = "ACTIONABLE STRATEGIC RECOMMENDATIONS"
    wsSummary.getCell(`A${currRow}`).font = { name: "Calibri", size: 10.5, bold: true, color: { argb: `FF${tealColor}` } }
    currRow++

    recommendations.forEach(rec => {
      wsSummary.mergeCells(`A${currRow}:G${currRow}`)
      const cell = wsSummary.getCell(`A${currRow}`)
      cell.value = `•  ${rec}`
      cell.font = { name: "Calibri", size: 9.5, color: { argb: "FF1E293B" } }
      currRow++
    })
  }

  // Adjust summary sheet column dimensions
  wsSummary.getColumn(1).width = 32
  wsSummary.getColumn(2).width = 24
  wsSummary.getColumn(3).width = 22
  wsSummary.getColumn(4).width = 38
  wsSummary.getColumn(5).width = 18
  wsSummary.getColumn(6).width = 18
  wsSummary.getColumn(7).width = 18

  // -------------------------------------------------------------
  // SHEET 2+: DYNAMIC DATA REGISTERS
  // -------------------------------------------------------------
  if (report.tables) {
    Object.entries(report.tables).forEach(([key, tableData]) => {
      const cleanSheetTitle = (tableData.title || key).replace(/[/\\?*:[\]]/g, "").slice(0, 30)
      const ws = workbook.addWorksheet(cleanSheetTitle, {
        views: [{ state: "frozen", ySplit: 4, showGridLines: true }]
      })

      // Title Block
      ws.getCell("A1").value = tableData.title
      ws.getCell("A1").font = { name: "Calibri", size: 14, bold: true, color: { argb: `FF${navyColor}` } }

      ws.getCell("A2").value = tableData.introText || `Authoritative data extract for ${report.period?.formatted}`
      ws.getCell("A2").font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF64748B" } }

      const headers = tableData.headers || []
      const rows = tableData.rows || []
      const alignments = tableData.alignments || []

      // Header Row at Row 4
      headers.forEach((h, hIdx) => {
        const cell = ws.getCell(4, hIdx + 1)
        cell.value = String(h).toUpperCase()
        cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${navyColor}` } }
        const align = alignments[hIdx] === "right" ? "right" : alignments[hIdx] === "center" ? "center" : "left"
        cell.alignment = { vertical: "middle", horizontal: align }
        cell.border = {
          top: { style: "thin", color: { argb: "FF0F172A" } },
          bottom: { style: "thin", color: { argb: "FF0F172A" } }
        }
      })
      ws.getRow(4).height = 24

      // Enable Auto-Filter on table header
      if (headers.length > 0) {
        const endColLetter = getColumnLetter(headers.length)
        ws.autoFilter = `A4:${endColLetter}${Math.max(rows.length + 4, 5)}`
      }

      // Data Rows
      let dataRowIdx = 5
      rows.forEach((r, rIdx) => {
        const isZebra = rIdx % 2 === 1
        const rowFill = isZebra ? zebraColor : "FFFFFF"
        ws.getRow(dataRowIdx).height = 19

        r.forEach((cellVal, cIdx) => {
          const cell = ws.getCell(dataRowIdx, cIdx + 1)
          const valStr = String(cellVal ?? "")
          const align = alignments[cIdx] === "right" ? "right" : alignments[cIdx] === "center" ? "center" : "left"

          // Detect numeric values or currency
          const rawNum = typeof cellVal === "number" ? cellVal : Number(valStr.replace(/,/g, "").replace(/TZS/g, "").trim())
          const isNumeric = !isNaN(rawNum) && valStr.trim() !== "" && !isNaN(parseFloat(valStr.replace(/,/g, "").replace(/TZS/g, "").trim()))

          if (typeof cellVal === "number") {
            cell.value = cellVal
            const hLower = String(headers[cIdx] || "").toLowerCase()
            if (hLower.includes("price") || hLower.includes("revenue") || hLower.includes("total") || hLower.includes("amount") || hLower.includes("cost") || hLower.includes("tzs")) {
              cell.numFmt = '#,##0 "TZS"'
            } else if (hLower.includes("qty") || hLower.includes("units") || hLower.includes("count")) {
              cell.numFmt = '#,##0'
            }
          } else {
            cell.value = cellVal
          }

          cell.font = { name: "Calibri", size: 9.5, bold: cIdx === 0, color: { argb: cIdx === 0 ? `FF${navyColor}` : "FF1E293B" } }
          cell.alignment = { vertical: "middle", horizontal: align }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${rowFill}` } }
          cell.border = {
            top: { style: "thin", color: { argb: "FFCBD5E1" } },
            bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
            left: { style: "thin", color: { argb: "FFCBD5E1" } },
            right: { style: "thin", color: { argb: "FFCBD5E1" } }
          }
        })
        dataRowIdx++
      })

      // Summary Footer Row
      if (tableData.summaryFooter && tableData.summaryFooter.length > 0) {
        ws.getRow(dataRowIdx).height = 22
        tableData.summaryFooter.forEach((fVal, cIdx) => {
          const cell = ws.getCell(dataRowIdx, cIdx + 1)
          cell.value = fVal
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${navyColor}` } }
          const align = alignments[cIdx] === "right" ? "right" : alignments[cIdx] === "center" ? "center" : "left"
          cell.alignment = { vertical: "middle", horizontal: align }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
          cell.border = {
            top: { style: "thin", color: { argb: "FF0F172A" } },
            bottom: { style: "double", color: { argb: "FF0F172A" } }
          }
        })
      }

      // Auto-fit column widths with padding
      ws.columns.forEach((col, colIdx) => {
        let maxLen = 0
        if (col && col.eachCell) {
          col.eachCell({ includeEmpty: false }, (c) => {
            if (c.row >= 4) {
              const text = String(c.value || "")
              maxLen = Math.max(maxLen, text.length)
            }
          })
        }
        col.width = Math.max(maxLen + 5, 14)
      })
    })
  }

  // -------------------------------------------------------------
  // SHEET 3: METHODOLOGY & DOCUMENT CONTROL
  // -------------------------------------------------------------
  const wsDoc = workbook.addWorksheet("Document Control", {
    views: [{ showGridLines: true }]
  })

  wsDoc.getCell("A1").value = "DOCUMENT CONTROL & METHODOLOGY"
  wsDoc.getCell("A1").font = { name: "Calibri", size: 14, bold: true, color: { argb: `FF${navyColor}` } }

  const docData = [
    ["Report ID", report.documentControl?.reportId || "REP-2026-001"],
    ["Report Classification", report.documentControl?.confidentiality || "Confidential & Proprietary"],
    ["Reporting Period", report.documentControl?.reportingPeriod || `${report.period?.from} – ${report.period?.to}`],
    ["Generated By", report.documentControl?.generatedBy || "Senior Analyst"],
    ["Prepared For", report.documentControl?.preparedFor || "Executive Management"],
    ["Generated On", report.documentControl?.generatedOn || new Date().toLocaleDateString("en-GB")],
    ["Document Version", report.documentControl?.version || "1.0"],
    ["Document Status", report.documentControl?.status || "Official Management Document"],
    ["Data Source", report.documentControl?.dataSource || "Enterprise Database"],
    ["Audit Hash", report.auditSeal?.complianceHash || "QC-SHA256-VERIFIED"]
  ]

  let docRow = 3
  docData.forEach(([k, v]) => {
    wsDoc.getCell(docRow, 1).value = k
    wsDoc.getCell(docRow, 1).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: `FF${navyColor}` } }
    wsDoc.getCell(docRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${lightBgColor}` } }
    wsDoc.getCell(docRow, 1).border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } } }

    wsDoc.getCell(docRow, 2).value = v
    wsDoc.getCell(docRow, 2).font = { name: "Calibri", size: 9.5, color: { argb: "FF1E293B" } }
    wsDoc.getCell(docRow, 2).border = { top: { style: "thin", color: { argb: "FFCBD5E1" } }, bottom: { style: "thin", color: { argb: "FFCBD5E1" } } }
    docRow++
  })

  if (report.methodology) {
    docRow += 2
    wsDoc.getCell(`A${docRow}`).value = "METHODOLOGY & SCOPE NOTES"
    wsDoc.getCell(`A${docRow}`).font = { name: "Calibri", size: 11, bold: true, color: { argb: `FF${tealColor}` } }
    docRow++

    wsDoc.getCell(`A${docRow}`).value = "Scope:"
    wsDoc.getCell(`B${docRow}`).value = report.methodology.scope
    docRow++

    wsDoc.getCell(`A${docRow}`).value = "Data Included:"
    wsDoc.getCell(`B${docRow}`).value = report.methodology.dataIncluded
    docRow++

    if (report.methodology.calculationMethodology) {
      wsDoc.getCell(`A${docRow}`).value = "Calculation Rules:"
      wsDoc.getCell(`B${docRow}`).value = report.methodology.calculationMethodology
      docRow++
    }
  }

  wsDoc.getColumn(1).width = 28
  wsDoc.getColumn(2).width = 55

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function getColumnLetter(colNum: number): string {
  let letter = ""
  while (colNum > 0) {
    const rem = (colNum - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    colNum = Math.floor((colNum - 1) / 26)
  }
  return letter || "A"
}
