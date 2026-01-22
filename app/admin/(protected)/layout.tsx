"use client"

import { ReactNode, useState, createContext, useContext } from "react"
import { AdminNavbar, AdminSidebar } from "@/components/admin"
import { AdminProvider } from "@/contexts/admin-context"

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

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <AdminProvider>
      <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, toggleSidebar }}>
        <div className="min-h-screen bg-gray-50">
          <AdminSidebar />
          <AdminNavbar />
          <div className="flex">
            <main className="flex-1 lg:ml-64 p-4 sm:p-6 pt-20 sm:pt-24 min-h-screen transition-all duration-300">
              {children}
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </AdminProvider>
  )
}
