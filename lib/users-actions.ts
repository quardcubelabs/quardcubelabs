"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createServerClient } from "@/lib/supabase"
import { User } from "@clerk/nextjs/server"

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  emailVerified: boolean
  phoneVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  role?: string
  status?: string
  totalOrders?: number
  totalSpent?: number
}

interface UserOrderStats {
  total_orders: number
  total_spent: number
}

// Mock data fallback when Clerk is not configured
function getMockUsers() {
  const mockUsers: UserProfile[] = [
    {
      id: "mock_1",
      email: "admin@quardcubelabs.com",
      firstName: "Admin",
      lastName: "User",
      phone: "+1234567890",
      avatar: undefined,
      emailVerified: true,
      phoneVerified: true,
      lastLogin: new Date().toISOString(),
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: new Date().toISOString(),
      role: "admin",
      status: "active",
      totalOrders: 0,
      totalSpent: 0
    },
    {
      id: "mock_2",
      email: "customer@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567891",
      avatar: undefined,
      emailVerified: true,
      phoneVerified: false,
      lastLogin: new Date().toISOString(),
      createdAt: "2024-02-01T00:00:00.000Z",
      updatedAt: new Date().toISOString(),
      role: "customer",
      status: "active",
      totalOrders: 3,
      totalSpent: 450.00
    },
    {
      id: "mock_3",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Smith",
      phone: "+1234567892",
      avatar: undefined,
      emailVerified: true,
      phoneVerified: true,
      lastLogin: "2024-07-15T00:00:00.000Z",
      createdAt: "2024-01-15T00:00:00.000Z",
      updatedAt: "2024-07-15T00:00:00.000Z",
      role: "customer",
      status: "inactive",
      totalOrders: 1,
      totalSpent: 89.99
    }
  ]
  
  return { data: mockUsers, error: null }
}

export async function getUsers() {
  try {
    // Check if Clerk is properly configured with valid keys
    if (!process.env.CLERK_SECRET_KEY || 
        process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here' ||
        process.env.CLERK_SECRET_KEY.length < 10) {
      return getMockUsers()
    }

    // Get users from Clerk
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at"
    })

    const supabase = createServerClient()
    
    // Get order statistics for users
    const { data: orderStats, error: orderError } = await supabase
      .from('orders')
      .select('user_id, total_amount')
    
    if (orderError) {
      console.error('Error fetching order stats:', orderError)
    }

    // Calculate stats per user
    const userOrderStats: Record<string, UserOrderStats> = {}
    
    if (orderStats) {
      orderStats.forEach((order) => {
        if (!userOrderStats[order.user_id]) {
          userOrderStats[order.user_id] = { total_orders: 0, total_spent: 0 }
        }
        userOrderStats[order.user_id].total_orders += 1
        userOrderStats[order.user_id].total_spent += parseFloat(order.total_amount) || 0
      })
    }

    // Transform Clerk users to our format
    const users: UserProfile[] = clerkUsers.data.map((user: User) => {
      const stats = userOrderStats[user.id] || { total_orders: 0, total_spent: 0 }
      
      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phoneNumbers[0]?.phoneNumber || undefined,
        avatar: user.imageUrl || undefined,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
        phoneVerified: user.phoneNumbers[0]?.verification?.status === 'verified',
        lastLogin: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : undefined,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
        role: user.publicMetadata?.role as string || 'customer',
        status: user.banned ? 'suspended' : (user.locked ? 'inactive' : 'active'),
        totalOrders: stats.total_orders,
        totalSpent: stats.total_spent
      }
    })

    return { data: users, error: null }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    
    // If Clerk is not configured or unauthorized, return mock data instead of failing
    if (error.message?.includes('Missing Clerk Secret Key') || 
        error.message?.includes('CLERK_SECRET_KEY') ||
        error.status === 401 ||
        error.message?.includes('Unauthorized')) {
      return getMockUsers()
    }
    
    return { data: null, error: error.message || 'Failed to fetch users' }
  }
}

