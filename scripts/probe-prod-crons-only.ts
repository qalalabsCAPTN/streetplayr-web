import fs from 'fs';
import path from 'path';

const ROUTES = [
  '/api/cron/release-expired-reservations',
  '/api/cron/sync-inventory',
  '/api/cron/sync-products',
  '/api/cron/sync-order-status',
  '/api/cron/reconciliation',
  '/api/cron/sync-returns',
];

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

async function hit(route: string, secret?: string) {
  const res = await fetch(`https://www.streetplayr.com${route}`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, err: json?.error ?? text.slice(0, 80) };
}

async function main() {
  loadEnvLocal();
  for (const route of ROUTES) {
    const naked = await hit(route);
    const authed = await hit(route, process.env.CRON_SECRET);
    console.log(JSON.stringify({
      route,
      noAuth: naked,
      withLocalSecret: authed,
    }));
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
