// Utility for signing and verifying admin session tokens using standard Web Crypto API (Edge and Node.js compatible)

const DEV_ONLY_FALLBACK_SECRET = "dev-only-local-quardcube-session-secret-not-for-prod"

function resolveSigningSecret(): string | null {
  const configured =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (configured && configured.trim().length >= 16) {
    // Domain-separated key material so raw service keys are never used directly without context binding
    return `quardcube-admin-session-v2:${configured.trim()}`
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_ONLY_FALLBACK_SECRET
  }

  // Fail closed in production if no cryptographic secret is configured
  return null
}

export interface AdminSessionPayload {
  email: string
  role: string
  iat?: number
  exp: number
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secret))
  return await crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function base64UrlEncode(str: string): string {
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(str).toString("base64")
    : btoa(unescape(encodeURIComponent(str)))
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) {
    str += "="
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString("utf-8")
  }
  return decodeURIComponent(escape(atob(str)))
}

/**
 * Creates a signed HMAC-SHA256 token for admin session
 */
export async function createAdminToken(email: string, expiresInSeconds: number = 86400): Promise<string> {
  const normalizedEmail = (email || "").trim().toLowerCase()
  if (!normalizedEmail) {
    throw new Error("Cannot issue admin token without verified email identity")
  }

  const secret = resolveSigningSecret()
  if (!secret) {
    throw new Error("Server configuration error: ADMIN_SESSION_SECRET is not configured")
  }

  const nowSec = Math.floor(Date.now() / 1000)
  const header = { alg: "HS256", typ: "JWT" }
  const payload: AdminSessionPayload = {
    email: normalizedEmail,
    role: "admin",
    iat: nowSec,
    exp: nowSec + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`

  const key = await getCryptoKey(secret)
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data)
  )

  const signatureBytes = new Uint8Array(signatureBuffer)
  let binaryString = ""
  for (let i = 0; i < signatureBytes.length; i++) {
    binaryString += String.fromCharCode(signatureBytes[i])
  }

  const encodedSignature = (typeof Buffer !== "undefined"
    ? Buffer.from(signatureBytes).toString("base64")
    : btoa(binaryString))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

  return `${data}.${encodedSignature}`
}

/**
 * Verifies the token cryptographic signature, claims, and expiration
 */
export async function verifyAdminToken(token: string | undefined | null): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string" || token.length > 2048) return null

  const secret = resolveSigningSecret()
  if (!secret) return null

  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const data = `${encodedHeader}.${encodedPayload}`

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader))
    if (!header || header.alg !== "HS256") return null

    const key = await getCryptoKey(secret)
    let paddedSig = encodedSignature.replace(/-/g, "+").replace(/_/g, "/")
    while (paddedSig.length % 4) {
      paddedSig += "="
    }

    let signatureBytes: Uint8Array
    if (typeof Buffer !== "undefined") {
      signatureBytes = new Uint8Array(Buffer.from(paddedSig, "base64"))
    } else {
      const binaryString = atob(paddedSig)
      signatureBytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        signatureBytes[i] = binaryString.charCodeAt(i)
      }
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      new TextEncoder().encode(data)
    )

    if (!isValid) return null

    const payload: AdminSessionPayload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload || typeof payload.email !== "string" || !payload.email.includes("@")) {
      return null
    }

    const nowSec = Math.floor(Date.now() / 1000)
    if (!payload.exp || payload.exp < nowSec) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
