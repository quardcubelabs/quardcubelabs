import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// This API route serves the static products.xml feed
// Use this URL in Google Merchant Center: https://quardcube.vercel.app/api/product-feed
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Read the static XML file from the public directory
    const filePath = join(process.cwd(), 'public', 'products.xml')
    const xmlContent = await readFile(filePath, 'utf-8')
    
    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'noindex', // Don't index the feed itself
      },
    })
  } catch (error) {
    console.error('Error reading product feed:', error)
    return NextResponse.json(
      { 
        error: 'Product feed not found',
        message: 'Run "npm run generate-feed" to create the feed',
        hint: 'The products.xml file should exist in the public folder'
      }, 
      { status: 404 }
    )
  }
}
