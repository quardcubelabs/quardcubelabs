import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import ExcelJS from "exceljs"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("id")

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "No products found" }, { status: 404 })
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "QuardCube Labs"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet("Products", {
      properties: { defaultRowHeight: 80 },
    })

    // Define columns
    worksheet.columns = [
      { header: "No.", key: "no", width: 6 },
      { header: "Product Name", key: "name", width: 35 },
      { header: "Short Description", key: "description", width: 50 },
      { header: "Features", key: "features", width: 50 },
      { header: "Product Image URL", key: "image", width: 50 },
      { header: "Price (TZS)", key: "price", width: 18 },
    ]

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1A1A2E" }, // navy
      }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
    })

    // Add product rows
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const features = (product.features || []).join("\n• ")
      const featuresText = features ? `• ${features}` : ""

      const row = worksheet.addRow({
        no: i + 1,
        name: product.name || "",
        description: product.description || "",
        features: featuresText,
        image: product.image || "",
        price: product.price || 0,
      })

      row.height = 70
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true }
        cell.border = {
          top: { style: "thin", color: { argb: "FFD0D0D0" } },
          left: { style: "thin", color: { argb: "FFD0D0D0" } },
          bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
          right: { style: "thin", color: { argb: "FFD0D0D0" } },
        }
      })

      // Alternate row colors
      if (i % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          }
        })
      }

      // Format price column
      const priceCell = row.getCell("price")
      priceCell.numFmt = '#,##0'
      priceCell.alignment = { vertical: "top", horizontal: "right" }

      // Make image URL a hyperlink
      const imageCell = row.getCell("image")
      if (product.image) {
        imageCell.value = {
          text: product.image,
          hyperlink: product.image,
        } as ExcelJS.CellHyperlinkValue
        imageCell.font = { color: { argb: "FF0066CC" }, underline: true, size: 10 }
      }
    }

    // Generate the buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    const fileName = `QuardCubeLabs_Products_${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting products:", error)
    return NextResponse.json({ error: "Failed to export products" }, { status: 500 })
  }
}
