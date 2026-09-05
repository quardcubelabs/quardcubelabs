"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import type { Service } from "@/types/database"

export async function getServices() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching services:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getServices:', error)
    return { data: null, error: error.message }
  }
}

export async function getServiceById(id: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching service:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getServiceById:', error)
    return { data: null, error: error.message }
  }
}

export async function createService(serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { data: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Generate slug from title if not provided
    if (!serviceData.slug) {
      serviceData.slug = serviceData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating service:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in createService:', error)
    return { data: null, error: error.message }
  }
}

export async function updateService(id: string, serviceData: Partial<Service>) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { data: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Update slug if title changed
    if (serviceData.title && !serviceData.slug) {
      serviceData.slug = serviceData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    const { data, error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating service:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updateService:', error)
    return { data: null, error: error.message }
  }
}

export async function deleteService(id: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting service:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Error in deleteService:', error)
    return { error: error.message }
  }
}

export async function getPublicServices() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')
      .order('order_index', { ascending: true })
    
    if (error) {
      console.error('Error fetching public services:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getPublicServices:', error)
    return { data: null, error: error.message }
  }
}
