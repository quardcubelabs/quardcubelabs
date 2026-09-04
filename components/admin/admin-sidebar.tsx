"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  FileText,
  Wrench,
  FolderOpen,
  Briefcase,
  PenTool,
  UserCheck,
  Receipt,
  Store,
  Tag,
  Plug,
  MessageSquare,
  HelpCircle,
  LogOut,
  TrendingUp,
  Bell,
  X,
  Menu,
} from "lucide-react"
import { adminSignOut } from "@/lib/admin-auth"
import { getProducts } from "@/lib/product-actions"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"

// Export toggle function for navbar to use
export let toggleMobileSidebar: () => void = () => {}

const menuSections = [
  {
    title: "Menu",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Insights", href: "/admin/reports", icon: TrendingUp },
      { name: "Updates", href: "/admin/blogs", icon: Bell },
      { name: "Customers", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "Products",
    items: [
      { name: "Store", href: "/admin/products", icon: Store, badge: "dynamic" },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Invoices", href: "/admin/invoices", icon: Receipt },
      { name: "Quotations", href: "/admin/quotations", icon: FileText },
      { name: "Services", href: "/admin/services", icon: Wrench },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "Projects", href: "/admin/projects", icon: FolderOpen },
      { name: "Positions", href: "/admin/positions", icon: Briefcase },
      { name: "Applications", href: "/admin/applications", icon: UserCheck },
    ],
  },
  {
    title: "General",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Help Desk", href: "/admin/reports", icon: HelpCircle },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()
  const [productCount, setProductCount] = useState<number | null>(null)

  useEffect(() => {
    getProducts()
      .then((products) => setProductCount(products.length))
      .catch(() => setProductCount(null))
  }, [])

  const handleSignOut = async () => {
    try {
      const { error } = await adminSignOut()
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Signed Out",
        description: "Successfully signed out of admin dashboard.",
      })
      
      router.push("/admin/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Get sidebar states from AdminSidebarContext
  const { isSidebarOpen, isMobileOpen, setIsMobileOpen } = useAdminSidebar()

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname, setIsMobileOpen])

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar Container */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 overflow-y-auto z-50 transition-all duration-300 ease-in-out shadow-xl",
        isSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full lg:pointer-events-none",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isDark 
          ? "bg-[#1e1e26] border-r border-white/10 text-slate-200" 
          : "bg-white border-r-2 border-navy/20 text-navy shadow-lg"
      )}>
        {/* Logo */}
        <div className={cn(
          "p-4 sm:p-5 flex items-center justify-between",
          isDark ? "border-b border-white/10" : "border-b-2 border-navy/10"
        )}>
          <Link href="/admin/dashboard" className="flex items-center group">
            <Image
              src="/footer-logo.png"
              alt="QuardCube Labs"
              width={160}
              height={48}
              className="h-auto w-[135px] sm:w-[155px] object-contain group-hover:scale-105 transition-transform"
            />
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              isDark ? "hover:bg-teal/70 hover:text-navy text-gray-400" : "hover:bg-teal/70 hover:text-navy text-navy"
            )}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Navigation */}
      <div className="p-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <p className={cn(
              "px-3 mb-2 text-xs font-black uppercase tracking-wider",
              isDark ? "text-teal-400" : "text-navy/70"
            )}>
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 tracking-tight",
                      isActive
                        ? isDark
                          ? "bg-teal text-navy font-black shadow-md shadow-teal/25 translate-x-1"
                          : "bg-navy text-white font-black shadow-md shadow-navy/20 translate-x-1"
                        : isDark
                          ? "text-slate-200 hover:bg-teal/70 hover:text-navy hover:translate-x-0.5"
                          : "text-navy hover:bg-teal/70 hover:text-navy hover:translate-x-0.5"
                    )}
                  >
                    <div className="flex items-center font-bold">
                      <Icon className={cn(
                        "mr-3 h-4.5 w-4.5 transition-colors stroke-[2.2]",
                        isActive
                          ? isDark ? "text-navy stroke-[2.8]" : "text-teal stroke-[2.8]"
                          : isDark ? "text-slate-300" : "text-navy/80"
                      )} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-black rounded-full",
                        isActive
                          ? isDark ? "bg-navy/20 text-navy font-black" : "bg-teal text-navy font-black"
                          : isDark ? "bg-teal-400/20 text-teal-300 border border-teal-400/30" : "bg-teal-50 text-navy border-2 border-teal/40"
                      )}>
                        {item.badge === "dynamic" ? (productCount ?? "...") : item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}

        {/* Logout Button */}
        <div className={cn(
          "pt-4 mt-auto",
          isDark ? "border-t border-white/10" : "border-t-2 border-navy/10"
        )}>
          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center w-full px-3.5 py-2.5 text-sm font-black rounded-xl transition-all duration-200 tracking-tight",
              isDark 
                ? "text-rose-400 hover:bg-teal/70 hover:text-navy" 
                : "text-brand-red hover:bg-teal/70 hover:text-navy"
            )}
          >
            <LogOut className="mr-3 h-5 w-5 stroke-[2.4]" />
            Log out
          </button>
        </div>
      </div>
    </aside>

    {/* Mobile menu button - Fixed at bottom left for easy thumb access */}
    <button
      onClick={() => setIsMobileOpen(true)}
      className={cn(
        "fixed bottom-6 left-6 z-30 lg:hidden p-4 rounded-full shadow-xl",
        "active:scale-95 transition-all duration-200",
        isDark
          ? "bg-teal-400 text-navy hover:bg-teal-300 shadow-teal-400/30"
          : "bg-navy text-white hover:bg-navy/90 shadow-navy/30",
        isMobileOpen && "hidden"
      )}
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
    </>
  )
}

