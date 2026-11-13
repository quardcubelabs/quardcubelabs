import { createServerClient } from "@/lib/supabase"
import * as cheerio from "cheerio"

export const UNIVERSAL_PRICE_CUT_TZS = 20000

export interface ScrapedProduct {
  name: string
  price: number
  rawPrice: number
  cutAdded: number
  image: string
  swatchImages: string[]
  description: string
  features: string[]
  category: string
  sku?: string
  sourceUrl: string
  sourceDomain: string
  stock: number
  rating: number
  type: string
}

// Map external category text / breadcrumbs / slug to QuardCube canonical categories
export function mapToCanonicalCategory(rawCategory: string, productName: string): string {
  const combined = `${rawCategory} ${productName}`.toLowerCase()

  if (combined.includes("laptop") || combined.includes("notebook") || combined.includes("macbook")) {
    if (combined.includes("gaming")) return "Gaming Laptops"
    if (combined.includes("refurbish") || combined.includes("used")) return "Refurbished Laptops"
    return "New Laptops"
  }
  if (combined.includes("all-in-one") || combined.includes("aio")) return "All-in-One"
  if (combined.includes("desktop") || combined.includes("tower") || combined.includes("optiplex") || combined.includes("workstation")) {
    if (combined.includes("gaming")) return "Gaming Desktop"
    return "Desktops"
  }
  if (combined.includes("ups") || combined.includes("power backup") || combined.includes("back-up") || combined.includes("battery")) return "UPS"
  if (combined.includes("power station") || combined.includes("powerstation") || combined.includes("solar generator")) return "Powerstations"
  if (combined.includes("printer") || combined.includes("laserjet") || combined.includes("ecotank") || combined.includes("photocopier") || combined.includes("scanner") || combined.includes("copier")) return "Printers"
  if (combined.includes("toner") || combined.includes("cartridge") || combined.includes("ink")) return "Toners and Ink"
  if (combined.includes("monitor") || combined.includes("display") || combined.includes("tft") || combined.includes("screen")) return "Monitors"
  if (combined.includes("router") || combined.includes("switch") || combined.includes("access point") || combined.includes("wifi adapter") || combined.includes("networking") || combined.includes("mesh")) return "Routers/Switches"
  if (combined.includes("cctv") || combined.includes("surveillance") || combined.includes("camera") || combined.includes("dvr") || combined.includes("nvr")) return "CCTV Cameras"
  if (combined.includes("ssd") || combined.includes("solid state")) return "Solid State Drives"
  if (combined.includes("hard drive") || combined.includes("hdd") || combined.includes("internal drive")) return "Internal Hard Drives"
  if (combined.includes("external hard") || combined.includes("portable hard")) return "External Hard Drives"
  if (combined.includes("flash drive") || combined.includes("usb flash") || combined.includes("pen drive")) return "USB Flash Disk"
  if (combined.includes("sd card") || combined.includes("micro sd")) return "SD & Micro SD Cards"
  if (combined.includes("graphics card") || combined.includes("gpu") || combined.includes("geforce") || combined.includes("radeon")) return "Graphics Card"
  if (combined.includes("motherboard")) return "Motherboard"
  if (combined.includes("ram") || combined.includes("memory ddr")) return "RAM Memory"
  if (combined.includes("processor") || combined.includes("intel core") || combined.includes("ryzen")) return "Processors"
  if (combined.includes("keyboard") || combined.includes("mouse") || combined.includes("combo")) return "Keyboard/Mouse"
  if (combined.includes("headphone") || combined.includes("headset") || combined.includes("speaker") || combined.includes("earbud")) return "Headphones & Speakers"
  if (combined.includes("webcam")) return "Webcam"
  if (combined.includes("software") || combined.includes("anti-virus") || combined.includes("kaspersky") || combined.includes("windows")) return "Software"
  if (combined.includes("counting machine") || combined.includes("currency counter")) return "Cash Counting Machines"
  if (combined.includes("tablet") || combined.includes("ipad")) return "Tablets"

  return "Gadgets & Accessories"
}

