"use client"

import { ReactNode } from "react"
import { AdminNavbar, AdminSidebar } from "@/components/admin"
import { AdminProvider } from "@/contexts/admin-context"
import { AdminThemeProvider, useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminSidebarProvider, useAdminSidebar } from "@/contexts/admin-sidebar-context"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const { isDark } = useAdminTheme()
  const { isSidebarOpen } = useAdminSidebar()

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans relative overflow-x-hidden",
      isDark ? "bg-[#0d0d12] text-slate-100" : "bg-teal text-navy"
    )}>
      {/* QuardCube Website Signature Grid Pattern - overlays on top of all elements */}
      <div 
        className={cn(
          "fixed inset-0 pointer-events-none z-[60]",
          isDark ? "pattern-grid-dark" : "pattern-grid"
        )} 
      />

      {/* Ambient Glow Orbs */}
      <div className={cn("fixed top-12 left-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0", isDark ? "bg-teal/5" : "bg-teal/15")} />
      <div className={cn("fixed bottom-12 right-1/4 w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0", isDark ? "bg-white/5" : "bg-navy/15")} />

      <div className="relative z-10">
        <AdminSidebar />
        <AdminNavbar />
        <div className="flex">
          <main className={cn(
            "flex-1 pt-16 min-h-screen transition-all duration-300 ease-in-out",
            isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
          )}>
            <div className="relative m-3 sm:m-5 transition-all duration-300">
              {/* Main content container with QuardCube website theme - 100% white in light mode */}
              <div className={cn(
                "min-h-[calc(100vh-6rem)] p-4 sm:p-7 rounded-2xl sm:rounded-3xl transition-all duration-300 relative",
                isDark 
                  ? "bg-[#0d0d12] border-none text-slate-100 shadow-none" 
                  : "bg-white border-2 border-navy/20 text-navy shadow-[0_8px_32px_rgba(0,0,128,0.12)] shadow-2xl"
              )}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProvider>
      <AdminThemeProvider>
        <AdminSidebarProvider>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </AdminSidebarProvider>
      </AdminThemeProvider>
    </AdminProvider>
  )
}

