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

  // Form states for inviting new users
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMetadata, setInviteMetadata] = useState({
    firstName: "",
    lastName: "",
    role: "customer"
  })

  // Form states for editing user metadata
  const [editMetadata, setEditMetadata] = useState({
    firstName: "",
    lastName: "",
    role: "customer"
  })

  // Load users and stats
  useEffect(() => {
    loadUsers()
    loadUserStats()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { users: authUsers, error } = await getAuthUsers()
      
      if (error) {
        setError(error)
        toast({
          title: "Error",
          description: "Failed to load users from Supabase Auth",
          variant: "destructive",
        })
        return
      }

      setUsers(authUsers)
      setFilteredUsers(authUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Failed to load users")
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      const { stats, error } = await getUserStats()
      
      if (error) {
        console.error("Error loading user stats:", error)
        return
      }

      setUserStats(stats)
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  // Filter and search users
  useEffect(() => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter (verified/unverified)
    if (statusFilter !== "all") {
      if (statusFilter === "verified") {
        filtered = filtered.filter(user => user.email_confirmed_at)
      } else if (statusFilter === "unverified") {
        filtered = filtered.filter(user => !user.email_confirmed_at)
      }
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  // Helper functions
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

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  // Actions
  const handleInviteUser = async () => {
    try {
      const { success, error } = await inviteUser(inviteEmail, inviteMetadata)
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "User invitation sent successfully",
      })
      
      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteMetadata({ firstName: "", lastName: "", role: "customer" })
      loadUsers() // Refresh the list
    } catch (error) {
      console.error("Error inviting user:", error)
      toast({
        title: "Error",
        description: "Failed to invite user",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const { success, error } = await updateAuthUserMetadata(selectedUser.id, {
        user_metadata: {
          ...selectedUser.user_metadata,
          ...editMetadata
        }
      })
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })
      
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      loadUsers() // Refresh the list
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      const { success, error } = await deleteAuthUser(userId)
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      
      loadUsers() // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleResendConfirmation = async (userId: string) => {
    try {
      const { success, error } = await resendConfirmation(userId)
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Confirmation email sent successfully",
      })
    } catch (error) {
      console.error("Error resending confirmation:", error)
      toast({
        title: "Error",
        description: "Failed to resend confirmation email",
        variant: "destructive",
      })
    }
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
    return <AdminLoading message="Loading users..." size="lg" />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Users Management</h1>
          <p className="text-gray-600">Manage user accounts from Supabase Auth</p>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={loadUsers} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header Card in Teal without borders */}
      <div className="bg-teal p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-md border-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 text-navy">
              Users <span className="text-white drop-shadow-sm">Management</span>
            </h1>
            <p className="text-sm sm:text-base text-navy/90 font-semibold">
              Manage customer accounts, roles, access permissions, and profiles
            </p>
          </div>
          <Button 
            onClick={loadUsers} 
            variant="outline" 
            size="sm"
            className="bg-white text-navy border-2 border-navy/20 hover:bg-navy hover:text-white font-bold rounded-xl h-10 px-4 shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Users</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Verified Users</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.verifiedUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Unverified Users</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <UserX className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.unverifiedUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-pink-50 border-pink-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Recent Signups</CardTitle>
              <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.recentSignups}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-teal" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 sm:h-10 text-sm border border-teal focus:border-teal focus:ring-1 focus:ring-teal"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9 sm:h-10 px-3">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 sm:h-10 text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
