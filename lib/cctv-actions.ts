"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import { 
  CctvSiteSurvey, 
  CctvSiteSurveyItem, 
  CctvProject, 
  CctvProjectItem, 
  CctvProductMetadata, 
  StorageCalculationParams, 
  StorageCalculationResult, 
  CableCalculationParams, 
  CableCalculationResult, 
  QuickCctvPackage 
} from "@/types/cctv"
import { createAdminQuotation, type AdminQuotation, type QuotationItem } from "./quotation-actions"
import { getProducts, type Product } from "./product-actions"
import { calculateStorage, calculateCabling, getRecommendedNvr, getQuickPackages } from "./cctv-utils"
import fs from "fs"
import path from "path"
import crypto from "crypto"

const SURVEYS_FILE = path.join(process.cwd(), "db", "cctv_surveys_data.json")
const PROJECTS_FILE = path.join(process.cwd(), "db", "cctv_projects_data.json")
const METADATA_FILE = path.join(process.cwd(), "db", "cctv_metadata_data.json")

// Helper file utilities
async function readFallbackFile<T>(filePath: string, defaultVal: T): Promise<T> {
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, "utf-8")
      return JSON.parse(data) || defaultVal
    }
  } catch (err) {
    console.warn(`Could not read fallback file at ${filePath}:`, err)
  }
  return defaultVal
}

async function writeFallbackFile(filePath: string, data: any): Promise<void> {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
  } catch (err) {
    console.warn(`Could not write fallback file at ${filePath}:`, err)
  }
}

// Helper: Generate Survey Number QCL-SURV-YYYY-XXXX
function generateSurveyNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `QCL-SURV-${year}-${random}`
}

// Helper: Generate Project Number QCL-CCTV-YYYY-XXXX
function generateProjectNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `QCL-CCTV-${year}-${random}`
}

// ============================================================================
// 1. SITE SURVEY ACTIONS
// ============================================================================

export async function getCctvSurveys(): Promise<CctvSiteSurvey[]> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    try {
      const supabase = createServerClient()
      const { data: surveys, error } = await supabase
        .from("cctv_site_surveys")
        .select(`
          *,
          items:cctv_site_survey_items(*)
        `)
        .order("created_at", { ascending: false })

      if (!error && surveys && surveys.length > 0) {
        return surveys as CctvSiteSurvey[]
      }
    } catch (sbErr) {
      console.warn("Supabase fetch failed for cctv surveys, using fallback store:", sbErr)
    }

    return await readFallbackFile<CctvSiteSurvey[]>(SURVEYS_FILE, [])
  } catch (err) {
    console.error("Error in getCctvSurveys:", err)
    return await readFallbackFile<CctvSiteSurvey[]>(SURVEYS_FILE, [])
  }
}

export async function getCctvSurveyById(id: string): Promise<CctvSiteSurvey | null> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from("cctv_site_surveys")
        .select(`
          *,
          items:cctv_site_survey_items(*)
        `)
        .eq("id", id)
        .single()

      if (!error && data) {
        return data as CctvSiteSurvey
      }
    } catch (sbErr) {
      console.warn("Supabase fetch single survey failed, fallback to local:", sbErr)
    }

    const localList = await readFallbackFile<CctvSiteSurvey[]>(SURVEYS_FILE, [])
    return localList.find(s => s.id === id) || null
  } catch (err) {
    console.error("Error in getCctvSurveyById:", err)
    return null
  }
}

