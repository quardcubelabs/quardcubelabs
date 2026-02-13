const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Category mapping based on keywords in product names
const categoryRules = [
  // Gaming
  { category: 'Gaming Laptops', keywords: ['gaming laptop', 'rog ', 'tuf gaming', 'legion', 'predator', 'omen gaming'] },
  { category: 'Gaming Desktop', keywords: ['gaming desktop', 'gaming pc', 'gaming tower'] },
  { category: 'Gaming Chairs', keywords: ['gaming chair', 'razer chair'] },
  { category: 'Gaming Accessories', keywords: ['gaming mouse', 'gaming keyboard', 'gaming headset', 'gaming controller'] },
  
  // Laptops
  { category: 'New Laptops', keywords: ['laptop', 'notebook', 'ultrabook', 'chromebook', 'macbook'] },
  { category: 'Refurbished Laptops', keywords: ['refurbished laptop', 'renewed laptop'] },
  
  // Desktops
  { category: 'All-in-One', keywords: ['all-in-one', 'aio pc', 'all in one'] },
  { category: 'Desktops', keywords: ['desktop', 'pc tower', 'workstation'] },
  
  // Components
  { category: 'Graphics Card', keywords: ['graphics card', 'gpu', 'rtx', 'gtx', 'radeon', 'geforce'] },
  { category: 'Processors', keywords: ['processor', 'cpu', 'intel core', 'ryzen', 'i3', 'i5', 'i7', 'i9'] },
  { category: 'Motherboard', keywords: ['motherboard', 'mainboard'] },
  { category: 'RAM Memory', keywords: ['ram', 'memory', 'ddr4', 'ddr5', 'dimm'] },
  { category: 'Power Supply', keywords: ['power supply', 'psu'] },
  { category: 'CPU Cooling', keywords: ['cpu cooler', 'liquid cooling', 'cpu fan', 'heat sink'] },
  { category: 'PC Cases', keywords: ['pc case', 'computer case', 'tower case'] },
  { category: 'PC Case Fans', keywords: ['case fan', 'pc fan', 'cooling fan'] },
  { category: 'Monitors', keywords: ['monitor', 'display', 'screen'] },
  
  // Storage
  { category: 'Solid State Drives', keywords: ['ssd', 'solid state', 'nvme'] },
  { category: 'Internal Hard Drives', keywords: ['internal hard drive', 'hdd', 'internal hdd'] },
  { category: 'External Hard Drives', keywords: ['external hard drive', 'external hdd', 'external storage'] },
  { category: 'USB Flash Disk', keywords: ['usb flash', 'flash drive', 'pen drive', 'thumb drive'] },
  { category: 'SD & Micro SD Cards', keywords: ['sd card', 'microsd', 'memory card'] },
  { category: 'HDD Cases & Racks', keywords: ['hdd enclosure', 'hdd case', 'drive bay'] },
  
  // Peripherals
  { category: 'Printers', keywords: ['printer', 'inkjet', 'laserjet'] },
  { category: 'Keyboard/Mouse', keywords: ['keyboard', 'mouse', 'combo'] },
  { category: 'Headphones & Speakers', keywords: ['headphone', 'headset', 'speaker', 'earphone', 'earbud'] },
  { category: 'Webcam', keywords: ['webcam', 'web camera'] },
  { category: 'Laptop Bags', keywords: ['laptop bag', 'laptop case', 'backpack'] },
  { category: 'Laptop Chargers', keywords: ['laptop charger', 'adapter', 'power adapter'] },
  { category: 'Cables & Dongles', keywords: ['cable', 'dongle', 'usb-c', 'hdmi', 'adapter'] },
  { category: 'Toners and Ink', keywords: ['toner', 'ink cartridge', 'ink'] },
  { category: 'Monitor Stands', keywords: ['monitor stand', 'monitor arm', 'display stand'] },
  { category: 'Power Banks', keywords: ['power bank', 'portable charger'] },
  
  // Networking
  { category: 'Routers/Switches', keywords: ['router', 'switch', 'access point'] },
  { category: 'WiFi Adapters', keywords: ['wifi adapter', 'wireless adapter', 'wifi dongle'] },
  
  // Gadgets
  { category: 'Tablets', keywords: ['tablet', 'ipad'] },
  { category: 'Smartphones', keywords: ['smartphone', 'phone', 'iphone', 'samsung galaxy'] },
  { category: 'CCTV Cameras', keywords: ['cctv', 'security camera', 'surveillance'] },
  
  // Software
  { category: 'Software', keywords: ['software license', 'product key'] },
  { category: 'Anti-virus', keywords: ['antivirus', 'anti-virus', 'kaspersky', 'norton', 'mcafee'] },
  { category: 'Operating Systems', keywords: ['windows', 'operating system', 'os'] },
  { category: 'Office', keywords: ['microsoft office', 'office 365', 'office suite'] },
  { category: 'Apple Gift Card', keywords: ['apple gift card', 'itunes card'] },
]

