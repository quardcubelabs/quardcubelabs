import "server-only"
import { createServerClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/security/rate-limiter"
import { normalizeEmail } from "@/lib/security/validation"

/**
 * Progressive Account Lockout & Anti-Enumeration Protection Engine
 *
 * Policy (Requirement 9):
 * - 3 consecutive failed attempts -> 15 minutes lockout (Level 1)
 * - Next 3 consecutive failures -> 30 minutes lockout (Level 2)
 * - Next 3 consecutive failures -> 1 hour lockout (Level 3)
 * - Next 3 consecutive failures -> 2 hours lockout (Level 4)
 * - Subsequent 3 consecutive failures -> 4 hours maximum lockout cap (Level 5+)
 * - Successful authentication resets consecutive failures & lockout level to 0.
 *
 * Anti-Abuse / Anti-DoS Protection:
 * - Tracks IP failure bursts & multi-account credential-stuffing sprays.
 * - Throttles abusive IPs before they can mass-lock innocent accounts.
 * - Never stores plaintext passwords or session secrets.
 */

export interface AccountLockRecord {
  identifier: string
  failedAttemptCount: number
  consecutiveFailures: number
  lockoutLevel: number
  lastFailedAt: string | null
  lockedUntil: string | null
  lockoutDurationMinutes: number
  lastSuccessAt: string | null
  lastFailedIp?: string
}

const LOCKOUT_DURATIONS_MINUTES = [15, 30, 60, 120, 240] // 15m -> 30m -> 1h -> 2h -> 4h max
const FAILURES_PER_STAGE = 3
const SETTINGS_LOCK_PREFIX = "sec_lock_"

// Fast in-memory cache synced with Supabase `system_settings` / `login_security_locks`
const memoryLockStore = new Map<string, AccountLockRecord>()
const ipDistinctTargets = new Map<string, { targets: Set<string>; resetAt: number }>()

function sanitizeIdentifierKey(raw: string): string {
  return normalizeEmail(raw).replace(/[^a-z0-9@._+-]/g, "").slice(0, 160)
}

function getLockDurationMinutes(level: number): number {
  if (level <= 0) return LOCKOUT_DURATIONS_MINUTES[0]
  const idx = Math.min(level - 1, LOCKOUT_DURATIONS_MINUTES.length - 1)
  return LOCKOUT_DURATIONS_MINUTES[idx]
}

function isIpCredentialSpraying(ip: string, targetId: string): boolean {
  if (!ip || ip === "127.0.0.1" || ip === "unknown") return false
  const now = Date.now()
  const windowMs = 15 * 60 * 1000
  let entry = ipDistinctTargets.get(ip)
  if (!entry || entry.resetAt <= now) {
    entry = { targets: new Set<string>(), resetAt: now + windowMs }
    ipDistinctTargets.set(ip, entry)
  }
  entry.targets.add(targetId)
  // If a single IP targets > 5 distinct accounts in 15 mins, treat as automated spray
  return entry.targets.size > 5
}

async function loadLockRecord(identifier: string): Promise<AccountLockRecord> {
  const key = sanitizeIdentifierKey(identifier)
  const cached = memoryLockStore.get(key)

  try {
    const supabase = createServerClient()
    const settingId = `${SETTINGS_LOCK_PREFIX}${Buffer.from(key).toString("hex").slice(0, 48)}`
    const { data, error } = await supabase
      .from("system_settings")
      .select("settings")
      .eq("id", settingId)
      .maybeSingle()

    if (!error && data?.settings && typeof data.settings === "object") {
      const rec = data.settings as AccountLockRecord
      memoryLockStore.set(key, rec)
      return rec
    }
  } catch {
    // Fallback to in-memory record if DB unavailable
  }

  return (
    cached || {
      identifier: key,
      failedAttemptCount: 0,
      consecutiveFailures: 0,
      lockoutLevel: 0,
      lastFailedAt: null,
      lockedUntil: null,
      lockoutDurationMinutes: 0,
      lastSuccessAt: null,
    }
  )
}

async function saveLockRecord(record: AccountLockRecord): Promise<void> {
  const key = sanitizeIdentifierKey(record.identifier)
  memoryLockStore.set(key, record)

  try {
    const supabase = createServerClient()
    const settingId = `${SETTINGS_LOCK_PREFIX}${Buffer.from(key).toString("hex").slice(0, 48)}`
    await supabase.from("system_settings").upsert({
      id: settingId,
      settings: record,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Non-fatal: in-memory lock remains active
  }
}

export interface PreAuthCheckResult {
  allowed: boolean
  status: 200 | 423 | 429
  retryAfterSeconds?: number
  message?: string
}

/**
 * Checks IP rate limits and account progressive lockout state BEFORE password verification.
 */
export async function checkLoginProtection(
  identifier: string,
  ip: string
): Promise<PreAuthCheckResult> {
  const key = sanitizeIdentifierKey(identifier)

  // 1. Strict per-IP rate limit on authentication endpoints (prevents brute force & account-lockout DoS)
  const ipRate = checkRateLimit(`auth-attempt-ip:${ip}`, 12, 15 * 60 * 1000)
  if (!ipRate.allowed) {
    return {
      allowed: false,
      status: 429,
      retryAfterSeconds: ipRate.resetInSeconds,
      message: "Too many sign-in requests from your network. Please wait before trying again.",
    }
  }

  if (!key) {
    return { allowed: true, status: 200 }
  }

  // 2. Check progressive account lockout state
  const record = await loadLockRecord(key)
  if (record.lockedUntil) {
    const lockedUntilMs = new Date(record.lockedUntil).getTime()
    const now = Date.now()
    if (Number.isFinite(lockedUntilMs) && lockedUntilMs > now) {
      const remainingSeconds = Math.max(1, Math.ceil((lockedUntilMs - now) / 1000))
      const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60))
      return {
        allowed: false,
        status: 423,
        retryAfterSeconds: remainingSeconds,
        message: `Account temporarily locked due to multiple failed sign-in attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`,
      }
    }
  }

  return { allowed: true, status: 200 }
}

/**
 * Records a failed authentication attempt and applies progressive lockout (15m -> 30m -> 1h -> 2h -> 4h).
 * Includes anti-DoS protection so a single spraying IP is throttled rather than locking arbitrary accounts indefinitely.
 */
export async function recordFailedLogin(
  identifier: string,
  ip: string,
  scope: "admin" | "customer" = "customer"
): Promise<{ locked: boolean; retryAfterSeconds?: number; lockoutMinutes?: number }> {
  const key = sanitizeIdentifierKey(identifier)
  if (!key) return { locked: false }

  // Anti-abuse check: if this IP is spraying many distinct accounts, penalize the IP without locking innocent accounts
  if (isIpCredentialSpraying(ip, key)) {
    checkRateLimit(`auth-attempt-ip:${ip}`, 1, 30 * 60 * 1000)
    return { locked: false }
  }

  const record = await loadLockRecord(key)
  const now = new Date()

  // Clear expired lock timestamp before counting new stage failures
  if (record.lockedUntil && new Date(record.lockedUntil).getTime() <= now.getTime()) {
    record.lockedUntil = null
  }

  record.failedAttemptCount = (record.failedAttemptCount || 0) + 1
  record.consecutiveFailures = (record.consecutiveFailures || 0) + 1
  record.lastFailedAt = now.toISOString()
  record.lastFailedIp = ip

  let locked = false
  let retryAfterSeconds: number | undefined
  let lockoutMinutes: number | undefined

  if (record.consecutiveFailures >= FAILURES_PER_STAGE) {
    record.lockoutLevel = (record.lockoutLevel || 0) + 1
    record.consecutiveFailures = 0 // Reset stage counter so next 3 failures after unlock escalate to next tier
    lockoutMinutes = getLockDurationMinutes(record.lockoutLevel)
    record.lockoutDurationMinutes = lockoutMinutes
    const unlockTime = new Date(now.getTime() + lockoutMinutes * 60 * 1000)
    record.lockedUntil = unlockTime.toISOString()
    locked = true
    retryAfterSeconds = lockoutMinutes * 60

    try {
      const { logAuditEvent } = await import("@/lib/audit-actions")
      await logAuditEvent({
        module: "security",
        action: "status_changed",
        record_id: key,
        record_number: `AUTH-LOCK-L${record.lockoutLevel}`,
        description: `Security lockout triggered (${lockoutMinutes} mins, Level ${record.lockoutLevel}) after repeated failed ${scope} login attempts`,
        user_email: key,
        ip_address: ip,
      })
    } catch {
      // Do not fail auth flow on audit error
    }
  } else {
    try {
      const { logAuditEvent } = await import("@/lib/audit-actions")
      await logAuditEvent({
        module: "security",
        action: "rejected",
        record_id: key,
        record_number: "AUTH-FAIL",
        description: `Failed ${scope} authentication attempt (${record.consecutiveFailures}/${FAILURES_PER_STAGE} in current window)`,
        user_email: key,
        ip_address: ip,
      })
    } catch {}
  }

  await saveLockRecord(record)
  return { locked, retryAfterSeconds, lockoutMinutes }
}

/**
 * Resets consecutive failure counters and lockout tier upon successful authentication.
 */
export async function recordSuccessfulLogin(identifier: string): Promise<void> {
  const key = sanitizeIdentifierKey(identifier)
  if (!key) return

  const record = await loadLockRecord(key)
  record.consecutiveFailures = 0
  record.lockoutLevel = 0
  record.lockedUntil = null
  record.lockoutDurationMinutes = 0
  record.lastSuccessAt = new Date().toISOString()

  await saveLockRecord(record)
}
