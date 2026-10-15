"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowLeft, RefreshCw, Building2 } from "lucide-react"

export default function SupplierDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { isDark } = useAdminTheme()

  useEffect(() => {
    console.error("Supplier ledger route exception:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card
        className={cn(
          "max-w-md w-full p-8 text-center rounded-3xl border-2 shadow-xl space-y-4",
          isDark
            ? "bg-[#0a1033] border-teal/20 text-white"
            : "bg-white border-navy/20 text-navy"
        )}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-full mx-auto flex items-center justify-center border shadow-sm",
            isDark
              ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
              : "bg-rose-50 text-rose-600 border-rose-200"
          )}
        >
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black mb-1">Supplier Profile Error</h2>
          <p className="text-xs opacity-75 leading-relaxed">
            An unexpected error occurred while loading this vendor profile and ledger.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900/10 dark:bg-slate-900/40 text-left font-mono text-[11px] break-all border border-navy/10 dark:border-teal/20 opacity-80 max-h-24 overflow-y-auto">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            onClick={() => reset()}
            className={cn(
              "w-full sm:w-auto font-bold rounded-xl gap-2",
              isDark ? "bg-teal text-navy hover:bg-teal-400" : "bg-navy text-white hover:bg-navy/90"
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Link href="/admin/suppliers" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className={cn(
                "w-full font-bold rounded-xl gap-2 border-2",
                isDark ? "border-teal/30 text-teal hover:bg-teal/10" : "border-navy/20 text-navy hover:bg-slate-50"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Suppliers Directory
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
