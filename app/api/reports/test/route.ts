import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    
    const supabase = createServerClient()
    
    
    // First, let's try a simple count to see if table exists
    const { count, error: countError } = await supabase
      .from("reports")
      .select("*", { count: 'exact', head: true })
    
    
    // Now try with RLS bypassed (for service role)
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .limit(1)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        count: count 
      }, { status: 500 })
    }
    
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      tableCount: count,
      sampleRecord: data?.[0],
      availableColumns: data?.[0] ? Object.keys(data[0]) : [],
      data: data || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 })
  }
}