export async function createCctvSurvey(
  surveyData: Omit<CctvSiteSurvey, "id" | "survey_number" | "created_at" | "updated_at">,
  items: Array<Omit<CctvSiteSurveyItem, "id" | "survey_id" | "created_at" | "updated_at">> = []
): Promise<CctvSiteSurvey> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const now = new Date().toISOString()
  const surveyId = crypto.randomUUID()
  const surveyNumber = generateSurveyNumber()

  const formattedItems: CctvSiteSurveyItem[] = items.map(item => ({
    ...item,
    id: crypto.randomUUID(),
    survey_id: surveyId,
    created_at: now,
    updated_at: now
  }))

  const newSurvey: CctvSiteSurvey = {
    ...surveyData,
    id: surveyId,
    survey_number: surveyNumber,
    items: formattedItems,
    created_at: now,
    updated_at: now
  }

  // Try saving in Supabase
  try {
    const supabase = createServerClient()
    const { error: surveyError } = await supabase
      .from("cctv_site_surveys")
      .insert([{
        id: newSurvey.id,
        survey_number: newSurvey.survey_number,
        customer_id: newSurvey.customer_id || null,
        customer_name: newSurvey.customer_name,
        customer_email: newSurvey.customer_email,
        customer_phone: newSurvey.customer_phone || null,
        customer_address: newSurvey.customer_address || null,
        site_name: newSurvey.site_name,
        site_address: newSurvey.site_address,
        building_type: newSurvey.building_type,
        number_of_buildings: newSurvey.number_of_buildings,
        number_of_floors: newSurvey.number_of_floors,
        environment: newSurvey.environment,
        internet_available: newSurvey.internet_available,
        internet_speed_mbps: newSurvey.internet_speed_mbps || null,
        remote_viewing_required: newSurvey.remote_viewing_required,
        existing_cctv: newSurvey.existing_cctv,
        existing_cctv_details: newSurvey.existing_cctv_details || null,
        existing_nvr_dvr: newSurvey.existing_nvr_dvr,
        existing_network: newSurvey.existing_network,
        power_available: newSurvey.power_available,
        ups_required: newSurvey.ups_required,
        monitor_required: newSurvey.monitor_required,
        estimated_camera_count: newSurvey.estimated_camera_count || formattedItems.length,
        special_requirements: newSurvey.special_requirements || null,
        notes: newSurvey.notes || null,
        technician_name: newSurvey.technician_name || "QuardCube Field Lead",
        survey_date: newSurvey.survey_date || now,
        status: newSurvey.status || "draft",
        created_at: now,
        updated_at: now
      }])

    if (!surveyError && formattedItems.length > 0) {
      await supabase.from("cctv_site_survey_items").insert(formattedItems)
    }
  } catch (sbErr) {
    console.warn("Supabase survey insert failed, saving to local fallback:", sbErr)
  }

  // Save to fallback storage
  const existing = await readFallbackFile<CctvSiteSurvey[]>(SURVEYS_FILE, [])
  const updated = [newSurvey, ...existing.filter(s => s.id !== surveyId)]
  await writeFallbackFile(SURVEYS_FILE, updated)

  return newSurvey
}

export async function updateCctvSurvey(
  id: string,
  surveyData: Partial<CctvSiteSurvey>,
  items?: Array<Omit<CctvSiteSurveyItem, "created_at" | "updated_at"> & { id?: string }>
): Promise<CctvSiteSurvey | null> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const existing = await getCctvSurveyById(id)
  if (!existing) {
    throw new Error("Survey not found")
  }

  const now = new Date().toISOString()
  const updatedSurvey: CctvSiteSurvey = {
    ...existing,
    ...surveyData,
    updated_at: now
  }

  if (items) {
    updatedSurvey.items = items.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      survey_id: id,
      created_at: existing.items?.find(i => i.id === item.id)?.created_at || now,
      updated_at: now
    }))
  }

  // Supabase update
  try {
    const supabase = createServerClient()
    await supabase
      .from("cctv_site_surveys")
      .update({
        customer_name: updatedSurvey.customer_name,
        customer_email: updatedSurvey.customer_email,
        customer_phone: updatedSurvey.customer_phone,
        customer_address: updatedSurvey.customer_address,
        site_name: updatedSurvey.site_name,
        site_address: updatedSurvey.site_address,
        building_type: updatedSurvey.building_type,
        number_of_buildings: updatedSurvey.number_of_buildings,
        number_of_floors: updatedSurvey.number_of_floors,
        environment: updatedSurvey.environment,
        internet_available: updatedSurvey.internet_available,
        internet_speed_mbps: updatedSurvey.internet_speed_mbps,
        remote_viewing_required: updatedSurvey.remote_viewing_required,
        existing_cctv: updatedSurvey.existing_cctv,
        existing_cctv_details: updatedSurvey.existing_cctv_details,
        existing_nvr_dvr: updatedSurvey.existing_nvr_dvr,
        existing_network: updatedSurvey.existing_network,
        power_available: updatedSurvey.power_available,
        ups_required: updatedSurvey.ups_required,
        monitor_required: updatedSurvey.monitor_required,
        estimated_camera_count: updatedSurvey.estimated_camera_count,
        special_requirements: updatedSurvey.special_requirements,
        notes: updatedSurvey.notes,
        technician_name: updatedSurvey.technician_name,
        status: updatedSurvey.status,
        project_id: updatedSurvey.project_id,
        updated_at: now
      })
      .eq("id", id)

    if (items) {
      await supabase.from("cctv_site_survey_items").delete().eq("survey_id", id)
      if (updatedSurvey.items && updatedSurvey.items.length > 0) {
        await supabase.from("cctv_site_survey_items").insert(updatedSurvey.items)
      }
    }
  } catch (sbErr) {
    console.warn("Supabase survey update failed:", sbErr)
  }

  // Fallback update
  const localList = await readFallbackFile<CctvSiteSurvey[]>(SURVEYS_FILE, [])
  const newLocalList = localList.map(s => s.id === id ? updatedSurvey : s)
  await writeFallbackFile(SURVEYS_FILE, newLocalList)

  return updatedSurvey
}

