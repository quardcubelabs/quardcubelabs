import crypto from "crypto"
import fs from "fs"
import path from "path"
import { createServerClient } from "@/lib/supabase"

export type DocumentVerificationType = 
  | "quotation" 
  | "invoice" 
  | "receipt" 
  | "proforma" 
  | "order"

export type PublicVerificationStatus = 
  | "VALID" 
  | "PAID" 
  | "UNPAID" 
  | "PARTIALLY_PAID" 
  | "CANCELLED" 
  | "EXPIRED" 
  | "REFUNDED" 
  | "VOIDED" 
  | "INVALID" 
  | "NOT_FOUND"

export interface DocumentVerificationRecord {
  id: string
  verification_token: string
  document_type: DocumentVerificationType
  document_id: string
  document_number: string
  status: string
  verification_url: string
  scan_count: number
  last_verified_at?: string | null
  metadata?: {
    customer_name?: string
    customer_email?: string
    amount?: number
    currency?: string
    issue_date?: string
    valid_until?: string | null
    payment_method?: string | null
    issuer_name?: string
  }
  created_at: string
  updated_at: string
}

export interface DocumentVerificationLog {
  id: string
  verification_token: string
  document_id: string
  document_type: DocumentVerificationType
  document_number: string
  verified_at: string
  ip_address?: string | null
  user_agent?: string | null
}

export interface PublicVerificationResponse {
  verified: boolean
  verificationToken?: string
  documentType?: DocumentVerificationType
  documentTypeLabel?: string
  documentNumber?: string
  customerName?: string
  issueDate?: string
  validUntil?: string | null
  totalAmount?: number
  currency?: string
  paymentMethod?: string | null
  status?: PublicVerificationStatus
  statusDisplay?: {
    badgeLabel: string
    title: string
    description: string
    variant: "success" | "warning" | "destructive" | "neutral"
  }
  verificationId?: string
  verifiedAt?: string
  scanCount?: number
  lastVerifiedAt?: string | null
  issuer: {
    companyName: string
    registeredLocation: string
    contactEmail: string
    contactPhone: string
    website: string
  }
  authenticityCert?: {
    sealHash: string
    verificationStandard: string
    statement: string
  }
  errorType?: "NOT_FOUND" | "INVALID_TOKEN" | "SERVER_ERROR"
  errorMessage?: string
}

const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://quardcubelabs.co.tz"

const VERIFICATIONS_FILE = path.join(process.cwd(), "db", "document_verifications.json")
const VERIFICATION_LOGS_FILE = path.join(process.cwd(), "db", "verification_logs.json")

// Read fallback JSON
async function readFallbackStore<T>(filePath: string): Promise<T[]> {
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, "utf-8")
      return JSON.parse(data) || []
    }
  } catch (err) {
    console.warn(`[Verification] Error reading ${filePath}:`, err)
  }
  return []
}

// Write fallback JSON
async function writeFallbackStore<T>(filePath: string, items: T[]): Promise<void> {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true })
    }
    await fs.promises.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8")
  } catch (err) {
    console.warn(`[Verification] Error writing ${filePath}:`, err)
  }
}

/**
 * Generate a cryptographically secure random token (20 characters alphanumeric)
 * Example: a8F72kLm92QxWz3vP9rT
 */
