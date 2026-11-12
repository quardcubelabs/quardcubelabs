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

async function testCols() {
  // Try querying possible columns
  const testCols = ['is_synced', 'source', 'epic_url', 'is_active', 'status', 'type', 'sync_status'];
  for (const c of testCols) {
    const { data, error } = await supabase.from('products').select(c).limit(1);
    if (!error) {
      console.log(`Column '${c}' EXISTS!`);
    } else {
      console.log(`Column '${c}' does NOT exist:`, error.message);
    }
  }
}
testCols();
