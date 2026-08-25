/**
 * Configure Easebuzz production secrets on Vercel ONLY.
 * Does NOT call Easebuzz initiateLink. Does NOT touch Cloud Run.
 *
 * Requires: VERCEL_TOKEN in environment (never commit).
 * Reads live values from .env.local (EASEBUZZ_* only) — never prints them.
 *
 * Usage:
 *   $env:VERCEL_TOKEN="<your-token>"
 *   npx tsx scripts/vercel-prod-easebuzz-env.ts
 */
import fs from 'fs';
import path from 'path';

const TEAM_SLUG = 'qa-la-labs-s-projects';
const PROJECT_NAME = 'streetplayr-live';

const VARS: Array<{
  key: string;
  source: 'env_local' | 'literal';
  literal?: string;
  type: 'sensitive' | 'encrypted';
}> = [
  { key: 'EASEBUZZ_MERCHANT_KEY', source: 'env_local', type: 'sensitive' },
  { key: 'EASEBUZZ_SALT', source: 'env_local', type: 'sensitive' },
  { key: 'EASEBUZZ_ENV', source: 'literal', literal: 'prod', type: 'encrypted' },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    source: 'literal',
    literal: 'https://www.streetplayr.com',
    type: 'encrypted',
  },
];

function loadEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function vercelFetch(token: string, apiPath: string, init?: RequestInit) {
  const sep = apiPath.includes('?') ? '&' : '?';
  const url = `https://api.vercel.com${apiPath}${sep}teamId=${TEAM_SLUG}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 500) };
}

async function main() {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    console.error('FAIL | VERCEL_TOKEN not set — cannot configure Vercel Production env');
    console.error('Set VERCEL_TOKEN from https://vercel.com/account/tokens then re-run.');
    process.exit(1);
  }

  const local = loadEnvLocal();
  const body: Array<{
    key: string;
    value: string;
    type: string;
    target: string[];
    comment?: string;
  }> = [];

  for (const spec of VARS) {
    const value =
      spec.source === 'literal'
        ? spec.literal!
        : local[spec.key]?.trim();
    if (!value) {
      console.error(`FAIL | Missing value for ${spec.key} in .env.local`);
      process.exit(1);
    }
    if (spec.key.startsWith('EASEBUZZ_') && spec.key !== 'EASEBUZZ_ENV') {
      console.log(`OK | ${spec.key} loaded from .env.local (len=${value.length})`);
    } else {
      console.log(`OK | ${spec.key}=${spec.source === 'literal' ? value : 'from env'}`);
    }
    body.push({
      key: spec.key,
      value,
      type: spec.type,
      target: ['production'],
      comment: 'Easebuzz live production — configured by vercel-prod-easebuzz-env.ts',
    });
  }

  if (local.EASEBUZZ_ENV !== 'prod') {
    console.warn(
      `WARN | .env.local EASEBUZZ_ENV=${local.EASEBUZZ_ENV ?? 'unset'} — Vercel Production will be set to prod`
    );
  }

  console.log(`\nUpserting ${body.length} Production env vars on ${PROJECT_NAME} (${TEAM_SLUG})...`);
  const upsert = await vercelFetch(
    token,
    `/v10/projects/${PROJECT_NAME}/env?upsert=true`,
    { method: 'POST', body: JSON.stringify(body) }
  );

  if (!upsert.ok) {
    console.error(`FAIL | Vercel env upsert HTTP ${upsert.status}`);
    console.error(upsert.text);
    process.exit(1);
  }
  console.log(`PASS | Vercel Production env vars upserted (${body.map((b) => b.key).join(', ')})`);

  // List env var keys (never values)
  const listed = await vercelFetch(token, `/v10/projects/${PROJECT_NAME}/env`);
  if (listed.ok && Array.isArray(listed.json)) {
    for (const key of ['EASEBUZZ_MERCHANT_KEY', 'EASEBUZZ_SALT', 'EASEBUZZ_ENV', 'NEXT_PUBLIC_SITE_URL']) {
      const row = (listed.json as any[]).find(
        (e) => e.key === key && (e.target ?? []).includes('production')
      );
      console.log(
        `CHECK | ${key} production exists=${row ? 'YES' : 'NO'} type=${row?.type ?? 'n/a'}`
      );
    }
  }

  // Redeploy latest production deployment
  console.log('\nFetching latest production deployment...');
  const deps = await vercelFetch(
    token,
    `/v6/deployments?projectId=${PROJECT_NAME}&target=production&limit=1`
  );
  const latest = (deps.json as any)?.deployments?.[0];
  if (!latest?.uid) {
    console.warn('WARN | Could not find latest production deployment — redeploy manually');
    process.exit(0);
  }

  console.log(`Redeploying ${latest.uid} (${latest.url ?? 'unknown'})...`);
  const redeploy = await vercelFetch(token, `/v13/deployments/${latest.uid}/redeploy`, {
    method: 'POST',
    body: JSON.stringify({ target: 'production', deploymentId: latest.uid }),
  });

  if (!redeploy.ok) {
    // Fallback: try v13 create deployment redeploy endpoint variant
    console.warn(`WARN | Redeploy HTTP ${redeploy.status} — trigger manual redeploy in Vercel dashboard`);
    console.warn(redeploy.text);
    process.exit(0);
  }

  const newId = (redeploy.json as any)?.id ?? (redeploy.json as any)?.uid ?? 'unknown';
  console.log(`PASS | Production redeploy triggered (deployment=${newId})`);
  console.log('\nWait ~2–5 min, then verify webhook no longer returns "Gateway misconfigured".');
  console.log('LIVE PAYMENT SUBMITTED: NO');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
