// Database types for QuardCube Labs

export interface Service {
  id: string
  title: string
  description?: string
  short_description?: string
  price_range?: string
  category: string
  status: 'active' | 'inactive' | 'draft'
  features?: string[]
  image_url?: string
  icon?: string
  order_index: number
  meta_title?: string
  meta_description?: string
  slug?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  client?: string
  description?: string
  short_description?: string
  technologies?: string[]
  category: string
  status: 'completed' | 'in_progress' | 'planned' | 'cancelled'
  project_url?: string
  github_url?: string
  image_url?: string
  images?: string[]
  start_date?: string
  end_date?: string
  budget?: number
  team_size?: number
  featured: boolean
  order_index: number
  meta_title?: string
  meta_description?: string
  slug?: string
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  title: string
  department: string
  location: string
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  experience_level: 'entry' | 'mid' | 'senior' | 'lead'
  description?: string
  requirements?: string[]
  responsibilities?: string[]
  benefits?: string[]
  salary_range?: string
  status: 'open' | 'closed' | 'draft'
  remote_allowed: boolean
  featured: boolean
  application_deadline?: string
  order_index: number
  meta_title?: string
  meta_description?: string
  slug?: string
  created_at: string
  updated_at: string
}

export interface Blog {
  id: string
  title: string
  content?: string
  excerpt?: string
  author: string
  category: string
  tags?: string[]
  status: 'draft' | 'published' | 'scheduled'
  featured_image?: string
  images?: string[]
  published_at?: string
  scheduled_at?: string
  reading_time: number
  view_count: number
  featured: boolean
  allow_comments: boolean
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  slug?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  description: string
  features: string[]
  stock: number
  rating: number
}

export interface Category {
  id: number
  name: string
}

// Form data interfaces for admin
export interface ServiceFormData {
  title: string
  description: string
  short_description: string
  price_range: string
  category: string
  status: 'active' | 'inactive' | 'draft'
  features: string[]
  image_url: string
  icon: string
  order_index: number
  meta_title: string
  meta_description: string
}

export interface ProjectFormData {
  title: string
  client: string
  description: string
  short_description: string
  technologies: string[]
  category: string
  status: 'completed' | 'in_progress' | 'planned' | 'cancelled'
  project_url: string
  github_url: string
  image_url: string
  start_date: string
  end_date: string
  budget: number
  team_size: number
  featured: boolean
  order_index: number
  meta_title: string
  meta_description: string
}

export interface PositionFormData {
  title: string
  department: string
  location: string
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  experience_level: 'entry' | 'mid' | 'senior' | 'lead'
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salary_range: string
  status: 'open' | 'closed' | 'draft'
  remote_allowed: boolean
  featured: boolean
  application_deadline: string
  order_index: number
  meta_title: string
  meta_description: string
}

export interface BlogFormData {
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'scheduled'
  featured_image: string
  scheduled_at: string
  featured: boolean
  allow_comments: boolean
  meta_title: string
  meta_description: string
  meta_keywords: string
}

export interface ProductFormData {
  name: string
  category: string
  price: number
  image: string
  description: string
  features: string[]
  stock: number
  rating: number
}