export async function deleteCctvSurvey(id: string): Promise<boolean> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  try {
    const supabase = createServerClient()
    await supabase.from("cctv_site_surveys").delete().eq("id", id)
  } catch (sbErr) {
    console.warn("Supabase survey delete failed:", sbErr)
  }

  const localList = await readFallbackFile<CctvSiteSurvey[]>(SURVEYS_FILE, [])
  const newLocalList = localList.filter(s => s.id !== id)
  await writeFallbackFile(SURVEYS_FILE, newLocalList)

  return true
}

// ============================================================================
// 2. CCTV PROJECT ACTIONS & CONVERSION
// ============================================================================

export async function getCctvProjects(): Promise<CctvProject[]> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    try {
      const supabase = createServerClient()
      const { data: projects, error } = await supabase
        .from("cctv_projects")
        .select(`
          *,
          items:cctv_project_items(*)
        `)
        .order("created_at", { ascending: false })

      if (!error && projects && projects.length > 0) {
        return projects as CctvProject[]
      }
    } catch (sbErr) {
      console.warn("Supabase fetch failed for cctv projects, using fallback:", sbErr)
    }

    return await readFallbackFile<CctvProject[]>(PROJECTS_FILE, [])
  } catch (err) {
    console.error("Error in getCctvProjects:", err)
    return await readFallbackFile<CctvProject[]>(PROJECTS_FILE, [])
  }
}

export async function getCctvProjectById(id: string): Promise<CctvProject | null> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    try {
      const supabase = createServerClient()
      const { data, error } = await supabase
        .from("cctv_projects")
        .select(`
          *,
          items:cctv_project_items(*)
        `)
        .eq("id", id)
        .single()

      if (!error && data) {
        return data as CctvProject
      }
    } catch (sbErr) {
      console.warn("Supabase single project fetch failed, fallback:", sbErr)
    }

    const localList = await readFallbackFile<CctvProject[]>(PROJECTS_FILE, [])
    return localList.find(p => p.id === id) || null
  } catch (err) {
    console.error("Error in getCctvProjectById:", err)
    return null
  }
}

