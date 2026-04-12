"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export default function AuthStatusLogger() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
    }
  }, [user, isLoading])

  return null // This component doesn't render anything visible
} 