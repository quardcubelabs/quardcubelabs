import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Firecrawl API configuration
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1'

// Helper to delay requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Type definitions for Firecrawl responses
interface FirecrawlScrapeResult {
  success: boolean
  data?: {
    html?: string
    markdown?: string
    metadata?: {
      title?: string
      description?: string
      ogImage?: string
    }
    links?: string[]
  }
  error?: string
}

interface FirecrawlCrawlResult {
  success: boolean
  data?: Array<{
    url: string
    html?: string
    markdown?: string
    metadata?: {
      title?: string
      description?: string
      ogImage?: string
    }
  }>
  error?: string
}

// Fetch page using Firecrawl API
async function fetchWithFirecrawl(url: string): Promise<string | null> {
  if (!FIRECRAWL_API_KEY) {
    console.log('Firecrawl API key not configured, falling back to direct fetch')
    return await fetchDirectly(url)
  }

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

    if (!response.ok) {
      console.error(`Firecrawl API error: ${response.status}`)
      return await fetchDirectly(url)
    }

    const result: FirecrawlScrapeResult = await response.json()
    
    if (result.success && result.data?.html) {
      return result.data.html
    }
    
    console.log('Firecrawl returned no HTML, falling back to direct fetch')
    return await fetchDirectly(url)
  } catch (error) {
    console.error('Firecrawl fetch error:', error)
    return await fetchDirectly(url)
  }
}

