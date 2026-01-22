const cheerio = require('cheerio');

async function getAllProducts() {
  const allProducts = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= 10) {
    const url = page === 1 
      ? 'https://epiccomputers.co.tz/index.php/shop/'
      : `https://epiccomputers.co.tz/index.php/shop/page/${page}/`;
    
    console.log(`Fetching page ${page}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        hasMore = false;
        break;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const products = [];
      $('.product').each((i, el) => {
        const $el = $(el);
        const name = $el.find('.woocommerce-loop-product__title, h2').text().trim();
        const priceText = $el.find('.price .woocommerce-Price-amount').first().text();
        const price = priceText.replace(/[^0-9.]/g, '');
        const image = $el.find('img').first().attr('src') || '';
        const link = $el.find('a').first().attr('href') || '';
        
        if (name) {
          products.push({ name, price, image, link });
        }
      });
      
      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...products);
        page++;
      }
    } catch (err) {
      console.error('Error:', err.message);
      hasMore = false;
    }
  }
  
  console.log(`\n=== TOTAL: ${allProducts.length} PRODUCTS ===\n`);
  allProducts.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} - TZS ${p.price || 'N/A'}`);
  });
  
  return allProducts;
}

getAllProducts();
