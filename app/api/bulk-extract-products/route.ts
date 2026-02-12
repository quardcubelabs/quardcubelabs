import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'

const EPIC_BASE_URL = 'https://epiccomputers.co.tz'
const EPIC_SHOP_URL = `${EPIC_BASE_URL}/index.php/shop/`
const EPIC_CATEGORY_URL = `${EPIC_BASE_URL}/index.php/product-category/`
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Rate limiting delay between requests (in ms)
const REQUEST_DELAY = 1000
const BATCH_SIZE = 5 // Process 5 products at a time to avoid memory issues
const DEFAULT_MAX_PRODUCTS = 60 // Default minimum products per import

// Create Supabase client for API route
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey)
}

interface ProductListing {
  name: string
  productUrl: string
  mainImage: string
  price: number
}

interface ProductDetail {
  name: string
  mainImage: string
  swatchImages: string[]
  description: string
  price: number
  stock: number
  category: string
  sku: string
  features: string[]
  sourceUrl?: string
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Fetch with retry logic and timeout
async function fetchWithRetry(url: string, retries = 2, timeoutMs = 20000): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) return response
      if (i < retries - 1) await delay(1000)
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url}:`, error)
        return null
      }
      await delay(1000)
    }
  }
  return null
}

// Get product listings from a single page (shop or category)
async function getProductListingsFromPage(pageNum: number, baseUrl: string = EPIC_SHOP_URL): Promise<ProductListing[]> {
  const url = pageNum === 1 ? baseUrl : `${baseUrl}page/${pageNum}/`
  console.log(`Fetching page ${pageNum} from ${url}...`)
  
  const response = await fetchWithRetry(url)
  if (!response) {
    console.error(`Failed to fetch page ${pageNum} from ${url}`)
    return []
  }
  
  const html = await response.text()
  const $ = cheerio.load(html)
  
  const products: ProductListing[] = []
  
  // Try multiple WooCommerce selectors (traditional + block editor + theme variations)
  const productSelectors = [
    'li.product',
    '.product.type-product',
    '.wc-block-grid__product',
    'ul.products > li',
    '.products .product',
  ]
  
  // Find the best selector that matches products
  let $products = $('li.product, .product.type-product, .wc-block-grid__product')
  
  // Fallback: if no products found, try broader selectors
  if ($products.length === 0) {
    $products = $('[class*="product"]').filter((_: number, el: any) => {
      // Only match elements that contain a product link
      return $(el).find('a[href*="/product/"]').length > 0
    })
  }
  
  console.log(`Found ${$products.length} product elements on page ${pageNum}`)
  
  $products.each((_: number, el: any) => {
    const $product = $(el)
    
    // Try multiple name selectors
    const name = (
      $product.find('.woocommerce-loop-product__title').first().text().trim() ||
      $product.find('.wc-block-grid__product-title').first().text().trim() ||
      $product.find('h2').first().text().trim() ||
      $product.find('h3').first().text().trim() ||
      $product.find('.product-title').first().text().trim() ||
      ''
    )
    
    // Try multiple link selectors
    const productUrl = (
      $product.find('a.woocommerce-LoopProduct-link').first().attr('href') ||
      $product.find('a.wc-block-grid__product-link').first().attr('href') ||
      $product.find('a[href*="/product/"]').first().attr('href') ||
      ''
    )
    
    // Try multiple image selectors
    const mainImage = (
      $product.find('img').attr('data-src') ||
      $product.find('img').attr('data-lazy-src') ||
      $product.find('img').attr('src') ||
      ''
    )
    
    // Handle sale prices - get the <ins> (sale) price first, then fall back to regular
    const salePriceText = $product.find('.price ins .woocommerce-Price-amount').first().text().trim()
    const regularPriceText = $product.find('.price .woocommerce-Price-amount').first().text().trim()
    const priceText = salePriceText || regularPriceText
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0
    
    if (name && productUrl && productUrl.includes('epiccomputers')) {
      products.push({ name, productUrl, mainImage, price })
    } else {
      console.log(`Skipped product element: name="${name}", url="${productUrl?.substring(0, 60)}"`)
    }
  })
  
  // Last resort: if still no products, extract directly from <a> tags linking to products
  if (products.length === 0) {
    console.log('No products found with standard selectors, trying direct link extraction...')
    const seenUrls = new Set<string>()
    
    $('a[href*="/product/"]').each((_: number, el: any) => {
      const $link = $(el)
      const href = $link.attr('href') || ''
      
      // Skip if already seen, or not an Epic link, or is an "Add to cart" button
      if (seenUrls.has(href) || !href.includes('epiccomputers') || $link.hasClass('add_to_cart_button')) return
      seenUrls.add(href)
      
      // Try to get product name from the link text or nearby elements
      const linkText = $link.text().trim()
      const imgAlt = $link.find('img').attr('alt') || ''
      const name = imgAlt || linkText.split(/\n/)[0]?.trim() || ''
      const mainImage = $link.find('img').attr('data-src') || $link.find('img').attr('src') || ''
      
      if (name && name.length > 3 && !name.toLowerCase().includes('add to cart')) {
        products.push({ name, productUrl: href, mainImage, price: 0 })
      }
    })
    
    console.log(`Direct extraction found ${products.length} products`)
  }
  
  return products
}

// Check if there's a next page
async function getTotalPages(baseUrl: string = EPIC_SHOP_URL): Promise<number> {
  const response = await fetchWithRetry(baseUrl)
  if (!response) return 1
  
  const html = await response.text()
  const $ = cheerio.load(html)
  
  // Try standard WooCommerce pagination
  let lastPageNum = $('.page-numbers:not(.next):not(.prev)').last().text()
  if (parseInt(lastPageNum)) return parseInt(lastPageNum)
  
  // Try alternative pagination selectors
  lastPageNum = $('nav.woocommerce-pagination .page-numbers:not(.next):not(.prev)').last().text()
  if (parseInt(lastPageNum)) return parseInt(lastPageNum)
  
  // Try extracting from "Showing 1-12 of X results" text
  const resultCount = $('.woocommerce-result-count').text()
  const totalMatch = resultCount.match(/of\s+(\d+)\s+results/i)
  if (totalMatch) {
    const totalProducts = parseInt(totalMatch[1])
    const perPage = 12 // WooCommerce default
    return Math.ceil(totalProducts / perPage)
  }
  
  // Check for any next page link
  const nextPageLink = $('a.next, .page-numbers.next').attr('href')
  if (nextPageLink) return 2 // At minimum 2 pages
  
  console.log(`Could not determine total pages for ${baseUrl}, defaulting to 1`)
  return 1
}

// Scrape detailed product information from a product page
async function scrapeProductDetail(listing: ProductListing): Promise<ProductDetail | null> {
  try {
    const response = await fetchWithRetry(listing.productUrl)
    if (!response) return null
    
    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract product name
    const name = $('.product_title, .entry-title').first().text().trim() || listing.name

    // Extract main image
    const mainImage = 
      $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
      $('.woocommerce-product-gallery__image img').first().attr('data-src') ||
      $('.woocommerce-product-gallery__image img').first().attr('src') ||
      $('.wp-post-image').first().attr('src') || 
      listing.mainImage

    // Extract swatch/gallery images (limit to 5)
    const swatchImages: string[] = []
    $('.woocommerce-product-gallery__image img').slice(0, 5).each((_: number, el: any) => {
      const largeImage = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src')
      if (largeImage && !swatchImages.includes(largeImage)) {
        swatchImages.push(largeImage)
      }
    })

    // Extract description (truncate to save memory)
    const shortDesc = $('.woocommerce-product-details__short-description').text().trim()
    const fullDesc = $('#tab-description').text().trim()
    const description = (shortDesc || fullDesc || '').substring(0, 800)

    // Extract price
    const priceText = $('.price .woocommerce-Price-amount').first().text().trim()
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || listing.price

    // Extract stock status
    const stockText = $('.stock, .availability').text().toLowerCase()
    const stock = stockText.includes('out of stock') ? 0 : 10

    // Extract category
    const category = $('.posted_in a').first().text().trim() || 'Computers & Electronics'

    // Extract SKU
    const sku = $('.sku').text().trim()

    // Extract features (limit to 8)
    const features: string[] = []
    $('.woocommerce-product-attributes tr').slice(0, 8).each((_: number, el: any) => {
      const label = $(el).find('th').text().trim()
      const value = $(el).find('td').text().trim()
      if (label && value) {
        features.push(`${label}: ${value}`)
      }
    })

    return {
      name,
      mainImage: mainImage || '',
      swatchImages,
      description,
      price,
      stock,
      category,
      sku,
      features,
      sourceUrl: listing.productUrl
    }
  } catch (error) {
    console.error(`Error scraping ${listing.productUrl}:`, error)
    return null
  }
}

// POST endpoint - scrape products from Epic Computers (optionally by category)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const startPage = body.startPage || 1
    const endPage = body.endPage || null // null means all pages
    const categorySlug = body.categorySlug || '' // empty = all from shop
    const MAX_PRODUCTS = body.maxProducts || DEFAULT_MAX_PRODUCTS
    
    // Determine the base URL based on category
    const scrapeBaseUrl = categorySlug
      ? `${EPIC_CATEGORY_URL}${categorySlug}/`
      : EPIC_SHOP_URL
    
    console.log(`Starting Epic Computers product scrape...`)
    console.log(`Category: ${categorySlug || 'All (shop)'}, Max products: ${MAX_PRODUCTS}`)
    console.log(`Base URL: ${scrapeBaseUrl}`)
    
    // Get total pages
    const totalPages = await getTotalPages(scrapeBaseUrl)
    const pagesToScrape = endPage ? Math.min(endPage, totalPages) : totalPages
    console.log(`Total pages: ${totalPages}, scraping pages ${startPage} to ${pagesToScrape}`)
    
    // Collect product listings (limited to MAX_PRODUCTS)
    const allListings: ProductListing[] = []
    
    for (let page = startPage; page <= pagesToScrape; page++) {
      const listings = await getProductListingsFromPage(page, scrapeBaseUrl)
      allListings.push(...listings)
      console.log(`Page ${page}: Found ${listings.length} products (Total: ${allListings.length})`)
      
      // Stop if we have enough products
      if (allListings.length >= MAX_PRODUCTS) {
        console.log(`Reached limit of ${MAX_PRODUCTS} products`)
        break
      }
      
      if (page < pagesToScrape) {
        await delay(REQUEST_DELAY)
      }
    }
    
    // Limit to MAX_PRODUCTS
    const limitedListings = allListings.slice(0, MAX_PRODUCTS)
    
    console.log(`\nTotal products to scrape: ${limitedListings.length}`)
    console.log('Scraping product details...\n')
    
    // Scrape details in batches
    const detailedProducts: ProductDetail[] = []
    const errors: string[] = []
    
    for (let i = 0; i < limitedListings.length; i += BATCH_SIZE) {
      const batch = limitedListings.slice(i, i + BATCH_SIZE)
      const batchNum = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(limitedListings.length / BATCH_SIZE)
      
      console.log(`Processing batch ${batchNum}/${totalBatches}...`)
      
      for (const listing of batch) {
        console.log(`  Scraping: ${listing.name.substring(0, 50)}...`)
        
        const detail = await scrapeProductDetail(listing)
        
        if (detail) {
          detailedProducts.push(detail)
        } else {
          errors.push(`Failed: ${listing.name}`)
        }
        
        await delay(REQUEST_DELAY)
      }
    }
    
    console.log(`\nScrape complete: ${detailedProducts.length} products, ${errors.length} failures`)

    // Save products directly to database
    const supabase = getSupabaseClient()
    let savedCount = 0
    let skippedCount = 0
    const saveErrors: string[] = []

    // Get existing product names to avoid duplicates
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name')
    
    const existingNames = new Set(
      (existingProducts || []).map(p => p.name.toLowerCase().trim())
    )

    // Get categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('name')
    
    const categoryNames = (categoriesData || []).map(c => c.name)
    const defaultCategory = categoryNames[0] || 'Computers & Electronics'

    console.log(`\nSaving products to database...`)
    console.log(`Existing products: ${existingNames.size}`)

    for (const product of detailedProducts) {
      // Skip if product already exists
      if (existingNames.has(product.name.toLowerCase().trim())) {
        skippedCount++
        continue
      }

      // Find matching category or use default
      const matchedCategory = categoryNames.find(c => 
        c.toLowerCase() === (product.category || '').toLowerCase()
      ) || defaultCategory

      const productData = {
        name: product.name,
        category: matchedCategory,
        price: product.price || 0,
        image: product.mainImage || '',
        description: product.description || '',
        features: product.features || [],
        stock: product.stock || 10,
        rating: 4.5,
        swatch_images: product.swatchImages || [],
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert([productData])

      if (insertError) {
        saveErrors.push(`${product.name}: ${insertError.message}`)
        console.error(`Error saving ${product.name}:`, insertError.message)
      } else {
        savedCount++
        console.log(`  Saved: ${product.name}`)
      }
    }

    console.log(`\nImport complete: ${savedCount} saved, ${skippedCount} skipped, ${saveErrors.length} errors`)

    return NextResponse.json({
      count: detailedProducts.length,
      status: 'success',
      saved: savedCount,
      skipped: skippedCount,
      totalPages,
      scrapedPages: pagesToScrape - startPage + 1,
      listingsFound: allListings.length,
      scrapeUrl: scrapeBaseUrl,
      errors: [...errors, ...saveErrors].length > 0 ? [...errors, ...saveErrors] : undefined
    })
  } catch (error) {
    console.error('Error in scrape:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint - preview products from a single page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    
    const listings = await getProductListingsFromPage(page)
    const totalPages = await getTotalPages()
    
    return NextResponse.json({
      page,
      totalPages,
      hasNextPage: page < totalPages,
      count: listings.length,
      products: listings
    })
  } catch (error) {
    console.error('Error in GET endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
