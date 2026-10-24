"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface MetricsSkeletonProps {
  count?: number
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function AdminMetricsSkeleton({
  count = 4,
  columns = 4,
  className
}: MetricsSkeletonProps) {
  const { isDark } = useAdminTheme()

  const gridColsClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[columns] || "grid-cols-2 md:grid-cols-4"

  return (
    <div className={cn("grid gap-2.5 sm:gap-4 md:gap-5", gridColsClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl border-2 p-3 sm:p-4 md:p-5 transition-all duration-300",
            isDark
              ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
              : "bg-white border-navy/20 shadow-md",
            i === 4 && "col-span-2 sm:col-span-1" // If 5 items, span full width on 2-col mobile
          )}
        >
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
              <Skeleton className="h-3 sm:h-3.5 w-16 sm:w-24 rounded" />
              <Skeleton className="h-5 sm:h-7 md:h-8 w-20 sm:w-32 rounded-lg" />
              <div className="flex items-center gap-1.5 pt-0.5 sm:pt-1">
                <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-12 rounded-full" />
                <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16 rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}
