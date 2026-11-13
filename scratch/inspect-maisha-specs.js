const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    
    // Look for description sections
    console.log('--- DESCRIPTION / SPECIFICATIONS ---');
    $('section, div.prose, [class*="desc"], [class*="spec"], div:contains("Specifications")').each((i, el) => {
      const heading = $(el).find('h2, h3, h4').first().text().trim();
      if (heading) {
        console.log('Section Heading:', heading);
      }
    });

    // Gallery images
    console.log('\n--- GALLERY IMAGES ---');
    const images = new Set();
    $('img[src*="/storage/products/"]').each((i, el) => {
      images.add($(el).attr('src'));
    });
    console.log('Product images found:', Array.from(images));
  });
});

