import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET() {
  try {
    const supabase = getSupabaseClient()
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .gt('stock', 0) // Only include in-stock products
      .order('rating', { ascending: false })
      .limit(1000)
    
    if (error) throw error

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quardcubelabs.com'

    // Generate Google Shopping XML feed using your rich product data
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>QuadCube Labs - Premium Electronics &amp; Tech Solutions</title>
    <link>${baseUrl}</link>
    <description>Professional electronics, computers, and tech solutions from QuadCube Labs</description>
    ${products?.map(product => `
    <item>
      <g:id>QCL_${product.id}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(truncateDescription(product.description))}</g:description>
      <g:link>${baseUrl}/shop/product/${product.id}</g:link>
      <g:image_link>${product.image}</g:image_link>
      ${product.swatch_images?.slice(0, 3).map((img: string) => 
        `<g:additional_image_link>${img}</g:additional_image_link>`
      ).join('')}
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${product.price} USD</g:price>
      <g:brand>QuadCube Labs</g:brand>
      <g:mpn>${product.sku || `QCL-${product.id}`}</g:mpn>
      <g:product_type>${escapeXml(product.category)}</g:product_type>
      <g:google_product_category>Electronics</g:google_product_category>
      <g:custom_label_0>${product.rating >= 4.5 ? 'Top Rated' : product.rating >= 4 ? 'Highly Rated' : 'Quality Product'}</g:custom_label_0>
      <g:custom_label_1>${product.stock > 10 ? 'In Stock' : 'Limited Stock'}</g:custom_label_1>
      ${product.features?.slice(0, 5).map((feature: string) => 
        `<g:product_highlight>${escapeXml(feature)}</g:product_highlight>`
      ).join('')}
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>10.00 USD</g:price>
      </g:shipping>
    </item>`).join('')}
  </channel>
</rss>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=1800', // 30 minutes cache
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

function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncateDescription(desc: string): string {
  if (!desc) return 'Professional electronics and tech solutions from QuadCube Labs'
  return desc.length > 150 ? desc.substring(0, 147) + '...' : desc
}