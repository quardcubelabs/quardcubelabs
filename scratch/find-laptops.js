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
    const laptops = urls.filter(u => u.includes('laptop') || u.includes('thinkpad') || u.includes('probook') || u.includes('vostro') || u.includes('dell') || u.includes('hp'));
    console.log('Total laptop/computer URLs in sitemap:', laptops.length);
    console.log('First 10:', laptops.slice(0, 10));
  });
});

