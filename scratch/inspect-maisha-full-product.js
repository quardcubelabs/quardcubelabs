const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/hp-colour-laserjet-mfp-4303dw', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const $ = cheerio.load(html);
    const title = $('h1').text().trim();
    console.log('Title:', title);
    
    // Find price in the product header / buy section
    $('div, span, p').each((i, el) => {
      const text = $(el).clone().children().remove().end().text().trim();
      const fullText = $(el).text().trim();
      if ((fullText.includes('TZS') || fullText.includes('Tsh')) && fullText.length < 50) {
        console.log('Price candidate tag:', el.tagName, 'class:', $(el).attr('class'), 'text:', fullText);
      }
    });

    // Check categories
    console.log('\nCategories / Tags:');
    $('a[href*="/category/"], a[href*="/shop?category="], [class*="category"], [class*="tag"]').each((i, el) => {
      console.log(' -', $(el).text().trim(), '->', $(el).attr('href'));
    });

    // Check specs table
    console.log('\nTables:');
    $('table').each((i, el) => {
      console.log('Table text preview:', $(el).text().trim().substring(0, 200));
    });
  });
});

