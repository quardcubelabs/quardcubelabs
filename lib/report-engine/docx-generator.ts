/**
 * Pure Node.js Microsoft Word (.docx) Report Generator
 * Generates genuine, fully editable, structured business reports for QuardCube Labs.
 * Features Cover Page, Document Control, Executive Summary Callout, KPI Boxes,
 * Styled Data Tables, Findings, Recommendations, and Formal Sign-off Blocks.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  TableOfContents
} from "docx"
import { PreparedReportPayload } from "./types"

const COLOR_NAVY = "0F172A"
const COLOR_TEAL = "0D9488"
const COLOR_SLATE_TEXT = "334155"
const COLOR_SLATE_MUTED = "64748B"
const COLOR_BORDER = "CBD5E1"
const COLOR_BG_LIGHT = "F8FAFC"
const COLOR_ZEBRA = "F1F5F9"

export async function generateDocxReportBuffer(report: PreparedReportPayload): Promise<Buffer> {
  const branding = report.branding || {}
  const companyName = (branding.companyName || "QUARDCUBE LABS").toUpperCase()
  const companySub = branding.subtitle || "Enterprise Technology & Infrastructure Solutions"
  const companyAddress = branding.address || "Makumbusho, Millennium Tower 14th Floor, Dar es Salaam, Tanzania"
  const companyContact = `${branding.phone || "+255 623 893 383"} | ${branding.email || "info@quardcubelabs.co.tz"}`

  const docControl = report.documentControl || {
    reportId: `REP-${new Date().getFullYear()}-001`,
    reportType: report.title,
    reportingPeriod: report.period?.formatted || `${report.period?.from} – ${report.period?.to}`,
    generatedBy: branding.preparedBy || "Senior Business Analyst",
    preparedFor: branding.preparedFor || "Executive Management",
    generatedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    version: "1.0",
    status: "Official Management Report",
    dataSource: "Enterprise Database & Ledgers",
    lastUpdated: new Date().toISOString().split("T")[0],
    confidentiality: "Confidential & Proprietary"
  }

  const sectionsList: any[] = []

  // -------------------------------------------------------------
  // 1. COVER PAGE / TITLE BLOCK
  // -------------------------------------------------------------
  const coverElements = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: companyName,
          bold: true,
          size: 28,
          color: COLOR_TEAL,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `${companySub}\n${companyAddress} • ${companyContact}`,
          size: 18,
          color: COLOR_SLATE_MUTED,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 300, after: 140 },
      children: [
        new TextRun({
          text: report.title.toUpperCase(),
          bold: true,
          size: 40,
          color: COLOR_NAVY,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: report.subtitle || "Executive Performance Assessment & Business Analysis",
          italics: true,
          size: 22,
          color: COLOR_SLATE_TEXT,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `REPORTING PERIOD: ${report.period?.formatted || `${report.period?.from} to ${report.period?.to}`}`,
          bold: true,
          size: 20,
          color: COLOR_TEAL,
          font: "Arial"
        })
      ]
    }),

    // Document Control Table
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 140 },
      children: [
        new TextRun({
          text: "Document Control & Classification",
          bold: true,
          size: 22,
          color: COLOR_NAVY,
          font: "Arial"
        })
      ]
    }),
    createDocumentControlTable(docControl),
    new Paragraph({
      spacing: { before: 400, after: 200 },
      pageBreakBefore: true,
      children: []
    })
  ]

  sectionsList.push(...coverElements)

  // -------------------------------------------------------------
  // 2. TABLE OF CONTENTS
  // -------------------------------------------------------------
  sectionsList.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 160 },
      children: [
        new TextRun({
          text: "Table of Contents",
          bold: true,
          size: 26,
          color: COLOR_NAVY,
          font: "Arial"
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "This document contains the following structured management sections:",
          size: 19,
          color: COLOR_SLATE_TEXT,
          font: "Arial"
        })
      ]
    })
  )

  const tocItems = report.tableOfContents || (report.sections || []).filter(s => s.enabled).map(s => ({ title: s.title, sectionId: s.id }))
  tocItems.forEach((item, idx) => {
    sectionsList.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `${item.title}`,
            bold: true,
            size: 20,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      })
    )
  })

  sectionsList.push(
    new Paragraph({
      spacing: { before: 240, after: 200 },
      children: []
    })
  )

  // -------------------------------------------------------------
  // 3. EXECUTIVE SUMMARY CALLOUT
  // -------------------------------------------------------------
  const execSummary = report.narrative?.executiveSummary || report.summary?.executiveSummary || report.narrative?.overview
  if (execSummary) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 160 },
        children: [
          new TextRun({
            text: "1. Executive Summary & Synthesis",
            bold: true,
            size: 26,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      }),
      createCalloutBox("EXECUTIVE BRIEFING", execSummary)
    )
  }

  // -------------------------------------------------------------
  // 4. METHODOLOGY & SCOPE
  // -------------------------------------------------------------
  if (report.methodology) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 160 },
        children: [
          new TextRun({
            text: "2. Reporting Scope & Methodology",
            bold: true,
            size: 26,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Reporting Scope: ", bold: true, size: 20, color: COLOR_NAVY, font: "Arial" }),
          new TextRun({ text: report.methodology.scope, size: 20, color: COLOR_SLATE_TEXT, font: "Arial" })
        ]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Data Included: ", bold: true, size: 20, color: COLOR_NAVY, font: "Arial" }),
          new TextRun({ text: report.methodology.dataIncluded, size: 20, color: COLOR_SLATE_TEXT, font: "Arial" })
        ]
      })
    )
    if (report.methodology.calculationMethodology) {
      sectionsList.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: "Calculation Methodology: ", bold: true, size: 20, color: COLOR_NAVY, font: "Arial" }),
            new TextRun({ text: report.methodology.calculationMethodology, size: 20, color: COLOR_SLATE_TEXT, font: "Arial" })
          ]
        })
      )
    }
  }

  // -------------------------------------------------------------
  // 5. KEY PERFORMANCE INDICATORS (KPIs)
  // -------------------------------------------------------------
  const metrics = report.summary?.metrics || []
  if (metrics.length > 0) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 160 },
        children: [
          new TextRun({
            text: "3. Key Performance Indicators",
            bold: true,
            size: 26,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      }),
      createKpiTable(metrics)
    )
  }

  // -------------------------------------------------------------
  // 6. DYNAMIC TABLES
  // -------------------------------------------------------------
  if (report.tables) {
    let tableIndex = 4
    Object.entries(report.tables).forEach(([key, tableData]) => {
      sectionsList.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 320, after: 140 },
          children: [
            new TextRun({
              text: `${tableIndex}. ${tableData.title}`,
              bold: true,
              size: 24,
              color: COLOR_NAVY,
              font: "Arial"
            })
          ]
        })
      )

      if (tableData.introText) {
        sectionsList.push(
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: tableData.introText,
                italics: true,
                size: 19,
                color: COLOR_SLATE_MUTED,
                font: "Arial"
              })
            ]
          })
        )
      }

      sectionsList.push(createDataTable(tableData))
      tableIndex++
    })
  }

  // -------------------------------------------------------------
  // 7. OBSERVATIONS & FINDINGS
  // -------------------------------------------------------------
  const observations = report.narrative?.observations || []
  if (observations.length > 0) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 160 },
        children: [
          new TextRun({
            text: "Key Audit Observations & Analytical Findings",
            bold: true,
            size: 24,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      })
    )

    observations.forEach(obs => {
      sectionsList.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: obs,
              size: 20,
              color: COLOR_SLATE_TEXT,
              font: "Arial"
            })
          ]
        })
      )
    })
  }

  // -------------------------------------------------------------
  // 8. STRATEGIC RECOMMENDATIONS
  // -------------------------------------------------------------
  const recommendations = report.narrative?.recommendations || []
  if (recommendations.length > 0) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 160 },
        children: [
          new TextRun({
            text: "Actionable Strategic Recommendations",
            bold: true,
            size: 24,
            color: COLOR_TEAL,
            font: "Arial"
          })
        ]
      })
    )

    recommendations.forEach(rec => {
      sectionsList.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: rec,
              size: 20,
              color: COLOR_SLATE_TEXT,
              font: "Arial"
            })
          ]
        })
      )
    })
  }

  // -------------------------------------------------------------
  // 9. CONCLUSION
  // -------------------------------------------------------------
  const conclusion = report.narrative?.conclusion
  if (conclusion) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 140 },
        children: [
          new TextRun({
            text: "Management Conclusion",
            bold: true,
            size: 24,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: conclusion,
            size: 20,
            color: COLOR_SLATE_TEXT,
            font: "Arial"
          })
        ]
      })
    )
  }

  // -------------------------------------------------------------
  // 10. APPROVAL & SIGN-OFF SECTION
  // -------------------------------------------------------------
  if (report.approvalSection) {
    sectionsList.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 340, after: 160 },
        children: [
          new TextRun({
            text: "Official Document Sign-off & Approvals",
            bold: true,
            size: 24,
            color: COLOR_NAVY,
            font: "Arial"
          })
        ]
      }),
      createApprovalTable(report.approvalSection)
    )
  }

  // Build complete Word Document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 20,
            color: COLOR_SLATE_TEXT
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1080,
              bottom: 1080,
              left: 1080,
              right: 1080
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${companyName} • ${report.title.toUpperCase()}`,
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                    font: "Arial"
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${docControl.confidentiality} • Generated on ${docControl.generatedOn} • Page `,
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                    font: "Arial"
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                    font: "Arial"
                  }),
                  new TextRun({
                    text: " of ",
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                    font: "Arial"
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLOR_SLATE_MUTED,
                    font: "Arial"
                  })
                ]
              })
            ]
          })
        },
        children: sectionsList
      }
    ]
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

// -------------------------------------------------------------
// HELPER: Create Document Control Table
// -------------------------------------------------------------
function createDocumentControlTable(docControl: any): Table {
  const rowsData = [
    ["Report ID", docControl.reportId],
    ["Report Type", docControl.reportType],
    ["Reporting Period", docControl.reportingPeriod],
    ["Prepared By", docControl.generatedBy],
    ["Prepared For", docControl.preparedFor],
    ["Generated On", docControl.generatedOn],
    ["Document Version", docControl.version],
    ["Document Status", docControl.status],
    ["Data Source", docControl.dataSource],
    ["Confidentiality", docControl.confidentiality]
  ]

  const tableRows = rowsData.map((r, idx) => {
    const isZebra = idx % 2 === 1
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: isZebra ? COLOR_ZEBRA : COLOR_BG_LIGHT, type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: r[0], bold: true, size: 18, color: COLOR_NAVY, font: "Arial" })]
            })
          ]
        }),
        new TableCell({
          width: { size: 6000, type: WidthType.DXA },
          shading: { fill: isZebra ? COLOR_ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: [new TextRun({ text: r[1], size: 18, color: COLOR_SLATE_TEXT, font: "Arial" })]
            })
          ]
        })
      ]
    })
  })

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: tableRows
  })
}

// -------------------------------------------------------------
// HELPER: Create Callout Box
// -------------------------------------------------------------
function createCalloutBox(title: string, content: string): Table {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9000, type: WidthType.DXA },
            shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_TEAL },
              top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
            },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, bold: true, size: 18, color: COLOR_TEAL, font: "Arial" })]
              }),
              new Paragraph({
                children: [new TextRun({ text: content, size: 19, color: COLOR_SLATE_TEXT, font: "Arial" })]
              })
            ]
          })
        ]
      })
    ]
  })
}

// -------------------------------------------------------------
// HELPER: Create KPI Table
// -------------------------------------------------------------
function createKpiTable(metrics: any[]): Table {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 3500, type: WidthType.DXA },
        shading: { fill: COLOR_NAVY, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "Key Metric Indicator", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      }),
      new TableCell({
        width: { size: 2500, type: WidthType.DXA },
        shading: { fill: COLOR_NAVY, type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Recorded Value", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      }),
      new TableCell({
        width: { size: 3000, type: WidthType.DXA },
        shading: { fill: COLOR_NAVY, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "Analytical Context", bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })]
      })
    ]
  })

  const rows = metrics.map((m, idx) => {
    const isZebra = idx % 2 === 1
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 3500, type: WidthType.DXA },
          shading: { fill: isZebra ? COLOR_ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: m.label, bold: true, size: 18, color: COLOR_NAVY, font: "Arial" })] })]
        }),
        new TableCell({
          width: { size: 2500, type: WidthType.DXA },
          shading: { fill: isZebra ? COLOR_ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(m.value), bold: true, size: 19, color: COLOR_TEAL, font: "Arial" })] })]
        }),
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { fill: isZebra ? COLOR_ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: m.description || "", size: 17, color: COLOR_SLATE_MUTED, font: "Arial" })] })]
        })
      ]
    })
  })

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...rows]
  })
}

// -------------------------------------------------------------
// HELPER: Create Data Table
// -------------------------------------------------------------
function createDataTable(tableData: any): Table {
  const headers = tableData.headers || []
  const rows = tableData.rows || []
  const alignments = tableData.alignments || []
  const numCols = headers.length || 1
  const colWidth = Math.floor(9000 / numCols)

  const headerRow = new TableRow({
    children: headers.map((h: string, idx: number) => {
      const align = alignments[idx] === "right" ? AlignmentType.RIGHT : alignments[idx] === "center" ? AlignmentType.CENTER : AlignmentType.LEFT
      return new TableCell({
        width: { size: colWidth, type: WidthType.DXA },
        shading: { fill: COLOR_NAVY, type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(h).toUpperCase(), bold: true, color: "FFFFFF", size: 17, font: "Arial" })] })]
      })
    })
  })

  const dataRows = rows.slice(0, 50).map((r: any[], rIdx: number) => {
    const isZebra = rIdx % 2 === 1
    return new TableRow({
      children: r.map((cellVal: any, cIdx: number) => {
        const align = alignments[cIdx] === "right" ? AlignmentType.RIGHT : alignments[cIdx] === "center" ? AlignmentType.CENTER : AlignmentType.LEFT
        const isBold = cIdx === 0
        return new TableCell({
          width: { size: colWidth, type: WidthType.DXA },
          shading: { fill: isZebra ? COLOR_ZEBRA : "FFFFFF", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(cellVal ?? ""), bold: isBold, size: 17, color: isBold ? COLOR_NAVY : COLOR_SLATE_TEXT, font: "Arial" })] })]
        })
      })
    })
  })

  // Summary Footer row if present
  const footerRows: TableRow[] = []
  if (tableData.summaryFooter && tableData.summaryFooter.length > 0) {
    footerRows.push(
      new TableRow({
        children: tableData.summaryFooter.map((fVal: any, cIdx: number) => {
          const align = alignments[cIdx] === "right" ? AlignmentType.RIGHT : alignments[cIdx] === "center" ? AlignmentType.CENTER : AlignmentType.LEFT
          return new TableCell({
            width: { size: colWidth, type: WidthType.DXA },
            shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(fVal ?? ""), bold: true, size: 18, color: COLOR_NAVY, font: "Arial" })] })]
          })
        })
      })
    )
  }

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [headerRow, ...dataRows, ...footerRows]
  })
}

// -------------------------------------------------------------
// HELPER: Create Approval Sign-Off Table
// -------------------------------------------------------------
function createApprovalTable(approval: any): Table {
  const roles = [
    { title: "Prepared By", data: approval.preparedBy },
    { title: "Reviewed By", data: approval.reviewedBy },
    { title: "Approved By", data: approval.approvedBy }
  ].filter(r => r.data)

  const colWidth = Math.floor(9000 / Math.max(roles.length, 1))

  const row = new TableRow({
    children: roles.map(r => {
      return new TableCell({
        width: { size: colWidth, type: WidthType.DXA },
        shading: { fill: COLOR_BG_LIGHT, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
          left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
        },
        children: [
          new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: r.title.toUpperCase(), bold: true, size: 16, color: COLOR_SLATE_MUTED, font: "Arial" })] }),
          new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: r.data.name, bold: true, size: 19, color: COLOR_NAVY, font: "Arial" })] }),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: r.data.position, size: 16, color: COLOR_SLATE_TEXT, font: "Arial" })] }),
          new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `Date: ${r.data.date}`, size: 16, color: COLOR_SLATE_MUTED, font: "Arial" })] }),
          new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Signature: ______________________", size: 16, color: COLOR_NAVY, font: "Arial" })] })
        ]
      })
    })
  })

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [row]
  })
}
