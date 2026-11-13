"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ChevronDown, Search, Heart, User, LogOut, Settings, Package } from "lucide-react"
import Logo from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"
import CartButton from "@/components/cart-button"
import { MobileMenu } from "@/components/mobile-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SHOP_CATEGORIES = [
  { name: "All Products", href: "/shop" },
  { name: "Laptops", href: "/shop?category=Laptops" },
  { name: "Desktops", href: "/shop?category=Desktops" },
  { name: "Gaming", href: "/shop?category=Gaming" },
  { name: "Components", href: "/shop?category=Components" },
  { name: "Peripherals", href: "/shop?category=Peripherals" },
  { name: "Storage", href: "/shop?category=Storage" },
  { name: "Networking", href: "/shop?category=Networking" },
  { name: "Gadgets & Accessories", href: "/shop?category=Gadgets%20%26%20Accessories" },
]

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, signOut, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle scroll lock when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = parseInt(document.body.style.top || '0') * -1
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = 'unset'
      window.scrollTo(0, scrollY)
    }
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/shop")
    }
  }

  // Do not render website navbar in admin portal or on admin subdomain
  if (
    pathname?.startsWith("/admin") ||
    (typeof window !== "undefined" && window.location.hostname.startsWith("admin."))
  ) {
    return null
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-navy transition-all duration-300 ${
          isScrolled ? "shadow-lg py-2" : "py-2 sm:py-2.5"
        }`}
      >
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Logo size="md" />
              <span
                className="text-lg sm:text-xl tracking-tight text-white hidden xl:inline"
                style={{ fontFamily: 'var(--font-anton)' }}
              >
                QUARDCUBE
              </span>
            </Link>

            {/* Desktop Navigation Links (Original Website Pages Kept) */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0 text-sm font-bold">
              <Link
                href="/services"
                className={`transition-colors hover:text-brand-red ${
                  pathname === "/services" ? "text-brand-red" : "text-white"
                }`}
              >
                Services
              </Link>

              <div className="relative group">
                <Link
                  href="/shop"
                  className={`inline-flex items-center gap-1 transition-colors hover:text-brand-red ${
                    pathname === "/shop" ? "text-brand-red" : "text-white"
                  }`}
                >
                  Shop
                  <ChevronDown className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-transform group-hover:rotate-180" />
                </Link>
                <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-50">
                  <div className="bg-navy/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl py-2 min-w-[200px]">
                    {SHOP_CATEGORIES.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="block px-4 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href="/orders"
                className={`transition-colors hover:text-brand-red ${
                  pathname === "/orders" ? "text-brand-red" : "text-white"
                }`}
              >
                Orders
              </Link>

              <Link
                href="/about"
                className={`transition-colors hover:text-brand-red ${
                  pathname === "/about" ? "text-brand-red" : "text-white"
                }`}
              >
                About
              </Link>

              <Link
                href="/contact"
                className={`transition-colors hover:text-brand-red ${
                  pathname === "/contact" ? "text-brand-red" : "text-white"
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* Search Bar with E-Commerce Pill Design */}
            <div className="flex-1 max-w-md hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="SEARCH PRODUCTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 lg:h-10 pl-5 pr-10 text-xs tracking-wider uppercase bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-navy placeholder:text-white/60 focus:placeholder:text-slate-400 border border-white/20 focus:border-teal rounded-full focus:outline-hidden focus:ring-1 focus:ring-teal transition-all"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-teal transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right Side Ecommerce Actions */}
            <div className="flex items-center gap-3 sm:gap-4 xl:gap-5 shrink-0">
              
              {/* Currency Selector (TZS) */}
              <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-white/90 hover:text-teal cursor-pointer select-none">
                <span className="flex items-center justify-center w-5 h-5 rounded-full border border-white/30 text-[11px] font-black">
                  $
                </span>
                <span>TZS</span>
                <ChevronDown className="h-3 w-3 text-white/60" />
              </div>

              {/* Account / Login Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity focus:outline-hidden text-white">
                  <div className="flex items-center justify-center text-white">
                    <User className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <div className="hidden sm:block leading-tight text-left">
                    <span className="text-[11px] font-extrabold text-white uppercase block tracking-wider">
                      ACCOUNT
                    </span>
                    <span className="text-[10px] text-white/70 font-medium block truncate max-w-[80px]">
                      {user ? (user.user_metadata?.name?.split(" ")[0] || "My Profile") : "Hello, Login"}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-white rounded-xl shadow-xl border border-navy/10">
                  {user ? (
                    <>
                      <DropdownMenuLabel className="font-bold text-navy text-sm">
                        {user.user_metadata?.name || user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-sm text-navy hover:bg-teal/20">
                        <Link href="/orders" className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-navy/70" />
                          <span>My Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-sm text-navy hover:bg-teal/20">
                        <Link href="/services" className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-navy/70" />
                          <span>Services</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer rounded-lg text-sm text-brand-red hover:bg-red-50 focus:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-sm font-bold text-white bg-navy hover:bg-navy/90 text-center justify-center py-2 mb-1">
                        <Link href="/auth/login">Sign In</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-sm text-navy/80 hover:bg-slate-100 text-center justify-center">
                        <Link href="/auth/register">Create Account</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Wishlist Heart Icon */}
              <Link
                href="/shop"
                aria-label="Wishlist"
                className="hidden sm:flex items-center justify-center text-white hover:text-brand-red transition-colors p-1"
                title="Wishlist"
              >
                <Heart className="h-5 w-5 stroke-[1.8]" />
              </Link>

              {/* Shopping Cart Button */}
              <CartButton />

              {/* Mobile Menu Toggle Button */}
              <div className="lg:hidden flex items-center">
                <button
                  type="button"
                  aria-label="Toggle navigation menu"
                  className="p-1.5 text-white hover:text-brand-red transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>

            </div>

          </div>

          {/* Mobile Search Bar below bar */}
          <div className="mt-2 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-4 pr-9 text-[11px] tracking-wider uppercase bg-white/10 text-white placeholder:text-white/60 border border-white/20 rounded-full focus:bg-white focus:text-navy focus:placeholder:text-slate-400 focus:outline-hidden"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </>
  )
}
