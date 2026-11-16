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
  condition: "NEW" | "REFURBISHED"
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
    let schemaCondition: string | null = null

    // Filter out invalid/favicon/placeholder images
    const isBadImg = (url: string) => {
      const u = (url || "").toLowerCase()
      return (
        u.includes("cropped-epic-favi-icon") ||
        u.includes("epic-favi") ||
        u.includes("favicon") ||
        u.includes("logo") ||
        u.includes("placeholder") ||
        u.includes("woocommerce-placeholder") ||
        u.endsWith("/storage") ||
        u === "https://maishacomputers.com/storage"
      )
    }

    // 0. Shopify Product JSON Endpoint (.js / .json)
    // Shopify storefronts expose rich, un-obfuscated JSON at /products/<handle>.js
    try {
      const cleanUrl = productUrl.split("?")[0].replace(/\/$/, "")
      const jsUrl = `${cleanUrl}.js`
      const jsRes = await fetch(jsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        next: { revalidate: 0 },
      })
      if (jsRes.ok) {
        const jsData = await jsRes.json()
        if (jsData && jsData.title) {
          name = jsData.title.trim()
          if (jsData.price) {
            // Shopify price is typically in cents (e.g. 179900000 = 1,799,000 TZS)
            const rawP = Number(jsData.price)
            rawPrice = rawP > 1000000 ? rawP / 100 : rawP
          }
          if (jsData.images && Array.isArray(jsData.images)) {
            const cleanImgs = jsData.images
              .map((img: string) => (img.startsWith("//") ? `https:${img}` : img))
              .filter((img: string) => !isBadImg(img))
            if (cleanImgs.length > 0) {
              image = cleanImgs[0]
              swatchImages = cleanImgs.slice(1, 7)
            }
          }
          if (jsData.type) {
            rawCategory = jsData.type.trim()
          }
          if (jsData.description) {
            const $d = cheerio.load(jsData.description)
            description = $d.text().replace(/\s+/g, " ").trim().substring(0, 1000)
            $d("li, tr, p").each((_, el) => {
              const t = $d(el).text().replace(/\s+/g, " ").trim()
              if (t.length >= 10 && t.length <= 160 && !features.includes(t)) {
                features.push(t)
              }
            })
          }
        }
      }
    } catch {
      // continue to schema / DOM parsing
    }

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
            if (item.itemCondition) schemaCondition = String(item.itemCondition)

            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
            if (offer && offer.price) {
              const p = parseFloat(String(offer.price).replace(/[^0-9.]/g, ""))
              if (!isNaN(p) && p > 0) rawPrice = p
            }
            if (offer && offer.itemCondition && !schemaCondition) {
              schemaCondition = String(offer.itemCondition)
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
      name = $('h1.product_title, h1.entry-title, h1').first().text().trim() ||
        $('meta[property="og:title"]').attr("content")?.trim() || ""
    }

    if (!image) {
      image = $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $('link[rel="image_src"]').attr("href") || ""
      if (!image) {
        const candidateImg = $(
          '.woocommerce-product-gallery__image img, .woocommerce-product-gallery img, img[data-large_image], img[src*="/products/"], img[src*="/product/"], img[data-src*="product"], .product-images img, img.wp-post-image'
        ).first()
        image = candidateImg.attr("data-large_image") ||
          candidateImg.attr("data-src") ||
          candidateImg.attr("data-lazy-src") ||
          candidateImg.attr("src") || ""
      }
    }

    // Resolve relative image URLs against target site domain
    if (image && !image.startsWith("http") && !image.startsWith("data:")) {
      try {
        image = new URL(image, productUrl).href
      } catch {
        // fallback
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

    if (image && isBadImg(image)) {
      image = ""
    }

    // Secondary gallery images
    $('img[src*="/products/"], img[src*="/product/"], .woocommerce-product-gallery img, img[data-large_image]').each((_, el) => {
      let src = $(el).attr("data-large_image") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || $(el).attr("src")
      if (src && !src.startsWith("http") && !src.startsWith("data:")) {
        try {
          src = new URL(src, productUrl).href
        } catch {}
      }
      if (src && src.startsWith("http") && !isBadImg(src) && !swatchImages.includes(src)) {
        swatchImages.push(src)
      }
    })

    // If main image is still missing but we found gallery images, use the first gallery image
    if (!image && swatchImages.length > 0) {
      image = swatchImages[0]
    }

    // Features / Specifications
    $('ul li, dl dd, table tr, .woocommerce-product-attributes tr').each((_, el) => {
      const txt = $(el).text().replace(/\s+/g, " ").trim()
      if (txt.length >= 10 && txt.length <= 160 && !features.includes(txt)) {
        features.push(txt)
      }
    })

    if (!description) {
      const shortDesc = $('.woocommerce-product-details__short-description, .product-short-description, [class*="short-description"]').first().text().replace(/\s+/g, " ").trim()
      const tabDesc = $('#tab-description, .product-description, [class*="description"], [itemprop="description"]').first().text().replace(/\s+/g, " ").trim()
      const metaDesc = $('meta[name="description"]').attr("content")?.trim() || $('meta[property="og:description"]').attr("content")?.trim()

      description = (shortDesc || tabDesc || metaDesc || "").substring(0, 1000)

      if (!description && features.length > 0) {
        description = features.slice(0, 4).join(". ") + "."
      }

      if (!description) {
        description = `Official ${name} high-performance solution engineered for enterprise productivity and reliability.`
      }
    }

    if (!name || rawPrice <= 0) {
      console.warn(`[UniversalScraper] Skipping ${productUrl} (missing valid name or price > 0)`)
      return null
    }

    // Determine condition: "NEW" vs "REFURBISHED"
    let condition: "NEW" | "REFURBISHED" = "NEW"
    const textToCheck = `${schemaCondition || ""} ${productUrl} ${name} ${rawCategory} ${description} ${features.join(" ")}`.toLowerCase()
    if (
      /\b(refurbished|refurb|renewed|pre-owned|preowned|open-box|reconditioned)\b/i.test(textToCheck) ||
      textToCheck.includes("used laptop") ||
      textToCheck.includes("used computer") ||
      textToCheck.includes("used phone")
    ) {
      condition = "REFURBISHED"
    }

    // Embed condition tag into features
    const conditionedFeatures = [
      `__condition:${condition}__`,
      condition === "REFURBISHED"
        ? "Condition: Certified Refurbished (Grade-A Tested)"
        : "Condition: Brand New (Factory Sealed)",
      ...features.filter((f) => !f.startsWith("__condition:")),
    ]

    // Apply the constant +20,000 TZS profit margin
    const finalPrice = Math.round(rawPrice + UNIVERSAL_PRICE_CUT_TZS)
    const category = mapToCanonicalCategory(rawCategory, name)

    return {
      name,
      price: finalPrice,
      rawPrice,
      cutAdded: UNIVERSAL_PRICE_CUT_TZS,
      image: image || "",
      swatchImages: swatchImages.slice(0, 6),
      description: description.slice(0, 1000),
      features: conditionedFeatures.slice(0, 10),
      category,
      sku,
      sourceUrl: productUrl,
      sourceDomain: domain,
      stock: 15,
      rating: 5,
      type: "physical",
      condition,
    }
  } catch (error) {
    console.error(`[UniversalScraper] Error scraping ${productUrl}:`, error)
    return null
  }
}

