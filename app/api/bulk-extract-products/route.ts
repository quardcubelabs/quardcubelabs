import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import {
  EPIC_BASE_URL,
  EPIC_SHOP_URL,
  EPIC_CATEGORY_URL,
  USER_AGENT,
  delay,
  fetchWithRetry,
  parsePriceFromElement,
  getEpicShopTotalPages,
  scrapeProductListingsFromPage,
  getSupabaseServiceClient,
  syncAllProductPrices,
  applyPriceCut,
  EPIC_PRICE_CUT_TZS,
  type EpicProductListing
} from '@/lib/epic-scraper'

const REQUEST_DELAY = 1000
const BATCH_SIZE = 5
const DEFAULT_MAX_PRODUCTS = 60

interface ProductDetail {
  name: string
  mainImage: string
  swatchImages: string[]
  description: string
  price: number // Selling price (including constant 20k TZS cut)
  rawPrice?: number // Scraped base price from Epic Computers
  cutAdded?: number // 20k TZS cut
  stock: number
  category: string
  sku: string
  features: string[]
  sourceUrl?: string
}

// Scrape detailed product information from a product page
async function scrapeProductDetail(listing: EpicProductListing): Promise<ProductDetail | null> {
  try {
    const response = await fetchWithRetry(listing.link)
    if (!response) return null

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract product name
    const name = $('.product_title, .entry-title, h1').first().text().trim() || listing.title

    // Extract main image
    const mainImage =
      $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
      $('.woocommerce-product-gallery__image img').first().attr('data-src') ||
      $('.woocommerce-product-gallery__image img').first().attr('src') ||
      $('.wp-post-image').first().attr('src') ||
      listing.image

    // Extract swatch/gallery images (limit to 5)
    const swatchImages: string[] = []
    $('.woocommerce-product-gallery__image img').slice(0, 5).each((_: number, el: any) => {
      const largeImage = $(el).attr('data-large_image') || $(el).attr('data-src') || $(el).attr('src')
      if (largeImage && !swatchImages.includes(largeImage)) {
        swatchImages.push(largeImage)
      }
    })

    // Extract description
    const shortDesc = $('.woocommerce-product-details__short-description').text().trim()
    const fullDesc = $('#tab-description').text().trim()
    const description = (shortDesc || fullDesc || '').substring(0, 1000)

    // Extract price (handles sale/ins prices) and apply 20,000 TZS cut
    const scrapedRawPrice = parsePriceFromElement($)
    const rawPrice = scrapedRawPrice > 0
      ? scrapedRawPrice
      : (listing.rawPrice || (listing.price > EPIC_PRICE_CUT_TZS ? listing.price - EPIC_PRICE_CUT_TZS : listing.price))
    const price = applyPriceCut(rawPrice)

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
      rawPrice: rawPrice > 0 ? rawPrice : 0,
      cutAdded: price > 0 ? EPIC_PRICE_CUT_TZS : 0,
      stock,
      category,
      sku,
      features,
      sourceUrl: listing.link,
    }
  } catch (error) {
    console.error(`Error scraping ${listing.link}:`, error)
    return null
  }
}

