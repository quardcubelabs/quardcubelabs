"use client"

import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface AdminLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  type?: 'dashboard' | 'table' | 'cards' | 'default'
}

export default function AdminLoading({
  type = 'default',
}: AdminLoadingProps) {
  const { isDark } = useAdminTheme()

  const pulseClass = cn(
    "relative overflow-hidden rounded-xl",
    isDark
      ? "bg-slate-800/60 after:bg-gradient-to-r after:from-transparent after:via-teal-400/10 after:to-transparent"
      : "bg-slate-200/80 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent",
    "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:content-['']"
  )

  const cardBaseClass = cn(
    "rounded-2xl border-2 p-5 transition-all duration-300",
    isDark
      ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
      : "bg-white border-navy/20 shadow-md"
  )

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner Skeleton */}
      <div className={cn(
        "p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md relative overflow-hidden",
        isDark ? "bg-slate-900/90 border border-teal/20" : "bg-teal/80"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className={cn(pulseClass, "h-8 sm:h-9 w-48 sm:w-64 rounded-lg", isDark ? "bg-slate-800" : "bg-navy/20")} />
            <div className={cn(pulseClass, "h-4 sm:h-5 w-64 sm:w-80 rounded-md", isDark ? "bg-slate-800/80" : "bg-navy/15")} />
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(pulseClass, "h-10 w-32 rounded-xl", isDark ? "bg-slate-800" : "bg-white/60")} />
            <div className={cn(pulseClass, "h-10 w-28 rounded-xl", isDark ? "bg-slate-800" : "bg-white/60")} />
          </div>
        </div>
      </div>

      {/* 2. Top Stats Metrics Row Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cardBaseClass}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className={cn(pulseClass, "h-3.5 w-20 rounded")} />
                <div className={cn(pulseClass, "h-7 w-28 rounded-lg")} />
                <div className={cn(pulseClass, "h-3 w-16 rounded")} />
              </div>
              <div className={cn(pulseClass, "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex-shrink-0")} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Content Grids Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left / Chart Section Skeleton (2 cols) */}
        <div className={cn(cardBaseClass, "lg:col-span-2 space-y-5 p-6")}>
          <div className="flex items-center justify-between border-b pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1.5">
              <div className={cn(pulseClass, "h-5 w-40 rounded-md")} />
              <div className={cn(pulseClass, "h-3.5 w-56 rounded")} />
            </div>
            <div className={cn(pulseClass, "h-8 w-24 rounded-lg")} />
          </div>

          {/* Simulated Chart Bars & Grid */}
          <div className="h-64 sm:h-72 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
            {[40, 65, 30, 85, 55, 90, 45, 75, 60, 95, 50, 70].map((height, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className={cn(pulseClass, "w-full rounded-t-lg transition-all duration-300")}
                  style={{ height: `${height}%` }}
                />
                <div className={cn(pulseClass, "h-2.5 w-4 sm:w-6 rounded")} />
              </div>
            ))}
          </div>
        </div>

        {/* Right / Activity Feed or Widget Skeleton (1 col) */}
        <div className={cn(cardBaseClass, "space-y-4 p-6")}>
          <div className="flex items-center justify-between border-b pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1.5">
              <div className={cn(pulseClass, "h-5 w-32 rounded-md")} />
              <div className={cn(pulseClass, "h-3.5 w-44 rounded")} />
            </div>
            <div className={cn(pulseClass, "h-6 w-12 rounded-full")} />
          </div>

          {/* List Item Skeletons */}
          <div className="space-y-3.5 pt-1">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className={cn(
                  "p-3 rounded-xl flex items-center justify-between gap-3 border",
                  isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-slate-50/80"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(pulseClass, "h-9 w-9 rounded-full flex-shrink-0")} />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className={cn(pulseClass, "h-3.5 w-3/4 rounded")} />
                    <div className={cn(pulseClass, "h-2.5 w-1/2 rounded")} />
                  </div>
                </div>
                <div className={cn(pulseClass, "h-4 w-12 rounded")} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Table / List View Skeleton */}
      <div className={cn(cardBaseClass, "space-y-4 p-6")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-navy/10 dark:border-teal/20">
          <div className="space-y-1.5">
            <div className={cn(pulseClass, "h-5 w-36 rounded-md")} />
            <div className={cn(pulseClass, "h-3.5 w-52 rounded")} />
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(pulseClass, "h-9 w-40 rounded-xl")} />
            <div className={cn(pulseClass, "h-9 w-20 rounded-xl")} />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-2.5 pt-1">
          {[1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className={cn(
                "p-3.5 rounded-xl flex items-center justify-between gap-4 border",
                isDark ? "border-slate-800/80 bg-slate-900/30" : "border-slate-100 bg-slate-50/50"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={cn(pulseClass, "h-4 w-4 rounded")} />
                <div className={cn(pulseClass, "h-4 w-28 rounded")} />
              </div>
              <div className={cn(pulseClass, "h-4 w-32 rounded hidden sm:block")} />
              <div className={cn(pulseClass, "h-4 w-24 rounded hidden md:block")} />
              <div className={cn(pulseClass, "h-6 w-20 rounded-full")} />
              <div className={cn(pulseClass, "h-8 w-8 rounded-lg")} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
