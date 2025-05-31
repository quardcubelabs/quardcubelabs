import { cn } from "@/lib/utils"

export default function Logo({
  size = "md",
  className = "",
}: { size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  // Update the sizes object to make the grid smaller relative to the dotted circle
  const sizes = {
    xs: {
      container: "w-6 h-6",
      grid: "w-4 h-4",
      gap: "gap-[0.5px]",
      border: "border-[1.5px]",
    },
    sm: {
      container: "w-10 h-10",
      grid: "w-7 h-7",
      gap: "gap-[1px]",
      border: "border-[2px]",
    },
    md: {
      container: "w-12 h-12",
      grid: "w-8 h-8",
      gap: "gap-[1.5px]",
      border: "border-[2.5px]",
    },
    lg: {
      container: "w-16 h-16",
      grid: "w-11 h-11",
      gap: "gap-[2px]",
      border: "border-[3px]",
    },
  }

  return (
    <div
      className={cn(
        `relative flex items-center justify-center ${sizes[size].container} rounded-full ${sizes[size].border} border-navy bg-teal`,
        className,
      )}
    >
      {/* Grid of elements */}
      <div className={`relative ${sizes[size].grid} grid grid-cols-3 grid-rows-3 ${sizes[size].gap}`}>
        {/* Row 1: Empty, Square, Semi-circle */}
        <div className="bg-transparent"></div>
        <div className="bg-red-600"></div>
        <div className="bg-red-600 rounded-tr-full"></div>

        {/* Row 2: Square, Square, Square */}
        <div className="bg-red-600"></div>
        <div className="bg-red-600"></div>
        <div className="bg-red-600"></div>

        {/* Row 3: Semi-circle, Square, Empty */}
        <div className="bg-red-600 rounded-bl-full"></div>
        <div className="bg-red-600"></div>
        <div className="bg-transparent"></div>
      </div>
    </div>
  )
}
