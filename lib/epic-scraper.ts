import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import { logAuditEvent } from './audit-actions'
import { revalidatePath } from 'next/cache'

export const EPIC_BASE_URL = 'https://epiccomputers.co.tz'
export const EPIC_SHOP_URL = `${EPIC_BASE_URL}/shop-2/`
export const EPIC_CATEGORY_URL = `${EPIC_BASE_URL}/product-category/`
export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Constant profit margin cut of 20,000 Tanzanian Shillings (TZS) added to every product
 * after successfully fetching its current live price from Epic Computers.
 */
export const EPIC_PRICE_CUT_TZS = 20000

/**
 * Accurately apply the constant 20,000 TZS cut to a successfully fetched Epic Computers base price.
 * - If rawPrice is 0, negative, undefined, or invalid: returns 0 (preserves unpriced/unavailable state).
 * - If rawPrice is positive: accurately adds 20,000 TZS and rounds to the nearest whole integer shilling.
 */
export function applyPriceCut(rawPrice: number | string | null | undefined): number {
  if (rawPrice === null || rawPrice === undefined) return 0
  const num = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : Number(rawPrice)
  if (isNaN(num) || !isFinite(num) || num <= 0) return 0
  return Math.round(num + EPIC_PRICE_CUT_TZS)
}

export interface EpicProductListing {
  title: string
  link: string
  price: number // Final catalog selling price (including +20,000 TZS cut)
  rawPrice?: number // Live base price directly from Epic Computers
  cutAdded?: number // Exact cut added (20,000 TZS)
  image: string
  imgSlug?: string
  tokens?: string[]
  norm?: string
  codes?: string[]
}

export interface PriceUpdateItem {
  id: number
  name: string
  oldPrice: number
  newPrice: number // Final catalog selling price (with +20,000 TZS cut)
  rawEpicPrice?: number // Live base price on Epic Computers
  cutAdded?: number // Exact cut added (20,000 TZS)
  difference: number
  percentageChange: number
  epicTitle: string
  epicUrl: string
  matchType: string
}

export interface SyncPricesResult {
  success: boolean
  dryRun: boolean
  summary: {
    totalInDatabase: number
    scrapedFromEpic: number
    matched: number
    updated: number
    unchanged: number
    unmatched: number
  }
  updatedProducts: PriceUpdateItem[]
  unchangedProducts: Array<{ id: number; name: string; price: number; epicTitle: string }>
  unmatchedProducts: Array<{ id: number; name: string; currentPrice: number; category: string }>
  error?: string
}

export interface EpicCatalogSyncSummary {
  totalInDatabase: number
  scrapedFromEpic: number
  matched: number
  updated: number
  added: number
  unlisted: number
  unchanged: number
}

export interface AddedProductItem {
  name: string
  category: string
  price: number // with +20k TZS cut applied
  rawEpicPrice: number
  cutAdded: number // 20,000 TZS
  image: string
  epicUrl: string
}

export interface UnlistedProductItem {
  id: number
  name: string
  price: number
  category: string
  image?: string
  reason: string
}

export interface EpicCatalogSyncResult {
  success: boolean
  dryRun: boolean
  summary: EpicCatalogSyncSummary
  addedProducts: AddedProductItem[]
  updatedProducts: PriceUpdateItem[]
  unlistedProducts: UnlistedProductItem[]
  unchangedProducts: Array<{ id: number; name: string; price: number; epicTitle: string }>
  error?: string
}

// Create Supabase service role client
export function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  return createClient(supabaseUrl, supabaseKey)
}

// Delay helper
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Fetch with retry and timeout
 */
export async function fetchWithRetry(
  url: string,
  retries = 2,
  timeoutMs = 20000
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      })

      clearTimeout(timeoutId)

      if (response.ok) return response
      if (i < retries - 1) await delay(800)
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url}:`, error)
        return null
      }
      await delay(800)
    }
  }
  return null
}

/**
 * Clean & normalize text for title comparisons
 */
export function normalizeText(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[″”"''`]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract key specs/model numbers (e.g. 16gb, 1tb, i7, rtx 4060, g7, 1040)
 * This prevents mismatching different laptop models or capacities.
 */
export function extractNumbersAndCodes(str: string): string[] {
  if (!str) return []
  const norm = str.toLowerCase()
  const matches =
    norm.match(
      /\b(\d+gb|\d+tb|\d+m|\d+va|\d+w|i[3579]|ryzen\s*[3579]|rtx\s*\d{4}|gtx\s*\d{4}|g\d{1,2}|\d{3,5}[a-z]*)\b/gi
    ) || []
  return matches.map((m) => m.replace(/\s+/g, ''))
}