export async function getUserById(id: string) {
  try {
    // Check if Clerk is properly configured with valid keys
    if (!process.env.CLERK_SECRET_KEY || 
        process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here' ||
        process.env.CLERK_SECRET_KEY.length < 10) {
      const mockUsers = getMockUsers()
      const user = mockUsers.data?.find(u => u.id === id)
      return { data: user || null, error: user ? null : 'User not found' }
    }

    const client = await clerkClient()
    const user = await client.users.getUser(id)
    
    const supabase = createServerClient()
    
    // Get order statistics for this user
    const { data: orderStats, error: orderError } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('user_id', id)
    
    let totalOrders = 0
    let totalSpent = 0
    
    if (!orderError && orderStats) {
      totalOrders = orderStats.length
      totalSpent = orderStats.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
    }

    const userProfile: UserProfile = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phoneNumbers[0]?.phoneNumber || undefined,
      avatar: user.imageUrl || undefined,
      emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
      phoneVerified: user.phoneNumbers[0]?.verification?.status === 'verified',
      lastLogin: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : undefined,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
      role: user.publicMetadata?.role as string || 'customer',
      status: user.banned ? 'suspended' : (user.locked ? 'inactive' : 'active'),
      totalOrders,
      totalSpent
    }

    return { data: userProfile, error: null }
  } catch (error: any) {
    console.error('Error fetching user:', error)
    
    // If Clerk is not configured, return mock data
    if (error.message?.includes('Missing Clerk Secret Key') || 
        error.message?.includes('CLERK_SECRET_KEY') ||
        error.status === 401 ||
        error.message?.includes('Unauthorized')) {
      const mockUsers = getMockUsers()
      const user = mockUsers.data?.find(u => u.id === id)
      return { data: user || null, error: user ? null : 'User not found' }
    }
    
    return { data: null, error: error.message || 'Failed to fetch user' }
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    if (!process.env.CLERK_SECRET_KEY || 
        process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here' ||
        process.env.CLERK_SECRET_KEY.length < 10) {
      return { error: null }
    }

    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role }
    })

    return { error: null }
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return { error: error.message || 'Failed to update user role' }
  }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended') {
  try {
    if (!process.env.CLERK_SECRET_KEY || 
        process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here' ||
        process.env.CLERK_SECRET_KEY.length < 10) {
      return { error: null }
    }

    const client = await clerkClient()
    
    if (status === 'suspended') {
      await client.users.banUser(userId)
    } else if (status === 'inactive') {
      await client.users.lockUser(userId)
    } else {
      // Unban and unlock for active status
      await client.users.unbanUser(userId)
      await client.users.unlockUser(userId)
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error updating user status:', error)
    return { error: error.message || 'Failed to update user status' }
  }
}

export async function deleteUser(userId: string) {
  try {
    if (!process.env.CLERK_SECRET_KEY || 
        process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here' ||
        process.env.CLERK_SECRET_KEY.length < 10) {
      return { error: null }
    }

    const client = await clerkClient()
    await client.users.deleteUser(userId)
    return { error: null }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return { error: error.message || 'Failed to delete user' }
  }
}

export async function getUserStats() {
  try {
    if (!process.env.CLERK_SECRET_KEY || 
        process.env.CLERK_SECRET_KEY === 'your_clerk_secret_key_here' ||
        process.env.CLERK_SECRET_KEY.length < 10) {
      const mockUsers = getMockUsers()
      const users = mockUsers.data || []
      
      const stats = {
        total: users.length,
        active: users.filter(user => user.status === 'active').length,
        inactive: users.filter(user => user.status === 'inactive').length,
        suspended: users.filter(user => user.status === 'suspended').length,
        admins: users.filter(user => user.role === 'admin').length,
        customers: users.filter(user => user.role === 'customer').length,
        verified: users.filter(user => user.emailVerified).length
      }
      
      return { data: stats, error: null }
    }

    const client = await clerkClient()
    const users = await client.users.getUserList({ limit: 1000 })
    
    const stats = {
      total: users.data.length,
      active: users.data.filter((user: User) => !user.banned && !user.locked).length,
      inactive: users.data.filter((user: User) => user.locked).length,
      suspended: users.data.filter((user: User) => user.banned).length,
      admins: users.data.filter((user: User) => user.publicMetadata?.role === 'admin').length,
      customers: users.data.filter((user: User) => (user.publicMetadata?.role || 'customer') === 'customer').length,
      verified: users.data.filter((user: User) => 
        user.emailAddresses[0]?.verification?.status === 'verified'
      ).length
    }

    return { data: stats, error: null }
  } catch (error: any) {
    console.error('Error fetching user stats:', error)
    return { data: null, error: error.message || 'Failed to fetch user stats' }
  }
}
