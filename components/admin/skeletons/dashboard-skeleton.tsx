"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderSkeleton } from "./header-skeleton"
import { AdminMetricsSkeleton } from "./metrics-skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export function AdminDashboardSkeleton() {
  const { isDark } = useAdminTheme()

  const cardBaseClass = cn(
    "rounded-2xl border-2 p-3.5 sm:p-5 md:p-6 transition-all duration-300",
    isDark
      ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
      : "bg-white border-navy/20 shadow-md"
  )

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* 1. Header Banner */}
      <AdminHeaderSkeleton actionsCount={2} />

      {/* 2. Top Stats Metrics (4 cards) */}
      <AdminMetricsSkeleton count={4} columns={4} />

      {/* 3. 4 Donut Gauges Grid matching reference design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              cardBaseClass,
              "flex flex-col items-center justify-between text-center p-5 sm:p-6 space-y-4"
            )}
          >
            <div className="w-full flex flex-col items-center gap-1.5">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
            <div className="my-2">
              <Skeleton className="h-32 w-32 sm:h-36 sm:w-36 rounded-full" />
            </div>
            <div className="w-full pt-2 border-t border-navy/10 dark:border-teal/15 flex items-center justify-around gap-2">
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Dual 2-Column: Recent Orders & Recent System Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Recent Orders */}
        <div className={cn(cardBaseClass, "space-y-3 sm:space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 sm:pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-36 rounded-md" />
              <Skeleton className="h-3 sm:h-3.5 w-48 sm:w-56 rounded" />
            </div>
            <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-xl" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-xl border border-l-4",
                  isDark
                    ? "border-teal/10 border-l-teal-400 bg-white/5"
                    : "border-teal/20 border-l-teal-500 bg-teal-50"
                )}
              >
                <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-2.5 w-12 rounded shrink-0" />
                  </div>
                  <Skeleton className="h-3 w-48 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className={cn(cardBaseClass, "space-y-3 sm:space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 sm:pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1">
              <Skeleton className="h-4 sm:h-5 w-36 sm:w-44 rounded-md" />
              <Skeleton className="h-3 sm:h-3.5 w-52 sm:w-64 rounded" />
            </div>
            <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-xl" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className={cn(
                  "flex items-start gap-3 p-2.5 rounded-xl border border-l-4",
                  isDark
                    ? "border-teal/10 border-l-teal-400 bg-white/5"
                    : "border-teal/20 border-l-teal-500 bg-teal-50"
                )}
              >
                <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-40 rounded" />
                    <Skeleton className="h-2.5 w-12 rounded shrink-0" />
                  </div>
                  <Skeleton className="h-3 w-56 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
