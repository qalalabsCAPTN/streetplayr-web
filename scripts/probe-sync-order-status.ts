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
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

fetch('http://localhost:3000/api/cron/sync-order-status', {
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  signal: AbortSignal.timeout(15000),
})
  .then(async (r) => {
    const j = await r.json();
    console.log(JSON.stringify({ status: r.status, j }));
  })
  .catch((e) => {
    console.log(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  });
