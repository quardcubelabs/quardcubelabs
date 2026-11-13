const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const updates = [
  {
    id: 582,
    name: "Laptop Lenovo ThinkPad X1 Carbon 8GB Intel Core I7 SSD 512GB",
    image: "https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2026/09/1-12.png?fit=1000%2C1000&ssl=1",
    description: "Lenovo ThinkPad X1 Carbon ultrabook powered by Intel Core i7 processor, 8GB RAM, and 512GB PCIe SSD. Features ultralight carbon-fiber body, 14-inch Full HD anti-glare display, Dolby Audio, and enterprise security."
  },
  {
    id: 581,
    name: "Canon 550d With Lens 18-55mm",
    image: "https://shopflix.co.tz/public/uploads/all/QbdBpdydJE0lKwVsjNyNluQbvPgQiji65HVEXa8c.jpg",
    description: "Canon EOS 550D DSLR camera with EF-S 18-55mm IS lens. Features 18.0 Megapixel CMOS sensor, DIGIC 4 processor, Full HD 1080p video recording, and 3.0-inch Clear View LCD screen."
  },
  {
    id: 584,
    name: "HDMI Video Capture Devicefor Livestream,Broadcast,Conference",
    image: "https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/11/HDMI-Capture.jpg?fit=800%2C800&ssl=1",
    fallbackImage: "https://m.media-amazon.com/images/I/61r-8B6gPML._AC_SL1500_.jpg",
    description: "Compact USB to HDMI 1080P video capture device. Ideal for live streaming, gaming capture, video broadcasting, conference meetings, and high-definition video recording with zero latency."
  },
  {
    id: 585,
    name: "Compartment PVC Trunking 170mmx50mm",
    image: "https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/11/PVC-Trunking.jpg?fit=800%2C800&ssl=1",
    fallbackImage: "https://m.media-amazon.com/images/I/51wX5iKqEQL._AC_SL1000_.jpg",
    description: "Professional grade 170mm x 50mm PVC compartment trunking. Features integrated divider fillets to isolate high-voltage power lines from data cables in commercial and office networking setups."
  },
  {
    id: 641,
    name: "HIKVISION DS-2CE5AD0T-ITP/ECO 2MP (1080P)",
    image: "https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/11/DS-2CE5AD0T-ITP.jpg?fit=800%2C800&ssl=1",
    fallbackImage: "https://m.media-amazon.com/images/I/51gS2-L0wCL._AC_SL1000_.jpg",
    description: "Hikvision DS-2CE5AD0T-ITP 2MP 1080P indoor night vision dome camera. Features high-performance CMOS, Smart IR illumination up to 20m, true Day/Night auto-switch, and coaxial telemetry support."
  },
  {
    id: 642,
    name: "Hikvision 2MP 2.8mm 20m-IR Bullet Analog Camera",
    image: "https://i0.wp.com/epiccomputers.co.tz/wp-content/uploads/2021/11/DS-2CE16D0T-ITP.jpg?fit=800%2C800&ssl=1",
    fallbackImage: "https://m.media-amazon.com/images/I/61k2YlRkJbL._AC_SL1200_.jpg",
    description: "Hikvision 2MP 2.8mm bullet analog CCTV camera with IP67 weatherproof housing, 20m Smart IR night illumination, 1080p Full HD resolution, and durable outdoor mounting bracket."
  }
];

async function updateMissing() {
  for (const item of updates) {
    let finalImage = item.image;
    try {
      const res = await fetch(finalImage, { method: "HEAD" });
      if (!res.ok && item.fallbackImage) {
        finalImage = item.fallbackImage;
      }
    } catch {
      if (item.fallbackImage) finalImage = item.fallbackImage;
    }

    const { error } = await supabase
      .from("products")
      .update({
        image: finalImage,
        description: item.description
      })
      .eq("id", item.id);

    if (error) {
      console.error(`Failed to update ${item.id}:`, error);
    } else {
      console.log(`Successfully updated product #${item.id} (${item.name}) with image: ${finalImage}`);
    }
  }
}

updateMissing();

