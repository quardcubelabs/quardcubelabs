import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering on Vercel (not static)
export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

// Escape ALL text and URLs for valid XML output
function escapeXml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Escape URLs for XML (only & needs escaping in URLs)
function escapeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return String(url).replace(/&/g, '&amp;')
}

function truncateDescription(desc: string | null | undefined): string {
  if (!desc) return 'Professional electronics and tech solutions from QuadCube Labs'
  // Google allows up to 5000 chars for description
  const cleaned = String(desc).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove invalid XML chars
  return cleaned.length > 5000 ? cleaned.substring(0, 4997) + '...' : cleaned
}

function buildProductItem(product: any, baseUrl: string): string {
  const lines: string[] = []
  
  lines.push(`    <item>`)
  lines.push(`      <g:id>QCL_${product.id}</g:id>`)
  lines.push(`      <g:title>${escapeXml(product.name)}</g:title>`)
  lines.push(`      <g:description>${escapeXml(truncateDescription(product.description))}</g:description>`)
  lines.push(`      <g:link>${escapeUrl(baseUrl)}/shop/product/${product.id}</g:link>`)
  
  // Image - must be escaped for XML
  if (product.image) {
    lines.push(`      <g:image_link>${escapeUrl(product.image)}</g:image_link>`)
  }
  
  // Additional images - safely handle null/undefined
  if (Array.isArray(product.swatch_images)) {
    product.swatch_images.slice(0, 3).forEach((img: string) => {
      if (img) {
        lines.push(`      <g:additional_image_link>${escapeUrl(img)}</g:additional_image_link>`)
      }
    })
  }
  
  lines.push(`      <g:condition>new</g:condition>`)
  lines.push(`      <g:availability>in stock</g:availability>`)
  lines.push(`      <g:price>${product.price} USD</g:price>`)
  lines.push(`      <g:brand>${escapeXml(product.brand || 'QuadCube Labs')}</g:brand>`)
  lines.push(`      <g:mpn>${escapeXml(product.sku || `QCL-${product.id}`)}</g:mpn>`)
  lines.push(`      <g:product_type>${escapeXml(product.category)}</g:product_type>`)
  lines.push(`      <g:google_product_category>Electronics</g:google_product_category>`)
  lines.push(`      <g:custom_label_0>${product.rating >= 4.5 ? 'Top Rated' : product.rating >= 4 ? 'Highly Rated' : 'Quality Product'}</g:custom_label_0>`)
  lines.push(`      <g:custom_label_1>${product.stock > 10 ? 'In Stock' : 'Limited Stock'}</g:custom_label_1>`)
  
  // Features - safely handle null/undefined
  if (Array.isArray(product.features)) {
    product.features.slice(0, 5).forEach((feature: string) => {
      if (feature) {
        lines.push(`      <g:product_highlight>${escapeXml(feature)}</g:product_highlight>`)
      }
    })
  }
  
  lines.push(`      <g:shipping>`)
  lines.push(`        <g:country>US</g:country>`)
  lines.push(`        <g:service>Standard</g:service>`)
  lines.push(`        <g:price>10.00 USD</g:price>`)
  lines.push(`      </g:shipping>`)
  lines.push(`    </item>`)
  
  return lines.join('\n')
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0)
      .order('rating', { ascending: false })
      .limit(1000)
    
    if (error) throw error

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quardcube.vercel.app'

    const productItems = (products || []).map(product => {
      try {
        return buildProductItem(product, baseUrl)
      } catch (e) {
        console.error(`Error building feed item for product ${product.id}:`, e)
        return '' // Skip broken products instead of crashing the whole feed
      }
    }).filter(Boolean).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>QuadCube Labs - Premium Electronics &amp; Tech Solutions</title>
    <link>${escapeUrl(baseUrl)}</link>
    <description>Professional electronics, computers, and tech solutions from QuadCube Labs</description>
${productItems}
  </channel>
</rss>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Google Merchant feed generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate product feed' }, 
      { status: 500 }
    )
  }
}