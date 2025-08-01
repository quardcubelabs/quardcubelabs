"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, ShoppingBag, Package, Mail, User, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // Navigation items with icons
  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
    { name: "Orders", href: "/orders", icon: Package },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Profile", href: "/profile", icon: User },
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
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <div className="lg:hidden">
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
                {user && (
                  <div className="p-6 bg-navy/5 border-b border-navy/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-navy">{user.email}</p>
                        <p className="text-sm text-navy/70">Welcome back!</p>
                      </div>
                    </div>
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