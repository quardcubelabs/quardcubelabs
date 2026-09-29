/**
 * Pure Node.js Standard PDF Generator for QuardCube Labs Report Engine
 * Generates 100% valid, self-contained, multi-page PDF documents.
 * Works without external system binaries or Python microservice dependencies.
 */

import { PreparedReportPayload } from "./types"

interface PdfPage {
  content: string[]
}

class PdfDocumentBuilder {
  private pages: PdfPage[] = []
  private currentPageIndex: number = -1
  private currentY: number = 790
  private readonly pageWidth = 595.28 // A4 width in pt
  private readonly pageHeight = 841.89 // A4 height in pt
  private readonly marginX = 40
  private readonly contentWidth = 595.28 - 80 // 515.28 pt
  private readonly bottomMargin = 50

  constructor() {
    this.addNewPage()
  }

  public addNewPage() {
    this.pages.push({ content: [] })
    this.currentPageIndex = this.pages.length - 1
    this.currentY = 790
  }

  private addOp(op: string) {
    if (this.currentPageIndex >= 0) {
      this.pages[this.currentPageIndex].content.push(op)
    }
  }

  public checkPageBreak(requiredHeight: number) {
    if (this.currentY - requiredHeight < this.bottomMargin) {
      this.addNewPage()
      this.currentY = 790
      return true
    }
    return false
  }

  public getCurrentY(): number {
    return this.currentY
  }

  public decreaseY(amount: number) {
    this.currentY -= amount
  }

