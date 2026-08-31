import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { ProductFormData } from "@/types/database"

// GET - Fetch a specific product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error(`Error fetching product with ID ${id}:`, error)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    
    // Map database response to Product interface
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
    
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update a specific product by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }
    
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
      .update(dbData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error(`Error updating product with ID ${id}:`, error)
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
    
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error in PUT /api/products/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a specific product by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params
    const id = parseInt(rawId)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error(`Error deleting product with ID ${id}:`, error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/products/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}