const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-probook-450-g10', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const box = $('.bg-white.border.border-gray-200.rounded-2xl');
    console.log('Laptop Overview Card HTML:');
    console.log(box.html()?.substring(0, 2000));
  });
});

