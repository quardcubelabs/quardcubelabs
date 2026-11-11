const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value;
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Read the scrape speed logic or import matcher
const cheerio = require('cheerio');
const EPIC_BASE_URL = 'https://epiccomputers.co.tz';
const EPIC_SHOP_URL = `${EPIC_BASE_URL}/shop-2/`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function normalizeText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[″”"''`]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractNumbersAndCodes(str) {
  if (!str) return [];
  const norm = str.toLowerCase();
  const matches = norm.match(/\b(\d+gb|\d+tb|\d+m|\d+va|\d+w|i[3579]|ryzen\s*[3579]|rtx\s*\d{4}|gtx\s*\d{4}|g\d{1,2}|\d{3,5}[a-z]*)\b/gi) || [];
  return matches.map((m) => m.replace(/\s+/g, ''));
}

function getTokens(str) {
  if (!str) return [];
  const stopWords = new Set(['the', 'and', 'with', 'for', 'in', 'of', 'to', 'laptop', 'desktop', 'pc', 'inch']);
  return normalizeText(str).split(' ').filter((t) => t.length > 1 && !stopWords.has(t));
}

function tokenSimilarity(t1, t2) {
  if (!t1.length || !t2.length) return 0;
  const s2 = new Set(t2);
  let inter = 0;
  for (const t of t1) { if (s2.has(t)) inter++; }
  return (2 * inter) / (t1.length + t2.length);
}

async function matchTest() {
  const { data: dbProducts } = await supabase.from('products').select('id, name, price, category, image');
  console.log(`DB products loaded: ${dbProducts.length}`);

  // Scrape page 1-32
  // We can just scrape 4 pages for quick sample or full
  const pages = [1, 2, 3];
  const sampleEpic = [];
  for (const p of pages) {
    const res = await fetch(p === 1 ? EPIC_SHOP_URL : `${EPIC_SHOP_URL}page/${p}/`, { headers: { 'User-Agent': USER_AGENT } });
    const html = await res.text();
    const $ = cheerio.load(html);
    $('.type-product, .porto-tb-item.product, li.product, .product').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.woocommerce-loop-product__title, h2, h3, h4, .product-title').first().text().trim();
      const link = $el.find('a.woocommerce-LoopProduct-link, a[href*="/product/"]').first().attr('href') || '';
      const priceText = $el.find('.price ins .amount, .price .amount, .price').first().text().trim();
      const rawPrice = parseFloat(priceText.replace(/[^0-9]/g, '')) || 0;
      const img = $el.find('img').attr('data-src') || $el.find('img').attr('src') || '';
      if (title && rawPrice > 0) {
        sampleEpic.push({
          title, link, rawPrice, img,
          norm: normalizeText(title),
          tokens: getTokens(title),
          codes: extractNumbersAndCodes(title)
        });
      }
    });
  }
  console.log(`Sample Epic scraped: ${sampleEpic.length}`);

  let matched = 0;
  for (const e of sampleEpic) {
    const match = dbProducts.find(p => normalizeText(p.name) === e.norm || tokenSimilarity(getTokens(p.name), e.tokens) >= 0.8);
    if (match) matched++;
    else console.log('New product on Epic not in DB (or low sim):', e.title);
  }
  console.log(`Matched ${matched} / ${sampleEpic.length}`);
}
matchTest();
