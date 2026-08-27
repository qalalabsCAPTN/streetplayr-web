/**
 * Redeploy latest streetplayr-live production + preview so new env is picked up.
 * Does not touch playrfrontend. Never prints tokens.
 */
const PROJECT_ID = 'prj_cGINK094IpBFvSTsdU6MU5NJ3z2y';
const PROJECT_NAME = 'streetplayr-live';

async function vercelFetch(token: string, apiPath: string, init?: RequestInit) {
  const res = await fetch(`https://api.vercel.com${apiPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
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
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 700) };
}

async function redeploy(token: string, uid: string, target: string) {
  const res = await fetch(`https://api.vercel.com/v13/deployments/${uid}/redeploy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: PROJECT_NAME, target }),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return {
    ok: res.ok,
    status: res.status,
    id: (json as { id?: string; uid?: string })?.id || (json as { uid?: string })?.uid || null,
    error: res.ok ? null : text.slice(0, 400),
  };
}

async function main() {
  const token = (process.env.VERCEL_TOKEN || '').trim();
  if (!token) {
    console.log(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN missing' }));
    process.exit(1);
  }

  const proj = await vercelFetch(token, `/v9/projects/${PROJECT_ID}`);
  const name = String((proj.json as { name?: string })?.name || '');
  if (name !== PROJECT_NAME || /playrfrontend/i.test(name)) {
    console.log(JSON.stringify({ ok: false, error: `Refusing ${name}` }));
    process.exit(1);
  }

  const prod = await vercelFetch(
    token,
    `/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=1`
  );
  const preview = await vercelFetch(
    token,
    `/v6/deployments?projectId=${PROJECT_ID}&target=preview&limit=1`
  );
  const prodUid = (prod.json as { deployments?: Array<{ uid: string; url?: string }> })?.deployments?.[0];
  const previewUid = (preview.json as { deployments?: Array<{ uid: string; url?: string }> })?.deployments?.[0];

  const results: unknown[] = [];
  if (prodUid?.uid) {
    results.push({ kind: 'production', from: prodUid.url, ...(await redeploy(token, prodUid.uid, 'production')) });
  } else {
    results.push({ kind: 'production', ok: false, error: 'no production deployment' });
  }
  if (previewUid?.uid) {
    results.push({ kind: 'preview', from: previewUid.url, ...(await redeploy(token, previewUid.uid, 'preview')) });
  } else {
    results.push({ kind: 'preview', ok: false, error: 'no preview deployment' });
  }

  console.log(JSON.stringify({ ok: results.every((r) => (r as { ok?: boolean }).ok), project: name, results }, null, 2));
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
