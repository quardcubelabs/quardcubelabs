/**
 * QuardCube Labs Enterprise CRM Data Types
 * Comprehensive models for Leads, Deals/Opportunities, Contacts, Activities, and Pipelines.
 */

export type LeadSource = 
  | "Website Form"
  | "WhatsApp Chat"
  | "Referral"
  | "Direct Cold Call"
  | "CCTV Survey Request"
  | "Corporate Tender"
  | "Social Media"
  | "Exhibition"
  | "Other"

export type LeadStatus = 
  | "new" 
  | "contacted" 
  | "qualified" 
  | "unqualified" 
  | "converted"

export interface CrmLead {
  id: string
  lead_number: string
  first_name: string
  last_name: string
  company_name?: string
  email: string
  phone: string
  city?: string
  region?: string
  source: LeadSource
  status: LeadStatus
  estimated_value: number
  assigned_to?: string
  assigned_to_name?: string
  notes?: string
  converted_deal_id?: string
  converted_customer_id?: string
  created_at: string
  updated_at: string
}

export type DealStage = 
  | "qualification"
  | "site_survey"
  | "proposal_quote"
  | "negotiation"
  | "won"
  | "lost"

export interface CrmDeal {
  id: string
  deal_number: string
  title: string
  customer_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  stage: DealStage
  amount: number
  probability: number // 0-100%
  expected_close_date?: string
  lost_reason?: string
  lead_id?: string
  quotation_id?: string
  order_id?: string
  assigned_to?: string
  assigned_to_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type ActivityType = 
  | "call" 
  | "meeting" 
  | "site_visit" 
  | "task" 
  | "email" 
  | "note"

export interface CrmActivity {
  id: string
  deal_id?: string
  lead_id?: string
  customer_id?: string
  customer_name?: string
  activity_type: ActivityType
  subject: string
  description?: string
  due_date?: string
  status: "pending" | "completed" | "cancelled"
  assigned_to?: string
  assigned_to_name?: string
  completed_at?: string
  created_at: string
}

export interface CustomerAccount {
  id: string
  customer_code: string
  company_name?: string
  contact_person: string
  email: string
  phone: string
  address?: string
  city: string
  region: string
  tin_number?: string
  vat_number?: string
  total_spend: number
  total_orders_count: number
  total_invoices_count: number
  outstanding_receivables: number
  credit_limit?: number
  payment_terms: string
  category: "Corporate Enterprise" | "Government / Parastatal" | "SME" | "Retail Client"
  status: "active" | "inactive" | "blocked"
  notes?: string
  created_at: string
  updated_at: string
}
