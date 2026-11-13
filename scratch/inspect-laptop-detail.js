const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-probook-450-g10', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    console.log('Status code:', res.statusCode);
    $('script[type="application/ld+json"]').each((i, el) => {
      console.log('JSON-LD:', $(el).html());
    });
    console.log('Main content text preview:');
    $('main').each((i, el) => {
      console.log($(el).text().replace(/\s+/g, ' ').substring(0, 500));
    });
  });
});

