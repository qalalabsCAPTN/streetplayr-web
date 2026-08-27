/**
 * Upsert UniCommerce SOAP env on streetplayr-live ONLY (production + preview/staging).
 * Never writes to playrfrontend. Never prints secret values.
 *
 * Usage: $env:VERCEL_TOKEN="vcp_..."; npx tsx scripts/vercel-prod-unicommerce-env.ts
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT_NAME = 'streetplayr-live';
const BLOCKED_PROJECTS = ['playrfrontend', 'playr-frontend', 'playr_frontend'];
const KEYS = [
  'UNICOMMERCE_API_URL',
  'UNICOMMERCE_USERNAME',
  'UNICOMMERCE_PASSWORD',
  'UNICOMMERCE_FACILITY_CODE',
  'UNICOMMERCE_CHANNEL_CODE',
] as const;

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

function readVercelCliToken(): string {
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.data', 'com.vercel.cli', 'auth.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json'),
  ];
  let best = '';
  let bestExp = 0;
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, 'utf8')) as { token?: string; expiresAt?: number };
      const token = String(json.token ?? '').trim();
      const exp = Number(json.expiresAt ?? 0);
      if (token && exp >= bestExp) {
        best = token;
        bestExp = exp;
      }
    } catch {
      /* ignore */
    }
  }
  return best;
}

function isBlockedName(name: string): boolean {
  const n = name.toLowerCase();
  return BLOCKED_PROJECTS.some((b) => n.includes(b));
}

async function vercelFetch(token: string, apiPath: string, init?: RequestInit, teamId?: string) {
  const url = new URL(`https://api.vercel.com${apiPath}`);
  if (teamId) url.searchParams.set('teamId', teamId);
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
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 600) };
}

function envRows(json: unknown): Array<{
  id?: string;
  key?: string;
  target?: string[];
  customEnvironmentIds?: string[];
}> {
  if (Array.isArray(json)) return json;
  const obj = json as { envs?: unknown[]; env?: unknown[] };
  return (obj.envs ?? obj.env ?? []) as Array<{
    id?: string;
    key?: string;
    target?: string[];
    customEnvironmentIds?: string[];
  }>;
}

async function resolveStreetplayr(token: string): Promise<{
  teamId: string;
  projectId: string;
  projectName: string;
  customEnvs: Array<{ id: string; slug: string }>;
}> {
  const teamsRes = await vercelFetch(token, '/v2/teams');
  const teams = ((teamsRes.json as { teams?: Array<{ id: string; slug: string }> })?.teams ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
  }));
  const tryIds = ['', ...teams.map((t) => t.id)];

  for (const teamId of tryIds) {
    const listed = await vercelFetch(token, '/v9/projects?limit=100', undefined, teamId || undefined);
    const projects = ((listed.json as { projects?: Array<{ id: string; name: string }> })?.projects ?? []);
    for (const p of projects) {
      if (isBlockedName(p.name)) continue;
      if (p.name === PROJECT_NAME) {
        const customs = await vercelFetch(
          token,
          `/v9/projects/${p.id}/custom-environments`,
          undefined,
          teamId || undefined
        );
        const customEnvs = (
          ((customs.json as { environments?: Array<{ id: string; slug?: string; name?: string }> })?.environments
            ?? (Array.isArray(customs.json) ? customs.json : [])) as Array<{
            id: string;
            slug?: string;
            name?: string;
          }>
        )
          .filter((e) => e.id)
          .map((e) => ({ id: e.id, slug: e.slug || e.name || e.id }));
        return { teamId: teamId || '', projectId: p.id, projectName: p.name, customEnvs };
      }
    }
  }

  // Project token often cannot list teams/projects — fetch by exact name.
  const direct = await vercelFetch(token, `/v9/projects/${PROJECT_NAME}`);
  if (direct.ok) {
    const proj = direct.json as { id?: string; name?: string; accountId?: string };
    if (proj.name && isBlockedName(proj.name)) {
      throw new Error(`Refusing to touch blocked project ${proj.name}`);
    }
    if (proj.id && (proj.name === PROJECT_NAME || !proj.name)) {
      const customs = await vercelFetch(token, `/v9/projects/${proj.id}/custom-environments`);
      const customEnvs = (
        ((customs.json as { environments?: Array<{ id: string; slug?: string; name?: string }> })?.environments
          ?? (Array.isArray(customs.json) ? customs.json : [])) as Array<{
          id: string;
          slug?: string;
          name?: string;
        }>
      )
        .filter((e) => e.id)
        .map((e) => ({ id: e.id, slug: e.slug || e.name || e.id }));
      return {
        teamId: proj.accountId || '',
        projectId: proj.id,
        projectName: proj.name || PROJECT_NAME,
        customEnvs,
      };
    }
  }

  throw new Error('streetplayr-live not found for this token (playrfrontend ignored)');
}

