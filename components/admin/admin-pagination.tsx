"use client"

import React from "react"
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
  pageSize?: number
  itemsPerPage?: number
  className?: string
  scrollTargetId?: string
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  pageSize = 20,
  itemsPerPage,
  className,
  scrollTargetId,
}: AdminPaginationProps) {
  const { isDark } = useAdminTheme()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const target = Math.max(1, Math.min(totalPages, page))
    onPageChange(target)
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  // Calculate page numbers with ellipsis (up to 7 items)
  const pageNumbers: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (currentPage > 3) pageNumbers.push("...")
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pageNumbers.push(i)
    if (currentPage < totalPages - 2) pageNumbers.push("...")
    pageNumbers.push(totalPages)
  }

  const circleButton = cn(
    "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer",
    isDark
      ? "text-slate-200 hover:bg-teal-500/20 hover:text-teal-300"
      : "text-navy hover:bg-teal/30 hover:text-navy"
  )

  return (
    <div className={cn("mt-6 flex justify-center", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center p-1.5 sm:p-2 rounded-full border-2 shadow-sm max-w-full",
          isDark
            ? "bg-[#0a1033] border-teal/20 text-white"
            : "bg-white border-navy/20 text-navy"
        )}
      >
        {/* First Page */}
        <button
          type="button"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className={circleButton}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className={circleButton}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Number Buttons */}
        {pageNumbers.map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className={cn(
                  "px-1.5 text-xs font-bold select-none",
                  isDark ? "text-slate-500" : "text-navy/40"
                )}
              >
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isActive = pageNum === currentPage

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => goToPage(pageNum)}
              className={cn(
                "min-w-[2rem] sm:min-w-[2.25rem] h-8 sm:h-9 px-2 rounded-full text-xs font-black transition-all cursor-pointer",
                isActive
                  ? isDark
                    ? "bg-teal-400 text-navy shadow-sm ring-2 ring-teal-400/30"
                    : "bg-navy text-white shadow-sm ring-2 ring-navy/20"
                  : isDark
                    ? "text-slate-300 hover:bg-white/10"
                    : "text-navy hover:bg-teal/30"
              )}
            >
              {pageNum}
            </button>
          )
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={circleButton}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className={circleButton}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>

        {/* Counter Info */}
        <div
          className={cn(
            "hidden sm:block pl-2 pr-1 border-l text-[11px] font-bold",
            isDark ? "border-teal/20 text-slate-400" : "border-navy/20 text-navy/70"
          )}
        >
          {currentPage} / {totalPages}
          {typeof totalItems === "number" && ` (${totalItems.toLocaleString()} items)`}
        </div>
      </div>
    </div>
  )
}

export default AdminPagination
