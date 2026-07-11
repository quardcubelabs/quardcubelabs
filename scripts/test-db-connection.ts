#!/usr/bin/env tsx

// Database connection test script (TypeScript version)
// Run with: npm run test-db

import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

import { testDatabaseConnection, checkDatabaseHealth } from '../lib/db-test'

async function main() {
  
  const isConnected = await testDatabaseConnection()
  
  if (isConnected) {
    
    // Check database health
    const health = await checkDatabaseHealth()
    
    if (health.tablesExist) {
    } else {
    }
  } else {
    const dbUrl = process.env.POSTGRES_URL || 'Not set'
    const dbUrlPooling = process.env.POSTGRES_PRISMA_URL || 'Not set'
    const dbUrlNonPooling = process.env.POSTGRES_URL_NON_POOLING || 'Not set'
    
  }
  
  process.exit(isConnected ? 0 : 1)
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
