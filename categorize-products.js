const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function classifyProduct(name, desc = '') {
  const n = (name || '').trim()
  const nl = n.toLowerCase()

  // 1. Toners and Inks (Must check BEFORE printers and routers!)
  if (
    nl.includes('ink bottle') ||
    nl.includes('ink cartridge') ||
    nl.includes('toner cartridge') ||
    nl.includes('original ink') ||
    nl.includes('tri-color original ink') ||
    nl.includes('refillable ink') ||
    nl.includes('pigment black') ||
    nl.includes('toner') ||
    /^(epson 103|canon gi-|canon ink gi-|hp 305|hp black toner)/i.test(n)
  ) {
    return 'Toners and Ink'
  }

  // 2. Networking - Routers & Switches (Must check BEFORE laptop chargers/cables)
  if (
    nl.includes('router') ||
    nl.includes('access point') ||
    nl.includes('range extender') ||
    nl.includes('switch') ||
    nl.includes('4g lte mobile wi-fi') ||
    nl.includes('4g mobile wi-fi') ||
    nl.includes('mobile wi-fi') ||
    nl.includes('mesh wi-fi') ||
    nl.includes('compartment pvc trunking') ||
    /^(tp-?link (archer|tl-mr|m7000|ax))/i.test(n)
  ) {
    return 'Routers/Switches'
  }

  // 3. Networking - WiFi & Bluetooth Adapters
  if (
    (nl.includes('wi-fi') || nl.includes('wifi') || nl.includes('wireless') || nl.includes('bluetooth')) &&
    (nl.includes('adapter') || nl.includes('adaptor') || nl.includes('nano')) &&
    !nl.includes('power adapter') &&
    !nl.includes('laptop adapter') &&
    !nl.includes('replacement adapter')
  ) {
    return 'WiFi Adapters'
  }

  // 4. Printers
  if (
    nl.includes('printer') ||
    nl.includes('laserjet') ||
    nl.includes('ecotank') ||
    nl.includes('deskjet') ||
    nl.includes('maxify') ||
    nl.includes('pixma') ||
    /^(hp laser 107|hp color laser)/i.test(n)
  ) {
    return 'Printers'
  }

  // 5. Memory Cards & Flash Disks & Hard Drives
  if (nl.includes('micro sd') || nl.includes('microsd') || nl.includes('sdxc') || nl.includes('sdhc')) {
    return 'SD & Micro SD Cards'
  }
  if (nl.includes('flash drive') || nl.includes('flash disk') || nl.includes('cruzer glide') || nl.includes('datatraveler')) {
    return 'USB Flash Disk'
  }
  if (nl.includes('external hard drive') || nl.includes('external hdd') || nl.includes('storejet') || (nl.includes('seagate portable') && nl.includes('hdd'))) {
    return 'External Hard Drives'
  }
  if (nl.includes('internal hard drive') || nl.includes('internal hdd') || nl.includes('surveillance hard drive') || nl.includes('barracuda') || nl.includes('wd purple') || (nl.includes('toshiba') && nl.includes('sata internal'))) {
    return 'Internal Hard Drives'
  }
  if (nl.includes('nvme') || nl.includes('m.2 2280') || (nl.includes('sata') && nl.includes('ssd')) || nl.includes('solid state drive') || (nl.includes('lexar n') && nl.includes('ssd')) || (nl.includes('sandisk portable') && nl.includes('ssd')) || nl.endsWith('ssd')) {
    return 'Solid State Drives'
  }

  // 6. Laptop Accessories: Chargers, Bags, Mounts, Stands
  if (
    nl.includes('laptop charger') ||
    nl.includes('replacement adapter') ||
    nl.includes('laptop adapter') ||
    nl.includes('blue pin 65w')
  ) {
    return 'Laptop Chargers'
  }
  if (nl.includes('laptop backpack') || nl.includes('laptop bag') || nl.includes('leather sleeve bag') || nl.includes('backpack bag')) {
    return 'Laptop Bags'
  }

  // 7. Monitor & Laptop Stands, Arms, Desks
  if (
    nl.includes('monitor arm') ||
    nl.includes('monitor desk mount') ||
    nl.includes('monitor mount') ||
    nl.includes('desktop mount stand') ||
    nl.includes('flexi mount') ||
    nl.includes('single monitor arm') ||
    nl.includes('laptop stand') ||
    nl.includes('laptop mount tray') ||
    nl.includes('gas spring monitor') ||
    nl.includes('adjustable desk') ||
    nl.includes('corner desk') ||
    nl.includes('computer table') ||
    nl.includes('flexispot e')
  ) {
    return 'Monitor Stands'
  }

  // 8. Monitors
  if (
    (nl.includes('monitor') || nl.includes('display 24') || nl.includes('display 27') || nl.includes('31.5 inch fhd') || nl.includes('27 inch fhd') || /^(hp s5 524|dell 24 monitor|dell 27 monitor|dell 22 monitor|hp m24f|hp m27fw|hp series)/i.test(n)) &&
    !nl.includes('desktop') &&
    !nl.includes('stand') &&
    !nl.includes('arm') &&
    !nl.includes('mount')
  ) {
    return 'Monitors'
  }

  // 9. Chairs
  if (nl.includes('gaming chair') || nl.includes('ergonomic chair') || nl.includes('armor one') || nl.includes('fusion s') || nl.includes('hotrod') || nl.includes('dxracer') || nl.includes('flexispot bs')) {
    return 'Gaming Chairs'
  }

  // 10. Audio & Projectors
  if (nl.includes('headset') || nl.includes('headphone') || nl.includes('speaker') || nl.includes('subwoofer') || nl.includes('projector') || nl.includes('soundbar')) {
    return 'Headphones & Speakers'
  }

  // 11. Cables (Check BEFORE Power Supply so sata cable doesn't match power supply!)
  if (nl.includes('hdtv cable') || nl.includes('hdmi cable') || nl.includes('usb-c hub') || nl.includes('power supply cable') || nl.includes('adapter cable') || nl.includes('cable')) {
    return 'Cables & Dongles'
  }

  // 12. Computer Components
  if (nl.includes('motherboard')) {
    return 'Motherboard'
  }
  if (
    nl.includes('liquid cpu cooler') ||
    nl.includes('cpu liquid cooler') ||
    nl.includes('cpu cooler') ||
    nl.includes('thermal paste') ||
    /^(deepcool (ag|ls|lt|gammaxx|infinity)|deepcool z3)/i.test(n)
  ) {
    return 'CPU Cooling'
  }
  if (nl.includes('power supply') || nl.includes('psu') || /^(deepcool (pl|pf|pq)|corsair cx|gamdias helios|cougar gex)/i.test(n)) {
    return 'Power Supply'
  }
  if (nl.includes('graphics card') || nl.includes('graphic card') || /^(asus dual geforce|galax geforce|afox nvidia)/i.test(n)) {
    return 'Graphics Card'
  }
  if (nl.includes('ram for') || nl.includes('desktop ram') || nl.includes('sodimm') || nl.includes('udimm') || nl.includes('ddr4 ram') || nl.includes('ddr5') || nl.includes('kingston fury') || /^(crucial \d+gb|corsair vengeance)/i.test(n)) {
    return 'RAM Memory'
  }
  if (nl.includes('gen processor') || nl.includes('cpu intel') || /^(intel core i\d-\d+)/i.test(n)) {
    return 'Processors'
  }
  if (nl.includes('optical sata drive')) {
    return 'Components'
  }

  // 13. Full Desktop Computers & All-in-One (Check BEFORE keyboard/mouse if bundled with mouse!)
  if (nl.includes('all-in-one') || nl.includes('aio')) {
    return 'All-in-One'
  }
  if (nl.includes('gaming desktop') || nl.includes('gaming pc') || nl.includes('omen 25l')) {
    return 'Gaming Desktop'
  }
  if (
    nl.includes('tower pc') ||
    nl.includes('pro tower') ||
    nl.includes('elitedesk') ||
    nl.includes('prodesk') ||
    nl.includes('optiplex') ||
    nl.includes('vostro 3030') ||
    nl.includes('sff') ||
    (nl.includes('desktop') && !nl.includes('mount') && !nl.includes('ram') && !nl.includes('stand'))
  ) {
    return 'Desktops'
  }

  // 14. Keyboards, Mice & Gaming Accessories
  if (nl.includes('gaming mouse') || nl.includes('gaming keyboard') || nl.includes('rgb mouse pad')) {
    return 'Gaming Accessories'
  }
  if (nl.includes('mouse') || nl.includes('keyboard') || nl.includes('mousepad') || nl.includes('mouse pad')) {
    return 'Keyboard/Mouse'
  }

  // 15. Tablets & Cameras & Gadgets
  if (nl.includes('galaxy tab') || nl.includes('lenovo tab') || nl.includes('ipad') || nl.includes('tablet')) {
    return 'Tablets'
  }
  if (nl.includes('indoor camera') || nl.includes('security camera') || nl.includes('cctv')) {
    return 'CCTV Cameras'
  }
  if (
    nl.includes('power bank') ||
    nl.includes('power station') ||
    nl.includes('ups') ||
    nl.includes('apc back up') ||
    nl.includes('apc easy ups') ||
    nl.includes('camera tripod') ||
    nl.includes('canon 550d') ||
    nl.includes('video transmitter') ||
    nl.includes('video capture') ||
    nl.includes('hd camera') ||
    nl.includes('tilt pen')
  ) {
    return 'Gadgets & Accessories'
  }

  // 16. Cables
  if (nl.includes('hdtv cable') || nl.includes('hdmi cable') || nl.includes('usb-c hub') || nl.includes('power supply cable') || nl.includes('adapter cable') || nl.includes('cable')) {
    return 'Cables & Dongles'
  }

  // 17. Gaming Laptops
  if (
    nl.includes('victus') ||
    nl.includes('tuf gaming') ||
    nl.includes('omen') ||
    nl.includes('alienware') ||
    nl.includes('gaming laptop') ||
    nl.includes('legion') ||
    nl.includes('predator')
  ) {
    return 'Gaming Laptops'
  }

  // 18. Refurbished Laptops
  if (nl.includes('refurbished') || nl.includes('refurb') || nl.includes('renewed')) {
    return 'Refurbished Laptops'
  }

  // 19. New Laptops
  if (
    nl.includes('laptop') ||
    nl.includes('notebook') ||
    nl.includes('chromebook') ||
    nl.includes('macbook') ||
    nl.includes('elitebook') ||
    nl.includes('probook') ||
    nl.includes('omnibook') ||
    nl.includes('thinkpad') ||
    nl.includes('thinkbook') ||
    nl.includes('latitude') ||
    nl.includes('vostro 35') ||
    nl.includes('envy x360') ||
    nl.includes('pavilion') ||
    nl.includes('dragonfly') ||
    nl.includes('versapro') ||
    /^(hp \d{3} g\d|hp 240 g|hp 250 g|hp 1040|lenovo t14|dell 14 plus)/i.test(n)
  ) {
    return 'New Laptops'
  }

  return 'Peripherals'
}

