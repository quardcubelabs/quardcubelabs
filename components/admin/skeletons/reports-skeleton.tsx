"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderSkeleton } from "./header-skeleton"
import { AdminMetricsSkeleton } from "./metrics-skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export function AdminReportsSkeleton() {
  const { isDark } = useAdminTheme()

  const cardBaseClass = cn(
    "rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300",
    isDark
      ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
      : "bg-white border-navy/20 shadow-md"
  )

  return (
    <div className="w-full space-y-6">
      <AdminHeaderSkeleton actionsCount={2} />
      <AdminMetricsSkeleton count={4} columns={4} />

      {/* Report Types Preset Selector */}
      <div className={cn(cardBaseClass, "space-y-4")}>
        <div className="flex items-center justify-between border-b pb-3 border-navy/10 dark:border-teal/20">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[1, 2, 3, 4].map((type) => (
            <div
              key={type}
              className={cn(
                "p-4 rounded-xl border flex flex-col justify-between space-y-3",
                type === 1
                  ? "border-teal/50 bg-teal/10 dark:bg-teal-950/40"
                  : "border-navy/10 dark:border-teal/10 bg-slate-50/50 dark:bg-slate-900/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Report Generation Configuration & Export Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn(cardBaseClass, "lg:col-span-2 space-y-5")}>
          <div className="flex items-center justify-between border-b pb-3 border-navy/10 dark:border-teal/20">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-navy/10 dark:border-teal/20">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>

        {/* Recent Generated Reports Downloads */}
        <div className={cn(cardBaseClass, "space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 border-navy/10 dark:border-teal/20">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="p-3 rounded-xl border border-navy/10 dark:border-teal/20 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
