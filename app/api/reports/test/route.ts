import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing')
    
    const supabase = createServerClient()
    
    console.log('Testing reports table access...')
    
    // First, let's try a simple count to see if table exists
    const { count, error: countError } = await supabase
      .from("reports")
      .select("*", { count: 'exact', head: true })
    
    console.log('Table count result:', { count, countError })
    
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
    
    console.log('Successfully fetched', data?.length || 0, 'reports')
    console.log('Table count:', count)
    console.log('Sample record structure:', data?.[0])
    console.log('Available columns:', data?.[0] ? Object.keys(data[0]) : 'No data')
    
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
