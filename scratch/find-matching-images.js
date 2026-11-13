const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase.from("products").select("name, image").ilike("name", "%hikvision%").limit(5);
  console.log("Hikvision images:", data);

  const { data: lenovo } = await supabase.from("products").select("name, image").ilike("name", "%thinkpad%").limit(5);
  console.log("ThinkPad images:", lenovo);
}
check();

