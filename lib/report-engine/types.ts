/**
 * Universal Report Engine Type Definitions
 * QuardCube Labs Report Management & Generation System
 * Authoritative type definitions for business reports across PDF, DOCX, and XLSX formats.
 */

export type ReportType = 
  | 'sales' 
  | 'invoices'
  | 'expenses'
  | 'inventory' 
  | 'customers' 
  | 'products'
  | 'financial' 
  | 'purchases' 
  | 'quotations'
  | 'payments'
  | 'tax'
  | 'operational'
  | 'cctv'
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
  accentColor?: string
  preparedBy?: string
  preparedFor?: string
  reportingOfficer?: string
  division?: string
  version?: string
  confidentiality?: string
}

export type SectionType = 
  | 'cover'
  | 'document_control'
  | 'toc'
  | 'summary' 
  | 'methodology'
  | 'kpis'
  | 'chart' 
  | 'table' 
  | 'text' 
  | 'comparison' 
  | 'observations' 
  | 'recommendations' 
  | 'conclusion'
  | 'approval'
  | 'scorecard' 
  | 'audit_seal'
  | 'appendix'

export interface ReportSectionConfig {
  id: string
  type: SectionType
  title: string
  enabled: boolean
  order: number
  chartType?: 'line' | 'bar' | 'horizontal_bar' | 'pie' | 'doughnut' | 'area'
  dataKey?: string
  columns?: string[]
  description?: string
  introNarrative?: string
}

export interface ReportFilters {
  category?: string
  productId?: string
  customer?: string
  vendor?: string
  status?: string
  paymentMethod?: string
  staff?: string
  branch?: string
  minAmount?: number
  maxAmount?: number
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  [key: string]: any
}

export interface ReportConfiguration {
  id?: string
  title: string
  subtitle?: string
  description?: string
  type: ReportType
  period: ReportPeriod
  comparison?: ComparisonPeriod
  branding?: ReportBranding
  sections: ReportSectionConfig[]
  filters?: ReportFilters
  customDataSource?: string
  includeCoverPage?: boolean
  includeTOC?: boolean
  includeApprovalSection?: boolean
}

export interface SummaryMetricItem {
  key: string
  label: string
  value: string | number
  rawValue?: number
  previousValue?: string | number
  rawPreviousValue?: number
  changePercent?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  isCurrency?: boolean
  description?: string
  benchmark?: string
}

export interface ChartSeriesData {
  labels: string[]
  values: number[]
  secondaryValues?: number[]
  secondaryLabel?: string
  title?: string
  chartType?: 'line' | 'bar' | 'horizontal_bar' | 'pie' | 'doughnut' | 'area'
  caption?: string
  introText?: string
  unit?: string
}

export interface TableReportData {
  title: string
  headers: string[]
  rows: (string | number)[][]
  alignments?: ('left' | 'center' | 'right')[]
  summaryFooter?: (string | number)[]
  introText?: string
  emptyMessage?: string
  isHighlighted?: boolean
}

export interface DocumentControlData {
  reportId: string
  reportType: string
  reportingPeriod: string
  generatedBy: string
  preparedFor: string
  generatedOn: string
  version: string
  status: string
  dataSource: string
  lastUpdated: string
  confidentiality: string
}

export interface ApprovalEntry {
  role: string
  name: string
  position: string
  date: string
  signatureNote?: string
}

export interface PreparedReportPayload {
  title: string
  subtitle?: string
  description?: string
  type: ReportType
  period: {
    from: string
    to: string
    formatted: string
  }
  comparison?: {
    enabled: boolean
    from?: string
    to?: string
    formatted?: string
    metrics?: SummaryMetricItem[]
  }
  branding: ReportBranding
  generatedAt: string
  documentControl: DocumentControlData
  tableOfContents?: { title: string; sectionId: string; page?: number }[]
  summary: {
    metrics: SummaryMetricItem[]
    executiveSummary?: string
  }
  methodology?: {
    scope: string
    dataIncluded: string
    dataExcluded?: string
    calculationMethodology?: string
    limitations?: string
  }
  charts?: Record<string, ChartSeriesData>
  tables?: Record<string, TableReportData>
  sections: ReportSectionConfig[]
  narrative?: {
    overview?: string
    executiveSummary?: string
    sectionNarratives?: Record<string, string>
    observations?: string[]
    recommendations?: string[]
    conclusion?: string
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
  approvalSection?: {
    preparedBy: ApprovalEntry
    reviewedBy?: ApprovalEntry
    approvedBy?: ApprovalEntry
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
  notesAndFootnotes?: string[]
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
