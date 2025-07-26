#!/usr/bin/env node

// Simple database connection test script
// Run with: node scripts/test-db-connection.js

import { testDatabaseConnection, checkDatabaseHealth } from '../lib/db-test.js'

async function main() {
  console.log('🔍 Testing database connection...')
  console.log('')
  
  const isConnected = await testDatabaseConnection()
  
  if (isConnected) {
    console.log('✅ Database connection successful!')
    
    // Check database health
    const health = await checkDatabaseHealth()
    
    if (health.tablesExist) {
      console.log('✅ Database tables are accessible')
      console.log('🎉 Your database is working properly!')
    } else {
      console.log('⚠️  Database connected but tables may be missing')
      console.log('You may need to run database migrations')
    }
  } else {
    console.log('❌ Database connection failed!')
    console.log('')
    console.log('🔧 Possible solutions:')
    console.log('1. Check if your Supabase project is active (not paused)')
    console.log('2. Verify your database URL in .env.local')
    console.log('3. Check your internet connection')
    console.log('4. Try accessing your Supabase dashboard')
    console.log('5. Contact Supabase support if the issue persists')
    console.log('')
    console.log('🔗 Current database URL (redacted):')
    const dbUrl = process.env.POSTGRES_URL || 'Not set'
    const redacted = dbUrl.replace(/:([^:@]+)@/, ':***@')
    console.log(redacted)
  }
  
  process.exit(isConnected ? 0 : 1)
}

main().catch(console.error)
