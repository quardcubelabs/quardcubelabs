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
        <div className="min-h-screen bg-[#1a1a2e]">
          <AdminSidebar />
          <AdminNavbar />
          <div className="flex">
            <main className="flex-1 lg:ml-64 pt-16 min-h-screen transition-all duration-300">
              <div className="relative m-3 sm:m-4">
                {/* Corner covers to hide sharp edges behind rounded card */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-[#1a1a2e]">
                  <div className="absolute bottom-0 right-0 w-full h-full bg-[#40E0D0] rounded-tl-[2rem]"></div>
                </div>
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#1a1a2e]">
                  <div className="absolute bottom-0 left-0 w-full h-full bg-[#40E0D0] rounded-tr-[2rem]"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-8 h-8 bg-[#1a1a2e]">
                  <div className="absolute top-0 right-0 w-full h-full bg-[#40E0D0] rounded-bl-[2rem]"></div>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a1a2e]">
                  <div className="absolute top-0 left-0 w-full h-full bg-[#40E0D0] rounded-br-[2rem]"></div>
                </div>
                {/* Main content card */}
                <div className="bg-[#40E0D0] rounded-[2rem] min-h-[calc(100vh-5rem)] p-5 sm:p-8 shadow-2xl">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarContext.Provider>
    </AdminProvider>
  )
}
