const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function showSamples() {
  const {data} = await supabase.from('products').select('name').range(0, 30)
  console.log('Sample product names:')
  data.forEach((p, i) => console.log(`${i+1}. ${p.name}`))
}

showSamples()
