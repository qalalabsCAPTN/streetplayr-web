/**
 * Probe Vercel production cron routes. Never prints secrets.
 * No-auth should be 401 or 500. Local CRON_SECRET used only as Bearer.
 */
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

async function hit(base: string, route: string, secret?: string) {
  const res = await fetch(`${base}${route}`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  const err = json?.error ?? null;
  return { status: res.status, err, skipped: json?.skipped ?? null, processed: json?.processed ?? null };
}

async function main() {
  loadEnvLocal();
  const secret = process.env.CRON_SECRET;
  const prod = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.streetplayr.com').replace(/\/$/, '');
  const local = 'http://localhost:3000';

  for (const target of [
    { label: 'prod', base: prod },
    { label: 'local', base: local },
  ]) {
    for (const route of ROUTES) {
      const naked = await hit(target.base, route);
      const authed = secret ? await hit(target.base, route, secret) : { status: 0, err: 'no local secret', skipped: null, processed: null };
      console.log(JSON.stringify({
        target: target.label,
        route,
        noAuth: { status: naked.status, err: naked.err },
        withLocalSecret: { status: authed.status, err: authed.err, skipped: authed.skipped, processed: authed.processed },
      }));
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
