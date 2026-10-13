"use client"

import { ReactNode, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react"
import { AdminNavbar, AdminSidebar } from "@/components/admin"
import AdminLoading from "@/components/admin/admin-loading"
import { AdminProvider, useAdmin } from "@/contexts/admin-context"
import { AdminThemeProvider, useAdminTheme } from "@/contexts/admin-theme-context"
import { AdminSidebarProvider, useAdminSidebar } from "@/contexts/admin-sidebar-context"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: ReactNode
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const { isDark } = useAdminTheme()
  const { isSidebarOpen } = useAdminSidebar()
  const { isAdmin, isLoading, isRouteAllowed, roleName } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/admin/login")
    }
  }, [isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-6",
        isDark ? "bg-[#0d0d12]" : "bg-navy"
      )}>
        <div className="w-full max-w-6xl">
          <AdminLoading type="dashboard" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

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
                {!isRouteAllowed(pathname) ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4 py-12">
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl",
                      isDark ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-rose-50 text-rose-600 border border-rose-200"
                    )}>
                      <ShieldAlert className="w-10 h-10 stroke-[2.2]" />
                    </div>
                    <span className={cn(
                      "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-3",
                      isDark ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700"
                    )}>
                      Permission Denied
                    </span>
                    <h2 className={cn(
                      "text-2xl sm:text-3xl font-black mb-3 tracking-tight",
                      isDark ? "text-white" : "text-navy"
                    )}>
                      Access Restricted
                    </h2>
                    <p className={cn(
                      "text-sm mb-6 leading-relaxed",
                      isDark ? "text-slate-400" : "text-gray-600"
                    )}>
                      Your active role (<strong className={isDark ? "text-teal-300 font-bold" : "text-teal-700 font-bold"}>{roleName || "Staff"}</strong>) does not have permission to view or operate this page. Permissions are dynamically configured on the <strong className="underline">Roles & Permissions</strong> page.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => router.back()}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
                          isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                        )}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                      </button>
                      <Link
                        href="/admin/dashboard"
                        className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-teal hover:bg-teal/90 text-navy transition-all shadow-md shadow-teal/20"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Return to Dashboard
                      </Link>
                    </div>
                  </div>
                ) : (
                  children
                )}
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

