"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  FileText,
  Wrench,
  FolderOpen,
  Briefcase,
  PenTool,
  UserCheck,
  Receipt,
  Store,
  Tag,
  Plug,
  MessageSquare,
  HelpCircle,
  LogOut,
  TrendingUp,
  Bell,
} from "lucide-react"
import { adminSignOut } from "@/lib/admin-auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

const menuSections = [
  {
    title: "Menu",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Insights", href: "/admin/reports", icon: TrendingUp },
      { name: "Updates", href: "/admin/blogs", icon: Bell },
      { name: "Customers", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "Products",
    items: [
      { name: "Store", href: "/admin/products", icon: Store, badge: "124" },
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Invoices", href: "/admin/invoices", icon: Receipt },
      { name: "Services", href: "/admin/services", icon: Wrench },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "Projects", href: "/admin/projects", icon: FolderOpen },
      { name: "Positions", href: "/admin/positions", icon: Briefcase },
      { name: "Applications", href: "/admin/applications", icon: UserCheck },
    ],
  },
  {
    title: "General",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Help Desk", href: "/admin/reports", icon: HelpCircle },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
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
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 overflow-y-auto z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Image
              src="/turquoise.png"
              alt="QuardCube Labs"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold text-gray-900">QuardCube</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="p-4">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <p className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-gray-400")} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}

        {/* Logout Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  )
}