// Discover all product URLs from any eCommerce link, collections page, or shop
export async function discoverProductUrlsFromEcommerce(targetUrl: string, maxLimit: number = 500): Promise<{ domain: string; productUrls: string[] }> {
  const urlObj = new URL(targetUrl.trim())
  const origin = urlObj.origin
  const domain = urlObj.hostname.replace(/^www\./, "")
  const productUrls = new Set<string>()

  // 1. Shopify native products.json API (Fastest & most comprehensive for Shopify stores)
  try {
    const isCollectionUrl = urlObj.pathname.includes("/collections/") && urlObj.pathname.split("/collections/")[1]?.replace(/\/$/, "")
    const jsonEndpoint = isCollectionUrl
      ? `${origin}/collections/${isCollectionUrl}/products.json`
      : `${origin}/products.json`

    let page = 1
    let hasMore = true

    while (hasMore && productUrls.size < maxLimit) {
      const pUrl = `${jsonEndpoint}?limit=250&page=${page}`
      const res = await fetch(pUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate: 0 },
      })
      if (!res.ok) break

      const data = await res.json()
      if (!data || !Array.isArray(data.products) || data.products.length === 0) {
        hasMore = false
        break
      }

      for (const p of data.products) {
        if (p.handle) {
          productUrls.add(`${origin}/products/${p.handle}`)
          if (productUrls.size >= maxLimit) break
        }
      }
      if (data.products.length < 250) hasMore = false
      page++
    }
  } catch (e) {
    console.warn(`[UniversalScraper] Shopify products.json check note for ${domain}:`, e)
  }

  // 2. Sitemap / SitemapIndex recursion (Works across WooCommerce, Magento, PrestaShop, Shopify, etc.)
  if (productUrls.size < maxLimit) {
    const sitemapCandidates = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/product-sitemap.xml`,
      `${origin}/sitemap_products_1.xml`
    ]

    for (const smUrl of sitemapCandidates) {
      if (productUrls.size >= maxLimit) break
      try {
        const smRes = await fetch(smUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 0 },
        })
        if (!smRes.ok) continue

        const xml = await smRes.text()

        // Check if it's a sitemapindex pointing to child sitemaps
        const subSitemaps = Array.from(xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/gi)).map(m => m[1].replace(/&amp;/g, "&").trim())

        if (subSitemaps.length > 0) {
          // Prioritize product sub-sitemaps
          const productSitemaps = subSitemaps.filter(u => u.includes("product") || (!u.includes("page") && !u.includes("blog") && !u.includes("post")))
          const toFetch = productSitemaps.length > 0 ? productSitemaps : subSitemaps.slice(0, 8)

          for (const subUrl of toFetch) {
            if (productUrls.size >= maxLimit) break
            try {
              const subRes = await fetch(subUrl, {
                headers: { "User-Agent": "Mozilla/5.0" },
                next: { revalidate: 0 },
              })
              if (subRes.ok) {
                const subXml = await subRes.text()
                const locs = Array.from(subXml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map(m => m[1].trim())
                for (const u of locs) {
                  if (u.includes("/product/") || u.includes("/products/") || u.includes("/item/")) {
                    productUrls.add(u.split("?")[0])
                    if (productUrls.size >= maxLimit) break
                  }
                }
              }
            } catch {}
          }
        } else {
          // Standard urlset
          const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi)).map(m => m[1].trim())
          for (const u of locs) {
            if (u.includes("/product/") || u.includes("/products/") || u.includes("/item/")) {
              productUrls.add(u.split("?")[0])
              if (productUrls.size >= maxLimit) break
            }
          }
        }
      } catch (e) {
        console.warn(`[UniversalScraper] Sitemap error for ${smUrl}:`, e)
      }
    }
  }

  // 3. Collection & Category HTML Crawling (e.g. /collections/, /collections/<cat>, /categories/, /shop)
  if (productUrls.size < maxLimit) {
    try {
      const pageRes = await fetch(targetUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate: 0 },
      })

      if (pageRes.ok) {
        const html = await pageRes.text()
        const $ = cheerio.load(html)

        // Find direct product links on this initial page
        $('a[href]').each((_, el) => {
          let href = $(el).attr("href") || ""
          if (href.startsWith("/")) href = `${origin}${href}`
          if (href.includes("/product/") || href.includes("/products/") || href.includes("/item/")) {
            productUrls.add(href.split("?")[0])
          }
        })

        // If targetUrl is a collections directory or page with sub-collection / category links
        const isCollectionOrCategoryIndex =
          urlObj.pathname.includes("/collections") ||
          urlObj.pathname.includes("/categories") ||
          urlObj.pathname.includes("/category") ||
          urlObj.pathname.includes("/shop")

        if (isCollectionOrCategoryIndex && productUrls.size < maxLimit) {
          const subCategoryLinks = new Set<string>()

          $('a[href*="/collections/"], a[href*="/category/"], a[href*="/product-category/"]').each((_, el) => {
            let h = $(el).attr("href") || ""
            if (h.startsWith("/")) h = `${origin}${h}`
            const cleanH = h.split("?")[0].replace(/\/$/, "")
            if (
              cleanH !== targetUrl.replace(/\/$/, "") &&
              cleanH !== `${origin}/collections` &&
              !cleanH.includes("/products/") &&
              !cleanH.includes("/product/")
            ) {
              subCategoryLinks.add(cleanH)
            }
          })

          // Crawl sub-collections / categories
          for (const catUrl of Array.from(subCategoryLinks).slice(0, 30)) {
            if (productUrls.size >= maxLimit) break
            try {
              const catRes = await fetch(catUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
                next: { revalidate: 0 },
              })
              if (catRes.ok) {
                const catHtml = await catRes.text()
                const $cat = cheerio.load(catHtml)
                $cat('a[href]').each((_, el) => {
                  let href = $cat(el).attr("href") || ""
                  if (href.startsWith("/")) href = `${origin}${href}`
                  if (href.includes("/product/") || href.includes("/products/") || href.includes("/item/")) {
                    productUrls.add(href.split("?")[0])
                  }
                })
              }
            } catch {}
          }
        }

        // Also follow pagination if targetUrl is a paginated collection/shop
        const paginationLinks = new Set<string>()
        $('a[href*="page="], a.page-numbers, .pagination a').each((_, el) => {
          let href = $(el).attr("href") || ""
          if (href.startsWith("/")) href = `${origin}${href}`
          if (href && href !== targetUrl) paginationLinks.add(href)
        })

        for (const pUrl of Array.from(paginationLinks).slice(0, 10)) {
          if (productUrls.size >= maxLimit) break
          try {
            const pRes = await fetch(pUrl, {
              headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
              next: { revalidate: 0 },
            })
            if (pRes.ok) {
              const pHtml = await pRes.text()
              const $p = cheerio.load(pHtml)
              $p('a[href]').each((_, el) => {
                let href = $p(el).attr("href") || ""
                if (href.startsWith("/")) href = `${origin}${href}`
                if (href.includes("/product/") || href.includes("/products/") || href.includes("/item/")) {
                  productUrls.add(href.split("?")[0])
                }
              })
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn(`[UniversalScraper] HTML crawl error for ${targetUrl}:`, e)
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
