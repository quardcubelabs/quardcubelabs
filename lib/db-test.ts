// Database connection test utility
import { db } from './db'
import { sql } from 'drizzle-orm'

export async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...')
    
    // Simple test query using Drizzle syntax
    const result = await db.execute(sql`SELECT 1 as test`)
    console.log('Database connection successful:', result)
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.error('❌ Database hostname could not be resolved')
        console.error('This usually means:')
        console.error('1. The Supabase project is paused or deleted')
        console.error('2. The database URL has changed')
        console.error('3. Network connectivity issues')
      } else if (error.message.includes('authentication')) {
        console.error('❌ Database authentication failed')
        console.error('Please check your database credentials')
      } else if (error.message.includes('timeout')) {
        console.error('❌ Database connection timeout')
        console.error('The database might be overloaded or unreachable')
      }
    }
    
    return false
  }
}

export async function fallbackGetOrders(userId: string) {
  // Return mock data when database is unavailable
  console.warn('Using fallback data due to database connection issues')
  
  return [
    {
      id: 'mock-order-1',
      userId,
      date: new Date(),
      status: 'pending' as const,
      items: [],
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]
}

export async function checkDatabaseHealth() {
  try {
    // Test basic connectivity
    await db.execute(sql`SELECT 1`)
    
    // Test table access
    const tableCheck = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'orders' LIMIT 1`)
    
    if (tableCheck.length === 0) {
      console.warn('⚠️  Orders table not found - may need migration')
      return { connected: true, tablesExist: false }
    }
    
    return { connected: true, tablesExist: true }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { connected: false, tablesExist: false, error }
  }
}
