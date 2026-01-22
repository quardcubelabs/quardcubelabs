import { ReactNode } from "react"
import { AdminNavbar, AdminSidebar } from "@/components/admin"
import { AdminProvider } from "@/contexts/admin-context"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <AdminNavbar />
        <div className="flex">
          <main className="flex-1 ml-64 p-6 pt-24 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  )
}
