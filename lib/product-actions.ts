"use server"

import { createServerClient } from "@/lib/supabase"
import { Product, Category, ProductFormData } from "@/types/database"

// Re-export types for components
export type { Product, Category, ProductFormData } from "@/types/database"

// Helper to convert database row to Product interface
function mapDbRowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    image: row.image,
    description: row.description,
    features: row.features || [],
    stock: row.stock || 0,
    rating: row.rating || 5,
    type: row.type || 'physical',
    swatchImages: row.swatch_images || [],
  }
}

// Get all products
export async function getProducts(): Promise<Product[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("products").select("*").order("id")

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return (data || []).map(mapDbRowToProduct)
}

// Get product by ID
export async function getProductById(id: number): Promise<Product | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching product with ID ${id}:`, error)
    return null
  }

  return data ? mapDbRowToProduct(data) : null
}

// Get products by category
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const supabase = createServerClient()

  // If category is 'All', return all products
  if (category === "All") {
    return getProducts()
  }

  const { data, error } = await supabase.from("products").select("*").eq("category", category).order("id")

  if (error) {
    console.error(`Error fetching products in category ${category}:`, error)
    return []
  }

  return (data || []).map(mapDbRowToProduct)
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
export async function searchProducts(query: string): Promise<Product[]> {
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

  return (data || []).map(mapDbRowToProduct)
}

// Update products in database
export async function updateProducts(): Promise<void> {
  const supabase = createServerClient()
  const { products } = await import("./data")

  // First, delete all existing products
  const { error: deleteError } = await supabase.from("products").delete().neq("id", 0)

  if (deleteError) {
    console.error("Error deleting existing products:", deleteError)
    return
  }

  // Then, insert all products from data.ts
  const { error: insertError } = await supabase.from("products").insert(products)

  if (insertError) {
    console.error("Error inserting products:", insertError)
    return
  }

  console.log("Successfully updated products in database")
}

// Admin CRUD Operations

// Create a new product
export async function createProduct(productData: ProductFormData): Promise<{ success: boolean; error?: string; data?: Product }> {
  const supabase = createServerClient()

  // Include swatch_images column (snake_case for database)
  const dbData = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    image: productData.image,
    description: productData.description,
    features: productData.features,
    stock: productData.stock,
    rating: productData.rating,
    type: productData.type || 'physical',
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

  return { success: true, data: mapDbRowToProduct(data) }
}

// Update an existing product
export async function updateProduct(id: number, productData: ProductFormData): Promise<{ success: boolean; error?: string; data?: Product }> {
  const supabase = createServerClient()

  // Include swatch_images column (snake_case for database)
  const dbData = {
    name: productData.name,
    category: productData.category,
    price: productData.price,
    image: productData.image,
    description: productData.description,
    features: productData.features,
    stock: productData.stock,
    rating: productData.rating,
    type: productData.type || 'physical',
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

  return { success: true, data: mapDbRowToProduct(data) }
}

// Delete a product
export async function deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient()

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting product:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Create a new category
export async function createCategory(categoryData: { name: string }): Promise<{ success: boolean; error?: string; data?: Category }> {
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
