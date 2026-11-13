const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("products").select("id, name, image, description, features, category");
  if (error) {
    console.error(error);
    return;
  }

  const problematic = data.filter(p => !p.image || p.image === "/placeholder.svg" || !p.description || p.description.length < 5);
  console.log(`Found ${problematic.length} problematic products:`);
  for (const p of problematic) {
    console.log(JSON.stringify({
      id: p.id,
      name: p.name,
      category: p.category,
      image: p.image,
      descLen: (p.description || "").length,
      desc: p.description,
      features: p.features
    }, null, 2));
  }
}

run();
