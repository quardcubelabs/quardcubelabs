"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderSkeleton } from "./header-skeleton"
import { AdminMetricsSkeleton } from "./metrics-skeleton"
import { AdminChartSkeleton } from "./chart-skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export function AdminAnalyticsSkeleton() {
  const { isDark } = useAdminTheme()

  const cardBaseClass = cn(
    "rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300",
    isDark
      ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
      : "bg-white border-navy/20 shadow-md"
  )

  return (
    <div className="w-full space-y-6">
      <AdminHeaderSkeleton actionsCount={3} />

      {/* Analytics Period Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-navy/10 dark:border-teal/20">
          {["Today", "7 Days", "30 Days", "90 Days", "1 Year"].map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-8 rounded-lg", i === 2 ? "w-20 bg-teal/40 dark:bg-teal-500/30" : "w-16")}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <AdminMetricsSkeleton count={4} columns={4} />

      {/* Dual Analytics Charts (Area Growth + Category Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminChartSkeleton type="bar" height={300} />
        </div>
        <div className="lg:col-span-1">
          <AdminChartSkeleton type="donut" />
        </div>
      </div>

      {/* Bottom Breakdown Grids (Top Products Leaderboard + Channels) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cn(cardBaseClass, "space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 border-navy/10 dark:border-teal/20">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-navy/5 dark:border-teal/10">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-36 rounded" />
                    <Skeleton className="h-2.5 w-24 rounded" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-3 w-12 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(cardBaseClass, "space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 border-navy/10 dark:border-teal/20">
            <Skeleton className="h-5 w-44 rounded-md" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="space-y-1.5 p-2.5 rounded-xl border border-navy/5 dark:border-teal/10">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
