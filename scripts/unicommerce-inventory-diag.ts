/**
 * Read-only UniCommerce inventory probe. Does not write inventory rows.
 * Reports counts only — no credentials.
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
  const { createAdminClient } = await import('../lib/supabase/admin');
  const { UnicommerceInventoryService } = await import('../src/integrations/unicommerce/inventory');

  const admin = createAdminClient();
  const { data: variants, error } = await admin
    .from('product_variants')
    .select('id, sku')
    .not('sku', 'is', null);

  if (error || !variants) {
    console.log('[diag] FAIL variants', error?.message ?? 'none');
    process.exitCode = 1;
    return;
  }

  const { data: invRows } = await admin.from('inventory').select('variant_id, quantity');
  const qtyByVariant = new Map((invRows ?? []).map((r) => [r.variant_id, Number(r.quantity ?? 0)]));
  const beforeZero = (invRows ?? []).filter((r) => Number(r.quantity ?? 0) <= 0).length;
  const beforePositive = (invRows ?? []).filter((r) => Number(r.quantity ?? 0) > 0).length;

  const service = new UnicommerceInventoryService();
  const chunkSize = 50;
  let received = 0;
  let explicitZero = 0;
  let positive = 0;
  let failedChunks = 0;
  let emptyChunks = 0;
  const matched = new Set<string>();

  for (let i = 0; i < variants.length; i += chunkSize) {
    const chunk = variants.slice(i, i + chunkSize).map((v) => v.sku);
    try {
      const snaps = await service.getInventorySnapshot(chunk);
      if (!snaps.length) {
        emptyChunks++;
        continue;
      }
      for (const snap of snaps) {
        received++;
        matched.add(snap.sku.toLowerCase());
        if (snap.stock === 0) explicitZero++;
        else if (snap.stock > 0) positive++;
      }
    } catch {
      failedChunks++;
    }
  }

  const skuSet = new Set(variants.map((v) => v.sku.toLowerCase()));
  const matchedInCatalog = [...matched].filter((s) => skuSet.has(s)).length;
  const unmatched = received - matchedInCatalog;

  console.log('[diag] catalog SKUs', variants.length);
  console.log('[diag] inventory rows', invRows?.length ?? 0);
  console.log('[diag] before positive', beforePositive, 'before zero/empty', beforeZero);
  console.log('[diag] snapshots received', received);
  console.log('[diag] matched catalog SKUs', matchedInCatalog);
  console.log('[diag] unmatched SKUs', unmatched);
  console.log('[diag] explicit zero', explicitZero);
  console.log('[diag] explicit positive', positive);
  console.log('[diag] empty chunks', emptyChunks);
  console.log('[diag] failed chunks', failedChunks);
  console.log('[diag] would skip (no snapshot)', variants.length - matchedInCatalog);
  void qtyByVariant;
}

main().catch((e) => {
  console.error('[diag] crash', e instanceof Error ? e.message : 'error');
  process.exitCode = 1;
});
