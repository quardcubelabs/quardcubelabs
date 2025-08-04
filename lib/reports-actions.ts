import { createClient } from "@supabase/supabase-js"

export type Report = {
  id: string
  title: string
  description: string
  category: string
  formats: string[]
  lastGenerated: string
  status: string
  size: string
  downloads: number
}

export type CustomReportConfig = {
  name: string
  dateRange: string
  startDate: string
  endDate: string
  categories: string[]
  format: string
  includeCharts: boolean
  scheduleFrequency: string
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function getReports(category?: string): Promise<Report[]> {
  let query = supabase.from("reports").select("*")
  if (category && category !== "all") query = query.eq("category", category)
  const { data } = await query
  return data || []
}

export async function generateReport(reportId: string): Promise<boolean> {
  // Simulate generation and update status
  await new Promise(res => setTimeout(res, 2000))
  await supabase.from("reports").update({ status: "ready", lastGenerated: new Date().toISOString() }).eq("id", reportId)
  return true
}

export async function downloadReport(reportId: string, format: string): Promise<Blob> {
  // Simulate download
  await new Promise(res => setTimeout(res, 1000))
  return new Blob([`Report ${reportId} in ${format}`], { type: "application/octet-stream" })
}

export async function createCustomReport(config: CustomReportConfig): Promise<boolean> {
  await supabase.from("reports").insert({
    id: `custom-${Date.now()}`,
    title: config.name,
    description: "Custom report",
    category: config.categories[0] || "Custom",
    formats: [config.format],
    lastGenerated: "",
    status: config.scheduleFrequency === "none" ? "generating" : "scheduled",
    size: "0 MB",
    downloads: 0
  })
  return true
}
