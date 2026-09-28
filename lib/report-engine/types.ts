/**
 * Universal Report Engine Type Definitions
 * QuardCube Labs Report Management & Generation System
 */

export type ReportType = 
  | 'sales' 
  | 'inventory' 
  | 'customers' 
  | 'purchases' 
  | 'financial' 
  | 'it_assets' 
  | 'custom'

export type ExportFormat = 'pdf' | 'docx' | 'xlsx'

export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type ComparisonType = 
  | 'previous_period' 
  | 'previous_month' 
  | 'previous_quarter' 
  | 'previous_year' 
  | 'custom'

export interface ReportPeriod {
  from: string
  to: string
  preset?: string
}

export interface ComparisonPeriod {
  enabled: boolean
  type?: ComparisonType
  from?: string
  to?: string
}

export interface ReportBranding {
  companyName?: string
  subtitle?: string
  logo?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  primaryColor?: string
  secondaryColor?: string
  preparedBy?: string
}

export type SectionType = 
  | 'summary' 
  | 'chart' 
  | 'table' 
  | 'text' 
  | 'comparison' 
  | 'scorecard' 
  | 'recommendations' 
  | 'audit_seal'

export interface ReportSectionConfig {
  id: string
  type: SectionType
  title: string
  enabled: boolean
  order: number
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
  dataKey?: string
  columns?: string[]
  description?: string
}

export interface ReportFilters {
  category?: string
  productId?: string
  customer?: string
  status?: string
  paymentMethod?: string
  staff?: string
  minAmount?: number
  maxAmount?: number
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  [key: string]: any
}

export interface ReportConfiguration {
  id?: string
  title: string
  description?: string
  type: ReportType
  period: ReportPeriod
  comparison?: ComparisonPeriod
  branding?: ReportBranding
  sections: ReportSectionConfig[]
  filters?: ReportFilters
  customDataSource?: string
}

export interface SummaryMetricItem {
  key: string
  label: string
  value: string | number
  changePercent?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  isCurrency?: boolean
  description?: string
}

export interface ChartSeriesData {
  labels: string[]
  values: number[]
  secondaryValues?: number[]
  secondaryLabel?: string
  title?: string
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
}

export interface TableReportData {
  title: string
  headers: string[]
  rows: (string | number)[][]
  summaryFooter?: (string | number)[]
}

export interface PreparedReportPayload {
  title: string
  subtitle?: string
  description?: string
  type: ReportType
  period: {
    from: string
    to: string
  }
  comparison?: {
    enabled: boolean
    from?: string
    to?: string
    metrics?: SummaryMetricItem[]
  }
  branding: ReportBranding
  generatedAt: string
  summary: {
    metrics: SummaryMetricItem[]
  }
  charts?: Record<string, ChartSeriesData>
  tables?: Record<string, TableReportData>
  sections: ReportSectionConfig[]
  narrative?: {
    overview?: string
    verdict?: string
    strategicAction?: string
  }
  scorecard?: {
    overallHealthScore: number
    healthRating: string
    revenueVelocityScore: number
    operationalEfficiencyScore: number
    customerTrustIndex: number
    vitalityDiagnosis: string
  }
  auditSeal?: {
    reportId: string
    officer: string
    issuingDivision: string
    classification: string
    complianceHash: string
    verificationStatus: string
    timestamp: string
  }
  metadata?: Record<string, any>
}

export interface GeneratedReportRecord {
  id: string
  name: string
  type: ReportType
  configuration: ReportConfiguration
  file_url?: string
  file_format: ExportFormat
  file_size?: number
  status: ReportStatus
  created_by?: string
  created_at: string
  completed_at?: string
  error_message?: string
}

export interface ReportTemplateRecord {
  id: string
  name: string
  description?: string
  type: ReportType
  configuration: ReportConfiguration
  created_by?: string
  created_at: string
  updated_at?: string
}
