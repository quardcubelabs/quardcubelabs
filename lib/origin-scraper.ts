import * as cheerio from "cheerio"
import { createClient } from "@supabase/supabase-js"
import { logAuditEvent } from "./audit-actions"
import { revalidatePath } from "next/cache"
import { scrapeSingleEcommerceProduct, UNIVERSAL_PRICE_CUT_TZS } from "./universal-ecommerce-scraper"

export const ORIGIN_PRICE_CUT_TZS = 20000

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  return createClient(supabaseUrl, supabaseKey)
}

export interface OriginSyncProductItem {
  id: number
  name: string
  sourceDomain: string
  sourceUrl: string
  oldPrice: number
  newPrice: number
  rawOriginPrice?: number
  priceDifference: number
  oldStock: number
  newStock: number
  inStock: boolean
  stockStatusChanged: boolean
  isRemovedFromOrigin: boolean
  reason?: string
}

export interface OriginSyncSummary {
  totalInDatabase: number
  scanned: number
  matchedWithOrigin: number
  pricesUpdated: number
  stockUpdated: number
  markedInStock: number
  markedOutOfStock: number
  removedFromOrigin: number
  unchanged: number
}

export interface OriginSyncResult {
  success: boolean
  dryRun: boolean
  originFilter?: string
  summary: OriginSyncSummary
  priceUpdates: OriginSyncProductItem[]
  stockUpdates: OriginSyncProductItem[]
  outOfStockProducts: OriginSyncProductItem[]
  removedProducts: OriginSyncProductItem[]
  unchangedProducts: Array<{ id: number; name: string; price: number; stock: number; sourceDomain: string }>
  error?: string
}

/**
 * Extract source URL and source domain from product features or images
 */
export function extractProductOriginInfo(product: {
  features?: string[] | null
  image?: string | null
}): { sourceUrl: string; sourceDomain: string } {
  let sourceUrl = ""
  let sourceDomain = "other"

  const features = Array.isArray(product.features) ? product.features : []

  for (const f of features) {
    if (typeof f !== "string") continue
    if (f.startsWith("__source_url:")) {
      sourceUrl = f.replace(/^__source_url:/, "").replace(/__$/, "").trim()
      try {
        sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, "")
      } catch {
        // fallback
      }
      break
    } else if (f.startsWith("__epic_url:")) {
      sourceUrl = f.replace(/^__epic_url:/, "").replace(/__$/, "").trim()
      sourceDomain = "epiccomputers.co.tz"
      break
    }
  }

  if (!sourceUrl) {
    const img = (product.image || "").toLowerCase()
    if (img.includes("epiccomputers")) {
      sourceDomain = "epiccomputers.co.tz"
    } else if (img.includes("maishacomputers")) {
      sourceDomain = "maishacomputers.com"
    } else if (img.includes("laptopcitystore")) {
      sourceDomain = "laptopcitystore.co.tz"
    }
  }

  return { sourceUrl, sourceDomain }
}

/**
 * Inspect live webpage at origin URL to extract current price, stock status, and availability
 */