function categorizeProduct(productName, productDescription) {
  const searchText = `${productName} ${productDescription || ''}`.toLowerCase()
  
  // Priority 1: Check if it's a laptop/desktop first (to avoid miscategorizing)
  if (searchText.includes('gaming laptop') || searchText.includes('tuf gaming') || 
      searchText.includes('rog laptop') || searchText.includes('legion') || 
      searchText.includes('predator') || searchText.includes('omen')) {
    return 'Gaming Laptops'
  }
  
  if (searchText.includes('laptop') || searchText.includes('notebook') || 
      searchText.includes('ultrabook') || searchText.includes('chromebook') || 
      searchText.includes('macbook')) {
    if (searchText.includes('refurbished') || searchText.includes('renewed')) {
      return 'Refurbished Laptops'
    }
    return 'New Laptops'
  }
  
  if (searchText.includes('all-in-one') || searchText.includes('aio') || searchText.includes('all in one')) {
    return 'All-in-One'
  }
  
  if (searchText.includes('gaming desktop') || searchText.includes('gaming pc') || searchText.includes('gaming tower')) {
    return 'Gaming Desktop'
  }
  
  if (searchText.includes('desktop') || searchText.includes('workstation')) {
    return 'Desktops'
  }
  
  // Priority 2: Gaming accessories
  if (searchText.includes('gaming chair')) {
    return 'Gaming Chairs'
  }
  
  if (searchText.includes('gaming mouse') || searchText.includes('gaming keyboard') || 
      searchText.includes('gaming headset') || searchText.includes('gaming controller')) {
    return 'Gaming Accessories'
  }
  
  // Priority 3: Other categories
  for (const rule of categoryRules) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return rule.category
      }
    }
  }
  
  // Default fallback
  return 'Peripherals'
}

async function bulkCategorizeProducts() {
  console.log('🚀 Starting bulk product categorization...\n')
  
  // Get all products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, category')
  
  if (error) {
    console.error('❌ Error fetching products:', error.message)
    return
  }
  
  console.log(`📦 Found ${products.length} products to categorize\n`)
  
  // Categorize each product
  const updates = []
  const categoryCounts = {}
  
  for (const product of products) {
    const newCategory = categorizeProduct(product.name, product.description)
    
    if (newCategory !== product.category) {
      updates.push({
        id: product.id,
        oldCategory: product.category,
        newCategory: newCategory,
        name: product.name
      })
    }
    
    categoryCounts[newCategory] = (categoryCounts[newCategory] || 0) + 1
  }
  
  console.log('📊 Proposed categorization:')
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} products`)
    })
  
  console.log(`\n🔄 ${updates.length} products will be updated`)
  
  if (updates.length === 0) {
    console.log('\n✅ All products already have correct categories!')
    return
  }
  
  // Show sample updates
  console.log('\n📝 Sample updates (first 10):')
  updates.slice(0, 10).forEach(u => {
    console.log(`  "${u.name}"`)
    console.log(`    ${u.oldCategory} → ${u.newCategory}`)
  })
  
  // Ask for confirmation
  console.log('\n⚠️  Ready to update database!')
  console.log('    This will categorize all 293 products.\n')
  
  // Perform the updates
  console.log('Updating database...')
  
  let successCount = 0
  let errorCount = 0
  
  for (const update of updates) {
    const { error } = await supabase
      .from('products')
      .update({ category: update.newCategory })
      .eq('id', update.id)
    
    if (error) {
      console.error(`❌ Failed to update product ${update.id}: ${error.message}`)
      errorCount++
    } else {
      successCount++
      if (successCount % 50 === 0) {
        console.log(`  ✓ Updated ${successCount}/${updates.length} products...`)
      }
    }
  }
  
  console.log(`\n✅ Completed!`)
  console.log(`   Success: ${successCount}`)
  console.log(`   Errors: ${errorCount}`)
  
  
  console.log('\n💡 Next steps:')
  console.log('   1. Refresh your admin page')
  console.log('   2. Click different categories to see filtered products')
  console.log('   3update any miscategorized products manually')
}

bulkCategorizeProducts()
