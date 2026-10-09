"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface CardsGridSkeletonProps {
  count?: number
  columns?: 2 | 3 | 4
  hasFilterBar?: boolean
  hasImage?: boolean
  className?: string
}

export function AdminCardsGridSkeleton({
  count = 6,
  columns = 3,
  hasFilterBar = true,
  hasImage = true,
  className
}: CardsGridSkeletonProps) {
  const { isDark } = useAdminTheme()

  const gridColsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

  return (
    <div className={cn("space-y-5", className)}>
      {/* Search and Category Filter Bar */}
      {hasFilterBar && (
        <div
          className={cn(
            "rounded-2xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
            isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20"
          )}
        >
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      )}

      {/* Grid of Cards */}
      <div className={cn("grid gap-4 sm:gap-5", gridColsClass)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl border-2 overflow-hidden flex flex-col transition-all duration-300",
              isDark
                ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
                : "bg-white border-navy/20 shadow-md"
            )}
          >
            {/* Image Preview Box */}
            {hasImage && (
              <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-navy/10 dark:border-teal/20">
                <Skeleton className="h-full w-full rounded-none" />
                <div className="absolute top-3 right-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            )}

            {/* Card Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3.5 w-20 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-4/5 rounded-md" />
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-2/3 rounded" />
              </div>

              {/* Price / Specs / Footer */}
              <div className="pt-3 border-t border-navy/10 dark:border-teal/20 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12 rounded" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
