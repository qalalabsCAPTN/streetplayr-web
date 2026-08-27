/**
 * Refresh the StreetPlayR Vercel CLI session (qa-la-labs team).
 * Writes rotated tokens back to the CLI auth file. Never prints tokens.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

const AUTH_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const CLIENT_ID = 'cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp';

async function main() {
  const raw = JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8')) as {
    token?: string;
    refreshToken?: string;
    userId?: string;
    expiresAt?: number;
  };
  if (!raw.refreshToken) {
    console.log(JSON.stringify({ ok: false, error: 'no refresh token' }));
    process.exit(1);
  }

  const discovery = await fetch('https://vercel.com/.well-known/openid-configuration');
  const meta = (await discovery.json()) as { token_endpoint?: string };
  if (!meta.token_endpoint) {
    console.log(JSON.stringify({ ok: false, error: 'no token_endpoint' }));
    process.exit(1);
  }

  const res = await fetch(meta.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: raw.refreshToken,
    }),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    console.log(
      JSON.stringify({
        ok: false,
        http: res.status,
        error: json.error || 'refresh_failed',
        description: json.error_description || null,
      })
    );
    process.exit(1);
  }

  const next = {
    ...raw,
    token: json.access_token,
    refreshToken: json.refresh_token || raw.refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + (json.expires_in || 3600),
  };
  fs.writeFileSync(AUTH_PATH, JSON.stringify(next, null, 2));
  console.log(
    JSON.stringify({
      ok: true,
      userId: raw.userId || null,
      expiresAt: next.expiresAt,
      tokenPrefix: json.access_token.slice(0, 4),
    })
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
