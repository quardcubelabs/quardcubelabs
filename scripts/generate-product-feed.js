// Script to generate static Google Merchant product feed
// Run this script after updating products: node scripts/generate-product-feed.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quardcube.vercel.app'

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeUrl(url) {
  if (!url) return ''
  return String(url).replace(/&/g, '&amp;')
}

function truncateDescription(desc) {
  if (!desc) return 'Professional electronics and tech solutions from QuadCube Labs'
  const cleaned = String(desc).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  return cleaned.length > 5000 ? cleaned.substring(0, 4997) + '...' : cleaned
}

function resolveImageUrl(url) {
  if (!url) return `${SITE_URL}/turquoise.png`
  if (url.startsWith('http')) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function buildProductItem(product) {
  const lines = []
  
  lines.push(`    <item>`)
  lines.push(`      <g:id>QCL_${product.id}</g:id>`)
  lines.push(`      <g:title>${escapeXml(product.name)}</g:title>`)
  lines.push(`      <g:description>${escapeXml(truncateDescription(product.description))}</g:description>`)
  lines.push(`      <g:link>${escapeUrl(SITE_URL)}/shop/product/${product.id}</g:link>`)
  
  // Main image
  const mainImage = resolveImageUrl(product.image)
  lines.push(`      <g:image_link>${escapeUrl(mainImage)}</g:image_link>`)
  
  // Additional images
  if (Array.isArray(product.swatch_images)) {
    product.swatch_images.slice(0, 10).forEach((img) => {
      if (img) {
        const imageUrl = resolveImageUrl(img)
        lines.push(`      <g:additional_image_link>${escapeUrl(imageUrl)}</g:additional_image_link>`)
      }
    })
  }
  
  lines.push(`      <g:condition>new</g:condition>`)
  lines.push(`      <g:availability>${(product.stock || 0) > 0 ? 'in stock' : 'out of stock'}</g:availability>`)
  lines.push(`      <g:price>${product.price.toFixed(2)} TZS</g:price>`)
  lines.push(`      <g:brand>${escapeXml(product.brand || 'QuadCube Labs')}</g:brand>`)
  lines.push(`      <g:mpn>${escapeXml(product.sku || `QCL-${product.id}`)}</g:mpn>`)
  
  // GTIN (Global Trade Item Number) - Required by Google if available
  if (product.gtin) {
    lines.push(`      <g:gtin>${escapeXml(product.gtin)}</g:gtin>`)
  } else {
    lines.push(`      <g:identifier_exists>false</g:identifier_exists>`)
  }
  
  // Category
  lines.push(`      <g:product_type>${escapeXml(product.category || 'Electronics')}</g:product_type>`)
  lines.push(`      <g:google_product_category>Electronics</g:google_product_category>`)
  
  // Custom labels for better organization
  if (product.rating) {
    lines.push(`      <g:custom_label_0>${product.rating >= 4.5 ? 'Top Rated' : product.rating >= 4 ? 'Highly Rated' : 'Quality Product'}</g:custom_label_0>`)
  }
  lines.push(`      <g:custom_label_1>${product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Limited Stock' : 'Out of Stock'}</g:custom_label_1>`)
  
  // Product highlights (features)
  if (Array.isArray(product.features)) {
    product.features.slice(0, 5).forEach((feature) => {
      if (feature) {
        lines.push(`      <g:product_highlight>${escapeXml(feature)}</g:product_highlight>`)
      }
    })
  }
  
  // Shipping - Tanzania
  lines.push(`      <g:shipping>`)
  lines.push(`        <g:country>TZ</g:country>`)
  lines.push(`        <g:service>Standard</g:service>`)
  lines.push(`        <g:price>20000.00 TZS</g:price>`)
  lines.push(`      </g:shipping>`)
  
  lines.push(`    </item>`)
  
  return lines.join('\n')
}

async function generateFeed() {
  try {
    console.log('🚀 Starting product feed generation...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Check your .env.local file.')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('📦 Fetching products from database...')
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('id')
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    if (!products || products.length === 0) {
      throw new Error('No products found in database')
    }
    
    console.log(`✅ Found ${products.length} products`)
    
    // Filter valid products (must have name and price)
    const validProducts = products.filter(p => p.name && p.price > 0)
    console.log(`✅ ${validProducts.length} valid products (name + price > 0)`)
    
    // Build product items
    console.log('🔨 Building XML feed...')
    const productItems = validProducts.map(product => {
      try {
        return buildProductItem(product)
      } catch (e) {
        console.error(`⚠️  Error building feed item for product ${product.id}:`, e.message)
        return ''
      }
    }).filter(Boolean).join('\n')
    
    // Build complete XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>QuadCube Labs - Premium Electronics &amp; Tech Solutions</title>
    <link>${escapeUrl(SITE_URL)}</link>
    <description>Professional electronics, computers, and tech solutions from QuadCube Labs - Tanzania's leading technology provider</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${productItems}
  </channel>
</rss>`
    
    // Write to public folder
    const publicPath = path.join(__dirname, '..', 'public', 'products.xml')
    fs.writeFileSync(publicPath, xml, 'utf-8')
    
    console.log(`✅ Product feed generated successfully!`)
    console.log(`📁 File location: ${publicPath}`)
    console.log(`📊 Total products in feed: ${validProducts.length}`)
    console.log(`🌐 Feed URL: ${SITE_URL}/products.xml`)
    console.log(`\n📋 Next steps:`)
    console.log(`1. Deploy to Vercel to make the feed live`)
    console.log(`2. Add this URL to Google Merchant Center: ${SITE_URL}/products.xml`)
    console.log(`3. Test the feed at: ${SITE_URL}/products.xml`)
    
  } catch (error) {
    console.error('❌ Error generating product feed:', error.message)
    process.exit(1)
  }
}

generateFeed()
