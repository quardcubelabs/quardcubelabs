"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface FormSkeletonProps {
  sectionsCount?: number
  fieldsPerSection?: number
  hasTabs?: boolean
  tabsCount?: number
  className?: string
}

export function AdminFormSkeleton({
  sectionsCount = 2,
  fieldsPerSection = 4,
  hasTabs = true,
  tabsCount = 5,
  className
}: FormSkeletonProps) {
  const { isDark } = useAdminTheme()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Settings / Form Tabs */}
      {hasTabs && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Array.from({ length: tabsCount }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                "h-10 rounded-xl flex-shrink-0",
                i === 0 ? "w-36 bg-teal/40 dark:bg-teal-500/30" : "w-32"
              )}
            />
          ))}
        </div>
      )}

      {/* Form Card Sections */}
      {Array.from({ length: sectionsCount }).map((_, secIdx) => (
        <div
          key={secIdx}
          className={cn(
            "rounded-2xl border-2 p-5 sm:p-7 transition-all duration-300 space-y-6",
            isDark
              ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
              : "bg-white border-navy/20 shadow-md"
          )}
        >
          {/* Section Header */}
          <div className="flex items-start justify-between gap-4 border-b pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: fieldsPerSection }).map((_, fIdx) => (
              <div key={fIdx} className="space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
            ))}
          </div>

          {/* Toggle / Checkbox Row Simulation */}
          <div className="pt-2 border-t border-navy/10 dark:border-teal/20 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-navy/10 dark:border-teal/20">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy/10 dark:border-teal/20">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
