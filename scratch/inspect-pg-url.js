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

console.log('POSTGRES_HOST:', envVars.POSTGRES_HOST);
console.log('POSTGRES_USER:', envVars.POSTGRES_USER);
console.log('POSTGRES_DATABASE:', envVars.POSTGRES_DATABASE);
console.log('POSTGRES_URL host:', envVars.POSTGRES_URL ? envVars.POSTGRES_URL.replace(/:[^:@]+@/, ':***@') : 'none');
console.log('POSTGRES_URL_NON_POOLING host:', envVars.POSTGRES_URL_NON_POOLING ? envVars.POSTGRES_URL_NON_POOLING.replace(/:[^:@]+@/, ':***@') : 'none');