async function main() {
  const local = loadEnvLocal();
  const token = (process.env.VERCEL_TOKEN || local.VERCEL_TOKEN || readVercelCliToken()).trim();
  if (!token) {
    console.log(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN missing' }));
    process.exit(1);
  }

  const values: Record<string, string> = {};
  for (const key of KEYS) {
    const v = (local[key] || process.env[key] || '').trim();
    if (!key.endsWith('_CHANNEL_CODE') && !v) {
      console.log(JSON.stringify({ ok: false, error: `Missing ${key} in .env.local` }));
      process.exit(1);
    }
    values[key] = key === 'UNICOMMERCE_CHANNEL_CODE' ? v || 'CUSTOM' : v;
  }
  if (!/^https:\/\//i.test(values.UNICOMMERCE_API_URL)) {
    console.log(JSON.stringify({ ok: false, error: 'UNICOMMERCE_API_URL must be https' }));
    process.exit(1);
  }
  const host = new URL(values.UNICOMMERCE_API_URL).host;

  const resolved = await resolveStreetplayr(token);
  if (resolved.projectName !== PROJECT_NAME || isBlockedName(resolved.projectName)) {
    console.log(JSON.stringify({ ok: false, error: `Refusing project ${resolved.projectName}` }));
    process.exit(1);
  }

  const stagingIds = resolved.customEnvs
    .filter((e) => /stag/i.test(e.slug))
    .map((e) => e.id);
  const target = ['production', 'preview'] as string[];
  const customEnvironmentIds = stagingIds;

  const listed = await vercelFetch(
    token,
    `/v10/projects/${resolved.projectId}/env`,
    undefined,
    resolved.teamId || undefined
  );
  if (!listed.ok) {
    console.log(JSON.stringify({ ok: false, step: 'list', http: listed.status, error: listed.text }));
    process.exit(1);
  }
  const all = envRows(listed.json);

  const results: Array<{ key: string; action: string; http: number }> = [];
  for (const key of KEYS) {
    const existing = all.filter((e) => e.key === key);
    const body: Record<string, unknown> = {
      key,
      value: values[key],
      type: 'encrypted',
      target,
      comment: 'UniCommerce SOAP — streetplayr-live live+staging',
    };
    if (customEnvironmentIds.length) body.customEnvironmentIds = customEnvironmentIds;

    if (existing.length) {
      let lastHttp = 0;
      for (const row of existing) {
        if (!row.id) continue;
        const upd = await vercelFetch(
          token,
          `/v9/projects/${resolved.projectId}/env/${row.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              value: values[key],
              type: 'encrypted',
              target,
              ...(customEnvironmentIds.length ? { customEnvironmentIds } : {}),
            }),
          },
          resolved.teamId || undefined
        );
        lastHttp = upd.status;
        if (!upd.ok) {
          console.log(JSON.stringify({ ok: false, key, step: 'patch', http: upd.status, error: upd.text }));
          process.exit(1);
        }
      }
      results.push({ key, action: 'patch', http: lastHttp });
    } else {
      const created = await vercelFetch(
        token,
        `/v10/projects/${resolved.projectId}/env?upsert=true`,
        { method: 'POST', body: JSON.stringify(body) },
        resolved.teamId || undefined
      );
      results.push({ key, action: 'create', http: created.status });
      if (!created.ok) {
        console.log(JSON.stringify({ ok: false, key, step: 'create', http: created.status, error: created.text }));
        process.exit(1);
      }
    }
  }

  const after = await vercelFetch(
    token,
    `/v10/projects/${resolved.projectId}/env`,
    undefined,
    resolved.teamId || undefined
  );
  const afterRows = envRows(after.json);
  const presence = Object.fromEntries(
    KEYS.map((k) => {
      const rows = afterRows.filter((e) => e.key === k);
      const targets = [...new Set(rows.flatMap((e) => e.target ?? []))];
      return [k, rows.length ? `SET:${targets.join('+') || 'unknown'}` : 'MISSING'];
    })
  );

  console.log(
    JSON.stringify({
      ok: true,
      project: resolved.projectName,
      projectId: resolved.projectId,
      soapHost: host,
      channel: values.UNICOMMERCE_CHANNEL_CODE,
      targets: target,
      customStaging: resolved.customEnvs.map((e) => e.slug),
      facilitySet: Boolean(values.UNICOMMERCE_FACILITY_CODE),
      usernameSet: Boolean(values.UNICOMMERCE_USERNAME),
      passwordSet: Boolean(values.UNICOMMERCE_PASSWORD),
      upserts: results,
      presence,
    })
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
