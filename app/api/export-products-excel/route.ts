import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import ExcelJS from "exceljs"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://quardcubelabs.co.tz").replace(/\/$/, "")

function resolveImageUrl(image: string | null | undefined): string {
  if (!image) return `${SITE_URL}/turquoise.png`
  if (image.startsWith("http://") || image.startsWith("https://")) return image
  const cleanPath = image.startsWith("/") ? image.slice(1) : image
  return `${SITE_URL}/${cleanPath}`
}

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

    // Filter out unlisted products if any exist so all exported links are live on the shop
    const activeProducts = products.filter((row: any) => {
      const rawFeatures: string[] = Array.isArray(row.features) ? row.features : []
      return !rawFeatures.some(
        (f: string) => f === "__epic_status:not_on_epic__" || f === "not_on_epic"
      )
    })
    const exportList = activeProducts.length > 0 ? activeProducts : products

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "QuardCube Labs"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet("Products")

    // Define columns matching Google Business / Merchant Center product feed format
    worksheet.columns = [
      { header: "id", key: "id", width: 22 },
      { header: "title", key: "title", width: 32 },
      { header: "description", key: "description", width: 50 },
      { header: "price", key: "price", width: 16 },
      { header: "condition", key: "condition", width: 14 },
      { header: "link", key: "link", width: 48 },
      { header: "availability", key: "availability", width: 16 },
      { header: "image_link", key: "image_link", width: 55 },
    ]

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.height = 24
    headerRow.eachCell((cell) => {
      cell.font = { name: "Consolas", bold: true, size: 11, color: { argb: "FF188038" }, underline: true }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      }
      cell.alignment = { vertical: "middle", horizontal: "left" }
      cell.border = {
        top: { style: "thin", color: { argb: "FFDADCE0" } },
        left: { style: "thin", color: { argb: "FFDADCE0" } },
        bottom: { style: "thin", color: { argb: "FFDADCE0" } },
        right: { style: "thin", color: { argb: "FFDADCE0" } },
      }
    })

    // Add product rows
    for (let i = 0; i < exportList.length; i++) {
      const product = exportList[i]
      const numericPrice = Number(product.price) || 0
      const isInStock = (Number(product.stock) || 0) > 0
      const productLink = `${SITE_URL}/shop/${product.id}`
      const imageUrl = resolveImageUrl(product.image)

      const row = worksheet.addRow({
        id: `QCL-${product.id}`,
        title: product.name || "",
        description: product.description || product.name || "",
        price: numericPrice.toFixed(2),
        condition: "new",
        link: productLink,
        availability: isInStock ? "in_stock" : "out_of_stock",
        image_link: imageUrl,
      })

      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true }
        cell.border = {
          top: { style: "thin", color: { argb: "FFDADCE0" } },
          left: { style: "thin", color: { argb: "FFDADCE0" } },
          bottom: { style: "thin", color: { argb: "FFDADCE0" } },
          right: { style: "thin", color: { argb: "FFDADCE0" } },
        }

        // Match green monospace styling for condition (col 5) and availability (col 7)
        if (colNumber === 5 || colNumber === 7) {
          cell.font = { name: "Consolas", size: 10, color: { argb: "FF188038" } }
        } else {
          cell.font = { name: "Arial", size: 10, color: { argb: "FF202124" } }
        }
      })
    }

    // Generate the buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    const fileName = `QuardCubeLabs_Google_Business_Products_${new Date().toISOString().split("T")[0]}.xlsx`

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
