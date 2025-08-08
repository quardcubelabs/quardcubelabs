import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    console.log('=== API: Starting GET /api/reports ===')
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    console.log('Category filter:', category)
    
    const supabase = createServerClient()
    console.log('=== API: Supabase client created ===')
    
    let query = supabase.from("reports").select("*")
    if (category && category !== "all") {
      query = query.eq("category", category)
    }
    
    console.log('=== API: Executing query ===')
    const { data, error } = await query.order('lastgenerated', { ascending: false, nullsFirst: false })
    
    console.log('=== API: Query completed ===')
    console.log('Error:', error)
    console.log('Raw data:', data)
    console.log('Data length:', data?.length || 0)
    
    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Transform data to match expected interface, providing defaults for missing fields
    const transformedData = (data || []).map((report: any) => ({
      id: report.id || '',
      title: report.title || report.id?.replace(/-/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Untitled Report',
      description: report.description || `Generated report for ${report.category || 'general'} analysis`,
      category: report.category || 'General',
      formats: report.formats || ['pdf'],
      lastgenerated: report.lastgenerated || null,
      status: report.status || 'ready',
      size: report.size || '0 MB',
      downloads: report.downloads || 0
    }))
    
    console.log('=== API: Transformed data ===')
    console.log('Transformed length:', transformedData.length)
    console.log('Sample transformed:', transformedData[0])
    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