async function runBulkCategorization() {
  console.log('🚀 Starting accurate product categorization...\n')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, category')

  if (error) {
    console.error('❌ Error fetching products:', error.message)
    return
  }

  console.log(`📦 Found ${products.length} products to evaluate\n`)

  const updates = []
  const categoryCounts = {}

  for (const product of products) {
    const newCategory = classifyProduct(product.name, product.description)
    categoryCounts[newCategory] = (categoryCounts[newCategory] || 0) + 1

    if (newCategory !== product.category) {
      updates.push({
        id: product.id,
        name: product.name,
        oldCategory: product.category,
        newCategory: newCategory
      })
    }
  }

  console.log('📊 Categorization distribution:')
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  • ${cat}: ${count} products`)
    })

  console.log(`\n🔄 ${updates.length} products to update in Supabase...`)

  if (updates.length === 0) {
    console.log('✅ All products are already perfectly categorized!')
    return
  }

  let success = 0
  let failed = 0

  for (const item of updates) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ category: item.newCategory })
      .eq('id', item.id)

    if (updateError) {
      console.error(`❌ Failed to update "${item.name}":`, updateError.message)
      failed++
    } else {
      success++
      if (success % 25 === 0 || success === updates.length) {
        console.log(`  ✓ Updated ${success}/${updates.length} products...`)
      }
    }
  }

  console.log(`\n🎉 Categorization completed!`)
  console.log(`  Successfully updated: ${success}`)
  console.log(`  Errors: ${failed}`)
}

runBulkCategorization()
