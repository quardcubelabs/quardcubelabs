import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// This endpoint scrapes product data from Epic Computers website
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productUrl, productName } = body

    if (!productUrl && !productName) {
      return NextResponse.json(
        { error: 'Product URL or product name is required' },
        { status: 400 }
      )
    }

    let targetUrl = productUrl
    
    // If productName is provided, search for it on the shop page
    if (!productUrl && productName) {
      // Search on Epic Computers shop
      const searchUrl = `https://epiccomputers.co.tz/?s=${encodeURIComponent(productName)}&post_type=product`
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })
      
      if (!searchResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to search for product' },
          { status: 500 }
        )
      }
      
      const searchHtml = await searchResponse.text()
      const $search = cheerio.load(searchHtml)
      
      // Find first product link
      const firstProductLink = $search('.woocommerce-LoopProduct-link').first().attr('href')
      if (!firstProductLink) {
        return NextResponse.json(
          { error: 'Product not found', productName },
          { status: 404 }
        )
      }
      targetUrl = firstProductLink
    }

    // Fetch the product page
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch product page' },
        { status: 500 }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract product data
    const name = $('.product_title').text().trim() || productName || ''
    
    // Main image
    const mainImage = $('.woocommerce-product-gallery__image img').first().attr('src') ||
                      $('.wp-post-image').first().attr('src') || ''
    
    // Swatch/gallery images
    const swatchImages: string[] = []
    $('.woocommerce-product-gallery__image img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-large_image')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })
    
    // Also get variation swatch images if available
    $('.variation-selector img, .swatch-image img, .color-swatch img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })

    // Description
    const description = $('.woocommerce-product-details__short-description').text().trim() ||
                        $('#tab-description').text().trim() ||
                        $('.product-description').text().trim() || ''

    // Price
    const priceText = $('.price .woocommerce-Price-amount').first().text().trim()
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0

    // Category
    const category = $('.posted_in a').first().text().trim() || ''

    // SKU
    const sku = $('.sku').text().trim() || ''

    const extractedData = {
      name,
      mainImage,
      swatchImages,
      description,
      price,
      category,
      sku,
      sourceUrl: targetUrl
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

// Bulk extraction endpoint - scrapes all products from Epic Computers shop page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Fetch the shop page
    const shopUrl = `https://epiccomputers.co.tz/index.php/shop/page/${page}/`
    const response = await fetch(shopUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch shop page' },
        { status: 500 }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const products: Array<{
      name: string
      mainImage: string
      price: number
      productUrl: string
      category: string
    }> = []

    // Extract product listings
    $('.product').each((_, el) => {
      const $product = $(el)
      
      const name = $product.find('.woocommerce-loop-product__title').text().trim() ||
                   $product.find('.product-title').text().trim() ||
                   $product.find('h2').text().trim()
      
      const mainImage = $product.find('img').first().attr('src') ||
                        $product.find('img').first().attr('data-src') || ''
      
      const priceText = $product.find('.price .woocommerce-Price-amount').first().text().trim()
      const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0
      
      const productUrl = $product.find('a.woocommerce-LoopProduct-link').attr('href') ||
                         $product.find('a').first().attr('href') || ''
      
      const category = $product.find('.product-category').text().trim() || ''

      if (name && productUrl) {
        products.push({
          name,
          mainImage,
          price,
          productUrl,
          category
        })
      }
    })

    // Get total pages info
    const lastPageLink = $('.page-numbers:not(.next)').last().text()
    const totalPages = parseInt(lastPageLink) || 1

    return NextResponse.json({
      page,
      totalPages,
      count: products.length,
      products: products.slice(0, limit)
    })
  } catch (error) {
    console.error('Error bulk extracting products:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
