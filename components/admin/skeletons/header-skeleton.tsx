"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface HeaderSkeletonProps {
  hasActions?: boolean
  actionsCount?: number
  className?: string
}

export function AdminHeaderSkeleton({
  hasActions = true,
  actionsCount = 2,
  className
}: HeaderSkeletonProps) {
  const { isDark } = useAdminTheme()

  return (
    <div
      className={cn(
        "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md relative overflow-hidden",
        isDark ? "bg-slate-900/90 border border-teal/20" : "bg-teal/80",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className={cn("h-8 sm:h-9 w-44 sm:w-64 rounded-lg", isDark ? "bg-slate-800" : "bg-navy/20")} />
          <Skeleton className={cn("h-4 sm:h-5 w-60 sm:w-80 rounded-md", isDark ? "bg-slate-800/80" : "bg-navy/15")} />
        </div>
        {hasActions && (
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: actionsCount }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn("h-10 w-28 sm:w-32 rounded-xl", isDark ? "bg-slate-800" : "bg-white/60")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
