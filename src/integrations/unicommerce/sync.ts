/**
 * Synchronization Services for Unicommerce.
 * Schedulable sync tasks for Products (Catalog) and Inventory.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { UnicommerceLogger } from './logging';
import { UnicommerceProductService } from './products';
import { UnicommerceInventoryService } from './inventory';

export class UnicommerceSyncService {
  private productService: UnicommerceProductService;
  private inventoryService: UnicommerceInventoryService;

  constructor() {
    this.productService = new UnicommerceProductService();
    this.inventoryService = new UnicommerceInventoryService();
  }

  /**
   * Syncs catalog products and variants from Unicommerce into the Supabase database.
   */
  async syncProducts(): Promise<{ success: boolean; processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      await UnicommerceLogger.info('sync.products_start', 'Starting product synchronization job');

      const admin = createAdminClient();

      const skusToSync = [
        'ctt-waffle-xs', 'ctt-waffle-s', 'ctt-waffle-m', 'ctt-waffle-l', 'ctt-waffle-xl', 'ctt-waffle-2xl',
        'black-warrior-xs', 'black-warrior-s', 'black-warrior-m', 'black-warrior-l', 'black-warrior-xl', 'black-warrior-2xl',
        'inspired-xs', 'inspired-s', 'inspired-m', 'inspired-l', 'inspired-xl', 'inspired-2xl',
        'star-tank-dark-xs', 'star-tank-dark-s', 'star-tank-dark-m', 'star-tank-dark-l', 'star-tank-dark-xl', 'star-tank-dark-2xl',
        'carpenter-grey-xs', 'carpenter-grey-s', 'carpenter-grey-m', 'carpenter-grey-l', 'carpenter-grey-xl', 'carpenter-grey-2xl',
        'stick-no-bills-xs', 'stick-no-bills-s', 'stick-no-bills-m', 'stick-no-bills-l', 'stick-no-bills-xl', 'stick-no-bills-2xl',
        'warrior-bob-xs', 'warrior-bob-s', 'warrior-bob-m', 'warrior-bob-l', 'warrior-bob-xl', 'warrior-bob-2xl'
      ];

      // Get default organization and brand ID from an existing product in the database to satisfy constraints
      const { data: sampleProduct } = await admin
        .from('products')
        .select('organization_id, brand_id')
        .limit(1)
        .maybeSingle();

      const orgId = sampleProduct?.organization_id || '00000000-0000-0000-0000-000000000001';
      const brandId = sampleProduct?.brand_id || 'e56b72a5-3746-4c01-a054-885ed3e55c0f';

      // Batch query details
      const normalizedProducts = await this.productService.getProductsBySkus(skusToSync);

      for (const normProd of normalizedProducts) {
        try {
          // Parse parent SKU
          // e.g. "ctt-waffle-s" parent ID/slug is "ctt-waffle"
          const lastDashIndex = normProd.sku.lastIndexOf('-');
          const parentSlug = lastDashIndex > 0 ? normProd.sku.substring(0, lastDashIndex) : normProd.sku;
          const size = lastDashIndex > 0 ? normProd.sku.substring(lastDashIndex + 1).toUpperCase() : 'DEFAULT';

          // 1. Fetch or create Parent Product in Database
          let { data: dbProduct } = await admin
            .from('products')
            .select('id')
            .eq('slug', parentSlug)
            .maybeSingle();

          if (!dbProduct) {
            // Create parent product. Note that products table does not have a "price" column, only variants do.
            const { data: newProd, error: createError } = await admin
              .from('products')
              .insert({
                organization_id: orgId,
                brand_id: brandId,
                title: normProd.name.replace(/ - [A-Z0-9]+$/i, ''), // Clean name from size
                slug: parentSlug,
                description: normProd.description || 'Synced from Unicommerce',
                featured_image_url: normProd.imageUrl || null,
                status: normProd.enabled ? 'active' : 'draft',
              })
              .select('id')
              .single();

            if (createError || !newProd) {
              throw new Error(`Failed to create parent product ${parentSlug}: ${createError?.message}`);
            }
            dbProduct = newProd;
          }

          // 2. Upsert Variant manually to handle missing UNIQUE constraint on SKU column
          const { data: existingVariant, error: checkError } = await admin
            .from('product_variants')
            .select('id')
            .eq('sku', normProd.sku)
            .maybeSingle();

          if (checkError) {
            throw new Error(`Failed to check variant existence for SKU ${normProd.sku}: ${checkError.message}`);
          }

          if (existingVariant) {
            // Update
            const { error: variantError } = await admin
              .from('product_variants')
              .update({
                title: size,
                price: Math.round(normProd.price),
                attributes: { color: 'Default', size },
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingVariant.id);

            if (variantError) {
              throw new Error(`Failed to update variant ${normProd.sku}: ${variantError.message}`);
            }
          } else {
            // Insert
            const { error: variantError } = await admin
              .from('product_variants')
              .insert({
                product_id: dbProduct.id,
                sku: normProd.sku,
                title: size,
                price: Math.round(normProd.price),
                attributes: { color: 'Default', size },
                updated_at: new Date().toISOString(),
              });

            if (variantError) {
              throw new Error(`Failed to insert variant ${normProd.sku}: ${variantError.message}`);
            }
          }

          processed++;
        } catch (err: any) {
          errors++;
          await UnicommerceLogger.error(
            'sync.product_item_failed',
            `Failed syncing product SKU ${normProd.sku}`,
            err,
            normProd.sku
          );
        }
      }

      await UnicommerceLogger.info(
        'sync.products_completed',
        `Product sync job completed. Processed: ${processed}, Errors: ${errors}`
      );
      return { success: true, processed, errors };
    } catch (err: any) {
      await UnicommerceLogger.error('sync.products_error', 'Product synchronization job crashed', err);
      return { success: false, processed, errors };
    }
  }

  /**
   * Syncs active variant inventory counts from Unicommerce snapshot API to the DB's inventory table.
   */
  async syncInventory(): Promise<{ success: boolean; processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    try {
      await UnicommerceLogger.info('sync.inventory_start', 'Starting inventory synchronization job');

      const admin = createAdminClient();

      // 1. Fetch all active variants from database that have a SKU
      const { data: dbVariants, error: fetchError } = await admin
        .from('product_variants')
        .select('id, sku')
        .not('sku', 'is', null);

      if (fetchError || !dbVariants) {
        throw new Error(`Failed to load variants from database: ${fetchError?.message}`);
      }

      const skus = dbVariants.map((v) => v.sku);
      if (skus.length === 0) {
        await UnicommerceLogger.warn('sync.inventory_no_skus', 'No active SKUs found in database for inventory sync');
        return { success: true, processed: 0, errors: 0 };
      }

      // 2. Fetch inventory snapshot in chunks of 100 to prevent API timeouts or payload limits
      const chunkSize = 100;
      const snapshots: Array<{ sku: string; stock: number }> = [];

      for (let i = 0; i < skus.length; i += chunkSize) {
        const chunk = skus.slice(i, i + chunkSize);
        const chunkSnapshots = await this.inventoryService.getInventorySnapshot(chunk);
        snapshots.push(...chunkSnapshots);
      }

      // 3. Update stock quantity in the database inventory table
      for (const snap of snapshots) {
        try {
          const dbVariant = dbVariants.find((v) => v.sku === snap.sku);
          if (!dbVariant) continue;

          // Check if there is an existing inventory record for this variant
          const { data: existingInv, error: checkError } = await admin
            .from('inventory')
            .select('id')
            .eq('variant_id', dbVariant.id)
            .maybeSingle();

          if (checkError) {
            throw new Error(`Failed to check existing inventory for variant ${dbVariant.id}: ${checkError.message}`);
          }

          if (existingInv) {
            // Update existing record
            const { error: updateError } = await admin
              .from('inventory')
              .update({
                quantity: Math.max(0, snap.stock),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingInv.id);

            if (updateError) {
              throw new Error(`Failed to update inventory record ${existingInv.id}: ${updateError.message}`);
            }
          } else {
            // Insert new record
            const { error: insertError } = await admin
              .from('inventory')
              .insert({
                variant_id: dbVariant.id,
                quantity: Math.max(0, snap.stock),
                reserved_quantity: 0,
                low_stock_threshold: 10,
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              throw new Error(`Failed to insert inventory record for variant ${dbVariant.id}: ${insertError.message}`);
            }
          }

          processed++;
        } catch (err: any) {
          errors++;
          await UnicommerceLogger.error(
            'sync.inventory_item_failed',
            `Failed updating stock quantity for SKU ${snap.sku}`,
            err,
            snap.sku
          );
        }
      }

      await UnicommerceLogger.info(
        'sync.inventory_completed',
        `Inventory sync job completed. Processed: ${processed}, Errors: ${errors}`
      );
      return { success: true, processed, errors };
    } catch (err: any) {
      await UnicommerceLogger.error('sync.inventory_error', 'Inventory synchronization job crashed', err);
      return { success: false, processed, errors };
    }
  }
}
