import { useEffect, useState } from "react"

export function useGlobalLoading() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Listen for Next.js route changes
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    if (typeof window !== "undefined") {
      window.addEventListener("next-route-start", handleStart)
      window.addEventListener("next-route-complete", handleComplete)
    }

    // Simulate initial load (remove this if you have your own loading logic)
    setTimeout(() => setIsLoading(false), 1000)

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("next-route-start", handleStart)
        window.removeEventListener("next-route-complete", handleComplete)
      }
    }
  }, [])

  return isLoading
}
