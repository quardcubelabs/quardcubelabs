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

  // Get sidebar state from context if available
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button - rendered via AdminNavbar */}
      
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-[#1a1a2e] overflow-y-auto z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                <Image
                  src="/turquoise.png"
                  alt="QuardCube Labs"
                  width={36}
                  height={36}
                  className="object-contain w-8 h-8 sm:w-10 sm:h-10"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">QuardCube</span>
            </Link>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

      {/* Navigation */}
      <div className="p-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <p className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/20"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-gray-900" : "text-gray-500")} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        isActive ? "bg-gray-900/20 text-gray-900" : "bg-white/10 text-gray-300"
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
        <div className="pt-4 mt-auto">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </button>
        </div>
      </div>
    </aside>

    {/* Mobile menu button - Fixed at bottom left for easy thumb access */}
    <button
      onClick={() => setIsMobileOpen(true)}
      className={cn(
        "fixed bottom-6 left-6 z-30 lg:hidden p-4 rounded-full bg-[#1a1a2e] text-white shadow-lg shadow-black/30",
        "hover:bg-[#252547] active:scale-95 transition-all duration-200",
        isMobileOpen && "hidden"
      )}
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" />
    </button>
    </>
  )
}

// Set the toggle function
if (typeof window !== 'undefined') {
  toggleMobileSidebar = () => {}
}
