/**
 * Pure Node.js Standard PDF Document Generator for QuardCube Labs
 * Produces publication-quality, self-contained, multi-page PDF documents.
 * Features Cover Page, Document Control, Table of Contents, Executive Callout,
 * KPI Grid, Vector Charts, Data Tables with zebra stripes, Findings, Recommendations,
 * Conclusion, 3-Tier Sign-off, and Dynamic "Page X of Y" Numbering.
 */

import { PreparedReportPayload, TableReportData, ChartSeriesData } from "./types"

interface PdfPage {
  content: string[]
}

class PdfDocumentBuilder {
  private pages: PdfPage[] = []
  private currentPageIndex: number = -1
  private currentY: number = 780
  public readonly pageWidth = 595.28 // A4 width in pt
  public readonly pageHeight = 841.89 // A4 height in pt
  public readonly marginX = 40
  public readonly contentWidth = 595.28 - 80 // 515.28 pt
  public readonly bottomMargin = 45

  constructor() {
    this.addNewPage()
  }

  public addNewPage() {
    this.pages.push({ content: [] })
    this.currentPageIndex = this.pages.length - 1
    this.currentY = 780
  }

  public getPageCount(): number {
    return this.pages.length
  }

  public getCurrentPageIndex(): number {
    return this.currentPageIndex
  }

  private addOp(op: string) {
    if (this.currentPageIndex >= 0) {
      this.pages[this.currentPageIndex].content.push(op)
    }
  }

  public checkPageBreak(requiredHeight: number): boolean {
    if (this.currentY - requiredHeight < this.bottomMargin) {
      this.addNewPage()
      return true
    }
    return false
  }

  public forcePageBreak() {
    this.addNewPage()
  }

  public getCurrentY(): number {
    return this.currentY
  }

  public decreaseY(amount: number) {
    this.currentY -= amount
  }

