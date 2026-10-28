import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import {
  EPIC_BASE_URL,
  EPIC_SHOP_URL,
  USER_AGENT,
  parsePriceFromElement,
  fetchWithRetry,
  getEpicShopTotalPages,
  scrapeProductListingsFromPage,
  applyPriceCut,
  EPIC_PRICE_CUT_TZS
} from '@/lib/epic-scraper'

// Firecrawl API configuration (optional fallback)
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1'

// Fetch page using Firecrawl API with fallback to direct fetch
async function fetchPage(url: string): Promise<{ html: string | null; finalUrl?: string }> {
  // Try Firecrawl first if API key is available
  if (FIRECRAWL_API_KEY) {
    try {
      const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          formats: ['html'],
          waitFor: 2000,
          timeout: 30000,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.html) {
          return { html: result.data.html, finalUrl: url }
        }
      }
    } catch (error) {
      console.error('Firecrawl error, falling back to direct fetch:', error)
    }
  }

  // Fallback to direct fetch
  try {
    const response = await fetchWithRetry(url)
    if (!response || !response.ok) return { html: null }
    const html = await response.text()
    return { html, finalUrl: response.url }
  } catch (error) {
    console.error(`Direct fetch error for ${url}:`, error)
    return { html: null }
  }
}

// Scrape single product data from Epic Computers
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
    let htmlContent: string | null = null

    // If productName is provided without URL, search on Epic Computers
    if (!productUrl && productName) {
      const searchUrl = `${EPIC_BASE_URL}/?s=${encodeURIComponent(productName)}&post_type=product`
      const searchResult = await fetchPage(searchUrl)

      if (!searchResult.html) {
        return NextResponse.json(
          { error: 'Failed to search for product on Epic Computers' },
          { status: 500 }
        )
      }

      // Check if WooCommerce redirected directly to single product page
      if (searchResult.finalUrl && searchResult.finalUrl.includes('/product/')) {
        targetUrl = searchResult.finalUrl
        htmlContent = searchResult.html
      } else {
        const $search = cheerio.load(searchResult.html)

        // Find product link from search results
        const firstProductLink =
          $search('.type-product a[href*="/product/"]').first().attr('href') ||
          $search('.porto-tb-item a[href*="/product/"]').first().attr('href') ||
          $search('.woocommerce-LoopProduct-link').first().attr('href') ||
          $search('a[href*="/product/"]').first().attr('href')

        if (!firstProductLink) {
          return NextResponse.json(
            { error: 'Product not found on Epic Computers', productName },
            { status: 404 }
          )
        }
        targetUrl = firstProductLink
      }
    }

    // Fetch the product page if not already loaded from direct redirect
    if (!htmlContent) {
      const pageResult = await fetchPage(targetUrl)
      htmlContent = pageResult.html
    }

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'Failed to fetch product page from Epic Computers' },
        { status: 500 }
      )
    }

    const $ = cheerio.load(htmlContent)

    // Extract product title
    const name =
      $('.product_title').text().trim() ||
      $('h1.entry-title').text().trim() ||
      $('h1').first().text().trim() ||
      productName ||
      ''

    // Main image
    const mainImage =
      $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
      $('.woocommerce-product-gallery__image img').first().attr('data-src') ||
      $('.woocommerce-product-gallery__image img').first().attr('src') ||
      $('.wp-post-image').first().attr('src') ||
      $('img.attachment-woocommerce_single').first().attr('src') ||
      ''

    // Swatch / gallery images
    const swatchImages: string[] = []
    $('.woocommerce-product-gallery__image img, .variation-selector img, .swatch-image img, .color-swatch img, .product-thumbnails img').each((_, el) => {
      const src = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })

    $('figure.woocommerce-product-gallery__image a').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !swatchImages.includes(href)) {
        swatchImages.push(href)
      }
    })

    // Description
    const shortDesc = $('.woocommerce-product-details__short-description').text().trim()
    const fullDesc =
      $('#tab-description').text().trim() ||
      $('.product-description').text().trim() ||
      $('[itemprop="description"]').text().trim()
    const description = shortDesc || fullDesc || ''

    // Price extraction - accurate sale vs regular price
    const price = parsePriceFromElement($)

    // Category
    const category =
      $('.posted_in a').first().text().trim() ||
      $('[rel="tag"]').first().text().trim() ||
      ''

    // SKU
    const sku = $('.sku').text().trim() || ''

    // Stock
    const stockText = $('.stock, .availability').text().toLowerCase()
    const stock = stockText.includes('out of stock') ? 0 : 10

    const extractedData = {
      name,
      mainImage,
      swatchImages,
      description,
      price,
      category,
      sku,
      stock,
      sourceUrl: targetUrl,
      usingFirecrawl: !!FIRECRAWL_API_KEY,
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

// Bulk extraction endpoint - scrapes products from shop page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const products = await scrapeProductListingsFromPage(page, EPIC_SHOP_URL)
    const totalPages = await getEpicShopTotalPages(EPIC_SHOP_URL)

    return NextResponse.json({
      page,
      totalPages,
      count: products.length,
      products: products.slice(0, limit),
      usingFirecrawl: !!FIRECRAWL_API_KEY,
    })
  } catch (error) {
    console.error('Error bulk extracting products:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
