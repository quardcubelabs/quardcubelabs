"use client"

import { useState } from "react"

type PaymentLogoProps = {
  src: string
  alt: string
  /** Tailwind size classes for the logo box, e.g. "h-7 w-20". Use wide boxes. */
  className?: string
  fallbackLabel?: string
}

/**
 * Payment provider logos are wide (roughly 1.7:1) and ship as small local
 * PNG/JPG assets. A native img with object-contain keeps their aspect ratio
 * intact at any container size, and a text label is shown if an asset fails.
 */
export default function PaymentLogo({ src, alt, className = "h-7 w-20", fallbackLabel }: PaymentLogoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-navy/10 bg-navy/5 px-1.5 text-center text-[10px] font-bold leading-tight text-navy ${className}`}
        title={alt}
      >
        {fallbackLabel || alt}
      </span>
    )
  }

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-navy/10 bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </span>
  )
}
