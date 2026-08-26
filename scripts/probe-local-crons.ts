import fs from 'fs';
import path from 'path';

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

const ROUTES = [
  '/api/cron/sync-inventory',
  '/api/cron/sync-products',
  '/api/cron/sync-order-status',
  '/api/cron/reconciliation',
  '/api/cron/sync-returns',
];

async function main() {
  loadEnvLocal();
  const secret = process.env.CRON_SECRET!;
  for (const route of ROUTES) {
    try {
      const res = await fetch(`http://localhost:3000${route}`, {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(12000),
      });
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch { /* ignore */ }
      console.log(JSON.stringify({
        route,
        status: res.status,
        err: json?.error ?? null,
        skipped: json?.skipped ?? null,
        processed: json?.processed ?? null,
        keys: json ? Object.keys(json).slice(0, 8) : [],
      }));
    } catch (e) {
      console.log(JSON.stringify({
        route,
        error: e instanceof Error ? e.message : 'fail',
      }));
    }
  }
}

main();