export async function checkOriginProductLiveStatus(sourceUrl: string): Promise<{
  exists: boolean
  rawPrice: number
  inStock: boolean
  title?: string
  error?: string
}> {
  if (!sourceUrl || !sourceUrl.startsWith("http")) {
    return { exists: false, rawPrice: 0, inStock: false, error: "Invalid URL" }
  }

  try {
    const urlObj = new URL(sourceUrl)
    const domain = urlObj.hostname.replace(/^www\./, "")

    // 1. Shopify storefronts: query .js endpoint for instant accurate availability
    const cleanUrl = sourceUrl.split("?")[0].replace(/\/$/, "")
    if (cleanUrl.includes("/products/")) {
      try {
        const jsUrl = `${cleanUrl}.js`
        const jsRes = await fetch(jsUrl, {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
          next: { revalidate: 0 },
        })

        if (jsRes.ok) {
          const jsData = await jsRes.json()
          if (jsData && jsData.title) {
            let rawPrice = 0
            if (jsData.price) {
              const rawP = Number(jsData.price)
              rawPrice = rawP > 1000000 ? rawP / 100 : rawP
            }

            // In Shopify: available property indicates whether variants have stock
            const inStock = Boolean(jsData.available)

            return {
              exists: true,
              rawPrice,
              inStock,
              title: jsData.title,
            }
          }
        }
      } catch {
        // Fallback to HTML
      }
    }

    // 2. Fetch live HTML
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 18000)

    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    })
    clearTimeout(timeoutId)

    if (res.status === 404 || res.status === 410) {
      return { exists: false, rawPrice: 0, inStock: false, error: "Product removed from origin" }
    }

    if (!res.ok) {
      return { exists: false, rawPrice: 0, inStock: false, error: `HTTP ${res.status}` }
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    let rawPrice = 0
    let inStock: boolean | null = null
    let title = $("h1.product_title, h1.entry-title, h1").first().text().trim() || $("title").text().trim()

    // 3. Inspect Schema.org JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html() || "{}")
        const items = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of items) {
          if (item["@type"] === "Product" || item.type === "Product") {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
            if (offer) {
              if (offer.price) {
                const p = parseFloat(String(offer.price).replace(/[^0-9.]/g, ""))
                if (!isNaN(p) && p > 0) rawPrice = p
              }

              if (offer.availability) {
                const availStr = String(offer.availability).toLowerCase()
                if (availStr.includes("outofstock") || availStr.includes("soldout") || availStr.includes("discontinued")) {
                  inStock = false
                } else if (availStr.includes("instock") || availStr.includes("preorder") || availStr.includes("limitedavailability")) {
                  inStock = true
                }
              }
            }
          }
        }
      } catch {
        // ignore JSON-LD parse errors
      }
    })

    // 4. HTML Indicators for Out of Stock (WooCommerce, standard HTML)
    const lowerHtml = html.toLowerCase()

    if (inStock === null) {
      const hasOutOfStockClass =
        $(".out-of-stock").length > 0 ||
        $(".stock.out-of-stock").length > 0 ||
        $('p[class*="out-of-stock"]').length > 0 ||
        $('span[class*="out-of-stock"]').length > 0 ||
        $(".badge--soldout, .sold-out, .sold_out, .badge-out-of-stock").length > 0 ||
        $('link[itemprop="availability"][href*="OutOfStock"]').length > 0

      const hasOutOfStockText =
        /\bout of stock\b/i.test(lowerHtml) ||
        /\bsold out\b/i.test(lowerHtml) ||
        /\bhakuna mzigo\b/i.test(lowerHtml) ||
        /\bunavailable\b/i.test(lowerHtml)

      const hasInStockClass =
        $(".in-stock").length > 0 ||
        $(".stock.in-stock").length > 0 ||
        $('link[itemprop="availability"][href*="InStock"]').length > 0

      if (hasOutOfStockClass || (hasOutOfStockText && !hasInStockClass)) {
        inStock = false
      } else {
        inStock = true
      }
    }

    // 5. Fallback DOM price extraction if JSON-LD price was missing
    if (rawPrice <= 0) {
      const priceText = $(
        '.price ins .amount, .price .amount, .price, [class*="product-price"], [class*="current-price"]'
      )
        .first()
        .text()
      const matches = priceText.replace(/,/g, "").match(/\d+(\.\d+)?/)
      if (matches) {
        rawPrice = parseFloat(matches[0])
      }
    }

    return {
      exists: true,
      rawPrice,
      inStock: inStock !== null ? inStock : true,
      title,
    }
  } catch (error: any) {
    return {
      exists: false,
      rawPrice: 0,
      inStock: false,
      error: error?.message || "Failed to reach origin site",
    }
  }
}

/**
 * Master Origin Synchronizer:
 * Scans products in the database, maps them to their origin website,
 * updates live prices (+20k TZS margin), updates stock status (In Stock vs Out of Stock),
 * and handles removed products.
 */
