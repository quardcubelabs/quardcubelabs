const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const supabase = createClient(
  'https://knwhislemfzeatkujwcz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud2hpc2xlbWZ6ZWF0a3Vqd2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTQ5NzgsImV4cCI6MjA2MDIzMDk3OH0.E_x5fqi74z9pUw5_GcQU5gOBuetrwxROVIoKFbb2xrs'
);

const PRICE_CUT = 20000;

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function mapCategory(raw, name) {
  const combined = `${raw} ${name}`.toLowerCase();
  if (combined.includes("laptop") || combined.includes("notebook") || combined.includes("macbook")) {
    if (combined.includes("gaming")) return "Gaming Laptops";
    if (combined.includes("refurbish") || combined.includes("used")) return "Refurbished Laptops";
    return "New Laptops";
  }
  if (combined.includes("all-in-one") || combined.includes("aio")) return "All-in-One";
  if (combined.includes("desktop") || combined.includes("tower") || combined.includes("optiplex") || combined.includes("workstation")) {
    if (combined.includes("gaming")) return "Gaming Desktop";
    return "Desktops";
  }
  if (combined.includes("ups") || combined.includes("power backup") || combined.includes("back-up") || combined.includes("battery")) return "UPS";
  if (combined.includes("printer") || combined.includes("laserjet") || combined.includes("ecotank") || combined.includes("photocopier") || combined.includes("scanner")) return "Printers";
  if (combined.includes("toner") || combined.includes("cartridge") || combined.includes("ink")) return "Toners and Ink";
  if (combined.includes("monitor") || combined.includes("display") || combined.includes("tft")) return "Monitors";
  if (combined.includes("router") || combined.includes("switch") || combined.includes("access point") || combined.includes("networking") || combined.includes("mesh")) return "Routers/Switches";
  if (combined.includes("cctv") || combined.includes("surveillance") || combined.includes("camera")) return "CCTV Cameras";
  if (combined.includes("ssd") || combined.includes("solid state")) return "Solid State Drives";
  if (combined.includes("hard drive") || combined.includes("hdd")) return "Internal Hard Drives";
  if (combined.includes("external hard")) return "External Hard Drives";
  if (combined.includes("flash drive") || combined.includes("usb flash")) return "USB Flash Disk";
  if (combined.includes("keyboard") || combined.includes("mouse")) return "Keyboard/Mouse";
  if (combined.includes("headphone") || combined.includes("headset") || combined.includes("speaker")) return "Headphones & Speakers";
  if (combined.includes("software") || combined.includes("anti-virus")) return "Software";
  if (combined.includes("projector")) return "Gadgets & Accessories";
  return "Gadgets & Accessories";
}

async function run() {
  console.log("=== STARTING MAISHA COMPUTERS FULL CATALOG IMPORT ===");
  const xml = await fetchUrl("https://maishacomputers.com/sitemap.xml");
  const matches = Array.from(xml.matchAll(/<loc>(https:\/\/maishacomputers\.com\/product\/[^<]+)<\/loc>/g)).map(m => m[1]);
  console.log(`Discovered ${matches.length} products in sitemap.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const batchSize = 10;
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    await Promise.all(batch.map(async (url) => {
      try {
        const html = await fetchUrl(url);
        const $ = cheerio.load(html);

        let name = '';
        let rawPrice = 0;
        let image = '';
        let description = '';
        let rawCat = '';

        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const data = JSON.parse($(el).html());
            if (data['@type'] === 'Product') {
              if (data.name) name = data.name.trim();
              if (data.description) description = data.description.trim();
              if (data.image) image = Array.isArray(data.image) ? data.image[0] : (typeof data.image === 'string' ? data.image : data.image?.url || '');
              const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
              if (offer && offer.price) {
                const p = parseFloat(String(offer.price).replace(/[^0-9.]/g, ''));
                if (!isNaN(p) && p > 0) rawPrice = p;
              }
            }
            if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
              const crumbs = data.itemListElement.map(b => b.name).filter(n => n && n !== 'Home' && n !== 'Shop');
              if (crumbs.length > 0) rawCat = crumbs[crumbs.length - 1];
            }
          } catch (e) {}
        });

        if (!name) name = $('h1').first().text().trim();
        if (!image) image = $('meta[property="og:image"]').attr('content') || '';
        if (!description) description = $('meta[name="description"]').attr('content') || `High performance ${name} tailored for professional productivity.`;

        if (!name || rawPrice <= 0) {
          skipped++;
          return;
        }

        const finalPrice = Math.round(rawPrice + PRICE_CUT);
        const category = mapCategory(rawCat, name);

        // Check if product exists in Supabase
        const { data: existing } = await supabase
          .from('products')
          .select('id, price')
          .ilike('name', name)
          .limit(1);

        if (existing && existing.length > 0) {
          const res = await supabase.from('products').update({
            price: finalPrice,
            image: image || undefined,
            features: [`__source_url:${url}__`, 'Original Manufacturer Certified', 'Official Warranty Included'],
            stock: 15,
          }).eq('id', existing[0].id);
          if (res.error) console.error("Update error:", res.error);
          else updated++;
        } else {
          const res = await supabase.from('products').insert({
            name,
            price: finalPrice,
            image: image || '/placeholder.svg',
            category,
            description: description.slice(0, 1000),
            features: [`__source_url:${url}__`, 'Original Manufacturer Certified', 'Official Warranty Included'],
            stock: 15,
            rating: 5,
            swatch_images: [],
          });
          if (res.error) console.error("Insert error:", res.error);
          else created++;
        }
      } catch (err) {
        console.error(`Failed ${url}:`, err.message);
        skipped++;
      }
    }));

    if ((i + batchSize) % 50 === 0 || i + batchSize >= matches.length) {
      console.log(`Progress: ${Math.min(i + batchSize, matches.length)}/${matches.length} | Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
    }
  }

  console.log(`=== FINISHED IMPORT: Created ${created}, Updated ${updated}, Skipped ${skipped} ===`);
}

run().catch(console.error);

