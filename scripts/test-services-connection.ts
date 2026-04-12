import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testConnection() {

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
    } else {
    }
  } catch (err) {
    console.error('Error:', err)
  }
}

testConnection()
