import fs from 'fs';
import path from 'path';
import { UnicommerceSyncService } from './sync';
import { createAdminClient } from '@/lib/supabase/admin';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq);
    let v = t.slice(eq + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  console.log('--- STARTING INVENTORY SYNC CLI ---');
  const syncService = new UnicommerceSyncService();
  const res = await syncService.syncInventory();
  console.log('Sync Result:', res);

  console.log('\n--- VERIFYING NULL INVENTORY COUNT IN DB ---');
  const admin = createAdminClient();

  // Fetch all variants
  const { data: selectData, error: selectError } = await admin
    .from('product_variants')
    .select('id, sku')
    .not('sku', 'is', null);

  if (selectError) {
    console.error('Failed to select product variants:', selectError.message);
    return;
  }

  const { data: invData, error: invError } = await admin
    .from('inventory')
    .select('variant_id');

  if (invError) {
    console.error('Failed to select inventory:', invError.message);
    return;
  }

  const existingIds = new Set((invData || []).map((i) => i.variant_id));
  const nullVariants = (selectData || []).filter((v) => !existingIds.has(v.id));

  console.log(`Total Variants with SKU: ${selectData?.length}`);
  console.log(`Variants with Inventory Row: ${existingIds.size}`);
  console.log(`Variants with NULL Inventory Count: ${nullVariants.length}`);
  if (nullVariants.length > 0) {
    console.log('Sample NULL Variants:', nullVariants.slice(0, 10));
  }
}

main().catch(console.error);
