const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/shop/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('/product/')) {
        links.push({ href, text: $(el).text().trim() });
      }
    });
    console.log('Total /product/ links:', links.length);
    console.log('First 5 links:', links.slice(0, 5));

    // Look for sitemap or pagination
    const pagination = [];
    $('.pagination a, a.page-numbers, [class*="page"] a, nav[class*="pagination"] a').each((i, el) => {
      pagination.push({ href: $(el).attr('href'), text: $(el).text().trim() });
    });
    console.log('Pagination links:', pagination);

    // Categories
    const categories = [];
    $('a[href*="/product-category/"], a[href*="/category/"]').each((i, el) => {
      categories.push({ href: $(el).attr('href'), text: $(el).text().trim() });
    });
    console.log('Category links found:', categories.length);
    if (categories.length > 0) {
      console.log('Sample categories:', categories.slice(0, 8));
    }
  });
}).on('error', console.error);
