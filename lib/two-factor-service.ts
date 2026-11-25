import crypto from "crypto"
import { AdminUser } from "@/lib/admin-auth"
import { createAdminToken } from "@/lib/auth-token"
import { sendSMS, formatPhoneNumber } from "@/lib/sms-service"
import { createServerClient } from "@/lib/supabase"

const TWO_FACTOR_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || "quardcube-2fa-secret-salt-2026"

export interface TwoFactorChallengePayload {
  email: string
  user: AdminUser
  otpHash: string
  exp: number
}

function getTwoFactorKey(): string {
  return `2fa-quardcube:${TWO_FACTOR_SECRET}`
}

function hashOtp(otp: string, email: string): string {
  return crypto.createHmac("sha256", getTwoFactorKey()).update(`${otp.trim()}:${email.toLowerCase().trim()}`).digest("hex")
}

export async function isTwoFactorAuthRequired(): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from("system_settings")
      .select("settings")
      .eq("id", "main")
      .maybeSingle()

    if (data?.settings?.security?.twoFactorAuth === true) {
      return true
    }
  } catch {}

  // Fallback to environment variable if explicitly configured
  return process.env.ADMIN_2FA_ENABLED === "true"
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***@***"
  const [local, domain] = email.split("@")
  const visible = local.length <= 2 ? local[0] : `${local[0]}***${local[local.length - 1]}`
  return `${visible}@${domain}`
}

export function maskPhone(phone: string): string {
  if (!phone) return "***"
  const clean = phone.replace(/\D/g, "")
  if (clean.length < 6) return clean
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`
}

/**
 * Generate a 6-digit OTP, send via SMTP2GO & NextSMS, and return a signed temporary challenge token
 */
export async function createTwoFactorChallenge(user: AdminUser) {
  // Generate random 6-digit code
  const otpNumber = crypto.randomInt(100000, 999999)
  const otpCode = String(otpNumber)
  const otpHash = hashOtp(otpCode, user.email)
  const exp = Date.now() + 5 * 60 * 1000 // 5 minutes validity

  const challengePayload: TwoFactorChallengePayload = {
    email: user.email,
    user,
    otpHash,
    exp
  }

  // Sign challenge token
  const payloadStr = Buffer.from(JSON.stringify(challengePayload)).toString("base64url")
  const signature = crypto.createHmac("sha256", getTwoFactorKey()).update(payloadStr).digest("base64url")
  const tempToken = `${payloadStr}.${signature}`

  const maskedEmail = maskEmail(user.email)
  const targetPhone = user.staffMember?.phone || process.env.ADMIN_PHONE || "255623893383"
  const maskedPhone = maskPhone(targetPhone)

  // 1. Send via NextSMS
  try {
    const formattedPhone = formatPhoneNumber(targetPhone)
    if (formattedPhone) {
      const smsMessage = `[QuardCube Labs] Your security verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`
      await sendSMS(formattedPhone, smsMessage, `2fa_${Date.now()}`)
    }
  } catch (smsErr) {
    console.error("2FA SMS notification failed:", smsErr)
  }

  // 2. Send via SMTP2GO REST API
  try {
    const apiKey = process.env.SMTP2GO_API_KEY || ""
    const apiUrl = process.env.SMTP2GO_API_URL || "https://api.smtp2go.com/v3/"
    const endpoint = apiUrl.endsWith("/") ? `${apiUrl}email/send` : `${apiUrl}/email/send`

    if (apiKey) {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          to: [user.email],
          sender: `"QuardCube Labs Security" <${process.env.SMTP_USER || "info@quardcubelabs.co.tz"}>`,
          subject: `${otpCode} is your QuardCube Labs 2FA verification code`,
          html_body: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #0a1033; color: #ffffff; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">QuardCube Labs</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Two-Factor Authentication Security</p>
              </div>
              <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; color: #cbd5e1;">Use the following 6-digit verification code to complete your login:</p>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #38bdf8; font-family: monospace; padding: 12px 0;">
                  ${otpCode}
                </div>
                <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">This code expires in <b>5 minutes</b>.</p>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
                If you did not request this login attempt, please notify your administrator immediately or secure your credentials.
              </p>
            </div>
          `,
          text_body: `[QuardCube Labs] Your security verification code is: ${otpCode}. Valid for 5 minutes.`
        })
      })
    }
  } catch (emailErr) {
    console.error("2FA Email notification failed:", emailErr)
  }

  return {
    requires2FA: true,
    tempToken,
    maskedEmail,
    maskedPhone
  }
}

/**
 * Verify a submitted 6-digit OTP code against the challenge token
 */
export async function verifyTwoFactorChallenge(tempToken: string, enteredOtp: string) {
  if (!tempToken || !enteredOtp) {
    return { success: false, error: "Invalid verification request." }
  }

  const parts = tempToken.split(".")
  if (parts.length !== 2) {
    return { success: false, error: "Malformed challenge token." }
  }

  const [payloadStr, signature] = parts
  const expectedSig = crypto.createHmac("sha256", getTwoFactorKey()).update(payloadStr).digest("base64url")

  const bufA = Buffer.from(signature)
  const bufB = Buffer.from(expectedSig)
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return { success: false, error: "Invalid or tampered verification token." }
  }

  let payload: TwoFactorChallengePayload
  try {
    payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"))
  } catch {
    return { success: false, error: "Could not decode verification payload." }
  }

  if (Date.now() > payload.exp) {
    return { success: false, error: "Verification code has expired. Please request a new one." }
  }

  const enteredHash = hashOtp(enteredOtp, payload.email)
  const hashBufA = Buffer.from(enteredHash)
  const hashBufB = Buffer.from(payload.otpHash)

  if (hashBufA.length !== hashBufB.length || !crypto.timingSafeEqual(hashBufA, hashBufB)) {
    return { success: false, error: "Incorrect verification code. Please check your SMS or email and try again." }
  }

  // OTP verified successfully! Generate official admin session token
  const sessionToken = await createAdminToken(payload.user.email, 60 * 60 * 24)

  return {
    success: true,
    user: payload.user,
    token: sessionToken
  }
}
