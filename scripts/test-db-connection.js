#!/usr/bin/env node

// Simple database connection test script (CommonJS version)
// Run with: node scripts/test-db-connection.js

const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Since we can't easily import ES modules in CommonJS, let's create a simpler test
async function testBasicConnection() {
  console.log('🔍 Testing database connection...')
  console.log('')
  
  // Check if environment variables are set
  const requiredEnvVars = [
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL', 
    'POSTGRES_URL_NON_POOLING',
    'SUPABASE_URL'
  ]
  
  let allEnvVarsSet = true
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`❌ Missing environment variable: ${envVar}`)
      allEnvVarsSet = false
    } else {
      console.log(`✅ ${envVar} is set`)
    }
  }
  
  if (!allEnvVarsSet) {
    console.log('')
    console.log('❌ Some required environment variables are missing!')
    console.log('Please check your .env.local file.')
    return false
  }
  
  console.log('')
  console.log('✅ All required environment variables are set')
  console.log('')
  console.log('🔗 Database URLs (redacted):')
  
  const urls = {
    'POSTGRES_URL': process.env.POSTGRES_URL,
    'POSTGRES_PRISMA_URL': process.env.POSTGRES_PRISMA_URL,
    'POSTGRES_URL_NON_POOLING': process.env.POSTGRES_URL_NON_POOLING
  }
  
  for (const [key, url] of Object.entries(urls)) {
    if (url) {
      const redacted = url.replace(/:([^:@]+)@/, ':***@')
      console.log(`  ${key}: ${redacted}`)
    }
  }
  
  console.log('')
  console.log('ℹ️  To test actual database connectivity, run: npm run test-db')
  console.log('   (This uses the TypeScript version with full database testing)')
  
  return true
}

async function main() {
  try {
    const success = await testBasicConnection()
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

main()
