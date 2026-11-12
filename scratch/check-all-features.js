// @ts-nocheck
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value;
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAll() {
  const { data } = await supabase.from('products').select('id, name, features, rating');
  const nonEmptyFeatures = data.filter(p => p.features && p.features.length > 0);
  console.log(`Total products: ${data.length}, products with non-empty features: ${nonEmptyFeatures.length}`);
  if (nonEmptyFeatures.length > 0) {
    console.log('Sample non-empty feature:', nonEmptyFeatures[0].features);
  }
}
testAll();
