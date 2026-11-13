const https = require('https');
const cheerio = require('cheerio');

https.get('https://maishacomputers.com/product/big-blower-gun', (res) => {
  let h = '';
  res.on('data', d => h += d);
  res.on('end', () => {
    const $ = cheerio.load(h);
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        console.log('JSON-LD type:', json['@type']);
        if (json['@type'] === 'Product') {
          console.log('Name:', json.name);
          console.log('Price:', json.offers?.price);
          console.log('Image:', json.image);
          console.log('Description:', json.description);
        } else if (json['@type'] === 'BreadcrumbList') {
          console.log('Breadcrumbs:', json.itemListElement?.map(b => b.name));
        }
      } catch (e) {}
    });
  });
});

