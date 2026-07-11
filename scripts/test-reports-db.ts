import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    
    // Test with a simple query
    const { data, error } = await supabase
      .from('reports')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database error:', error)
      return false
    }
    
    return true
    
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}

testConnection().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('Test failed:', error)
  process.exit(1)
})
