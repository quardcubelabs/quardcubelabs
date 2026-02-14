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
      "fixed top-0 left-0 lg:left-64 right-0 h-16 z-40 transition-all duration-300",
      isDark ? "bg-[#1a1a2e]" : "bg-gray-100"
    )}>
      <div className="px-3 sm:px-6 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Mobile: Logo/Brand */}
          <div className="lg:hidden flex items-center">
            <span className={cn("text-lg font-bold", isDark ? "text-white" : "text-navy")}>QuardCube</span>
          </div>

          {/* Search Bar - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search product"
                className={cn(
                  "pl-10 pr-4 h-9 sm:h-10 w-full border-0 rounded-xl transition-all",
                  isDark
                    ? "bg-white/10 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-400 focus:bg-white/20"
                    : "bg-gray-100 text-navy placeholder:text-gray-400 focus:ring-2 focus:ring-navy/30 focus:bg-gray-50"
                )}
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile Search Button */}
            <Button variant="ghost" size="icon" className={cn("sm:hidden h-9 w-9 rounded-xl", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
              <Search className={cn("h-5 w-5", isDark ? "text-gray-300" : "text-gray-500")} />
            </Button>

            {/* Collapse Button - Hidden on mobile */}
            <Button variant="ghost" size="icon" className={cn("hidden md:flex h-9 w-9 sm:h-10 sm:w-10 rounded-xl", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
              <Maximize2 className={cn("h-5 w-5", isDark ? "text-gray-300" : "text-gray-500")} />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={cn("hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 rounded-xl", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-navy" />
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className={cn("h-9 w-9 sm:h-10 sm:w-10 rounded-xl relative", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
              <Bell className={cn("h-5 w-5", isDark ? "text-gray-300" : "text-gray-500")} />
              <span className={cn("absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-2 h-2 rounded-full", isDark ? "bg-yellow-400" : "bg-navy")}></span>
            </Button>

            {/* Settings - Hidden on small mobile */}
            <Button variant="ghost" size="icon" className={cn("hidden xs:flex h-9 w-9 sm:h-10 sm:w-10 rounded-xl", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
              <Settings className={cn("h-5 w-5", isDark ? "text-gray-300" : "text-gray-500")} />
            </Button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors",
                  isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                )}>
                  <div className={cn(
                    "relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden ring-2",
                    isDark ? "bg-yellow-400/20 ring-yellow-400/50" : "bg-navy/10 ring-navy/30"
                  )}>
                    <Image
                      src="/turquoise.png"
                      alt="Admin"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className={cn("text-sm font-medium", isDark ? "text-white" : "text-navy")}>QuardCube Admin</p>
                    <p className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Admin</p>
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