export async function createCctvProject(
  projectData: Omit<CctvProject, "id" | "project_number" | "created_at" | "updated_at">,
  items: Array<Omit<CctvProjectItem, "id" | "project_id" | "created_at" | "updated_at">> = []
): Promise<CctvProject> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const now = new Date().toISOString()
  const projectId = crypto.randomUUID()
  const projectNumber = generateProjectNumber()

  const formattedItems: CctvProjectItem[] = items.map(item => ({
    ...item,
    id: crypto.randomUUID(),
    project_id: projectId,
    created_at: now,
    updated_at: now
  }))

  const equipmentCost = formattedItems
    .filter(i => i.item_type !== 'service')
    .reduce((sum, i) => sum + (i.subtotal || 0), 0)

  const servicesCost = formattedItems
    .filter(i => i.item_type === 'service')
    .reduce((sum, i) => sum + (i.subtotal || 0), 0)

  const subtotalBeforeTax = equipmentCost + servicesCost - (projectData.discount_amount || 0)
  const taxRate = projectData.tax_rate_percent !== undefined ? projectData.tax_rate_percent : 18.0
  const taxAmount = (subtotalBeforeTax * taxRate) / 100
  const grandTotal = Math.round(subtotalBeforeTax + taxAmount)

  const newProject: CctvProject = {
    ...projectData,
    id: projectId,
    project_number: projectNumber,
    camera_count: projectData.camera_count || formattedItems.filter(i => i.category === 'Cameras').reduce((s, i) => s + i.quantity, 0),
    equipment_cost: equipmentCost,
    services_cost: servicesCost,
    tax_rate_percent: taxRate,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    items: formattedItems,
    created_at: now,
    updated_at: now
  }

  // Supabase insert
  try {
    const supabase = createServerClient()
    const { error: projError } = await supabase
      .from("cctv_projects")
      .insert([{
        id: newProject.id,
        project_number: newProject.project_number,
        customer_id: newProject.customer_id || null,
        customer_name: newProject.customer_name,
        customer_email: newProject.customer_email,
        customer_phone: newProject.customer_phone || null,
        customer_address: newProject.customer_address || null,
        site_survey_id: newProject.site_survey_id || null,
        site_name: newProject.site_name,
        project_type: newProject.project_type || "commercial",
        camera_count: newProject.camera_count,
        status: newProject.status || "draft",
        recording_type: newProject.recording_type || "IP/NVR",
        recommended_nvr: newProject.recommended_nvr || null,
        recommended_storage_tb: newProject.recommended_storage_tb || 4.0,
        retention_days: newProject.retention_days || 30,
        total_cable_meters: newProject.total_cable_meters || 0,
        equipment_cost: newProject.equipment_cost,
        services_cost: newProject.services_cost,
        discount_amount: newProject.discount_amount,
        tax_rate_percent: newProject.tax_rate_percent,
        tax_amount: newProject.tax_amount,
        grand_total: newProject.grand_total,
        notes: newProject.notes || null,
        created_at: now,
        updated_at: now
      }])

    if (!projError && formattedItems.length > 0) {
      await supabase.from("cctv_project_items").insert(formattedItems)
    }
  } catch (sbErr) {
    console.warn("Supabase project insert failed, fallback to local:", sbErr)
  }

  // Fallback storage
  const existing = await readFallbackFile<CctvProject[]>(PROJECTS_FILE, [])
  const updated = [newProject, ...existing.filter(p => p.id !== projectId)]
  await writeFallbackFile(PROJECTS_FILE, updated)

  return newProject
}

export async function updateCctvProject(
  id: string,
  projectData: Partial<CctvProject>,
  items?: Array<Omit<CctvProjectItem, "created_at" | "updated_at"> & { id?: string }>
): Promise<CctvProject | null> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const existing = await getCctvProjectById(id)
  if (!existing) {
    throw new Error("Project not found")
  }

  const now = new Date().toISOString()
  let formattedItems = existing.items || []

  if (items) {
    formattedItems = items.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      project_id: id,
      created_at: existing.items?.find(i => i.id === item.id)?.created_at || now,
      updated_at: now
    }))
  }

  const equipmentCost = formattedItems
    .filter(i => i.item_type !== 'service')
    .reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0)

  const servicesCost = formattedItems
    .filter(i => i.item_type === 'service')
    .reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0)

  const discount = projectData.discount_amount !== undefined ? projectData.discount_amount : (existing.discount_amount || 0)
  const taxRate = projectData.tax_rate_percent !== undefined ? projectData.tax_rate_percent : (existing.tax_rate_percent ?? 18.0)
  const subtotalBeforeTax = equipmentCost + servicesCost - discount
  const taxAmount = (subtotalBeforeTax * taxRate) / 100
  const grandTotal = Math.round(subtotalBeforeTax + taxAmount)

  const cameraCount = formattedItems
    .filter(i => i.category === 'Cameras')
    .reduce((s, i) => s + (Number(i.quantity) || 0), 0)

  const updatedProject: CctvProject = {
    ...existing,
    ...projectData,
    camera_count: cameraCount > 0 ? cameraCount : (projectData.camera_count || existing.camera_count),
    equipment_cost: equipmentCost,
    services_cost: servicesCost,
    tax_rate_percent: taxRate,
    tax_amount: taxAmount,
    grand_total: grandTotal,
    items: formattedItems,
    updated_at: now
  }

  // Supabase update
  try {
    const supabase = createServerClient()
    await supabase
      .from("cctv_projects")
      .update({
        customer_name: updatedProject.customer_name,
        customer_email: updatedProject.customer_email,
        customer_phone: updatedProject.customer_phone,
        customer_address: updatedProject.customer_address,
        site_name: updatedProject.site_name,
        project_type: updatedProject.project_type,
        camera_count: updatedProject.camera_count,
        status: updatedProject.status,
        recording_type: updatedProject.recording_type,
        recommended_nvr: updatedProject.recommended_nvr,
        recommended_storage_tb: updatedProject.recommended_storage_tb,
        retention_days: updatedProject.retention_days,
        total_cable_meters: updatedProject.total_cable_meters,
        equipment_cost: updatedProject.equipment_cost,
        services_cost: updatedProject.services_cost,
        discount_amount: updatedProject.discount_amount,
        tax_rate_percent: updatedProject.tax_rate_percent,
        tax_amount: updatedProject.tax_amount,
        grand_total: updatedProject.grand_total,
        quotation_id: updatedProject.quotation_id,
        quotation_number: updatedProject.quotation_number,
        notes: updatedProject.notes,
        updated_at: now
      })
      .eq("id", id)

    if (items) {
      await supabase.from("cctv_project_items").delete().eq("project_id", id)
      if (formattedItems.length > 0) {
        await supabase.from("cctv_project_items").insert(formattedItems)
      }
    }
  } catch (sbErr) {
    console.warn("Supabase project update error:", sbErr)
  }

  // Fallback update
  const localList = await readFallbackFile<CctvProject[]>(PROJECTS_FILE, [])
  const newLocalList = localList.map(p => p.id === id ? updatedProject : p)
  await writeFallbackFile(PROJECTS_FILE, newLocalList)

  return updatedProject
}

