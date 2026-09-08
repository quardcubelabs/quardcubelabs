"use client"

import React, { useState } from "react"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CountryFlagProps {
  countryCode?: string
  countryName?: string
  fallbackEmoji?: string
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  tanzania: "tz",
  nigeria: "ng",
  kenya: "ke",
  "south africa": "za",
  "united states": "us",
  usa: "us",
  "united kingdom": "gb",
  uk: "gb",
  france: "fr",
  "saudi arabia": "sa",
  germany: "de",
  uganda: "ug",
  rwanda: "rw",
  burundi: "bi",
  ghana: "gh",
  egypt: "eg",
  morocco: "ma",
  canada: "ca",
  australia: "au",
  india: "in",
  china: "cn",
  japan: "jp",
  italy: "it",
  spain: "es",
  brazil: "br",
  mexico: "mx",
  argentina: "ar",
  uae: "ae",
  "united arab emirates": "ae",
}

const SIZE_CONTAINER_CLASSES: Record<NonNullable<CountryFlagProps["size"]>, string> = {
  xs: "w-4 h-3 min-w-[16px] min-h-[12px] max-w-[16px] max-h-[12px]",
  sm: "w-5 h-3.5 min-w-[20px] min-h-[14px] max-w-[20px] max-h-[14px]",
  md: "w-6 h-4 min-w-[24px] min-h-[16px] max-w-[24px] max-h-[16px]",
  lg: "w-8 h-5.5 min-w-[32px] min-h-[22px] max-w-[32px] max-h-[22px]",
  xl: "w-10 h-7 min-w-[40px] min-h-[28px] max-w-[40px] max-h-[28px] sm:w-11 sm:h-7.5 sm:min-w-[44px] sm:min-h-[30px]",
}

export function CountryFlag({
  countryCode,
  countryName,
  fallbackEmoji,
  className = "",
  size = "md",
}: CountryFlagProps) {
  const [hasError, setHasError] = useState(false)

  // Resolve 2-letter ISO code
  let isoCode = countryCode?.trim().toLowerCase()
  if (!isoCode || isoCode.length !== 2) {
    if (countryName) {
      const normalizedName = countryName.trim().toLowerCase()
      isoCode = COUNTRY_NAME_TO_CODE[normalizedName]
    }
  }

  const containerSizeClass = size ? SIZE_CONTAINER_CLASSES[size] : SIZE_CONTAINER_CLASSES.md

  // Handle special cases like "ALL" or "GLOBAL"
  if (countryCode?.toUpperCase() === "GLOBAL" || countryCode?.toUpperCase() === "ALL") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400",
          containerSizeClass,
          className
        )}
      >
        <Globe className="w-full h-full" />
      </span>
    )
  }

  // If no ISO code or failed to load image, fallback to emoji or code badge
  if (!isoCode || isoCode.length !== 2 || hasError) {
    if (fallbackEmoji) {
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center shrink-0 leading-none",
            containerSizeClass,
            className
          )}
          role="img"
          aria-label={countryName || countryCode || "flag"}
        >
          {fallbackEmoji}
        </span>
      )
    }
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center font-mono text-[9px] font-black uppercase rounded-[2px] bg-navy/10 dark:bg-white/10 text-navy dark:text-white shrink-0 border border-black/10 dark:border-white/15",
          containerSizeClass,
          className
        )}
      >
        {countryCode || countryName?.slice(0, 2) || "🌐"}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden rounded-[2px] border border-black/15 dark:border-white/20 shadow-[0_1px_2px_rgba(0,0,0,0.06)] bg-slate-100 dark:bg-slate-800 aspect-[3/2]",
        containerSizeClass,
        className
      )}
      title={countryName || isoCode.toUpperCase()}
    >
      <img
        src={`https://flagcdn.com/${isoCode}.svg`}
        alt={countryName || `${isoCode.toUpperCase()} flag`}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover block"
      />
    </span>
  )
}
