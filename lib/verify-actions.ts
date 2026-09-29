"use server"

import { 
  verifyDocumentByToken, 
  PublicVerificationResponse, 
  getOrCreateDocumentVerification,
  DocumentVerificationType
} from "./document-verification"

export interface VerificationResult {
  verified: boolean
  documentType: "receipt" | "proforma" | "invoice" | "quotation" | "order" | "unknown"
  documentNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  amount: number
  currency: string
  issueDate: string
  status: string
  paymentMethod?: string
  transactionRef?: string
  notes?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  issuer: {
    companyName: string
    registeredLocation: string
    contactEmail: string
    contactPhone: string
    website: string
  }
  securityHash: string
  source: "database" | "local_store" | "cryptographic_query"
  verificationToken?: string
  verificationUrl?: string
}

/**
 * Public Server Action to verify any document by token or legacy document parameters
 */
export async function verifyDocumentAction(
  typeParam: string | null | undefined,
  docParam: string | null | undefined,
  extraParams?: {
    amount?: string | number | null
    total?: string | number | null
    client?: string | null
    customer?: string | null
  }
): Promise<VerificationResult | null> {
  const tokenOrDoc = (docParam || typeParam || "").trim()

  if (!tokenOrDoc) {
    return null
  }

  // 1. Try Token-based verification first
  const publicRes = await verifyDocumentByToken(tokenOrDoc)
  if (publicRes.verified && publicRes.documentNumber) {
    return {
      verified: true,
      documentType: (publicRes.documentType as any) || "invoice",
      documentNumber: publicRes.documentNumber,
      customerName: publicRes.customerName || "Valued Client",
      amount: publicRes.totalAmount || 0,
      currency: publicRes.currency || "TZS",
      issueDate: publicRes.issueDate || new Date().toISOString(),
      status: publicRes.statusDisplay?.badgeLabel || publicRes.status || "verified",
      paymentMethod: publicRes.paymentMethod || undefined,
      issuer: publicRes.issuer,
      securityHash: publicRes.authenticityCert?.sealHash || `QC-VERIFIED-${publicRes.verificationToken?.slice(0, 8)}`,
      source: "database",
      verificationToken: publicRes.verificationToken,
      verificationUrl: publicRes.verificationToken ? `https://quardcubelabs.co.tz/verify/${publicRes.verificationToken}` : undefined
    }
  }

  return null
}

/**
 * Public action specifically for the new /verify/[token] route
 */
export async function getPublicDocumentVerification(
  token: string,
  clientInfo?: { ip?: string; userAgent?: string }
): Promise<PublicVerificationResponse> {
  return await verifyDocumentByToken(token, clientInfo)
}
