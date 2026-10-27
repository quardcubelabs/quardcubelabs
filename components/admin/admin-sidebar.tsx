"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
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
  HelpCircle,
  LogOut,
  Landmark,
  Cctv,
  ExternalLink,
  FileSpreadsheet,
  Boxes,
  Truck,
  DollarSign,
  Building2,
  ShieldCheck,
  FileBarChart,
  Target,
  SlidersHorizontal,
  BookOpen,
  Scale,
  CreditCard,
  Wallet,
  CheckSquare,
  ChevronDown,
  X,
  Menu,
  Sparkles,
} from "lucide-react"
import { adminSignOut } from "@/lib/admin-auth"
import { getProducts } from "@/lib/product-actions"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"
import { useAdmin } from "@/contexts/admin-context"

// Export toggle function for navbar to use
export let toggleMobileSidebar: () => void = () => {}

interface NavSubItem {
  name: string
  href: string
  icon: any
  badge?: string
}

interface NavCategory {
  id: string
  title: string
  icon: any
  badge?: string
  items: NavSubItem[]
}

// Top direct navigation links
const directOverviewItems: NavSubItem[] = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Analytics & Telemetry", href: "/admin/analytics", icon: BarChart3 },
  { name: "Executive Reports", href: "/admin/reports", icon: FileBarChart },
]