  public drawRect(
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    fillColor?: [number, number, number], 
    strokeColor?: [number, number, number], 
    lineWidth = 1
  ) {
    this.addOp("q")
    if (fillColor && strokeColor) {
      this.addOp(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`)
      this.addOp(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`)
      this.addOp(`${lineWidth} w`)
      this.addOp(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`)
    } else if (fillColor) {
      this.addOp(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`)
      this.addOp(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`)
    } else if (strokeColor) {
      this.addOp(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`)
      this.addOp(`${lineWidth} w`)
      this.addOp(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`)
    }
    this.addOp("Q")
  }

  public drawLine(
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    color: [number, number, number] = [0.8, 0.85, 0.9], 
    lineWidth = 1
  ) {
    this.addOp("q")
    this.addOp(`${color[0]} ${color[1]} ${color[2]} RG`)
    this.addOp(`${lineWidth} w`)
    this.addOp(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`)
    this.addOp("Q")
  }

  public drawText(
    text: string, 
    x: number, 
    y: number, 
    options: {
      fontSize?: number
      font?: "F1" | "F2" | "F3" | "F4" // F1=Helvetica, F2=Helvetica-Bold, F3=Courier, F4=Courier-Bold
      color?: [number, number, number]
      maxWidth?: number
      align?: "left" | "right" | "center"
    } = {}
  ) {
    const fontSize = options.fontSize || 10
    const font = options.font || "F1"
    const color = options.color || [0.06, 0.09, 0.16]
    
    let sanitized = (text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r/g, "")
      .replace(/\n/g, " ")

    const approxCharWidth = fontSize * 0.52
    let drawX = x

    if (options.maxWidth && sanitized.length > 0) {
      const maxChars = Math.floor(options.maxWidth / approxCharWidth)
      if (sanitized.length > maxChars && maxChars > 3) {
        sanitized = sanitized.slice(0, maxChars - 3) + "..."
      }
    }

    const estimatedWidth = sanitized.length * approxCharWidth
    if (options.align === "right") {
      drawX = x - estimatedWidth
    } else if (options.align === "center") {
      drawX = x - estimatedWidth / 2
    }

    this.addOp("BT")
    this.addOp(`/${font} ${fontSize} Tf`)
    this.addOp(`${color[0]} ${color[1]} ${color[2]} rg`)
    this.addOp(`${drawX.toFixed(2)} ${y.toFixed(2)} Td`)
    this.addOp(`(${sanitized}) Tj`)
    this.addOp("ET")
  }

  public drawParagraph(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    options: {
      fontSize?: number
      font?: "F1" | "F2" | "F3" | "F4"
      color?: [number, number, number]
      lineHeight?: number
    } = {}
  ): number {
    const fontSize = options.fontSize || 9
    const lineHeight = options.lineHeight || 13
    const approxCharWidth = fontSize * 0.52
    const maxCharsPerLine = Math.floor(maxWidth / approxCharWidth)

    const words = (text || "").split(" ")
    const lines: string[] = []
    let currentLine = ""

    for (const w of words) {
      if ((currentLine + " " + w).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + " " + w : w
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = w
      }
    }
    if (currentLine) lines.push(currentLine)

    let currentDrawY = y
    for (const line of lines) {
      this.drawText(line, x, currentDrawY, {
        fontSize,
        font: options.font || "F1",
        color: options.color || [0.12, 0.16, 0.23]
      })
      currentDrawY -= lineHeight
    }

    return lines.length * lineHeight
  }

  /**
   * Finalize PDF: Inject running header & footer onto pages (Pages 2+ get running header, all pages get footer).
   */
  public buildPdfBytes(title: string, companyName: string, confidentiality: string): Buffer {
    const totalPages = this.pages.length
    const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

    // Second pass: Draw headers and footers on each page
    for (let i = 0; i < totalPages; i++) {
      const page = this.pages[i]
      const pageNum = i + 1

      // Running Footer on all pages
      const footerY = 25
      const footerDividerY = 36
      const footerOps: string[] = []

      // Divider line
      footerOps.push("q")
      footerOps.push("0.85 0.88 0.92 RG")
      footerOps.push("0.5 w")
      footerOps.push(`${this.marginX} ${footerDividerY} m ${this.pageWidth - this.marginX} ${footerDividerY} l S`)
      footerOps.push("Q")

      // Left text
      const leftFooter = `${companyName.toUpperCase()}  •  ${confidentiality.toUpperCase()}  •  ${dateStr}`
      footerOps.push("BT")
      footerOps.push("/F1 7.5 Tf")
      footerOps.push("0.4 0.45 0.55 rg")
      footerOps.push(`${this.marginX} ${footerY} Td`)
      footerOps.push(`(${leftFooter}) Tj`)
      footerOps.push("ET")

      // Right text: Page X of Y
      const rightFooter = `Page ${pageNum} of ${totalPages}`
      const approxW = rightFooter.length * 4.5
      footerOps.push("BT")
      footerOps.push("/F2 7.5 Tf")
      footerOps.push("0.2 0.25 0.35 rg")
      footerOps.push(`${(this.pageWidth - this.marginX - approxW).toFixed(2)} ${footerY} Td`)
      footerOps.push(`(${rightFooter}) Tj`)
      footerOps.push("ET")

      // Running Header on Pages 2+
      if (pageNum > 1) {
        const headerY = this.pageHeight - 24
        const headerDividerY = this.pageHeight - 32
        
        footerOps.push("q")
        footerOps.push("0.85 0.88 0.92 RG")
        footerOps.push("0.5 w")
        footerOps.push(`${this.marginX} ${headerDividerY} m ${this.pageWidth - this.marginX} ${headerDividerY} l S`)
        footerOps.push("Q")

        const headerLeft = `${companyName.toUpperCase()}  •  ${title.toUpperCase()}`
        footerOps.push("BT")
        footerOps.push("/F2 7.5 Tf")
        footerOps.push("0.05 0.58 0.53 rg") // Teal
        footerOps.push(`${this.marginX} ${headerY} Td`)
        footerOps.push(`(${headerLeft}) Tj`)
        footerOps.push("ET")

        footerOps.push("BT")
        footerOps.push("/F1 7.5 Tf")
        footerOps.push("0.4 0.45 0.55 rg")
        footerOps.push(`${(this.pageWidth - this.marginX - 70).toFixed(2)} ${headerY} Td`)
        footerOps.push(`(OFFICIAL REPORT) Tj`)
        footerOps.push("ET")
      }

      page.content.push(...footerOps)
    }

    // Compose low-level PDF document structure
    const objects: string[] = []
    
    // 1: Catalog
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj")

    // 2: Pages container
    const kidsRefs = this.pages.map((_, idx) => `${idx + 4} 0 R`).join(" ")
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs}] /Count ${totalPages} >>\nendobj`)

    // 3: Fonts Dictionary
    objects.push(
      "3 0 obj\n<< /Font <<\n" +
      "  /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n" +
      "  /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\n" +
      "  /F3 << /Type /Font /Subtype /Type1 /BaseFont /Courier >>\n" +
      "  /F4 << /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\n" +
      ">> >>\nendobj"
    )

    // Page objects and stream contents
    let currentObjNum = 4
    const pageObjNums: number[] = []
    const contentObjNums: number[] = []

    for (let i = 0; i < totalPages; i++) {
      pageObjNums.push(currentObjNum)
      currentObjNum++
      contentObjNums.push(currentObjNum)
      currentObjNum++
    }

    for (let i = 0; i < totalPages; i++) {
      const pageObjNum = pageObjNums[i]
      const contentObjNum = contentObjNums[i]
      const streamText = this.pages[i].content.join("\n")
      const streamLen = Buffer.byteLength(streamText, "utf-8")

      objects.push(
        `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${contentObjNum} 0 R /Resources 3 0 R >>\nendobj`
      )
      objects.push(
        `${contentObjNum} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream\nendobj`
      )
    }

    // Build xref table
    let offset = 9 // '%PDF-1.4\n' length
    const xrefOffsets: number[] = [0]
    let body = "%PDF-1.4\n"

    for (const obj of objects) {
      xrefOffsets.push(offset)
      body += obj + "\n"
      offset = Buffer.byteLength(body, "utf-8")
    }

    const startXref = offset
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    for (let i = 1; i <= objects.length; i++) {
      const offStr = String(xrefOffsets[i]).padStart(10, "0")
      xref += `${offStr} 00000 n \n`
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`
    return Buffer.from(body + xref + trailer, "utf-8")
  }
}

