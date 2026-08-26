/**
 * Probe production + local health launchEnv (presence only).
 * Uses CRON_SECRET from .env.local as Bearer. Never prints secrets.
 */
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

async function probe(label: string, base: string, secret?: string) {
  const headers: Record<string, string> = {};
  if (secret) headers.Authorization = `Bearer ${secret}`;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/health`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json()) as any;
    const detailed = Boolean(json?.subsystems?.launchEnv || json?.subsystems?.env?.details);
    console.log(JSON.stringify({
      label,
      http: res.status,
      environment: json.environment ?? null,
      status: json.status ?? null,
      detailed,
      launchEnv: json.subsystems?.launchEnv ?? null,
      cron: json.subsystems?.cron ?? null,
      webhooks: json.subsystems?.webhooks ?? null,
    }));
  } catch (e) {
    console.log(JSON.stringify({
      label,
      error: e instanceof Error ? e.message : 'fetch failed',
    }));
  }
}

async function main() {
  loadEnvLocal();
  const secret = process.env.CRON_SECRET;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.streetplayr.com';
  console.log(`SITE=${site.startsWith('http') ? site : 'INVALID'}`);
  await probe('prod-public', site);
  await probe('prod-auth', site, secret);
  await probe('local-public', 'http://localhost:3000');
  await probe('local-auth', 'http://localhost:3000', secret);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
