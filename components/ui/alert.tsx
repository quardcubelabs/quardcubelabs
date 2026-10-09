import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 sm:[&>svg]:left-5 [&>svg]:top-4 sm:[&>svg]:top-5 [&>svg]:h-5 [&>svg]:w-5",
  {
    variants: {
      variant: {
        default:
          "bg-background/95 border-border text-foreground shadow-sm dark:bg-slate-900/80 dark:border-slate-800",
        destructive:
          "border-rose-500/30 bg-rose-50/90 text-rose-900 dark:border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-200 [&>svg]:text-rose-600 dark:[&>svg]:text-rose-400 shadow-sm shadow-rose-500/5",
        success:
          "border-emerald-500/30 bg-emerald-50/90 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-200 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400 shadow-sm shadow-emerald-500/5",
        warning:
          "border-amber-500/30 bg-amber-50/90 text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400 shadow-sm shadow-amber-500/5",
        info:
          "border-sky-500/30 bg-sky-50/90 text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-200 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400 shadow-sm shadow-sky-500/5",
        accent:
          "border-teal-500/30 bg-teal-50/90 text-teal-950 dark:border-teal-400/30 dark:bg-teal-950/40 dark:text-teal-100 [&>svg]:text-teal-600 dark:[&>svg]:text-teal-400 shadow-md shadow-teal-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold text-sm sm:text-base leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs sm:text-sm opacity-90 leading-relaxed font-normal", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
