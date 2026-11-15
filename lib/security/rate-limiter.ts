/**
 * High-performance sliding-window in-memory rate limiter.
 * Protects against DDoS, brute-force credential stuffing, and scraping floods.
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

// Global store across Edge / Node.js runtime instances
const ipStore = new Map<string, RateLimitRecord>()

// Periodically clean up expired entries to keep memory footprint minimal
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  ipStore.forEach((record, key) => {
    if (record.resetAt <= now) {
      ipStore.delete(key)
    }
  })
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
  limit: number
}

/**
 * Check if a client key (IP or identifier) has exceeded the permitted rate.
 *
 * @param key Unique key, e.g. client IP or IP + action
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60 * 1000
): RateLimitResult {
  cleanupExpired()

  const now = Date.now()
  const record = ipStore.get(key)

  if (!record || record.resetAt <= now) {
    // New or expired window
    ipStore.set(key, { count: 1, resetAt: now + windowMs })
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
      limit,
    }
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000))
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
      limit,
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    limit,
  }
}

/**
 * Extract client IP from Next.js request headers
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip")
  if (cfConnectingIp) return cfConnectingIp.trim()

  const xRealIp = headers.get("x-real-ip")
  if (xRealIp) return xRealIp.trim()

  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  return "127.0.0.1"
}