// Fallback direct fetch
async function fetchDirectly(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
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

// Helper to fetch product details from a single product page
async function fetchProductDetails(productUrl: string): Promise<{
  name: string
  mainImage: string
  swatchImages: string[]
  description: string
  price: number
  category: string
} | null> {
  try {
    const html = await fetchWithFirecrawl(productUrl)
    if (!html) return null

    const $ = cheerio.load(html)

    // Extract product name
    const name = $('.product_title').text().trim() ||
                 $('h1.entry-title').text().trim() ||
                 $('h1').first().text().trim() || ''

    // Main image - get the full-size image
    const mainImage = $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
                      $('.woocommerce-product-gallery__image img').first().attr('data-src') ||
                      $('.woocommerce-product-gallery__image img').first().attr('src') ||
                      $('.wp-post-image').first().attr('src') ||
                      $('img.attachment-woocommerce_single').first().attr('src') ||
                      $('[class*="product"] img').first().attr('src') || ''

    // Swatch/gallery images - get all gallery images
    const swatchImages: string[] = []
    
    // Get all gallery images
    $('.woocommerce-product-gallery__image').each((_, el) => {
      const $img = $(el).find('img')
      const src = $img.attr('data-large_image') || $img.attr('data-src') || $img.attr('src')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })
    
    // Get variation/swatch images
    $('.variations_form img, .variation-selector img, .swatch-image img, .color-swatch img, .product-thumbnails img').each((_, el) => {
      const src = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src')
      if (src && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })

    // Get thumbnail images
    $('figure.woocommerce-product-gallery__image a').each((_, el) => {
      const href = $(el).attr('href')
      if (href && !swatchImages.includes(href)) {
        swatchImages.push(href)
      }
    })

    // Also check for data-thumb attributes
    $('[data-thumb]').each((_, el) => {
      const thumb = $(el).attr('data-thumb')
      if (thumb && !swatchImages.includes(thumb)) {
        swatchImages.push(thumb)
      }
    })

    // Description - get both short and full description
    let description = ''
    const shortDesc = $('.woocommerce-product-details__short-description').text().trim()
    const fullDesc = $('#tab-description .woocommerce-Tabs-panel--description').text().trim() ||
                     $('#tab-description').text().trim() ||
                     $('.product-description').text().trim() ||
                     $('[itemprop="description"]').text().trim()
    
    description = shortDesc || fullDesc || ''
    if (shortDesc && fullDesc && shortDesc !== fullDesc) {
      description = `${shortDesc}\n\n${fullDesc}`
    }

    // Clean up description - remove excessive whitespace
    description = description.replace(/\s+/g, ' ').trim()

    // Price - handle both regular and sale prices
    let price = 0
    const salePriceText = $('.price ins .woocommerce-Price-amount').first().text().trim()
    const regularPriceText = $('.price .woocommerce-Price-amount').first().text().trim()
    const singlePriceText = $('[class*="price"]').first().text().trim()
    const priceText = salePriceText || regularPriceText || singlePriceText
    
    if (priceText) {
      // Remove currency symbols and commas, extract number
      const matches = priceText.match(/[\d,]+\.?\d*/g)
      if (matches && matches.length > 0) {
        price = parseFloat(matches[0].replace(/,/g, '')) || 0
      }
    }

    // Category
    const category = $('.posted_in a').first().text().trim() ||
                     $('[rel="tag"]').first().text().trim() ||
                     'Uncategorized'

    return {
      name,
      mainImage,
      swatchImages,
      description,
      price,
      category
    }
  } catch (error) {
    console.error(`Error fetching product details from ${productUrl}:`, error)
    return null
  }
}

// Endpoint to bulk fetch all products from Epic Computers
export async function POST(request: NextRequest) {
  try {
    const allProducts: Array<{
      name: string
      mainImage: string
      swatchImages: string[]
      description: string
      price: number
      stock: number
      category: string
      productUrl: string
    }> = []

    // First, get all product URLs from the shop pages
    let page = 1
    let hasMorePages = true
    const productUrls: Array<{ url: string; name: string; price: number; category: string }> = []

    console.log('Starting bulk extraction from Epic Computers...')
    console.log(`Using Firecrawl API: ${FIRECRAWL_API_KEY ? 'Yes' : 'No (fallback to direct fetch)'}`)

    // Fetch all shop pages to get product URLs
    while (hasMorePages && page <= 15) { // Increased max pages
      console.log(`Fetching shop page ${page}...`)
      
      const shopUrl = page === 1 
        ? 'https://epiccomputers.co.tz/index.php/shop/'
        : `https://epiccomputers.co.tz/index.php/shop/page/${page}/`
      
      const html = await fetchWithFirecrawl(shopUrl)

      if (!html) {
        if (page === 1) {
          return NextResponse.json(
            { error: 'Failed to fetch shop page from Epic Computers. The website may be down or blocking requests.' },
            { status: 500 }
          )
        }
        hasMorePages = false
        break
      }

      const $ = cheerio.load(html)

      // Extract product listings from this page
      let productsOnPage = 0
      
      // Try multiple selectors for product listings
      const productSelectors = [
        '.products .product',
        'ul.products li.product',
        '.product-grid .product',
        '[class*="product-item"]',
        '.woocommerce-loop-product'
      ]
      
      for (const selector of productSelectors) {
        if (productsOnPage > 0) break
        
        $(selector).each((_, el) => {
          const $product = $(el)
          
          // Try multiple selectors for product URL
          const productUrl = $product.find('a.woocommerce-LoopProduct-link').attr('href') ||
                             $product.find('a[href*="/product/"]').first().attr('href') ||
                             $product.find('.product-link').attr('href') ||
                             $product.find('h2 a, h3 a').first().attr('href') ||
                             $product.find('a').first().attr('href') || ''
          
          // Try multiple selectors for product name
          const name = $product.find('.woocommerce-loop-product__title').text().trim() ||
                       $product.find('.product-title').text().trim() ||
                       $product.find('h2').text().trim() ||
                       $product.find('h3').text().trim() ||
                       $product.find('[class*="title"]').text().trim()
          
          // Try multiple selectors for price
          const priceText = $product.find('.price .woocommerce-Price-amount').first().text().trim() ||
                            $product.find('[class*="price"]').first().text().trim()
          const priceMatches = priceText.match(/[\d,]+\.?\d*/g)
          const price = priceMatches ? parseFloat(priceMatches[0].replace(/,/g, '')) || 0 : 0
          
          const category = $product.find('.product-category').text().trim() || ''

          // Validate URL before adding
          if (productUrl && name && productUrl.includes('epiccomputers.co.tz') && !productUrls.some(p => p.url === productUrl)) {
            productUrls.push({ url: productUrl, name, price, category })
            productsOnPage++
          }
        })
      }

      console.log(`Found ${productsOnPage} products on page ${page}`)

      // Check if there's a next page
      const nextPageLink = $('.next.page-numbers').attr('href') ||
                           $('a[class*="next"]').attr('href') ||
                           $('[rel="next"]').attr('href')
      hasMorePages = !!nextPageLink && productsOnPage > 0
      page++

      // Delay between page requests
      await delay(FIRECRAWL_API_KEY ? 1000 : 500)
    }

    console.log(`Total product URLs found: ${productUrls.length}`)

    if (productUrls.length === 0) {
      return NextResponse.json({
        error: 'No products found on Epic Computers website. The website structure may have changed.',
        hint: 'Please check if https://epiccomputers.co.tz/index.php/shop/ is accessible'
      }, { status: 404 })
    }

    // Now fetch detailed info for each product (batch processing)
    let successCount = 0
    let failCount = 0
    const batchSize = 5 // Process 5 products at a time

    for (let i = 0; i < productUrls.length; i += batchSize) {
      const batch = productUrls.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productUrls.length / batchSize)}...`)
      
      const batchResults = await Promise.all(
        batch.map(async ({ url, name: listName, price: listPrice, category: listCategory }) => {
          try {
            const details = await fetchProductDetails(url)
            
            if (details && (details.name || details.mainImage)) {
              successCount++
              return {
                name: details.name || listName,
                mainImage: details.mainImage,
                swatchImages: details.swatchImages,
                description: details.description,
                price: details.price || listPrice,
                stock: 10,
                category: details.category || listCategory || 'Uncategorized',
                productUrl: url
              }
            } else {
              failCount++
              return {
                name: listName,
                mainImage: '',
                swatchImages: [],
                description: '',
                price: listPrice,
                stock: 10,
                category: listCategory || 'Uncategorized',
                productUrl: url
              }
            }
          } catch (error) {
            failCount++
            return {
              name: listName,
              mainImage: '',
              swatchImages: [],
              description: '',
              price: listPrice,
              stock: 10,
              category: listCategory || 'Uncategorized',
              productUrl: url
            }
          }
        })
      )
      
      allProducts.push(...batchResults)
      
      // Delay between batches
      if (i + batchSize < productUrls.length) {
        await delay(FIRECRAWL_API_KEY ? 2000 : 1000)
      }
    }

    console.log(`Bulk extraction complete. Success: ${successCount}, Failed: ${failCount}`)

    return NextResponse.json({
      count: allProducts.length,
      status: 'success',
      successCount,
      failCount,
      products: allProducts,
      usingFirecrawl: !!FIRECRAWL_API_KEY
    })
  } catch (error) {
    console.error('Error bulk extracting products:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: String(error),
        hint: 'Check server logs for more details'
      },
      { status: 500 }
    )
  }
}
