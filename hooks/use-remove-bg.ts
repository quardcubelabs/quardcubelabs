"use client"

import { useState, useEffect, useRef } from "react"

const clientCache = new Map<string, string>()

export function useRemoveBg(imageUrl: string | undefined | null) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!imageUrl || imageUrl === "/placeholder.svg") {
      setProcessedUrl(null)
      return
    }

    // Check client cache
    const cached = clientCache.get(imageUrl)
    if (cached) {
      setProcessedUrl(cached)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller

    setIsProcessing(true)
    fetch("/api/remove-bg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.processedImage) {
          clientCache.set(imageUrl, data.processedImage)
          setProcessedUrl(data.processedImage)
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Background removal failed:", err)
        }
      })
      .finally(() => setIsProcessing(false))

    return () => controller.abort()
  }, [imageUrl])

  return { processedUrl, isProcessing, displayUrl: processedUrl || imageUrl || "/placeholder.svg" }
}

/** Remove backgrounds for an array of image URLs */
export function useRemoveBgMultiple(imageUrls: string[]) {
  const [results, setResults] = useState<Map<string, string>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const processedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const toProcess = imageUrls.filter(
      (url) => url && url !== "/placeholder.svg" && !clientCache.has(url) && !processedRef.current.has(url)
    )

    if (toProcess.length === 0) {
      // All already cached
      const cached = new Map<string, string>()
      imageUrls.forEach((url) => {
        const c = clientCache.get(url)
        if (c) cached.set(url, c)
      })
      if (cached.size > 0) setResults(cached)
      return
    }

    setIsProcessing(true)
    const controller = new AbortController()

    Promise.allSettled(
      toProcess.map((url) => {
        processedRef.current.add(url)
        return fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url }),
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.processedImage) {
              clientCache.set(url, data.processedImage)
            }
          })
      })
    ).then(() => {
      const newResults = new Map<string, string>()
      imageUrls.forEach((url) => {
        const c = clientCache.get(url)
        if (c) newResults.set(url, c)
      })
      setResults(newResults)
      setIsProcessing(false)
    })

    return () => controller.abort()
  }, [imageUrls.join(",")])

  const getUrl = (original: string) => results.get(original) || original

  return { getUrl, isProcessing }
}
