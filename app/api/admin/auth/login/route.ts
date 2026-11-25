import { NextRequest, NextResponse } from "next/server"
import { adminSignIn } from "@/lib/admin-auth"
import { getClientIp } from "@/lib/security/rate-limiter"
import { isTwoFactorAuthRequired, createTwoFactorChallenge } from "@/lib/two-factor-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const inputEmail = typeof body.email === "string" ? body.email : ""
    const inputPassword = typeof body.password === "string" ? body.password : ""

    if (!inputEmail.trim() || !inputPassword.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      )
    }

    const ip = getClientIp(req.headers)
    const result = await adminSignIn(inputEmail, inputPassword, ip)

    if (result.error || !result.data) {
      const status = (result as any).status || 401
      const headers: Record<string, string> = { "Cache-Control": "private, no-store" }
      if ((result as any).retryAfterSeconds) {
        headers["Retry-After"] = String((result as any).retryAfterSeconds)
      }
      return NextResponse.json(
        { success: false, error: result.error || "Invalid email or password." },
        { status, headers }
      )
    }

    // Check if Two-Factor Authentication is enabled in Security Settings
    const needs2FA = await isTwoFactorAuthRequired()
    if (needs2FA) {
      const challenge = await createTwoFactorChallenge(result.data.user)
      return NextResponse.json(
        {
          success: true,
          requires2FA: true,
          tempToken: challenge.tempToken,
          maskedEmail: challenge.maskedEmail,
          maskedPhone: challenge.maskedPhone
        },
        { headers: { "Cache-Control": "private, no-store" } }
      )
    }

    const response = NextResponse.json(
      {
        success: true,
        user: result.data.user,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    )

    response.cookies.set("admin-session", result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication request could not be processed." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    )
  }
}
