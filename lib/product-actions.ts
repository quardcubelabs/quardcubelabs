"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { sanitizePostgrestFilterValue } from "@/lib/security/url-guard"
import { assertPermission } from "@/lib/rbac"
import { logAuditEvent } from "./audit-actions"
import { Product, Category, ProductFormData } from "@/types/database"
import { revalidatePath } from "next/cache"

// Re-export types for components
export type { Product, Category, ProductFormData } from "@/types/database"

function sanitizeProductText(text?: string | null): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/Genuine product sourced from [^.]*\.?\s*(Includes standard manufacturer warranty\.?)?/gi, '')
    .replace(/sourced from (?:Epic Computers|Epic|Maisha Computers|Maisha|Laptop City|laptopcitystore|[^,.;\n]+)/gi, '')
    .replace(/\b(?:Epic Computers|epiccomputers(?:\.co\.tz)?|maishacomputers(?:\.com)?|laptopcitystore(?:\.co\.tz)?)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Helper to convert database row to Product interface
function mapDbRowToProduct(row: any): Product {
  const rawFeatures: string[] = Array.isArray(row.features) ? row.features : []
  const notOnEpic = rawFeatures.some(
    (f: string) => f === "__epic_status:not_on_epic__" || f === "not_on_epic"
  )

  let sourceDomain = "other"
  let epicUrl: string | undefined = undefined

  for (const f of rawFeatures) {
    if (typeof f === "string") {
      if (f.startsWith("__source_url:")) {
        const urlStr = f.replace(/^__source_url:/, "").replace(/__$/, "").trim()
        try {
          const parsed = new URL(urlStr)
          sourceDomain = parsed.hostname.replace(/^www\./, "").toLowerCase()
        } catch {
          if (urlStr.includes("maishacomputers")) sourceDomain = "maishacomputers.com"
          else if (urlStr.includes("epiccomputers")) sourceDomain = "epiccomputers.co.tz"
          else if (urlStr.includes("laptopcitystore")) sourceDomain = "laptopcitystore.co.tz"
        }
      } else if (f.startsWith("__epic_url:")) {
        epicUrl = f.replace(/^__epic_url:/, "").replace(/__$/, "").trim()
        sourceDomain = "epiccomputers.co.tz"
      }
    }
  }

  // Fallbacks based on image or feature text mentions
  if (sourceDomain === "other") {
    const img = (row.image || "").toLowerCase()
    if (img.includes("maishacomputers")) {
      sourceDomain = "maishacomputers.com"
    } else if (img.includes("epiccomputers")) {
      sourceDomain = "epiccomputers.co.tz"
    } else if (img.includes("laptopcitystore")) {
      sourceDomain = "laptopcitystore.co.tz"
    } else if (rawFeatures.some(f => typeof f === "string" && f.toLowerCase().includes("maisha"))) {
      sourceDomain = "maishacomputers.com"
    } else if (rawFeatures.some(f => typeof f === "string" && (f.toLowerCase().includes("epic") || f.startsWith("__epic_")))) {
      sourceDomain = "epiccomputers.co.tz"
    } else if (rawFeatures.some(f => typeof f === "string" && f.toLowerCase().includes("laptopcity"))) {
      sourceDomain = "laptopcitystore.co.tz"
    }
  }

  // Extract or detect product condition ('NEW' vs 'REFURBISHED')
  let condition: 'NEW' | 'REFURBISHED' = 'NEW'
  const explicitConditionTag = rawFeatures.find(
    (f: string) => typeof f === 'string' && f.startsWith('__condition:')
  )
  if (explicitConditionTag) {
    condition = explicitConditionTag.includes('REFURBISHED') ? 'REFURBISHED' : 'NEW'
  } else {
    // Intelligent heuristic check from category, name, features, or description
    const fullText = `${row.category || ''} ${row.name || ''} ${row.description || ''} ${rawFeatures.join(' ')}`.toLowerCase()
    if (
      /\b(refurbished|refurb|renewed|pre-owned|preowned|open-box|reconditioned)\b/i.test(fullText) ||
      fullText.includes('used laptop') ||
      fullText.includes('used computer')
    ) {
      condition = 'REFURBISHED'
    } else {
      condition = 'NEW'
    }
  }

  const cleanFeatures = rawFeatures.filter(
    (f: string) =>
      !f.startsWith("__epic_") &&
      !f.startsWith("__source_") &&
      !f.startsWith("__condition:") &&
      f !== "not_on_epic"
  )

  const rawImage = (row.image || '').trim()
  const rawImageLower = rawImage.toLowerCase()
  const isBad =
    rawImageLower === '' ||
    rawImageLower === '/placeholder.svg' ||
    rawImageLower.includes('placeholder') ||
    rawImageLower.includes('cropped-epic-favi-icon') ||
    rawImageLower.includes('epic-favi') ||
    rawImageLower.endsWith('/storage') ||
    rawImageLower === 'https://maishacomputers.com/storage' ||
    rawImageLower.includes('woocommerce-placeholder')

  const cleanImage = isBad ? '' : rawImage

  const rawSwatches: string[] = Array.isArray(row.swatch_images) ? row.swatch_images : []
  const cleanSwatches = rawSwatches.filter((s: string) => {
    if (!s || typeof s !== 'string') return false
    const sLower = s.toLowerCase().trim()
    return (
      sLower !== '' &&
      sLower !== '/placeholder.svg' &&
      !sLower.includes('placeholder') &&
      !sLower.includes('cropped-epic-favi-icon') &&
      !sLower.includes('epic-favi') &&
      !sLower.endsWith('/storage') &&
      !sLower.includes('woocommerce-placeholder')
    )
  })

  const cleanDescription = sanitizeProductText(row.description)
  const sanitizedFeatures = cleanFeatures
    .map(f => typeof f === 'string' ? sanitizeProductText(f) : f)
    .filter(Boolean)

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    image: cleanImage,
    description: cleanDescription,
    features: sanitizedFeatures,
    stock: row.stock || 0,
    rating: row.rating || 5,
    type: row.type || "physical",
    swatchImages: cleanSwatches,
    notOnEpic,
    isEpicSynced: !notOnEpic,
    epicUrl,
    sourceDomain,
    condition,
  }
}

