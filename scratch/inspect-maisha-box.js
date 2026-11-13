const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const box = $('.bg-white.border.border-gray-200.rounded-2xl');
    console.log('Overview Card HTML:', box.html()?.substring(0, 1500));
  });
});

