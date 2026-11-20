"use client"

import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

export interface AdminStatItem {
  title: string
  value: string | number
  icon: LucideIcon
  onClick?: () => void
}

const GRID_CLASSES: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
}

/** Canonical KPI card row from the Projects page. */
export function AdminStats({
  items,
  columns = 4,
}: {
  items: AdminStatItem[]
  columns?: 2 | 3 | 4 | 5 | 6
}) {
  const { isDark } = useAdminTheme()

  return (
    <div className={cn("grid gap-2.5 sm:gap-4", GRID_CLASSES[columns])}>
      {items.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card
            key={`${stat.title}-${idx}`}
            onClick={stat.onClick}
            className={cn(
              "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden",
              stat.onClick && "cursor-pointer",
              isDark
                ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]"
                : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
            )}
          >
            <CardContent className="p-3 sm:p-4.5 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 truncate block",
                    isDark ? "text-teal-400/80" : "text-navy/70"
                  )}
                >
                  {stat.title}
                </p>
                <span
                  className={cn(
                    "text-base sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight",
                    isDark ? "text-white" : "text-navy"
                  )}
                >
                  {stat.value}
                </span>
              </div>
              <div
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80"
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 shrink-0",
                    isDark && "text-teal"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