// Scrape a single product URL across various e-commerce engines (Schema.org JSON-LD, WooCommerce, OpenGraph, custom)
export async function scrapeSingleEcommerceProduct(productUrl: string): Promise<ScrapedProduct | null> {
  try {
    const res = await fetch(productUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      console.warn(`[UniversalScraper] Failed to fetch product ${productUrl}: status ${res.status}`)
      return null
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const urlObj = new URL(productUrl)
    const domain = urlObj.hostname.replace(/^www\./, "")

    let name = ""
    let rawPrice = 0
    let description = ""
    let image = ""
    let swatchImages: string[] = []
    let features: string[] = []
    let rawCategory = ""
    let sku = ""

    // 1. First look for Schema.org JSON-LD (High fidelity for Maisha, Shopify, Magento, WooCommerce)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html() || "{}")
        const items = Array.isArray(parsed) ? parsed : [parsed]
        for (const item of items) {
          if (item["@type"] === "Product" || item.type === "Product") {
            if (!name && item.name) name = item.name.trim()
            if (!description && item.description) description = item.description.trim()
            if (!image && item.image) {
              image = Array.isArray(item.image) ? item.image[0] : (typeof item.image === "string" ? item.image : item.image.url || "")
            }
            if (item.sku) sku = item.sku

            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
            if (offer && offer.price) {
              const p = parseFloat(String(offer.price).replace(/[^0-9.]/g, ""))
              if (!isNaN(p) && p > 0) rawPrice = p
            }
          }
          if (item["@type"] === "BreadcrumbList" && item.itemListElement) {
            const crumbs = item.itemListElement
              .map((b: any) => b.name || (b.item && b.item.name) || "")
              .filter((n: string) => n && n !== "Home" && n !== "Shop")
            if (crumbs.length > 0) {
              rawCategory = crumbs[crumbs.length - 1]
            }
          }
        }
      } catch (e) {
        // ignore parse error
      }
    })

    // 2. Fallback to DOM elements if JSON-LD was incomplete
    if (!name) {
      name = $('h1').first().text().trim() || $('meta[property="og:title"]').attr("content")?.trim() || ""
    }

    if (!image) {
      image = $('meta[property="og:image"]').attr("content") || ""
      if (!image) {
        const candidateImg = $('img[src*="/products/"], img[src*="/product/"], .woocommerce-product-gallery img').first()
        image = candidateImg.attr("src") || candidateImg.attr("data-src") || ""
      }
    }

    if (!rawPrice) {
      // Find elements containing price
      const priceText = $('.price, [class*="price"], .amount, span:contains("TZS"), span:contains("Tsh")').first().text()
      const matches = priceText.replace(/,/g, "").match(/\d+(\.\d+)?/)
      if (matches) {
        rawPrice = parseFloat(matches[0])
      }
    }

    // Secondary gallery images
    $('img[src*="/products/"], img[src*="/product/"], .woocommerce-product-gallery img').each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src")
      if (src && src.startsWith("http") && !src.includes("logo") && !src.includes("icon") && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })

    // Features / Specifications
    $('ul li, dl dd, table tr').each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, " ").trim()
      if (txt.length >= 10 && txt.length <= 160 && !features.includes(txt)) {
        features.push(txt)
      }
    })

    if (!description) {
      description = $('meta[name="description"]').attr("content")?.trim() ||
        $('[class*="description"], [class*="content"]').first().text().trim() ||
        `High performance ${name} tailored for professional productivity.`
    }

    if (!name || rawPrice <= 0) {
      console.warn(`[UniversalScraper] Skipping ${productUrl} (missing valid name or price > 0)`)
      return null
    }

    // Apply the constant +20,000 TZS profit margin
    const finalPrice = Math.round(rawPrice + UNIVERSAL_PRICE_CUT_TZS)
    const category = mapToCanonicalCategory(rawCategory, name)

    return {
      name,
      price: finalPrice,
      rawPrice,
      cutAdded: UNIVERSAL_PRICE_CUT_TZS,
      image: image || "/placeholder.svg",
      swatchImages: swatchImages.slice(0, 6),
      description: description.slice(0, 1000),
      features: features.slice(0, 8),
      category,
      sku,
      sourceUrl: productUrl,
      sourceDomain: domain,
      stock: 15,
      rating: 5,
      type: "physical",
    }
  } catch (error) {
    console.error(`[UniversalScraper] Error scraping ${productUrl}:`, error)
    return null
  }
}

