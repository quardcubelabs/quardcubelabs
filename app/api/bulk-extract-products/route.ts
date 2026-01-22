import { NextRequest, NextResponse } from 'next/server'

// Endpoint to bulk fetch all products from Epic Computers
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.MANUS_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Manus AI API key not configured' },
        { status: 500 }
      )
    }

    // Call Manus AI to extract all products from Epic Computers
    const manusResponse = await fetch('https://api.manus.ai/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://epiccomputers.co.tz/index.php/shop/',
        query: `Extract all products (approximately 98 products) with the following information for each:
        - Product name
        - Main product image URL
        - All swatch/variant image URLs (array of URLs)
        - Complete and full product description
        - Price
        - Stock status
        - Category
        
        Return as JSON array of objects with these exact field names:
        name, mainImage, swatchImages (array), description, price, stock, category`,
        includeImages: true,
        limit: 100,
        format: 'json',
        timeout: 60000 // 60 second timeout for large page
      }),
    })

    if (!manusResponse.ok) {
      const error = await manusResponse.text()
      console.error('Manus API error:', error)
      return NextResponse.json(
        { error: 'Failed to extract products from Manus AI', details: error },
        { status: manusResponse.status }
      )
    }

    const data = await manusResponse.json()
    const products = Array.isArray(data) ? data : data.products || []

    return NextResponse.json({
      count: products.length,
      status: 'success',
      products: products.map((product: any) => ({
        name: product.name || '',
        mainImage: product.mainImage || product.image || '',
        swatchImages: Array.isArray(product.swatchImages) 
          ? product.swatchImages.filter(Boolean)
          : product.swatches 
            ? (Array.isArray(product.swatches) ? product.swatches : [])
            : [],
        description: product.description || product.fullDescription || '',
        price: parseFloat(product.price) || 0,
        stock: parseInt(product.stock) || 0,
        category: product.category || 'Uncategorized',
      }))
    })
  } catch (error) {
    console.error('Error bulk extracting products:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