export async function synchronizeOriginCatalog(options: {
  dryRun?: boolean
  originDomain?: string // e.g. "all", "epiccomputers.co.tz", "maishacomputers.com", etc.
  userEmail?: string
  userName?: string
  branchId?: string
  branchName?: string
  batchLimit?: number // default 100 per run to fit within serverless execution limits
}): Promise<OriginSyncResult> {
  const dryRun = Boolean(options.dryRun)
  const supabase = getSupabaseServiceClient()
  const originFilter = (options.originDomain || "all").toLowerCase().replace(/^www\./, "")
  const batchLimit = options.batchLimit || 80

  try {
    // 1. Fetch products from database
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, price, stock, category, image, features")
      .order("id")

    if (dbError || !dbProducts) {
      return {
        success: false,
        dryRun,
        originFilter,
        summary: {
          totalInDatabase: 0,
          scanned: 0,
          matchedWithOrigin: 0,
          pricesUpdated: 0,
          stockUpdated: 0,
          markedInStock: 0,
          markedOutOfStock: 0,
          removedFromOrigin: 0,
          unchanged: 0,
        },
        priceUpdates: [],
        stockUpdates: [],
        outOfStockProducts: [],
        removedProducts: [],
        unchangedProducts: [],
        error: dbError?.message || "Failed to read products from database",
      }
    }

    // 2. Filter products that have origin sources
    const eligibleProducts = dbProducts
      .map((p) => {
        const { sourceUrl, sourceDomain } = extractProductOriginInfo(p)
        return {
          ...p,
          sourceUrl,
          sourceDomain,
        }
      })
      .filter((p) => {
        if (!p.sourceUrl) return false
        if (originFilter !== "all" && p.sourceDomain !== originFilter) return false
        return true
      })
      .slice(0, batchLimit)

    const priceUpdates: OriginSyncProductItem[] = []
    const stockUpdates: OriginSyncProductItem[] = []
    const outOfStockProducts: OriginSyncProductItem[] = []
    const removedProducts: OriginSyncProductItem[] = []
    const unchangedProducts: Array<{ id: number; name: string; price: number; stock: number; sourceDomain: string }> = []

    let markedInStock = 0
    let markedOutOfStock = 0

    // 3. Inspect each product in parallel batches of 5
    const batchSize = 5
    for (let i = 0; i < eligibleProducts.length; i += batchSize) {
      const batch = eligibleProducts.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (prod) => {
          const live = await checkOriginProductLiveStatus(prod.sourceUrl)

          if (!live.exists) {
            // Product removed or 404 from origin website
            const item: OriginSyncProductItem = {
              id: prod.id,
              name: prod.name,
              sourceDomain: prod.sourceDomain,
              sourceUrl: prod.sourceUrl,
              oldPrice: Number(prod.price),
              newPrice: Number(prod.price),
              priceDifference: 0,
              oldStock: prod.stock,
              newStock: 0,
              inStock: false,
              stockStatusChanged: prod.stock > 0,
              isRemovedFromOrigin: true,
              reason: live.error || "Product page not found on origin",
            }
            removedProducts.push(item)
            if (prod.stock > 0) {
              stockUpdates.push(item)
              outOfStockProducts.push(item)
              markedOutOfStock++
            }
            return
          }

          // Live price with constant +20,000 TZS profit margin
          let newPrice = Number(prod.price)
          let priceDifference = 0
          if (live.rawPrice > 0) {
            newPrice = Math.round(live.rawPrice + ORIGIN_PRICE_CUT_TZS)
            priceDifference = newPrice - Number(prod.price)
          }

          // Live stock determination
          const inStock = live.inStock
          const newStock = inStock ? (prod.stock > 0 ? prod.stock : 15) : 0
          const stockStatusChanged = (prod.stock > 0) !== inStock

          const isPriceChanged = Math.abs(priceDifference) >= 100 // ignore trivial float diffs

          const item: OriginSyncProductItem = {
            id: prod.id,
            name: prod.name,
            sourceDomain: prod.sourceDomain,
            sourceUrl: prod.sourceUrl,
            oldPrice: Number(prod.price),
            newPrice,
            rawOriginPrice: live.rawPrice,
            priceDifference,
            oldStock: prod.stock,
            newStock,
            inStock,
            stockStatusChanged,
            isRemovedFromOrigin: false,
          }

          if (isPriceChanged) {
            priceUpdates.push(item)
          }

          if (stockStatusChanged) {
            stockUpdates.push(item)
            if (!inStock) {
              outOfStockProducts.push(item)
              markedOutOfStock++
            } else {
              markedInStock++
            }
          }

          if (!isPriceChanged && !stockStatusChanged) {
            unchangedProducts.push({
              id: prod.id,
              name: prod.name,
              price: Number(prod.price),
              stock: prod.stock,
              sourceDomain: prod.sourceDomain,
            })
          }
        })
      )

      // Polite delay between batches
      if (i + batchSize < eligibleProducts.length) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    // 4. If live mode (not dryRun), apply updates to Supabase
    if (!dryRun) {
      const itemsToUpdate = new Map<number, { price?: number; stock?: number; features?: string[] }>()

      // Accumulate price changes
      for (const p of priceUpdates) {
        const cur = itemsToUpdate.get(p.id) || {}
        cur.price = p.newPrice
        itemsToUpdate.set(p.id, cur)
      }

      // Accumulate stock changes
      for (const s of stockUpdates) {
        const cur = itemsToUpdate.get(s.id) || {}
        cur.stock = s.newStock
        itemsToUpdate.set(s.id, cur)
      }

      // Accumulate removed products (mark out of stock & tag unlisted)
      for (const r of removedProducts) {
        const orig = dbProducts.find((p) => p.id === r.id)
        const rawFeats: string[] = Array.isArray(orig?.features) ? orig.features : []
        const updatedFeats = [
          ...rawFeats.filter((f) => !f.startsWith("__epic_status:") && f !== "not_on_epic"),
          "__epic_status:not_on_epic__",
        ]
        const cur = itemsToUpdate.get(r.id) || {}
        cur.stock = 0
        cur.features = updatedFeats
        itemsToUpdate.set(r.id, cur)
      }

      // Execute updates
      for (const [id, patch] of Array.from(itemsToUpdate.entries())) {
        await supabase
          .from("products")
          .update({
            ...(patch.price !== undefined ? { price: patch.price } : {}),
            ...(patch.stock !== undefined ? { stock: patch.stock } : {}),
            ...(patch.features ? { features: patch.features } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
      }

      // Log audit trail
      try {
        await logAuditEvent({
          eventType: "inventory_sync",
          description: `Origin Sync (${originFilter}): updated ${priceUpdates.length} prices, ${markedInStock} in-stock, ${markedOutOfStock} out-of-stock across ${eligibleProducts.length} origin products.`,
          metadata: {
            originFilter,
            scanned: eligibleProducts.length,
            pricesUpdated: priceUpdates.length,
            markedInStock,
            markedOutOfStock,
            removed: removedProducts.length,
          },
          userEmail: options.userEmail,
          userName: options.userName,
          branchId: options.branchId,
          branchName: options.branchName,
        })
      } catch (auditErr) {
        console.warn("Could not write audit log for origin sync:", auditErr)
      }

      // Revalidate cache
      try {
        revalidatePath("/admin/products")
        revalidatePath("/admin/inventory")
        revalidatePath("/shop")
        revalidatePath("/")
      } catch {}
    }

    return {
      success: true,
      dryRun,
      originFilter,
      summary: {
        totalInDatabase: dbProducts.length,
        scanned: eligibleProducts.length,
        matchedWithOrigin: eligibleProducts.length,
        pricesUpdated: priceUpdates.length,
        stockUpdated: stockUpdates.length,
        markedInStock,
        markedOutOfStock,
        removedFromOrigin: removedProducts.length,
        unchanged: unchangedProducts.length,
      },
      priceUpdates,
      stockUpdates,
      outOfStockProducts,
      removedProducts,
      unchangedProducts,
    }
  } catch (error: any) {
    console.error("Error in synchronizeOriginCatalog:", error)
    return {
      success: false,
      dryRun,
      originFilter,
      summary: {
        totalInDatabase: 0,
        scanned: 0,
        matchedWithOrigin: 0,
        pricesUpdated: 0,
        stockUpdated: 0,
        markedInStock: 0,
        markedOutOfStock: 0,
        removedFromOrigin: 0,
        unchanged: 0,
      },
      priceUpdates: [],
      stockUpdates: [],
      outOfStockProducts: [],
      removedProducts: [],
      unchangedProducts: [],
      error: error?.message || "Unexpected synchronization failure",
    }
  }
}
