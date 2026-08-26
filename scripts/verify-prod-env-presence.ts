/**
 * Report SET / MISSING / INVALID for launch env. Never prints secret values.
 * Local: .env.local
 * Vercel Production: API list (keys + targets only) when VERCEL_TOKEN is set.
 */
import fs from 'fs';
import path from 'path';

const REQUIRED = [
  'CRON_SECRET',
  'EASEBUZZ_MERCHANT_KEY',
  'EASEBUZZ_SALT',
  'EASEBUZZ_ENV',
  'RESEND_API_KEY',
  'TRANSACTIONAL_FROM_EMAIL',
  'SENTRY_DSN',
] as const;

const TEAM_SLUG = 'qa-la-labs-s-projects';
const PROJECT_NAME = 'streetplayr-live';

function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function statusFor(key: string, value: string | undefined): 'SET' | 'MISSING' | 'INVALID' {
  if (!value || !value.trim()) return 'MISSING';
  if (key === 'EASEBUZZ_ENV' && !['test', 'prod'].includes(value.trim())) return 'INVALID';
  if (key === 'SENTRY_DSN' && !/^https:\/\//.test(value.trim()) && !value.includes('@')) {
    return 'INVALID';
  }
  if (key === 'TRANSACTIONAL_FROM_EMAIL' && !value.includes('@')) return 'INVALID';
  return 'SET';
}

function printEasebuzzEnvValue(value: string | undefined, label: string) {
  if (!value) {
    console.log(`${label} EASEBUZZ_ENV=MISSING`);
    return;
  }
  const v = value.trim();
  if (v === 'prod' || v === 'test') console.log(`${label} EASEBUZZ_ENV=${v}`);
  else console.log(`${label} EASEBUZZ_ENV=INVALID`);
}

async function listVercelProductionKeys(token: string): Promise<{
  keys: Set<string>;
  easebuzzEnv: string | null;
  error?: string;
}> {
  const url = `https://api.vercel.com/v10/projects/${PROJECT_NAME}/env?teamId=${TEAM_SLUG}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const json = (await res.json()) as any;
  if (!res.ok) {
    return { keys: new Set(), easebuzzEnv: null, error: `HTTP ${res.status}` };
  }
  const rows = Array.isArray(json) ? json : json.envs ?? json.env ?? [];
  const prod = (rows as any[]).filter((e) => (e.target ?? []).includes('production'));
  const keys = new Set(prod.map((e) => e.key as string));
  const easeRow = prod.find((e) => e.key === 'EASEBUZZ_ENV');
  // Vercel list API does not return decrypted values for sensitive keys.
  // EASEBUZZ_ENV is typically encrypted/plain — value may be present.
  const easebuzzEnv = typeof easeRow?.value === 'string' ? easeRow.value : null;
  return { keys, easebuzzEnv };
}

async function main() {
  const local = loadEnvLocal();
  console.log('=== LOCAL .env.local ===');
  for (const key of REQUIRED) {
    const st = statusFor(key, local[key] ?? process.env[key]);
    console.log(`LOCAL ${key}=${st}`);
  }
  const demoInv = process.env.DEMO_INVENTORY_MODE?.trim();
  console.log(`LOCAL DEMO_INVENTORY_MODE=${demoInv === 'true' ? 'true' : (demoInv ? 'SET_NON_TRUE' : 'MISSING')}`);

  const token = (process.env.VERCEL_TOKEN || local.VERCEL_TOKEN || '').trim();
  console.log(`VERCEL_TOKEN=${token ? 'SET' : 'MISSING'}`);
  if (!token) {
    console.log('=== VERCEL PRODUCTION ===');
    for (const key of REQUIRED) console.log(`VERCEL ${key}=UNVERIFIED`);
    console.log('VERCEL EASEBUZZ_ENV=UNVERIFIED');
    return;
  }

  const listed = await listVercelProductionKeys(token);
  console.log('=== VERCEL PRODUCTION ===');
  if (listed.error) {
    console.log(`VERCEL list error=${listed.error}`);
    for (const key of REQUIRED) console.log(`VERCEL ${key}=UNVERIFIED`);
    return;
  }
  for (const key of REQUIRED) {
    console.log(`VERCEL ${key}=${listed.keys.has(key) ? 'SET' : 'MISSING'}`);
  }
  if (listed.easebuzzEnv) printEasebuzzEnvValue(listed.easebuzzEnv, 'VERCEL');
  else console.log('VERCEL EASEBUZZ_ENV value=UNVERIFIED (key presence only)');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
