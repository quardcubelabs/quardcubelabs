"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type BadgeTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
  | "purple"

const TONE_CLASS: Record<BadgeTone, string> = {
  success:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  info: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  warning:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  danger: "bg-red-500/15 text-brand-red border-red-500/30",
  neutral:
    "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
  purple:
    "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
}

/** One status vocabulary for every admin list, regardless of the domain. */
const STATUS_TONES: Record<string, BadgeTone> = {
  // positive / finished
  completed: "success",
  complete: "success",
  paid: "success",
  settled: "success",
  reconciled: "success",
  fully_reconciled: "success",
  issued: "success",
  approved: "success",
  active: "success",
  hired: "success",
  converted: "success",
  won: "success",
  posted: "success",
  received: "success",
  fulfilled: "success",
  available: "success",
  in_stock: "success",
  balanced: "success",
  resolved: "success",
  verified: "success",
  // in progress
  in_progress: "info",
  "in-progress": "info",
  processing: "info",
  reviewing: "info",
  interview: "info",
  interviewing: "info",
  partially_paid: "info",
  partially_allocated: "info",
  shortlisted: "info",
  in_transit: "info",
  shipped: "info",
  // awaiting / scheduled
  submitted: "info",
  in_review: "info",
  under_review: "info",
  unposted: "warning",
  pending: "warning",
  planned: "warning",
  scheduled: "warning",
  sent: "warning",
  unpaid: "warning",
  draft: "warning",
  open: "warning",
  overdue: "warning",
  low_stock: "warning",
  reserved: "warning",
  new: "warning",
  // negative / closed
  cancelled: "danger",
  canceled: "danger",
  rejected: "danger",
  declined: "danger",
  expired: "danger",
  refunded: "danger",
  voided: "danger",
  closed: "danger",
  lost: "danger",
  suspended: "danger",
  damage: "danger",
  defective: "danger",
  rma: "warning",
  under_repair: "warning",
  out_of_stock: "danger",
  returned: "danger",
  // neutral / other
  archived: "neutral",
  inactive: "neutral",
  completed_draft: "neutral",
}

export function AdminStatusBadge({
  status,
  label,
  className,
}: {
  status?: string | null
  label?: ReactNode
  className?: string
}) {
  const key = (status ?? "").toLowerCase()
  const tone = STATUS_TONES[key] ?? "neutral"
  const text = label ?? (key ? key.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—")

  return (
    <Badge
      className={cn(
        "font-bold text-xs whitespace-nowrap",
        TONE_CLASS[tone],
        className
      )}
    >
      {text}
    </Badge>
  )
}

export function AdminCountBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "text-[11px] px-2 py-0.5 rounded-full font-bold inline-block",
        className
      )}
    >
      {children}
    </span>
  )
}

export function AdminBooleanBadge({ value }: { value?: boolean | null }) {
  return (
    <AdminStatusBadge
      status={value ? "active" : "inactive"}
      label={value ? "Yes" : "No"}
    />
  )
}
