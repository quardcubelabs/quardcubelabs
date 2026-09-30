"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface QuardCubeStampProps {
  date?: string | Date
  receiptNumber?: string
  color?: "teal" | "navy" | "emerald" | "black"
  variant?: "circular" | "boxed"
  className?: string
  title?: string
  status?: string
}

/**
 * Computerized Official Corporate Stamp for QuardCube Labs Receipts & Invoices.
 * Uses official company logo structure, concentric rings, curved SVG typography,
 * and high-resolution vector geometry with print-ready crisp rendering.
 */
export default function QuardCubeStamp({
  date = new Date(),
  receiptNumber,
  color = "teal",
  variant = "circular",
  className = "",
  title = "QUARDCUBE LABS LIMITED",
  status = "PAID & VERIFIED"
}: QuardCubeStampProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).toUpperCase()
    : new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).toUpperCase()

  const colorStyles = {
    teal: {
      primary: "#0d9488", // teal-600
      secondary: "#14b8a6", // teal-500
      dark: "#0f766e", // teal-700
      border: "border-teal-600",
      text: "text-teal-700",
      bg: "bg-teal-500/5",
    },
    navy: {
      primary: "#1e3a8a", // blue-900 / navy
      secondary: "#0284c7", // sky-600
      dark: "#0f172a", // slate-900
      border: "border-blue-900",
      text: "text-blue-900",
      bg: "bg-blue-900/5",
    },
    emerald: {
      primary: "#059669", // emerald-600
      secondary: "#10b981", // emerald-500
      dark: "#047857", // emerald-700
      border: "border-emerald-600",
      text: "text-emerald-700",
      bg: "bg-emerald-500/5",
    },
    black: {
      primary: "#18181b", // zinc-900
      secondary: "#3f3f46", // zinc-700
      dark: "#09090b", // zinc-950
      border: "border-zinc-900",
      text: "text-zinc-900",
      bg: "bg-zinc-900/5",
    }
  }[color]

  if (variant === "boxed") {
    return (
      <div className={cn("inline-block transform -rotate-3 select-none", className)}>
        <div
          className={cn(
            "p-3 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center",
            colorStyles.border,
            colorStyles.bg
          )}
          style={{ width: 180 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 relative shrink-0">
              <Image src="/turquoise.png" alt="QuardCube Logo" fill className="object-contain" />
            </div>
            <span className={cn("font-black text-[11px] tracking-tight uppercase", colorStyles.text)}>
              QUARDCUBE LABS
            </span>
          </div>
          <div
            className="w-full py-0.5 text-[9px] font-black uppercase tracking-widest text-white rounded my-0.5"
            style={{ backgroundColor: colorStyles.primary }}
          >
            {status}
          </div>
          <p className="text-[10px] font-bold font-mono mt-0.5 text-slate-800">
            {formattedDate}
          </p>
          {receiptNumber && (
            <p className="text-[8px] font-mono text-slate-600 tracking-wider">
              REF: #{receiptNumber}
            </p>
          )}
          <span className="text-[7.5px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
            ACCOUNTS & SETTLEMENTS
          </span>
        </div>
      </div>
    )
  }

  // Circular Official Stamp with Curved SVG Text and Central Turquoise Logo
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center transform -rotate-6 select-none opacity-90 hover:opacity-100 transition-opacity",
        className
      )}
      style={{ width: 140, height: 140 }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        className="overflow-visible drop-shadow-xs"
      >
        <defs>
          {/* Top text curved path */}
          <path
            id="stampTopPath"
            d="M 28,100 A 72,72 0 1,1 172,100"
            fill="none"
          />
          {/* Bottom text curved path */}
          <path
            id="stampBottomPath"
            d="M 172,100 A 72,72 0 0,1 28,100"
            fill="none"
          />
          {/* Subtle ink texture effect */}
          <filter id="inkRoughness">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Outer concentric rings */}
        <circle
          cx="100"
          cy="100"
          r="95"
          fill="none"
          stroke={colorStyles.primary}
          strokeWidth="3.5"
          strokeDasharray="6,2"
        />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke={colorStyles.primary}
          strokeWidth="1.5"
        />
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke={colorStyles.primary}
          strokeWidth="1.5"
        />
        <circle
          cx="100"
          cy="100"
          r="58"
          fill="none"
          stroke={colorStyles.primary}
          strokeWidth="0.8"
        />

        {/* Curved Header text: QUARDCUBE LABS LIMITED */}
        <text
          fill={colorStyles.dark}
          fontSize="11.5"
          fontWeight="900"
          letterSpacing="2.2"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          <textPath
            href="#stampTopPath"
            startOffset="50%"
            textAnchor="middle"
          >
            {title}
          </textPath>
        </text>

        {/* Curved Footer text: ★ OFFICIAL SETTLEMENT SEAL ★ */}
        <text
          fill={colorStyles.dark}
          fontSize="10"
          fontWeight="800"
          letterSpacing="1.8"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          <textPath
            href="#stampBottomPath"
            startOffset="50%"
            textAnchor="middle"
          >
            ★ OFFICIAL SETTLED STAMP ★
          </textPath>
        </text>

        {/* Center Badge Area */}
        {/* Center horizontal divider line top */}
        <line x1="62" y1="78" x2="138" y2="78" stroke={colorStyles.primary} strokeWidth="1.2" />

        {/* Center horizontal divider line bottom */}
        <line x1="62" y1="122" x2="138" y2="122" stroke={colorStyles.primary} strokeWidth="1.2" />

        {/* Center Main Status Text */}
        <text
          x="100"
          y="93"
          textAnchor="middle"
          fill={colorStyles.primary}
          fontSize="10.5"
          fontWeight="900"
          letterSpacing="1.2"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          {status}
        </text>

        {/* Dynamic Date */}
        <text
          x="100"
          y="106"
          textAnchor="middle"
          fill={colorStyles.dark}
          fontSize="9.5"
          fontWeight="800"
          letterSpacing="0.8"
          fontFamily="monospace, system-ui, sans-serif"
        >
          {formattedDate}
        </text>

        {/* Verification Department */}
        <text
          x="100"
          y="117"
          textAnchor="middle"
          fill={colorStyles.secondary}
          fontSize="7"
          fontWeight="800"
          letterSpacing="1"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        >
          DAR ES SALAAM, TZ
        </text>

        {/* Center Decorative Stars */}
        <text x="50" y="103" textAnchor="middle" fill={colorStyles.primary} fontSize="9">★</text>
        <text x="150" y="103" textAnchor="middle" fill={colorStyles.primary} fontSize="9">★</text>
      </svg>
    </div>
  )
}
