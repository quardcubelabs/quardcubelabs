"use client"

import { useEffect } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("admin-theme")
      document.body.classList.add("admin-theme")
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("admin-theme")
        document.body.classList.remove("admin-theme")
      }
    }
  }, [])

  return (
    <div className="admin-root admin-theme min-h-screen" data-admin-root="true" data-admin-theme="true">
      {children}
    </div>
  )
}
