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
  const user = 'postgres.knwhislemfzeatkujwcz';
  const pass = envVars.POSTGRES_PASSWORD;
  const host = 'aws-0-us-east-1.pooler.supabase.com';
  
  for (const port of [5432, 6543]) {
    try {
      const sql = postgres({
        host,
        port,
        database: 'postgres',
        username: user,
        password: pass,
        ssl: 'require',
        connect_timeout: 5
      });
      const res = await sql`SELECT 1 as connected`;
      console.log(`Connected on port ${port}!`);
      await sql.end();
      return;
    } catch (e) {
      console.log(`Port ${port} failed:`, e.message);
    }
  }
}
test();
