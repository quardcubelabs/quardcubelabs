import { NextResponse } from 'next/server'

// Force dynamic rendering on Vercel
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://quardcube.vercel.app'
    
    // Simple test XML without database
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>QuardCube Labs - Premium Electronics &amp; Tech Solutions</title>
    <link>${baseUrl}</link>
    <description>Professional electronics, computers, and tech solutions from QuardCube Labs</description>
    <item>
      <g:id>QCL_TEST_001</g:id>
      <g:title>Test Product - Gaming Laptop</g:title>
      <g:description>High-performance gaming laptop for professional use</g:description>
      <g:link>${baseUrl}/shop/product/test</g:link>
      <g:image_link>https://via.placeholder.com/300x300/0000FF/FFFFFF?text=Test</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>1299.99 USD</g:price>
      <g:brand>QuardCube Labs</g:brand>
      <g:mpn>QCL-TEST-001</g:mpn>
      <g:product_type>Electronics</g:product_type>
      <g:google_product_category>Electronics</g:google_product_category>
    </item>
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
    console.error('Feed generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate product feed', details: error.message }, 
      { status: 500 }
    )
  }
}