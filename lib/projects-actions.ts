"use server"

import { createServerClient } from "@/lib/supabase"
import type { Project } from "@/types/database"

export async function getProjects() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching projects:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getProjects:', error)
    return { data: null, error: error.message }
  }
}

export async function getProjectById(id: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching project:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getProjectById:', error)
    return { data: null, error: error.message }
  }
}

export async function createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = createServerClient()
    
    // Generate slug from title if not provided
    if (!projectData.slug) {
      projectData.slug = projectData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating project:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in createProject:', error)
    return { data: null, error: error.message }
  }
}

export async function updateProject(id: string, projectData: Partial<Project>) {
  try {
    const supabase = createServerClient()
    
    // Update slug if title changed
    if (projectData.title && !projectData.slug) {
      projectData.slug = projectData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating project:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updateProject:', error)
    return { data: null, error: error.message }
  }
}

export async function deleteProject(id: string) {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting project:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Error in deleteProject:', error)
    return { error: error.message }
  }
}

export async function getPublicProjects() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', ['completed', 'in_progress'])
      .order('featured', { ascending: false })
      .order('order_index', { ascending: true })
    
    if (error) {
      console.error('Error fetching public projects:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getPublicProjects:', error)
    return { data: null, error: error.message }
  }
}

export async function getFeaturedProjects() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('featured', true)
      .in('status', ['completed', 'in_progress'])
      .order('order_index', { ascending: true })
      .limit(6)
    
    if (error) {
      console.error('Error fetching featured projects:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getFeaturedProjects:', error)
    return { data: null, error: error.message }
  }
}
