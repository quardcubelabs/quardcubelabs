"use server"

import { createServerClient } from "@/lib/supabase"
import { verifyAdminSession } from "./admin-auth"
import type { Blog } from "@/types/database"

export async function getBlogs() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching blogs:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getBlogs:', error)
    return { data: null, error: error.message }
  }
}

export async function getBlogById(id: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching blog:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getBlogById:', error)
    return { data: null, error: error.message }
  }
}

export async function getBlogBySlug(slug: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()
    
    if (error) {
      console.error('Error fetching blog by slug:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getBlogBySlug:', error)
    return { data: null, error: error.message }
  }
}

export async function createBlog(blogData: Omit<Blog, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { data: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Generate slug from title if not provided
    if (!blogData.slug) {
      blogData.slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    // Calculate reading time based on content length (roughly 200 words per minute)
    if (blogData.content && !blogData.reading_time) {
      const wordCount = blogData.content.split(/\s+/).length
      blogData.reading_time = Math.ceil(wordCount / 200)
    }
    
    // Set published_at if status is published and not already set
    if (blogData.status === 'published' && !blogData.published_at) {
      blogData.published_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('blogs')
      .insert(blogData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating blog:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in createBlog:', error)
    return { data: null, error: error.message }
  }
}

export async function updateBlog(id: string, blogData: Partial<Blog>) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { data: null, error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    // Update slug if title changed
    if (blogData.title && !blogData.slug) {
      blogData.slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
    }
    
    // Recalculate reading time if content changed
    if (blogData.content) {
      const wordCount = blogData.content.split(/\s+/).length
      blogData.reading_time = Math.ceil(wordCount / 200)
    }
    
    // Set published_at if status changed to published
    if (blogData.status === 'published' && !blogData.published_at) {
      blogData.published_at = new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('blogs')
      .update(blogData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating blog:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updateBlog:', error)
    return { data: null, error: error.message }
  }
}

export async function deleteBlog(id: string) {
  try {
    const { isAdmin } = await verifyAdminSession()
    if (!isAdmin) {
      return { error: "Unauthorized: Admin privileges required" }
    }

    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting blog:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Error in deleteBlog:', error)
    return { error: error.message }
  }
}

export async function incrementBlogViews(id: string) {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase.rpc('increment_blog_views', { blog_id: id })
    
    if (error) {
      console.error('Error incrementing blog views:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Error in incrementBlogViews:', error)
    return { error: error.message }
  }
}

export async function getPublishedBlogs() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching published blogs:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getPublishedBlogs:', error)
    return { data: null, error: error.message }
  }
}

export async function getFeaturedBlogs() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('featured', true)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
    
    if (error) {
      console.error('Error fetching featured blogs:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getFeaturedBlogs:', error)
    return { data: null, error: error.message }
  }
}

export async function getBlogsByCategory(category: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('category', category)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching blogs by category:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getBlogsByCategory:', error)
    return { data: null, error: error.message }
  }
}
