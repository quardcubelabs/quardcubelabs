"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ChevronDown, Search, Heart, User, LogOut, Settings, Package } from "lucide-react"
import Logo from "@/components/logo"
import { useAuth } from "@/contexts/auth-context"
import { useWishlist } from "@/contexts/wishlist-context"
import CartButton from "@/components/cart-button"
import { MobileMenu } from "@/components/mobile-menu"
import AccountModal from "@/components/account-modal"

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
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, signOut, isLoading } = useAuth()
  const { totalCount: wishlistCount, openWishlist } = useWishlist()
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
        className={`fixed top-0 left-0 right-0 z-50 bg-navy transition-all duration-300 ${isScrolled ? "shadow-lg py-2" : "py-2 sm:py-2.5"
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
                className={`transition-colors hover:text-brand-red ${pathname === "/services" ? "text-brand-red" : "text-white"
                  }`}
              >
                Services
              </Link>

              <div className="relative group">
                <Link
                  href="/shop"
                  className={`inline-flex items-center gap-1 transition-colors hover:text-brand-red ${pathname === "/shop" ? "text-brand-red" : "text-white"
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
                className={`transition-colors hover:text-brand-red ${pathname === "/orders" ? "text-brand-red" : "text-white"
                  }`}
              >
                Orders
              </Link>

              <Link
                href="/about"
                className={`transition-colors hover:text-brand-red ${pathname === "/about" ? "text-brand-red" : "text-white"
                  }`}
              >
                About
              </Link>

              <Link
                href="/contact"
                className={`transition-colors hover:text-brand-red ${pathname === "/contact" ? "text-brand-red" : "text-white"
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

            {/* Right Side Ecommerce Actions: Wishlist -> Cart -> Account (farthest right) */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 xl:gap-4 shrink-0">

              {/* Wishlist Heart Icon */}
              <button
                type="button"
                onClick={openWishlist}
                aria-label="Wishlist"
                className="relative flex items-center justify-center text-white hover:text-brand-red transition-colors p-1 cursor-pointer"
                title={`Wishlist (${wishlistCount})`}
              >
                <Heart
                  className={`h-5 w-5 stroke-[1.8] transition-colors ${
                    wishlistCount > 0 ? "fill-brand-red text-brand-red" : ""
                  }`}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button */}
              <CartButton />

              {/* Account / Login Trigger (Last on the right) */}
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity focus:outline-hidden text-white py-1 px-2 rounded-lg hover:bg-white/10 cursor-pointer"
                title="My Account"
                aria-label="Open Account Modal"
              >
                <div className="flex items-center justify-center text-white">
                  <User className="h-5 w-5 stroke-[1.8]" />
                </div>
                <div className="hidden sm:block leading-tight text-left">
                  <span className="text-[11px] font-extrabold text-white uppercase block tracking-wider">
                    ACCOUNT
                  </span>
                  <span className="text-[10px] text-white/70 font-medium block truncate max-w-[85px]">
                    {user ? (user.user_metadata?.name?.split(" ")[0] || "My Profile") : "Hello, Login"}
                  </span>
                </div>
              </button>

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
        </div>
      </header>

      {/* Account Modal with Sidebar, Profile, Orders, Addresses & Security */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  )
}
