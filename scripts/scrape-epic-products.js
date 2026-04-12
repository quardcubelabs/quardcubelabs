const cheerio = require('cheerio');
const fs = require('fs');

const EPIC_BASE_URL = 'https://epiccomputers.co.tz';
const EPIC_SHOP_URL = `${EPIC_BASE_URL}/index.php/shop/`;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REQUEST_DELAY = 1000;
const BATCH_SIZE = 5;
const MAX_PRODUCTS = 60; // Limit to 60 products

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 2, timeoutMs = 20000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      if (response.ok) return response;
      if (i < retries - 1) await delay(1000);
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url}:`, error.message);
        return null;
      }
      await delay(1000);
    }
  }
  return null;
}

// Get product listings from a shop page
async function getProductListingsFromPage(pageNum) {
  const url = pageNum === 1 ? EPIC_SHOP_URL : `${EPIC_SHOP_URL}page/${pageNum}/`;
  console.log(`Fetching shop page ${pageNum}...`);
  
  const response = await fetchWithRetry(url);
  if (!response) return [];
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const products = [];
  
  $('.product, li.product').each((_, el) => {
    const $product = $(el);
    
    const name = $product.find('.woocommerce-loop-product__title, h2').first().text().trim();
    const productUrl = $product.find('a.woocommerce-LoopProduct-link, a[href*="/product/"]').first().attr('href') || '';
    const mainImage = $product.find('img').attr('data-src') || $product.find('img').attr('src') || '';
    const priceText = $product.find('.price .woocommerce-Price-amount').first().text().trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    
    if (name && productUrl && productUrl.includes('epiccomputers')) {
      products.push({ name, productUrl, mainImage, price });
    }
  });
  
  return products;
}

// Get total pages
async function getTotalPages() {
  const response = await fetchWithRetry(EPIC_SHOP_URL);
  if (!response) return 1;
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const lastPageNum = $('.page-numbers:not(.next):not(.prev)').last().text();
  return parseInt(lastPageNum) || 1;
}

// Scrape detailed product information
async function scrapeProductDetail(listing) {
  const response = await fetchWithRetry(listing.productUrl);
  if (!response) return null;
  
  const html = await response.text();
  const $ = cheerio.load(html);

  const name = $('.product_title').first().text().trim() || listing.name;

  const mainImage = 
    $('.woocommerce-product-gallery__image img').first().attr('data-large_image') ||
    $('.woocommerce-product-gallery__image img').first().attr('src') ||
    $('.wp-post-image').first().attr('src') || 
    listing.mainImage;

  const swatchImages = [];
  $('.woocommerce-product-gallery__image img').slice(0, 5).each((_, el) => {
    const img = $(el).attr('data-large_image') || $(el).attr('src');
    if (img && !swatchImages.includes(img)) swatchImages.push(img);
  });

  const description = ($('.woocommerce-product-details__short-description').text().trim() ||
                      $('#tab-description').text().trim() || '').substring(0, 800);

  const priceText = $('.price .woocommerce-Price-amount').first().text().trim();
  const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || listing.price;

  const stockText = $('.stock, .availability').text().toLowerCase();
  const stock = stockText.includes('out of stock') ? 0 : 10;

  const category = $('.posted_in a').first().text().trim() || 'Computers & Electronics';

  const features = [];
  $('.woocommerce-product-attributes tr').slice(0, 8).each((_, el) => {
    const label = $(el).find('th').text().trim();
    const value = $(el).find('td').text().trim();
    if (label && value) features.push(`${label}: ${value}`);
  });

  return { name, mainImage, swatchImages, description, price, stock, category, features, sourceUrl: listing.productUrl };
}

async function scrapeAllProducts() {
  console.log('=== Epic Computers Full Product Scraper ===\n');
  
  // Get total pages
  const totalPages = await getTotalPages();
  console.log(`Total pages: ${totalPages}\n`);
  
  // Collect product listings (limited to MAX_PRODUCTS)
  const allListings = [];
  
  for (let page = 1; page <= totalPages; page++) {
    const listings = await getProductListingsFromPage(page);
    allListings.push(...listings);
    console.log(`Page ${page}: Found ${listings.length} products (Total: ${allListings.length})`);
    
    // Stop if we have enough products
    if (allListings.length >= MAX_PRODUCTS) {
      console.log(`Reached limit of ${MAX_PRODUCTS} products`);
      break;
    }
    
    if (page < totalPages) {
      await delay(REQUEST_DELAY);
    }
  }
  
  // Limit to MAX_PRODUCTS
  const limitedListings = allListings.slice(0, MAX_PRODUCTS);
  
  console.log(`\nTotal products to scrape: ${limitedListings.length}`);
  console.log('Scraping product details...\n');
  
  // Scrape details in batches
  const detailedProducts = [];
  const errors = [];
  
  for (let i = 0; i < limitedListings.length; i += BATCH_SIZE) {
    const batch = limitedListings.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(limitedListings.length / BATCH_SIZE);
    
    console.log(`Processing batch ${batchNum}/${totalBatches}...`);
    
    for (const listing of batch) {
      console.log(`  Scraping: ${listing.name.substring(0, 50)}...`);
      
      const detail = await scrapeProductDetail(listing);
      
      if (detail) {
        detailedProducts.push(detail);
      } else {
        errors.push(`Failed: ${listing.name}`);
      }
      
      await delay(REQUEST_DELAY);
    }
  }
  
  console.log('\n=== SCRAPE RESULTS ===\n');
  console.log(`Successfully scraped: ${detailedProducts.length} products`);
  console.log(`Failed: ${errors.length} products`);
  
  if (detailedProducts.length > 0) {
    // Save to JSON file
    fs.writeFileSync('all-epic-products.json', JSON.stringify(detailedProducts, null, 2));
    console.log('\nProducts saved to all-epic-products.json');
    
    // Print summary
    console.log('\n--- Product Summary ---');
    detailedProducts.slice(0, 10).forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - TZS ${p.price}`);
    });
    if (detailedProducts.length > 10) {
      console.log(`... and ${detailedProducts.length - 10} more products`);
    }
  }
  
  if (errors.length > 0) {
    console.log('\n--- Failed Products ---');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  return { products: detailedProducts, errors };
}

scrapeAllProducts().catch(console.error);
