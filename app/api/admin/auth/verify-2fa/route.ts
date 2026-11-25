import { NextRequest, NextResponse } from "next/server"
import { verifyTwoFactorChallenge } from "@/lib/two-factor-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const tempToken = typeof body.tempToken === "string" ? body.tempToken : ""
    const otp = typeof body.otp === "string" ? body.otp : ""

    if (!tempToken.trim() || !otp.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing verification token or OTP." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      )
    }

    const verification = await verifyTwoFactorChallenge(tempToken, otp)

    if (!verification.success || !verification.token || !verification.user) {
      return NextResponse.json(
        { success: false, error: verification.error || "Verification failed." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      )
    }

    const response = NextResponse.json(
      {
        success: true,
        user: verification.user
      },
      { headers: { "Cache-Control": "private, no-store" } }
    )

    response.cookies.set("admin-session", verification.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Could not process 2FA verification." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    )
  }
}
