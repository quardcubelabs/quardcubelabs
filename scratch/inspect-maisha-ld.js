const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const h1 = $('h1').first();
    console.log('H1:', h1.text().trim());
    
    // Look at siblings or immediate parent container
    const container = h1.closest('div.flex, div.grid, div.space-y-4, div.space-y-6, div.space-y-2');
    console.log('Container text:', container.text().replace(/\s+/g, ' ').substring(0, 300));

    // Also look for schema.org JSON-LD!
    $('script[type="application/ld+json"]').each((i, el) => {
      console.log('JSON-LD script:', $(el).html());
    });
  });
});

