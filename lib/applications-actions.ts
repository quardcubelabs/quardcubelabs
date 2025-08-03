"use server"

import { createServerClient } from "@/lib/supabase"
import type { Application } from "@/types/database"

export async function getApplications() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('applications_with_positions')
      .select('*')
      .order('applied_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching applications:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getApplications:', error)
    return { data: null, error: error.message }
  }
}

export async function getApplicationById(id: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('applications_with_positions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching application:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getApplicationById:', error)
    return { data: null, error: error.message }
  }
}

export async function getApplicationsByPositionId(positionId: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('applications_with_positions')
      .select('*')
      .eq('position_id', positionId)
      .order('applied_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching applications for position:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in getApplicationsByPositionId:', error)
    return { data: null, error: error.message }
  }
}

export async function createApplication(applicationData: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'applied_at'>) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        ...applicationData,
        applied_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating application:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in createApplication:', error)
    return { data: null, error: error.message }
  }
}

export async function updateApplicationStatus(id: string, status: Application['status'], notes?: string, reviewedBy?: string) {
  try {
    const supabase = createServerClient()
    
    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString()
    }
    
    if (notes !== undefined) updateData.notes = notes
    if (reviewedBy) updateData.reviewed_by = reviewedBy
    
    const { data, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating application status:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in updateApplicationStatus:', error)
    return { data: null, error: error.message }
  }
}

export async function scheduleInterview(id: string, interviewDate: string, notes?: string) {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('applications')
      .update({
        status: 'interview_scheduled',
        interview_date: interviewDate,
        notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error scheduling interview:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error in scheduleInterview:', error)
    return { data: null, error: error.message }
  }
}

export async function deleteApplication(id: string) {
  try {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting application:', error)
      return { error: error.message }
    }
    
    return { error: null }
  } catch (error: any) {
    console.error('Error in deleteApplication:', error)
    return { error: error.message }
  }
}

export async function getApplicationStats() {
  try {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('applications')
      .select('status, position_id')
    
    if (error) {
      console.error('Error fetching application stats:', error)
      return { data: null, error: error.message }
    }
    
    const stats = {
      total: data.length,
      pending: data.filter(app => app.status === 'pending').length,
      reviewing: data.filter(app => app.status === 'reviewing').length,
      interview_scheduled: data.filter(app => app.status === 'interview_scheduled').length,
      interview_completed: data.filter(app => app.status === 'interview_completed').length,
      hired: data.filter(app => app.status === 'hired').length,
      rejected: data.filter(app => app.status === 'rejected').length,
      by_position: data.reduce((acc: Record<string, number>, app) => {
        acc[app.position_id] = (acc[app.position_id] || 0) + 1
        return acc
      }, {})
    }
    
    return { data: stats, error: null }
  } catch (error: any) {
    console.error('Error in getApplicationStats:', error)
    return { data: null, error: error.message }
  }
}
