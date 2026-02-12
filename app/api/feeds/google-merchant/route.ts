import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quardcube.vercel.app"

// Google Merchant Center Product Feed (RSS 2.0 / XML) - Fixed XML formatting
// Submit this URL to Google Merchant Center: https://quardcube.vercel.app/api/feeds/google-merchant
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("id")

    if (error) {
      console.error("Error fetching products for feed:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    const items = (products || [])
      .filter((p: any) => p.name && p.price > 0) // Only valid products
      .map((p: any) => {
        const images = [p.image, ...(p.swatch_images || [])].filter(Boolean)
        const additionalImages = images.slice(1, 11) // Google allows up to 10 additional images
        
        // Clean product link URL
        const baseUrl = SITE_URL.endsWith("/") ? SITE_URL.slice(0, -1) : SITE_URL
        const productLink = escapeUrl(`${baseUrl}/shop/${p.id}`)

        return `    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${escapeXml(p.name)}]]></g:title>
      <g:description><![CDATA[${escapeXml(p.description || p.name)}]]></g:description>
      <g:link>${productLink}</g:link>
      <g:image_link>${resolveImageUrl(p.image)}</g:image_link>
${additionalImages.map((img: string) => `      <g:additional_image_link>${resolveImageUrl(img)}</g:additional_image_link>`).join("\n")}
      <g:availability>${(p.stock || 0) > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${formatPrice(p.price)} TZS</g:price>
      <g:condition>new</g:condition>
      <g:brand>QuardCubeLabs</g:brand>
      <g:product_type><![CDATA[${escapeXml(p.category || "General")}]]></g:product_type>
      <g:google_product_category>Electronics</g:google_product_category>
      <g:mpn>QCL-${p.id}</g:mpn>
      <g:identifier_exists>false</g:identifier_exists>
    </item>`
      })
      .join("\n")

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>QuardCubeLabs Products</title>
    <link>${escapeUrl(SITE_URL)}</link>
    <description>IT Products and Solutions from QuardCubeLabs - Tanzania&apos;s leading tech provider</description>
${items}
  </channel>
</rss>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("Error generating Google Merchant feed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function escapeXml(str: string): string {
  if (!str) return ""
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function escapeUrl(url: string): string {
  if (!url) return ""
  // Escape ampersands in URLs for XML
  return url.replace(/&/g, "&amp;")
}

function resolveImageUrl(url: string): string {
  if (!url) return escapeUrl(`${SITE_URL}/turquoise.png`)
  if (url.startsWith("http")) return escapeUrl(url)
  // Remove leading slash if SITE_URL ends with slash to avoid double slash
  const cleanUrl = url.startsWith("/") ? url.substring(1) : url
  const baseUrl = SITE_URL.endsWith("/") ? SITE_URL.slice(0, -1) : SITE_URL
  return escapeUrl(`${baseUrl}/${cleanUrl}`)
}

function formatPrice(price: number): string {
  return price.toFixed(2)
}