export async function deleteCctvProject(id: string): Promise<boolean> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  try {
    const supabase = createServerClient()
    await supabase.from("cctv_projects").delete().eq("id", id)
  } catch (sbErr) {
    console.warn("Supabase project delete failed:", sbErr)
  }

  const localList = await readFallbackFile<CctvProject[]>(PROJECTS_FILE, [])
  const newLocalList = localList.filter(p => p.id !== id)
  await writeFallbackFile(PROJECTS_FILE, newLocalList)

  return true
}

// Convert Site Survey -> CCTV Project
export async function convertSurveyToProject(surveyId: string): Promise<CctvProject> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const survey = await getCctvSurveyById(surveyId)
  if (!survey) {
    throw new Error("Site survey not found")
  }

  const cameraCount = survey.items?.reduce((s, i) => s + (i.quantity || 1), 0) || survey.estimated_camera_count || 4
  const nvrRecommendation = getRecommendedNvr(cameraCount, 'IP/NVR', true)
  const storageCalc = calculateStorage({
    cameraCount,
    resolution: "4MP (2K)",
    fps: 25,
    codec: 'H.265+',
    recordingHoursPerDay: 24,
    retentionDays: 30,
    motionActivityPercentage: 100,
    safetyMarginPercentage: 15
  })

  const cableRuns = (survey.items || []).map(item => ({
    location: item.location_name,
    distanceMeters: item.estimated_cable_length_meters || 30
  }))

  const cableCalc = calculateCabling({
    cameraRuns: cableRuns.length > 0 ? cableRuns : Array.from({ length: cameraCount }, (_, i) => ({ location: `Camera Point ${i + 1}`, distanceMeters: 30 })),
    cableType: 'CAT6 Indoor',
    wastagePercentage: 10,
    spareSlackMetersPerRun: 3,
    boxLengthMeters: 305
  })

  // Generate initial project items based on survey items & calculations
  const initialItems: Array<Omit<CctvProjectItem, "id" | "project_id" | "created_at" | "updated_at">> = []

  // Add cameras from survey items or generic
  if (survey.items && survey.items.length > 0) {
    for (const item of survey.items) {
      const colorvuStr = item.colorvu_required ? "ColorVu 24/7 Color" : "IR Night Vision"
      const resolutionStr = item.required_resolution || "4MP"
      const unitCost = resolutionStr.includes('8MP') ? 250000 : resolutionStr.includes('4MP') ? 150000 : 110000
      const markup = 20
      const unitPrice = Math.round(unitCost * (1 + markup / 100))
      const qty = item.quantity || 1

      initialItems.push({
        product_id: null,
        item_type: "product",
        name: `Hikvision ${resolutionStr} ${item.camera_type} IP Camera (${item.location_name})`,
        description: `${colorvuStr}, ${item.lens_requirement || '2.8mm Wide'}, IP67 Weatherproof, AI motion analytics`,
        category: "Cameras",
        quantity: qty,
        unit_cost: unitCost,
        markup_percentage: markup,
        unit_price: unitPrice,
        discount: 0,
        tax: 0,
        subtotal: unitPrice * qty
      })
    }
  } else {
    const unitCost = 150000
    const markup = 20
    const unitPrice = Math.round(unitCost * (1 + markup / 100))
    initialItems.push({
      product_id: null,
      item_type: "product",
      name: `Hikvision 4MP ColorVu Turret IP Camera`,
      description: `24/7 Color night vision, 2.8mm wide angle, AI AcuSense`,
      category: "Cameras",
      quantity: cameraCount,
      unit_cost: unitCost,
      markup_percentage: markup,
      unit_price: unitPrice,
      discount: 0,
      tax: 0,
      subtotal: unitPrice * cameraCount
    })
  }

  // Add NVR
  const nvrCost = cameraCount <= 4 ? 280000 : cameraCount <= 8 ? 420000 : cameraCount <= 16 ? 780000 : 1350000
  const nvrMarkup = 20
  const nvrPrice = Math.round(nvrCost * (1 + nvrMarkup / 100))
  initialItems.push({
    product_id: null,
    item_type: "product",
    name: nvrRecommendation.modelSuggestion,
    description: nvrRecommendation.details,
    category: "Recording",
    quantity: 1,
    unit_cost: nvrCost,
    markup_percentage: nvrMarkup,
    unit_price: nvrPrice,
    discount: 0,
    tax: 0,
    subtotal: nvrPrice
  })

  // Add Storage HDD
  const hddSize = storageCalc.recommendedStorageTb
  const hddCost = hddSize <= 2 ? 175000 : hddSize <= 4 ? 290000 : hddSize <= 8 ? 560000 : 950000
  const hddMarkup = 15
  const hddPrice = Math.round(hddCost * (1 + hddMarkup / 100))
  initialItems.push({
    product_id: null,
    item_type: "product",
    name: storageCalc.recommendedHddConfiguration.description,
    description: `Engineered for continuous 24/7 surveillance recording with ${hddSize}TB storage capacity`,
    category: "Storage",
    quantity: 1,
    unit_cost: hddCost,
    markup_percentage: hddMarkup,
    unit_price: hddPrice,
    discount: 0,
    tax: 0,
    subtotal: hddPrice
  })

  // Add Cable Boxes
  const cableBoxes = cableCalc.boxesRequired
  const cableCost = 160000
  const cableMarkup = 25
  const cablePrice = Math.round(cableCost * (1 + cableMarkup / 100))
  initialItems.push({
    product_id: null,
    item_type: "product",
    name: `D-Link CAT6 Pure Copper Network Cable (${cableBoxes} × 305m Box)`,
    description: `Solid pure copper 23AWG high-speed network cabling for camera runs (${cableCalc.finalRequiredLengthMeters}m required)`,
    category: "Cabling",
    quantity: cableBoxes,
    unit_cost: cableCost,
    markup_percentage: cableMarkup,
    unit_price: cablePrice,
    discount: 0,
    tax: 0,
    subtotal: cablePrice * cableBoxes
  })

  // Add Accessories & Junction Boxes
  const accCost = 12000
  const accMarkup = 30
  const accPrice = Math.round(accCost * (1 + accMarkup / 100))
  initialItems.push({
    product_id: null,
    item_type: "product",
    name: `IP66 Waterproof Camera Junction Boxes & RJ45 Connectors`,
    description: `Camera mounting base protection, sealed cable glands, and pass-through connectors`,
    category: "Accessories",
    quantity: cameraCount,
    unit_cost: accCost,
    markup_percentage: accMarkup,
    unit_price: accPrice,
    discount: 0,
    tax: 0,
    subtotal: accPrice * cameraCount
  })

  // Add Installation & Commissioning Service
  const serviceCost = 35000
  const servicePrice = 45000
  initialItems.push({
    product_id: null,
    item_type: "service",
    name: `Professional CCTV Installation & Commissioning (${cameraCount} Points)`,
    description: `Conduit routing, camera mounting, cable termination, NVR programming, Hik-Connect mobile setup, and client handover training`,
    category: "Services",
    quantity: cameraCount,
    unit_cost: serviceCost,
    markup_percentage: 0,
    unit_price: servicePrice,
    discount: 0,
    tax: 0,
    subtotal: servicePrice * cameraCount
  })

  // Create Project
  const project = await createCctvProject({
    customer_id: survey.customer_id,
    customer_name: survey.customer_name,
    customer_email: survey.customer_email,
    customer_phone: survey.customer_phone,
    customer_address: survey.customer_address,
    site_survey_id: survey.id,
    site_name: survey.site_name,
    project_type: survey.building_type === 'Industrial' ? 'industrial' : survey.building_type === 'Residential' ? 'residential' : 'commercial',
    camera_count: cameraCount,
    status: 'planning',
    recording_type: 'IP/NVR',
    recommended_nvr: nvrRecommendation.modelSuggestion,
    recommended_storage_tb: storageCalc.recommendedStorageTb,
    retention_days: 30,
    total_cable_meters: cableCalc.finalRequiredLengthMeters,
    equipment_cost: 0,
    services_cost: 0,
    discount_amount: 0,
    tax_rate_percent: 18.0,
    tax_amount: 0,
    grand_total: 0,
    notes: `Converted from Site Survey ${survey.survey_number}. Special Notes: ${survey.special_requirements || 'None'}`
  }, initialItems)

  // Update survey status to converted
  await updateCctvSurvey(survey.id, {
    status: 'converted_to_project',
    project_id: project.id
  })

  return project
}

