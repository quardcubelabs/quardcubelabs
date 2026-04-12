"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, ShoppingBag, Package, Mail, User, ChevronRight, Settings, Info, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MobileMenuProps {
  isOpen?: boolean
  onClose?: () => void
}

export function MobileMenu({ isOpen: externalIsOpen, onClose }: MobileMenuProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()

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

  // Navigation items with icons
  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Services", href: "/services", icon: Settings },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
    { name: "Orders", href: "/orders", icon: Package },
    { name: "About", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
  ]

  // Handle scroll lock when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    // Cleanup function to ensure scroll is restored when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
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

  return (
    <div className="lg:hidden">
      {/* Only show menu button if not controlled externally */}
      {externalIsOpen === undefined && (
        <button
          onClick={toggleMenu}
          className="p-2 text-navy hover:text-navy/80 focus:outline-none transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeMenu}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed top-0 right-0 w-3/4 max-w-xs h-[100dvh] bg-white shadow-2xl z-50"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-teal to-teal/90 text-navy border-b border-navy/10">
                  <Link
                    href="/"
                    className="text-xl font-bold text-navy hover:text-navy/80 transition-colors"
                    onClick={closeMenu}
                  >
                    QuardCube Labs
                  </Link>
                  <button
                    onClick={closeMenu}
                    className="p-2 text-navy hover:text-navy/80 focus:outline-none transition-colors duration-200 hover:bg-navy/10 rounded-full"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* User Info Section */}
                {user ? (
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="block p-6 bg-navy/5 border-b border-navy/10 hover:bg-navy/10 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12 border-2 border-navy/20">
                        <AvatarImage src={getAvatarUrl() || ""} alt={user.user_metadata?.name || user.email || "User"} />
                        <AvatarFallback className="bg-navy text-white font-semibold">{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-navy truncate">{user.user_metadata?.name || "User"}</p>
                        <p className="text-sm text-navy/70 truncate">{user.email}</p>
                        <p className="text-xs text-navy/50 mt-1">Tap to view profile</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-navy/40" />
                    </div>
                  </Link>
                ) : (
                  <div className="p-6 bg-navy/5 border-b border-navy/10">
                    <Link
                      href="/auth/login"
                      onClick={closeMenu}
                      className="flex items-center justify-center py-3 px-4 bg-navy text-white rounded-xl hover:bg-navy/90 transition-colors duration-200"
                    >
                      <User className="h-5 w-5 mr-2" />
                      <span className="font-medium">Sign In</span>
                    </Link>
                  </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6">
                  <ul className="space-y-2 px-4">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 group ${
                              isActive 
                                ? "bg-navy text-white shadow-lg" 
                                : "text-navy hover:bg-navy/10 hover:text-navy"
                            }`}
                            onClick={closeMenu}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-navy/70 group-hover:text-navy"}`} />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                              isActive 
                                ? "text-white/70" 
                                : "text-navy/40 group-hover:text-navy/70 group-hover:translate-x-1"
                            }`} />
                          </Link>
                        </li>
                      )
                    })}
                    {/* Admin Link for Admin User */}
                    {user?.email === "framanreubinstein@gmail.com" && (
                      <li className="pt-2">
                        <Link
                          href="/admin/dashboard"
                          className="flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 group text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                          onClick={closeMenu}
                        >
                          <div className="flex items-center space-x-3">
                            <Settings className="h-5 w-5" />
                            <span className="font-medium">Admin Dashboard</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1" />
                        </Link>
                      </li>
                    )}
                    
                    {/* Logout Link */}
                    {user && (
                      <li className="pt-4 mt-4 border-t border-navy/10">
                        <button
                          onClick={() => {
                            signOut()
                            closeMenu()
                          }}
                          className="flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-200 group text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                        >
                          <div className="flex items-center space-x-3">
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Logout</span>
                          </div>
                          <ChevronRight className="h-4 w-4 transition-transform duration-200 text-red-400 group-hover:text-red-600 group-hover:translate-x-1" />
                        </button>
                      </li>
                    )}
                  </ul>
                </nav>

                {/* Footer */}
                <div className="p-6 bg-navy/5 border-t border-navy/10">
                  <div className="text-center">
                    <p className="text-sm text-navy/70">© 2024 QuardCube Labs</p>
                    <p className="text-xs text-navy/50 mt-1">Innovative IT Solutions</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 