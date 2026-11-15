const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const fixes = [
  {
    id: 558,
    name: 'NB North Bayou Model-G50 Heavy Duty Monitor Mount',
    image: 'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/Untitled-design-9.png?fit=1080%2C1080&ssl=1',
    swatch_images: [
      'https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2024/11/Untitled-design-9.png?fit=1080%2C1080&ssl=1'
    ]
  },
  {
    id: 580,
    name: 'Yunteng Vct-690 Digital Camera Tripod Stand',
    image: 'https://i.ebayimg.com/images/g/H04AAOSw~h1kLd5L/s-l1600.jpg',
    swatch_images: [
      'https://i.ebayimg.com/images/g/H04AAOSw~h1kLd5L/s-l1600.jpg'
    ]
  },
  {
    id: 584,
    name: 'HDMI Video Capture Devicefor Livestream,Broadcast,Conference',
    image: 'https://rukmini1.flixcart.com/image/1500/1500/xif0q/selector-box/z/d/o/4k-usb-c-3-0-hdmi-to-type-c-video-capture-card-epl-1274hvc-etzin-original-imah7ggfrctt2cjt.jpeg?q=70',
    swatch_images: [
      'https://rukmini1.flixcart.com/image/1500/1500/xif0q/selector-box/z/d/o/4k-usb-c-3-0-hdmi-to-type-c-video-capture-card-epl-1274hvc-etzin-original-imah7ggfrctt2cjt.jpeg?q=70'
    ]
  },
  {
    id: 585,
    name: 'Compartment PVC Trunking 170mmx50mm',
    image: 'https://rukminim2.flixcart.com/image/480/480/kvwpt3k0/electrical-wall-plate/4/i/w/1-1-gang-wonder-electric-em-white-mini-trunking-closed-slot-w38-original-imag8pzgpfkhnkf8.jpeg?q=80',
    swatch_images: [
      'https://rukminim2.flixcart.com/image/480/480/kvwpt3k0/electrical-wall-plate/4/i/w/1-1-gang-wonder-electric-em-white-mini-trunking-closed-slot-w38-original-imag8pzgpfkhnkf8.jpeg?q=80'
    ]
  },
  {
    id: 641,
    name: 'HIKVISION DS-2CE5AD0T-ITP/ECO 2MP (1080P)',
    image: 'https://rukmini1.flixcart.com/image/1500/1500/xif0q/home-security-camera/d/t/z/1-ds-2ce5ad0t-itp-eco-indoor-security-camera-hikvision-original-imahp9huz7apy3zv.jpeg?q=70',
    swatch_images: [
      'https://rukmini1.flixcart.com/image/1500/1500/xif0q/home-security-camera/d/t/z/1-ds-2ce5ad0t-itp-eco-indoor-security-camera-hikvision-original-imahp9huz7apy3zv.jpeg?q=70'
    ]
  },
  {
    id: 642,
    name: 'Hikvision 2MP 2.8mm 20m-IR Bullet Analog Camera',
    image: 'https://rukminim3.flixcart.com/image/480/480/kxaq7ww0/home-security-camera/d/w/a/1-ds-2ce16d0t-itpf-outdoor-security-camera-hikvision-original-imag9sebgewv9r2a.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/kxaq7ww0/home-security-camera/d/w/a/1-ds-2ce16d0t-itpf-outdoor-security-camera-hikvision-original-imag9sebgewv9r2a.jpeg?q=90'
    ]
  },
  {
    id: 842,
    name: 'Xbox Live 15 USD',
    image: 'https://rukminim3.flixcart.com/image/480/480/xif0q/e-gift-voucher/w/f/o/open-anyone-xbox-game-pass-premium-3-month-membership-2099-original-imahjugtnxf4z6yr.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/xif0q/e-gift-voucher/w/f/o/open-anyone-xbox-game-pass-premium-3-month-membership-2099-original-imahjugtnxf4z6yr.jpeg?q=90'
    ]
  },
  {
    id: 843,
    name: 'Xbox Live 20 USD',
    image: 'https://rukminim3.flixcart.com/image/480/480/kc54ivk0/game-value-card/p/y/4/xbox-gift-cards-20-usd-original-imaftc56g5h5fden.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/kc54ivk0/game-value-card/p/y/4/xbox-gift-cards-20-usd-original-imaftc56g5h5fden.jpeg?q=90'
    ]
  },
  {
    id: 844,
    name: 'Xbox Live 50 USD',
    image: 'https://rukmini1.flixcart.com/image/480/480/jl5h3m80/game-value-card/t/4/q/50-xbox-card-original-imaf8c85qxmxh8gb.jpeg',
    swatch_images: [
      'https://rukmini1.flixcart.com/image/480/480/jl5h3m80/game-value-card/t/4/q/50-xbox-card-original-imaf8c85qxmxh8gb.jpeg'
    ]
  },
  {
    id: 845,
    name: 'Toshiba Q300 240GB Internal SSD',
    image: 'https://rukminim3.flixcart.com/image/480/480/internal-hard-drive/h/r/5/toshiba-to-ssdqsepr-128gb-original-imae3zgxn9cee8tr.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/internal-hard-drive/h/r/5/toshiba-to-ssdqsepr-128gb-original-imae3zgxn9cee8tr.jpeg?q=90'
    ]
  },
  {
    id: 850,
    name: 'XFX Radeon RX 550 DirectX 12 RX-550P4TFG5 4GB',
    image: 'https://cdn.prod.website-files.com/5d1911406ad3cbdb9924a753/5ef0e329d78ea2f3de14f94f_550.jpg',
    swatch_images: [
      'https://cdn.prod.website-files.com/5d1911406ad3cbdb9924a753/5ef0e329d78ea2f3de14f94f_550.jpg'
    ]
  },
  {
    id: 851,
    name: 'XFX Radeon RX 550 DirectX 12 RX-550P2TFG5 2GB',
    image: 'https://cdn.prod.website-files.com/5d1911406ad3cbdb9924a753/5d21065e06e895a262487527_550packing.jpg',
    swatch_images: [
      'https://cdn.prod.website-files.com/5d1911406ad3cbdb9924a753/5d21065e06e895a262487527_550packing.jpg'
    ]
  },
  {
    id: 854,
    name: 'MSI GT 710 2GB Graphics Card',
    image: 'https://rukminim3.flixcart.com/image/480/480/ked56kw0/graphics-card/z/f/e/msi-nvidia-gt-710-2gb-d3-original-imafvfthtvtv73cb.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/ked56kw0/graphics-card/z/f/e/msi-nvidia-gt-710-2gb-d3-original-imafvfthtvtv73cb.jpeg?q=90'
    ]
  },
  {
    id: 856,
    name: 'Kingston SSD 480GB SATA 2.5” Solid State Drive',
    image: 'https://rukminim3.flixcart.com/image/480/480/kh9gbrk0/internal-hard-drive/j/t/d/kingston-a400-480gb-ssd-original-imafxbqmpavtr4gp.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/kh9gbrk0/internal-hard-drive/j/t/d/kingston-a400-480gb-ssd-original-imafxbqmpavtr4gp.jpeg?q=90'
    ]
  },
  {
    id: 858,
    name: 'MSI Gaming GeForce GTX 1050 Ti 4GB GDRR5 Low Profile',
    image: 'https://rukminim3.flixcart.com/image/480/480/ki0loy80-0/graphics-card/m/5/e/geforce-gtx-1050-ti-4gt-lp-i-128-bit-i-pci-express-x16-3-0-msi-original-imafxwm2kchmh22k.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/480/ki0loy80-0/graphics-card/m/5/e/geforce-gtx-1050-ti-4gt-lp-i-128-bit-i-pci-express-x16-3-0-msi-original-imafxwm2kchmh22k.jpeg?q=90'
    ]
  },
  {
    id: 1227,
    name: 'CHAIR MODEL 910',
    image: 'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/i/i/j/1-natural-fiber-65-jupiter-pro-hb-fullblack-flk-green-soul-94-original-imahp3ychuayhtdz.jpeg?q=80&crop=false',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/i/i/j/1-natural-fiber-65-jupiter-pro-hb-fullblack-flk-green-soul-94-original-imahp3ychuayhtdz.jpeg?q=80&crop=false'
    ]
  },
  {
    id: 1229,
    name: 'FG CHAIR MODEL 850A',
    image: 'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/c/c/f/1-iron-47-js-sj-beaatho-93-original-imahgdxfpmtptxsy.jpeg?q=80&crop=false',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/c/c/f/1-iron-47-js-sj-beaatho-93-original-imahgdxfpmtptxsy.jpeg?q=80&crop=false'
    ]
  },
  {
    id: 1230,
    name: 'OFFICE CHAIR MODEL LM-186A-1',
    image: 'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/z/8/5/1-microfiber-46-desire-c104-hb-cellbell-89-original-imahhzmmwrvzqhxc.jpeg?q=80&crop=false',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/z/8/5/1-microfiber-46-desire-c104-hb-cellbell-89-original-imahhzmmwrvzqhxc.jpeg?q=80&crop=false'
    ]
  },
  {
    id: 1232,
    name: 'OFFICE CHAIR MODEL LM-201C',
    image: 'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/q/w/d/1-iron-45-72-js-v-black-beaatho-101-6-original-imahmhpzqkpcwr2n.jpeg?q=80&crop=false',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/360/360/xif0q/office-study-chair/q/w/d/1-iron-45-72-js-v-black-beaatho-101-6-original-imahmhpzqkpcwr2n.jpeg?q=80&crop=false'
    ]
  },
  {
    id: 1236,
    name: 'FG CHAIR MODEL 907A',
    image: 'https://rukminim2.flixcart.com/image/480/580/xif0q/office-study-chair/3/l/h/1-pp-polypropylene-46-805-mesh-back-with-fix-arms-narsa-59-original-imahgnnrfrg7s92n.jpeg?q=90',
    swatch_images: [
      'https://rukminim2.flixcart.com/image/480/580/xif0q/office-study-chair/3/l/h/1-pp-polypropylene-46-805-mesh-back-with-fix-arms-narsa-59-original-imahgnnrfrg7s92n.jpeg?q=90'
    ]
  },
  {
    id: 1247,
    name: 'VERCELLI',
    image: 'https://rukminim3.flixcart.com/image/480/640/xif0q/office-study-chair/j/9/n/1-carbon-steel-48-executive-star-revolving-office-chair-original-imahrwxdgpq9ecmd.jpeg?q=90',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/480/640/xif0q/office-study-chair/j/9/n/1-carbon-steel-48-executive-star-revolving-office-chair-original-imahrwxdgpq9ecmd.jpeg?q=90'
    ]
  },
  {
    id: 1248,
    name: 'OFFICE CHAIR MODEL LM-186A',
    image: 'https://rukminim3.flixcart.com/image/300/300/xif0q/office-study-chair/t/s/r/-original-imahhx72fgus2drn.jpeg',
    swatch_images: [
      'https://rukminim3.flixcart.com/image/300/300/xif0q/office-study-chair/t/s/r/-original-imahhx72fgus2drn.jpeg'
    ]
  }
];

async function updateProducts() {
  console.log(`Starting update of ${fixes.length} products in Supabase...`);
  let successCount = 0;
  let failCount = 0;

  for (const item of fixes) {
    const { error } = await supabase
      .from('products')
      .update({
        image: item.image,
        swatch_images: item.swatch_images
      })
      .eq('id', item.id);

    if (error) {
      console.error(`Failed to update product ${item.id} (${item.name}):`, error.message);
      failCount++;
    } else {
      console.log(`[UPDATED] ID ${item.id}: ${item.name}`);
      successCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Update Complete: ${successCount} succeeded, ${failCount} failed.`);
}

updateProducts();
