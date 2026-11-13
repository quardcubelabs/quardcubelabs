const https = require('https');

https.get('https://maishacomputers.com/sitemap.xml', (res) => {
  let xml = '';
  res.on('data', c => xml += c);
  res.on('end', () => {
    const urls = [];
    const matches = xml.matchAll(/<loc>(https:\/\/maishacomputers\.com\/product\/[^<]+)<\/loc>/g);
    for (const m of matches) {
      urls.push(m[1]);
    }
    console.log('Total product URLs in sitemap:', urls.length);
    console.log('Sample product URLs:', urls.slice(0, 5));
  });
});

