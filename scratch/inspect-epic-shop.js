// @ts-nocheck
const cheerio = require('cheerio');

async function inspect() {
  const homeRes = await fetch('https://epiccomputers.co.tz/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const homeHtml = await homeRes.text();
  const $home = cheerio.load(homeHtml);
  console.log('Homepage title:', $home('title').text());

  // Find shop links in menu
  const shopLinks = [];
  $home('a[href*="shop"]').each((_, a) => {
    shopLinks.push($home(a).attr('href'));
  });
  console.log('Shop links in homepage:', Array.from(new Set(shopLinks)));

  // Inspect /shop/
  const res1 = await fetch('https://epiccomputers.co.tz/shop/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html1 = await res1.text();
  const $1 = cheerio.load(html1);
  const items1 = [];
  $1('.product, .type-product').each((_, el) => {
    const t = $1(el).find('.woocommerce-loop-product__title, h2, h3, .product-title').first().text().trim();
    if (t) items1.push(t);
  });
  let maxPage1 = 1;
  $1('.page-numbers a, .pagination a, nav.woocommerce-pagination a').each((_, el) => {
    const num = parseInt($1(el).text().trim(), 10);
    if (!isNaN(num) && num > maxPage1) maxPage1 = num;
  });
  console.log('/shop/ products on page 1:', items1.length, 'maxPage:', maxPage1, 'sample:', items1.slice(0, 3));

  // Inspect /shop-2/
  const res2 = await fetch('https://epiccomputers.co.tz/shop-2/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html2 = await res2.text();
  const $2 = cheerio.load(html2);
  const items2 = [];
  $2('.product, .type-product').each((_, el) => {
    const t = $2(el).find('.woocommerce-loop-product__title, h2, h3, .product-title').first().text().trim();
    if (t) items2.push(t);
  });
  let maxPage2 = 1;
  $2('.page-numbers a, .pagination a, nav.woocommerce-pagination a').each((_, el) => {
    const num = parseInt($2(el).text().trim(), 10);
    if (!isNaN(num) && num > maxPage2) maxPage2 = num;
  });
  console.log('/shop-2/ products on page 1:', items2.length, 'maxPage:', maxPage2, 'sample:', items2.slice(0, 3));
}

inspect();

