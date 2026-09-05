"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAdminTheme } from "@/contexts/admin-theme-context"
import { cn } from "@/lib/utils"
import { 
  getAuthUsers, 
  getUserStats, 
  deleteAuthUser, 
  updateAuthUserMetadata, 
  inviteUser, 
  resendConfirmation,
  type AuthUser, 
  type UserStats 
} from "@/lib/auth-users-actions"
import AdminLoading from "@/components/admin/admin-loading"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Crown, Shield, Mail, Phone, Calendar, MapPin, MoreHorizontal, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminUsersPage() {
  const { isDark } = useAdminTheme()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const { toast } = useToast()

  // Form states
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMetadata, setInviteMetadata] = useState({
    firstName: "",
    lastName: "",
    role: "customer"
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [editMetadata, setEditMetadata] = useState({
    firstName: "",
    lastName: "",
    role: "customer"
  })

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [usersResult, statsResult] = await Promise.all([
        getAuthUsers(),
        getUserStats()
      ])

      if (usersResult.error) {
        throw new Error(usersResult.error)
      }

      setUsers(usersResult.users)
      setFilteredUsers(usersResult.users)
      setUserStats(statsResult.stats)
    } catch (err: any) {
      console.error("Error loading users:", err)
      setError(err.message || "Failed to load users")
      toast({
        title: "Error",
        description: "Failed to load users from database",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter users based on search term and status
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        const isVerified = Boolean(user.email_confirmed_at)
        if (statusFilter === "verified") return isVerified
        if (statusFilter === "unverified") return !isVerified
        return true
      })
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return

    try {
      const result = await inviteUser(inviteEmail, inviteMetadata)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteEmail}`,
      })

      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteMetadata({ firstName: "", lastName: "", role: "customer" })
      loadUsers() // Refresh list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to invite user",
        variant: "destructive"
      })
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setIsUpdating(true)
      const fullName = `${editMetadata.firstName} ${editMetadata.lastName}`.trim()
      
      const result = await updateAuthUserMetadata(selectedUser.id, {
        user_metadata: {
          ...selectedUser.user_metadata,
          firstName: editMetadata.firstName,
          lastName: editMetadata.lastName,
          full_name: fullName,
          role: editMetadata.role
        },
        app_metadata: {
          ...selectedUser.app_metadata,
          role: editMetadata.role
        }
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `User updated successfully (Role: ${editMetadata.role})`,
      })

      // Immediately update local state optimistically
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            role: editMetadata.role,
            user_metadata: {
              ...u.user_metadata,
              firstName: editMetadata.firstName,
              lastName: editMetadata.lastName,
              full_name: fullName,
              role: editMetadata.role
            },
            app_metadata: {
              ...u.app_metadata,
              role: editMetadata.role
            }
          }
        }
        return u
      }))

      setIsEditDialogOpen(false)
      loadUsers() // Refresh list in background
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteUser = async (userId: string, email?: string) => {
    if (!confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteAuthUser(userId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `User deleted successfully`,
      })

      loadUsers() // Refresh list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive"
      })
    }
  }

  const handleResendConfirmation = async (userId: string) => {
    try {
      const result = await resendConfirmation(userId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `Confirmation email sent successfully`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend confirmation",
        variant: "destructive"
      })
    }
  }

  const getDisplayName = (user: AuthUser) => {
    if (user.user_metadata?.firstName && user.user_metadata?.lastName) {
      return `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
    }
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    return user.email || "Unknown User"
  }

  const getInitials = (user: AuthUser) => {
    const name = getDisplayName(user)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const formatStatNumber = (num: number) => {
    const n = Number(num) || 0
    if (n >= 1_000_000) {
      const m = n / 1_000_000
      return m % 1 === 0 ? `${m.toFixed(0)}M` : `${m.toFixed(1)}M`
    }
    if (n >= 1_000) {
      const k = n / 1_000
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`
    }
    return n.toLocaleString()
  }

  const openEditDialog = (user: AuthUser) => {
    setSelectedUser(user)
    setEditMetadata({
      firstName: user.user_metadata?.firstName || "",
      lastName: user.user_metadata?.lastName || "",
      role: user.role || user.app_metadata?.role || user.user_metadata?.role || "customer"
    })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return <AdminLoading />
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
          <h1 className="text-2xl font-bold text-navy">Users Management</h1>
          <p className="text-navy/80 font-medium">Manage user accounts from Supabase Auth</p>
        </div>
        <Alert className="border-2 border-brand-red bg-brand-red/10 text-brand-red rounded-xl">
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
        <Button onClick={loadUsers} className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. Page Header Card in Teal with website theme */}
      <div className={cn(
        "p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-0 shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none text-white shadow-none" : "bg-teal text-navy"
      )}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1">
              Users <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className={cn("text-sm sm:text-base font-semibold", isDark ? "text-teal-300" : "text-navy/90")}>
              Manage customer accounts, roles, access permissions, and profiles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsInviteDialogOpen(true)}
              className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl h-10 px-4 shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
            <Button 
              onClick={loadUsers} 
              variant="outline" 
              className={cn("font-bold rounded-xl h-10 px-4 border-2 transition-all", isDark ? "border-teal/40 text-teal-300 hover:bg-teal-400/15" : "border-navy/20 bg-white text-navy hover:bg-teal-50 shadow-sm")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Stats Cards Row */}
      {userStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { title: "Total Users", value: formatStatNumber(userStats.totalUsers), icon: Users },
            { title: "Verified Users", value: formatStatNumber(userStats.verifiedUsers), icon: UserCheck },
            { title: "Unverified Users", value: formatStatNumber(userStats.unverifiedUsers), icon: UserX },
            { title: "Recent Signups", value: formatStatNumber(userStats.recentSignups), icon: Calendar }
          ].map((stat, idx) => (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group cursor-pointer overflow-hidden",
                isDark 
                  ? "bg-[#0a1033] border-none shadow-md hover:bg-[#0c1438]" 
                  : "bg-white border-2 border-navy/20 shadow-sm hover:border-navy hover:shadow-md"
              )}
            >
              <CardContent className="p-3.5 sm:p-4.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate block", isDark ? "text-teal-400/80" : "text-navy/70")}>
                    {stat.title}
                  </p>
                  <span className={cn("text-lg sm:text-xl xl:text-2xl font-black truncate block leading-tight tracking-tight", isDark ? "text-white" : "text-navy")}>
                    {stat.value}
                  </span>
                </div>
                <div className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isDark 
                    ? "bg-navy border-teal/30 text-teal group-hover:bg-navy/80" 
                    : "bg-teal-100/80 border-navy/15 text-navy group-hover:bg-teal-200"
                )}>
                  <stat.icon className={cn("h-5 w-5 shrink-0", isDark ? "text-teal" : "")} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <Card className={cn(
        "rounded-2xl p-4 transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20 shadow-sm"
      )}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-10 rounded-xl border border-teal text-sm font-medium",
                isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy"
              )}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn("h-10 rounded-xl border border-teal font-bold text-xs", isDark ? "bg-[#0c1438] text-white" : "bg-white text-navy")}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-navy">All Users</h2>
          <p className="text-sm font-semibold text-navy/70">{filteredUsers.length} users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm" className="font-bold border-2 border-navy/20 text-navy hover:bg-teal-50">
            <RefreshCw className="h-4 w-4 mr-1 sm:mr-2 text-teal" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy hover:bg-navy/90 text-white font-bold rounded-xl shadow-sm" size="sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span>Invite User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={cn(
              "border-2 rounded-3xl p-6 max-w-lg shadow-2xl transition-all",
              isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
            )}>
              <DialogHeader>
                <DialogTitle className={cn("font-black text-xl flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
                  <Users className="h-5 w-5 text-teal" />
                  Invite New User
                </DialogTitle>
                <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
                  Send an invitation email with a pre-configured account role
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider">First Name</Label>
                    <Input
                      id="firstName"
                      value={inviteMetadata.firstName}
                      onChange={(e) => setInviteMetadata(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider">Last Name</Label>
                    <Input
                      id="lastName"
                      value={inviteMetadata.lastName}
                      onChange={(e) => setInviteMetadata(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                      className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider">Account Role</Label>
                  <Select 
                    value={inviteMetadata.role} 
                    onValueChange={(value) => setInviteMetadata(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff / Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInviteUser} className="w-full bg-navy hover:bg-brand-red text-white font-black rounded-xl h-11 shadow-md transition-all mt-2">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <div className={cn(
        "overflow-x-auto rounded-2xl shadow-md transition-all duration-300",
        isDark ? "bg-[#0a1033] border-none shadow-none" : "bg-white border-2 border-navy/20"
      )}>
        <table className="w-full text-sm">
          <thead className="bg-navy text-white border-b-2 border-navy/30">
            <tr>
              <th className="text-left px-4 py-3 font-black text-white text-xs uppercase tracking-wider">USER</th>
              <th className="text-left px-4 py-3 font-black text-white text-xs uppercase tracking-wider">PROVIDER</th>
              <th className="text-left px-4 py-3 font-black text-white text-xs uppercase tracking-wider">VERIFIED</th>
              <th className="text-left px-4 py-3 font-black text-white text-xs uppercase tracking-wider">ROLE</th>
              <th className="text-left px-4 py-3 font-black text-white text-xs uppercase tracking-wider">JOINED</th>
              <th className="text-right px-4 py-3 font-black text-white text-xs uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y", isDark ? "divide-slate-800" : "divide-navy/10")}>
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className={cn(
                  "transition-colors duration-150 cursor-pointer",
                  isDark ? "hover:bg-white/5 hover:text-white" : "hover:bg-teal/50 hover:text-navy"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7.5 w-7.5 sm:h-8 sm:w-8 border border-navy/15 shadow-sm flex-shrink-0">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className={cn("font-black text-[10px] sm:text-xs border", isDark ? "bg-navy text-teal border-teal/30" : "bg-navy text-teal border-navy/20")}>
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className={cn("font-bold truncate", isDark ? "text-white" : "text-navy")}>{getDisplayName(user)}</div>
                      <div className={cn("text-xs font-medium truncate", isDark ? "text-slate-300" : "text-navy/70")}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className={cn("px-4 py-3 font-semibold capitalize text-xs", isDark ? "text-white" : "text-navy")}>
                  {user.app_metadata?.provider || "email"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={cn(
                    "text-xs font-bold px-2.5 py-0.5 rounded-lg shadow-none",
                    user.email_confirmed_at 
                      ? (isDark ? "bg-teal-500/20 text-teal-300 border border-teal-500/30" : "bg-navy text-white hover:bg-navy")
                      : (isDark ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-teal-100 text-navy hover:bg-teal-100 border border-teal/40")
                  )}>
                    {user.email_confirmed_at ? "Verified" : "Unverified"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn(
                    "capitalize text-xs font-bold border",
                    isDark ? "border-teal/30 text-white bg-transparent" : "border-navy/30 text-navy bg-white"
                  )}>
                    {user.role || user.app_metadata?.role || user.user_metadata?.role || "customer"}
                  </Badge>
                </td>
                <td className={cn("px-4 py-3 font-semibold text-xs", isDark ? "text-white" : "text-navy")}>
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={cn(
                        "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                        isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                      )} 
                      onClick={() => openEditDialog(user)} 
                      title="Edit user"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    {!user.email_confirmed_at && (
                      <button 
                        className={cn(
                          "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                          isDark ? "bg-white/10 text-white hover:bg-white hover:text-navy" : "bg-teal/15 text-teal hover:bg-teal hover:text-navy"
                        )} 
                        onClick={() => handleResendConfirmation(user.id)} 
                        title="Resend confirmation"
                      >
                        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                    <button 
                      className={cn(
                        "p-1.5 sm:p-2 rounded-full transition-all duration-150 shadow-xs active:scale-95 cursor-pointer",
                        isDark ? "bg-teal/15 text-white hover:bg-teal hover:text-navy" : "bg-red-50 text-brand-red hover:bg-red-500 hover:text-white"
                      )} 
                      onClick={() => handleDeleteUser(user.id)} 
                      title="Delete user"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-navy/20 bg-white">
          <Users className="h-12 w-12 text-navy/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-navy mb-1">No users found</h3>
          <p className="text-sm font-medium text-navy/70">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria" 
              : "No users have been created yet"}
          </p>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={cn(
          "border-2 rounded-3xl p-6 max-w-lg shadow-2xl transition-all",
          isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-white border-navy/20 text-navy"
        )}>
          <DialogHeader>
            <DialogTitle className={cn("font-black text-xl flex items-center gap-2", isDark ? "text-white" : "text-navy")}>
              <Edit className="h-5 w-5 text-teal" />
              Edit User Profile
            </DialogTitle>
            <DialogDescription className={cn("text-xs font-medium", isDark ? "text-teal-400/80" : "text-navy/70")}>
              Update user details, display name, and system authorization role
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className={cn(
              "p-3.5 rounded-2xl border-2 flex items-center justify-between mt-2",
              isDark ? "bg-[#080d2a] border-teal/20" : "bg-slate-50 border-navy/10"
            )}>
              <div className="space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User Account</div>
                <div className="text-sm font-black">{selectedUser.email}</div>
              </div>
              <Badge className={cn("text-xs font-bold capitalize", isDark ? "bg-teal text-navy" : "bg-navy text-white")}>
                {selectedUser.role || selectedUser.app_metadata?.role || selectedUser.user_metadata?.role || "customer"}
              </Badge>
            </div>
          )}

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editFirstName" className="text-xs font-bold uppercase tracking-wider">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editMetadata.firstName}
                  onChange={(e) => setEditMetadata(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editLastName" className="text-xs font-bold uppercase tracking-wider">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editMetadata.lastName}
                  onChange={(e) => setEditMetadata(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  className={cn("h-11 rounded-xl border-2 font-medium", isDark ? "bg-[#080d2a] border-teal/30 text-white placeholder:text-slate-500" : "bg-white border-navy/20 text-navy placeholder:text-navy/40")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editRole" className="text-xs font-bold uppercase tracking-wider">Authorization Role</Label>
              <Select 
                value={editMetadata.role} 
                onValueChange={(value) => setEditMetadata(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className={cn("h-11 rounded-xl border-2 font-bold", isDark ? "bg-[#080d2a] border-teal/30 text-white" : "bg-white border-navy/20 text-navy")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="staff">Staff / Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleUpdateUser} 
              disabled={isUpdating}
              className="w-full bg-navy hover:bg-brand-red text-white font-black rounded-xl h-11 shadow-md transition-all mt-2 cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save User Changes"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