// ============================================================================
// 3. EXISTING QUOTATION INTEGRATION
// ============================================================================

export async function generateQuotationFromProject(projectId: string): Promise<{
  quotation: AdminQuotation
  project: CctvProject
}> {
  const { isAdmin } = await verifyAdminSession()
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required")
  }

  const project = await getCctvProjectById(projectId)
  if (!project) {
    throw new Error("CCTV Project not found")
  }

  if (!project.items || project.items.length === 0) {
    throw new Error("Cannot generate quotation for project with no items")
  }

  const quoteItems: QuotationItem[] = project.items.map(item => ({
    id: item.id || crypto.randomUUID(),
    name: item.name,
    type: item.item_type === 'service' ? 'service' : 'product',
    quantity: item.quantity,
    price: item.unit_price,
    description: item.description || undefined,
    category: item.category || 'CCTV & Security'
  }))

  const validUntilDate = new Date()
  validUntilDate.setDate(validUntilDate.getDate() + 30)

  const quotation = await createAdminQuotation({
    userId: project.customer_id || null,
    items: quoteItems,
    total: project.grand_total,
    customerInfo: {
      name: project.customer_name,
      email: project.customer_email,
      phone: project.customer_phone || undefined,
      address: project.customer_address || undefined
    },
    notes: `CCTV System Design & Installation for ${project.site_name} (Project: ${project.project_number}). Valid for 30 days. Includes 1-year equipment warranty and 6-month free technical support.`,
    validUntil: validUntilDate.toISOString().split("T")[0],
    status: "draft"
  })

  const updatedProject = await updateCctvProject(project.id, {
    quotation_id: quotation.id,
    quotation_number: quotation.quote_number,
    status: "quoted"
  })

  return {
    quotation,
    project: updatedProject || project
  }
}

