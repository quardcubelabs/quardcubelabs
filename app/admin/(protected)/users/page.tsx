"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Crown, Shield, Mail, Phone, Calendar, MapPin, ShoppingCart, User } from "lucide-react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'admin' | 'customer' | 'moderator'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  avatar?: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
  dateOfBirth?: string
  lastLogin?: string
  totalOrders: number
  totalSpent: number
  emailVerified: boolean
  phoneVerified: boolean
  preferences: {
    newsletter: boolean
    smsNotifications: boolean
    marketingEmails: boolean
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "customer" as 'admin' | 'customer' | 'moderator',
    status: "active" as 'active' | 'inactive' | 'suspended' | 'pending',
    avatar: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    dateOfBirth: "",
    notes: "",
    newsletter: true,
    smsNotifications: false,
    marketingEmails: true
  })

  // Mock data - Replace with actual API calls
  const mockUsers: User[] = [
    {
      id: "1",
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1-555-0123",
      role: "customer",
      status: "active",
      avatar: "/avatars/john-doe.jpg",
      address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        country: "USA",
        postalCode: "10001"
      },
      dateOfBirth: "1985-06-15",
      lastLogin: "2024-07-30T14:30:00Z",
      totalOrders: 12,
      totalSpent: 8450.99,
      emailVerified: true,
      phoneVerified: true,
      preferences: {
        newsletter: true,
        smsNotifications: false,
        marketingEmails: true
      },
      notes: "VIP customer - prefers email communication",
      createdAt: "2023-01-15",
      updatedAt: "2024-07-30"
    },
    {
      id: "2",
      email: "sarah.johnson@company.com",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+1-555-0456",
      role: "customer",
      status: "active",
      avatar: "/avatars/sarah-johnson.jpg",
      address: {
        street: "456 Oak Avenue",
        city: "Los Angeles",
        state: "CA",
        country: "USA",
        postalCode: "90210"
      },
      dateOfBirth: "1990-03-22",
      lastLogin: "2024-07-29T09:15:00Z",
      totalOrders: 8,
      totalSpent: 5230.50,
      emailVerified: true,
      phoneVerified: false,
      preferences: {
        newsletter: true,
        smsNotifications: true,
        marketingEmails: false
      },
      notes: "Enterprise client - bulk orders",
      createdAt: "2023-03-10",
      updatedAt: "2024-07-29"
    },
    {
      id: "3",
      email: "admin@quardcubelabs.com",
      firstName: "Admin",
      lastName: "User",
      phone: "+1-555-0789",
      role: "admin",
      status: "active",
      avatar: "/avatars/admin.jpg",
      lastLogin: "2024-07-30T16:45:00Z",
      totalOrders: 0,
      totalSpent: 0,
      emailVerified: true,
      phoneVerified: true,
      preferences: {
        newsletter: false,
        smsNotifications: true,
        marketingEmails: false
      },
      notes: "System administrator account",
      createdAt: "2022-01-01",
      updatedAt: "2024-07-30"
    },
    {
      id: "4",
      email: "mike.brown@startup.io",
      firstName: "Mike",
      lastName: "Brown",
      phone: "+1-555-0321",
      role: "customer",
      status: "pending",
      dateOfBirth: "1988-11-08",
      lastLogin: "2024-07-25T11:20:00Z",
      totalOrders: 2,
      totalSpent: 1200.00,
      emailVerified: false,
      phoneVerified: false,
      preferences: {
        newsletter: true,
        smsNotifications: false,
        marketingEmails: true
      },
      notes: "New customer - verification pending",
      createdAt: "2024-07-20",
      updatedAt: "2024-07-25"
    },
    {
      id: "5",
      email: "emma.wilson@tech.com",
      firstName: "Emma",
      lastName: "Wilson",
      phone: "+1-555-0654",
      role: "moderator",
      status: "active",
      avatar: "/avatars/emma-wilson.jpg",
      address: {
        street: "789 Pine Road",
        city: "Seattle",
        state: "WA",
        country: "USA",
        postalCode: "98101"
      },
      dateOfBirth: "1992-09-12",
      lastLogin: "2024-07-30T13:00:00Z",
      totalOrders: 0,
      totalSpent: 0,
      emailVerified: true,
      phoneVerified: true,
      preferences: {
        newsletter: true,
        smsNotifications: true,
        marketingEmails: false
      },
      notes: "Content moderator and customer support",
      createdAt: "2023-06-01",
      updatedAt: "2024-07-30"
    },
    {
      id: "6",
      email: "alex.garcia@freelance.com",
      firstName: "Alex",
      lastName: "Garcia",
      role: "customer",
      status: "suspended",
      dateOfBirth: "1987-12-03",
      lastLogin: "2024-06-15T08:30:00Z",
      totalOrders: 5,
      totalSpent: 3100.25,
      emailVerified: true,
      phoneVerified: false,
      preferences: {
        newsletter: false,
        smsNotifications: false,
        marketingEmails: false
      },
      notes: "Account suspended due to policy violation",
      createdAt: "2023-08-15",
      updatedAt: "2024-06-20"
    }
  ]

  // Fetch users function
  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load users")
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

  const handleAddUser = async () => {
    try {
      const newUser: User = {
        id: Date.now().toString(),
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
        status: formData.status,
        avatar: formData.avatar || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          postalCode: formData.postalCode || undefined
        },
        dateOfBirth: formData.dateOfBirth || undefined,
        totalOrders: 0,
        totalSpent: 0,
        emailVerified: false,
        phoneVerified: false,
        preferences: {
          newsletter: formData.newsletter,
          smsNotifications: formData.smsNotifications,
          marketingEmails: formData.marketingEmails
        },
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }

      setUsers([newUser, ...users])
      setIsAddDialogOpen(false)
      resetForm()
      toast({
        title: "User Added",
        description: "New user has been added successfully",
      })
    } catch (error) {
      console.error("Error adding user:", error)
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const updatedUser: User = {
        ...selectedUser,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
        status: formData.status,
        avatar: formData.avatar || undefined,
        address: {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          postalCode: formData.postalCode || undefined
        },
        dateOfBirth: formData.dateOfBirth || undefined,
        preferences: {
          newsletter: formData.newsletter,
          smsNotifications: formData.smsNotifications,
          marketingEmails: formData.marketingEmails
        },
        notes: formData.notes || undefined,
        updatedAt: new Date().toISOString().split('T')[0]
      }

      setUsers(users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      ))
      setIsEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
      toast({
        title: "User Updated",
        description: "User has been updated successfully",
      })
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
    try {
      setUsers(users.filter(user => user.id !== userId))
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "customer",
      status: "active",
      avatar: "",
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      dateOfBirth: "",
      notes: "",
      newsletter: true,
      smsNotifications: false,
      marketingEmails: true
    })
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      role: user.role as 'admin' | 'customer' | 'moderator',
      status: user.status as 'active' | 'inactive' | 'suspended' | 'pending',
      avatar: user.avatar || "",
      street: user.address?.street || "",
      city: user.address?.city || "",
      state: user.address?.state || "",
      country: user.address?.country || "",
      postalCode: user.address?.postalCode || "",
      dateOfBirth: user.dateOfBirth || "",
      notes: user.notes || "",
      newsletter: user.preferences.newsletter,
      smsNotifications: user.preferences.smsNotifications,
      marketingEmails: user.preferences.marketingEmails
    })
    setIsEditDialogOpen(true)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'moderator': return 'secondary'
      case 'customer': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'suspended': return 'destructive'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown
      case 'moderator': return Shield
      case 'customer': return Users
      default: return Users
    }
  }

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Never"
    const date = new Date(lastLogin)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Loading users...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Monitor customer accounts and activity</p>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchUsers}>Retry</Button>
      </div>
    )
  }

  const totalUsers = users.length
  const activeUsers = users.filter(user => user.totalOrders > 0).length
  const totalOrders = users.reduce((sum, user) => sum + user.totalOrders, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Monitor customer accounts and activity</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Refresh Users
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Users with orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Orders
            </CardTitle>
            <Calendar className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">From all users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-2 space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">Users will appear here once they place orders</p>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card
                key={user.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedUser?.id === user.id ? "ring-2 ring-navy" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="bg-navy/10 p-2 rounded-full">
                        <User className="h-5 w-5 text-navy" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      className={user.totalOrders > 0 ? 
                        "bg-green-100 text-green-800" : 
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {user.totalOrders} order{user.totalOrders !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Customer Status:</span>
                    <span className={`font-medium ${
                      user.totalOrders > 0 ? "text-green-600" : "text-gray-600"
                    }`}>
                      {user.totalOrders > 0 ? "Active Customer" : "No Orders"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* User Details */}
        <div>
          {selectedUser ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>User Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-navy/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-navy" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                      <p className="text-sm text-gray-600">Customer Name</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.email}</p>
                      <p className="text-sm text-gray-600">Email Address</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-full">
                      <ShoppingCart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedUser.totalOrders} orders</p>
                      <p className="text-sm text-gray-600">Total Orders Placed</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Customer Status</h4>
                  <Badge 
                    className={`${
                      selectedUser.totalOrders > 0 ? 
                        "bg-green-100 text-green-800" : 
                        "bg-gray-100 text-gray-800"
                    } w-full justify-center`}
                  >
                    {selectedUser.totalOrders > 0 ? "Active Customer" : "Inactive"}
                  </Badge>
                  
                  {selectedUser.totalOrders > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p>
                        This customer has placed {selectedUser.totalOrders} order
                        {selectedUser.totalOrders !== 1 ? 's' : ''} with us.
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 pt-4 border-t">
                  <div>User ID: {selectedUser.id.slice(0, 8)}...</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Select a user to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
