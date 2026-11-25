"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"

export interface DashboardDonutCardProps {
  title: string
  percentage: number
  primaryLabel: string
  primaryValue?: string
  primaryColor: string
  secondaryLabel: string
  secondaryValue?: string
  secondaryColor: string
  gradientId: string
  gradientFrom: string
  gradientTo: string
  thumbColor: string
  subtitle?: string
}

export function DashboardDonutCard({
  title,
  percentage,
  primaryLabel,
  primaryValue,
  primaryColor,
  secondaryLabel,
  secondaryValue,
  secondaryColor,
  gradientId,
  gradientFrom,
  gradientTo,
  thumbColor,
  subtitle,
}: DashboardDonutCardProps) {
  const { isDark } = useAdminTheme()

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const clampedPct = Math.max(0, Math.min(100, Math.round(percentage) || 0))
  const strokeDashoffset = circumference * (1 - clampedPct / 100)

  // Calculate tip marker position:
  // The SVG has CSS `-rotate-90` (counter-clockwise 90°), which aligns 0° inside the SVG to 12 o'clock on screen.
  // The strokeDasharray sweeps clockwise by (clampedPct / 100) * 360°.
  // Therefore, inside the SVG coordinate space, the tip of the progress arc is at exact angle: (clampedPct / 100) * 360°.
  const angleDeg = (clampedPct / 100) * 360
  const angleRad = (angleDeg * Math.PI) / 180
  const markerX = 80 + radius * Math.cos(angleRad)
  const markerY = 80 + radius * Math.sin(angleRad)

  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col items-center justify-between text-center group",
        isDark
          ? "bg-[#0c1438] border border-teal/20 text-white shadow-xl hover:border-teal/40"
          : "bg-white border-2 border-navy/20 text-navy shadow-md hover:border-navy hover:shadow-lg"
      )}
    >
      {/* Title */}
      <div className="w-full">
        <h3
          className={cn(
            "text-sm sm:text-base font-bold tracking-tight",
            isDark ? "text-slate-200" : "text-navy"
          )}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className={cn(
              "text-[11px] font-medium mt-0.5",
              isDark ? "text-teal-400/80" : "text-navy/60"
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Donut SVG Gauge */}
      <div className="relative my-3 flex items-center justify-center">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
            <filter id={`shadow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background Track Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={isDark ? "#172254" : "#e2e8f0"}
            strokeWidth="16"
          />

          {/* Active Progress Arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Thumb marker at arc end */}
          {clampedPct > 1 && (
            <circle
              cx={markerX}
              cy={markerY}
              r="7.5"
              fill={thumbColor}
              stroke="#ffffff"
              strokeWidth="2.5"
              className="transition-all duration-700 ease-out filter drop-shadow-md"
            />
          )}
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className={cn(
              "text-3xl sm:text-4xl font-black tracking-tight",
              isDark ? "text-white" : "text-navy"
            )}
          >
            {clampedPct}%
          </span>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="w-full pt-2 border-t border-navy/10 dark:border-teal/15 flex items-center justify-around gap-2 text-xs font-semibold">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: primaryColor }}
          />
          <div className="text-left truncate">
            <span className={cn("block truncate text-[11px]", isDark ? "text-slate-300" : "text-navy")}>
              {primaryLabel}
            </span>
            {primaryValue && (
              <span className={cn("block text-[10px] font-black", isDark ? "text-teal-300" : "text-navy")}>
                {primaryValue}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: secondaryColor }}
          />
          <div className="text-left truncate">
            <span className={cn("block truncate text-[11px]", isDark ? "text-slate-400" : "text-navy/70")}>
              {secondaryLabel}
            </span>
            {secondaryValue && (
              <span className={cn("block text-[10px] font-black", isDark ? "text-slate-300" : "text-navy/80")}>
                {secondaryValue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
