"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  Landmark,
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
      { name: "Corporate Bonds", href: "/admin/bonds", icon: Landmark, badge: "Live" },
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

      {/* Admin Sidebar Container (Slim mini-sidebar when collapsed on desktop) */}
      <aside className={cn(
        "fixed left-0 top-0 h-full overflow-y-auto overflow-x-hidden z-50 transition-all duration-300 ease-in-out border-none",
        isSidebarOpen ? "w-64" : "w-20",
        isMobileOpen ? "translate-x-0 w-64" : "lg:translate-x-0 -translate-x-full",
        isDark 
          ? "bg-[#14141d] text-slate-200" 
          : "bg-navy text-white shadow-none"
      )}>
        {/* Logo: /footer-logo.png when expanded, /turquoise.png when collapsed */}
        <div className={cn(
          "p-4 flex items-center justify-between border-none transition-all",
          !isSidebarOpen && "justify-center px-2"
        )}>
          <Link 
            href="/admin/dashboard" 
            className="flex items-center justify-center group"
            title="QuardCube Labs"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSidebarOpen ? (
                <motion.div
                  key="full-logo"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <Image
                    src="/sidebar-logo.png"
                    alt="QuardCube Labs"
                    width={140}
                    height={40}
                    className="h-auto w-[125px] sm:w-[140px] object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
                    priority
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="slim-logo"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <Image
                    src="/turquoise.png"
                    alt="QuardCube"
                    width={112}
                    height={112}
                    quality={100}
                    unoptimized
                    className="w-full h-full object-contain [image-rendering:-webkit-optimize-contrast] brightness-110 drop-shadow-md"
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          {/* Close button for mobile */}
          {isSidebarOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-colors",
                isDark ? "hover:bg-teal/70 hover:text-navy text-gray-400" : "hover:bg-teal hover:text-navy text-white"
              )}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

      {/* Navigation */}
      <div className={cn("p-4 transition-all", !isSidebarOpen && "px-2")}>
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={cn("mb-6", !isSidebarOpen && "mb-4")}>
            <AnimatePresence mode="wait" initial={false}>
              {isSidebarOpen ? (
                <motion.p
                  key="section-title"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "px-3 mb-2 text-xs font-black uppercase tracking-wider",
                    isDark ? "text-teal-400" : "text-teal"
                  )}
                >
                  {section.title}
                </motion.p>
              ) : (
                <motion.div
                  key="section-divider"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ duration: 0.18 }}
                  className="h-[1px] bg-white/10 my-2 mx-1.5"
                />
              )}
            </AnimatePresence>

            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      href={item.href}
                      title={!isSidebarOpen ? item.name : undefined}
                      className={cn(
                        "transition-all duration-200 tracking-tight",
                        isSidebarOpen
                          ? "flex items-center justify-between px-3.5 py-2.5 text-sm font-bold rounded-xl"
                          : "flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-center group",
                        isActive
                          ? "bg-teal text-navy font-black shadow-lg shadow-teal/25 border border-teal-300"
                          : isDark
                            ? "text-slate-200 hover:bg-teal/70 hover:text-navy"
                            : "text-white/90 hover:bg-teal/20 hover:text-teal-300"
                      )}
                    >
                      <div className={cn("flex items-center font-bold", !isSidebarOpen && "justify-center")}>
                        <Icon className={cn(
                          "h-4.5 w-4.5 transition-colors stroke-[2.2] shrink-0",
                          isSidebarOpen && "mr-3",
                          isActive
                            ? "text-navy stroke-[2.8]"
                            : isDark ? "text-slate-300" : "text-teal-300 group-hover:text-teal"
                        )} />
                        <AnimatePresence mode="wait" initial={false}>
                          {isSidebarOpen && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="truncate whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>

                      <AnimatePresence mode="wait" initial={false}>
                        {isSidebarOpen && item.badge && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.18 }}
                            className={cn(
                              "px-2 py-0.5 text-xs font-black rounded-full shrink-0",
                              isActive
                                ? "bg-navy text-teal font-black border border-navy/40"
                                : isDark ? "bg-teal-400/20 text-teal-300 border border-teal-400/30" : "bg-white/10 text-teal-300 border border-teal-400/30"
                            )}
                          >
                            {item.badge === "dynamic" ? (productCount ?? "...") : item.badge}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </div>
        ))}

        {/* Logout Button */}
        <div className={cn(
          "pt-4 mt-auto",
          isDark ? "border-t border-white/10" : "border-t border-white/15"
        )}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSignOut}
            title={!isSidebarOpen ? "Log out" : undefined}
            className={cn(
              "transition-all duration-200 tracking-tight font-black rounded-xl",
              isSidebarOpen 
                ? "flex items-center w-full px-3.5 py-2.5 text-sm"
                : "flex items-center justify-center w-10 h-10 mx-auto",
              isDark 
                ? "text-rose-400 hover:bg-teal/70 hover:text-navy" 
                : "text-rose-300 hover:bg-rose-500/20 hover:text-rose-100"
            )}
          >
            <LogOut className={cn("h-5 w-5 stroke-[2.4] shrink-0", isSidebarOpen && "mr-3")} />
            <AnimatePresence mode="wait" initial={false}>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="truncate whitespace-nowrap"
                >
                  Log out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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

