"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AdminSidebarContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  toggleMobileOpen: () => void
}

const AdminSidebarContext = createContext<AdminSidebarContextType>({
  isSidebarOpen: true,
  setIsSidebarOpen: () => {},
  toggleSidebar: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  toggleMobileOpen: () => {},
})

export const useAdminSidebar = () => useContext(AdminSidebarContext)

export function AdminSidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Initialize from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin-sidebar-open")
      if (saved !== null) {
        setIsSidebarOpen(saved === "true")
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem("admin-sidebar-open", String(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  const toggleMobileOpen = () => {
    setIsMobileOpen((prev) => !prev)
  }

  return (
    <AdminSidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        isMobileOpen,
        setIsMobileOpen,
        toggleMobileOpen,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  )
}
