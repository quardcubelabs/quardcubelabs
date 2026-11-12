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

const postgres = require('postgres');
async function test() {
  const sql = postgres(envVars.POSTGRES_URL_NON_POOLING, { ssl: 'require' });
  try {
    const res = await sql`SELECT 1 as connected`;
    console.log('Connected successfully via pooler!', res);
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await sql.end();
  }
}
test();
