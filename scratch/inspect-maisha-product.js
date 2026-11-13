const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/cudy-lt400-4g-wi-fi-router', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const $ = cheerio.load(html);
    console.log('Title:', $('h1').text().trim());
    console.log('Price elements:');
    $('[class*="price"], .amount, span:contains("TZS"), span:contains("Tsh"), p:contains("TZS")').each((i, el) => {
      console.log(' -', $(el).attr('class'), ':', $(el).text().trim());
    });
    console.log('Breadcrumbs/Category:');
    $('[class*="breadcrumb"], [class*="category"], .posted_in').each((i, el) => {
      console.log(' -', $(el).text().trim());
    });
    console.log('Images:');
    $('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        console.log(' -', src);
      }
    });
    console.log('Description length:', $('[class*="description"], [class*="content"]').text().trim().length);
    console.log('Specifications / Table:', $('table, dl, ul').length);
  });
}).on('error', console.error);

