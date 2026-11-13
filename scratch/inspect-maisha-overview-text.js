const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const overviewSection = $('h2:contains("Overview")').first().closest('section, div.container, div.max-w-7xl');
    console.log('Overview Section Text:', overviewSection.text().replace(/\s+/g, ' ').substring(0, 1000));
  });
});

