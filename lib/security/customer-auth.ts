import "server-only"
import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/admin-auth"
import { headers } from "next/headers"

export interface VerifiedCaller {
  isAdmin: boolean
  userId: string | null
  email: string | null
}

/**
 * Verifies either an active Admin session OR a cryptographically valid Supabase Auth JWT
 * for customer-scoped operations (orders, invoices, quotations, profile).
 * Enforces strict BOLA / IDOR ownership when `expectedUserId` is supplied.
 */
export async function verifyCustomerOrAdmin(
  expectedUserId?: string | null,
  explicitAccessToken?: string | null
): Promise<VerifiedCaller> {
  // 1. Check Admin session first
  const adminSession = await verifyAdminSession()
  if (adminSession.isAdmin && adminSession.user) {
    return {
      isAdmin: true,
      userId: adminSession.user.id,
      email: adminSession.user.email,
    }
  }

  // 2. Extract Bearer token from explicit argument or Authorization request header
  let token = explicitAccessToken?.trim() || null
  if (!token) {
    try {
      const hdrs = await headers()
      const authHeader = hdrs.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim()
      }
    } catch {
      // headers() unavailable outside request context
    }
  }

  if (!token) {
    throw new Error("Unauthorized: Authentication required.")
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    throw new Error("Unauthorized: Invalid or expired authentication session.")
  }

  if (expectedUserId && data.user.id !== expectedUserId) {
    throw new Error("Forbidden: You do not have permission to access another user's records.")
  }

  return {
    isAdmin: false,
    userId: data.user.id,
    email: data.user.email?.toLowerCase() || null,
  }
}
