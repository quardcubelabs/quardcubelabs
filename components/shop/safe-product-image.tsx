"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Package } from "lucide-react"
import { isInvalidImageUrl } from "@/hooks/use-remove-bg"

type SafeProductImageProps = {
  src?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  /** Extra URLs (e.g. product swatches) to try when the main image is missing or broken. */
  fallbackSrcs?: string[]
}

/**
 * Product images in the cart/checkout come from a mix of local assets and
 * third-party catalogues. Some hosts block the Next.js image optimiser, some
 * products only have swatch images, and some URLs are placeholders. Render the
 * first working source directly (unoptimised) and fall back through the rest
 * before showing a clean placeholder instead of a broken image icon.
 */
export default function SafeProductImage({
  src,
  alt,
  width = 48,
  height = 48,
  className = "",
  fallbackSrcs = [],
}: SafeProductImageProps) {
  const candidates = useMemo(
    () =>
      [src, ...fallbackSrcs].filter(
        (url): url is string => typeof url === "string" && !isInvalidImageUrl(url)
      ),
    [src, fallbackSrcs]
  )
  const [failed, setFailed] = useState<string[]>([])

  // Reset the failure list whenever the underlying product image changes.
  useEffect(() => {
    setFailed([])
  }, [src, fallbackSrcs.join("|")])

  const current = candidates.find((url) => !failed.includes(url))

  if (!current) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-navy/5 text-navy/40 ${className}`}
        style={{ width, height }}
        aria-label={alt}
      >
        <Package className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-md bg-white ${className}`} style={{ width, height }}>
      <Image
        key={current}
        src={current}
        alt={alt}
        fill
        sizes={`${width}px`}
        unoptimized
        referrerPolicy="no-referrer"
        onError={() => setFailed((prev) => [...prev, current])}
        className="object-contain"
      />
    </div>
  )
}
