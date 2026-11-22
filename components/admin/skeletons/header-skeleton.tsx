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
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md relative overflow-hidden transition-all duration-300",
        isDark ? "bg-[#0a1033] text-white" : "bg-teal text-navy",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
          <Skeleton className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-full shrink-0 shadow-md", isDark ? "bg-teal-500/20 border border-teal-500/30" : "bg-navy/20 border border-navy/20")} />
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <Skeleton className={cn("h-6 sm:h-8 md:h-9 w-36 sm:w-64 rounded-lg", isDark ? "bg-slate-800" : "bg-navy/20")} />
            <Skeleton className={cn("h-3 sm:h-4 sm:h-5 w-48 sm:w-80 rounded-md", isDark ? "bg-slate-800/80" : "bg-navy/15")} />
          </div>
        </div>
        {hasActions && (
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: actionsCount }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-9 sm:h-10 w-28 sm:w-32 rounded-xl",
                  i > 0 && "hidden sm:block", // Show 1 primary action button skeleton on mobile
                  isDark ? "bg-slate-800" : "bg-white/60"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
