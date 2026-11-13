const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/shop?category=laptops', (res) => {
  let h = '';
  res.on('data', d => h += d);
  res.on('end', () => {
    const $ = cheerio.load(h);
    const links = [];
    $('a[href*="/product/"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (text && !links.some(l => l.href === href)) {
        links.push({ href, text });
      }
    });
    console.log('Laptops found:', links.length);
    console.log('First 5:', links.slice(0, 5));
  });
});