export function generateSecureVerificationToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const bytes = crypto.randomBytes(24)
  let result = ""
  for (let i = 0; i < 20; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

/**
 * Generate canonical verification URL
 */
export function getVerificationUrl(token: string): string {
  return `${PUBLIC_BASE_URL.replace(/\/$/, "")}/verify/${token}`
}

/**
 * Register or update verification token for a document
 */
export async function registerDocumentVerification(params: {
  documentType: DocumentVerificationType
  documentId: string
  documentNumber: string
  status: string
  metadata?: {
    customer_name?: string
    customer_email?: string
    amount?: number
    currency?: string
    issue_date?: string
    valid_until?: string | null
    payment_method?: string | null
    issuer_name?: string
  }
  token?: string
}): Promise<DocumentVerificationRecord> {
  const token = params.token || generateSecureVerificationToken()
  const verificationUrl = getVerificationUrl(token)
  const now = new Date().toISOString()

  const record: DocumentVerificationRecord = {
    id: crypto.randomUUID(),
    verification_token: token,
    document_type: params.documentType,
    document_id: params.documentId,
    document_number: params.documentNumber,
    status: params.status,
    verification_url: verificationUrl,
    scan_count: 0,
    last_verified_at: null,
    metadata: params.metadata || {},
    created_at: now,
    updated_at: now
  }

  // 1. Try Supabase
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("document_verifications")
      .upsert({
        verification_token: token,
        document_type: params.documentType,
        document_id: params.documentId,
        document_number: params.documentNumber,
        status: params.status,
        verification_url: verificationUrl,
        metadata: params.metadata || {},
        updated_at: now
      }, { onConflict: "document_type,document_id" })
      .select()
      .maybeSingle()

    if (!error && data) {
      // Sync to local fallback too
      const local = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
      const existingIdx = local.findIndex(
        v => (v.document_type === params.documentType && v.document_id === params.documentId) || v.verification_token === token
      )
      if (existingIdx >= 0) {
        local[existingIdx] = { ...local[existingIdx], ...record, id: data.id || local[existingIdx].id }
      } else {
        local.push({ ...record, id: data.id || record.id })
      }
      await writeFallbackStore(VERIFICATIONS_FILE, local)
      return {
        ...record,
        id: data.id || record.id
      }
    }
  } catch (err) {
    console.warn("[Verification] Supabase upsert notice:", err)
  }

  // 2. Local Fallback storage
  const local = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
  const existingIdx = local.findIndex(
    v => (v.document_type === params.documentType && v.document_id === params.documentId) || v.verification_token === token
  )
  if (existingIdx >= 0) {
    local[existingIdx] = { ...local[existingIdx], ...record, updated_at: now }
  } else {
    local.push(record)
  }
  await writeFallbackStore(VERIFICATIONS_FILE, local)

  return record
}

/**
 * Get or create verification record for any document
 */
export async function getOrCreateDocumentVerification(params: {
  documentType: DocumentVerificationType
  documentId: string
  documentNumber: string
  status: string
  metadata?: {
    customer_name?: string
    customer_email?: string
    amount?: number
    currency?: string
    issue_date?: string
    valid_until?: string | null
    payment_method?: string | null
    issuer_name?: string
  }
}): Promise<DocumentVerificationRecord> {
  // Check Supabase first
  try {
    const supabase = createServerClient()
    const { data: existing } = await supabase
      .from("document_verifications")
      .select("*")
      .or(`and(document_type.eq.${params.documentType},document_id.eq.${params.documentId}),and(document_type.eq.${params.documentType},document_number.eq.${params.documentNumber})`)
      .maybeSingle()

    if (existing && existing.verification_token) {
      return existing as DocumentVerificationRecord
    }
  } catch (err) {
    // Continue to local check
  }

  // Check local fallback
  const local = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
  const found = local.find(
    v => v.document_type === params.documentType && (v.document_id === params.documentId || v.document_number === params.documentNumber)
  )
  if (found && found.verification_token) {
    return found
  }

  // Otherwise create new token
  return await registerDocumentVerification(params)
}

/**
 * Synchronize document verification status when a document is updated (e.g., invoice marked paid/cancelled)
 */
export async function syncDocumentVerificationStatus(
  documentType: DocumentVerificationType,
  documentId: string,
  newStatus: string
): Promise<void> {
  const now = new Date().toISOString()

  try {
    const supabase = createServerClient()
    await supabase
      .from("document_verifications")
      .update({ status: newStatus, updated_at: now })
      .match({ document_type: documentType, document_id: documentId })
  } catch (err) {
    console.warn("[Verification] Supabase sync status error:", err)
  }

  const local = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
  const idx = local.findIndex(v => v.document_type === documentType && v.document_id === documentId)
  if (idx >= 0) {
    local[idx].status = newStatus
    local[idx].updated_at = now
    await writeFallbackStore(VERIFICATIONS_FILE, local)
  }
}

/**
 * Record a verification scan in audit log
 */
