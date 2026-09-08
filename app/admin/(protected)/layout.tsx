"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"
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
      "h-screen overflow-hidden transition-colors duration-300 font-sans relative",
      isDark ? "bg-[#0d0d12] text-slate-100" : "bg-navy text-navy"
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

      <div className="relative z-10 h-full flex flex-col">
        <AdminSidebar />
        <AdminNavbar />
        <div className="flex flex-1 h-full pt-16 overflow-hidden">
          <main className={cn(
            "flex-1 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
          )}>
            {/* Content area with curved top-left edge where navbar and sidebar meet - pinned during scroll */}
            <div className={cn(
              "flex-1 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-7 transition-all duration-300 relative",
              isDark 
                ? "bg-[#0d0d12] text-slate-100 rounded-tl-xl sm:rounded-tl-2xl border-none shadow-none" 
                : "bg-white text-navy rounded-tl-xl sm:rounded-tl-2xl border-0 shadow-2xl"
            )}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {children}
              </motion.div>
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

