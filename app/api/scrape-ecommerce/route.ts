import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import {
  discoverProductUrlsFromEcommerce,
  scrapeSingleEcommerceProduct,
  upsertScrapedProduct,
  UNIVERSAL_PRICE_CUT_TZS,
} from "@/lib/universal-ecommerce-scraper"
import { verifyAdminSession } from "@/lib/admin-auth"
import { validateExternalHttpsUrl } from "@/lib/security/url-guard"

export const maxDuration = 300 // allow up to 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required." }, { status: 401 })
    }

    const body = await req.json()
    const { url, maxProducts = 500 } = body

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A valid e-commerce URL is required." }, { status: 400 })
    }

    const urlCheck = validateExternalHttpsUrl(url)
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.error || "Restricted URL target." }, { status: 400 })
    }

    // 1. Discover product links
    const { domain, productUrls } = await discoverProductUrlsFromEcommerce(url, maxProducts)

    if (productUrls.length === 0) {
      return NextResponse.json({
        error: `No product links found on ${url}. Please ensure the link is a shop, catalog, or product page.`,
      }, { status: 404 })
    }

    const results = {
      domain,
      totalDiscovered: productUrls.length,
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      priceCutAppliedTzs: UNIVERSAL_PRICE_CUT_TZS,
      sampleProducts: [] as any[],
    }

    // 2. Scrape each product in controlled batches (polite concurrency to avoid rate limits)
    const batchSize = 3
    for (let i = 0; i < productUrls.length; i += batchSize) {
      const batch = productUrls.slice(i, i + batchSize)
      const scraped = await Promise.all(batch.map((pUrl) => scrapeSingleEcommerceProduct(pUrl)))

      for (const prod of scraped) {
        if (!prod) {
          results.failed++
          continue
        }

        try {
          const res = await upsertScrapedProduct(prod)
          if (res.action === "created") results.created++
          if (res.action === "updated") results.updated++
          if (results.sampleProducts.length < 5) {
            results.sampleProducts.push({
              name: prod.name,
              rawPrice: prod.rawPrice,
              catalogPrice: prod.price,
              category: prod.category,
              image: prod.image,
            })
          }
        } catch (dbErr) {
          console.error("Error inserting product into DB:", dbErr)
          results.failed++
        }
      }
      results.processed += batch.length

      // Add a slight pacing between batches to respect host rate limits
      if (i + batchSize < productUrls.length) {
        await new Promise((r) => setTimeout(r, 150))
      }
    }

    // Purge cached pages so admin and shop reflect newly inserted products immediately
    try {
      revalidatePath("/admin/products")
      revalidatePath("/shop")
      revalidatePath("/")
    } catch (e) {
      console.warn("Revalidation note:", e)
    }

    return NextResponse.json({
      status: "success",
      message: `Successfully synchronized ${results.created + results.updated} products from ${domain}.`,
      data: results,
    })
  } catch (error: any) {
    console.error("Universal ecommerce scrape error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process e-commerce scraping." },
      { status: 500 }
    )
  }
}

