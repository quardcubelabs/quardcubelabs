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

const postgres = require('postgres');
const connectionString = envVars.POSTGRES_URL_NON_POOLING || envVars.POSTGRES_URL;

async function run() {
  if (!connectionString) {
    console.log('No postgres connection string');
    return;
  }
  const sql = postgres(connectionString);
  try {
    const columns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `;
    console.log('Products columns:');
    columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type}, default: ${c.column_default})`));
  } catch (e) {
    console.error('Error connecting to postgres:', e.message);
  } finally {
    await sql.end();
  }
}
run();
