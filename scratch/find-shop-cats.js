const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/shop', (res) => {
  let h = '';
  res.on('data', d => h += d);
  res.on('end', () => {
    const $ = cheerio.load(h);
    const cats = new Set();
    $('a[href*="category="]').each((i, el) => {
      cats.add($(el).attr('href'));
    });
    console.log('Categories from shop:', Array.from(cats));
  });
});

