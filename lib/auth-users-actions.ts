"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"

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
    role?: string
    country?: string
    [key: string]: any
  }
  app_metadata: {
    provider?: string
    providers?: string[]
    role?: string
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

/**
 * Fetch all users from Supabase Auth & public.profiles merged
 */
export async function getAuthUsers(): Promise<{ users: AuthUser[], error: string | null }> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { users: [], error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Fetch auth users and profiles in parallel
    const [authResult, profilesResult] = await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase.from("profiles").select("*")
    ])

    if (authResult.error) {
      console.error("Error fetching auth users:", authResult.error)
      return { users: [], error: authResult.error.message }
    }

    const authUsers = authResult.data.users || []
    const profiles = profilesResult.data || []
    const profileMap = new Map(profiles.map(p => [p.id, p]))

    // Merge auth user data with profile contents
    const mergedUsers: AuthUser[] = authUsers.map(user => {
      const profile = profileMap.get(user.id)
      const userRole = profile?.role || user.user_metadata?.role || user.app_metadata?.role || (
        (user.email || "").includes("admin") || (user.email || "").startsWith("framan") ? "admin" : "customer"
      )

      return {
        id: user.id,
        email: user.email || profile?.email,
        phone: user.phone,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at || profile?.created_at,
        updated_at: user.updated_at || profile?.updated_at,
        aud: user.aud,
        role: userRole,
        user_metadata: {
          ...user.user_metadata,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split("@")[0] : "User"),
          country: profile?.country || user.user_metadata?.country,
          role: userRole,
        },
        app_metadata: {
          ...user.app_metadata,
          role: userRole,
        }
      }
    })

    return { users: mergedUsers, error: null }
  } catch (error: any) {
    console.error("Error in getAuthUsers:", error)
    return { users: [], error: "Failed to fetch users" }
  }
}

/**
 * Get user by ID with profile data
 */
export async function getAuthUserById(userId: string): Promise<{ user: AuthUser | null, error: string | null }> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { user: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    const [userRes, profileRes] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase.from("profiles").select("*").eq("id", userId).single()
    ])

    if (userRes.error || !userRes.data?.user) {
      return { user: null, error: userRes.error?.message || "User not found" }
    }

    const user = userRes.data.user
    const profile = profileRes.data
    const userRole = profile?.role || user.user_metadata?.role || user.app_metadata?.role || "customer"

    return {
      user: {
        id: user.id,
        email: user.email || profile?.email,
        phone: user.phone,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        aud: user.aud,
        role: userRole,
        user_metadata: {
          ...user.user_metadata,
          full_name: profile?.full_name || user.user_metadata?.full_name,
          country: profile?.country,
          role: userRole,
        },
        app_metadata: {
          ...user.app_metadata,
          role: userRole,
        }
      },
      error: null
    }
  } catch (error) {
    console.error("Error in getAuthUserById:", error)
    return { user: null, error: "Failed to fetch user" }
  }
}

/**
 * Delete a user from both auth.users and public.profiles
 */
export async function deleteAuthUser(userId: string): Promise<{ success: boolean, error: string | null }> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Delete from profiles first (or cascading)
    await supabase.from("profiles").delete().eq("id", userId)
    
    // Delete from auth.users
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error("Error deleting auth user:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error in deleteAuthUser:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

/**
 * Update user metadata and synchronize public.profiles
 */
export async function updateAuthUserMetadata(
  userId: string, 
  metadata: { user_metadata?: any, app_metadata?: any }
): Promise<{ success: boolean, error: string | null }> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Ensure role is placed in both metadata objects
    const role = metadata.app_metadata?.role || metadata.user_metadata?.role || "customer"
    const fullName = metadata.user_metadata?.full_name || 
      `${metadata.user_metadata?.firstName || ''} ${metadata.user_metadata?.lastName || ''}`.trim()
    const country = metadata.user_metadata?.country

    const mergedUserMeta = {
      ...metadata.user_metadata,
      role,
      full_name: fullName,
    }

    const mergedAppMeta = {
      ...metadata.app_metadata,
      role,
    }

    // 1. Update in auth.users
    const { data: updatedAuthUser, error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: mergedUserMeta,
      app_metadata: mergedAppMeta,
    })

    if (authError) {
      console.error("Error updating auth user metadata:", authError)
      return { success: false, error: authError.message }
    }

    // 2. Synchronize / Upsert to public.profiles table
    const userEmail = updatedAuthUser?.user?.email || metadata.user_metadata?.email || ""

    const profileUpsertData: any = {
      id: userId,
      email: userEmail,
      full_name: fullName,
      role: role,
      updated_at: new Date().toISOString()
    }
    if (country) {
      profileUpsertData.country = country
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileUpsertData, { onConflict: "id" })

    if (profileError) {
      console.warn("Could not upsert into public.profiles:", profileError.message)
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error in updateAuthUserMetadata:", error)
    return { success: false, error: error.message || "Failed to update user metadata" }
  }
}

/**
 * Get user stats
 */
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

/**
 * Invite user
 */
export async function inviteUser(email: string, metadata?: any): Promise<{ success: boolean, error: string | null }> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: metadata,
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`
    })

    if (error) {
      console.error("Error inviting user:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error in inviteUser:", error)
    return { success: false, error: error.message || "Failed to invite user" }
  }
}

/**
 * Resend confirmation email
 */
export async function resendConfirmation(userId: string): Promise<{ success: boolean, error: string | null }> {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
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
  } catch (error: any) {
    console.error("Error in resendConfirmation:", error)
    return { success: false, error: error.message || "Failed to resend confirmation" }
  }
}
