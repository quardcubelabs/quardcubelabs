"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  User,
  Package,
  MapPin,
  ShieldCheck,
  HelpCircle,
  LogOut,
  X,
  Check,
  Edit2,
  Lock,
  Phone,
  Mail,
  Building,
  Clock,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  MessageCircle,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { useOrders } from "@/contexts/order-context"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "profile" | "orders" | "addresses" | "security" | "support"
}

type TabType = "profile" | "orders" | "addresses" | "security" | "support"

export default function AccountModal({ isOpen, onClose, initialTab = "profile" }: AccountModalProps) {
  const { user, signOut, updateProfile, signIn, signUp, isLoading: authLoading } = useAuth()
  const { orders, isLoading: ordersLoading, refreshOrders } = useOrders()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Profile Form State
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("Dar es Salaam")
  const [company, setCompany] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Security Form State
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Guest Auth State
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "")
      setPhone(user.user_metadata?.phone || user.phone || "")
      setAddress(user.user_metadata?.address || "")
      setCity(user.user_metadata?.city || "Dar es Salaam")
      setCompany(user.user_metadata?.company || "")
    }
  }, [user])

  // Reset tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const getInitials = () => {
    const name = fullName || user?.email || "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const { error } = await updateProfile({
        name: fullName,
        full_name: fullName,
        phone,
        address,
        city,
        company,
      })
      if (error) throw error
      toast({
        title: "Profile Updated",
        description: "Your personal details have been saved successfully.",
      })
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update profile.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please verify both passwords match.",
        variant: "destructive",
      })
      return
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      })
      return
    }
    setIsUpdatingPassword(true)
    try {
      const { createBrowserClient } = await import("@/lib/supabase")
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast({
        title: "Password Changed",
        description: "Your account password has been updated securely.",
      })
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast({
        title: "Failed to Update Password",
        description: err.message || "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingAuth(true)
    try {
      const { error } = await signIn(loginEmail.trim(), loginPassword)
      if (error) throw error
      toast({
        title: "Welcome Back!",
        description: "Successfully signed in to your QuardCube account.",
      })
    } catch (err: any) {
      toast({
        title: "Sign In Failed",
        description: err.message || "Invalid email or password.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleGuestRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingAuth(true)
    try {
      const { error } = await signUp(registerEmail.trim(), registerPassword, {
        name: registerName,
        full_name: registerName,
        phone: registerPhone,
      })
      if (error) throw error
      toast({
        title: "Account Created!",
        description: "Welcome to QuardCube! Your account is active.",
      })
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "Could not register account.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const navItems = [
    { id: "profile" as TabType, label: "Profile Details", icon: User, desc: "Personal information" },
    { id: "orders" as TabType, label: "My Orders", icon: Package, desc: "Track purchases & history", badge: orders?.length },
    { id: "addresses" as TabType, label: "Delivery Address", icon: MapPin, desc: "Shipping location" },
    { id: "security" as TabType, label: "Security & Password", icon: ShieldCheck, desc: "Account credentials" },
    { id: "support" as TabType, label: "Support & Help", icon: HelpCircle, desc: "Direct inquiries" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-navy/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border-2 border-navy/20 flex flex-col z-[130] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-6 bg-navy text-white flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-teal">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                    {user ? "Client Account Portal" : "Account Sign In"}
                  </h2>
                  <p className="text-xs text-white/70">
                    {user ? `Logged in as ${user.email}` : "Sign in to manage orders, addresses & quotations"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand-red text-white flex items-center justify-center transition-colors shadow-sm"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body with Sidebar + Content Area */}
            {user ? (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                {/* Sidebar */}
                <aside className="w-full md:w-72 bg-navy/5 border-b md:border-b-0 md:border-r-2 border-navy/10 flex flex-col justify-between shrink-0">
                  <div className="p-3 sm:p-4 space-y-3">
                    {/* User Profile Mini Badge */}
                    <div className="p-3 rounded-2xl bg-white border border-navy/10 shadow-xs flex items-center gap-3">
                      <Avatar className="w-11 h-11 border-2 border-navy">
                        <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                        <AvatarFallback className="bg-navy text-white font-black text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-sm text-navy truncate">
                          {fullName || user.user_metadata?.name || "Client Member"}
                        </p>
                        <p className="text-xs text-navy/60 truncate">{user.email}</p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-0.5">
                          Verified Client
                        </span>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-none">
                      {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold transition-all shrink-0 md:shrink md:w-full ${
                              isActive
                                ? "bg-navy text-white shadow-sm"
                                : "text-navy hover:bg-navy/10"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                  isActive ? "bg-white text-navy" : "bg-navy text-white"
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="whitespace-nowrap">{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge > 0 && (
                              <Badge
                                className={`text-[10px] px-1.5 h-5 font-black hidden md:inline-flex ${
                                  isActive ? "bg-brand-red text-white" : "bg-navy text-white"
                                }`}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </nav>
                  </div>

                  {/* Sign Out Button in Sidebar */}
                  <div className="p-3 sm:p-4 border-t border-navy/10 bg-white/40 hidden md:block">
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut()
                        toast({ title: "Signed Out", description: "You have been logged out securely." })
                        onClose()
                      }}
                      className="w-full py-2.5 px-3 rounded-xl border border-brand-red/30 text-brand-red hover:bg-brand-red hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                    >
                      <div className="w-5 h-5 rounded-full bg-brand-red text-white flex items-center justify-center">
                        <LogOut className="h-3 w-3" />
                      </div>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </aside>

                {/* Right Content Panel */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white min-h-[360px]">
                  {/* Tab 1: Profile Details */}
                  {activeTab === "profile" && (
                    <div className="space-y-6 max-w-xl">
                      <div>
                        <h3 className="text-lg font-black text-navy">Personal Details</h3>
                        <p className="text-xs text-navy/70">
                          Manage your profile contact details used for billing and delivery notes.
                        </p>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="prof-name" className="text-xs font-bold text-navy">
                            Full Name
                          </Label>
                          <Input
                            id="prof-name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="John Doe"
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="prof-email" className="text-xs font-bold text-navy">
                              Email Address
                            </Label>
                            <Input
                              id="prof-email"
                              value={user.email || ""}
                              disabled
                              className="h-10 text-xs rounded-xl bg-slate-50 border-navy/10 text-navy/60 cursor-not-allowed"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="prof-phone" className="text-xs font-bold text-navy">
                              Phone Number (M-Pesa / Calls)
                            </Label>
                            <Input
                              id="prof-phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+255 7XX XXX XXX"
                              className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="prof-company" className="text-xs font-bold text-navy">
                              Organization / Business (Optional)
                            </Label>
                            <Input
                              id="prof-company"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="Company Name"
                              className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="prof-city" className="text-xs font-bold text-navy">
                              City / Region
                            </Label>
                            <Input
                              id="prof-city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Dar es Salaam"
                              className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="prof-address" className="text-xs font-bold text-navy">
                            Default Delivery Address / Street / Landmark
                          </Label>
                          <Input
                            id="prof-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Plot 14, Mlimani City Road, Sinza"
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                          />
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Button
                            type="submit"
                            disabled={isSavingProfile}
                            className="bg-navy hover:bg-brand-red text-white font-bold text-xs rounded-xl h-10 px-6 transition-colors shadow-sm"
                          >
                            {isSavingProfile ? "Saving Details..." : "Save Profile Changes"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Tab 2: Orders & Invoices */}
                  {activeTab === "orders" && (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-navy">My Orders</h3>
                          <p className="text-xs text-navy/70">
                            Track the status of your equipment and service orders.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshOrders()}
                          disabled={ordersLoading}
                          className="h-8 text-xs font-bold border-navy/20 text-navy hover:bg-navy hover:text-white rounded-xl gap-1"
                        >
                          <RefreshCw className={`h-3 w-3 ${ordersLoading ? "animate-spin" : ""}`} />
                          <span>Refresh</span>
                        </Button>
                      </div>

                      {orders && orders.length > 0 ? (
                        <div className="space-y-3">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="p-4 rounded-2xl border-2 border-navy/15 bg-white hover:border-navy/40 transition-all shadow-xs space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy/10 pb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center font-black text-xs">
                                    #
                                  </div>
                                  <span className="font-extrabold text-xs text-navy">
                                    Order #{order.id.slice(0, 8).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-navy/60">
                                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : "Recent"}
                                  </span>
                                  <Badge
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                      order.status === "completed"
                                        ? "bg-emerald-600 text-white"
                                        : order.status === "cancelled"
                                        ? "bg-red-600 text-white"
                                        : "bg-amber-500 text-slate-950 font-black"
                                    }`}
                                  >
                                    {order.status || "Pending"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Order items preview */}
                              <div className="space-y-1.5">
                                {order.items?.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-navy font-semibold truncate max-w-[260px]">
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="font-bold text-navy/80 shrink-0">
                                      TZS {(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 border-t border-navy/10 flex items-center justify-between">
                                <span className="text-xs font-bold text-navy/60">Total Paid:</span>
                                <span className="font-black text-sm text-navy">
                                  TZS {Number(order.total).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-navy/20 rounded-3xl p-6 bg-navy/[0.02]">
                          <ShoppingBag className="h-10 w-10 text-navy/30 mx-auto mb-2" />
                          <h4 className="font-extrabold text-sm text-navy mb-1">No Orders Yet</h4>
                          <p className="text-xs text-navy/60 mb-4">
                            You haven't placed any hardware or service orders yet.
                          </p>
                          <Link href="/shop" onClick={onClose}>
                            <Button className="bg-navy hover:bg-brand-red text-white text-xs font-bold rounded-xl h-9 px-5">
                              Start Shopping
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Delivery Addresses */}
                  {activeTab === "addresses" && (
                    <div className="space-y-6 max-w-xl">
                      <div>
                        <h3 className="text-lg font-black text-navy">Delivery Address</h3>
                        <p className="text-xs text-navy/70">
                          Set your primary destination for hardware delivery across Tanzania.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-teal/10 border-2 border-navy/15 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-navy">
                            Current Saved Destination
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        </div>
                        <p className="text-sm font-bold text-navy">
                          {address || "No primary street address entered yet."}
                        </p>
                        <p className="text-xs text-navy/70">
                          {city}, Tanzania {phone ? `• Contact: ${phone}` : ""}
                        </p>
                      </div>

                      <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="ship-city" className="text-xs font-bold text-navy">
                            Region / City
                          </Label>
                          <Input
                            id="ship-city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Dar es Salaam, Arusha, Mwanza, Dodoma..."
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="ship-address" className="text-xs font-bold text-navy">
                            Street, Ward or Office Landmark
                          </Label>
                          <Input
                            id="ship-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Plot 12B, Samora Avenue, City Center"
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="ship-phone" className="text-xs font-bold text-navy">
                            Receiver Mobile Phone Number
                          </Label>
                          <Input
                            id="ship-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+255 7XX XXX XXX"
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSavingProfile}
                          className="w-full bg-navy hover:bg-brand-red text-white font-bold text-xs rounded-xl h-10 transition-colors shadow-sm"
                        >
                          {isSavingProfile ? "Updating Address..." : "Update Default Delivery Address"}
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Tab 4: Security & Password */}
                  {activeTab === "security" && (
                    <div className="space-y-6 max-w-xl">
                      <div>
                        <h3 className="text-lg font-black text-navy">Security &amp; Password</h3>
                        <p className="text-xs text-navy/70">
                          Keep your client account secure with a strong password.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/15 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-navy">Account Status</p>
                          <p className="text-[11px] text-navy/60">Email: {user.email}</p>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                          Protected
                        </Badge>
                      </div>

                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="new-pass" className="text-xs font-bold text-navy">
                            New Password
                          </Label>
                          <Input
                            id="new-pass"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="conf-pass" className="text-xs font-bold text-navy">
                            Confirm New Password
                          </Label>
                          <Input
                            id="conf-pass"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password"
                            className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isUpdatingPassword || !newPassword}
                          className="bg-navy hover:bg-brand-red text-white font-bold text-xs rounded-xl h-10 px-6 transition-colors shadow-sm"
                        >
                          {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Tab 5: Support & Direct Channels */}
                  {activeTab === "support" && (
                    <div className="space-y-6 max-w-xl">
                      <div>
                        <h3 className="text-lg font-black text-navy">Client Support &amp; Inquiries</h3>
                        <p className="text-xs text-navy/70">
                          Connect directly with our IT hardware and software engineering teams.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <a
                          href="https://wa.me/255623893383?text=Hello%20QuardCubeLabs%2C%20I%20need%20assistance%20with%20my%20account"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 transition-colors flex items-center gap-3 text-left group"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <MessageCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-emerald-950">WhatsApp Desk</p>
                            <p className="text-[11px] text-emerald-700">+255 623 893 383</p>
                          </div>
                        </a>

                        <a
                          href="tel:+255623893383"
                          className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 transition-colors flex items-center gap-3 text-left group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-blue-950">Phone Hotline</p>
                            <p className="text-[11px] text-blue-700">Mon - Sat: 8am - 6pm</p>
                          </div>
                        </a>
                      </div>

                      <div className="p-4 rounded-2xl bg-navy/5 border border-navy/15 space-y-2">
                        <p className="text-xs font-extrabold text-navy">Direct Email Support</p>
                        <p className="text-xs text-navy/70">
                          Official Inquiries: <strong className="text-navy">info@quardcubelabs.co.tz</strong>
                        </p>
                        <p className="text-xs text-navy/70">
                          Billing &amp; Invoices: <strong className="text-navy">support@quardcubelabs.co.tz</strong>
                        </p>
                        <p className="text-xs text-navy/70">
                          Physical Headquarters: <strong className="text-navy">Dar es Salaam, Tanzania</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </main>
              </div>
            ) : (
              /* Guest Auth Screen inside Modal */
              <div className="p-6 sm:p-8 overflow-y-auto max-w-md mx-auto w-full">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-black text-navy">
                    {authMode === "login" ? "Welcome to QuardCube" : "Create Client Account"}
                  </h3>
                  <p className="text-xs text-navy/60 mt-1">
                    {authMode === "login"
                      ? "Sign in to track orders, invoices, and save delivery preferences."
                      : "Register your client profile for fast checkout and quotations."}
                  </p>
                </div>

                {/* Auth Mode Toggle */}
                <div className="grid grid-cols-2 p-1 bg-navy/5 rounded-2xl border border-navy/10 mb-6">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      authMode === "login"
                        ? "bg-navy text-white shadow-sm"
                        : "text-navy hover:text-navy/80"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      authMode === "register"
                        ? "bg-navy text-white shadow-sm"
                        : "text-navy hover:text-navy/80"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {authMode === "login" ? (
                  <form onSubmit={handleGuestLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-xs font-bold text-navy">
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="login-pass" className="text-xs font-bold text-navy">
                        Password
                      </Label>
                      <Input
                        id="login-pass"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full bg-navy hover:bg-brand-red text-white font-bold text-xs rounded-xl h-10 shadow-sm transition-colors"
                    >
                      {isSubmittingAuth ? "Signing In..." : "Sign In to My Account"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleGuestRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name" className="text-xs font-bold text-navy">
                        Full Name
                      </Label>
                      <Input
                        id="reg-name"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="John Doe"
                        className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-xs font-bold text-navy">
                        Email Address
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-phone" className="text-xs font-bold text-navy">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="reg-phone"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="+255 7XX XXX XXX"
                        className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pass" className="text-xs font-bold text-navy">
                        Password
                      </Label>
                      <Input
                        id="reg-pass"
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="h-10 text-xs rounded-xl border-navy/20 focus:border-navy"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full bg-navy hover:bg-brand-red text-white font-bold text-xs rounded-xl h-10 shadow-sm transition-colors"
                    >
                      {isSubmittingAuth ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