// Discover all product URLs from any eCommerce link or shop
export async function discoverProductUrlsFromEcommerce(targetUrl: string, maxLimit: number = 500): Promise<{ domain: string; productUrls: string[] }> {
  const urlObj = new URL(targetUrl.trim())
  const origin = urlObj.origin
  const domain = urlObj.hostname.replace(/^www\./, "")
  const productUrls = new Set<string>()

  // 1. Try fetching sitemap.xml directly
  try {
    const sitemapUrl = `${origin}/sitemap.xml`
    const sitemapRes = await fetch(sitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    })

    if (sitemapRes.ok) {
      const xml = await sitemapRes.text()
      const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g)
      for (const m of matches) {
        const u = m[1].trim()
        if (u.includes("/product/") || u.includes("/products/") || u.includes("/item/")) {
          productUrls.add(u)
          if (productUrls.size >= maxLimit) break
        }
      }
    }
  } catch (e) {
    console.warn(`[UniversalScraper] Sitemap discovery note for ${domain}:`, e)
  }

  // 2. Also scrape the given shop page directly (and pagination if applicable)
  if (productUrls.size < maxLimit) {
    try {
      const shopRes = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 0 },
      })

      if (shopRes.ok) {
        const html = await shopRes.text()
        const $ = cheerio.load(html)

        $('a[href]').each((_, el) => {
          let href = $(el).attr("href") || ""
          if (href.startsWith("/")) {
            href = `${origin}${href}`
          }
          if (href.includes("/product/") || href.includes("/products/")) {
            productUrls.add(href.split("?")[0])
          }
        })
      }
    } catch (e) {
      console.warn(`[UniversalScraper] Shop page discovery note for ${targetUrl}:`, e)
    }
  }

  return {
    domain,
    productUrls: Array.from(productUrls).slice(0, maxLimit),
  }
}

// Save or synchronize scraped product into Supabase catalog
export async function upsertScrapedProduct(product: ScrapedProduct): Promise<{ action: "created" | "updated" | "skipped"; id?: number }> {
  const supabase = createServerClient()

  // Check if product exists by name or sourceUrl feature tag
  const { data: existing } = await supabase
    .from("products")
    .select("id, name, price, features")
    .ilike("name", product.name)
    .limit(1)

  const sourceTag = `__source_url:${product.sourceUrl}__`
  const cleanFeatures = product.features.filter(f => !f.startsWith("__source_"))
  cleanFeatures.push(sourceTag)

  if (existing && existing.length > 0) {
    const existingProduct = existing[0]
    // Update price and source tag
    await supabase
      .from("products")
      .update({
        price: product.price,
        features: cleanFeatures,
        image: product.image || undefined,
        stock: 15,
      })
      .eq("id", existingProduct.id)

    return { action: "updated", id: existingProduct.id }
  }

  // Ensure category exists
  const { data: catData } = await supabase
    .from("categories")
    .select("id")
    .eq("name", product.category)
    .limit(1)

  if (!catData || catData.length === 0) {
    await supabase.from("categories").insert({ name: product.category, description: `${product.category} hardware & solutions` })
  }

  // Insert new product
  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      features: cleanFeatures && cleanFeatures.length > 0 ? cleanFeatures : ["High performance technology solution", "Official manufacturer warranty"],
      stock: product.stock,
      rating: product.rating,
      swatch_images: product.swatchImages || [],
    })
    .select("id")
    .single()

  if (error) {
    throw error
  }

  return { action: "created", id: inserted?.id }
}
