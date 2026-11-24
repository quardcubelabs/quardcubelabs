/**
 * Authoritative formatting utilities for QuardCube Labs Admin Dashboard
 * Enforces standardized typography and compact numeric abbreviations (1K, 1M, 1B)
 */

export function formatCompactNumber(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : parseFloat(String(value || 0)) || 0

  if (Math.abs(n) >= 1_000_000_000) {
    const billions = n / 1_000_000_000
    return billions % 1 === 0 ? `${billions.toFixed(0)}B` : `${billions.toFixed(1)}B`
  }
  if (Math.abs(n) >= 1_000_000) {
    const millions = n / 1_000_000
    return millions % 1 === 0 ? `${millions.toFixed(0)}M` : `${millions.toFixed(1)}M`
  }
  if (Math.abs(n) >= 1_000) {
    const thousands = n / 1_000
    return thousands % 1 === 0 ? `${thousands.toFixed(0)}K` : `${thousands.toFixed(1)}K`
  }

  return n.toLocaleString("en-US")
}

export function formatCompactCurrency(
  value: number | string | null | undefined,
  currency: string = "TZS "
): string {
  const n = typeof value === "number" ? value : parseFloat(String(value || 0)) || 0

  if (Math.abs(n) >= 1_000_000_000) {
    const billions = n / 1_000_000_000
    const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)
    return `${currency}${formatted}B`
  }
  if (Math.abs(n) >= 1_000_000) {
    const millions = n / 1_000_000
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
    return `${currency}${formatted}M`
  }
  if (Math.abs(n) >= 1_000) {
    const thousands = n / 1_000
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    return `${currency}${formatted}K`
  }

  return `${currency}${n.toLocaleString("en-US")}`
}
