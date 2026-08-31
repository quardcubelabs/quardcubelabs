"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminSignOut } from "@/lib/admin-auth"
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
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { useAdminSidebar } from "@/contexts/admin-sidebar-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { isDark, toggleTheme } = useAdminTheme()
  const { isSidebarOpen, toggleSidebar, toggleMobileOpen } = useAdminSidebar()

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
      "fixed top-0 left-0 right-0 h-16 z-40 transition-all duration-300 ease-in-out border-b-2",
      isSidebarOpen ? "lg:left-64" : "lg:left-0",
      isDark 
        ? "bg-[#080d2a] border-teal/20 text-white" 
        : "bg-navy border-navy/40 text-white shadow-md"
    )}>
      <div className="px-3 sm:px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Left section: Menu Icon (3 lines) and Search Bar */}
          <div className="flex items-center flex-1 max-w-lg">
            {/* 3 lines Menu Icon button */}
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
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-xl transition-all duration-200 active:scale-95 mr-2 sm:mr-3 flex-shrink-0",
                isDark 
                  ? "text-teal-300 hover:bg-teal-400/15 hover:text-teal-200" 
                  : "text-white hover:text-teal hover:bg-white/10"
              )}
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5 stroke-[2.4]" />
            </Button>

            {/* Mobile: Logo/Brand */}
            <div className="lg:hidden flex items-center gap-2 mr-3 sm:mr-4 flex-shrink-0">
              <div className="relative w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1 ring-1 ring-teal/40">
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
            <div className="hidden sm:flex items-center flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
                <Input
                  type="text"
                  placeholder="Search anything across dashboard..."
                  className={cn(
                    "pl-10 pr-4 h-9 sm:h-10 w-full rounded-xl transition-all text-sm font-medium border border-teal",
                    isDark
                      ? "bg-[#0c1438] text-white placeholder:text-slate-400 hover:border-teal-400 focus:border-teal focus:ring-1 focus:ring-teal"
                      : "bg-white text-navy placeholder:text-navy/50 hover:border-teal-600 focus:bg-white focus:ring-1 focus:ring-teal focus:border-teal shadow-sm"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-xl transition-all duration-200 active:scale-95",
                isDark 
                  ? "text-teal-300 hover:bg-teal-400/15 hover:text-teal-200" 
                  : "text-white hover:text-brand-red hover:bg-white/10"
              )}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-teal-400" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-xl relative transition-all duration-200 active:scale-95",
                isDark 
                  ? "text-slate-200 hover:bg-teal-400/15 hover:text-teal-200" 
                  : "text-white hover:text-brand-red hover:bg-white/10"
              )}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-2 h-2 rounded-full bg-brand-red ring-2 ring-white/30 animate-pulse"></span>
            </Button>

            {/* View site quick link */}
            <Link href="/" target="_blank" className="hidden sm:inline-flex">
              <Button 
                size="sm" 
                className={cn(
                  "rounded-full text-xs font-bold h-9 px-4 transition-all duration-200 active:scale-95",
                  isDark 
                    ? "border-2 border-teal/40 text-teal-300 bg-transparent hover:bg-teal-400 hover:text-navy hover:border-teal-400 shadow-sm shadow-teal-400/10" 
                    : "bg-brand-red hover:bg-red-700 text-white shadow-md"
                )}
              >
                View Website ↗
              </Button>
            </Link>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all duration-200 active:scale-95",
                  isDark ? "hover:bg-teal-400/15" : "hover:bg-white/10"
                )}>
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2 ring-teal-400 bg-white/10 p-1">
                    <Image
                      src="/turquoise.png"
                      alt="Admin"
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-bold text-white">QuardCube Admin</p>
                    <p className="text-[11px] text-teal font-medium">Administrator</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" target="_blank">
                    View Site
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
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
