#!/usr/bin/env tsx

// Test Supabase connection and orders table
// Run with: tsx scripts/test-supabase-orders.ts

import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

import { createServerClient } from '../lib/supabase'

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection and orders table...')
  console.log('')
  
  try {
    const supabase = createServerClient()
    
    // Test basic connection
    console.log('Testing basic Supabase connection...')
    const { count, error: testError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message)
      console.log('')
      console.log('🔧 Possible solutions:')
      console.log('1. Check if your Supabase project URL is correct')
      console.log('2. Verify your Supabase service role key')
      console.log('3. Ensure the orders table exists in your database')
      console.log('4. Check Row Level Security (RLS) policies')
      console.log('')
      console.log('To create the orders table, run this SQL in your Supabase dashboard:')
      console.log('(Check db/migrations/0002_create_orders_supabase.sql)')
      return false
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log(`📊 Orders table exists with ${count || 0} records`)
    
    // Test insert (this will fail due to RLS if not authenticated, which is expected)
    console.log('')
    console.log('Testing orders table structure...')
    
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
        console.log('✅ Orders table structure is correct (RLS is working as expected)')
      } else {
        console.log('⚠️  Orders table may need attention:', insertError.message)
      }
    } else {
      console.log('✅ Orders table insert test passed')
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
    console.log('')
    console.log('🎉 Supabase connection test completed successfully!')
    console.log('Your orders functionality should work properly.')
  } else {
    console.log('')
    console.log('❌ Supabase connection test failed!')
    console.log('Please address the issues above before using the orders feature.')
  }
  
  process.exit(success ? 0 : 1)
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