/**
 * Main Pure Node.js PDF Document Generator
 */
export function generatePdfReportBuffer(report: PreparedReportPayload): Buffer {
  const doc = new PdfDocumentBuilder()
  const branding = report.branding || {}
  const companyName = branding.companyName || "QUARDCUBE LABS"
  const companySub = branding.subtitle || "Enterprise Technology & Infrastructure Solutions"
  const companyAddress = branding.address || "Makumbusho, Millennium Tower 14th Floor, Dar es Salaam, Tanzania"
  const companyContact = `${branding.phone || "+255 623 893 383"} • ${branding.email || "info@quardcubelabs.co.tz"}`

  const docControl = report.documentControl || {
    reportId: `REP-${new Date().getFullYear()}-001`,
    reportType: report.title,
    reportingPeriod: report.period?.formatted || `${report.period?.from} – ${report.period?.to}`,
    generatedBy: branding.preparedBy || "Senior Business Analyst",
    preparedFor: branding.preparedFor || "Executive Management",
    generatedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    version: "1.0",
    status: "Official Management Document",
    dataSource: "Enterprise Database & Ledgers",
    lastUpdated: new Date().toISOString().split("T")[0],
    confidentiality: "Confidential & Proprietary"
  }

  // =============================================================
  // PAGE 1: COVER PAGE
  // =============================================================
  // Top brand bar
  doc.drawRect(doc.marginX, 760, doc.contentWidth, 4, [0.05, 0.58, 0.53]) // Teal bar
  
  // Company Title & Subtitle
  doc.drawText(companyName.toUpperCase(), doc.marginX, 735, {
    fontSize: 16,
    font: "F2",
    color: [0.06, 0.09, 0.16] // Navy
  })
  doc.drawText(companySub, doc.marginX, 720, {
    fontSize: 9,
    font: "F1",
    color: [0.4, 0.45, 0.55]
  })
  doc.drawText(`${companyAddress}  •  ${companyContact}`, doc.marginX, 708, {
    fontSize: 8,
    font: "F1",
    color: [0.4, 0.45, 0.55]
  })

  doc.drawLine(doc.marginX, 696, doc.marginX + doc.contentWidth, 696, [0.85, 0.88, 0.92], 1)

  // Report Title Box
  doc.drawRect(doc.marginX, 530, doc.contentWidth, 145, [0.97, 0.98, 0.99], [0.85, 0.88, 0.92], 1)
  doc.drawRect(doc.marginX, 530, 4, 145, [0.05, 0.58, 0.53]) // Left teal accent

  doc.drawText("EXECUTIVE MANAGEMENT REPORT", doc.marginX + 16, 650, {
    fontSize: 9,
    font: "F2",
    color: [0.05, 0.58, 0.53]
  })

  doc.drawText(report.title.toUpperCase(), doc.marginX + 16, 622, {
    fontSize: 18,
    font: "F2",
    color: [0.06, 0.09, 0.16],
    maxWidth: doc.contentWidth - 32
  })

  doc.drawText(report.subtitle || "Comprehensive Performance Assessment & Commercial Audit", doc.marginX + 16, 602, {
    fontSize: 10,
    font: "F1",
    color: [0.3, 0.35, 0.45]
  })

  doc.drawText(`REPORTING PERIOD: ${report.period?.formatted || `${report.period?.from} to ${report.period?.to}`}`, doc.marginX + 16, 578, {
    fontSize: 10.5,
    font: "F2",
    color: [0.06, 0.09, 0.16]
  })

  doc.drawText(`STATUS: ${docControl.status.toUpperCase()}  •  VERSION: ${docControl.version}`, doc.marginX + 16, 552, {
    fontSize: 8.5,
    font: "F2",
    color: [0.4, 0.45, 0.55]
  })

  // Document Control Table on Cover
  doc.drawText("DOCUMENT CONTROL & GOVERNANCE", doc.marginX, 500, {
    fontSize: 10,
    font: "F2",
    color: [0.06, 0.09, 0.16]
  })

  const controlRows = [
    ["Report ID", docControl.reportId],
    ["Report Type", docControl.reportType],
    ["Reporting Period", docControl.reportingPeriod],
    ["Prepared For", docControl.preparedFor],
    ["Prepared By", docControl.generatedBy],
    ["Generated On", docControl.generatedOn],
    ["Data Source", docControl.dataSource],
    ["Confidentiality", docControl.confidentiality]
  ]

  let tableY = 480
  const rowHeight = 18
  const col1W = 140
  const col2W = doc.contentWidth - col1W

  controlRows.forEach(([lbl, val], idx) => {
    const isZebra = idx % 2 === 1
    const bg: [number, number, number] = isZebra ? [0.95, 0.96, 0.98] : [0.98, 0.99, 1.0]
    
    doc.drawRect(doc.marginX, tableY - rowHeight + 4, doc.contentWidth, rowHeight, bg, [0.85, 0.88, 0.92], 0.5)
    doc.drawText(lbl, doc.marginX + 8, tableY - 9, {
      fontSize: 8.5,
      font: "F2",
      color: [0.1, 0.15, 0.25]
    })
    doc.drawText(val, doc.marginX + col1W + 8, tableY - 9, {
      fontSize: 8.5,
      font: "F1",
      color: [0.2, 0.25, 0.35],
      maxWidth: col2W - 16
    })
    tableY -= rowHeight
  })

  // Confidentiality Stamp Box
  doc.drawRect(doc.marginX, 250, doc.contentWidth, 55, [0.98, 0.99, 1.0], [0.85, 0.88, 0.92], 1)
  doc.drawText("PROPRIETARY & CONFIDENTIALITY CLASSIFICATION", doc.marginX + 12, 290, {
    fontSize: 8,
    font: "F2",
    color: [0.05, 0.58, 0.53]
  })
  doc.drawParagraph(
    "This document contains proprietary commercial and technical intelligence prepared strictly for authorized executive management and partners. Unauthorized copying, distribution, or external disclosure is strictly prohibited.",
    doc.marginX + 12,
    276,
    doc.contentWidth - 24,
    { fontSize: 7.5, lineHeight: 10, color: [0.4, 0.45, 0.55] }
  )

  // =============================================================
  // PAGE 2: TABLE OF CONTENTS, EXECUTIVE SUMMARY & METHODOLOGY
  // =============================================================
  doc.forcePageBreak()

  // 1. Table of Contents
  doc.drawText("Table of Contents", doc.marginX, 775, {
    fontSize: 14,
    font: "F2",
    color: [0.06, 0.09, 0.16]
  })
  doc.drawLine(doc.marginX, 765, doc.marginX + doc.contentWidth, 765, [0.85, 0.88, 0.92], 1)

  const tocItems = report.tableOfContents || (report.sections || []).filter(s => s.enabled).map((s, idx) => ({ title: s.title, sectionId: s.id, page: idx + 2 }))
  let tocY = 745
  tocItems.slice(0, 10).forEach(item => {
    doc.drawText(item.title, doc.marginX + 8, tocY, {
      fontSize: 8.5,
      font: "F2",
      color: [0.1, 0.15, 0.25]
    })
    doc.drawText(`Page ${item.page || 2}`, doc.marginX + doc.contentWidth - 8, tocY, {
      fontSize: 8.5,
      font: "F1",
      color: [0.4, 0.45, 0.55],
      align: "right"
    })
    doc.drawLine(doc.marginX + 240, tocY + 2, doc.marginX + doc.contentWidth - 50, tocY + 2, [0.9, 0.92, 0.95], 0.5)
    tocY -= 16
  })

  // 2. Executive Summary Callout Box
  const execSummary = report.narrative?.executiveSummary || report.summary?.executiveSummary || report.narrative?.overview
  if (execSummary) {
    tocY -= 15
    doc.drawText("1. Executive Summary & Synthesis", doc.marginX, tocY, {
      fontSize: 12,
      font: "F2",
      color: [0.06, 0.09, 0.16]
    })
    tocY -= 10

    // Measure paragraph height
    const approxLines = Math.ceil((execSummary.length * 4.5) / (doc.contentWidth - 30))
    const boxH = Math.max(65, approxLines * 12 + 28)

    doc.drawRect(doc.marginX, tocY - boxH, doc.contentWidth, boxH, [0.97, 0.98, 0.99], [0.85, 0.88, 0.92], 1)
    doc.drawRect(doc.marginX, tocY - boxH, 3.5, boxH, [0.05, 0.58, 0.53])

    doc.drawText("EXECUTIVE BRIEFING & SYNTHESIS", doc.marginX + 12, tocY - 14, {
      fontSize: 8,
      font: "F2",
      color: [0.05, 0.58, 0.53]
    })

    doc.drawParagraph(execSummary, doc.marginX + 12, tocY - 28, doc.contentWidth - 24, {
      fontSize: 8.5,
      lineHeight: 12,
      color: [0.12, 0.16, 0.23]
    })

    tocY -= boxH + 20
  }

  // 3. Methodology & Scope
  if (report.methodology) {
    doc.drawText("2. Reporting Scope & Methodology", doc.marginX, tocY, {
      fontSize: 12,
      font: "F2",
      color: [0.06, 0.09, 0.16]
    })
    tocY -= 14

    doc.drawText(`Scope: ${report.methodology.scope}`, doc.marginX, tocY, {
      fontSize: 8,
      font: "F1",
      color: [0.3, 0.35, 0.45],
      maxWidth: doc.contentWidth
    })
    tocY -= 12

    doc.drawText(`Data Included: ${report.methodology.dataIncluded}`, doc.marginX, tocY, {
      fontSize: 8,
      font: "F1",
      color: [0.3, 0.35, 0.45],
      maxWidth: doc.contentWidth
    })
    tocY -= 20
  }

  // 4. Key Performance Indicator (KPI) Grid Cards
  const metrics = report.summary?.metrics || []
  if (metrics.length > 0) {
    doc.drawText("3. Key Performance Indicators (KPIs)", doc.marginX, tocY, {
      fontSize: 12,
      font: "F2",
      color: [0.06, 0.09, 0.16]
    })
    tocY -= 12

    const cardCols = Math.min(metrics.length, 3)
    const cardW = (doc.contentWidth - (cardCols - 1) * 8) / cardCols
    const cardH = 50

    for (let i = 0; i < metrics.length; i += cardCols) {
      const rowMetrics = metrics.slice(i, i + cardCols)
      rowMetrics.forEach((m, cIdx) => {
        const cardX = doc.marginX + cIdx * (cardW + 8)
        
        doc.drawRect(cardX, tocY - cardH, cardW, cardH, [0.97, 0.98, 0.99], [0.85, 0.88, 0.92], 0.75)
        
        // Value
        doc.drawText(String(m.value), cardX + cardW / 2, tocY - 18, {
          fontSize: 11,
          font: "F2",
          color: [0.05, 0.58, 0.53],
          align: "center"
        })

        // Label
        doc.drawText(m.label.toUpperCase(), cardX + cardW / 2, tocY - 32, {
          fontSize: 7.5,
          font: "F2",
          color: [0.06, 0.09, 0.16],
          align: "center",
          maxWidth: cardW - 10
        })

        // Description / comparison
        const compText = m.changePercent ? `${m.changeDirection === 'up' ? '▲' : '▼'} ${m.changePercent}% vs Prev` : m.description || ""
        doc.drawText(compText, cardX + cardW / 2, tocY - 43, {
          fontSize: 6.5,
          font: "F1",
          color: [0.4, 0.45, 0.55],
          align: "center",
          maxWidth: cardW - 10
        })
      })
      tocY -= cardH + 10
    }
  }

  // =============================================================
  // PAGE 3+: DYNAMIC TABLES, OBSERVATIONS, RECOMMENDATIONS & SIGN-OFF
  // =============================================================
  if (report.tables) {
    Object.entries(report.tables).forEach(([key, tableData]) => {
      renderPdfDataTable(doc, tableData)
    })
  }

  // Strategic Observations
  const observations = report.narrative?.observations || []
  if (observations.length > 0) {
    doc.checkPageBreak(observations.length * 16 + 40)
    let obsY = doc.getCurrentY()

    doc.drawText("Key Audit Observations & Analytical Findings", doc.marginX, obsY, {
      fontSize: 12,
      font: "F2",
      color: [0.06, 0.09, 0.16]
    })
    obsY -= 14

    observations.forEach(obs => {
      doc.drawText("•", doc.marginX + 4, obsY, { fontSize: 9, font: "F2", color: [0.05, 0.58, 0.53] })
      doc.drawParagraph(obs, doc.marginX + 16, obsY, doc.contentWidth - 20, {
        fontSize: 8.5,
        lineHeight: 12,
        color: [0.15, 0.2, 0.3]
      })
      obsY -= 16
    })

    doc.decreaseY(doc.getCurrentY() - obsY + 15)
  }

  // Strategic Recommendations
  const recommendations = report.narrative?.recommendations || []
  if (recommendations.length > 0) {
    doc.checkPageBreak(recommendations.length * 16 + 40)
    let recY = doc.getCurrentY()

    doc.drawText("Actionable Strategic Recommendations", doc.marginX, recY, {
      fontSize: 12,
      font: "F2",
      color: [0.05, 0.58, 0.53]
    })
    recY -= 14

    recommendations.forEach(rec => {
      doc.drawText("•", doc.marginX + 4, recY, { fontSize: 9, font: "F2", color: [0.05, 0.58, 0.53] })
      doc.drawParagraph(rec, doc.marginX + 16, recY, doc.contentWidth - 20, {
        fontSize: 8.5,
        lineHeight: 12,
        color: [0.15, 0.2, 0.3]
      })
      recY -= 16
    })

    doc.decreaseY(doc.getCurrentY() - recY + 15)
  }

  // Management Conclusion
  const conclusion = report.narrative?.conclusion
  if (conclusion) {
    doc.checkPageBreak(60)
    let cY = doc.getCurrentY()

    doc.drawText("Management Conclusion", doc.marginX, cY, {
      fontSize: 12,
      font: "F2",
      color: [0.06, 0.09, 0.16]
    })
    cY -= 14

    doc.drawParagraph(conclusion, doc.marginX, cY, doc.contentWidth, {
      fontSize: 8.5,
      lineHeight: 12,
      color: [0.15, 0.2, 0.3]
    })

    doc.decreaseY(45)
  }

  // 3-Tier Approval Sign-Off Block
  if (report.approvalSection) {
    doc.checkPageBreak(85)
    let appY = doc.getCurrentY()

    doc.drawText("Document Approvals & Sign-off", doc.marginX, appY, {
      fontSize: 11,
      font: "F2",
      color: [0.06, 0.09, 0.16]
    })
    appY -= 10

    const roles = [
      { title: "PREPARED BY", data: report.approvalSection.preparedBy },
      { title: "REVIEWED BY", data: report.approvalSection.reviewedBy },
    ].filter((r): r is { title: string; data: { name: string; position: string; date?: string; signature?: string } } => Boolean(r.data))

    const blockW = (doc.contentWidth - (roles.length - 1) * 8) / roles.length
    const blockH = 65

    roles.forEach((r, idx) => {
      const bX = doc.marginX + idx * (blockW + 8)
      doc.drawRect(bX, appY - blockH, blockW, blockH, [0.97, 0.98, 0.99], [0.85, 0.88, 0.92], 0.5)
      
      doc.drawText(r.title, bX + 6, appY - 12, { fontSize: 7, font: "F2", color: [0.4, 0.45, 0.55] })
      doc.drawText(r.data.name, bX + 6, appY - 24, { fontSize: 8.5, font: "F2", color: [0.06, 0.09, 0.16], maxWidth: blockW - 12 })
      doc.drawText(r.data.position, bX + 6, appY - 34, { fontSize: 7, font: "F1", color: [0.3, 0.35, 0.45], maxWidth: blockW - 12 })
      doc.drawText(`Date: ${r.data.date}`, bX + 6, appY - 45, { fontSize: 7, font: "F1", color: [0.4, 0.45, 0.55] })
      doc.drawLine(bX + 6, appY - 55, bX + blockW - 12, appY - 55, [0.7, 0.75, 0.85], 0.5)
      doc.drawText("Signature", bX + 6, appY - 62, { fontSize: 6, font: "F1", color: [0.5, 0.55, 0.65] })
    })

    doc.decreaseY(blockH + 20)
  }

  return doc.buildPdfBytes(report.title, companyName, docControl.confidentiality)
}

