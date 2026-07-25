/**
 * Standalone UniCommerce SOAP probe (no Next.js / server-only imports).
 */
function loadEnvLocal() {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  const apiUrl = (process.env.UNICOMMERCE_API_URL || '').replace(/\/$/, '');
  const username = process.env.UNICOMMERCE_USERNAME || '';
  const password = process.env.UNICOMMERCE_PASSWORD || '';
  const facility = process.env.UNICOMMERCE_FACILITY_CODE || '';
  const demo = process.env.DEMO_INVENTORY_MODE === 'true';

  console.log('[uc] apiUrl set:', Boolean(apiUrl), apiUrl ? new URL(apiUrl).host : '');
  console.log('[uc] username set:', Boolean(username));
  console.log('[uc] facility:', facility || '(empty)');
  console.log('[uc] demoMode:', demo);

  if (!apiUrl || !username || !password || !facility) {
    console.error('[uc] FAIL — missing credentials');
    process.exitCode = 1;
    return;
  }

  const soapUrl = `${apiUrl}/services/soap/?version=1.9`;
  const body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:GetItemTypeRequest><ser:SkuCode>PS-TEE-CRT-WHT</ser:SkuCode></ser:GetItemTypeRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await fetch(`${soapUrl}&facility=${encodeURIComponent(facility)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: 'GetItemTypeRequest',
      Facility: facility,
    },
    body,
  });
  const text = await res.text();
  console.log('[uc] http:', res.status);
  console.log('[uc] bytes:', text.length);

  if (!res.ok) {
    console.error('[uc] FAIL — HTTP', res.status, text.slice(0, 300));
    process.exitCode = 1;
    return;
  }
  if (/faultstring|SOAP-ENV:Fault|soapenv:Fault/i.test(text)) {
    console.error('[uc] FAIL — SOAP fault', text.slice(0, 400));
    process.exitCode = 1;
    return;
  }
  const successful = /<Successful>\s*true\s*<\/Successful>/i.test(text);
  const hasSku = /PS-TEE-CRT-WHT/i.test(text);
  console.log('[uc] Successful=true:', successful, 'sku echo:', hasSku);
  if (!successful && !hasSku) {
    console.error('[uc] FAIL — unexpected body', text.slice(0, 400));
    process.exitCode = 1;
    return;
  }
  console.log('[uc] OK — UniCommerce SOAP live');
}

main().catch((e) => {
  console.error('[uc] FAIL —', e);
  process.exitCode = 1;
});
