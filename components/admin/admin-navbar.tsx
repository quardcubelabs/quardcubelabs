"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminSignOut } from "@/lib/admin-auth"
import { universalSearch } from "@/lib/search-actions"
import type { SearchResultItem } from "@/lib/erp/types"
import { cn } from "@/lib/utils"
import { 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings,
  Maximize2,
  Moon,
  Sun,
  FileText,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Building2,
  DollarSign,
  Loader2,
  ChevronRight,
  CheckCheck,
  Inbox
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAdmin } from "@/contexts/admin-context"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getRealAdminNotifications, type AdminNotification } from "@/lib/notification-actions"

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { user, roleName, isSuperAdmin, isRouteAllowed } = useAdmin()
  const { isDark, toggleTheme } = useAdminTheme()
  const { isSidebarOpen, toggleSidebar, toggleMobileOpen } = useAdminSidebar()

  // Real Notification module state with persistent read/dismiss tracking
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "orders" | "inventory" | "finance">("all")
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    try {
      const realNotifs = await getRealAdminNotifications()
      let readIds: string[] = []
      let dismissedIds: string[] = []
      try {
        readIds = JSON.parse(localStorage.getItem("admin_read_notification_ids") || "[]")
        dismissedIds = JSON.parse(localStorage.getItem("admin_dismissed_notification_ids") || "[]")
      } catch {}

      const merged = realNotifs
        .filter(n => !dismissedIds.includes(n.id))
        .map(n => ({
          ...n,
          read: readIds.includes(n.id)
        }))

      setNotifications(merged)
    } catch (err) {
      console.error("Failed to load real notifications:", err)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    // Periodic background sync every 60 seconds
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllAsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      try {
        const readIds = new Set<string>(JSON.parse(localStorage.getItem("admin_read_notification_ids") || "[]"))
        prev.forEach(n => readIds.add(n.id))
        localStorage.setItem("admin_read_notification_ids", JSON.stringify(Array.from(readIds)))
      } catch {}
      return next
    })
  }

  const markOneAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      try {
        const readIds = new Set<string>(JSON.parse(localStorage.getItem("admin_read_notification_ids") || "[]"))
        readIds.add(id)
        localStorage.setItem("admin_read_notification_ids", JSON.stringify(Array.from(readIds)))
      } catch {}
      return next
    })
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id)
      try {
        const dismissed = new Set<string>(JSON.parse(localStorage.getItem("admin_dismissed_notification_ids") || "[]"))
        dismissed.add(id)
        localStorage.setItem("admin_dismissed_notification_ids", JSON.stringify(Array.from(dismissed)))
      } catch {}
      return next
    })
  }

  const clearAllNotifications = () => {
    try {
      const dismissed = new Set<string>(JSON.parse(localStorage.getItem("admin_dismissed_notification_ids") || "[]"))
      notifications.forEach(n => dismissed.add(n.id))
      localStorage.setItem("admin_dismissed_notification_ids", JSON.stringify(Array.from(dismissed)))
    } catch {}
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(n => {
    if (notificationFilter === "unread") return !n.read
    if (notificationFilter === "orders") return n.category === "orders"
    if (notificationFilter === "inventory") return n.category === "inventory"
    if (notificationFilter === "finance") return n.category === "finance"
    return true
  })

  useEffect(() => {
    if (isNotifOpen) {
      loadNotifications()
    }
  }, [isNotifOpen, loadNotifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(async () => {
      try {
        const results = await universalSearch(searchQuery.trim())
        const allowedResults = isSuperAdmin
          ? results
          : results.filter((item) => !item.url || isRouteAllowed(item.url))
        setSearchResults(allowedResults)
        setShowSearchDropdown(true)
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const email = user?.email || ""
  const displayEmailName = email 
    ? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "QuardCube Admin"
  
  const avatarUrl = email
    ? `https://unavatar.io/${encodeURIComponent(email)}?fallback=${encodeURIComponent(`https://ui-avatars.com/api/?name=${encodeURIComponent(displayEmailName)}&background=0D9488&color=ffffff&bold=true`)}`
    : "/turquoise.png"

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
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className={cn(
      "fixed top-0 right-0 left-0 h-16 z-40 transition-all duration-300 ease-in-out",
      isSidebarOpen ? "lg:left-64" : "lg:left-20",
      "bg-navy border-none text-white shadow-none"
    )}>
      <div className="px-3 sm:px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left section: Menu Icon (sized to searchbar height) and Search Bar */}
          <div className="flex items-center flex-1 max-w-lg">
            {/* Menu button matching searchbar height */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                    toggleSidebar()
                  } else {
                    toggleMobileOpen()
                  }
                }}
                className="h-10 w-10 rounded-xl transition-colors duration-200 mr-2 sm:mr-3 flex-shrink-0 flex items-center justify-center border bg-white/10 border-white/15 text-white hover:text-teal hover:bg-white/20"
                title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5 stroke-[2.4]" />
              </Button>
            </motion.div>

            {/* Mobile: Logo/Brand */}
            <div className="lg:hidden flex items-center gap-2 mr-3 sm:mr-4 flex-shrink-0">
              <div className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1 ring-1 ring-teal/40">
                <Image
                  src="/footer-logo.png"
                  alt="QuardCube Labs"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-base font-bold text-white hidden xs:inline" style={{ fontFamily: 'var(--font-anton)' }}>
                QUARDCUBE
              </span>
            </div>

            {/* Search Bar */}
            <div ref={searchContainerRef} className="hidden sm:flex items-center flex-1 relative">
              <div className="relative w-full">
                {isSearching ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
                )}
                <Input
                  type="text"
                  placeholder="Search invoices, POs, items, suppliers, expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true)
                  }}
                  className={cn(
                    "pl-10 pr-8 h-9 sm:h-10 w-full rounded-xl transition-all text-sm font-medium",
                    isDark
                      ? "bg-[#060640] text-white placeholder:text-white/60 border border-white/15 hover:border-teal focus:border-teal focus:ring-1 focus:ring-teal"
                      : "bg-white text-navy placeholder:text-navy/50 border border-teal hover:border-teal-600 focus:bg-white focus:ring-1 focus:ring-teal focus:border-teal shadow-sm"
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSearchResults([])
                      setShowSearchDropdown(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Universal Search Results Popover */}
              <AnimatePresence>
                {showSearchDropdown && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute left-0 right-0 top-12 z-50 rounded-2xl shadow-2xl overflow-hidden border max-h-96 overflow-y-auto",
                      isDark
                        ? "bg-[#0a1033] border-navy-700/80 divide-y divide-navy-800/60"
                        : "bg-white border-slate-200 divide-y divide-slate-100"
                    )}
                  >
                    <div className="px-4 py-2 bg-navy-900/50 flex items-center justify-between text-xs text-navy-400 font-semibold uppercase tracking-wider">
                      <span>Found {searchResults.length} Match{searchResults.length !== 1 ? 'es' : ''}</span>
                      <span className="text-[10px] text-teal-400 lowercase">click to navigate</span>
                    </div>

                    <div className="p-2 space-y-1">
                      {searchResults.map((item) => (
                        <Link
                          key={`${item.type}-${item.id}`}
                          href={item.url}
                          onClick={() => setShowSearchDropdown(false)}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors group",
                            isDark
                              ? "hover:bg-navy-800/80 text-white"
                              : "hover:bg-slate-100 text-slate-900"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-teal/10 text-teal shrink-0">
                              {item.type === 'invoice' || item.type === 'quotation' || item.type === 'proforma' ? (
                                <FileText className="h-4 w-4" />
                              ) : item.type === 'receipt' ? (
                                <Receipt className="h-4 w-4" />
                              ) : item.type === 'purchase_order' ? (
                                <ShoppingCart className="h-4 w-4" />
                              ) : item.type === 'product' ? (
                                <Package className="h-4 w-4" />
                              ) : item.type === 'supplier' ? (
                                <Building2 className="h-4 w-4" />
                              ) : item.type === 'customer' ? (
                                <Users className="h-4 w-4" />
                              ) : (
                                <DollarSign className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate group-hover:text-teal transition-colors">
                                {item.title}
                              </div>
                              <div className="text-xs text-slate-400 truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy-800 text-teal-300 border border-teal-500/20">
                              {(item.type || item.category || 'item').replace('_', ' ')}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Toggle */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-colors duration-200 text-white hover:text-teal hover:bg-white/10"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-5 w-5 text-teal-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            {/* Notifications Module */}
            <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
              <PopoverTrigger asChild>
                <motion.div
                  whileHover={{ rotate: [-6, 6, -6, 6, 0] }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                >
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-9 w-9 sm:h-10 sm:w-10 rounded-full relative transition-colors duration-200 text-white hover:text-teal hover:bg-white/10",
                      isNotifOpen && "bg-white/20 text-teal"
                    )}
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-red text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-navy shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </motion.div>
              </PopoverTrigger>

              <PopoverContent 
                align="end" 
                className={cn(
                  "w-[340px] sm:w-[400px] p-0 rounded-2xl shadow-2xl border-2 overflow-hidden z-50",
                  isDark 
                    ? "bg-[#0a1033] border-teal/30 text-white" 
                    : "bg-white border-navy/20 text-navy"
                )}
              >
                {/* Header */}
                <div className={cn(
                  "p-3.5 sm:p-4 border-b flex items-center justify-between",
                  isDark ? "bg-[#080d2a] border-slate-800" : "bg-teal text-navy border-teal-300"
                )}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border",
                      isDark ? "bg-navy text-teal border-teal/40" : "bg-navy text-white border-navy"
                    )}>
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black tracking-tight flex items-center gap-1.5">
                        Notifications
                        {unreadCount > 0 && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                            isDark ? "bg-teal/20 text-teal" : "bg-navy text-white"
                          )}>
                            {unreadCount} new
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className={cn(
                          "text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1",
                          isDark ? "hover:bg-teal/20 text-teal-300" : "hover:bg-navy/10 text-navy"
                        )}
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mark read</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className={cn(
                          "text-[11px] font-bold px-2 py-1 rounded-lg transition-colors",
                          isDark ? "hover:bg-rose-500/20 text-rose-400" : "hover:bg-rose-50 text-brand-red"
                        )}
                        title="Clear all notifications"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className={cn(
                  "flex items-center gap-1 px-3 py-2 border-b text-[11px] font-bold overflow-x-auto",
                  isDark ? "bg-[#060a22] border-slate-800 text-slate-400" : "bg-slate-50 border-navy/10 text-navy/70"
                )}>
                  {[
                    { id: "all", label: "All" },
                    { id: "unread", label: `Unread (${unreadCount})` },
                    { id: "orders", label: "Orders" },
                    { id: "inventory", label: "Stock" },
                    { id: "finance", label: "Finance" },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setNotificationFilter(tab.id as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg transition-all whitespace-nowrap",
                        notificationFilter === tab.id
                          ? isDark 
                            ? "bg-teal text-navy font-black shadow-xs" 
                            : "bg-navy text-white font-black shadow-xs"
                          : isDark
                            ? "hover:text-white hover:bg-slate-800"
                            : "hover:text-navy hover:bg-slate-200"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Notification List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNotifications.length === 0 ? (
                    <div className="py-10 text-center px-4">
                      <Inbox className={cn("w-8 h-8 mx-auto mb-2 opacity-40", isDark ? "text-teal" : "text-navy")} />
                      <p className={cn("text-xs font-bold", isDark ? "text-slate-300" : "text-navy")}>
                        No notifications found
                      </p>
                      <p className={cn("text-[11px] mt-0.5", isDark ? "text-slate-500" : "text-slate-400")}>
                        You are completely up to date.
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map(n => {
                      const getIcon = () => {
                        if (n.category === "orders") return ShoppingCart
                        if (n.category === "inventory") return Package
                        if (n.category === "finance") return DollarSign
                        return Building2
                      }
                      const Icon = getIcon()

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            markOneAsRead(n.id)
                            setIsNotifOpen(false)
                            router.push(n.url)
                          }}
                          className={cn(
                            "p-3 sm:p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group",
                            !n.read 
                              ? isDark ? "bg-teal/10 hover:bg-teal/20" : "bg-teal/10 hover:bg-teal/20" 
                              : isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-0.5",
                            n.category === "orders" 
                              ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                              : n.category === "inventory"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : n.category === "finance"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-teal/15 text-teal border-teal/30"
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className={cn("text-xs font-black truncate", isDark ? "text-white" : "text-navy")}>
                                {n.title}
                              </p>
                              <span className={cn("text-[10px] shrink-0 font-medium", isDark ? "text-slate-400" : "text-slate-500")}>
                                {n.time}
                              </span>
                            </div>
                            <p className={cn("text-[11px] leading-snug line-clamp-2", isDark ? "text-slate-300" : "text-navy/70")}>
                              {n.message}
                            </p>
                          </div>

                          <button
                            onClick={(e) => deleteNotification(n.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md absolute right-2 top-2 text-slate-400 hover:text-rose-500"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-teal shrink-0 absolute right-3 top-1/2 -translate-y-1/2 group-hover:hidden" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className={cn(
                  "p-2.5 px-4 border-t flex items-center justify-between text-[11px] font-bold",
                  isDark ? "bg-[#080d2a] border-slate-800 text-teal" : "bg-slate-50 border-navy/10 text-navy"
                )}>
                  <Link
                    href="/admin/analytics"
                    onClick={() => setIsNotifOpen(false)}
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>View Analytics & System Logs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[10px] opacity-60">Real-time Telemetry</span>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full transition-colors duration-200 hover:bg-white/10"
                >
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-teal-400 bg-white/10 shrink-0">
                    <img
                      src={avatarUrl}
                      alt={email || "Admin"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayEmailName)}&background=0A2540&color=00D4B2&bold=true`
                      }}
                    />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-bold text-white truncate max-w-[130px]">{displayEmailName}</p>
                    <p className="text-[11px] text-teal font-medium truncate max-w-[130px]">{roleName || email || "Administrator"}</p>
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-navy dark:text-white truncate">{displayEmailName}</p>
                      <span className="text-[10px] uppercase font-black bg-teal/20 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded shrink-0">
                        {roleName || "Staff"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{email || "admin@quardcubelabs.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isRouteAllowed("/admin/settings") && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/" target="_blank" className="cursor-pointer">
                    View Site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100")}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="space-y-2">
              <Link href="/" target="_blank" className="block">
                <Button variant="outline" size="sm" className={cn(
                  "w-full justify-start",
                  isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-200 text-navy hover:bg-gray-100"
                )}>
                  View Site
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