// ============================================================================
// 4. DASHBOARD & PIPELINE METRICS
// ============================================================================

export async function getCctvDashboardStats() {
  const [surveys, projects] = await Promise.all([
    getCctvSurveys(),
    getCctvProjects()
  ])

  const totalSurveys = surveys.length
  const pendingSurveys = surveys.filter(s => s.status === 'draft' || s.status === 'scheduled' || s.status === 'in_progress').length
  const completedSurveys = surveys.filter(s => s.status === 'completed' || s.status === 'converted_to_project').length

  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'planning' || p.status === 'quoted' || p.status === 'approved' || p.status === 'in_progress').length
  const completedProjects = projects.filter(p => p.status === 'completed').length

  const quotedProjects = projects.filter(p => p.quotation_id || p.status === 'quoted')
  const totalEstimatedPipeline = projects.reduce((sum, p) => sum + (p.grand_total || 0), 0)
  const totalCctvSales = projects.filter(p => p.status === 'approved' || p.status === 'completed').reduce((sum, p) => sum + (p.grand_total || 0), 0)

  return {
    totalSurveys,
    pendingSurveys,
    completedSurveys,
    totalProjects,
    activeProjects,
    completedProjects,
    quotedCount: quotedProjects.length,
    totalEstimatedPipeline,
    totalCctvSales,
    recentSurveys: surveys.slice(0, 5),
    recentProjects: projects.slice(0, 5)
  }
}