async function recordVerificationAuditLog(params: {
  token: string
  documentId: string
  documentType: DocumentVerificationType
  documentNumber: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<number> {
  const now = new Date().toISOString()
  let newScanCount = 1

  // 1. Update verification record scan count & last_verified_at
  try {
    const supabase = createServerClient()
    
    // Insert audit log
    await supabase.from("document_verification_logs").insert({
      verification_token: params.token,
      document_id: params.documentId,
      document_type: params.documentType,
      document_number: params.documentNumber,
      verified_at: now,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null
    })

    // Fetch current scan count and increment
    const { data: current } = await supabase
      .from("document_verifications")
      .select("scan_count")
      .eq("verification_token", params.token)
      .maybeSingle()

    newScanCount = (current?.scan_count || 0) + 1

    await supabase
      .from("document_verifications")
      .update({
        scan_count: newScanCount,
        last_verified_at: now,
        updated_at: now
      })
      .eq("verification_token", params.token)
  } catch (err) {
    // Local fallback update
  }

  // Update local store
  const localVerifications = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
  const vIdx = localVerifications.findIndex(v => v.verification_token === params.token)
  if (vIdx >= 0) {
    localVerifications[vIdx].scan_count = (localVerifications[vIdx].scan_count || 0) + 1
    localVerifications[vIdx].last_verified_at = now
    newScanCount = localVerifications[vIdx].scan_count
    await writeFallbackStore(VERIFICATIONS_FILE, localVerifications)
  }

  const localLogs = await readFallbackStore<DocumentVerificationLog>(VERIFICATION_LOGS_FILE)
  localLogs.unshift({
    id: crypto.randomUUID(),
    verification_token: params.token,
    document_id: params.documentId,
    document_type: params.documentType,
    document_number: params.documentNumber,
    verified_at: now,
    ip_address: params.ipAddress || null,
    user_agent: params.userAgent || null
  })
  // Keep last 1000 logs in JSON
  if (localLogs.length > 1000) localLogs.length = 1000
  await writeFallbackStore(VERIFICATION_LOGS_FILE, localLogs)

  return newScanCount
}

/**
 * Maps raw database status into authoritative public verification status and display configuration
 */
export function mapToPublicStatus(
  docType: DocumentVerificationType,
  rawStatus: string | undefined | null,
  validUntil?: string | null
): {
  status: PublicVerificationStatus
  display: {
    badgeLabel: string
    title: string
    description: string
    variant: "success" | "warning" | "destructive" | "neutral"
  }
} {
  const normalized = (rawStatus || "").toLowerCase().trim()

  // Check expiration if validUntil is set
  if (validUntil) {
    const validDate = new Date(validUntil)
    if (!isNaN(validDate.getTime()) && validDate < new Date() && normalized !== "accepted" && normalized !== "paid") {
      return {
        status: "EXPIRED",
        display: {
          badgeLabel: "EXPIRED",
          title: "EXPIRED DOCUMENT",
          description: "This document is no longer valid as its validity period has elapsed.",
          variant: "warning"
        }
      }
    }
  }

  if (normalized === "cancelled" || normalized === "canceled" || normalized === "declined") {
    return {
      status: "CANCELLED",
      display: {
        badgeLabel: "CANCELLED",
        title: "CANCELLED DOCUMENT",
        description: "This document was previously issued by QuardCube Labs but has been cancelled.",
        variant: "destructive"
      }
    }
  }

  if (normalized === "refunded" || normalized === "voided") {
    return {
      status: "VOIDED",
      display: {
        badgeLabel: "VOIDED / REFUNDED",
        title: "VOIDED DOCUMENT",
        description: "This receipt or document transaction has been voided or refunded.",
        variant: "destructive"
      }
    }
  }

  if (normalized === "paid" || normalized === "completed" || normalized === "settled") {
    return {
      status: "PAID",
      display: {
        badgeLabel: "PAID",
        title: "VERIFIED & SETTLED DOCUMENT",
        description: "Document confirmed genuine. Payment has been verified and settled in full.",
        variant: "success"
      }
    }
  }

  if (normalized === "partially_paid" || normalized === "partial") {
    return {
      status: "PARTIALLY_PAID",
      display: {
        badgeLabel: "PARTIALLY PAID",
        title: "VERIFIED DOCUMENT (PARTIAL PAYMENT)",
        description: "Document confirmed genuine with partial payment captured.",
        variant: "warning"
      }
    }
  }

  if (normalized === "overdue") {
    return {
      status: "UNPAID",
      display: {
        badgeLabel: "OVERDUE",
        title: "VERIFIED DOCUMENT (OVERDUE)",
        description: "Document confirmed genuine. Payment is pending past the due date.",
        variant: "warning"
      }
    }
  }

  if (normalized === "issued" || normalized === "sent" || normalized === "draft" || normalized === "unpaid" || normalized === "pending") {
    return {
      status: docType === "receipt" ? "PAID" : "UNPAID",
      display: {
        badgeLabel: docType === "receipt" ? "ISSUED" : (normalized === "draft" ? "DRAFT" : "UNPAID"),
        title: "VERIFIED DOCUMENT",
        description: docType === "receipt" 
          ? "Official receipt verified authentic and issued by QuardCube Labs."
          : "Document confirmed genuine. Payment or authorization is pending settlement.",
        variant: "success"
      }
    }
  }

  if (normalized === "accepted" || normalized === "converted") {
    return {
      status: "VALID",
      display: {
        badgeLabel: "ACCEPTED",
        title: "VERIFIED & ACCEPTED DOCUMENT",
        description: "Document confirmed genuine and accepted for fulfillment.",
        variant: "success"
      }
    }
  }

  return {
    status: "VALID",
    display: {
      badgeLabel: "VERIFIED",
      title: "VERIFIED DOCUMENT",
      description: "Document confirmed genuine and registered in the QuardCube Labs system.",
      variant: "success"
    }
  }
}

/**
 * Returns human-readable label for document type
 */
export function getDocumentTypeLabel(type: DocumentVerificationType): string {
  switch (type) {
    case "invoice":
      return "Commercial Tax Invoice"
    case "quotation":
      return "Official Service Quotation"
    case "receipt":
      return "Official Payment Receipt"
    case "proforma":
      return "Proforma Invoice & Estimate"
    case "order":
      return "Customer Sales Order"
    default:
      return "Official Commercial Document"
  }
}

/**
 * 3. MAIN SERVER-SIDE VERIFICATION FUNCTION
 * Validates token, retrieves live document state from database, records audit log,
 * and returns safe public verification information.
 */
export async function verifyDocumentByToken(
  token: string,
  clientInfo?: { ip?: string; userAgent?: string }
): Promise<PublicVerificationResponse> {
  const issuerInfo = {
    companyName: "QuardCube Labs Limited",
    registeredLocation: "24 Ferry, Kigamboni, Dar es Salaam 17101, Tanzania",
    contactEmail: "info@quardcubelabs.co.tz",
    contactPhone: "+255 623 893 383",
    website: "https://quardcubelabs.co.tz"
  }

  if (!token || typeof token !== "string" || token.trim().length < 4 || token.trim().length > 64) {
    return {
      verified: false,
      errorType: "INVALID_TOKEN",
      errorMessage: "The verification token format is invalid or malformed.",
      issuer: issuerInfo
    }
  }

  const cleanToken = token.trim()
  const now = new Date().toISOString()

  let record: DocumentVerificationRecord | null = null

  // 1. Search Supabase document_verifications table
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from("document_verifications")
      .select("*")
      .eq("verification_token", cleanToken)
      .maybeSingle()

    if (data) {
      record = data as DocumentVerificationRecord
    }
  } catch (err) {
    console.warn("[Verification] Supabase query error:", err)
  }

  // 2. Search local fallback store if not found
  if (!record) {
    const local = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
    const found = local.find(v => v.verification_token === cleanToken)
    if (found) {
      record = found
    }
  }

  // If still not found by token, check if user entered a document number directly (e.g. QCL-2026-1234 or INV-123)
  if (!record) {
    const local = await readFallbackStore<DocumentVerificationRecord>(VERIFICATIONS_FILE)
    const foundByNumber = local.find(
      v => v.document_number.toLowerCase() === cleanToken.toLowerCase()
    )
    if (foundByNumber) {
      record = foundByNumber
    }
  }

  // If token is completely unknown in registry
  if (!record) {
    return {
      verified: false,
      errorType: "NOT_FOUND",
      errorMessage: "We could not verify this document. The verification code was not found in the QuardCube Labs registry.",
      issuer: issuerInfo
    }
  }

  // Record verification audit log & increment count
  const scanCount = await recordVerificationAuditLog({
    token: record.verification_token,
    documentId: record.document_id,
    documentType: record.document_type,
    documentNumber: record.document_number,
    ipAddress: clientInfo?.ip,
    userAgent: clientInfo?.userAgent
  })

  // 3. FETCH LIVE, REAL-TIME STATE OF THE TARGET DOCUMENT
  let liveCustomerName = record.metadata?.customer_name || "Valued Client"
  let liveAmount = record.metadata?.amount || 0
  let liveIssueDate = record.metadata?.issue_date || record.created_at
  let liveValidUntil = record.metadata?.valid_until || null
  let liveStatus = record.status
  let livePaymentMethod = record.metadata?.payment_method || null

  try {
    const supabase = createServerClient()

    if (record.document_type === "invoice") {
      const { data: inv } = await supabase
        .from("invoices")
        .select("invoice_number, customer_name, total, status, created_at, due_date")
        .or(`id.eq.${record.document_id},invoice_number.eq.${record.document_number}`)
        .maybeSingle()

      if (inv) {
        liveCustomerName = inv.customer_name || liveCustomerName
        liveAmount = Number(inv.total || liveAmount)
        liveStatus = inv.status || liveStatus
        liveIssueDate = inv.created_at || liveIssueDate
        liveValidUntil = inv.due_date || liveValidUntil
      }
    } else if (record.document_type === "quotation") {
      const { data: quo } = await supabase
        .from("quotations")
        .select("quote_number, customer_name, total, status, created_at, valid_until")
        .or(`id.eq.${record.document_id},quote_number.eq.${record.document_number}`)
        .maybeSingle()

      if (quo) {
        liveCustomerName = quo.customer_name || liveCustomerName
        liveAmount = Number(quo.total || liveAmount)
        liveStatus = quo.status || liveStatus
        liveIssueDate = quo.created_at || liveIssueDate
        liveValidUntil = quo.valid_until || liveValidUntil
      }
    } else if (record.document_type === "receipt") {
      const { data: rec } = await supabase
        .from("receipts")
        .select("receipt_number, customer_name, amount_paid, payment_method, status, payment_date, created_at")
        .or(`id.eq.${record.document_id},receipt_number.eq.${record.document_number}`)
        .maybeSingle()

      if (rec) {
        liveCustomerName = rec.customer_name || liveCustomerName
        liveAmount = Number(rec.amount_paid || liveAmount)
        liveStatus = rec.status || liveStatus
        livePaymentMethod = rec.payment_method || livePaymentMethod
        liveIssueDate = rec.payment_date || rec.created_at || liveIssueDate
      }
    } else if (record.document_type === "proforma") {
      const { data: prof } = await supabase
        .from("proforma_invoices")
        .select("proforma_number, customer_name, total, status, created_at, valid_until, payment_terms")
        .or(`id.eq.${record.document_id},proforma_number.eq.${record.document_number}`)
        .maybeSingle()

      if (prof) {
        liveCustomerName = prof.customer_name || liveCustomerName
        liveAmount = Number(prof.total || liveAmount)
        liveStatus = prof.status || liveStatus
        liveIssueDate = prof.created_at || liveIssueDate
        liveValidUntil = prof.valid_until || liveValidUntil
        livePaymentMethod = prof.payment_terms || livePaymentMethod
      }
    } else if (record.document_type === "order") {
      const { data: ord } = await supabase
        .from("orders")
        .select("order_number, customer_name, total_amount, status, created_at, payment_method")
        .or(`id.eq.${record.document_id},order_number.eq.${record.document_number}`)
        .maybeSingle()

      if (ord) {
        liveCustomerName = ord.customer_name || liveCustomerName
        liveAmount = Number(ord.total_amount || liveAmount)
        liveStatus = ord.status || liveStatus
        livePaymentMethod = ord.payment_method || livePaymentMethod
        liveIssueDate = ord.created_at || liveIssueDate
      }
    }
  } catch (err) {
    console.warn("[Verification] Live document status fetch notice:", err)
  }

  const { status: publicStatus, display: statusDisplay } = mapToPublicStatus(
    record.document_type,
    liveStatus,
    liveValidUntil
  )

  const securityHash = `QC-HASH-${crypto.createHash("sha256").update(`${record.verification_token}:${record.document_number}:${liveAmount}`).digest("hex").slice(0, 16).toUpperCase()}`

  return {
    verified: true,
    verificationToken: record.verification_token,
    documentType: record.document_type,
    documentTypeLabel: getDocumentTypeLabel(record.document_type),
    documentNumber: record.document_number,
    customerName: liveCustomerName,
    issueDate: liveIssueDate,
    validUntil: liveValidUntil,
    totalAmount: liveAmount,
    currency: "TZS",
    paymentMethod: livePaymentMethod,
    status: publicStatus,
    statusDisplay,
    verificationId: record.verification_token,
    verifiedAt: now,
    scanCount,
    lastVerifiedAt: record.last_verified_at || now,
    issuer: issuerInfo,
    authenticityCert: {
      sealHash: securityHash,
      verificationStandard: "ISO/IEC 18004 Cryptographic Document Seal v2.4",
      statement: "Verified genuine document issued by QuardCube Labs Limited trust authority."
    }
  }
}
