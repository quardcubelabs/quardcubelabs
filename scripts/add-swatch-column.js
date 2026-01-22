const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://knwhislemfzeatkujwcz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud2hpc2xlbWZ6ZWF0a3Vqd2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY1NDk3OCwiZXhwIjoyMDYwMjMwOTc4fQ.BClOJkyCjmPfIw0wCuTw0rUzrHeFaCY-bnvzrzkl-YU'
);

async function addSwatchColumn() {
  // Try to add a test product with swatch_images to see if column exists
  const { data: testData, error: testError } = await supabase
    .from('products')
    .select('id, swatch_images')
    .limit(1);

  if (testError && testError.message.includes('swatch_images')) {
    console.log('Column does not exist, need to add it via Supabase dashboard');
    console.log('');
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('ALTER TABLE products ADD COLUMN swatch_images TEXT[] DEFAULT ARRAY[]::TEXT[];');
  } else if (testError) {
    console.log('Error:', testError.message);
  } else {
    console.log('swatch_images column already exists!');
    console.log('Sample data:', testData);
  }
}

addSwatchColumn();
