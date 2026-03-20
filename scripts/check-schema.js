const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://knwhislemfzeatkujwcz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud2hpc2xlbWZ6ZWF0a3Vqd2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NDk3OCwiZXhwIjoyMDYwMjMwOTc4fQ.BClOJkyCjmPfIw0wCuTw0rUzrHeFaCY-bnvzrzkl-YU'
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  if (data && data[0]) {
    console.log('Product columns:', Object.keys(data[0]));
    console.log('Sample product:', JSON.stringify(data[0], null, 2));
  }
}

checkSchema();
