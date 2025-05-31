"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export default function AuthStatusLogger() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      console.log("User logged in:", !!user)
    }
  }, [user, isLoading])

  return null // This component doesn't render anything visible
} 