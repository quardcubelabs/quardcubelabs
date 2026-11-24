/**
 * URL, SSRF, Open-Redirect, PostgREST & Spreadsheet Security Guards
 * QuardCube Labs Application Security Hardening
 */

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // CGNAT
  /^\[?::1\]?$/,
  /^\[?fc/i,
  /^\[?fd/i,
  /^\[?fe80:/i,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
  /^metadata\.google\.internal$/i,
]

/**
 * Validates that a URL is a safe, public HTTPS URL to prevent Server-Side Request Forgery (SSRF).
 */
export function validateExternalHttpsUrl(rawUrl: string): { valid: boolean; url?: URL; error?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL is required" }
  }

  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    return { valid: false, error: "Malformed URL" }
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are permitted" }
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: "Embedded URL credentials are not permitted" }
  }

  const host = parsed.hostname.toLowerCase()
  if (!host || !host.includes(".")) {
    return { valid: false, error: "Invalid public hostname" }
  }

  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(host)) {
      return { valid: false, error: "Access to internal, loopback, or private network hosts is forbidden" }
    }
  }

  return { valid: true, url: parsed }
}

/**
 * Prevents Open Redirect vulnerabilities by enforcing internal relative paths only.
 */
export function sanitizeRedirectPath(input: string | null | undefined, fallback: string = "/"): string {
  if (!input || typeof input !== "string") return fallback
  const trimmed = input.trim()
  if (!trimmed.startsWith("/")) return fallback
  // Block protocol-relative URLs (//evil.com) and backslash tricks (/\evil.com)
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.includes("://")) {
    return fallback
  }
  return trimmed
}

/**
 * Sanitizes free-text input interpolated into PostgREST `.or()` / `.ilike()` filter expressions.
 */
export function sanitizePostgrestFilterValue(input: string | null | undefined, maxLen: number = 100): string {
  if (!input || typeof input !== "string") return ""
  return input
    .replace(/[,()"'\\%_*;`\r\n\0]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
}

/**
 * Sanitizes string values before writing into CSV/Excel cells to prevent Formula Injection (=, +, -, @).
 */
export function sanitizeSpreadsheetCell<T>(value: T): T | string {
  if (typeof value !== "string") return value
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`
  }
  return value
}
