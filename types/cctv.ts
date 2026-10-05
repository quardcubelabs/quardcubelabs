// CCTV Module Types for QuardCube Labs

export type SurveyStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'converted_to_project' | 'cancelled'
export type ProjectStatus = 'draft' | 'planning' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'enterprise' | 'custom'
export type CameraType = 'Dome' | 'Turret' | 'Bullet' | 'PTZ' | 'Varifocal' | 'Panoramic' | 'Analog' | 'Other'
export type EnvironmentType = 'Indoor' | 'Outdoor' | 'Mixed'

export interface CctvSiteSurvey {
  id: string
  survey_number: string
  customer_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  customer_address?: string | null
  
  site_name: string
  site_address: string
  building_type: string
  number_of_buildings: number
  number_of_floors: number
  environment: EnvironmentType
  
  // Infrastructure
  internet_available: boolean
  internet_speed_mbps?: number | null
  remote_viewing_required: boolean
  existing_cctv: boolean
  existing_cctv_details?: string | null
  existing_nvr_dvr: boolean
  existing_network: boolean
  power_available: boolean
  ups_required: boolean
  monitor_required: boolean
  
  estimated_camera_count: number
  special_requirements?: string | null
  notes?: string | null
  technician_name?: string | null
  survey_date?: string
  status: SurveyStatus
  
  // Linked items
  items?: CctvSiteSurveyItem[]
  project_id?: string | null
  
  created_at: string
  updated_at: string
}

export interface CctvSiteSurveyItem {
  id: string
  survey_id: string
  location_name: string // e.g. "Main Gate / Entry"
  area_type: string // "Entrance" | "Perimeter" | "Parking" | "Lobby" | "Warehouse" | "Cash Counter" | "Office" | "Corridor"
  indoor_outdoor: 'Indoor' | 'Outdoor'
  camera_type: CameraType
  required_resolution: string // "2MP (1080p)" | "4MP (2K)" | "5MP" | "8MP (4K)"
  lens_requirement?: string // "2.8mm (Wide 100°)" | "4mm (Standard 80°)" | "6mm (Narrow 50°)" | "Varifocal 2.8-12mm"
  night_vision_required: boolean
  colorvu_required: boolean
  audio_required: boolean
  ptz_required: boolean
  varifocal_required: boolean
  analytics_required: boolean // AI AcuSense / Human-Vehicle Detection
  target_distance_meters?: number
  coverage_notes?: string
  estimated_cable_length_meters: number
  quantity: number
  created_at: string
  updated_at: string
}

export interface CctvProject {
  id: string
  project_number: string
  customer_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  customer_address?: string | null
  site_survey_id?: string | null
  site_name: string
  project_type: ProjectType
  camera_count: number
  status: ProjectStatus
  
  // System Specifications
  recording_type: 'IP/NVR' | 'Analog/XVR' | 'Hybrid'
  recommended_nvr?: string
  recommended_storage_tb?: number
  retention_days?: number
  total_cable_meters?: number
  
  // Financials
  equipment_cost: number
  services_cost: number
  discount_amount: number
  tax_rate_percent: number
  tax_amount: number
  grand_total: number
  
  quotation_id?: string | null
  quotation_number?: string | null
  sales_order_id?: string | null
  invoice_id?: string | null
  
  notes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  
  items?: CctvProjectItem[]
}

export interface CctvProjectItem {
  id: string
  project_id: string
  product_id?: number | null // Reference to existing products table
  item_type: 'product' | 'service' | 'custom'
  name: string
  description?: string
  category: string // "Cameras" | "Recording" | "Storage" | "Networking" | "Cabling" | "Accessories" | "Services"
  quantity: number
  unit_cost: number
  markup_percentage: number
  unit_price: number
  discount: number
  tax: number
  subtotal: number
  stock?: number
  created_at: string
  updated_at: string
}

export interface CctvProductMetadata {
  id: string
  product_id: number
  brand: 'Hikvision' | 'Dahua' | 'Uniview' | 'Western Digital' | 'Seagate' | 'Ubiquiti' | 'Other'
  cctv_category: 'Camera' | 'NVR' | 'XVR' | 'HDD' | 'PoE Switch' | 'Cable' | 'Accessory' | 'Power' | 'Service'
  camera_type?: CameraType
  resolution_mp?: number
  lens_mm?: number | string
  indoor_outdoor?: 'Indoor' | 'Outdoor' | 'Both'
  ip_rating?: string // e.g. "IP67"
  night_vision_ir_meters?: number
  colorvu?: boolean
  acusense?: boolean
  audio?: boolean
  ptz?: boolean
  varifocal?: boolean
  poe_supported?: boolean
  
  // NVR/XVR fields
  nvr_channels?: number // 4, 8, 16, 32, 64
  incoming_bandwidth_mbps?: number
  poe_ports?: number
  poe_power_budget_watts?: number
  hdd_bays?: number
  max_hdd_capacity_tb?: number
  analog_channels?: number
  
  created_at?: string
  updated_at?: string
}

export interface StorageCalculationParams {
  cameraCount: number
  resolution: string // "2MP" | "4MP" | "5MP" | "8MP"
  bitrateMbps?: number
  fps: number // 15, 20, 25, 30
  codec: 'H.265+' | 'H.265' | 'H.264+' | 'H.264'
  recordingHoursPerDay: number // e.g. 24 for 24/7 or 12 for business hours
  retentionDays: number // e.g. 14, 30, 60, 90
  motionActivityPercentage: number // e.g. 30% for motion-triggered or 100% for continuous
  safetyMarginPercentage: number // default 15%
}

export interface StorageCalculationResult {
  bitratePerCameraMbps: number
  dailyStorageGbPerCamera: number
  totalDailyStorageGb: number
  rawStorageRequiredGb: number
  storageWithMarginGb: number
  recommendedStorageTb: number
  recommendedHddConfiguration: {
    hddSizeTb: number
    quantity: number
    description: string
  }
}

export interface CableCalculationParams {
  cameraRuns: Array<{
    location: string
    distanceMeters: number
  }>
  cableType: 'CAT6 Indoor' | 'CAT6 Outdoor (UV/Shielded)' | 'RG59 Coaxial' | 'RG59 + Power'
  wastagePercentage: number // e.g. 10%
  spareSlackMetersPerRun: number // e.g. 3m
  boxLengthMeters?: number // default 305m (1000ft)
}

export interface CableCalculationResult {
  totalMeasuredLengthMeters: number
  totalSlackLengthMeters: number
  totalWastageMeters: number
  finalRequiredLengthMeters: number
  boxesRequired: number
  boxLengthMeters: number
  leftoverMeters: number
}

export interface QuickCctvPackage {
  id: string
  name: string
  code: string
  targetSegment: string
  cameraCount: number
  description: string
  badgeText: string
  estimatedPriceTzs: number
  items: Array<{
    name: string
    category: string
    quantity: number
    unitCost: number
    defaultMarkup: number
    unitPrice: number
    type: 'product' | 'service'
    description?: string
  }>
}
