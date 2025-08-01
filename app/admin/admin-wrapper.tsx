"use client"

import { AdminProvider } from "@/contexts/admin-context"
import { usePathname } from "next/navigation"

interface AdminWrapperProps {
  children: React.ReactNode
}

export function AdminWrapper({ children }: AdminWrapperProps) {
  const pathname = usePathname()
  
  // Don't wrap login page with admin provider
  if (pathname === '/admin/login') {
    return <>{children}</>
  }
  
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  )
}
