/**
 * Read-only: dump unique UniCommerce <Brand> values. No credentials printed.
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
  const { soapRequest } = await import('../src/integrations/unicommerce/soapClient');

  const counts = new Map<string, number>();
  let total = 0;
  let withBrand = 0;
  let start = 0;
  let pages = 0;

  while (pages < 15) {
    const searchRes = await soapRequest<{
      successful: boolean;
      itemTypes: Array<{ skuCode: string; brand?: string; name?: string }>;
    }>(
      'SearchItemTypesRequest',
      `<ser:SearchItemTypesRequest>
        <ser:SearchOptions>
          <ser:DisplayStart>${start}</ser:DisplayStart>
          <ser:DisplayLength>100</ser:DisplayLength>
        </ser:SearchOptions>
      </ser:SearchItemTypesRequest>`
    );
    const items = searchRes.itemTypes || [];
    if (!searchRes.successful || items.length === 0) break;
    pages++;
    for (const it of items) {
      total++;
      const brand = (it.brand || '').trim();
      if (brand) withBrand++;
      const key = brand || '(empty)';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    if (items.length < 100) break;
    start += 100;
  }

  console.log('[brand-probe] SearchItemTypes pages', pages, 'items', total, 'with Brand', withBrand);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [brand, n] of ranked.slice(0, 30)) {
    console.log('[brand-probe] SearchItemTypes Brand=', JSON.stringify(brand), 'count=', n);
  }

  const sampleSkus = [
    'ctt-waffle-s',
    'ctt-waffle-m',
    'black-warrior-m',
    'inspired-m',
    'star-tank-dark-m',
    'PS-TEE-CRT-WHT',
  ];
  for (const sku of sampleSkus) {
    try {
      const detail = await soapRequest<{
        successful: boolean;
        itemTypeDTO?: { skuCode?: string; brand?: string; name?: string };
      }>(
        'GetItemTypeRequest',
        `<ser:GetItemTypeRequest><ser:SkuCode>${sku}</ser:SkuCode></ser:GetItemTypeRequest>`
      );
      const dto = detail.itemTypeDTO;
      console.log(
        '[brand-probe] GetItemType',
        sku,
        'ok=',
        detail.successful,
        'Brand=',
        JSON.stringify(dto?.brand ?? ''),
        'Name=',
        (dto?.name || '').slice(0, 60)
      );
    } catch (e) {
      console.log('[brand-probe] GetItemType fail', sku, e instanceof Error ? e.message : 'error');
    }
  }
}

main().catch((e) => {
  console.error('[brand-probe] crash', e instanceof Error ? e.message : 'error');
  process.exitCode = 1;
});
