"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Search } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

export interface AdminFilterTab {
  key: string
  label: string
  icon?: LucideIcon
  count?: number
}

export interface AdminSelectFilter {
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
  allLabel?: string
  className?: string
}

/** The horizontal chip row used on the Projects page (status filters). */
export function AdminFilterTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: AdminFilterTab[]
  value: string
  onChange: (value: string) => void
}) {
  const { isDark } = useAdminTheme()

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {tabs.map((tab) => {
        const isSelected = value === tab.key
        const Icon = tab.icon

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0",
              isSelected
                ? "bg-navy text-white shadow-md"
                : isDark
                  ? "text-slate-300 hover:bg-teal-400/10 hover:text-teal-300"
                  : "text-navy/70 hover:bg-teal-50 hover:text-navy"
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isSelected
                    ? "text-white"
                    : isDark
                      ? "text-slate-400"
                      : "text-navy/60"
                )}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors",
                  isSelected
                    ? "bg-white/20 text-white"
                    : isDark
                      ? "bg-slate-800 text-slate-300"
                      : "bg-navy/10 text-navy"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Canonical search + filter card. Render the chip row through `tabs` (or pass
 * `children` for a custom first row) and any number of dropdown filters.
 */
export function AdminFilterBar({
  tabs,
  tabValue,
  onTabChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search records...",
  selects = [],
  children,
}: {
  tabs?: AdminFilterTab[]
  tabValue?: string
  onTabChange?: (value: string) => void
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  selects?: AdminSelectFilter[]
  children?: ReactNode
}) {
  const { isDark } = useAdminTheme()

  return (
    <Card
      className={cn(
        "rounded-2xl p-3 sm:p-4 transition-all duration-300 space-y-3",
        isDark
          ? "bg-[#0a1033] border-none shadow-none"
          : "bg-white border-2 border-navy/20 shadow-sm"
      )}
    >
      {tabs && tabValue !== undefined && onTabChange && (
        <AdminFilterTabs
          tabs={tabs}
          value={tabValue}
          onChange={onTabChange}
        />
      )}
      {children}

      {(search !== undefined || selects.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
          {search !== undefined && onSearchChange && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(
                  "pl-10 h-10 sm:h-11 rounded-xl border font-medium text-xs sm:text-sm w-full border-slate-300 dark:border-slate-600",
                  isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy"
                )}
              />
            </div>
          )}
          {selects.map((select) => (
            <Select
              key={select.placeholder}
              value={select.value}
              onValueChange={select.onValueChange}
            >
              <SelectTrigger
                className={cn(
                  "w-full sm:w-[180px] h-10 sm:h-11 rounded-xl border font-bold text-xs shrink-0 border-slate-300 dark:border-slate-600",
                  isDark ? "bg-[#080d2a] text-white" : "bg-white text-navy",
                  select.className
                )}
              >
                <SelectValue placeholder={select.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {select.allLabel ?? "All"}
                </SelectItem>
                {select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}
    </Card>
  )
}
