import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

// GET - Fetch all categories
export async function GET() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id')
    
    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in GET /api/categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Missing required field: name is required" 
      }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single()
    
    if (error) {
      console.error("Error creating category:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/categories:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}