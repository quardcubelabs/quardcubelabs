import { z } from "zod"

/**
 * Enterprise Input & Identity Validation Library
 * QuardCube Labs Security Hardening
 */

// Comprehensive email regex supporting international domains and country-code TLDs (e.g. .co.tz, .or.tz, .ac.tz)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

// Tanzanian and international phone numbers (e.g., +255 712 345 678, 0712345678, +1...)
const PHONE_REGEX = /^(\+?[0-9]{1,4}[\s-]?)?(\(?[0-9]{2,4}\)?[\s-]?)?[0-9]{3,4}[\s-]?[0-9]{3,4}$/

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Email address is too short")
  .max(254, "Email address is too long")
  .regex(EMAIL_REGEX, "Invalid email address format")
  .refine((email) => {
    const parts = email.split("@")
    if (parts.length !== 2) return false
    const domain = parts[1]
    // Verify top-level domain has at least 2 characters
    const domainParts = domain.split(".")
    if (domainParts.length < 2) return false
    const tld = domainParts[domainParts.length - 1]
    return tld.length >= 2 && !tld.includes(" ")
  }, "Invalid domain extension in email address")

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long")
  .max(128, "Password must not exceed 128 characters")

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, "Invalid phone number format")
  .optional()
  .or(z.literal(""))

export const monetaryAmountSchema = z
  .number()
  .nonnegative("Amount cannot be negative")
  .finite("Amount must be a finite number")
  .max(1_000_000_000_000, "Amount exceeds permitted maximum")

export const quantitySchema = z
  .number()
  .int("Quantity must be an integer")
  .nonnegative("Quantity cannot be negative")
  .max(1_000_000, "Quantity exceeds permitted maximum")

/**
 * Normalizes email address to lower case and trimmed string
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return ""
  return email.trim().toLowerCase()
}

/**
 * Validates email syntax strictly
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const result = emailSchema.safeParse(email)
  return result.success
}

/**
 * Validates password complexity requirements
 */
export function isValidPassword(password: string | null | undefined): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Password is required" }
  }
  const result = passwordSchema.safeParse(password)
  if (!result.success) {
    return { valid: false, error: result.error.errors[0]?.message || "Invalid password" }
  }
  return { valid: true }
}

/**
 * Basic HTML / script-tag sanitization to prevent stored & reflected XSS
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return ""
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, (char) => (char === "<" ? "&lt;" : "&gt;"))
    .trim()
}
