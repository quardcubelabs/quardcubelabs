"use client"

import * as React from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdminAlertVariant = "default" | "destructive" | "success" | "warning" | "info" | "accent"

interface AdminAlertProps {
  title?: string
  description: string | React.ReactNode
  variant?: AdminAlertVariant
  icon?: React.ReactNode
  onClose?: () => void
  className?: string
  action?: React.ReactNode
}

export function AdminAlert({
  title,
  description,
  variant = "info",
  icon,
  onClose,
  className,
  action,
}: AdminAlertProps) {
  const getDefaultIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      case "destructive":
        return <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      case "info":
        return <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />
      case "accent":
        return <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
      default:
        return <Info className="h-5 w-5 text-navy dark:text-teal-400" />
    }
  }

  return (
    <Alert variant={variant} className={cn("relative overflow-hidden", className)}>
      {icon || getDefaultIcon()}
      <div className="flex items-start justify-between gap-3 w-full pr-6">
        <div className="space-y-1 flex-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>{description}</AlertDescription>
        </div>
        {action && <div className="flex-shrink-0 pt-0.5">{action}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss alert"
          className="absolute right-3 top-3 p-1 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  )
}
