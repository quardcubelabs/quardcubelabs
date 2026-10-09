"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface DetailSkeletonProps {
  type?: "invoice" | "order" | "bond" | "default"
  className?: string
}

export function AdminDetailSkeleton({
  type = "default",
  className
}: DetailSkeletonProps) {
  const { isDark } = useAdminTheme()

  const cardBaseClass = cn(
    "rounded-2xl border-2 p-5 sm:p-7 transition-all duration-300",
    isDark
      ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20"
      : "bg-white border-navy/20 shadow-md"
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Detail Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Two Column Layout (Document Sheet on Left, Metadata & Actions Sidebar on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Document / Content Canvas (2 cols) */}
        <div className={cn(cardBaseClass, "lg:col-span-2 space-y-6 min-h-[500px]")}>
          {/* Header row with logo and reference */}
          <div className="flex items-start justify-between gap-4 border-b pb-6 border-navy/10 dark:border-teal/20">
            <div className="space-y-2">
              <Skeleton className="h-10 w-36 rounded-lg" />
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3.5 w-40 rounded" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-8 w-32 rounded-lg ml-auto" />
              <Skeleton className="h-3.5 w-28 rounded ml-auto" />
              <Skeleton className="h-3.5 w-24 rounded ml-auto" />
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="p-4 rounded-xl border border-navy/10 dark:border-teal/20 space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3.5 w-48 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
            <div className="p-4 rounded-xl border border-navy/10 dark:border-teal/20 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-3.5 w-44 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          </div>

          {/* Line Items Table Skeleton */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="border rounded-xl overflow-hidden border-navy/10 dark:border-teal/20">
              <div className="p-3 bg-slate-100 dark:bg-slate-900/60 flex justify-between">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-3.5 flex justify-between border-t border-navy/5 dark:border-teal/10">
                  <div className="space-y-1 w-1/3">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Totals Calculation Card */}
          <div className="flex justify-end pt-4 border-t border-navy/10 dark:border-teal/20">
            <div className="w-full max-w-xs space-y-2.5">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-16 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <div className="flex justify-between pt-2 border-t border-navy/10 dark:border-teal/20">
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-6 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Panel (1 col) */}
        <div className="space-y-6">
          <div className={cn(cardBaseClass, "space-y-4")}>
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-xl border border-navy/10 dark:border-teal/20 space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-3.5 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className={cn(cardBaseClass, "space-y-3")}>
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
