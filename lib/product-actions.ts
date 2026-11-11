"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { logAuditEvent } from "./audit-actions"
import { Product, Category, ProductFormData } from "@/types/database"
import { revalidatePath } from "next/cache"

// Re-export types for components
export type { Product, Category, ProductFormData } from "@/types/database"

// Helper to convert database row to Product interface
function mapDbRowToProduct(row: any): Product {
  const rawFeatures: string[] = Array.isArray(row.features) ? row.features : []
  const notOnEpic = rawFeatures.some(
    (f: string) => f === "__epic_status:not_on_epic__" || f === "not_on_epic"
  )
  const cleanFeatures = rawFeatures.filter(
    (f: string) => !f.startsWith("__epic_") && f !== "not_on_epic"
  )

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    image: row.image,
    description: row.description,
    features: cleanFeatures,
    stock: row.stock || 0,
    rating: row.rating || 5,
    type: row.type || "physical",
    swatchImages: row.swatch_images || [],
    notOnEpic,
    isEpicSynced: !notOnEpic,
  }
}

// Get all products
// By default (e.g. for the public shop page /shop), products that are unlisted (not on Epic Computers)
// are filtered out. To include all catalog products (e.g. for Admin inventory & Admin products pages),
// pass includeUnlisted: true.
export async function getProducts(options: { includeUnlisted?: boolean } = {}): Promise<Product[]> {
  const { includeUnlisted = false } = options
  const supabase = createServerClient()

  const { data, error } = await supabase.from("products").select("*").order("id")

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  const all = (data || []).map(mapDbRowToProduct)
  if (includeUnlisted) {
    return all
  }
  return all.filter((p) => !p.notOnEpic)
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
    return null
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

  const { data, error } = await supabase.from("products").select("*").eq("category", category).order("id")

  if (error) {
    console.error(`Error fetching products in category ${category}:`, error)
    return []
  }

  const all = (data || []).map(mapDbRowToProduct)
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
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
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
  const { isAdmin, user } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
  }

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
  const { isAdmin, user } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
  }

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
  const { isAdmin, user } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
  }

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

// Create a new category
export async function createCategory(categoryData: { name: string }): Promise<{ success: boolean; error?: string; data?: Category }> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
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
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
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
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin privileges required" }
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
