import { NextRequest, NextResponse } from 'next/server'

// This endpoint uses Manus AI API to extract product data from Epic Computers website
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.MANUS_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Manus AI API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { productName } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // Call Manus AI API to extract product data from Epic Computers
    const manusResponse = await fetch('https://api.manus.ai/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://epiccomputers.co.tz/index.php/shop/',
        query: `Find product named "${productName}" and extract: main image URL, swatch image URLs (all variants), full product description, and price. Return as JSON with fields: mainImage, swatchImages (array), description, price`,
        includeImages: true,
        format: 'json'
      }),
    })

    if (!manusResponse.ok) {
      const error = await manusResponse.text()
      console.error('Manus API error:', error)
      return NextResponse.json(
        { error: 'Failed to extract product data from Manus AI', details: error },
        { status: manusResponse.status }
      )
    }

    const data = await manusResponse.json()

    // Normalize response structure
    const extractedData = {
      mainImage: data.mainImage || data.image || '',
      swatchImages: data.swatchImages || data.swatches || [],
      description: data.description || data.fullDescription || '',
      price: data.price || 0,
      name: data.name || productName,
    }

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error('Error extracting product data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// Bulk extraction endpoint for all products
export async function GET(request: NextRequest) {
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
        query: 'Extract all 98 products with: product name, main image URL, all swatch image URLs, full description, and price. Return as JSON array of objects with fields: name, mainImage, swatchImages, description, price',
        includeImages: true,
        limit: 100,
        format: 'json'
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
      products: products.map((product: any) => ({
        name: product.name || '',
        mainImage: product.mainImage || product.image || '',
        swatchImages: product.swatchImages || product.swatches || [],
        description: product.description || product.fullDescription || '',
        price: product.price || 0,
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
