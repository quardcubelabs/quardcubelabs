"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface TableSkeletonProps {
  columns?: number
  rows?: number
  hasFilterBar?: boolean
  hasPagination?: boolean
  hasTabs?: boolean
  tabsCount?: number
  className?: string
}

export function AdminTableSkeleton({
  columns = 5,
  rows = 6,
  hasFilterBar = true,
  hasPagination = true,
  hasTabs = false,
  tabsCount = 3,
  className
}: TableSkeletonProps) {
  const { isDark } = useAdminTheme()

  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300 space-y-4",
        isDark
          ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
          : "bg-white border-navy/20 shadow-md",
        className
      )}
    >
      {/* Optional Tabs Header */}
      {hasTabs && (
        <div className="flex items-center gap-2 border-b pb-3 border-navy/10 dark:border-teal/20 overflow-x-auto">
          {Array.from({ length: tabsCount }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-9 rounded-xl flex-shrink-0", i === 0 ? "w-28 bg-teal/40 dark:bg-teal-500/30" : "w-24")}
            />
          ))}
        </div>
      )}

      {/* Filter / Search Bar */}
      {hasFilterBar && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      )}

      {/* Table Structure */}
      <div className="border rounded-xl overflow-hidden border-navy/10 dark:border-teal/20">
        {/* Table Header */}
        <div className={cn("p-3.5 flex items-center justify-between gap-4 border-b border-navy/10 dark:border-teal/20", isDark ? "bg-slate-900/60" : "bg-slate-100/70")}>
          <div className="flex items-center gap-3 w-1/4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          {Array.from({ length: columns - 2 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20 sm:w-28 rounded hidden sm:block" />
          ))}
          <div className="flex justify-end w-20">
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-navy/5 dark:divide-teal/10">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-4 transition-colors"
            >
              {/* Col 1: Identity / Title */}
              <div className="flex items-center gap-3 w-1/4">
                <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-28 sm:w-36 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>

              {/* Middle Columns */}
              {Array.from({ length: columns - 2 }).map((_, colIndex) => (
                <div key={colIndex} className="hidden sm:flex flex-col gap-1">
                  <Skeleton className={cn("h-4 rounded", colIndex % 2 === 0 ? "w-24 sm:w-32" : "w-16 sm:w-20 rounded-full")} />
                </div>
              ))}

              {/* Col Last: Action / Dropdown */}
              <div className="flex items-center justify-end gap-2 w-20">
                <Skeleton className="h-7 w-16 rounded-full hidden md:block" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Footer */}
      {hasPagination && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}
