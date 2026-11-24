import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { getClientIp } from "@/lib/security/rate-limiter"
import {
  checkLoginProtection,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/security/login-lockout"
import { normalizeEmail } from "@/lib/security/validation"

const GENERIC_AUTH_ERROR = "Invalid email or password."
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, no-cache, must-revalidate" }

/**
 * Customer Authentication Endpoint with Progressive Account Lockout (15m -> 30m -> 1h -> 2h),
 * IP Rate Limiting, and User Enumeration Protection.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawIdentifier = typeof body.emailOrPhone === "string" ? body.emailOrPhone.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!rawIdentifier || !password || rawIdentifier.length > 254 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: GENERIC_AUTH_ERROR },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const ip = getClientIp(req.headers)
    const isEmail = rawIdentifier.includes("@")
    let formattedPhone = rawIdentifier.replace(/[\s\-()]/g, "")
    if (!isEmail) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+255" + formattedPhone.slice(1)
      } else if (formattedPhone.startsWith("255")) {
        formattedPhone = "+" + formattedPhone
      } else if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+255" + formattedPhone
      }
    }

    const identifierKey = isEmail ? normalizeEmail(rawIdentifier) : formattedPhone.toLowerCase()

    // 1. Progressive Lockout & IP Rate-Limit check
    const guard = await checkLoginProtection(identifierKey, ip)
    if (!guard.allowed) {
      return NextResponse.json(
        { success: false, error: guard.message || "Too many sign-in attempts. Please try again later." },
        {
          status: guard.status,
          headers: {
            ...NO_STORE_HEADERS,
            ...(guard.retryAfterSeconds ? { "Retry-After": String(guard.retryAfterSeconds) } : {}),
          },
        }
      )
    }

    const supabase = createServerClient()

    const authAttempt = isEmail
      ? await supabase.auth.signInWithPassword({ email: identifierKey, password })
      : await supabase.auth.signInWithPassword({ phone: formattedPhone, password })

    if (authAttempt.error || !authAttempt.data?.session || !authAttempt.data?.user) {
      const lockState = await recordFailedLogin(identifierKey, ip, "customer")
      if (lockState.locked && lockState.lockoutMinutes) {
        return NextResponse.json(
          {
            success: false,
            error: `Account temporarily locked for ${lockState.lockoutMinutes} minutes due to repeated failed sign-in attempts.`,
          },
          {
            status: 423,
            headers: {
              ...NO_STORE_HEADERS,
              ...(lockState.retryAfterSeconds ? { "Retry-After": String(lockState.retryAfterSeconds) } : {}),
            },
          }
        )
      }

      // Uniform error message to prevent account enumeration
      return NextResponse.json(
        { success: false, error: GENERIC_AUTH_ERROR },
        { status: 401, headers: NO_STORE_HEADERS }
      )
    }

    await recordSuccessfulLogin(identifierKey)

    return NextResponse.json(
      {
        success: true,
        session: {
          access_token: authAttempt.data.session.access_token,
          refresh_token: authAttempt.data.session.refresh_token,
        },
        user: {
          id: authAttempt.data.user.id,
          email: authAttempt.data.user.email,
          user_metadata: authAttempt.data.user.user_metadata,
        },
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: GENERIC_AUTH_ERROR },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
