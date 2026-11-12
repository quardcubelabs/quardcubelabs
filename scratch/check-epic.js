// @ts-nocheck
const cheerio = require('cheerio');

async function checkEpic() {
  const url = 'https://epiccomputers.co.tz/shop-2/';
  console.log('Fetching', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Check pagination
    let maxPage = 1;
    $('.page-numbers, .pagination a, nav.woocommerce-pagination a').each((_, el) => {
      const text = $(el).text().trim();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > maxPage) maxPage = num;
    });
    console.log('Detected max page:', maxPage);

    // Products on page 1
    const items = [];
    $('.type-product, .porto-tb-item.product, li.product, .product').each((_, el) => {
      const $p = $(el);
      const title = $p.find('.woocommerce-loop-product__title, h2, h3, h4, .product-title').first().text().trim();
      const link = $p.find('a.woocommerce-LoopProduct-link, a[href*="/product/"]').first().attr('href') || '';
      const priceText = $p.find('.price, [class*="price"]').first().text().trim();
      const img = $p.find('img').attr('data-src') || $p.find('img').attr('src') || '';
      if (title) items.push({ title, link, priceText, img });
    });
    console.log(`Page 1 products found: ${items.length}`);
    if (items.length > 0) console.log('Sample item:', items[0]);

    // Let's also check total results text if any (e.g. "Showing 1–12 of 350 results")
    const resultCountText = $('.woocommerce-result-count').text().trim();
    console.log('Result count text:', resultCountText);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
checkEpic();
