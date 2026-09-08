/**
 * Universal AES-256-GCM Payload Encryption & Decryption Module
 * Built using the standard Web Crypto API (crypto.subtle)
 * Compatible with Node.js, Next.js Edge Runtime, and Modern Browsers
 */

const DEFAULT_SECRET = "quardcube-admin-vault-aes256-gcm-key-360-secure"

function getSecretKey(): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env.NEXT_PUBLIC_VAULT_KEY || process.env.NEXT_PUBLIC_ADMIN_SECRET || DEFAULT_SECRET
  }
  return DEFAULT_SECRET
}

// Cache derived CryptoKey in memory for performance
let cachedKey: CryptoKey | null = null

async function getDerivedCryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey

  const secret = getSecretKey()
  const enc = new TextEncoder()
  const keyMaterial = enc.encode(secret)

  // Use SHA-256 to derive a 256-bit key from the secret string
  const hash = await crypto.subtle.digest("SHA-256", keyMaterial)

  cachedKey = await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )

  return cachedKey
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = ""
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0")
  }
  return hex
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * Encrypts any JSON-serializable JavaScript data into an AES-256-GCM ciphertext string.
 * Output format: "<iv_hex>:<ciphertext_and_tag_hex>"
 */
export async function encryptData<T = any>(data: T): Promise<string> {
  const key = await getDerivedCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit random IV for AES-GCM
  const encodedData = new TextEncoder().encode(JSON.stringify(data))

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)
  const ivHex = bytesToHex(iv)
  const dataHex = bytesToHex(encryptedBytes)

  return `${ivHex}:${dataHex}`
}

/**
 * Decrypts an AES-256-GCM ciphertext string back into the original typed JavaScript object.
 */
export async function decryptData<T = any>(payload: string): Promise<T> {
  if (!payload || typeof payload !== "string" || !payload.includes(":")) {
    throw new Error("Invalid encrypted payload format")
  }

  const [ivHex, dataHex] = payload.split(":")
  const iv = hexToBytes(ivHex)
  const encryptedBytes = hexToBytes(dataHex)
  const key = await getDerivedCryptoKey()

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encryptedBytes as BufferSource
  )

  const decryptedText = new TextDecoder().decode(decryptedBuffer)
  return JSON.parse(decryptedText) as T
}
