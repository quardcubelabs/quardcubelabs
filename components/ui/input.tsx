import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:shadow-[0_0_0_2px_#40E0D0,0_0_0_4px_#000080] focus-visible:outline-none focus-visible:border-slate-400 dark:focus-visible:border-slate-500 focus-visible:shadow-[0_0_0_2px_#40E0D0,0_0_0_4px_#000080] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
