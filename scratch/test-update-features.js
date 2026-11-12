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

async function testUpdateFeatures() {
  // Let's test on product id 1
  const { data: before } = await supabase.from('products').select('id, name, features').limit(1).single();
  console.log('Before:', before);
  
  const testFeatures = [...(before.features || []), '__test_marker__'];
  const { data: updated, error } = await supabase.from('products').update({ features: testFeatures }).eq('id', before.id).select().single();
  console.log('Updated:', updated ? updated.features : error);

  // Restore
  const restoredFeatures = (before.features || []).filter(f => f !== '__test_marker__');
  await supabase.from('products').update({ features: restoredFeatures }).eq('id', before.id);
  console.log('Restored!');
}
testUpdateFeatures();
