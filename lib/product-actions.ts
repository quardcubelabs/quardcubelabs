"use server"

import { createServerClient } from "@/lib/supabase"

export type Product = {
  id: number
  name: string
  category: string
  price: number
  image: string
  description: string
  features: string[]
  stock: number
  rating: number
}

export type Category = {
  id: number
  name: string
}

// Get all products
export async function getProducts(): Promise<Product[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("products").select("*").order("id")

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data as Product[]
}

// Get product by ID
export async function getProductById(id: number): Promise<Product | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching product with ID ${id}:`, error)
    return null
  }

  return data as Product
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

  return data as Product[]
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

  return data as Product[]
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
