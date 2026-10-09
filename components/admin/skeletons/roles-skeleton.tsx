"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { AdminHeaderSkeleton } from "./header-skeleton"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export function AdminRolesSkeleton() {
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

      {/* Two Column Layout: Roles List on Left, Permissions Matrix on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Roles Navigation List (1 col) */}
        <div className={cn(cardBaseClass, "space-y-4")}>
          <div className="flex items-center justify-between border-b pb-3 border-navy/10 dark:border-teal/20">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((role) => (
              <div
                key={role}
                className={cn(
                  "p-3.5 rounded-xl border flex items-center justify-between gap-3",
                  role === 1
                    ? "border-teal/50 bg-teal/10 dark:bg-teal-950/40"
                    : "border-navy/10 dark:border-teal/10 bg-slate-50/50 dark:bg-slate-900/30"
                )}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
                <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Permissions Matrix Checklist (2 cols) */}
        <div className={cn(cardBaseClass, "lg:col-span-2 space-y-6")}>
          {/* Active Role Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-navy/10 dark:border-teal/20">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-44 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>

          {/* Module Permission Groups */}
          <div className="space-y-5">
            {[1, 2, 3, 4].map((module) => (
              <div key={module} className="p-4 rounded-xl border border-navy/10 dark:border-teal/20 space-y-3">
                <div className="flex items-center justify-between border-b pb-2 border-navy/10 dark:border-teal/20">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-36 rounded" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {[1, 2, 3, 4, 5, 6].map((perm) => (
                    <div key={perm} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-3.5 w-24 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
