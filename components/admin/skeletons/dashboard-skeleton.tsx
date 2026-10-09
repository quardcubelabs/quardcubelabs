"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderSkeleton } from "./header-skeleton"
import { AdminMetricsSkeleton } from "./metrics-skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export function AdminDashboardSkeleton() {
  const { isDark } = useAdminTheme()

  const cardBaseClass = cn(
    "rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300",
    isDark
      ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
      : "bg-white border-navy/20 shadow-md"
  )

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Banner */}
      <AdminHeaderSkeleton actionsCount={2} />

      {/* 2. Top Stats Metrics (4 cards) */}
      <AdminMetricsSkeleton count={4} columns={4} />

      {/* 3. Main Dual Chart & System Live Stream Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left: Revenue Trend Chart (2 cols) */}
        <div className={cn(cardBaseClass, "lg:col-span-2 space-y-5")}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-3.5 w-60 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>

          {/* Simulated Multi-Bar / Area Chart with axes */}
          <div className="h-64 sm:h-72 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
            {[40, 65, 30, 85, 55, 90, 45, 75, 60, 95, 50, 70].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <Skeleton
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{ height: `${h}%` }}
                />
                <Skeleton className="h-2.5 w-4 sm:w-6 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Real-time CCTV / Branch Status Stream (1 col) */}
        <div className={cn(cardBaseClass, "space-y-4")}>
          <div className="flex items-center justify-between border-b pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3.5 w-44 rounded" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>

          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className={cn(
                  "p-3 rounded-xl flex items-center justify-between gap-3 border",
                  isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-slate-50/80"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Recent Sales & Invoices Table */}
      <div className={cn(cardBaseClass, "space-y-4")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-navy/10 dark:border-teal/20">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3.5 w-56 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className={cn(
                "p-3.5 rounded-xl flex items-center justify-between gap-4 border",
                isDark ? "border-slate-800/80 bg-slate-900/30" : "border-slate-100 bg-slate-50/50"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-32 rounded hidden sm:block" />
              <Skeleton className="h-4 w-24 rounded hidden md:block" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
