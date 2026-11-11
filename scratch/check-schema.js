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

async function run() {
  const { data, error } = await supabase.from('products').select('*').limit(2);
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  console.log('Total sample returned:', data.length);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
    console.log('First product:', JSON.stringify(data[0], null, 2));
  }
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log('Total products count in DB:', count);
}
run();