/**
 * Tokenize string into words
 */
export function getTokens(str: string): string[] {
  if (!str) return []
  const stopWords = new Set(['the', 'and', 'with', 'for', 'in', 'of', 'to', 'laptop', 'desktop', 'pc', 'inch'])
  return normalizeText(str)
    .split(' ')
    .filter((t) => t.length > 1 && !stopWords.has(t))
}

/**
 * Dice / Jaccard token similarity score between 0 and 1
 */
export function tokenSimilarity(tokens1: string[], tokens2: string[]): number {
  if (!tokens1.length || !tokens2.length) return 0
  const set2 = new Set(tokens2)
  let intersection = 0
  for (const t of tokens1) {
    if (set2.has(t)) intersection++
  }
  return (2 * intersection) / (tokens1.length + tokens2.length)
}

/**
 * Extract clean image slug for matching
 */
export function extractImageSlug(url?: string): string {
  if (!url) return ''
  const match = url.match(/\/uploads\/\d{4}\/\d{2}\/([^/?#]+)/i)
  if (!match) return ''
  const name = match[1]
    .toLowerCase()
    .replace(/-\d+x\d+/, '')
    .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
  const generic = [
    'untitled',
    'design',
    'images',
    'image',
    'photo',
    'artboard',
    'copy',
    '4gb-ram',
    'hdmi-cable',
    'laptop',
  ]
  if (generic.some((g) => name === g || name.startsWith(g))) return ''
  return name.length > 8 ? name : ''
}

/**
 * Extract numeric price from price element HTML or text, handling sales & currency formatting
 */
export function parsePriceFromElement($el: cheerio.Cheerio<any>): number {
  // If item is on sale, WooCommerce has <ins><span class="woocommerce-Price-amount">...</span></ins>
  const ins = $el.find('.price ins .woocommerce-Price-amount, ins .amount').first().text().trim()
  const regular = $el.find('.price .woocommerce-Price-amount, .price .amount').first().text().trim()
  const rawText = ins || regular || $el.find('.price, [class*="price"]').first().text().trim()

  const clean = rawText.replace(/[^0-9]/g, '')
  return parseFloat(clean) || 0
}

/**
 * Scrape product listings from a single shop or category page
 */
export async function scrapeProductListingsFromPage(
  pageNum: number,
  baseUrl: string = EPIC_SHOP_URL
): Promise<EpicProductListing[]> {
  const url = pageNum === 1 ? baseUrl : `${baseUrl}page/${pageNum}/`

  const response = await fetchWithRetry(url)
  if (!response) {
    console.error(`Failed to fetch page ${pageNum} from ${url}`)
    return []
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const items: EpicProductListing[] = []

  // Try Porto theme and WooCommerce selectors
  const $products = $('.type-product, .porto-tb-item.product, li.product, .product')

  $products.each((_, el) => {
    const $p = $(el)
    const title =
      $p.find('.woocommerce-loop-product__title, h2, h3, h4, .product-title').first().text().trim()
    const link =
      $p.find('a.woocommerce-LoopProduct-link, a[href*="/product/"]').first().attr('href') || ''
    const rawPrice = parsePriceFromElement($p)
    const img =
      $p.find('img').attr('data-src') ||
      $p.find('img').attr('data-lazy-src') ||
      $p.find('img').attr('src') ||
      ''

    // Successfully fetched positive price from Epic Computers
    if (title && rawPrice > 0 && link.includes('epiccomputers')) {
      const finalPrice = applyPriceCut(rawPrice)
      items.push({
        title,
        link,
        rawPrice,
        cutAdded: EPIC_PRICE_CUT_TZS,
        price: finalPrice,
        image: img,
        imgSlug: extractImageSlug(img),
        tokens: getTokens(title),
        norm: normalizeText(title),
        codes: extractNumbersAndCodes(title),
      })
    }
  })

  return items
}

/**
 * Detect total number of pages on Epic Computers shop
 */
export async function getEpicShopTotalPages(baseUrl: string = EPIC_SHOP_URL): Promise<number> {
  const response = await fetchWithRetry(baseUrl)
  if (!response) return 1

  const html = await response.text()
  const $ = cheerio.load(html)

  let maxPage = 1
  $('.page-numbers, .pagination a, nav.woocommerce-pagination a').each((_, el) => {
    const text = $(el).text().trim()
    const num = parseInt(text, 10)
    if (!isNaN(num) && num > maxPage) maxPage = num
  })

  return maxPage > 1 ? maxPage : 32 // Fallback to 32 known pages if pagination selector changed
}

/**
 * Scrape all products currently listed on Epic Computers shop.
 * Runs in parallel batches of 6 pages for fast and polite retrieval (~10-15 seconds total).
 */
export async function scrapeAllEpicListings(): Promise<EpicProductListing[]> {
  const maxPages = await getEpicShopTotalPages()
  const allItems: EpicProductListing[] = []
  const batchSize = 6

  for (let i = 1; i <= maxPages; i += batchSize) {
    const pageBatch: number[] = []
    for (let p = i; p < i + batchSize && p <= maxPages; p++) {
      pageBatch.push(p)
    }

    const batchResults = await Promise.all(
      pageBatch.map(async (page) => {
        try {
          return await scrapeProductListingsFromPage(page, EPIC_SHOP_URL)
        } catch (err) {
          console.error(`Error scraping page ${page}:`, err)
          return []
        }
      })
    )

    allItems.push(...batchResults.flat())

    if (i + batchSize <= maxPages) {
      await delay(300) // Small polite delay between batches
    }
  }

  // Deduplicate by URL or title
  const seenUrls = new Set<string>()
  const uniqueItems: EpicProductListing[] = []
  for (const item of allItems) {
    if (!seenUrls.has(item.link)) {
      seenUrls.add(item.link)
      uniqueItems.push(item)
    }
  }

  return uniqueItems
}

/**
 * Safe multi-tiered matcher to connect a database product to an Epic Computers listing
 */
export function findMatchingEpicProduct(
  dbProduct: { name: string; price: number; image?: string },
  epicItems: EpicProductListing[]
): { match: EpicProductListing | null; matchType: string } {
  const pTokens = getTokens(dbProduct.name)
  const pImgSlug = extractImageSlug(dbProduct.image)
  const pNorm = normalizeText(dbProduct.name)
  const pCodes = extractNumbersAndCodes(dbProduct.name)

  // Tier 1: Exact Normalized Title Match
  const exact = epicItems.find((e) => e.norm === pNorm)
  if (exact) {
    return { match: exact, matchType: 'exact_norm' }
  }

  // Tier 2: Token Similarity with Strict Spec Consistency
  let bestTokenMatch: EpicProductListing | null = null
  let bestSim = 0

  for (const e of epicItems) {
    const sim = tokenSimilarity(pTokens, e.tokens || [])
    if (sim > bestSim) {
      bestSim = sim
      bestTokenMatch = e
    }
  }

  if (bestTokenMatch && bestSim >= 0.8) {
    // Verify key specs (i3 vs i5 vs i7, 8gb vs 16gb, 512gb vs 1tb, rtx 3050 vs 5060, model numbers)
    const codes1 = new Set(pCodes)
    const codes2 = new Set(bestTokenMatch.codes || [])
    let conflict = false

    for (const c of codes1) {
      if (c.match(/^i[3579]$/) && Array.from(codes2).some((x) => x.match(/^i[3579]$/) && x !== c)) {
        conflict = true
      }
      if (c.match(/^\d+gb$/) && Array.from(codes2).some((x) => x.match(/^\d+gb$/) && x !== c)) {
        conflict = true
      }
      if (c.match(/^\d+tb$/) && Array.from(codes2).some((x) => x.match(/^\d+tb$/) && x !== c)) {
        conflict = true
      }
      if (c.match(/^rtx\d{4}$/) && Array.from(codes2).some((x) => x.match(/^rtx\d{4}$/) && x !== c)) {
        conflict = true
      }
      if (c.match(/^g\d{1,2}$/) && Array.from(codes2).some((x) => x.match(/^g\d{1,2}$/) && x !== c)) {
        conflict = true
      }
    }

    if (!conflict) {
      return { match: bestTokenMatch, matchType: `token_sim_${bestSim.toFixed(2)}` }
    }
  }

  // Tier 3: Specific Image Slug Match with Brand Verification
  if (pImgSlug && pImgSlug.length > 8) {
    const imgMatch = epicItems.find(
      (e) =>
        e.imgSlug &&
        e.imgSlug.length > 8 &&
        (e.imgSlug === pImgSlug || pImgSlug.includes(e.imgSlug) || e.imgSlug.includes(pImgSlug))
    )

    if (imgMatch) {
      // Ensure the brand token (e.g. "dell", "hp", "canon") matches
      const b1 = pTokens[0]
      const b2 = (imgMatch.tokens || [])[0]
      if (b1 && b2 && b1 === b2) {
        return { match: imgMatch, matchType: 'image_slug' }
      }
    }
  }

  return { match: null, matchType: 'none' }
}

/**
 * Synchronize all database product prices with Epic Computers
 */
export async function syncAllProductPrices(options: {
  dryRun?: boolean
  userEmail?: string
  userName?: string
  branchId?: string
  branchName?: string
} = {}): Promise<SyncPricesResult> {
  const { dryRun = false, userEmail, userName, branchId, branchName } = options
  const supabase = getSupabaseServiceClient()

  try {
    // 1. Fetch all products from database
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, category, image')
      .order('id')

    if (dbError || !dbProducts) {
      throw new Error(`Failed to load products from database: ${dbError?.message}`)
    }

    // 2. Scrape all current listings from Epic Computers
    const epicItems = await scrapeAllEpicListings()

    if (!epicItems || epicItems.length === 0) {
      throw new Error('Failed to scrape products from epiccomputers.co.tz (0 items found)')
    }

    // 3. Match database products against Epic Computers listings
    const updatedProducts: PriceUpdateItem[] = []
    const unchangedProducts: Array<{ id: number; name: string; price: number; epicTitle: string }> = []
    const unmatchedProducts: Array<{ id: number; name: string; currentPrice: number; category: string }> = []

    for (const p of dbProducts) {
      const { match, matchType } = findMatchingEpicProduct(p, epicItems)

      if (match) {
        const currentDbPrice = Number(p.price) || 0
        // Determine raw base price from Epic Computers
        const rawEpicBase = typeof match.rawPrice === 'number' && match.rawPrice > 0
          ? match.rawPrice
          : (match.price > EPIC_PRICE_CUT_TZS ? match.price - EPIC_PRICE_CUT_TZS : match.price)

        // Add constant 20,000 TZS cut to successfully fetched base price
        const targetSellingPrice = applyPriceCut(rawEpicBase)

        if (targetSellingPrice > 0 && currentDbPrice !== targetSellingPrice) {
          const diff = targetSellingPrice - currentDbPrice
          const pct = currentDbPrice > 0 ? Math.round((diff / currentDbPrice) * 100) : 0

          updatedProducts.push({
            id: p.id,
            name: p.name,
            oldPrice: currentDbPrice,
            newPrice: targetSellingPrice,
            rawEpicPrice: rawEpicBase,
            cutAdded: EPIC_PRICE_CUT_TZS,
            difference: diff,
            percentageChange: pct,
            epicTitle: match.title,
            epicUrl: match.link,
            matchType,
          })
        } else {
          unchangedProducts.push({
            id: p.id,
            name: p.name,
            price: currentDbPrice,
            epicTitle: match.title,
          })
        }
      } else {
        unmatchedProducts.push({
          id: p.id,
          name: p.name,
          currentPrice: Number(p.price) || 0,
          category: p.category || 'General',
        })
      }
    }

    // 4. If not a dry run, update all matched prices in the database in batches
    if (!dryRun && updatedProducts.length > 0) {
      const updateBatchSize = 25
      for (let i = 0; i < updatedProducts.length; i += updateBatchSize) {
        const batch = updatedProducts.slice(i, i + updateBatchSize)
        await Promise.all(
          batch.map(async (item) => {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                price: item.newPrice,
                updated_at: new Date().toISOString(),
              })
              .eq('id', item.id)

            if (updateError) {
              console.error(`Error updating price for product ${item.id} (${item.name}):`, updateError)
            }
          })
        )
      }

      // Log audit event
      await logAuditEvent({
        module: 'inventory',
        action: 'updated',
        description: `Bulk price sync from Epic Computers (+20,000 TZS cut added): updated ${updatedProducts.length} product prices (${unchangedProducts.length} already up-to-date, ${unmatchedProducts.length} unmatched)`,
        user_email: userEmail || 'admin',
        user_name: userName || 'Admin',
        branch_id: branchId,
        branch_name: branchName,
      })

      // Revalidate Next.js cache
      revalidatePath('/admin/products')
      revalidatePath('/shop')
    }

    return {
      success: true,
      dryRun,
      summary: {
        totalInDatabase: dbProducts.length,
        scrapedFromEpic: epicItems.length,
        matched: updatedProducts.length + unchangedProducts.length,
        updated: updatedProducts.length,
        unchanged: unchangedProducts.length,
        unmatched: unmatchedProducts.length,
      },
      updatedProducts,
      unchangedProducts,
      unmatchedProducts,
    }
  } catch (err: any) {
    console.error('Error in syncAllProductPrices:', err)
    return {
      success: false,
      dryRun,
      summary: {
        totalInDatabase: 0,
        scrapedFromEpic: 0,
        matched: 0,
        updated: 0,
        unchanged: 0,
        unmatched: 0,
      },
      updatedProducts: [],
      unchangedProducts: [],
      unmatchedProducts: [],
      error: err.message || 'Internal server error during price sync',
    }
  }
}

/**
 * Accurately infer the best store category for a product listing based on its title and URL.
 */
export function inferCategory(title: string, link: string = '', categoryNames: string[] = []): string {
  const t = (title || '').toLowerCase()

  // 1. Digital Codes & Gift Cards
  if (t.includes('gift card') || t.includes('itunes code') || t.includes('digital code') || t.includes('apple gift')) {
    return 'Digital Codes'
  }

  // 2. Software & Antivirus
  if (
    t.includes('antivirus') ||
    t.includes('anti-virus') ||
    t.includes('bitdefender') ||
    t.includes('kaspersky') ||
    t.includes('windows 11') ||
    t.includes('windows 10') ||
    t.includes('office 202') ||
    t.includes('office 365') ||
    t.includes('operating system') ||
    t.includes('software')
  ) {
    return 'Software'
  }

  // 3. Banking & Cash Counters
  if (t.includes('cash counting') || t.includes('bill counter') || t.includes('money counter') || t.includes('currency counter')) {
    return 'Cash Counting Machines'
  }

  // 4. Powerstations & Portable Batteries
  if (t.includes('powerstation') || t.includes('power station') || t.includes('ecoflow') || t.includes('anker solix') || t.includes('jackery') || t.includes('bluetti')) {
    return 'Powerstations'
  }

  // 5. UPS & Battery Backups
  if (t.includes(' ups ') || t.startsWith('ups ') || t.endsWith(' ups') || t.includes('uninterruptible') || t.includes('apc easy') || t.includes('mercury ups')) {
    return 'UPS'
  }

  // 6. Toners, Inks & Printers
  if (t.includes('toner') || t.includes('ink cartridge') || t.includes('ink bottle') || t.includes('toners and ink')) {
    return 'Toners and Ink'
  }
  if (t.includes('printer') || t.includes('pixma') || t.includes('maxify') || t.includes('laserjet') || t.includes('ink tank') || t.includes('epson l') || t.includes('canon pixma')) {
    return 'Printers'
  }

  // 7. Tablets & iPads
  if (t.includes('ipad') || t.includes('tablet') || t.includes('galaxy tab')) {
    return 'Tablets'
  }

  // 8. Gaming Laptops (checked before generic components or GPUs)
  if (
    t.includes('gaming laptop') ||
    t.includes('alienware') ||
    t.includes('legion') ||
    t.includes('rog ') ||
    t.includes('tuf ') ||
    t.includes('victus') ||
    t.includes('predator') ||
    t.includes('zephyrus') ||
    t.includes('strix') ||
    t.includes('omen') ||
    t.includes('nitro')
  ) {
    return 'Gaming Laptops'
  }

  // 9. Refurbished Laptops
  if (t.includes('refurbished')) {
    return 'Refurbished Laptops'
  }

  // 10. General / New Laptops
  if (
    t.includes('laptop') ||
    t.includes('thinkpad') ||
    t.includes('latitude') ||
    t.includes('elitebook') ||
    t.includes('zenbook') ||
    t.includes('macbook') ||
    t.includes('notebook') ||
    t.includes('chromebook') ||
    t.includes('envy') ||
    t.includes('spectre') ||
    t.includes('probook') ||
    t.includes('vostro') ||
    t.includes('inspiron') ||
    t.includes('swift') ||
    t.includes('ideapad')
  ) {
    return 'New Laptops'
  }

  // 11. All-in-One & Desktops
  if (t.includes('all-in-one') || t.includes('aio')) {
    return 'All-in-One'
  }
  if (t.includes('gaming desktop') || (t.includes('gaming') && (t.includes('pc') || t.includes('tower')))) {
    return 'Gaming Desktop'
  }
  if (t.includes('desktop') || t.includes('optiplex') || t.includes('prodesk') || t.includes('elitedesk') || t.includes('tower') || t.includes('workstation')) {
    return 'Desktops'
  }

  // 12. Gaming Furniture & Accessories
  if (t.includes('gaming chair')) {
    return 'Gaming Chairs'
  }
  if (t.includes('gaming accessories') || (t.includes('gaming') && t.includes('pad'))) {
    return 'Gaming Accessories'
  }

  // 13. Monitors & Displays
  if (t.includes('monitor') || t.includes('display') || t.includes('curved') || t.includes('inch ips') || (t.includes('fhd') && t.includes('hz'))) {
    return 'Monitors'
  }

  // 14. Networking
  if (t.includes('router') || t.includes('switch') || t.includes('access point') || t.includes('mesh') || t.includes('ethernet') || t.includes('tp-link')) {
    return 'Routers/Switches'
  }
  if (t.includes('wifi') || t.includes('wireless adapter') || t.includes('dongle')) {
    return 'WiFi Adapters'
  }

  // 15. Storage
  if (t.includes('case usb') || t.includes('hdd enclosure') || t.includes('hdd case') || t.includes('docking station') || t.includes('rack')) {
    return 'HDD Cases & Racks'
  }
  if (t.includes('nvme') || t.includes('ssd') || t.includes('solid state')) {
    return 'Solid State Drives'
  }
  if (t.includes('external hdd') || t.includes('external hard drive') || t.includes('expansion portable') || t.includes('external case')) {
    return 'External Hard Drives'
  }
  if (t.includes('internal hdd') || t.includes('hard disk drive') || t.includes('barracuda') || t.includes('ironwolf') || (t.includes('hdd') && !t.includes('case'))) {
    return 'Internal Hard Drives'
  }
  if (t.includes('flash drive') || t.includes('flash disk') || t.includes('usb drive') || t.includes('pendrive')) {
    return 'USB Flash Disk'
  }
  if (t.includes('micro sd') || t.includes('sd card') || t.includes('memory card')) {
    return 'SD & Micro SD Cards'
  }

  // 16. Components
  if (t.includes('rtx') || t.includes('gtx') || t.includes('radeon') || t.includes('graphics card') || t.includes('geforce') || t.includes('gpu')) {
    return 'Graphics Card'
  }
  if (t.includes('motherboard') || t.includes('mainboard')) {
    return 'Motherboard'
  }
  if (t.includes('ddr4') || t.includes('ddr5') || t.includes('ram memory') || t.includes('sodimm') || t.includes('dimm')) {
    return 'RAM Memory'
  }
  if (t.includes('intel core') || t.includes('ryzen') || t.includes('processor') || t.includes('cpu')) {
    return 'Processors'
  }
  if (t.includes('power supply') || t.includes('psu') || t.includes('80 plus')) {
    return 'Power Supply'
  }
  if (t.includes('cooling') || t.includes('liquid cooler') || t.includes('cpu cooler') || t.includes('cooler master')) {
    return 'CPU Cooling'
  }
  if (t.includes('pc case') || t.includes('chassis') || t.includes('case fan')) {
    return 'PC Cases'
  }

  // 17. Peripherals & Accessories
  if (t.includes('keyboard') || t.includes('mouse') || t.includes('trackpad')) {
    return 'Keyboard/Mouse'
  }
  if (t.includes('headphone') || t.includes('headset') || t.includes('speaker') || t.includes('earbuds') || t.includes('soundbar')) {
    return 'Headphones & Speakers'
  }
  if (t.includes('webcam') || t.includes('conference cam')) {
    return 'Webcam'
  }
  if (t.includes('cctv') || t.includes('dvr') || t.includes('nvr') || t.includes('ip camera') || t.includes('hikvision') || t.includes('dahua')) {
    return 'CCTV Cameras'
  }
  if (t.includes('bag') || t.includes('backpack') || t.includes('sleeve')) {
    return 'Laptop Bags'
  }
  if (t.includes('charger') || t.includes('power adapter')) {
    return 'Laptop Chargers'
  }
  if (t.includes('cable') || t.includes('hdmi') || t.includes('vga') || t.includes('adapter')) {
    return 'Cables & Dongles'
  }
  if (t.includes('power bank')) {
    return 'Power Banks'
  }
  if (t.includes('stand')) {
    return 'Monitor Stands'
  }

  // Fallback to closest match in categoryNames if available
  if (categoryNames && categoryNames.length > 0) {
    const found = categoryNames.find((c) => t.includes(c.toLowerCase()))
    if (found) return found
  }

  return 'Gadgets & Accessories'
}

/**
 * Bidirectionally synchronize the entire catalog with Epic Computers:
 * 1. Scrape all products currently on Epic Computers (~32 pages).
 * 2. Any product on Epic Computers not present in admin dashboard is ADDED to the catalog
 *    (with +20,000 TZS profit margin cut applied, making it live on the shop page).
 * 3. Any product already in admin dashboard matching Epic Computers has its price UPDATED
 *    (matching Epic price + constant 20,000 TZS cut) and is active on the shop page.
 * 4. Any product in admin dashboard NOT present on Epic Computers is UNLISTED from the public
 *    shop page (hidden from customers), but KEPT intact and labeled as 'Not on Epic' in admin
 *    Inventory and Store pages.
 * 5. Records sync state in system_settings and logs an audit log entry.
 */
export async function synchronizeEpicCatalog(options: {
  dryRun?: boolean
  userEmail?: string
  userName?: string
  branchId?: string
  branchName?: string
} = {}): Promise<EpicCatalogSyncResult> {
  const { dryRun = false, userEmail, userName, branchId, branchName } = options
  const supabase = getSupabaseServiceClient()

  try {
    // 1. Fetch all products from database (including features to check unlisted status)
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, name, price, category, image, features, stock, description')
      .order('id')

    if (dbError || !dbProducts) {
      throw new Error(`Failed to load products from database: ${dbError?.message}`)
    }

    // 2. Fetch categories for classification
    const { data: categoriesData } = await supabase.from('categories').select('name')
    const categoryNames = (categoriesData || []).map((c) => c.name)

    // 3. Scrape all current listings from Epic Computers (~380 items across 32 pages)
    const epicItems = await scrapeAllEpicListings()

    if (!epicItems || epicItems.length === 0) {
      throw new Error('Failed to scrape products from epiccomputers.co.tz (0 items found)')
    }

    // 4. Classify products
    const updatedProducts: PriceUpdateItem[] = []
    const unchangedProducts: Array<{ id: number; name: string; price: number; epicTitle: string }> = []
    const unlistedProducts: UnlistedProductItem[] = []
    const addedProducts: AddedProductItem[] = []

    const matchedEpicUrls = new Set<string>()

    // Phase 4A: Match DB products against Epic listings
    for (const p of dbProducts) {
      const { match, matchType } = findMatchingEpicProduct(p, epicItems)
      const rawFeatures: string[] = Array.isArray(p.features) ? p.features : []
      const currentlyUnlisted =
        rawFeatures.includes('__epic_status:not_on_epic__') || rawFeatures.includes('not_on_epic')

      if (match) {
        matchedEpicUrls.add(match.link)

        const currentDbPrice = Number(p.price) || 0
        const rawEpicBase =
          typeof match.rawPrice === 'number' && match.rawPrice > 0
            ? match.rawPrice
            : match.price > EPIC_PRICE_CUT_TZS
            ? match.price - EPIC_PRICE_CUT_TZS
            : match.price

        const targetSellingPrice = applyPriceCut(rawEpicBase)
        const priceChanged = targetSellingPrice > 0 && currentDbPrice !== targetSellingPrice

        if (priceChanged || currentlyUnlisted) {
          const diff = targetSellingPrice - currentDbPrice
          const pct = currentDbPrice > 0 ? Math.round((diff / currentDbPrice) * 100) : 0

          updatedProducts.push({
            id: p.id,
            name: p.name,
            oldPrice: currentDbPrice,
            newPrice: targetSellingPrice,
            rawEpicPrice: rawEpicBase,
            cutAdded: EPIC_PRICE_CUT_TZS,
            difference: diff,
            percentageChange: pct,
            epicTitle: match.title,
            epicUrl: match.link,
            matchType,
          })
        } else {
          unchangedProducts.push({
            id: p.id,
            name: p.name,
            price: currentDbPrice,
            epicTitle: match.title,
          })
        }
      } else {
        // DB product NOT found on Epic Computers
        unlistedProducts.push({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          category: p.category || 'General',
          image: p.image,
          reason: 'Not listed on Epic Computers shop',
        })
      }
    }

    // Phase 4B: Identify products on Epic Computers NOT present in DB
    const seenEpicTitles = new Set<string>()
    for (const e of epicItems) {
      if (matchedEpicUrls.has(e.link)) continue

      // Extra check: see if normalized title matches any DB product
      const normMatch = dbProducts.find((p) => normalizeText(p.name) === e.norm)
      if (normMatch) {
        matchedEpicUrls.add(e.link)
        continue
      }

      if (seenEpicTitles.has(e.norm || e.title)) continue
      seenEpicTitles.add(e.norm || e.title)

      const rawBase = e.rawPrice || (e.price > EPIC_PRICE_CUT_TZS ? e.price - EPIC_PRICE_CUT_TZS : e.price)
      const finalPrice = applyPriceCut(rawBase)
      const cat = inferCategory(e.title, e.link, categoryNames)

      addedProducts.push({
        name: e.title,
        category: cat,
        price: finalPrice,
        rawEpicPrice: rawBase,
        cutAdded: EPIC_PRICE_CUT_TZS,
        image: e.image || '',
        epicUrl: e.link,
      })
    }

    // 5. If not dryRun, apply changes to DB
    if (!dryRun) {
      // 5A: Apply price updates and ensure unlisted flag is removed for matched products
      if (updatedProducts.length > 0) {
        const updateBatchSize = 25
        for (let i = 0; i < updatedProducts.length; i += updateBatchSize) {
          const batch = updatedProducts.slice(i, i + updateBatchSize)
          await Promise.all(
            batch.map(async (item) => {
              const orig = dbProducts.find((p) => p.id === item.id)
              const rawFeats: string[] = Array.isArray(orig?.features) ? orig.features : []
              const cleanFeats = rawFeats.filter((f) => !f.startsWith('__epic_') && f !== 'not_on_epic')

              const { error: updateError } = await supabase
                .from('products')
                .update({
                  price: item.newPrice,
                  features: cleanFeats,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', item.id)

              if (updateError) {
                console.error(`Error updating product ${item.id} (${item.name}):`, updateError)
              }
            })
          )
        }
      }

      // 5B: Apply unlisted status to products missing from Epic Computers
      if (unlistedProducts.length > 0) {
        const unlistBatchSize = 25
        for (let i = 0; i < unlistedProducts.length; i += unlistBatchSize) {
          const batch = unlistedProducts.slice(i, i + unlistBatchSize)
          await Promise.all(
            batch.map(async (item) => {
              const orig = dbProducts.find((p) => p.id === item.id)
              const rawFeats: string[] = Array.isArray(orig?.features) ? orig.features : []
              if (!rawFeats.includes('__epic_status:not_on_epic__')) {
                const updatedFeats = [
                  ...rawFeats.filter((f) => !f.startsWith('__epic_') && f !== 'not_on_epic'),
                  '__epic_status:not_on_epic__',
                ]
                const { error: unlistError } = await supabase
                  .from('products')
                  .update({
                    features: updatedFeats,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', item.id)

                if (unlistError) {
                  console.error(`Error marking product ${item.id} as unlisted:`, unlistError)
                }
              }
            })
          )
        }
      }

      // 5C: Insert newly discovered products from Epic Computers into DB
      if (addedProducts.length > 0) {
        const insertBatchSize = 20
        for (let i = 0; i < addedProducts.length; i += insertBatchSize) {
          const batch = addedProducts.slice(i, i + insertBatchSize)
          const rowsToInsert = batch.map((item) => ({
            name: item.name,
            category: item.category,
            price: item.price,
            image: item.image || '',
            description: `${item.name}. Genuine product sourced from Epic Computers. Includes standard manufacturer warranty.`,
            features: [],
            stock: 10,
            rating: 4.5,
            swatch_images: item.image ? [item.image] : [],
          }))

          const { error: insertError } = await supabase.from('products').insert(rowsToInsert)

          if (insertError) {
            console.error('Error inserting new Epic products batch:', insertError)
          }
        }
      }

      // 5D: Save global sync state into system_settings
      try {
        await supabase.from('system_settings').upsert(
          {
            id: 'epic_sync_catalog',
            settings: {
              last_synced_at: new Date().toISOString(),
              total_epic_scraped: epicItems.length,
              total_db_products: dbProducts.length + addedProducts.length,
              added_count: addedProducts.length,
              updated_count: updatedProducts.length,
              unlisted_count: unlistedProducts.length,
              unchanged_count: unchangedProducts.length,
              unlisted_product_ids: unlistedProducts.map((p) => p.id),
              synced_product_ids: [
                ...unchangedProducts.map((p) => p.id),
                ...updatedProducts.map((p) => p.id),
              ],
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      } catch (settingsError) {
        console.warn('Could not record sync state in system_settings:', settingsError)
      }

      // 5E: Log audit event
      await logAuditEvent({
        module: 'inventory',
        action: 'updated',
        description: `Full Epic Computers Synchronization (+20,000 TZS cut added): added ${addedProducts.length} new products to shop, updated ${updatedProducts.length} prices, unlisted ${unlistedProducts.length} products missing from Epic from shop (kept in inventory & store).`,
        user_email: userEmail || 'admin',
        user_name: userName || 'Admin',
        branch_id: branchId,
        branch_name: branchName,
      })

      // 5F: Revalidate Next.js cache
      revalidatePath('/admin/products')
      revalidatePath('/admin/inventory')
      revalidatePath('/shop')
    }

    return {
      success: true,
      dryRun,
      summary: {
        totalInDatabase: dbProducts.length,
        scrapedFromEpic: epicItems.length,
        matched: updatedProducts.length + unchangedProducts.length,
        updated: updatedProducts.length,
        added: addedProducts.length,
        unlisted: unlistedProducts.length,
        unchanged: unchangedProducts.length,
      },
      addedProducts,
      updatedProducts,
      unlistedProducts,
      unchangedProducts,
    }
  } catch (err: any) {
    console.error('Error in synchronizeEpicCatalog:', err)
    return {
      success: false,
      dryRun,
      summary: {
        totalInDatabase: 0,
        scrapedFromEpic: 0,
        matched: 0,
        updated: 0,
        added: 0,
        unlisted: 0,
        unchanged: 0,
      },
      addedProducts: [],
      updatedProducts: [],
      unlistedProducts: [],
      unchangedProducts: [],
      error: err.message || 'Internal server error during Epic catalog sync',
    }
  }
}
