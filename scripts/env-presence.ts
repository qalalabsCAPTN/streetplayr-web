import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 0) continue;
  const k = t.slice(0, eq);
  let v = t.slice(eq + 1);
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'SENTRY_DSN',
  'DATABASE_URL',
  'SUPABASE_DB_URL',
  'POSTGRES_URL',
  'DIRECT_URL',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_DB_PASSWORD',
  'TRANSACTIONAL_FROM_EMAIL',
  'EASEBUZZ_MERCHANT_KEY',
  'EASEBUZZ_SALT',
];

for (const k of keys) {
  const v = process.env[k];
  console.log(`${k}=${v ? 'SET' : 'MISSING'}`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const m = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
console.log(`project_ref=${m ? m[1] : 'UNKNOWN'}`);
console.log(`has_db_like=${Object.keys(process.env).filter((k) => /DATABASE|POSTGRES|DB_URL|DB_PASSWORD/i.test(k)).join(',') || 'none'}`);
