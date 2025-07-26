#!/usr/bin/env tsx

// Database connection test script (TypeScript version)
// Run with: npm run test-db

import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

import { testDatabaseConnection, checkDatabaseHealth } from '../lib/db-test'

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
    console.log('🔗 Current database URLs:')
    const dbUrl = process.env.POSTGRES_URL || 'Not set'
    const dbUrlPooling = process.env.POSTGRES_PRISMA_URL || 'Not set'
    const dbUrlNonPooling = process.env.POSTGRES_URL_NON_POOLING || 'Not set'
    
    console.log('  POSTGRES_URL:', dbUrl.replace(/:([^:@]+)@/, ':***@'))
    console.log('  POSTGRES_PRISMA_URL:', dbUrlPooling.replace(/:([^:@]+)@/, ':***@'))
    console.log('  POSTGRES_URL_NON_POOLING:', dbUrlNonPooling.replace(/:([^:@]+)@/, ':***@'))
  }
  
  process.exit(isConnected ? 0 : 1)
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
