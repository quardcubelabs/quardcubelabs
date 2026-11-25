"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { DollarSign, TrendingUp, Sparkles, Layers } from "lucide-react"

export interface ConcentricRingItem {
  label: string
  value: string
  percentage: number
  color: string
  trackColor?: string
}

export interface DashboardConcentricCardProps {
  title?: string
  subtitle?: string
  mainLabel?: string
  mainValue: string
  growthBadge?: string
  footerNote?: string
  rings: ConcentricRingItem[]
  className?: string
}

export function DashboardConcentricCard({
  title = "Income & Settlement Summary",
  mainLabel = "Total Tracked Volume",
  mainValue,
  growthBadge = "+32.1%",
  footerNote = "Optimize again to get your best score",
  rings,
  className,
}: DashboardConcentricCardProps) {
  const { isDark } = useAdminTheme()

  // Sizing definitions for concentric circles
  const size = 180
  const center = size / 2
  const strokeWidth = 10
  // Radii for outer, middle, and inner rings
  const ringRadii = [68, 52, 36]

  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group",
        isDark
          ? "bg-[#0c1438] border border-teal/20 text-white shadow-xl hover:border-teal/40"
          : "bg-white border-2 border-navy/20 text-navy shadow-md hover:border-navy hover:shadow-lg",
        className
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              isDark ? "bg-amber-400/10 text-amber-400" : "bg-amber-100 text-amber-700"
            )}
          >
            <DollarSign className="w-4 h-4" />
          </div>
          <h3
            className={cn(
              "text-sm sm:text-base font-bold tracking-tight",
              isDark ? "text-slate-100" : "text-navy"
            )}
          >
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              isDark ? "bg-teal/20 text-teal-300" : "bg-navy/10 text-navy"
            )}
          >
            Live KPI
          </span>
        </div>
      </div>

      {/* Main Body: Left Stats & Right Concentric Radial Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto py-1">
        {/* Left Column: Big Total & Stream Breakdown */}
        <div className="sm:col-span-7 flex flex-col justify-center space-y-3">
          <div>
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wider block",
                isDark ? "text-slate-400" : "text-navy/60"
              )}
            >
              {mainLabel}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              <span
                className={cn(
                  "text-2xl sm:text-3xl font-black tracking-tight",
                  isDark ? "text-white" : "text-navy"
                )}
              >
                {mainValue}
              </span>
              {growthBadge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <TrendingUp className="w-3 h-3" />
                  {growthBadge}
                </span>
              )}
            </div>
          </div>

          {/* Breakdown Items with Colored Vertical Indicators */}
          <div className="space-y-1.5 pt-1">
            {rings.map((ring, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 text-xs font-semibold py-0.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: ring.color }}
                  />
                  <span
                    className={cn(
                      "truncate text-[11px] sm:text-xs",
                      isDark ? "text-slate-300" : "text-navy/80"
                    )}
                  >
                    {ring.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-[11px] sm:text-xs font-mono font-bold",
                      isDark ? "text-white" : "text-navy"
                    )}
                  >
                    {ring.value}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.2 rounded font-mono",
                      isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-navy/70"
                    )}
                  >
                    {Math.round(ring.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Concentric Multi-Ring Donut Chart */}
        <div className="sm:col-span-5 flex items-center justify-center">
          <div className="relative">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              {rings.map((ring, idx) => {
                const r = ringRadii[idx] ?? (68 - idx * 16)
                const circ = 2 * Math.PI * r
                const clamped = Math.max(0, Math.min(100, ring.percentage || 0))
                const offset = circ * (1 - clamped / 100)

                return (
                  <g key={idx}>
                    {/* Background Track Circle */}
                    <circle
                      cx={center}
                      cy={center}
                      r={r}
                      fill="none"
                      stroke={ring.trackColor || (isDark ? "#16204a" : "#f1f5f9")}
                      strokeWidth={strokeWidth}
                    />

                    {/* Active Progress Arc */}
                    <circle
                      cx={center}
                      cy={center}
                      r={r}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Central Icon Accent */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shadow-inner",
                  isDark ? "bg-[#080d28]/80 text-teal" : "bg-slate-50 text-navy/70"
                )}
              >
                <Sparkles className="w-4 h-4 opacity-75" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text Matching Reference */}
      {footerNote && (
        <div
          className={cn(
            "w-full pt-3 mt-2 border-t text-center text-[11px] font-medium transition-colors",
            isDark ? "border-teal/15 text-slate-400" : "border-navy/10 text-navy/60"
          )}
        >
          {footerNote}
        </div>
      )}
    </div>
  )
}