// POST endpoint - scrape products from Epic Computers (with price update support)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // If request asks to update prices directly
    if (body.action === 'update-prices' || body.syncPrices) {
      const result = await syncAllProductPrices({
        dryRun: !!body.dryRun,
        userEmail: body.userEmail,
        userName: body.userName,
      })
      return NextResponse.json(result)
    }

    const startPage = body.startPage || 1
    const endPage = body.endPage || null
    const categorySlug = body.categorySlug || ''
    const MAX_PRODUCTS = body.maxProducts || DEFAULT_MAX_PRODUCTS
    const updateExisting = body.updateExisting !== false // default true: update existing prices instead of ignoring

    // Determine base URL based on category
    const scrapeBaseUrl = categorySlug
      ? `${EPIC_CATEGORY_URL}${categorySlug}/`
      : EPIC_SHOP_URL

    // Get total pages
    const totalPages = await getEpicShopTotalPages(scrapeBaseUrl)
    const pagesToScrape = endPage ? Math.min(endPage, totalPages) : totalPages

    // Collect product listings
    const allListings: EpicProductListing[] = []

    for (let page = startPage; page <= pagesToScrape; page++) {
      const listings = await scrapeProductListingsFromPage(page, scrapeBaseUrl)
      allListings.push(...listings)

      if (allListings.length >= MAX_PRODUCTS) {
        break
      }

      if (page < pagesToScrape) {
        await delay(REQUEST_DELAY)
      }
    }

    const limitedListings = allListings.slice(0, MAX_PRODUCTS)

    // Scrape details in batches
    const detailedProducts: ProductDetail[] = []
    const errors: string[] = []

    for (let i = 0; i < limitedListings.length; i += BATCH_SIZE) {
      const batch = limitedListings.slice(i, i + BATCH_SIZE)

      for (const listing of batch) {
        const detail = await scrapeProductDetail(listing)
        if (detail) {
          detailedProducts.push(detail)
        } else {
          errors.push(`Failed: ${listing.title}`)
        }
        await delay(REQUEST_DELAY)
      }
    }

    // Save/Update products directly in database
    const supabase = getSupabaseServiceClient()
    let savedCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const saveErrors: string[] = []

    // Get existing products with id, name, and price
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, name, price')

    const existingMap = new Map<string, { id: number; price: number }>()
    ;(existingProducts || []).forEach((p) => {
      existingMap.set(p.name.toLowerCase().trim(), { id: p.id, price: Number(p.price) || 0 })
    })

    // Get categories
    const { data: categoriesData } = await supabase.from('categories').select('name')
    const categoryNames = (categoriesData || []).map((c) => c.name)
    const defaultCategory = categoryNames[0] || 'Computers & Electronics'

    for (const product of detailedProducts) {
      const key = product.name.toLowerCase().trim()
      const existing = existingMap.get(key)

      // If product exists
      if (existing) {
        if (updateExisting && existing.price !== product.price && product.price > 0) {
          // Update product price & stock in DB
          const { error: updateError } = await supabase
            .from('products')
            .update({
              price: product.price,
              stock: product.stock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (updateError) {
            saveErrors.push(`Update ${product.name}: ${updateError.message}`)
          } else {
            updatedCount++
          }
        } else {
          skippedCount++
        }
        continue
      }

      // If product does not exist, insert it
      let matchedCategory =
        categoryNames.find(
          (c) => c.toLowerCase() === (product.category || '').toLowerCase()
        )

      if (!matchedCategory) {
        const rawCat = (product.category || '').toLowerCase()
        const rawSlug = (categorySlug || '').toLowerCase()
        const pName = (product.name || '').toLowerCase()

        if (rawSlug === 'cash-counting-machines' || rawCat.includes('cash counting') || pName.includes('cash counting') || pName.includes('money counter')) {
          matchedCategory = categoryNames.find(c => c.toLowerCase() === 'cash counting machines') || 'Cash Counting Machines'
        } else if (rawSlug === 'powerstations' || rawSlug === 'power-backup/powerstations' || rawCat.includes('powerstation') || pName.includes('power station') || pName.includes('powerstation')) {
          matchedCategory = categoryNames.find(c => c.toLowerCase() === 'powerstations') || 'Powerstations'
        } else if (rawSlug === 'ups' || rawSlug === 'power-backup/ups' || rawCat === 'ups' || rawCat.includes('ups') || pName.includes(' ups ')) {
          matchedCategory = categoryNames.find(c => c.toLowerCase() === 'ups') || 'UPS'
        } else if (rawSlug === 'tablets' || rawCat.includes('tablet') || pName.includes('tablet') || pName.includes('ipad')) {
          matchedCategory = categoryNames.find(c => c.toLowerCase() === 'tablets') || 'Tablets'
        } else if (rawSlug.startsWith('software') || rawCat.includes('software') || rawCat.includes('anti-virus') || rawCat.includes('operating systems') || rawCat.includes('office')) {
          matchedCategory = categoryNames.find(c => c.toLowerCase() === 'software') || 'Software'
        } else if (rawSlug.startsWith('digital-codes') || rawCat.includes('digital code') || rawCat.includes('gift card') || pName.includes('gift card')) {
          matchedCategory = categoryNames.find(c => c.toLowerCase() === 'digital codes') || 'Digital Codes'
        } else if (categorySlug) {
          const directSlugMatch = categoryNames.find(
            (c) => c.toLowerCase().replace(/[^a-z0-9]/g, '') === categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '')
          )
          if (directSlugMatch) matchedCategory = directSlugMatch
        }
      }

      if (!matchedCategory) {
        matchedCategory = defaultCategory
      }

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

      const { error: insertError } = await supabase.from('products').insert([productData])

      if (insertError) {
        saveErrors.push(`${product.name}: ${insertError.message}`)
        console.error(`Error saving ${product.name}:`, insertError.message)
      } else {
        savedCount++
      }
    }

    return NextResponse.json({
      count: detailedProducts.length,
      status: 'success',
      saved: savedCount,
      updated: updatedCount,
      skipped: skippedCount,
      totalPages,
      scrapedPages: pagesToScrape - startPage + 1,
      listingsFound: allListings.length,
      scrapeUrl: scrapeBaseUrl,
      errors: [...errors, ...saveErrors].length > 0 ? [...errors, ...saveErrors] : undefined,
    })
  } catch (error) {
    console.error('Error in bulk scrape:', error)
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

    const listings = await scrapeProductListingsFromPage(page, EPIC_SHOP_URL)
    const totalPages = await getEpicShopTotalPages(EPIC_SHOP_URL)

    return NextResponse.json({
      page,
      totalPages,
      hasNextPage: page < totalPages,
      count: listings.length,
      products: listings,
    })
  } catch (error) {
    console.error('Error in GET endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
