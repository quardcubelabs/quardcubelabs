"use client"

import { cn } from "@/lib/utils"

export type GridColumnOption = {
  value: number
  label: string
}

export const GRID_COLUMN_OPTIONS: GridColumnOption[] = [
  { value: 2, label: "2 products per row" },
  { value: 3, label: "3 products per row" },
  { value: 4, label: "4 products per row" },
  { value: 5, label: "5 products per row" },
]

/** Static class strings so Tailwind can detect every responsive variant. */
export const GRID_COLUMN_CLASSES: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
}

type ProductGridColumnsPickerProps = {
  value: number
  onChange: (value: number) => void
  options?: GridColumnOption[]
  isDark?: boolean
  className?: string
}

/** Small glyph that visually represents a grid with the given number of columns. */
function GridGlyph({ columns }: { columns: number }) {
  const cell = 3
  const gap = 1.5
  const rows = 2
  const width = columns * cell + (columns - 1) * gap
  const height = rows * cell + (rows - 1) * gap

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      {Array.from({ length: rows }, (_, row) => (
        <g key={row}>
          {Array.from({ length: columns }, (_, col) => (
            <rect
              key={col}
              x={col * (cell + gap)}
              y={row * (cell + gap)}
              width={cell}
              height={cell}
              rx={0.6}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

/**
 * Segmented grid-density switcher. Each button shows the resulting column
 * layout, so the layout can be changed with a single click — no dropdown.
 */
export default function ProductGridColumnsPicker({
  value,
  onChange,
  options = GRID_COLUMN_OPTIONS,
  isDark = false,
  className,
}: ProductGridColumnsPickerProps) {
  return (
    <div
      role="group"
      aria-label="Products per row"
      className={cn(
        "inline-flex items-center gap-0.5 p-1 rounded-full border-2 shadow-xs",
        isDark ? "bg-[#0a1033] border-teal/30" : "bg-white border-navy/20",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={option.label}
            aria-pressed={isActive}
            title={option.label}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
              isActive
                ? isDark
                  ? "bg-teal text-navy shadow-md"
                  : "bg-navy text-white shadow-md"
                : isDark
                  ? "text-white/60 hover:bg-teal/20 hover:text-white"
                  : "text-navy hover:bg-teal/20 hover:text-navy",
            )}
          >
            <GridGlyph columns={option.value} />
          </button>
        )
      })}
    </div>
  )
}
