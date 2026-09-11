import fs from 'fs';
import path from 'path';
import { UnicommerceSyncService } from './sync';

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
  console.log('--- STARTING STREETPLAYR PRODUCT SYNC CLI ---');
  const syncService = new UnicommerceSyncService();
  const products = await syncService.syncProducts();
  console.log('Product sync result:', products);

  console.log('--- STARTING STREETPLAYR INVENTORY SYNC CLI ---');
  const inventory = await syncService.syncInventory();
  console.log('Inventory sync result:', inventory);
}

main().catch(console.error);
