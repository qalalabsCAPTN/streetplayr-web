/**
 * Presence-only: production launchEnv SMTP from /api/health. Never prints secrets.
 */
import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.log(JSON.stringify({ ok: false, error: 'CRON_SECRET missing locally' }));
    process.exit(1);
  }
  const url = `https://www.streetplayr.com/api/health?secret=${encodeURIComponent(secret)}`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${secret}` } });
  const json = (await res.json()) as {
    status?: string;
    version?: string;
    subsystems?: { launchEnv?: { vars?: Record<string, string> }; webhooks?: { easebuzzConfigured?: boolean } };
  };
  console.log(
    JSON.stringify(
      {
        http: res.status,
        appStatus: json.status,
        version: json.version,
        smtp: json.subsystems?.launchEnv?.vars?.SMTP ?? 'UNAVAILABLE',
        from: json.subsystems?.launchEnv?.vars?.TRANSACTIONAL_FROM_EMAIL ?? 'UNAVAILABLE',
        easebuzz: json.subsystems?.webhooks?.easebuzzConfigured ?? null,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
