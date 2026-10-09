import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-slate-200/75 dark:bg-slate-800/60",
        shimmer &&
          "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 dark:after:via-teal-400/10 after:to-transparent after:content-['']",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
