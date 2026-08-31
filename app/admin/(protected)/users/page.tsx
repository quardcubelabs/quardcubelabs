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
      const result = await updateAuthUserMetadata(selectedUser.id, {
        user_metadata: {
          ...selectedUser.user_metadata,
          firstName: editMetadata.firstName,
          lastName: editMetadata.lastName,
          full_name: `${editMetadata.firstName} ${editMetadata.lastName}`.trim()
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
        description: "User profile updated successfully",
      })

      setIsEditDialogOpen(false)
      loadUsers() // Refresh list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive"
      })
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

  const openEditDialog = (user: AuthUser) => {
    setSelectedUser(user)
    setEditMetadata({
      firstName: user.user_metadata?.firstName || "",
      lastName: user.user_metadata?.lastName || "",
      role: user.app_metadata?.role || "customer"
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
        isDark ? "bg-[#0a1033] border-teal/20 text-white" : "bg-teal text-navy"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {[
            { title: "Total Users", value: userStats.totalUsers.toString(), icon: Users },
            { title: "Verified Users", value: userStats.verifiedUsers.toString(), icon: UserCheck },
            { title: "Unverified Users", value: userStats.unverifiedUsers.toString(), icon: UserX },
            { title: "Recent Signups", value: userStats.recentSignups.toString(), icon: Calendar }
          ].map((stat, idx) => (
            <Card
              key={idx}
              className={cn(
                "rounded-2xl transition-all duration-300 border-2 hover:-translate-y-1 group cursor-pointer",
                isDark 
                  ? "bg-[#0a1033] border-teal/20 shadow-lg shadow-black/20 hover:border-teal-400 hover:shadow-teal-950/40" 
                  : "bg-white border-navy/20 shadow-md hover:border-navy hover:shadow-xl"
              )}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 truncate", isDark ? "text-teal-400/80" : "text-navy/70")}>
                      {stat.title}
                    </p>
                    <span className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-black whitespace-nowrap tracking-tight", isDark ? "text-white" : "text-navy")}>
                      {stat.value}
                    </span>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-2.5 rounded-xl border-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isDark 
                      ? "bg-teal-400/10 border-teal-400/30 text-teal-300 group-hover:bg-teal-400/20" 
                      : "bg-teal-100 border-navy/10 text-navy group-hover:bg-teal-200"
                  )}>
                    <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <Card className={cn(
        "rounded-2xl border-2 p-4 transition-all duration-300",
        isDark ? "bg-[#0a1033] border-teal/20" : "bg-white border-navy/20 shadow-sm"
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
          <h2 className="text-lg sm:text-xl font-semibold text-navy">All Users</h2>
          <p className="text-sm text-gray-500">{filteredUsers.length} users</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-navy hover:bg-navy/90" size="sm">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span>Invite User</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation email to a new user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={inviteMetadata.firstName}
                    onChange={(e) => setInviteMetadata(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={inviteMetadata.lastName}
                    onChange={(e) => setInviteMetadata(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={inviteMetadata.role} 
                    onValueChange={(value) => setInviteMetadata(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInviteUser} className="w-full">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">USER</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PROVIDER</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">VERIFIED</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ROLE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">JOINED</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{getDisplayName(user)}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">
                  {user.app_metadata?.provider || "email"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                    {user.email_confirmed_at ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="capitalize">
                    {user.app_metadata?.role || "customer"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)} title="Edit user">
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    {!user.email_confirmed_at && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResendConfirmation(user.id)} title="Resend confirmation">
                        <Mail className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteUser(user.id)} title="Delete user">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== "all" 
              ? "Try adjusting your search or filter criteria" 
              : "No users have been created yet"}
          </p>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and metadata
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={editMetadata.firstName}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={editMetadata.lastName}
                onChange={(e) => setEditMetadata(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Doe"
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select 
                value={editMetadata.role} 
                onValueChange={(value) => setEditMetadata(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateUser} className="w-full">
              Update User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
