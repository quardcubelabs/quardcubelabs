const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const el = $('*:contains("Product Overview")').last();
    console.log('Parent HTML of Product Overview:');
    console.log(el.parent().parent().html()?.substring(0, 800));
  });
});

