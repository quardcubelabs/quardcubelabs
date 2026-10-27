import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { getFilteredReportTransactions, ReportFilterCriteria, ReportTransactionRecord } from "@/lib/filtered-reports-actions"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const filters: ReportFilterCriteria = body.filters || {}
    const passedRecords: ReportTransactionRecord[] = body.records

    // Use passed records or re-query with filters
    let records = passedRecords
    if (!records || records.length === 0) {
      const data = await getFilteredReportTransactions(filters)
      records = data.records
    }

    // Initialize ExcelJS Workbook
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "QuardCube Labs Limited"
    workbook.lastModifiedBy = "Reporting & BI Directorate"
    workbook.created = new Date()
    workbook.modified = new Date()

    const worksheet = workbook.addWorksheet("Transactions Report", {
      views: [{ showGridLines: true }],
      properties: { defaultRowHeight: 22 }
    })

    const NAVY_ARGB = "FF000080"
    const TEAL_ARGB = "FF40E0D0"
    const GRAY_BG = "FFF8FAFC"
    const BORDER_COLOR = "FFE2E8F0"

    // 1. Company Header
    worksheet.mergeCells("A1:N1")
    const titleCell = worksheet.getCell("A1")
    titleCell.value = "QUARDCUBE LABS LIMITED — EXECUTIVE BUSINESS INTELLIGENCE REPORT"
    titleCell.font = { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } }
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_ARGB } }
    titleCell.alignment = { vertical: "middle", horizontal: "center" }
    worksheet.getRow(1).height = 36

    // 2. Metadata Subtitle
    worksheet.mergeCells("A2:N2")
    const subCell = worksheet.getCell("A2")
    const dateFormatted = new Date().toLocaleString("en-GB")
    subCell.value = `Export Date: ${dateFormatted}  |  Official Audit Register  |  Tax Jurisdiction: Tanzania (TRA 18% VAT)`
    subCell.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FF475569" } }
    subCell.alignment = { vertical: "middle", horizontal: "center" }
    subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
    worksheet.getRow(2).height = 22

    // 3. Applied Filters Summary Block
    worksheet.mergeCells("A4:N4")
    const filterTitleCell = worksheet.getCell("A4")
    filterTitleCell.value = "APPLIED FILTER PARAMETERS"
    filterTitleCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E293B" } }
    filterTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
    filterTitleCell.alignment = { vertical: "middle", horizontal: "left" }

    const filterDetails = [
      `Date Range: ${filters.startDate || "All Time"} to ${filters.endDate || "Present"}`,
      `Category: ${filters.category || "All"}`,
      `Location: ${filters.location || "All"}`,
      `Mode: ${filters.mode || "All"}`,
      `Salesman: ${filters.salesman || "All"}`,
      `Doc Type: ${filters.receiptType || "All"}`,
      `Customer: ${filters.customer || "All"}`,
      `Payment: ${filters.paymentMethod || "All"}`,
      `VAT: ${filters.vatStatus || "All"}`
    ].join("  |  ")

    worksheet.mergeCells("A5:N5")
    const filterTextCell = worksheet.getCell("A5")
    filterTextCell.value = filterDetails
    filterTextCell.font = { name: "Segoe UI", size: 9, color: { argb: "FF334155" } }
    filterTextCell.alignment = { vertical: "middle", horizontal: "left" }
    worksheet.getRow(5).height = 20

    // 4. Executive KPI Summary Row
    const totalGross = records.reduce((s, r) => s + r.total_amount, 0)
    const totalVat = records.reduce((s, r) => s + r.vat_amount, 0)
    const totalSub = records.reduce((s, r) => s + r.subtotal, 0)

    worksheet.mergeCells("A7:C7")
    const kpi1 = worksheet.getCell("A7")
    kpi1.value = `FILTERED GROSS TOTAL: TZS ${totalGross.toLocaleString()}`
    kpi1.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F766E" } }
    kpi1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCFBF1" } }
    kpi1.alignment = { vertical: "middle", horizontal: "center" }

    worksheet.mergeCells("D7:F7")
    const kpi2 = worksheet.getCell("D7")
    kpi2.value = `TAXABLE SUBTOTAL: TZS ${totalSub.toLocaleString()}`
    kpi2.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF1E3A8A" } }
    kpi2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } }
    kpi2.alignment = { vertical: "middle", horizontal: "center" }

    worksheet.mergeCells("G7:I7")
    const kpi3 = worksheet.getCell("G7")
    kpi3.value = `TRA 18% VAT: TZS ${totalVat.toLocaleString()}`
    kpi3.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF9A3412" } }
    kpi3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEDD5" } }
    kpi3.alignment = { vertical: "middle", horizontal: "center" }

    worksheet.mergeCells("J7:N7")
    const kpi4 = worksheet.getCell("J7")
    kpi4.value = `RECORDS: ${records.length} Transactions`
    kpi4.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF334155" } }
    kpi4.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }
    kpi4.alignment = { vertical: "middle", horizontal: "center" }

    // 5. Column Headers
    const headers = [
      { header: "Date", key: "date", width: 14 },
      { header: "Document #", key: "doc", width: 16 },
      { header: "Doc Type", key: "type", width: 14 },
      { header: "Customer / Entity", key: "customer", width: 32 },
      { header: "Sales Representative", key: "salesman", width: 22 },
      { header: "Location / Hub", key: "location", width: 28 },
      { header: "Channel Mode", key: "mode", width: 24 },
      { header: "Items & Description", key: "items", width: 45 },
      { header: "Payment Channel", key: "payment", width: 22 },
      { header: "VAT Status", key: "vat_status", width: 18 },
      { header: "Subtotal (TZS)", key: "subtotal", width: 18 },
      { header: "VAT 18% (TZS)", key: "vat", width: 16 },
      { header: "Total (TZS)", key: "total", width: 18 },
      { header: "Status", key: "status", width: 12 },
    ]

    const headerRowIdx = 9
    const headerRow = worksheet.getRow(headerRowIdx)
    headerRow.height = 26

    headers.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = col.header
      cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_ARGB } }
      cell.alignment = { vertical: "middle", horizontal: idx >= 10 && idx <= 12 ? "right" : "left" }
      cell.border = {
        top: { style: "thin", color: { argb: BORDER_COLOR } },
        bottom: { style: "medium", color: { argb: TEAL_ARGB } },
        left: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } },
      }
      worksheet.getColumn(idx + 1).width = col.width
    })

    // 6. Data Rows
    let currentRowIdx = 10
    records.forEach((rec, idx) => {
      const row = worksheet.getRow(currentRowIdx)
      const isEven = idx % 2 === 0
      const rowBg = isEven ? "FFFFFFFF" : GRAY_BG

      row.values = [
        rec.date,
        rec.document_number,
        rec.document_type.toUpperCase(),
        rec.customer_name,
        rec.salesman,
        rec.location,
        rec.mode,
        rec.items_summary,
        rec.payment_method,
        rec.vat_status,
        rec.subtotal,
        rec.vat_amount,
        rec.total_amount,
        rec.status.toUpperCase()
      ]

      row.height = 22

      // Format cells
      row.eachCell((cell, colNum) => {
        cell.font = { name: "Segoe UI", size: 9, color: { argb: "FF1E293B" } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } }
        cell.border = {
          bottom: { style: "thin", color: { argb: BORDER_COLOR } },
          left: { style: "thin", color: { argb: BORDER_COLOR } },
          right: { style: "thin", color: { argb: BORDER_COLOR } }
        }

        // Numbers formatting
        if (colNum >= 11 && colNum <= 13) {
          cell.numFmt = "#,##0"
          cell.alignment = { vertical: "middle", horizontal: "right" }
          cell.font = { name: "Consolas", size: 9, bold: colNum === 13 }
        } else if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 14) {
          cell.alignment = { vertical: "middle", horizontal: "center" }
          if (colNum === 2) cell.font = { name: "Consolas", size: 9, bold: true, color: { argb: "FF000080" } }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "left" }
        }
      })

      currentRowIdx++
    })

    // 7. Summary Formula Row
    const sumRow = worksheet.getRow(currentRowIdx)
    sumRow.height = 26
    sumRow.getCell(1).value = "TOTAL REGISTER SUM"
    worksheet.mergeCells(`A${currentRowIdx}:J${currentRowIdx}`)
    const mergedSumCell = sumRow.getCell(1)
    mergedSumCell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: NAVY_ARGB } }
    mergedSumCell.alignment = { vertical: "middle", horizontal: "right" }

    // Subtotal SUM
    const subCellSum = sumRow.getCell(11)
    subCellSum.value = totalSub
    subCellSum.numFmt = "#,##0"
    subCellSum.font = { name: "Consolas", size: 10, bold: true }
    subCellSum.alignment = { vertical: "middle", horizontal: "right" }

    // VAT SUM
    const vatCellSum = sumRow.getCell(12)
    vatCellSum.value = totalVat
    vatCellSum.numFmt = "#,##0"
    vatCellSum.font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF9A3412" } }
    vatCellSum.alignment = { vertical: "middle", horizontal: "right" }

    // Total SUM
    const totalCellSum = sumRow.getCell(13)
    totalCellSum.value = totalGross
    totalCellSum.numFmt = "#,##0"
    totalCellSum.font = { name: "Consolas", size: 11, bold: true, color: { argb: "FF0F766E" } }
    totalCellSum.alignment = { vertical: "middle", horizontal: "right" }

    // Fill style on summary row
    sumRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }
      cell.border = {
        top: { style: "medium", color: { argb: NAVY_ARGB } },
        bottom: { style: "double", color: { argb: NAVY_ARGB } }
      }
    })

    // Output buffer
    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `QuardCube_Filtered_Report_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    })
  } catch (error: any) {
    console.error("Excel generation error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate Excel report" }, { status: 500 })
  }
}
