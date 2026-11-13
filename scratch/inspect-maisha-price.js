const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/cudy-lt400-4g-wi-fi-router', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const title = $('h1').first().text().trim();
    // find main price section near h1
    const h1Parent = $('h1').first().parent();
    console.log('H1 text:', title);
    console.log('H1 parent text:', h1Parent.text().substring(0, 300));
    
    // Look at sitemap
    https.get('https://maishacomputers.com/sitemap.xml', (sRes) => {
      console.log('Sitemap.xml status:', sRes.statusCode);
      let sHtml = '';
      sRes.on('data', d => sHtml += d);
      sRes.on('end', () => {
        console.log('Sitemap snippet:', sHtml.substring(0, 400));
      });
    });
  });
});

