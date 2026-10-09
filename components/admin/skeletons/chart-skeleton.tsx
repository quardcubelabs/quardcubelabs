"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface ChartSkeletonProps {
  title?: string
  height?: number
  type?: "bar" | "area" | "donut"
  className?: string
}

export function AdminChartSkeleton({
  title,
  height = 280,
  type = "bar",
  className
}: ChartSkeletonProps) {
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
      {/* Chart Card Header */}
      <div className="flex items-center justify-between border-b pb-4 border-navy/10 dark:border-teal/20">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36 sm:w-48 rounded-md" />
          <Skeleton className="h-3.5 w-48 sm:w-64 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Chart Canvas Simulation */}
      {type === "donut" ? (
        <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
          <Skeleton className="h-44 w-44 rounded-full flex-shrink-0" />
          <div className="space-y-3 w-full max-w-xs">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <Skeleton className="h-3.5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ height: `${height}px` }} className="flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
          {[35, 60, 45, 80, 50, 90, 40, 75, 65, 95, 55, 70].map((h, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <Skeleton
                className="w-full rounded-t-lg transition-all duration-300"
                style={{ height: `${h}%` }}
              />
              <Skeleton className="h-2.5 w-4 sm:w-6 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