// Categorized Dropdown Groups
const dropdownCategories: NavCategory[] = [
  {
    id: "accounting",
    title: "Accounting & Books",
    icon: BookOpen,
    badge: "Books",
    items: [
      { name: "Chart of Accounts", href: "/admin/accounting/accounts", icon: BookOpen, badge: "COA" },
      { name: "Journal Entries", href: "/admin/accounting/journals", icon: Scale },
      { name: "Financial Statements", href: "/admin/accounting/statements", icon: FileBarChart, badge: "P&L" },
      { name: "Banking & Cash", href: "/admin/accounting/banking", icon: Wallet },
      { name: "Operating Expenses", href: "/admin/expenses", icon: DollarSign },
    ],
  },
  {
    id: "crm",
    title: "CRM & Sales Pipeline",
    icon: Target,
    badge: "CRM",
    items: [
      { name: "Leads Management", href: "/admin/crm/leads", icon: Target },
      { name: "Deals & Pipeline", href: "/admin/crm/deals", icon: SlidersHorizontal, badge: "Funnel" },
      { name: "Contacts & Accounts", href: "/admin/crm/contacts", icon: Users },
      { name: "Activities & Tasks", href: "/admin/crm/activities", icon: CheckSquare },
    ],
  },
  {
    id: "sales",
    title: "Sales & Invoicing",
    icon: Receipt,
    items: [
      { name: "Sales Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Commercial Invoices", href: "/admin/invoices", icon: FileText },
      { name: "Credit Notes", href: "/admin/credit-notes", icon: CreditCard, badge: "New" },
      { name: "Proforma Invoices", href: "/admin/proforma-invoices", icon: FileSpreadsheet },
      { name: "Quotations", href: "/admin/quotations", icon: FileText },
      { name: "Payment Receipts", href: "/admin/receipts", icon: Receipt },
    ],
  },
  {
    id: "inventory",
    title: "Inventory & Purchasing",
    icon: Boxes,
    badge: "Live",
    items: [
      { name: "Stock & Warehouses", href: "/admin/inventory", icon: Boxes },
      { name: "Hardware Serials", href: "/admin/inventory/serials", icon: ShieldCheck, badge: "New" },
      { name: "Stocktake & Variance", href: "/admin/inventory/adjustments", icon: Tag },
      { name: "Product Catalogue", href: "/admin/products", icon: Store, badge: "dynamic" },
      { name: "Purchase Orders", href: "/admin/purchases", icon: Truck },
      { name: "Supplier Bills (AP)", href: "/admin/purchases/bills", icon: FileText, badge: "AP" },
      { name: "Suppliers & Vendors", href: "/admin/suppliers", icon: Building2 },
    ],
  },
  {
    id: "operations",
    title: "Engineering & Operations",
    icon: Cctv,
    items: [
      { name: "CCTV Engineering Hub", href: "/admin/cctv", icon: Cctv, badge: "Hub" },
      { name: "Services & Installation", href: "/admin/services", icon: Wrench },
      { name: "Client Projects", href: "/admin/projects", icon: FolderOpen },
      { name: "Corporate Bonds", href: "/admin/bonds", icon: Landmark, badge: "Live" },
      { name: "Regional Branches", href: "/admin/branches", icon: Store },
    ],
  },
  {
    id: "administration",
    title: "System & Administration",
    icon: Settings,
    items: [
      { name: "Staff Directory", href: "/admin/staff", icon: Users },
      { name: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
      { name: "User Accounts", href: "/admin/users", icon: Users },
      { name: "Blogs & Articles", href: "/admin/blogs", icon: PenTool },
      { name: "Career Positions", href: "/admin/positions", icon: Briefcase },
      { name: "Job Applications", href: "/admin/applications", icon: UserCheck },
      { name: "System Settings", href: "/admin/settings", icon: Settings },
      { name: "Help Desk", href: "/admin/help", icon: HelpCircle },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useAdminTheme()
  const { isRouteAllowed, roleName, isSuperAdmin } = useAdmin()
  const { isSidebarOpen, setIsSidebarOpen, isMobileOpen, setIsMobileOpen } = useAdminSidebar()

  const [productCount, setProductCount] = useState<number | null>(null)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})

  // Filter top overview items by RBAC
  const visibleOverviewItems = useMemo(() => {
    return directOverviewItems.filter((item) => isRouteAllowed(item.href))
  }, [isRouteAllowed])

  // Filter categories and their child items by RBAC
  const visibleCategories = useMemo(() => {
    return dropdownCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => isRouteAllowed(item.href)),
      }))
      .filter((cat) => cat.items.length > 0)
  }, [isRouteAllowed])

  // Auto-expand the dropdown that contains the active pathname
  useEffect(() => {
    if (!pathname) return
    const activeCat = visibleCategories.find((cat) =>
      cat.items.some((item) => pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)))
    )
    if (activeCat) {
      setOpenDropdowns((prev) => ({
        ...prev,
        [activeCat.id]: true,
      }))
    }
  }, [pathname, visibleCategories])

  useEffect(() => {
    getProducts()
      .then((products) => setProductCount(products.length))
      .catch(() => setProductCount(null))
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname, setIsMobileOpen])

  const toggleDropdown = (categoryId: string) => {
    // If sidebar is collapsed in mini-mode, clicking a category expands the sidebar first
    if (!isSidebarOpen) {
      setIsSidebarOpen(true)
      setOpenDropdowns((prev) => ({ ...prev, [categoryId]: true }))
      return
    }

    setOpenDropdowns((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

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

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Admin Sidebar Container */}
      <aside className={cn(
        "fixed left-0 top-0 h-full overflow-y-auto overflow-x-hidden z-50 transition-all duration-300 ease-in-out border-none",
        isSidebarOpen ? "w-64" : "w-20",
        isMobileOpen ? "translate-x-0 w-64" : "lg:translate-x-0 -translate-x-full",
        "bg-navy text-white shadow-2xl shadow-black/40"
      )}>
        {/* Brand Header & Logo */}
        <div className={cn(
          "p-4 flex items-center justify-between border-b border-white/10 transition-all",
          !isSidebarOpen && "justify-center px-2"
        )}>
          <Link 
            href="/admin/dashboard" 
            onClick={() => setIsMobileOpen(false)}
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
                  className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <Image
                    src="/turquoise.png"
                    alt="QuardCube"
                    width={40}
                    height={40}
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
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl transition-colors hover:bg-teal hover:text-navy text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className={cn("p-3 transition-all space-y-4", !isSidebarOpen && "px-2")}>
          {/* 1. Direct Overview Links */}
          <div className="space-y-1">
            {isSidebarOpen && (
              <p className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-teal/80">
                Overview
              </p>
            )}

            {visibleOverviewItems.map((item) => {
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
                    onClick={() => setIsMobileOpen(false)}
                    title={!isSidebarOpen ? item.name : undefined}
                    className={cn(
                      "transition-all duration-200 tracking-tight",
                      isSidebarOpen
                        ? "flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl"
                        : "flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-center group",
                      isActive
                        ? "bg-teal text-navy font-black shadow-lg shadow-teal/25 border border-teal-300"
                        : "text-white/90 hover:bg-white/10 hover:text-teal-300"
                    )}
                  >
                    <div className={cn("flex items-center font-bold", !isSidebarOpen && "justify-center")}>
                      <Icon className={cn(
                        "h-4.5 w-4.5 transition-colors stroke-[2.2] shrink-0",
                        isSidebarOpen && "mr-3",
                        isActive
                          ? "text-navy stroke-[2.8]"
                          : "text-teal-300 group-hover:text-teal"
                      )} />
                      {isSidebarOpen && (
                        <span className="truncate whitespace-nowrap">{item.name}</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Section Divider */}
          <div className="h-[1px] bg-white/10 my-1 mx-2" />

          {/* 2. Categorized Dropdown Groups */}
          <div className="space-y-2">
            {isSidebarOpen && (
              <p className="px-3 py-1 text-[11px] font-black uppercase tracking-wider text-teal/80">
                Business Modules
              </p>
            )}

            {visibleCategories.map((cat) => {
              const isOpen = !!openDropdowns[cat.id]
              const Icon = cat.icon
              const hasActiveChild = cat.items.some(
                (item) => pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
              )

              return (
                <div key={cat.id} className="space-y-1">
                  {/* Category Header Button (Dropdown Toggle) */}
                  <button
                    type="button"
                    onClick={() => toggleDropdown(cat.id)}
                    title={!isSidebarOpen ? `${cat.title} (${cat.items.length})` : undefined}
                    className={cn(
                      "w-full transition-all duration-200 tracking-tight select-none",
                      isSidebarOpen
                        ? "flex items-center justify-between px-3 py-2 text-sm font-bold rounded-xl"
                        : "flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-center group relative",
                      hasActiveChild && !isOpen
                        ? "bg-white/15 text-teal-300 border border-teal-400/40 shadow-sm"
                        : isOpen
                        ? "bg-white/10 text-white border border-white/10"
                        : "text-white/85 hover:bg-white/10 hover:text-teal-300"
                    )}
                  >
                    <div className={cn("flex items-center font-bold min-w-0", !isSidebarOpen && "justify-center")}>
                      <Icon className={cn(
                        "h-4.5 w-4.5 transition-colors stroke-[2.2] shrink-0",
                        isSidebarOpen && "mr-2.5",
                        hasActiveChild
                          ? "text-teal stroke-[2.5]"
                          : "text-teal-300 group-hover:text-teal"
                      )} />
                      {isSidebarOpen && (
                        <span className="truncate whitespace-nowrap text-xs sm:text-sm font-bold">
                          {cat.title}
                        </span>
                      )}
                    </div>

                    {/* Collapsed Indicator dot for mini-mode */}
                    {!isSidebarOpen && hasActiveChild && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal ring-2 ring-navy" />
                    )}

                    {/* Right-side controls (chevron & badge) when expanded */}
                    {isSidebarOpen && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {cat.badge && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] font-black rounded-md",
                            hasActiveChild
                              ? "bg-teal text-navy font-bold"
                              : "bg-white/10 text-teal-300 border border-teal-400/20"
                          )}>
                            {cat.badge}
                          </span>
                        )}
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-white/60 hover:text-white"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      </div>
                    )}
                  </button>

                  {/* Dropdown Child Items (Animated Accordion) */}
                  <AnimatePresence initial={false}>
                    {isOpen && isSidebarOpen && (
                      <motion.div
                        key={`content-${cat.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden pl-4 ml-3 border-l-2 border-teal/25 space-y-1 pt-1 pb-1.5"
                      >
                        {cat.items.map((subItem) => {
                          const isSubActive = pathname === subItem.href || (subItem.href !== "/admin/dashboard" && pathname.startsWith(subItem.href))
                          const SubIcon = subItem.icon

                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={() => setIsMobileOpen(false)}
                              target={subItem.href.startsWith("http") ? "_blank" : undefined}
                              rel={subItem.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              className={cn(
                                "flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150",
                                isSubActive
                                  ? "bg-teal text-navy font-black shadow-md shadow-teal/20 border border-teal-300"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <SubIcon className={cn(
                                  "h-3.5 w-3.5 shrink-0 transition-colors",
                                  isSubActive ? "text-navy stroke-[2.8]" : "text-teal-300/80"
                                )} />
                                <span className="truncate whitespace-nowrap">
                                  {subItem.name}
                                </span>
                              </div>

                              {subItem.badge && (
                                <span className={cn(
                                  "px-1.5 py-0.2 text-[9px] font-black rounded shrink-0 font-mono",
                                  isSubActive
                                    ? "bg-navy text-teal"
                                    : "bg-white/15 text-teal-300"
                                )}>
                                  {subItem.badge === "dynamic" ? (productCount ?? "...") : subItem.badge}
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Role & Staff Access Indicator */}
          {isSidebarOpen && (
            <div className="p-2.5 mt-4 rounded-xl flex items-center justify-between border transition-all bg-white/10 border-white/15 text-white">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-teal-300 truncate">
                    {isSuperAdmin ? "Super Admin" : "Active Role"}
                  </p>
                  <p className="text-xs font-black truncate">
                    {roleName || "Staff Member"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-teal text-navy">
                RBAC
              </span>
            </div>
          )}

          {/* Logout Button */}
          <div className="pt-3 border-t border-white/15">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSignOut}
              title={!isSidebarOpen ? "Log out" : undefined}
              className={cn(
                "transition-all duration-200 tracking-tight font-black rounded-xl text-rose-300 hover:bg-rose-500/20 hover:text-rose-100",
                isSidebarOpen 
                  ? "flex items-center w-full px-3.5 py-2 text-sm"
                  : "flex items-center justify-center w-10 h-10 mx-auto"
              )}
            >
              <LogOut className={cn("h-4.5 w-4.5 stroke-[2.4] shrink-0", isSidebarOpen && "mr-3")} />
              <AnimatePresence mode="wait" initial={false}>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="truncate whitespace-nowrap text-xs font-bold"
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
          "active:scale-95 transition-all duration-200 bg-teal text-navy hover:bg-teal-300 shadow-teal/30",
          isMobileOpen && "hidden"
        )}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  )
}
