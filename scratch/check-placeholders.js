const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.from("products").select("id, name, image, description");
  let placeholderCount = 0;
  let nonHttpCount = 0;
  for (const p of data) {
    if (!p.image || p.image.includes("placeholder")) placeholderCount++;
    else if (!p.image.startsWith("http")) nonHttpCount++;
  }
  console.log({ total: data.length, placeholderCount, nonHttpCount });
}
check();

