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
      <div className={cn(
        "min-h-screen transition-colors duration-300 font-sans relative overflow-x-hidden",
        isDark ? "bg-[#060a22] text-slate-100" : "bg-teal text-navy"
      )}>
        {/* QuardCube Website Signature Grid Pattern */}
        <div 
          className={cn(
            "fixed inset-0 pointer-events-none z-0 transition-opacity duration-300",
            isDark ? "pattern-grid-dark opacity-40" : "pattern-grid opacity-35"
          )} 
        />

        {/* Ambient Glow Orbs */}
        <div className="fixed top-12 left-1/4 w-96 h-96 rounded-full bg-teal/15 blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-12 right-1/4 w-96 h-96 rounded-full bg-navy/15 blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10">
          <AdminSidebar />
          <AdminNavbar />
          <div className="flex">
            <main className="flex-1 lg:ml-64 pt-16 min-h-screen transition-all duration-300">
              <div className="relative m-3 sm:m-5">
                {/* Main content container with QuardCube website theme */}
                <div className={cn(
                  "min-h-[calc(100vh-6rem)] p-4 sm:p-7 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative",
                  isDark 
                    ? "bg-[#0c1438]/90 backdrop-blur-xl border-teal/20 shadow-[0_8px_32px_rgba(0,0,128,0.4)]" 
                    : "bg-white/95 backdrop-blur-xl border-navy/15 shadow-[0_8px_32px_rgba(0,0,128,0.15)] text-navy"
                )}>
                  {children}
                </div>
              </div>
            </main>
          </div>
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
