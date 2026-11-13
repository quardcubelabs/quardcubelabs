const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    
    // Find where "Product Overview" is located
    $('h2:contains("Product Overview"), h3:contains("Product Overview")').first().each((i, el) => {
      console.log('Product Overview parent:', $(el).parent().html().substring(0, 500));
    });

    // Check main image
    const mainImg = $('img[src*="/storage/products/hp-colour-laserjet-mfp-4303dw"]').first().attr('src');
    console.log('Main image found in DOM:', mainImg);
  });
});

