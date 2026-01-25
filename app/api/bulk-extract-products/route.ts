import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Helper to delay requests to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) return null

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract product name
    const name = $('.product_title').text().trim() ||
                 $('h1.entry-title').text().trim() || ''

    // Main image - get the full-size image
    const mainImage = $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
                      $('.woocommerce-product-gallery__image img').first().attr('data-src') ||
                      $('.woocommerce-product-gallery__image img').first().attr('src') ||
                      $('.wp-post-image').first().attr('src') || ''

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

    // Description - get both short and full description
    let description = ''
    const shortDesc = $('.woocommerce-product-details__short-description').text().trim()
    const fullDesc = $('#tab-description .woocommerce-Tabs-panel--description').text().trim() ||
                     $('#tab-description').text().trim() ||
                     $('.product-description').text().trim()
    
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
    const priceText = salePriceText || regularPriceText
    
    if (priceText) {
      // Remove currency symbols and commas, extract number
      price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0
    }

    // Category
    const category = $('.posted_in a').first().text().trim() || 'Uncategorized'

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

    // Fetch all shop pages to get product URLs
    while (hasMorePages && page <= 10) { // Max 10 pages to avoid infinite loops
      console.log(`Fetching shop page ${page}...`)
      
      const shopUrl = `https://epiccomputers.co.tz/index.php/shop/page/${page}/`
      const response = await fetch(shopUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })

      if (!response.ok) {
        if (page === 1) {
          // Try the base shop URL if page 1 fails
          const baseResponse = await fetch('https://epiccomputers.co.tz/index.php/shop/', {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          })
          if (!baseResponse.ok) {
            return NextResponse.json(
              { error: 'Failed to fetch shop page from Epic Computers' },
              { status: 500 }
            )
          }
        }
        hasMorePages = false
        break
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract product listings from this page
      let productsOnPage = 0
      $('.product, .products .product, li.product').each((_, el) => {
        const $product = $(el)
        
        const productUrl = $product.find('a.woocommerce-LoopProduct-link').attr('href') ||
                           $product.find('a').first().attr('href') || ''
        
        const name = $product.find('.woocommerce-loop-product__title').text().trim() ||
                     $product.find('.product-title').text().trim() ||
                     $product.find('h2').text().trim() ||
                     $product.find('h3').text().trim()
        
        const priceText = $product.find('.price .woocommerce-Price-amount').first().text().trim()
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0
        
        const category = $product.find('.product-category').text().trim() || ''

        if (productUrl && name && !productUrls.some(p => p.url === productUrl)) {
          productUrls.push({ url: productUrl, name, price, category })
          productsOnPage++
        }
      })

      console.log(`Found ${productsOnPage} products on page ${page}`)

      // Check if there's a next page
      const nextPageLink = $('.next.page-numbers').attr('href')
      hasMorePages = !!nextPageLink && productsOnPage > 0
      page++

      // Small delay between page requests
      await delay(500)
    }

    console.log(`Total product URLs found: ${productUrls.length}`)

    // Now fetch detailed info for each product
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < productUrls.length; i++) {
      const { url, name: listName, price: listPrice, category: listCategory } = productUrls[i]
      
      console.log(`Fetching details for product ${i + 1}/${productUrls.length}: ${listName}`)
      
      const details = await fetchProductDetails(url)
      
      if (details) {
        allProducts.push({
          name: details.name || listName,
          mainImage: details.mainImage,
          swatchImages: details.swatchImages,
          description: details.description,
          price: details.price || listPrice,
          stock: 10, // Default stock since Epic doesn't show stock numbers
          category: details.category || listCategory || 'Uncategorized',
          productUrl: url
        })
        successCount++
      } else {
        // If we couldn't fetch details, still add with basic info
        allProducts.push({
          name: listName,
          mainImage: '',
          swatchImages: [],
          description: '',
          price: listPrice,
          stock: 10,
          category: listCategory || 'Uncategorized',
          productUrl: url
        })
        failCount++
      }

      // Delay between product requests to avoid rate limiting
      if (i < productUrls.length - 1) {
        await delay(300)
      }
    }

    console.log(`Bulk extraction complete. Success: ${successCount}, Failed: ${failCount}`)

    return NextResponse.json({
      count: allProducts.length,
      status: 'success',
      successCount,
      failCount,
      products: allProducts
    })
  } catch (error) {
    console.error('Error bulk extracting products:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
