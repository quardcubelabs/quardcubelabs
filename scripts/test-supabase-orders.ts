#!/usr/bin/env tsx

// Test Supabase connection and orders table
// Run with: tsx scripts/test-supabase-orders.ts

import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

import { createServerClient } from '../lib/supabase'

async function testSupabaseConnection() {
  
  try {
    const supabase = createServerClient()
    
    // Test basic connection
    const { count, error: testError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message)
      return false
    }
    
    
    // Test insert (this will fail due to RLS if not authenticated, which is expected)
    
    const testOrder = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      date: new Date().toISOString(),
      items: [{ id: '1', name: 'Test Product', quantity: 1, price: 100, image: '/test.jpg' }],
      total: '100',
      status: 'pending'
    }
    
    const { error: insertError } = await supabase
      .from('orders')
      .insert([testOrder])
    
    if (insertError) {
      if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
      } else {
      }
    } else {
    }
    
    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

async function main() {
  const success = await testSupabaseConnection()
  
  if (success) {
  } else {
  }
  
  process.exit(success ? 0 : 1)
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
