import { UnicommerceSyncService } from './sync';

async function main() {
  console.log('--- STARTING STREETPLAYR PRODUCT SYNC CLI ---');
  const syncService = new UnicommerceSyncService();
  const products = await syncService.syncProducts();
  console.log('Product sync result:', products);

  console.log('--- STARTING STREETPLAYR INVENTORY SYNC CLI ---');
  const inventory = await syncService.syncInventory();
  console.log('Inventory sync result:', inventory);
}

main().catch(console.error);
