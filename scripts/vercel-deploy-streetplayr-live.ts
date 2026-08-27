/**
 * Deploy current working tree to streetplayr-live production only.
 * Refuses playrfrontend. Never prints tokens.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PROJECT_NAME = 'streetplayr-live';
const PROJECT_ID = 'prj_cGINK094IpBFvSTsdU6MU5NJ3z2y';

async function vercelFetch(token: string, apiPath: string, init?: RequestInit) {
  const res = await fetch(`https://api.vercel.com${apiPath}`, {
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

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { env, cwd: process.cwd(), shell: true });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d.toString();
      process.stdout.write(d);
    });
    child.stderr.on('data', (d) => {
      out += d.toString();
      process.stderr.write(d);
    });
    child.on('close', (code) => resolve({ code: code ?? 1, out }));
  });
}

async function main() {
  const token = (process.env.VERCEL_TOKEN || '').trim();
  if (!token) {
    console.log(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN missing' }));
    process.exit(1);
  }

  const proj = await vercelFetch(token, `/v9/projects/${PROJECT_ID}`);
  if (!proj.ok) {
    console.log(JSON.stringify({ ok: false, step: 'project', http: proj.status, error: proj.text }));
    process.exit(1);
  }
  const name = String((proj.json as { name?: string }).name || '');
  const accountId = String((proj.json as { accountId?: string }).accountId || '');
  if (name !== PROJECT_NAME || /playrfrontend/i.test(name)) {
    console.log(JSON.stringify({ ok: false, error: `Refusing project ${name}` }));
    process.exit(1);
  }

  const dir = path.join(process.cwd(), '.vercel');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'project.json'),
    JSON.stringify({ orgId: accountId, projectId: PROJECT_ID, projectName: PROJECT_NAME }, null, 2)
  );

  const env = { ...process.env, VERCEL_TOKEN: token, VERCEL_ORG_ID: accountId, VERCEL_PROJECT_ID: PROJECT_ID };
  console.log(JSON.stringify({ ok: true, step: 'linked', project: name, orgSet: Boolean(accountId) }));

  const deployed = await run('npx', ['vercel', 'deploy', '--prod', '--yes'], env);
  if (deployed.code !== 0) {
    console.log(JSON.stringify({ ok: false, step: 'deploy', code: deployed.code }));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, step: 'deployed', project: PROJECT_NAME }));
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
