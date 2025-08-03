import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Service Key exists:', !!supabaseServiceKey)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
    } else {
      console.log('Connection successful!')
      console.log('Data:', data)
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

testConnection()
