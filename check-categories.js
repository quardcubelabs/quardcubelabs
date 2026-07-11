const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkCategories() {
  console.log('Checking category data...\n')
  
  // Get all unique categories from products
  const { data: products } = await supabase
    .from('products')
    .select('category')
  
  const uniqueProductCategories = [...new Set(products?.map(p => p.category))].sort()
  
  console.log('Unique categories in products table:')
  uniqueProductCategories.forEach(cat => console.log(`  - "${cat}"`))
  
  // Get categories from categories table
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
  
  console.log('\nCategories in categories table:')
  categories?.forEach(cat => console.log(`  - id: ${cat.id}, name: "${cat.name}"`))
  
  // Check for mismatches
  console.log('\nMismatch check:')
  const categoryNames = categories?.map(c => c.name) || []
  uniqueProductCategories.forEach(prodCat => {
    const hasMatch = categoryNames.includes(prodCat)
    if (!hasMatch) {
      console.log(`  ⚠️  Product category "${prodCat}" not in categories table`)
    }
  })
  
  // Sample products per category
  console.log('\nSample products per category:')
  for (const cat of uniqueProductCategories.slice(0, 5)) {
    const { data, count } = await supabase
      .from('products')
      .select('id, name', { count: 'exact' })
      .eq('category', cat)
      .limit(1)
    
    console.log(`  ${cat}: ${count} products (e.g., "${data?.[0]?.name}")`)
  }
}

checkCategories()
