"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderSkeleton } from "./header-skeleton"
import { AdminMetricsSkeleton } from "./metrics-skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export function AdminCctvSkeleton() {
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
      <AdminMetricsSkeleton count={4} columns={4} />

      {/* CCTV Navigation Tabs (Surveys, Projects, Packages, Topology Designer) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["Site Surveys", "Active Projects", "CCTV Packages", "Topology & BoQ Designer"].map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-11 rounded-xl flex-shrink-0",
              i === 0 ? "w-36 bg-teal/40 dark:bg-teal-500/30" : "w-36"
            )}
          />
        ))}
      </div>

      {/* Search & Site Filter Bar */}
      <div className={cn(cardBaseClass, "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3")}>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* CCTV Project / Survey Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={cn(cardBaseClass, "space-y-4 flex flex-col justify-between")}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-6 w-4/5 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3.5 w-44 rounded" />
              </div>

              {/* Camera Channels Badges & Stats */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-navy/10 dark:border-teal/20">
                <div className="space-y-1 text-center">
                  <Skeleton className="h-3 w-10 mx-auto rounded" />
                  <Skeleton className="h-4 w-12 mx-auto rounded" />
                </div>
                <div className="space-y-1 text-center border-x border-navy/10 dark:border-teal/20">
                  <Skeleton className="h-3 w-12 mx-auto rounded" />
                  <Skeleton className="h-4 w-14 mx-auto rounded" />
                </div>
                <div className="space-y-1 text-center">
                  <Skeleton className="h-3 w-10 mx-auto rounded" />
                  <Skeleton className="h-4 w-12 mx-auto rounded" />
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
