import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Dynamic product feed generation from database
// Use this URL in Google Merchant Center: https://quardcube.vercel.app/api/product-feed
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quardcube.vercel.app'

function escapeXml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeUrl(url: string | null | undefined): string {
  if (!url) return ''
  return String(url).replace(/&/g, '&amp;')
}

function truncateDescription(desc: string | null | undefined): string {
  if (!desc) return 'Professional electronics and tech solutions from QuadCube Labs'
  const cleaned = String(desc).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  return cleaned.length > 5000 ? cleaned.substring(0, 4997) + '...' : cleaned
}

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return `${SITE_URL}/turquoise.png`
  if (url.startsWith('http')) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function buildProductItem(product: any): string {
  const lines: string[] = []
  
  lines.push(`    <item>`)
  lines.push(`      <g:id>QCL_${product.id}</g:id>`)
  lines.push(`      <g:title>${escapeXml(product.name)}</g:title>`)
  lines.push(`      <g:description>${escapeXml(truncateDescription(product.description))}</g:description>`)
  lines.push(`      <g:link>${escapeUrl(SITE_URL)}/shop/product/${product.id}</g:link>`)
  
  const mainImage = resolveImageUrl(product.image)
  lines.push(`      <g:image_link>${escapeUrl(mainImage)}</g:image_link>`)
  
  if (Array.isArray(product.swatch_images)) {
    product.swatch_images.slice(0, 10).forEach((img: string) => {
      if (img) {
        const imageUrl = resolveImageUrl(img)
        lines.push(`      <g:additional_image_link>${escapeUrl(imageUrl)}</g:additional_image_link>`)
      }
    })
  }
  
  lines.push(`      <g:condition>new</g:condition>`)
  lines.push(`      <g:availability>${(product.stock || 0) > 0 ? 'in stock' : 'out of stock'}</g:availability>`)
  lines.push(`      <g:price>${product.price.toFixed(2)} TZS</g:price>`)
  lines.push(`      <g:brand>${escapeXml(product.brand || 'QuadCube Labs')}</g:brand>`)
  lines.push(`      <g:mpn>${escapeXml(product.sku || `QCL-${product.id}`)}</g:mpn>`)
  
  if (product.gtin) {
    lines.push(`      <g:gtin>${escapeXml(product.gtin)}</g:gtin>`)
  } else {
    lines.push(`      <g:identifier_exists>false</g:identifier_exists>`)
  }
  
  lines.push(`      <g:product_type>${escapeXml(product.category || 'Electronics')}</g:product_type>`)
  lines.push(`      <g:google_product_category>Electronics</g:google_product_category>`)
  
  if (product.rating) {
    lines.push(`      <g:custom_label_0>${product.rating >= 4.5 ? 'Top Rated' : product.rating >= 4 ? 'Highly Rated' : 'Quality Product'}</g:custom_label_0>`)
  }
  lines.push(`      <g:custom_label_1>${product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Limited Stock' : 'Out of Stock'}</g:custom_label_1>`)
  
  if (Array.isArray(product.features)) {
    product.features.slice(0, 5).forEach((feature: string) => {
      if (feature) {
        lines.push(`      <g:product_highlight>${escapeXml(feature)}</g:product_highlight>`)
      }
    })
  }
  
  lines.push(`      <g:shipping>`)
  lines.push(`        <g:country>TZ</g:country>`)
  lines.push(`        <g:service>Standard</g:service>`)
  lines.push(`        <g:price>20000.00 TZS</g:price>`)
  lines.push(`      </g:shipping>`)
  
  lines.push(`    </item>`)
  
  return lines.join('\n')
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('id')
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
    
    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }
    
    const validProducts = products.filter(p => p.name && p.price > 0)
    
    const productItems = validProducts.map(product => {
      try {
        return buildProductItem(product)
      } catch (e) {
        console.error(`Error building feed item for product ${product.id}:`, e)
        return ''
      }
    }).filter(Boolean).join('\n')
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>QuadCube Labs - Premium Electronics &amp; Tech Solutions</title>
    <link>${escapeUrl(SITE_URL)}</link>
    <description>Professional electronics, computers, and tech solutions from QuadCube Labs - Tanzania's leading technology provider</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${productItems}
  </channel>
</rss>`
    
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error generating product feed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
