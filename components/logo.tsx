import { cn } from "@/lib/utils"
import Image from "next/image"

export default function Logo({
  size = "md",
  className = "",
}: { size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    xs: {
      container: "w-6 h-6",
    },
    sm: {
      container: "w-10 h-10",
    },
    md: {
      container: "w-12 h-12",
    },
    lg: {
      container: "w-16 h-16",
    },
  }

  return (
    <div
      className={cn(
        `relative flex items-center justify-center ${sizes[size].container}`,
        className,
      )}
    >
      <Image
        src="/turquoise.png"
        alt="QuardCubeLabs Logo"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
