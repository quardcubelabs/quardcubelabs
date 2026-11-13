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
            {/* Backdrop with dark navy blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[80]"
              onClick={closeMenu}
            />

            {/* Clean White Sidebar with Navy Icons Theme */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 w-[86%] max-w-sm h-[100dvh] bg-white text-navy shadow-2xl z-[90] border-l-2 border-navy/15 flex flex-col overflow-hidden"
            >
              {/* Header with QuardCube Branding */}
              <div className="p-4 sm:p-5 border-b-2 border-navy/10 bg-white flex items-center justify-between shrink-0">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 group"
                  onClick={closeMenu}
                >
                  <Logo size="sm" />
                  <div className="flex flex-col">
                    <span
                      className="text-lg tracking-wider text-navy font-black leading-tight"
                      style={{ fontFamily: "var(--font-anton)" }}
                    >
                      QUARDCUBE
                    </span>
                    <span className="text-[10px] text-brand-red font-extrabold tracking-widest uppercase">
                      LABS &amp; SYSTEMS
                    </span>
                  </div>
                </Link>

                <button
                  onClick={closeMenu}
                  className="h-9 w-9 rounded-full bg-navy text-white hover:bg-brand-red flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Container with White Background */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-navy/30 scrollbar-track-transparent bg-white">
                
                {/* Search Bar with Navy Icon */}
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search computers, gear..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 text-xs font-semibold rounded-full bg-navy/5 border-2 border-navy/20 text-navy placeholder:text-navy/50 focus:outline-hidden focus:border-navy focus:bg-white transition-all"
                  />
                  <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 shadow-xs">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                </form>

                {/* Quick Utility Strip: Cart & Account Status with Round Navy Icons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenCart}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-navy/5 hover:bg-navy/10 border-2 border-navy/10 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center shadow-xs group-hover:bg-brand-red transition-colors">
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-navy">Cart</span>
                    </div>
                    {cartCount > 0 ? (
                      <Badge className="bg-brand-red text-white text-[10px] h-5 px-1.5 font-black">
                        {cartCount}
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-bold text-navy/40">0</span>
                    )}
                  </button>

                  <Link
                    href={user ? "/orders" : "/auth/login"}
                    onClick={closeMenu}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-navy/5 hover:bg-navy/10 border-2 border-navy/10 transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-brand-red transition-colors">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-navy truncate">
                        {user ? "Orders" : "Sign In"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-navy/40 shrink-0 group-hover:text-navy group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>

                {/* Main Navigation Links with Round Navy Icons */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-navy/60 px-2 block mb-2">
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
                            className={`flex items-center justify-between p-2.5 rounded-2xl transition-all duration-200 group border-2 ${
                              isActive
                                ? "bg-teal/25 border-navy text-navy shadow-sm font-bold"
                                : "bg-white hover:bg-navy/5 border-navy/10 text-navy hover:border-navy/30"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all shadow-xs ${
                                  isActive
                                    ? "bg-navy text-teal ring-2 ring-teal"
                                    : "bg-navy text-white group-hover:bg-brand-red group-hover:text-white"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold text-sm tracking-tight leading-tight text-navy">
                                  {item.name}
                                </span>
                                <span className="text-[11px] text-navy/60 truncate font-normal leading-tight mt-0.5">
                                  {item.description}
                                </span>
                              </div>
                            </div>

                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                isActive
                                  ? "text-navy"
                                  : "text-navy/30 group-hover:text-navy group-hover:translate-x-1"
                              }`}
                            />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Popular Shop Categories Quick Access with Round Navy Icons */}
                <div className="pt-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-navy/60 px-2 block mb-2">
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
                          className="flex items-center gap-2 p-2 rounded-xl bg-navy/5 hover:bg-teal/20 border border-navy/10 text-xs font-bold text-navy transition-colors group"
                        >
                          <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center shrink-0 group-hover:bg-brand-red transition-colors shadow-xs">
                            <CatIcon className="h-3 w-3" />
                          </div>
                          <span className="truncate">{cat.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* User Info / Profile Card with Light Theme */}
                <div className="pt-2">
                  {user ? (
                    <div className="p-3.5 rounded-2xl bg-navy/5 border-2 border-navy/15 text-navy">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10 border-2 border-navy">
                          <AvatarImage src={getAvatarUrl() || ""} alt={user.user_metadata?.name || user.email || "User"} />
                          <AvatarFallback className="bg-navy text-white font-black text-xs">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-navy truncate">
                            {user.user_metadata?.name || "Client Member"}
                          </p>
                          <p className="text-[11px] text-navy/70 truncate">{user.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-navy text-white flex items-center justify-center">
                              <ShieldCheck className="h-2.5 w-2.5 text-teal" />
                            </div>
                            <span className="text-[10px] text-navy font-bold">Active Member</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-navy/10">
                        <Link
                          href="/profile"
                          onClick={closeMenu}
                          className="flex-1 py-1.5 px-3 text-center rounded-xl bg-navy text-white hover:bg-navy/90 text-[11px] font-bold transition-colors shadow-xs"
                        >
                          My Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            signOut()
                            closeMenu()
                          }}
                          className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[11px] font-bold text-brand-red border border-brand-red/30 flex items-center gap-1.5 transition-colors"
                        >
                          <div className="w-4 h-4 rounded-full bg-brand-red text-white flex items-center justify-center">
                            <LogOut className="h-2.5 w-2.5" />
                          </div>
                          <span>Exit</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-teal/15 border-2 border-navy/15 text-navy text-center">
                      <h4 className="text-xs font-black text-navy uppercase tracking-wider mb-1">
                        Access Your Account
                      </h4>
                      <p className="text-[11px] text-navy/70 mb-3">
                        Track orders, manage quotations and save wishlist items.
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href="/auth/login"
                          onClick={closeMenu}
                          className="flex-1 py-2 rounded-xl bg-navy text-white font-extrabold text-xs hover:bg-brand-red transition-colors shadow-sm"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/register"
                          onClick={closeMenu}
                          className="flex-1 py-2 rounded-xl bg-white text-navy font-bold text-xs hover:bg-navy hover:text-white transition-colors border-2 border-navy/20"
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Round Contact Icons (Navy Backgrounds & Round Shapes) */}
                <div className="pt-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-navy/60 px-2 block mb-2">
                    Quick Connect
                  </span>
                  <div className="flex items-center justify-around p-3 rounded-2xl bg-navy/5 border-2 border-navy/10">
                    <a
                      href="https://wa.me/255623893383?text=Hello%20QuardCubeLabs%2C%20I%20would%20like%20to%20inquire%20about%20your%20services"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full bg-navy text-white hover:bg-brand-red flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                      title="WhatsApp Us"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>

                    <a
                      href="tel:+255623893383"
                      className="w-11 h-11 rounded-full bg-navy text-white hover:bg-brand-red flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                      title="Call Us"
                      aria-label="Phone Call"
                    >
                      <Phone className="h-5 w-5" />
                    </a>

                    <a
                      href="mailto:info@quardcubelabs.co.tz"
                      className="w-11 h-11 rounded-full bg-navy text-white hover:bg-brand-red flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                      title="Email Support"
                      aria-label="Email"
                    >
                      <Mail className="h-5 w-5" />
                    </a>

                    <Link
                      href="/contact"
                      onClick={closeMenu}
                      className="w-11 h-11 rounded-full bg-navy text-white hover:bg-brand-red flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                      title="Visit Office"
                      aria-label="Office Location"
                    >
                      <MapPin className="h-5 w-5" />
                    </Link>
                  </div>
                </div>

              </div>

              {/* Drawer Footer with White/Light Theme and Dynamic Year */}
              <div className="p-4 border-t-2 border-navy/10 bg-navy/5 text-center shrink-0">
                <p className="text-xs font-bold text-navy">
                  © {new Date().getFullYear()} QuardCube Labs
                </p>
                <p className="text-[10px] text-navy/70 font-semibold mt-0.5">
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
