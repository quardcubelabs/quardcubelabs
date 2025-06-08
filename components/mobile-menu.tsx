"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

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
        className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
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
              className="fixed top-0 right-0 w-3/4 max-w-xs h-[100dvh] bg-white z-50"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <Link
                    href="/"
                    className="text-xl font-bold text-gray-900"
                    onClick={closeMenu}
                  >
                    QuardCube
                  </Link>
                  <button
                    onClick={closeMenu}
                    className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-4">
                    <li>
                      <Link
                        href="/"
                        className={`block py-2 text-lg ${
                          pathname === "/" ? "text-blue-600" : "text-gray-600"
                        }`}
                        onClick={closeMenu}
                      >
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/shop"
                        className={`block py-2 text-lg ${
                          pathname === "/shop" ? "text-blue-600" : "text-gray-600"
                        }`}
                        onClick={closeMenu}
                      >
                        Shop
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/orders"
                        className={`block py-2 text-lg ${
                          pathname === "/orders" ? "text-blue-600" : "text-gray-600"
                        }`}
                        onClick={closeMenu}
                      >
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        className={`block py-2 text-lg ${
                          pathname === "/contact" ? "text-blue-600" : "text-gray-600"
                        }`}
                        onClick={closeMenu}
                      >
                        Contact
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 