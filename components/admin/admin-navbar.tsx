"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminSignOut } from "@/lib/admin-auth"
import { 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings,
  Maximize2,
  Moon,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
    <nav className="fixed top-0 left-64 right-0 bg-white border-b border-gray-100 z-40">
      <div className="px-6">
        <div className="flex justify-between items-center h-16">
          {/* Search Bar */}
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search product"
                className="pl-10 pr-4 h-10 w-full bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            {/* Collapse Button */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100">
              <Maximize2 className="h-5 w-5 text-gray-500" />
            </Button>

            {/* Dark Mode Toggle */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100">
              <Moon className="h-5 w-5 text-gray-500" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100 relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full"></span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-500" />
            </Button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 ml-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-orange-100">
                    <Image
                      src="/turquoise.png"
                      alt="Admin"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">QuardCube Admin</p>
                    <p className="text-xs text-gray-500">Admin</p>
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link href="/" target="_blank" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  View Site
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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
