import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Firecrawl API configuration
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1'

// Fetch page using Firecrawl API with fallback
async function fetchPage(url: string): Promise<string | null> {
  // Try Firecrawl first if API key is available
  if (FIRECRAWL_API_KEY) {
    try {
      const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          formats: ['html'],
          waitFor: 2000,
          timeout: 30000
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.html) {
          return result.data.html
        }
      }
    } catch (error) {
      console.error('Firecrawl error, falling back to direct fetch:', error)
    }
  }

  // Fallback to direct fetch
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 }
    })

    if (!response.ok) return null
    return await response.text()
  } catch (error) {
    console.error(`Direct fetch error for ${url}:`, error)
    return null
  }
}

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
      const searchHtml = await fetchPage(searchUrl)
      
      if (!searchHtml) {
        return NextResponse.json(
          { error: 'Failed to search for product' },
          { status: 500 }
        )
      }
      
      const $search = cheerio.load(searchHtml)
      
      // Find first product link
      const firstProductLink = $search('.woocommerce-LoopProduct-link').first().attr('href') ||
                               $search('a[href*="/product/"]').first().attr('href')
      if (!firstProductLink) {
        return NextResponse.json(
          { error: 'Product not found', productName },
          { status: 404 }
        )
      }
      targetUrl = firstProductLink
    }

    // Fetch the product page
    const html = await fetchPage(targetUrl)

    if (!html) {
      return NextResponse.json(
        { error: 'Failed to fetch product page' },
        { status: 500 }
      )
    }

    const $ = cheerio.load(html)

    // Extract product data
    const name = $('.product_title').text().trim() || 
                 $('h1.entry-title').text().trim() ||
                 $('h1').first().text().trim() ||
                 productName || ''
    
    // Main image - try multiple selectors
    const mainImage = $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
                      $('.woocommerce-product-gallery__image img').first().attr('data-src') ||
                      $('.woocommerce-product-gallery__image img').first().attr('src') ||
                      $('.wp-post-image').first().attr('src') ||
                      $('img.attachment-woocommerce_single').first().attr('src') || ''
    
    // Swatch/gallery images
    const swatchImages: string[] = []
    $('.woocommerce-product-gallery__image img').each((_, el) => {
      const src = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })
    
    // Also get variation swatch images if available
    $('.variation-selector img, .swatch-image img, .color-swatch img, .product-thumbnails img').each((_, el) => {
      const src = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })

    // Get thumbnail hrefs
    $('figure.woocommerce-product-gallery__image a').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !swatchImages.includes(href)) {
        swatchImages.push(href)
      }
    })

    // Description
    const shortDesc = $('.woocommerce-product-details__short-description').text().trim()
    const fullDesc = $('#tab-description').text().trim() ||
                     $('.product-description').text().trim() ||
                     $('[itemprop="description"]').text().trim()
    const description = shortDesc || fullDesc || ''

    // Price - handle sale prices
    const salePriceText = $('.price ins .woocommerce-Price-amount').first().text().trim()
    const regularPriceText = $('.price .woocommerce-Price-amount').first().text().trim()
    const priceText = salePriceText || regularPriceText
    const priceMatches = priceText.match(/[\d,]+\.?\d*/g)
    const price = priceMatches ? parseFloat(priceMatches[0].replace(/,/g, '')) || 0 : 0

    // Category
    const category = $('.posted_in a').first().text().trim() ||
                     $('[rel="tag"]').first().text().trim() || ''

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
      sourceUrl: targetUrl,
      usingFirecrawl: !!FIRECRAWL_API_KEY
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
    const shopUrl = page === 1
      ? 'https://epiccomputers.co.tz/index.php/shop/'
      : `https://epiccomputers.co.tz/index.php/shop/page/${page}/`
    
    const html = await fetchPage(shopUrl)

    if (!html) {
      return NextResponse.json(
        { error: 'Failed to fetch shop page' },
        { status: 500 }
      )
    }

    const $ = cheerio.load(html)

    const products: Array<{
      name: string
      mainImage: string
      price: number
      productUrl: string
      category: string
    }> = []

    // Extract product listings - try multiple selectors
    const productSelectors = [
      '.products .product',
      'ul.products li.product',
      '.product',
      '[class*="product-item"]'
    ]

    for (const selector of productSelectors) {
      if (products.length > 0) break
      
      $(selector).each((_, el) => {
        const $product = $(el)
        
        const name = $product.find('.woocommerce-loop-product__title').text().trim() ||
                     $product.find('.product-title').text().trim() ||
                     $product.find('h2').text().trim() ||
                     $product.find('h3').text().trim()
        
        const mainImage = $product.find('img').first().attr('data-src') ||
                          $product.find('img').first().attr('src') || ''
        
        const priceText = $product.find('.price .woocommerce-Price-amount').first().text().trim()
        const priceMatches = priceText.match(/[\d,]+\.?\d*/g)
        const price = priceMatches ? parseFloat(priceMatches[0].replace(/,/g, '')) || 0 : 0
        
        const productUrl = $product.find('a.woocommerce-LoopProduct-link').attr('href') ||
                           $product.find('a[href*="/product/"]').first().attr('href') ||
                           $product.find('a').first().attr('href') || ''
        
        const category = $product.find('.product-category').text().trim() || ''

        if (name && productUrl && productUrl.includes('epiccomputers.co.tz')) {
          products.push({
            name,
            mainImage,
            price,
            productUrl,
            category
          })
        }
      })
    }

    // Get total pages info
    const lastPageLink = $('.page-numbers:not(.next)').last().text()
    const totalPages = parseInt(lastPageLink) || 1

    return NextResponse.json({
      page,
      totalPages,
      count: products.length,
      products: products.slice(0, limit),
      usingFirecrawl: !!FIRECRAWL_API_KEY
    })
  } catch (error) {
    console.error('Error bulk extracting products:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
