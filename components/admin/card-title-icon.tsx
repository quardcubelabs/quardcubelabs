"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

type CardTitleIconProps = {
  icon: LucideIcon
  /** Pass the page's existing isDark when available; otherwise the admin theme is used. */
  isDark?: boolean
  className?: string
}

/**
 * Standard QuardCube card-title icon bubble used across the admin dashboard.
 * Light mode: teal background with a navy icon.
 * Dark mode: navy background with a teal icon.
 */
export function CardTitleIcon({ icon: Icon, isDark, className }: CardTitleIconProps) {
  const { isDark: themeIsDark } = useAdminTheme()
  const dark = isDark ?? themeIsDark

  return (
    <span
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
        dark ? "bg-navy text-teal border-teal/30" : "bg-teal text-navy border-teal/40",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", dark ? "text-teal" : "text-navy")} />
    </span>
  )
}
