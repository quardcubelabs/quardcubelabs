"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { adminSignOut } from "@/lib/admin-auth"
import { LogOut, Menu, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/turquoise.png"
                  alt="QuardCube Labs"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">QuardCube Labs</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm" className="bg-navy text-white">
                View Site
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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
