"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import type { Position } from "@/types/database"

export async function getPositions() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching positions:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getPositions:', error)
    return { data: null, error: error.message }
  }
}

export async function getPositionById(id: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching position:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getPositionById:', error)
    return { data: null, error: error.message }
  }
}

export async function createPosition(positionData: Omit<Position, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { data: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Generate slug from title if not provided
    if (!positionData.slug) {
      positionData.slug = positionData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    const { data, error } = await supabase
      .from('positions')
      .insert(positionData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating position:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in createPosition:', error)
    return { data: null, error: error.message }
  }
}

export async function updatePosition(id: string, positionData: Partial<Position>) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { data: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Update slug if title changed
    if (positionData.title && !positionData.slug) {
      positionData.slug = positionData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    const { data, error } = await supabase
      .from('positions')
      .update(positionData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating position:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updatePosition:', error)
    return { data: null, error: error.message }
  }
}

export async function deletePosition(id: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting position:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Error in deletePosition:', error)
    return { error: error.message }
  }
}

export async function getOpenPositions() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('status', 'open')
      .order('featured', { ascending: false })
      .order('order_index', { ascending: true })
    
    if (error) {
      console.error('Error fetching open positions:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getOpenPositions:', error)
    return { data: null, error: error.message }
  }
}

export async function getFeaturedPositions() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('featured', true)
      .eq('status', 'open')
      .order('order_index', { ascending: true })
      .limit(3)
    
    if (error) {
      console.error('Error fetching featured positions:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getFeaturedPositions:', error)
    return { data: null, error: error.message }
  }
}
