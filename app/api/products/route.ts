import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { ProductFormData } from "@/types/database"

// GET - Fetch all products or products by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    
    const supabase = createServerClient()
    
    let query = supabase.from('products').select('*').order('id')
    
    // Filter by category if provided
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    
    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }
    
    // Map database response to Product interface
    const products = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      image: row.image,
      description: row.description,
      features: row.features || [],
      stock: row.stock || 0,
      rating: row.rating || 5,
      swatchImages: row.swatch_images || [],
    }))
    
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error in GET /api/products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const productData: ProductFormData = body
    
    // Validate required fields
    if (!productData.name || !productData.category || !productData.price) {
      return NextResponse.json({ 
        error: "Missing required fields: name, category, and price are required" 
      }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Convert to database format
    const dbData = {
      name: productData.name,
      category: productData.category,
      price: productData.price,
      image: productData.image || '',
      description: productData.description || '',
      features: productData.features || [],
      stock: productData.stock || 0,
      rating: productData.rating || 5,
      swatch_images: productData.swatchImages || [],
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([dbData])
      .select()
      .single()
    
    if (error) {
      console.error("Error creating product:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Map response back to Product interface
    const product = {
      id: data.id,
      name: data.name,
      category: data.category,
      price: data.price,
      image: data.image,
      description: data.description,
      features: data.features || [],
      stock: data.stock || 0,
      rating: data.rating || 5,
      swatchImages: data.swatch_images || [],
    }
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}