"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  Package,
  Mail,
  User,
  ChevronRight,
  Settings,
  Info,
  LogOut,
  Search,
  ShoppingCart,
  Phone,
  MessageCircle,
  Laptop,
  Monitor,
  Gamepad2,
  HardDrive,
  Cpu,
  ShieldCheck,
  MapPin,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Logo from "@/components/logo"
import { Badge } from "@/components/ui/badge"

interface MobileMenuProps {
  isOpen?: boolean
  onClose?: () => void
}

const POPULAR_CATEGORIES = [
  { name: "Laptops", href: "/shop?category=Laptops", icon: Laptop },
  { name: "Desktops", href: "/shop?category=Desktops", icon: Monitor },
  { name: "Gaming", href: "/shop?category=Gaming", icon: Gamepad2 },
  { name: "Storage", href: "/shop?category=Storage", icon: HardDrive },
  { name: "Components", href: "/shop?category=Components", icon: Cpu },
]

export function MobileMenu({ isOpen: externalIsOpen, onClose }: MobileMenuProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { getCartItemsCount, openCart } = useCart()
  const cartCount = getCartItemsCount()

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = onClose ? onClose : setInternalIsOpen

  // Get user initials for fallback
  const getInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }
    return user?.email?.substring(0, 2).toUpperCase() || "U"
  }

  // Get user avatar URL
  const getAvatarUrl = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url
    }
    return null
  }

  // Navigation items with icons and descriptive subtitles
  const navigationItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      description: "Welcome to QuardCube Hub",
    },
    {
      name: "Services",
      href: "/services",
      icon: Settings,
      description: "AI, Custom Software & Enterprise IT",
    },
    {
      name: "Shop",
      href: "/shop",
      icon: ShoppingBag,
      description: "Computers, Hardware & Technology Gear",
      hasBadge: true,
    },
    {
      name: "Orders",
      href: "/orders",
      icon: Package,
      description: "Track Orders, Invoices & History",
    },
    {
      name: "About",
      href: "/about",
      icon: Info,
      description: "Our Team, Vision & Infrastructure",
    },
    {
      name: "Contact",
      href: "/contact",
      icon: Mail,
      description: "Get Support, Inquiries & Dar es Salaam Office",
    },
  ]

  // Handle scroll lock when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const toggleMenu = () => {
    if (externalIsOpen !== undefined && onClose) {
      onClose()
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }

  const closeMenu = () => {
    if (externalIsOpen !== undefined && onClose) {
      onClose()
    } else {
      setInternalIsOpen(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
      closeMenu()
    }
  }

  const handleOpenCart = () => {
    closeMenu()
    openCart()
  }

  return (
    <div className="lg:hidden">
      {/* Menu toggle button for standalone use */}
      {externalIsOpen === undefined && (
        <button
          onClick={toggleMenu}
          className="p-2 text-white hover:text-brand-red focus:outline-hidden transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with dark blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-[#020412]/80 backdrop-blur-md z-[80]"
              onClick={closeMenu}
            />

            {/* Premium Tech Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 w-[86%] max-w-sm h-[100dvh] bg-[#070c27] text-white shadow-2xl z-[90] border-l border-teal/20 flex flex-col overflow-hidden"
            >
              {/* Header with QuardCube Branding */}
              <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0a1138]/90 flex items-center justify-between shrink-0">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 group"
                  onClick={closeMenu}
                >
                  <Logo size="sm" />
                  <div className="flex flex-col">
                    <span
                      className="text-lg tracking-wider text-white font-black leading-tight"
                      style={{ fontFamily: "var(--font-anton)" }}
                    >
                      QUARDCUBE
                    </span>
                    <span className="text-[10px] text-teal font-extrabold tracking-widest uppercase">
                      LABS &amp; SYSTEMS
                    </span>
                  </div>
                </Link>

                <button
                  onClick={closeMenu}
                  className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-teal/40 scrollbar-track-transparent">
                
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search computers, gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 text-xs font-medium rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/40 focus:outline-hidden focus:border-teal focus:ring-1 focus:ring-teal focus:bg-white/10 transition-all"
                  />
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal/80" />
                </form>

                {/* Quick Utility Strip: Cart & Account Status */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCart}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal/20 text-teal flex items-center justify-center">
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold">Cart</span>
                    </div>
                    {cartCount > 0 ? (
                      <Badge className="bg-brand-red text-white text-[10px] h-5 px-1.5 font-black">
                        {cartCount}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-white/50">0</span>
                    )}
                  </button>

                  <Link
                    href={user ? "/orders" : "/auth/login"}
                    onClick={closeMenu}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-full bg-brand-red/20 text-brand-red flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold truncate">
                        {user ? "Orders" : "Sign In"}
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-white/40 shrink-0" />
                  </Link>
                </div>

                {/* Main Navigation Links */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal/80 px-2 block mb-2">
                    Menu Navigation
                  </span>
                  <ul className="space-y-1.5">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={closeMenu}
                            className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group border ${
                              isActive
                                ? "bg-gradient-to-r from-teal/25 via-teal/15 to-transparent border-teal/40 text-teal shadow-md"
                                : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-white hover:text-teal"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                  isActive
                                    ? "bg-teal text-navy shadow-xs"
                                    : "bg-white/10 text-white/90 group-hover:bg-teal group-hover:text-navy"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-sm tracking-tight leading-tight">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-white/50 truncate font-normal leading-tight mt-0.5">
                                  {item.description}
                                </span>
                              </div>
                            </div>

                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                isActive
                                  ? "text-teal"
                                  : "text-white/30 group-hover:text-teal group-hover:translate-x-1"
                              }`}
                            />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Popular Shop Categories Quick Access */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal/80 px-2 block mb-2">
                    Explore Categories
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {POPULAR_CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon
                      return (
                        <Link
                          key={cat.name}
                          href={cat.href}
                          onClick={closeMenu}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-white/5 text-xs font-semibold text-white/90 hover:text-white transition-colors"
                        >
                          <CatIcon className="h-3.5 w-3.5 text-teal shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* User Info / Profile Card */}
                <div className="pt-2">
                  {user ? (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10 border-2 border-teal/40">
                          <AvatarImage src={getAvatarUrl() || ""} alt={user.user_metadata?.name || user.email || "User"} />
                          <AvatarFallback className="bg-teal text-navy font-black text-xs">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-white truncate">
                            {user.user_metadata?.name || "Client Member"}
                          </p>
                          <p className="text-[11px] text-white/60 truncate">{user.email}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-3 w-3 text-teal" />
                            <span className="text-[10px] text-teal font-semibold">Active Account</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Link
                          href="/profile"
                          onClick={closeMenu}
                          className="flex-1 py-1.5 px-3 text-center rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white transition-colors"
                        >
                          My Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            signOut()
                            closeMenu()
                          }}
                          className="py-1.5 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                        >
                          <LogOut className="h-3 w-3" />
                          <span>Exit</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal/15 via-white/5 to-transparent border border-teal/20 text-center">
                      <h4 className="text-xs font-extrabold text-white mb-1">
                        Access Your Account
                      </h4>
                      <p className="text-[11px] text-white/60 mb-3">
                        Track orders, manage quotations and save wishlist items.
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href="/auth/login"
                          onClick={closeMenu}
                          className="flex-1 py-2 rounded-xl bg-teal text-navy font-black text-xs hover:bg-teal/90 transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={closeMenu}
                          className="flex-1 py-2 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-colors border border-white/15"
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Round Contact Icons (Requirement 03: all backgrounds of icons round) */}
                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal/80 px-2 block mb-2">
                    Quick Connect
                  </span>
                  <div className="flex items-center justify-around p-2.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <a
                      href="https://wa.me/255623893383?text=Hello%20QuardCubeLabs%2C%20I%20would%20like%20to%20inquire%20about%20your%20services"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all duration-200"
                      title="WhatsApp Us"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>

                    <a
                      href="tel:+255623893383"
                      className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all duration-200"
                      title="Call Us"
                      aria-label="Phone Call"
                    >
                      <Phone className="h-4 w-4" />
                    </a>

                    <a
                      href="mailto:info@quardcubelabs.co.tz"
                      className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all duration-200"
                      title="Email Support"
                      aria-label="Email"
                    >
                      <Mail className="h-4 w-4" />
                    </a>

                    <Link
                      href="/contact"
                      onClick={closeMenu}
                      className="w-10 h-10 rounded-full bg-teal/20 text-teal hover:bg-teal hover:text-navy flex items-center justify-center transition-all duration-200"
                      title="Visit Office"
                      aria-label="Office Location"
                    >
                      <MapPin className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

              </div>

              {/* Drawer Footer with Updated Year */}
              <div className="p-4 border-t border-white/10 bg-[#050920] text-center shrink-0">
                <p className="text-xs font-bold text-white/90">
                  © {new Date().getFullYear()} QuardCube Labs
                </p>
                <p className="text-[10px] text-teal font-medium mt-0.5">
                  Dar es Salaam, Tanzania • Empowering Digital Innovation
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