// Get all products
// By default (e.g. for the public shop page /shop), products that are unlisted (not on Epic Computers)
// are filtered out. To include all catalog products (e.g. for Admin inventory & Admin products pages),
// pass includeUnlisted: true.
export async function getProducts(options: { includeUnlisted?: boolean } = {}): Promise<Product[]> {
  const { includeUnlisted = false } = options
  const supabase = createServerClient()

  let allRows: any[] = []
  const PAGE_SIZE = 1000
  let page = 0
  let hasMore = true

  // Paginate through Supabase to overcome the default 1,000-row limit
  while (hasMore) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching products:", error)
      break
    }

    if (data && data.length > 0) {
      allRows.push(...data)
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page++
      }
    } else {
      hasMore = false
    }
  }

  const all = allRows.map(mapDbRowToProduct)
  if (includeUnlisted) {
    return all
  }
  return all.filter((p) => !p.notOnEpic)
}

/**
 * Get featured in-stock products for the homepage.
 * Optimized to fetch a small slice rather than the entire 1,000+ catalog.
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .gt("stock", 0)
    .order("rating", { ascending: false })
    .limit(limit * 3)

  if (error) {
    console.error("Error fetching featured products:", error)
    return []
  }

  const mapped = (data || [])
    .map(mapDbRowToProduct)
    .filter((p) => !p.notOnEpic && p.image)

  return mapped.slice(0, limit)
}

// Get product by ID
// For public shop, returns null if product is unlisted from Epic Computers unless includeUnlisted: true.
export async function getProductById(
  id: number,
  options: { includeUnlisted?: boolean } = {}
): Promise<Product | null> {
  const { includeUnlisted = false } = options
  const supabase = createServerClient()

  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error || !data) {
    if (error && error.code !== "PGRST116") {
      console.error(`Error fetching product with ID ${id}:`, error)
    }
    return null
  }

  const product = mapDbRowToProduct(data)
  if (!includeUnlisted && product.notOnEpic) {
    // Return product gracefully with 0 stock so landing page renders "Sold Out"
    // instead of throwing a 404 broken page error to Google Merchant Center / customers
    return {
      ...product,
      stock: 0,
    }
  }

  return product
}

// Get products by category
export async function getProductsByCategory(
  category: string,
  options: { includeUnlisted?: boolean } = {}
): Promise<Product[]> {
  const { includeUnlisted = false } = options
  const supabase = createServerClient()

  // If category is 'All', return all products
  if (category === "All") {
    return getProducts({ includeUnlisted })
  }

  let allRows: any[] = []
  const PAGE_SIZE = 1000
  let page = 0
  let hasMore = true

  while (hasMore) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .order("id", { ascending: false })
      .range(from, to)

    if (error) {
      console.error(`Error fetching products in category ${category}:`, error)
      break
    }

    if (data && data.length > 0) {
      allRows.push(...data)
      if (data.length < PAGE_SIZE) {
        hasMore = false
      } else {
        page++
      }
    } else {
      hasMore = false
    }
  }

  const all = allRows.map(mapDbRowToProduct)
  if (includeUnlisted) {
    return all
  }
  return all.filter((p) => !p.notOnEpic)
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("categories").select("*").order("id")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
}

// Search products
export async function searchProducts(
  query: string,
  options: { includeUnlisted?: boolean } = {}
): Promise<Product[]> {
  const { includeUnlisted = false } = options
  const safeQuery = sanitizePostgrestFilterValue(query.trim())
  if (!safeQuery) return []

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`)
    .order("id")

  if (error) {
    console.error(`Error searching products with query "${query}":`, error)
    return []
  }

  const all = (data || []).map(mapDbRowToProduct)
  if (includeUnlisted) {
    return all
  }
  return all.filter((p) => !p.notOnEpic)
}

// Update products in database
export async function updateProducts(): Promise<{ success: boolean; error?: string }> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
  }

  const supabase = createServerClient()
  const { products } = await import("./data")

  // First, delete all existing products
  const { error: deleteError } = await supabase.from("products").delete().neq("id", 0)

  if (deleteError) {
    console.error("Error deleting existing products:", deleteError)
    return { success: false, error: deleteError.message }
  }

  // Then, insert all products from data.ts
  const { error: insertError } = await supabase.from("products").insert(products)

  if (insertError) {
    console.error("Error inserting products:", insertError)
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

// Admin CRUD Operations

// Create a new product
export async function createProduct(productData: ProductFormData): Promise<{ success: boolean; error?: string; data?: Product }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const { user } = await verifyAdminSession()
  const supabase = createServerClient()

  const dbData = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    image: productData.image,
    description: productData.description,
    features: productData.features,
    stock: productData.stock,
    rating: productData.rating,
    swatch_images: productData.swatchImages || [],
  }

  const { data, error } = await supabase
    .from("products")
    .insert([dbData])
    .select()
    .single()

  if (error) {
    console.error("Error creating product:", error)
    return { success: false, error: error.message }
  }

  const newProduct = mapDbRowToProduct(data)

  await logAuditEvent({
    module: "inventory",
    action: "created",
    record_id: String(newProduct.id),
    description: `Added product "${newProduct.name}" to catalog [${newProduct.category}] - TZS ${Number(newProduct.price).toLocaleString()}`,
    user_email: user?.email,
    user_name: user?.staffMember?.full_name || user?.email,
    branch_id: user?.staffMember?.branch_id,
    branch_name: user?.staffMember?.branch_name
  })

  // Revalidate paths to ensure fresh data
  revalidatePath("/admin/products")
  revalidatePath("/shop")

  return { success: true, data: newProduct }
}

// Update an existing product
export async function updateProduct(id: number, productData: ProductFormData): Promise<{ success: boolean; error?: string; data?: Product }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const { user } = await verifyAdminSession()
  const supabase = createServerClient()

  const dbData = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    image: productData.image,
    description: productData.description,
    features: productData.features,
    stock: productData.stock,
    rating: productData.rating,
    swatch_images: productData.swatchImages || [],
  }

  const { data, error } = await supabase
    .from("products")
    .update(dbData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating product:", error)
    return { success: false, error: error.message }
  }

  const updated = mapDbRowToProduct(data)

  await logAuditEvent({
    module: "inventory",
    action: "updated",
    record_id: String(id),
    description: `Updated product "${updated.name}" specifications and inventory stock`,
    user_email: user?.email,
    user_name: user?.staffMember?.full_name || user?.email,
    branch_id: user?.staffMember?.branch_id,
    branch_name: user?.staffMember?.branch_name
  })

  // Revalidate paths to ensure fresh data
  revalidatePath("/admin/products")
  revalidatePath("/shop")

  return { success: true, data: updated }
}

// Delete a product
export async function deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const { user } = await verifyAdminSession()
  const supabase = createServerClient()

  // First fetch the product so we have its title/category for the audit log
  let targetProduct: any = null
  try {
    const { data: prod } = await supabase
      .from("products")
      .select("id, name, category, price, stock")
      .eq("id", id)
      .maybeSingle()
    targetProduct = prod
  } catch (e) {
    console.warn("Could not pre-fetch product before deletion:", e)
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting product:", error)
    return { success: false, error: error.message }
  }

  const productName = targetProduct?.name || `Product #${id}`
  const productCategory = targetProduct?.category || "Inventory"

  await logAuditEvent({
    module: "inventory",
    action: "deleted",
    record_id: String(id),
    description: `Deleted catalog product "${productName}" [${productCategory}]`,
    previous_state: targetProduct,
    user_email: user?.email,
    user_name: user?.staffMember?.full_name || user?.email,
    branch_id: user?.staffMember?.branch_id,
    branch_name: user?.staffMember?.branch_name
  })

  // Revalidate paths to ensure fresh data
  revalidatePath("/admin/products")
  revalidatePath("/shop")

  return { success: true }
}

// Bulk delete products in single/batched SQL transaction
export async function deleteMultipleProducts(ids: number[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, count: 0, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const { user } = await verifyAdminSession()

  if (!ids || ids.length === 0) {
    return { success: true, count: 0 }
  }

  const supabase = createServerClient()
  const CHUNK_SIZE = 100
  let totalDeleted = 0

  try {
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE)
      const { error, count } = await supabase
        .from("products")
        .delete({ count: "exact" })
        .in("id", chunk)

      if (error) {
        console.error("Error bulk deleting products chunk:", error)
        return { success: false, count: totalDeleted, error: error.message }
      }
      totalDeleted += (count !== null && count !== undefined) ? count : chunk.length
    }

    await logAuditEvent({
      module: "inventory",
      action: "deleted",
      record_id: "bulk",
      description: `Bulk deleted ${totalDeleted} catalog products (${ids.slice(0, 50).join(", ")})`,
      user_email: user?.email,
      user_name: user?.staffMember?.full_name || user?.email,
      branch_id: user?.staffMember?.branch_id,
      branch_name: user?.staffMember?.branch_name
    })

    revalidatePath("/admin/products")
    revalidatePath("/shop")

    return { success: true, count: totalDeleted }
  } catch (err: any) {
    console.error("Bulk delete error:", err)
    return { success: false, count: totalDeleted, error: err.message || "Failed to bulk delete products" }
  }
}

// Bulk update category for selected products
export async function bulkUpdateProductsCategory(ids: number[], category: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, count: 0, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const { user } = await verifyAdminSession()

  if (!ids || ids.length === 0 || !category) {
    return { success: true, count: 0 }
  }

  const supabase = createServerClient()
  const CHUNK_SIZE = 100
  let totalUpdated = 0

  try {
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE)
      const { error, count } = await supabase
        .from("products")
        .update({ category, updated_at: new Date().toISOString() }, { count: "exact" })
        .in("id", chunk)

      if (error) {
        return { success: false, count: totalUpdated, error: error.message }
      }
      totalUpdated += (count !== null && count !== undefined) ? count : chunk.length
    }

    revalidatePath("/admin/products")
    revalidatePath("/shop")

    return { success: true, count: totalUpdated }
  } catch (err: any) {
    return { success: false, count: totalUpdated, error: err.message || "Failed to bulk update categories" }
  }
}

// Bulk update stock for selected products
export async function bulkUpdateProductsStock(ids: number[], stock: number): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, count: 0, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const { user } = await verifyAdminSession()

  if (!ids || ids.length === 0) {
    return { success: true, count: 0 }
  }

  const supabase = createServerClient()
  const CHUNK_SIZE = 100
  let totalUpdated = 0

  try {
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE)
      const { error, count } = await supabase
        .from("products")
        .update({ stock: Math.max(0, stock), updated_at: new Date().toISOString() }, { count: "exact" })
        .in("id", chunk)

      if (error) {
        return { success: false, count: totalUpdated, error: error.message }
      }
      totalUpdated += (count !== null && count !== undefined) ? count : chunk.length
    }

    revalidatePath("/admin/products")
    revalidatePath("/shop")

    return { success: true, count: totalUpdated }
  } catch (err: any) {
    return { success: false, count: totalUpdated, error: err.message || "Failed to bulk update stock" }
  }
}

// Create a new category
export async function createCategory(categoryData: { name: string }): Promise<{ success: boolean; error?: string; data?: Category }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("categories")
    .insert([categoryData])
    .select()
    .single()

  if (error) {
    console.error("Error creating category:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Category }
}

// Update an existing category
export async function updateCategory(id: number, categoryData: { name: string }): Promise<{ success: boolean; error?: string; data?: Category }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("categories")
    .update(categoryData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating category:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: data as Category }
}

// Delete a category
export async function deleteCategory(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await assertPermission("products:manage")
  } catch (authErr: any) {
    return { success: false, error: authErr.message || "Unauthorized: Products manage permission required" }
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting category:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Sync all product prices with Epic Computers
export async function syncEpicProductPrices(dryRun: boolean = false) {
  const { isAdmin, user } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
  }

  const { syncAllProductPrices } = await import("@/lib/epic-scraper")
  return syncAllProductPrices({
    dryRun,
    userEmail: user?.email,
    userName: user?.staffMember?.full_name || user?.name || user?.email,
    branchId: user?.staffMember?.branch_id,
    branchName: user?.staffMember?.branch_name,
  })
}
