"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

export interface AdminPageHeaderProps {
  /** Main heading, e.g. "Projects" */
  title: string
  /** Accent word rendered after the title, e.g. "Management" */
  accent?: string
  subtitle: string
  icon: LucideIcon
  /** Optional badge rendered under the title (e.g. document number or status) */
  badge?: ReactNode
  onRefresh?: () => void
  onAdd?: () => void
  addLabel?: string
  /** Additional action buttons rendered after the standard ones */
  actions?: ReactNode
  refreshing?: boolean
}

/**
 * Canonical admin list-page banner. Mirrors the Projects page exactly so every
 * management screen starts with the same header, typography and button styles.
 */
export function AdminPageHeader({
  title,
  accent,
  subtitle,
  icon: Icon,
  badge,
  onRefresh,
  onAdd,
  addLabel = "Add New",
  actions,
  refreshing = false,
}: AdminPageHeaderProps) {
  const { isDark } = useAdminTheme()

  return (
    <div
      className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0 mb-4 sm:mb-6",
        isDark
          ? "bg-[#0a1033] border-none text-white shadow-none"
          : "bg-teal text-navy"
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          <div
            className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shrink-0 shadow-md",
              isDark
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "bg-navy text-teal border border-navy/20"
            )}
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 truncate">
              {title}{" "}
              {accent && (
                <span
                  className={cn(
                    "drop-shadow-sm",
                    isDark ? "text-teal-400" : "text-white"
                  )}
                >
                  {accent}
                </span>
              )}
            </h1>
            {badge && <div className="flex flex-wrap items-center gap-2 mt-1">{badge}</div>}
            <p
              className={cn(
                "text-xs sm:text-sm md:text-base font-semibold line-clamp-1 sm:line-clamp-none",
                isDark ? "text-teal-300" : "text-navy/90"
              )}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {(onRefresh || onAdd || actions) && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                disabled={refreshing}
                className={cn(
                  "flex-1 sm:flex-initial font-bold rounded-xl h-10 px-3 sm:px-4 border-2 transition-all text-xs sm:text-sm",
                  isDark
                    ? "border-teal/40 text-teal-300 hover:bg-teal-400/15"
                    : "border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm"
                )}
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-1.5 sm:mr-2", refreshing && "animate-spin")}
                />
                Refresh
              </Button>
            )}
            {onAdd && (
              <Button
                onClick={onAdd}
                className="flex-1 sm:flex-initial bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-3 sm:px-4 shadow-md transition-all active:scale-95 text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
                {addLabel}
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