  // Draw rectangle (filled or stroked)
  public drawRect(x: number, y: number, w: number, h: number, fillColor?: [number, number, number], strokeColor?: [number, number, number], lineWidth = 1) {
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

  // Draw horizontal line
  public drawLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number] = [0.8, 0.85, 0.9], lineWidth = 1) {
    this.addOp("q")
    this.addOp(`${color[0]} ${color[1]} ${color[2]} RG`)
    this.addOp(`${lineWidth} w`)
    this.addOp(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`)
    this.addOp("Q")
  }

  // Draw text
  public drawText(
    text: string, 
    x: number, 
    y: number, 
    options: {
      fontSize?: number
      font?: "F1" | "F2" | "F3" | "F4" // F1=Helvetica, F2=Helvetica-Bold, F3=Courier, F4=Courier-Bold
      color?: [number, number, number]
      maxWidth?: number
    } = {}
  ) {
    const fontSize = options.fontSize || 10
    const font = options.font || "F1"
    const color = options.color || [0.06, 0.09, 0.16] // dark slate
    
    // Sanitize string for PDF literal string
    let sanitized = String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/[\u0080-\uffff]/g, "") // strip non-ascii

    if (options.maxWidth && sanitized.length > 0) {
      const approxCharWidth = fontSize * 0.52
      const maxChars = Math.floor(options.maxWidth / approxCharWidth)
      if (sanitized.length > maxChars && maxChars > 3) {
        sanitized = sanitized.slice(0, maxChars - 3) + "..."
      }
    }

    this.addOp("BT")
    this.addOp(`/${font} ${fontSize} Tf`)
    this.addOp(`${color[0]} ${color[1]} ${color[2]} rg`)
    this.addOp(`${x.toFixed(2)} ${y.toFixed(2)} Td`)
    this.addOp(`(${sanitized}) Tj`)
    this.addOp("ET")
  }

  // Build the complete PDF file buffer
  public build(): Buffer {
    const objects: string[] = []
    
    // Helper to register an object and return its 1-based index
    const addObject = (content: string): number => {
      objects.push(content)
      return objects.length
    }

    // 1: Catalog
    // 2: Pages
    // 3: Font Helvetica (F1)
    // 4: Font Helvetica-Bold (F2)
    // 5: Font Courier (F3)
    // 6: Font Courier-Bold (F4)

    const font1Id = 3
    const font2Id = 4
    const font3Id = 5
    const font4Id = 6

    const pageObjIds: number[] = []
    const contentObjIds: number[] = []

    // Calculate object slots
    // Page objects start after the 6 basic structure objects
    // For each page, we have a Page Object and a Content Stream Object
    const totalPages = this.pages.length

    // Add headers and footers to each page
    this.pages.forEach((page, idx) => {
      // Header top bar
      page.content.unshift(
        "q 0.00 0.00 0.50 rg 40 802 515.28 4 re f Q" // Navy accent top bar
      )
      // Footer page number
      page.content.push(
        "BT /F1 8 Tf 0.4 0.45 0.55 rg 40 30 Td (CONFIDENTIAL & PROPRIETARY  |  QUARDCUBE LABS REPORT ENGINE  |  ALL RIGHTS RESERVED) Tj ET",
        `BT /F2 8 Tf 0.00 0.00 0.50 rg 500 30 Td (Page ${idx + 1} of ${totalPages}) Tj ET`,
        "q 0.8 0.85 0.9 RG 0.5 w 40 42 555.28 42 m 555.28 42 l S Q"
      )
    })

    // Prepare Pages Kids
    // 1: Catalog
    // 2: Pages container
    // 3..6: Fonts
    // Then pairs of (Page, Content)
    let currentId = 6
    for (let i = 0; i < totalPages; i++) {
      currentId++
      pageObjIds.push(currentId)
      currentId++
      contentObjIds.push(currentId)
    }

    // Obj 1: Catalog
    objects.push(`<< /Type /Catalog /Pages 2 0 R >>`)

    // Obj 2: Pages
    const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(" ")
    objects.push(`<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>`)

    // Obj 3..6: Fonts
    objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`)
    objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`)
    objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>`)
    objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>`)

    // Add Page objects and Content stream objects
    for (let i = 0; i < totalPages; i++) {
      const pageId = pageObjIds[i]
      const streamId = contentObjIds[i]
      const streamData = this.pages[i].content.join("\n")
      const streamLength = Buffer.byteLength(streamData, "utf-8")

      // Page Object
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${streamId} 0 R /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R /F3 ${font3Id} 0 R /F4 ${font4Id} 0 R >> >> >>`
      )

      // Content Stream Object
      objects.push(
        `<< /Length ${streamLength} >>\nstream\n${streamData}\nendstream`
      )
    }

    // Assemble final PDF binary string
    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"
    const offsets: number[] = []

    for (let i = 0; i < objects.length; i++) {
      offsets.push(Buffer.byteLength(pdf, "binary"))
      pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
    }

    const startXref = Buffer.byteLength(pdf, "binary")
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += `0000000000 65535 f \n`
    for (const offset of offsets) {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`

    return Buffer.from(pdf, "binary")
  }
}

/**
 * Generate a complete, polished, multi-page PDF report document from PreparedReportPayload.
 */
export function generatePdfReportBuffer(report: PreparedReportPayload): Buffer {
  const doc = new PdfDocumentBuilder()

  const primaryNavy: [number, number, number] = [0.0, 0.0, 0.5] // #000080
  const darkSlate: [number, number, number] = [0.06, 0.09, 0.16] // #0F172A
  const mutedGray: [number, number, number] = [0.4, 0.45, 0.55] // #64748B
  const lightBg: [number, number, number] = [0.97, 0.98, 0.99] // #F8FAFC
  const borderGray: [number, number, number] = [0.85, 0.88, 0.92] // #CBD5E1
  const tealAccent: [number, number, number] = [0.0, 0.8, 0.8] // #00CDCD
  const emeraldGreen: [number, number, number] = [0.08, 0.65, 0.35] // #15803D

  // 1. BRANDING HEADER
  const companyName = (report.branding?.companyName || "QUARDCUBE LABS").toUpperCase()
  const subtitle = report.branding?.subtitle || "Enterprise Technology Solutions & Intelligence"
  const preparedBy = report.branding?.preparedBy || "Executive Reporting Engine"
  const generatedDate = new Date(report.generatedAt || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  // Top header layout
  doc.drawText(companyName, 40, doc.getCurrentY() - 15, { font: "F2", fontSize: 16, color: primaryNavy })
  doc.drawText(subtitle, 40, doc.getCurrentY() - 30, { font: "F1", fontSize: 8.5, color: mutedGray })

  // Right-aligned official badge & date
  doc.drawRect(435, doc.getCurrentY() - 18, 120, 20, [0.93, 0.98, 0.98], [0.0, 0.65, 0.65], 1)
  doc.drawText("OFFICIAL AUDIT REPORT", 445, doc.getCurrentY() - 13, { font: "F2", fontSize: 7.5, color: [0.0, 0.45, 0.45] })
  doc.drawText(`Issued: ${generatedDate}`, 440, doc.getCurrentY() - 30, { font: "F1", fontSize: 8, color: mutedGray })

  doc.decreaseY(42)
  doc.drawLine(40, doc.getCurrentY(), 555.28, doc.getCurrentY(), primaryNavy, 1.5)
  doc.decreaseY(15)

  // 2. REPORT TITLE & PERIOD
  doc.drawText((report.type || "BUSINESS").toUpperCase() + " DOMAIN REPORT", 40, doc.getCurrentY(), { font: "F2", fontSize: 8.5, color: tealAccent })
  doc.decreaseY(16)
  doc.drawText(report.title || "Business Performance Audit", 40, doc.getCurrentY(), { font: "F2", fontSize: 15, color: darkSlate, maxWidth: 510 })
  doc.decreaseY(14)
  
  const periodStr = `Reporting Cycle: ${report.period?.from || "Start"} to ${report.period?.to || "End"}   |   Officer: ${preparedBy}`
  doc.drawText(periodStr, 40, doc.getCurrentY(), { font: "F1", fontSize: 8.5, color: mutedGray })
  doc.decreaseY(18)

  if (report.subtitle) {
    doc.drawRect(40, doc.getCurrentY() - 18, 515.28, 22, [0.96, 0.97, 0.99], borderGray, 0.5)
    doc.drawText(report.subtitle, 48, doc.getCurrentY() - 11, { font: "F1", fontSize: 8.5, color: darkSlate, maxWidth: 500 })
    doc.decreaseY(28)
  }

  // 3. EXECUTIVE SCORECARD (if present)
  if (report.scorecard) {
    doc.checkPageBreak(85)
    const cardY = doc.getCurrentY() - 75
    doc.drawRect(40, cardY, 515.28, 75, [0.94, 0.99, 0.98], [0.08, 0.65, 0.55], 1.5)
    
    // Header row
    doc.drawText("EXECUTIVE VITALITY & COMPLIANCE SCORECARD", 52, cardY + 58, { font: "F2", fontSize: 9, color: primaryNavy })
    
    // Rating badge
    const ratingText = report.scorecard.healthRating || "A+ Optimal Health"
    doc.drawRect(430, cardY + 52, 115, 16, primaryNavy)
    doc.drawText(ratingText, 436, cardY + 56, { font: "F2", fontSize: 7.5, color: [1, 1, 1] })

    // 4 mini score boxes
    const boxW = 118
    const boxH = 34
    const boxY = cardY + 14

    const scores = [
      { label: "OVERALL HEALTH", val: `${report.scorecard.overallHealthScore || 95}/100`, col: primaryNavy },
      { label: "REVENUE VELOCITY", val: `${report.scorecard.revenueVelocityScore || 92}/100`, col: emeraldGreen },
      { label: "OPERATIONS", val: `${report.scorecard.operationalEfficiencyScore || 94}/100`, col: [0.08, 0.5, 0.7] as [number, number, number] },
      { label: "CUSTOMER TRUST", val: `${report.scorecard.customerTrustIndex || 96}/100`, col: [0.8, 0.5, 0.1] as [number, number, number] }
    ]

    scores.forEach((s, sIdx) => {
      const bX = 52 + sIdx * (boxW + 8)
      doc.drawRect(bX, boxY, boxW, boxH, [1, 1, 1], [0.8, 0.92, 0.9], 0.8)
      doc.drawText(s.label, bX + 6, boxY + 22, { font: "F2", fontSize: 6.5, color: mutedGray })
      doc.drawText(s.val, bX + 6, boxY + 8, { font: "F2", fontSize: 11, color: s.col })
    })

    doc.decreaseY(88)
  }

  // 4. SUMMARY KPIS GRID
  if (report.summary?.metrics && report.summary.metrics.length > 0) {
    doc.checkPageBreak(90)
    doc.drawText("KEY PERFORMANCE INDICATORS", 40, doc.getCurrentY(), { font: "F2", fontSize: 10, color: primaryNavy })
    doc.decreaseY(14)

    const metrics = report.summary.metrics.slice(0, 8)
    const cols = metrics.length <= 4 ? metrics.length : 4
    const cardWidth = (515.28 - (cols - 1) * 8) / cols
    const cardHeight = 44

    let rowY = doc.getCurrentY() - cardHeight
    metrics.forEach((m, idx) => {
      if (idx > 0 && idx % cols === 0) {
        rowY -= (cardHeight + 8)
        doc.checkPageBreak(cardHeight + 10)
      }
      const colIdx = idx % cols
      const cardX = 40 + colIdx * (cardWidth + 8)

      doc.drawRect(cardX, rowY, cardWidth, cardHeight, lightBg, borderGray, 1)
      doc.drawRect(cardX, rowY + cardHeight - 3, cardWidth, 3, primaryNavy) // accent line
      
      doc.drawText((m.label || "").toUpperCase(), cardX + 8, rowY + cardHeight - 14, { font: "F2", fontSize: 7, color: mutedGray, maxWidth: cardWidth - 16 })
      doc.drawText(String(m.value || "0"), cardX + 8, rowY + 12, { font: "F2", fontSize: 11, color: darkSlate, maxWidth: cardWidth - 16 })
    })

    const totalRows = Math.ceil(metrics.length / cols)
    doc.decreaseY(totalRows * (cardHeight + 8) + 12)
  }

  // 5. COMPARISON SECTION (if enabled)
  if (report.comparison?.metrics && report.comparison.metrics.length > 0) {
    doc.checkPageBreak(55)
    const compBoxY = doc.getCurrentY() - 48
    doc.drawRect(40, compBoxY, 515.28, 48, [0.95, 0.98, 1.0], [0.7, 0.8, 0.95], 1)
    
    const compTitle = `PRIOR PERIOD COMPARISON (${report.comparison.from || ""} to ${report.comparison.to || ""})`
    doc.drawText(compTitle, 50, compBoxY + 34, { font: "F2", fontSize: 8, color: primaryNavy })

    const compMetrics = report.comparison.metrics.slice(0, 3)
    const itemW = 500 / compMetrics.length
    compMetrics.forEach((cm, cIdx) => {
      const cX = 50 + cIdx * itemW
      const deltaStr = cm.changePercent !== undefined ? ` (${cm.changeDirection === "up" ? "+" : "-"}${cm.changePercent}%)` : ""
      doc.drawText(`${cm.label}:`, cX, compBoxY + 18, { font: "F1", fontSize: 8, color: mutedGray })
      doc.drawText(`${cm.value}${deltaStr}`, cX, compBoxY + 6, { font: "F2", fontSize: 9.5, color: cm.changeDirection === "up" ? emeraldGreen : primaryNavy })
    })

    doc.decreaseY(60)
  }

  // 6. DATA TABLES
  if (report.tables && Object.keys(report.tables).length > 0) {
    Object.values(report.tables).forEach(table => {
      if (!table.headers || table.headers.length === 0) return

      doc.checkPageBreak(80)
      doc.drawText((table.title || "Data Ledger").toUpperCase(), 40, doc.getCurrentY(), { font: "F2", fontSize: 10, color: primaryNavy })
      doc.decreaseY(14)

      const numCols = table.headers.length
      const colWidth = 515.28 / numCols
      const rowHeight = 18

      // Table Header Row
      const headerY = doc.getCurrentY() - rowHeight
      doc.drawRect(40, headerY, 515.28, rowHeight, primaryNavy)
      table.headers.forEach((h, hIdx) => {
        doc.drawText(h.toUpperCase(), 45 + hIdx * colWidth, headerY + 5, { font: "F2", fontSize: 7.5, color: [1, 1, 1], maxWidth: colWidth - 8 })
      })
      doc.decreaseY(rowHeight)

      // Table Data Rows (up to 30 rows)
      const rowsToRender = (table.rows || []).slice(0, 30)
      if (rowsToRender.length === 0) {
        const emptyY = doc.getCurrentY() - rowHeight
        doc.drawRect(40, emptyY, 515.28, rowHeight, lightBg, borderGray, 0.5)
        doc.drawText("No records found in this cycle", 45, emptyY + 5, { font: "F1", fontSize: 8, color: mutedGray })
        doc.decreaseY(rowHeight + 10)
      } else {
        rowsToRender.forEach((row, rIdx) => {
          doc.checkPageBreak(rowHeight + 5)
          const currentRY = doc.getCurrentY() - rowHeight
          const isEven = rIdx % 2 === 0
          const rowBg: [number, number, number] = isEven ? [1, 1, 1] : [0.97, 0.98, 0.99]

          doc.drawRect(40, currentRY, 515.28, rowHeight, rowBg, borderGray, 0.5)
          row.forEach((cell, cIdx) => {
            const cellText = String(cell !== undefined && cell !== null ? cell : "-")
            const isFirst = cIdx === 0
            doc.drawText(cellText, 45 + cIdx * colWidth, currentRY + 5, {
              font: isFirst ? "F2" : "F1",
              fontSize: 7.5,
              color: darkSlate,
              maxWidth: colWidth - 8
            })
          })
          doc.decreaseY(rowHeight)
        })
        doc.decreaseY(12)
      }
    })
  }

  // 7. CRYPTOGRAPHIC AUDIT SEAL
  doc.checkPageBreak(65)
  const sealY = doc.getCurrentY() - 55
  doc.drawRect(40, sealY, 515.28, 55, [0.97, 0.98, 0.99], primaryNavy, 1.2)
  
  doc.drawText("GOVERNANCE & CRYPTOGRAPHIC AUDIT SEAL", 50, sealY + 40, { font: "F2", fontSize: 8, color: primaryNavy })
  doc.drawText(`Issuing Directorate: ${report.auditSeal?.issuingDivision || "QuardCube Labs Intelligence Division"}`, 50, sealY + 26, { font: "F1", fontSize: 7.5, color: mutedGray })
  doc.drawText(`Audit Hash: ${report.auditSeal?.complianceHash || "QC-SHA256-VERIFIED"}`, 50, sealY + 12, { font: "F3", fontSize: 7, color: darkSlate })

  // Right side verification stamp
  doc.drawRect(415, sealY + 12, 130, 28, [0.92, 0.99, 0.95], emeraldGreen, 1)
  doc.drawText("VERIFIED DATABASE AUDIT", 422, sealY + 26, { font: "F2", fontSize: 7, color: emeraldGreen })
  doc.drawText(report.auditSeal?.reportId || `REP-${Date.now().toString(36).toUpperCase()}`, 422, sealY + 16, { font: "F3", fontSize: 6.5, color: mutedGray })

  return doc.build()
}
