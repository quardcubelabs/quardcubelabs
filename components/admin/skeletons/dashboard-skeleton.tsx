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

      {/* 3. Main Dual Chart & System Live Stream Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Revenue Trend Chart (2 cols) */}
        <div className={cn(cardBaseClass, "lg:col-span-2 space-y-4 sm:space-y-5")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 sm:pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1">
              <Skeleton className="h-4 sm:h-5 w-36 sm:w-44 rounded-md" />
              <Skeleton className="h-3 sm:h-3.5 w-48 sm:w-60 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 sm:h-8 w-20 sm:w-24 rounded-lg" />
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-20 rounded-lg" />
            </div>
          </div>

          {/* Simulated Multi-Bar / Area Chart with axes - 6 on mobile, 12 on sm+ */}
          <div className="h-52 sm:h-64 md:h-72 flex items-end justify-between gap-2 sm:gap-4 pt-4 sm:pt-6 px-1 sm:px-2">
            {[40, 65, 30, 85, 55, 90, 45, 75, 60, 95, 50, 70].map((h, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 h-full justify-end",
                  idx >= 6 && "hidden sm:flex"
                )}
              >
                <Skeleton
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{ height: `${h}%` }}
                />
                <Skeleton className="h-2 sm:h-2.5 w-4 sm:w-6 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-time CCTV / Branch Status Stream (1 col) */}
        <div className={cn(cardBaseClass, "space-y-3 sm:space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 sm:pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-36 rounded-md" />
              <Skeleton className="h-3 sm:h-3.5 w-36 sm:w-44 rounded" />
            </div>
            <Skeleton className="h-5 sm:h-6 w-12 sm:w-14 rounded-full" />
          </div>

          <div className="space-y-2.5 sm:space-y-3 pt-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className={cn(
                  "p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-3 border",
                  item > 3 && "hidden sm:flex",
                  isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-slate-50/80"
                )}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3 sm:h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-2 sm:h-2.5 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Recent Sales & Invoices Table */}
      <div className={cn(cardBaseClass, "space-y-3 sm:space-y-4")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 border-b pb-3 sm:pb-4 border-navy/10 dark:border-teal/20">
          <div className="space-y-1">
            <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 rounded-md" />
            <Skeleton className="h-3 sm:h-3.5 w-44 sm:w-56 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 sm:h-9 w-28 sm:w-36 rounded-xl" />
            <Skeleton className="h-8 sm:h-9 w-20 sm:w-24 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className={cn(
                "p-2.5 sm:p-3.5 rounded-xl flex items-center justify-between gap-3 sm:gap-4 border",
                row > 3 && "hidden sm:flex",
                isDark ? "border-slate-800/80 bg-slate-900/30" : "border-slate-100 bg-slate-50/50"
              )}
            >
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex-shrink-0" />
                <div className="space-y-1 flex-1 min-w-0">
                  <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-32 rounded" />
                  <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-28 sm:w-32 rounded hidden sm:block" />
              <Skeleton className="h-4 w-20 sm:w-24 rounded hidden md:block" />
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-20 rounded-full shrink-0" />
              <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
