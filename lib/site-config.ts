/**
 * Centralized Canonical Site URL Configuration
 * Enforces https://quardcubelabs.co.tz across all public links, feeds, and metadata.
 * Strips legacy/staging domains (e.g. quardcube.vercel.app).
 */

export const CANONICAL_SITE_URL = "https://quardcubelabs.co.tz"

export function getCanonicalSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!envUrl || envUrl.includes("vercel.app") || envUrl.includes("localhost")) {
    return CANONICAL_SITE_URL
  }
  return envUrl.replace(/\/$/, "")
}

export function sanitizeSiteDomain(url: string | null | undefined): string {
  if (!url) return ""
  return url.replace(/https?:\/\/quardcube\.vercel\.app/g, CANONICAL_SITE_URL)
}

export function getProductPageUrl(productId: number | string): string {
  return `${CANONICAL_SITE_URL}/shop/${productId}`
}
