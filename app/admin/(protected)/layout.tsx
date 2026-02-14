"use client"

import { ReactNode, useState, createContext, useContext } from "react"
import { AdminNavbar, AdminSidebar } from "@/components/admin"
import { AdminProvider } from "@/contexts/admin-context"
import { AdminThemeProvider, useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"

// Sidebar context for mobile toggle
interface SidebarContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isDark } = useAdminTheme()

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
      <div className={cn("min-h-screen transition-colors duration-300", isDark ? "bg-[#1a1a2e]" : "bg-gray-100")}>
        <AdminSidebar />
        <AdminNavbar />
        <div className="flex">
          <main className="flex-1 lg:ml-64 pt-16 min-h-screen transition-all duration-300">
            <div className="relative m-3 sm:m-4 overflow-hidden rounded-[2rem]">
              {/* Main content card */}
              <div className="bg-[#40E0D0] pattern-grid min-h-[calc(100vh-5rem)] p-5 sm:p-8 shadow-2xl">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProvider>
      <AdminThemeProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminThemeProvider>
    </AdminProvider>
  )
}
