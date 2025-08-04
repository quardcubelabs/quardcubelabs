"use server"

import { createServerClient } from "@/lib/supabase"

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  last_sign_in_at?: string
  created_at: string
  updated_at?: string
  user_metadata: {
    firstName?: string
    lastName?: string
    full_name?: string
    avatar_url?: string
    [key: string]: any
  }
  app_metadata: {
    provider?: string
    providers?: string[]
    [key: string]: any
  }
  aud?: string
  role?: string
}

export interface UserStats {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  recentSignups: number
}

export async function getAuthUsers(): Promise<{ users: AuthUser[], error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Adjust as needed
    })

    if (error) {
      console.error("Error fetching auth users:", error)
      return { users: [], error: error.message }
    }

    return { users: data.users || [], error: null }
  } catch (error) {
    console.error("Error in getAuthUsers:", error)
    return { users: [], error: "Failed to fetch users" }
  }
}

export async function getAuthUserById(userId: string): Promise<{ user: AuthUser | null, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error) {
      console.error("Error fetching auth user:", error)
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Error in getAuthUserById:", error)
    return { user: null, error: "Failed to fetch user" }
  }
}

export async function deleteAuthUser(userId: string): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error("Error deleting auth user:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in deleteAuthUser:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export async function updateAuthUserMetadata(
  userId: string, 
  metadata: { user_metadata?: any, app_metadata?: any }
): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase.auth.admin.updateUserById(userId, metadata)

    if (error) {
      console.error("Error updating auth user metadata:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in updateAuthUserMetadata:", error)
    return { success: false, error: "Failed to update user metadata" }
  }
}

export async function getUserStats(): Promise<{ stats: UserStats | null, error: string | null }> {
  try {
    const { users, error } = await getAuthUsers()
    
    if (error) {
      return { stats: null, error }
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const stats: UserStats = {
      totalUsers: users.length,
      verifiedUsers: users.filter(user => user.email_confirmed_at).length,
      unverifiedUsers: users.filter(user => !user.email_confirmed_at).length,
      recentSignups: users.filter(user => 
        new Date(user.created_at) > thirtyDaysAgo
      ).length
    }

    return { stats, error: null }
  } catch (error) {
    console.error("Error in getUserStats:", error)
    return { stats: null, error: "Failed to get user statistics" }
  }
}

export async function inviteUser(email: string, metadata?: any): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: metadata,
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    })

    if (error) {
      console.error("Error inviting user:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in inviteUser:", error)
    return { success: false, error: "Failed to invite user" }
  }
}

export async function resendConfirmation(userId: string): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = createServerClient()
    
    // Get user email first
    const { user, error: getUserError } = await getAuthUserById(userId)
    if (getUserError || !user || !user.email) {
      return { success: false, error: "User not found or email not available" }
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email
    })

    if (error) {
      console.error("Error resending confirmation:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error("Error in resendConfirmation:", error)
    return { success: false, error: "Failed to resend confirmation" }
  }
}
