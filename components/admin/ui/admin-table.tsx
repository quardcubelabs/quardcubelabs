"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

export type AdminColumnVisibility = "sm" | "md" | "lg"

export interface AdminTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** Hide the column below this breakpoint, e.g. "md" = hidden md:table-cell */
  hidden?: AdminColumnVisibility
  headerClassName?: string
  cellClassName?: string
  align?: "left" | "center" | "right"
}

export interface AdminTableAction<T> {
  key: string
  label: string
  icon: LucideIcon
  onClick?: (row: T) => void
  href?: (row: T) => string
  external?: boolean
  variant?: "view" | "edit" | "delete" | "soft" | "danger-soft"
  hide?: (row: T) => boolean
  /** Hide on the smallest screens (default: true) */
  mobile?: boolean
}

const HIDDEN_CLASS: Record<AdminColumnVisibility, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
}

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

function actionClassName(
  variant: AdminTableAction<unknown>["variant"],
  isDark: boolean
) {
  switch (variant) {
    case "delete":
      return isDark
        ? "bg-teal/15 text-white hover:bg-teal hover:text-navy"
        : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
    case "danger-soft":
      return isDark
        ? "bg-red-500/15 text-red-300 hover:bg-red-500 hover:text-white"
        : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
    case "soft":
      return isDark
        ? "bg-white/10 text-white hover:bg-white hover:text-navy"
        : "bg-teal/15 text-teal hover:bg-teal hover:text-navy"
    case "edit":
      return isDark
        ? "bg-white/10 text-white hover:bg-white hover:text-navy"
        : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
    case "view":
    default:
      return isDark
        ? "bg-navy border border-teal/40 text-teal hover:bg-teal hover:text-navy"
        : "bg-navy text-white hover:bg-navy/90"
  }
}

/**
 * Canonical admin data table. Encodes the Projects page table shell, header
 * row, cell typography, hover states, action buttons and empty state so every
 * management screen renders identically.
 */
export function AdminTable<T>({
  columns,
  data,
  rowKey,
  actions = [],
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or search keyword",
  onRowClick,
  className,
  footer,
  inline = false,
}: {
  columns: Array<AdminTableColumn<T>>
  data: T[]
  rowKey: (row: T) => string | number
  actions?: Array<AdminTableAction<T>>
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  className?: string
  footer?: ReactNode
  /** Lightweight shell for nested tables inside detail sections/modals */
  inline?: boolean
}) {
  const { isDark } = useAdminTheme()
  const hasActions = actions.length > 0

  return (
    <Card
      className={cn(
        inline
          ? "rounded-xl overflow-hidden w-full bg-transparent border border-navy/15 dark:border-teal/25 shadow-none text-navy dark:text-white"
          : "rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 w-full",
        !inline &&
          (isDark
            ? "bg-[#060a22] border-none text-white shadow-none"
            : "bg-white border-2 border-navy/20 text-navy"),
        className
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white font-black border-b border-navy/30">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white",
                    ALIGN_CLASS[column.align ?? "left"],
                    column.hidden && HIDDEN_CLASS[column.hidden],
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
              {hasActions && (
                <th className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-white text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/10 dark:divide-teal/15">
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors duration-150",
                  onRowClick && "cursor-pointer",
                  isDark
                    ? "hover:bg-teal/30 hover:text-white"
                    : "hover:bg-teal/50 hover:text-navy"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "py-2.5 sm:py-3.5 px-2 sm:px-4",
                      ALIGN_CLASS[column.align ?? "left"],
                      column.hidden && HIDDEN_CLASS[column.hidden],
                      column.cellClassName
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
                {hasActions && (
                  <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                      {actions.map((action) => {
                        if (action.hide?.(row)) return null
                        const Icon = action.icon
                        const classes = cn(
                          "p-1 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer inline-flex items-center justify-center",
                          action.mobile === false && "hidden sm:inline-flex",
                          actionClassName(action.variant, isDark)
                        )
                        const content = <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />

                        if (action.href) {
                          const href = action.href(row)
                          if (action.external) {
                            return (
                              <a
                                key={action.key}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes}
                                title={action.label}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {content}
                              </a>
                            )
                          }
                          return (
                            <Link
                              key={action.key}
                              href={href}
                              className={classes}
                              title={action.label}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {content}
                            </Link>
                          )
                        }

                        return (
                          <button
                            key={action.key}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              action.onClick?.(row)
                            }}
                            className={classes}
                            title={action.label}
                          >
                            {content}
                          </button>
                        )
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="py-12 text-center text-navy/60 dark:text-slate-400"
                >
                  <EmptyIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-base">{emptyTitle}</p>
                  <p className="text-xs font-medium mt-1">{emptyDescription}</p>
                </td>
              </tr>
            )}
          </tbody>
          {footer}
        </table>
      </div>
    </Card>
  )
}

/** Round icon bubble used at the start of a primary table cell. */
export function AdminIconBubble({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  const { isDark } = useAdminTheme()
  return (
    <div
      className={cn(
        "hidden sm:flex w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full items-center justify-center shrink-0 shadow-sm border",
        isDark
          ? "bg-navy text-teal border-teal/30"
          : "bg-teal text-navy border-teal/40",
        className
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isDark ? "text-teal" : "text-navy")}
      />
    </div>
  )
}

/** Primary (first-column) cell: icon + title + optional subtitle + optional tag. */
export function AdminPrimaryCell({
  icon,
  title,
  subtitle,
  href,
  badge,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  subtitle?: ReactNode
  href?: string
  badge?: ReactNode
  className?: string
}) {
  const { isDark } = useAdminTheme()
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {icon && <AdminIconBubble icon={icon} />}
      <div className="min-w-0 flex-1">
        <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
          {href ? (
            <Link href={href} className="hover:underline truncate">
              <span className={cn("truncate", isDark ? "text-white" : "text-navy")}>
                {title}
              </span>
            </Link>
          ) : (
            <span className={cn("truncate", isDark ? "text-white" : "text-navy")}>
              {title}
            </span>
          )}
          {badge}
        </div>
        {subtitle && (
          <p
            className={cn(
              "hidden sm:block text-[11px] sm:text-xs line-clamp-1 truncate font-medium",
              isDark ? "text-slate-300" : "text-navy/70"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

/** Compact uppercase pill used for client / category / code columns. */
export function AdminPill({
  children,
  title,
  className,
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  const { isDark } = useAdminTheme()
  return (
    <span
      className={cn(
        "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border font-extrabold uppercase tracking-wider text-[11px] sm:text-xs inline-block",
        isDark
          ? "bg-white/10 border-white/20 text-white"
          : "bg-navy/5 border-navy/10 text-navy",
        className
      )}
      title={title}
    >
      {children}
    </span>
  )
}

/** Small tag used inside list cells (technologies, labels, etc.). */
export function AdminTag({
  children,
  title,
  className,
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  const { isDark } = useAdminTheme()
  return (
    <span
      className={cn(
        "text-[10px] sm:text-[11px] font-semibold border px-1.5 sm:px-2 py-0.5 rounded-md truncate max-w-[80px] sm:max-w-[100px]",
        isDark
          ? "bg-white/10 border-white/20 text-white"
          : "bg-navy/5 border-navy/10 text-navy",
        className
      )}
      title={title}
    >
      {children}
    </span>
  )
}

/** Muted secondary text used in table cells and detail rows. */
export function AdminMutedText({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { isDark } = useAdminTheme()
  return (
    <span
      className={cn(
        "text-[11px] sm:text-xs font-medium",
        isDark ? "text-slate-300" : "text-navy/70",
        className
      )}
    >
      {children}
    </span>
  )
}