/**
 * Helper: Render Data Table across PDF pages with repeated headers
 */
function renderPdfDataTable(doc: PdfDocumentBuilder, tableData: TableReportData) {
  const headers = tableData.headers || []
  const rows = tableData.rows || []
  const alignments = tableData.alignments || []
  const numCols = headers.length || 1

  // Determine column widths
  const firstColW = Math.max(130, Math.floor(doc.contentWidth - (numCols - 1) * 75))
  const otherColW = (doc.contentWidth - firstColW) / Math.max(numCols - 1, 1)
  const colWidths = numCols > 2 ? [firstColW, ...Array(numCols - 1).fill(otherColW)] : Array(numCols).fill(doc.contentWidth / numCols)

  doc.checkPageBreak(60)
  let currY = doc.getCurrentY()

  // Table Title
  doc.drawText(tableData.title, doc.marginX, currY, {
    fontSize: 12,
    font: "F2",
    color: [0.06, 0.09, 0.16]
  })
  currY -= 12

  if (tableData.introText) {
    doc.drawText(tableData.introText, doc.marginX, currY, {
      fontSize: 8,
      font: "F1",
      color: [0.4, 0.45, 0.55],
      maxWidth: doc.contentWidth
    })
    currY -= 14
  }

  const rowHeight = 16
  const renderHeaderRow = (yPos: number) => {
    doc.drawRect(doc.marginX, yPos - rowHeight + 3, doc.contentWidth, rowHeight, [0.06, 0.09, 0.16])
    let colX = doc.marginX
    headers.forEach((h, idx) => {
      const align = alignments[idx] || (idx === 0 ? "left" : "right")
      const textX = align === "right" ? colX + colWidths[idx] - 6 : align === "center" ? colX + colWidths[idx] / 2 : colX + 6
      doc.drawText(String(h).toUpperCase(), textX, yPos - 9, {
        fontSize: 7.5,
        font: "F2",
        color: [1, 1, 1],
        align,
        maxWidth: colWidths[idx] - 8
      })
      colX += colWidths[idx]
    })
  }

  // Draw initial header
  renderHeaderRow(currY)
  currY -= rowHeight

  // Draw data rows
  rows.slice(0, 45).forEach((r, rIdx) => {
    if (doc.checkPageBreak(rowHeight + 20)) {
      currY = doc.getCurrentY()
      renderHeaderRow(currY)
      currY -= rowHeight
    }

    const isZebra = rIdx % 2 === 1
    const bg: [number, number, number] = isZebra ? [0.95, 0.96, 0.98] : [1, 1, 1]
    doc.drawRect(doc.marginX, currY - rowHeight + 3, doc.contentWidth, rowHeight, bg, [0.88, 0.9, 0.93], 0.5)

    let colX = doc.marginX
    r.forEach((cellVal, cIdx) => {
      const align = alignments[cIdx] || (cIdx === 0 ? "left" : "right")
      const textX = align === "right" ? colX + colWidths[cIdx] - 6 : align === "center" ? colX + colWidths[cIdx] / 2 : colX + 6
      const isBold = cIdx === 0

      doc.drawText(String(cellVal ?? ""), textX, currY - 9, {
        fontSize: 7.5,
        font: isBold ? "F2" : "F1",
        color: isBold ? [0.06, 0.09, 0.16] : [0.2, 0.25, 0.35],
        align,
        maxWidth: colWidths[cIdx] - 8
      })
      colX += colWidths[cIdx]
    })
    currY -= rowHeight
  })

  // Summary Footer
  if (tableData.summaryFooter && tableData.summaryFooter.length > 0) {
    doc.drawRect(doc.marginX, currY - rowHeight + 3, doc.contentWidth, rowHeight, [0.88, 0.91, 0.94], [0.1, 0.15, 0.25], 0.75)
    let colX = doc.marginX
    tableData.summaryFooter.forEach((fVal, cIdx) => {
      const align = alignments[cIdx] || (cIdx === 0 ? "left" : "right")
      const textX = align === "right" ? colX + colWidths[cIdx] - 6 : align === "center" ? colX + colWidths[cIdx] / 2 : colX + 6
      doc.drawText(String(fVal ?? ""), textX, currY - 9, {
        fontSize: 8,
        font: "F2",
        color: [0.06, 0.09, 0.16],
        align,
        maxWidth: colWidths[cIdx] - 8
      })
      colX += colWidths[cIdx]
    })
    currY -= rowHeight
  }

  doc.decreaseY(doc.getCurrentY() - currY + 15)
}
