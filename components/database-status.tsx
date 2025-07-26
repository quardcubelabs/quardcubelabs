"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DatabaseStatusProps {
  children: React.ReactNode
}

export function DatabaseStatus({ children }: DatabaseStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true)
    } else {
      const timer = setTimeout(() => setShowOfflineMessage(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return (
    <>
      {showOfflineMessage && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                Connection restored! Data may take a moment to refresh.
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                You appear to be offline. Some features may not be available.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  )
}

export function DatabaseErrorFallback() {
  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Database Connection Issue</p>
          <p className="text-sm text-gray-600">
            We're experiencing connectivity issues with our database. This could be due to:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Temporary network issues</li>
            <li>Database maintenance</li>
            <li>High server load</li>
          </ul>
          <p className="text-sm text-gray-600">
            Please try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
