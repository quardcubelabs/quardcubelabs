// Utility for signing and verifying admin session tokens using standard Web Crypto API (Edge and Node.js compatible)

const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "quardcube-admin-secret-key-360-secure-salt"

export interface AdminSessionPayload {
  email: string
  role: string
  exp: number
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

function base64UrlEncode(str: string): string {
  // Edge runtime and browser safe base64 url encoder
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
 * Creates a signed HMAC token for admin session
 */
export async function createAdminToken(email: string, expiresInSeconds: number = 86400): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" }
  const payload: AdminSessionPayload = {
    email,
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`

  const key = await getCryptoKey(ADMIN_SECRET)
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
 * Verifies the token signature and expiration
 */
export async function verifyAdminToken(token: string | undefined | null): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") return null

  const parts = token.split(".")
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const data = `${encodedHeader}.${encodedPayload}`

  try {
    const key = await getCryptoKey(ADMIN_SECRET)
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

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch (err) {
    return null
  }
}
