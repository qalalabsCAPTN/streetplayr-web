import crypto from 'node:crypto';

export const NOTIFY_ME_SPREADSHEET_ID = '11t9Lq0Uib-87tke66bATy0DkhDfvWe-E7snGGX5uc0M';
export const NOTIFY_ME_SHEET_RANGE = 'Sheet1';

export const NOTIFY_ME_HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Timestamp',
  'Product Name',
  'Product ID',
  'Product Handle',
  'Variants',
] as const;

export type NotifyMeSheetRow = {
  name: string;
  email: string;
  phone: string;
  timestamp: string;
  productName: string;
  productId: string;
  productHandle: string;
  variants: string;
};

export function sheetHeadersNeedUpdate(current: string[] | undefined | null): boolean {
  const row = (current ?? []).map((v) => String(v).trim());
  return NOTIFY_ME_HEADERS.some((h, i) => (row[i] || '') !== h);
}

export function notifyMeSheetValues(row: NotifyMeSheetRow): string[] {
  return [
    row.name,
    row.email,
    row.phone,
    row.timestamp,
    row.productName,
    row.productId,
    row.productHandle,
    row.variants,
  ];
}

function pemFromEnv(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

async function googleAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim();
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY
    ? pemFromEnv(process.env.GOOGLE_SHEETS_PRIVATE_KEY)
    : '';
  if (!email || !key) {
    throw new Error('sheets_not_configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  const signature = signer.sign(key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const json = (await res.json()) as { access_token?: string };
  if (!res.ok || !json.access_token) {
    throw new Error('sheets_auth_failed');
  }
  return json.access_token;
}

async function appendViaAppsScript(row: NotifyMeSheetRow): Promise<void> {
  const url = process.env.NOTIFY_ME_SHEETS_WEBHOOK_URL?.trim();
  if (!url) throw new Error('sheets_not_configured');
  const secret = process.env.NOTIFY_ME_WEBHOOK_SECRET?.trim();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(secret ? { ...row, secret } : row),
  });
  if (!res.ok) throw new Error('sheets_write_failed');
}

async function appendViaSheetsApi(row: NotifyMeSheetRow): Promise<void> {
  const token = await googleAccessToken();
  const id = process.env.NOTIFY_ME_SHEETS_ID?.trim() || NOTIFY_ME_SPREADSHEET_ID;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent('Sheet1!A1:H1')}`,
    { headers }
  );
  if (!headerRes.ok) throw new Error('sheets_write_failed');
  const headerJson = (await headerRes.json()) as { values?: string[][] };
  const expected = [...NOTIFY_ME_HEADERS];
  if (sheetHeadersNeedUpdate(headerJson.values?.[0])) {
    const put = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent('Sheet1!A1:H1')}?valueInputOption=RAW`,
      { method: 'PUT', headers, body: JSON.stringify({ values: [expected] }) }
    );
    if (!put.ok) throw new Error('sheets_write_failed');
  }

  const append = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(`${NOTIFY_ME_SHEET_RANGE}!A:H`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', headers, body: JSON.stringify({ values: [notifyMeSheetValues(row)] }) }
  );
  if (!append.ok) throw new Error('sheets_write_failed');
}

export function notifyMeSheetsConfigured(): boolean {
  return Boolean(
    process.env.NOTIFY_ME_SHEETS_WEBHOOK_URL?.trim() ||
      (process.env.GOOGLE_SHEETS_CLIENT_EMAIL?.trim() && process.env.GOOGLE_SHEETS_PRIVATE_KEY?.trim())
  );
}

/** Append one Notify Me row. Never throws internal Google errors to callers. */
export async function appendNotifyMeRow(row: NotifyMeSheetRow): Promise<{ ok: boolean }> {
  try {
    if (process.env.NOTIFY_ME_SHEETS_WEBHOOK_URL?.trim()) {
      await appendViaAppsScript(row);
      return { ok: true };
    }
    await appendViaSheetsApi(row);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
