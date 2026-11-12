// @ts-nocheck
const cheerio = require('cheerio');

const EPIC_BASE_URL = 'https://epiccomputers.co.tz';
const EPIC_SHOP_URL = `${EPIC_BASE_URL}/shop-2/`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchWithRetry(url) {
  for (let i = 0; i < 2; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT }
      });
      if (res.ok) return res;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 400));
  }
  return null;
}

function parsePrice(text) {
  const clean = text.replace(/[^0-9]/g, '');
  return parseFloat(clean) || 0;
}

async function scrapePage(p) {
  const url = p === 1 ? EPIC_SHOP_URL : `${EPIC_SHOP_URL}page/${p}/`;
  const res = await fetchWithRetry(url);
  if (!res) return [];
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = [];
  $('.type-product, .porto-tb-item.product, li.product, .product').each((_, el) => {
    const $el = $(el);
    const title = $el.find('.woocommerce-loop-product__title, h2, h3, h4, .product-title').first().text().trim();
    const link = $el.find('a.woocommerce-LoopProduct-link, a[href*="/product/"]').first().attr('href') || '';
    const priceText = $el.find('.price ins .amount, .price .amount, .price').first().text().trim();
    const rawPrice = parsePrice(priceText);
    const img = $el.find('img').attr('data-src') || $el.find('img').attr('data-lazy-src') || $el.find('img').attr('src') || '';
    if (title && rawPrice > 0 && link.includes('epiccomputers')) {
      items.push({ title, link, rawPrice, img });
    }
  });
  return items;
}

async function testAll() {
  const start = Date.now();
  console.log('Starting scrape of 32 pages...');
  const maxPages = 32;
  const batchSize = 8;
  const allItems = [];
  for (let i = 1; i <= maxPages; i += batchSize) {
    const pages = [];
    for (let p = i; p < i + batchSize && p <= maxPages; p++) pages.push(p);
    const results = await Promise.all(pages.map(p => scrapePage(p)));
    allItems.push(...results.flat());
    console.log(`Scraped pages ${pages[0]}..${pages[pages.length - 1]}, total items so far: ${allItems.length}`);
  }
  console.log(`Finished in ${((Date.now() - start)/1000).toFixed(1)}s. Total scraped: ${allItems.length}`);
}
testAll();
