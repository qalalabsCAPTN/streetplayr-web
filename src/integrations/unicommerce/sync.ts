/**
 * Synchronization Services for Unicommerce.
 * Schedulable sync tasks for Products (Catalog) and Inventory.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { UnicommerceLogger } from './logging';
import { UnicommerceProductService } from './products';
import { UnicommerceInventoryService } from './inventory';
import { getUnicommerceConfig } from './config';
import { soapRequest } from './soapClient';

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

      const config = getUnicommerceConfig();
      const admin = createAdminClient();

      let normalizedProducts: any[] = [];
      if (config.transportMode === 'SOAP') {
        let start = 0;
        let hasMore = true;
        const allItemTypes: any[] = [];
        while (hasMore) {
          const searchRes = await soapRequest<{ successful: boolean; itemTypes: Array<any> }>(
            'SearchItemTypesRequest',
            `<ser:SearchItemTypesRequest>
              <ser:SearchOptions>
                <ser:DisplayStart>${start}</ser:DisplayStart>
                <ser:DisplayLength>100</ser:DisplayLength>
              </ser:SearchOptions>
            </ser:SearchItemTypesRequest>`
          );
          if (searchRes.successful && searchRes.itemTypes && searchRes.itemTypes.length > 0) {
            allItemTypes.push(...searchRes.itemTypes);
            start += 100;
            if (searchRes.itemTypes.length < 100) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        // Apply Storefront Filtering Strategy
        const allowlistStr = process.env.UNICOMMERCE_SYNC_ALLOWLIST || 
          'ctt-waffle,black-warrior,inspired,star-tank-dark,carpenter-grey,stick-no-bills,warrior-bob,IK5737,IK5738,IK5745';
        const allowedPatterns = allowlistStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

        // Fetch existing variants to allow syncing them
        const { data: existingVariants } = await admin
          .from('product_variants')
          .select('sku')
          .not('sku', 'is', null);
        const existingSkusSet = new Set((existingVariants || []).map(v => v.sku.toLowerCase()));

        const candidates = allItemTypes.filter(it => {
          const skuLower = it.skuCode.toLowerCase();
          const matchesAllowlist = allowedPatterns.some(pattern => skuLower.includes(pattern));
          const existsInDb = existingSkusSet.has(skuLower);
          return matchesAllowlist || existsInDb;
        });

        await UnicommerceLogger.info(
          'sync.products_filter',
          `Filtered ${allItemTypes.length} catalog items down to ${candidates.length} storefront candidates`
        );

        // Chunk fetches to avoid socket issues
        const chunkArray = <T>(arr: T[], size: number): T[][] =>
          Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
          );

        const candidateChunks = chunkArray(candidates, 5);
        for (const candidateChunk of candidateChunks) {
          const detailPromises = candidateChunk.map(async (it) => {
            try {
              const detailRes = await this.productService.getProductBySku(it.skuCode);
              if (detailRes && detailRes.enabled) {
                normalizedProducts.push(detailRes);
              }
            } catch (err) {
              await UnicommerceLogger.error(
                'sync.product_detail_failed',
                `Failed to fetch detail for candidate SKU: ${it.skuCode}`,
                err
              );
            }
          });
          await Promise.all(detailPromises);
        }
      } else {
        const skusToSync = [
          'ctt-waffle-xs', 'ctt-waffle-s', 'ctt-waffle-m', 'ctt-waffle-l', 'ctt-waffle-xl', 'ctt-waffle-2xl',
          'black-warrior-xs', 'black-warrior-s', 'black-warrior-m', 'black-warrior-l', 'black-warrior-xl', 'black-warrior-2xl',
          'inspired-xs', 'inspired-s', 'inspired-m', 'inspired-l', 'inspired-xl', 'inspired-2xl',
          'star-tank-dark-xs', 'star-tank-dark-s', 'star-tank-dark-m', 'star-tank-dark-l', 'star-tank-dark-xl', 'star-tank-dark-2xl',
          'carpenter-grey-xs', 'carpenter-grey-s', 'carpenter-grey-m', 'carpenter-grey-l', 'carpenter-grey-xl', 'carpenter-grey-2xl',
          'stick-no-bills-xs', 'stick-no-bills-s', 'stick-no-bills-m', 'stick-no-bills-l', 'stick-no-bills-xl', 'stick-no-bills-2xl',
          'warrior-bob-xs', 'warrior-bob-s', 'warrior-bob-m', 'warrior-bob-l', 'warrior-bob-xl', 'warrior-bob-2xl'
        ];
        normalizedProducts = await this.productService.getProductsBySkus(skusToSync);
      }

      // Get default organization and brand ID from an existing product in the database to satisfy constraints
      const { data: sampleProduct } = await admin
        .from('products')
        .select('organization_id, brand_id')
        .limit(1)
        .maybeSingle();

      const orgId = sampleProduct?.organization_id || '00000000-0000-0000-0000-000000000001';
      const brandId = sampleProduct?.brand_id || 'e56b72a5-3746-4c01-a054-885ed3e55c0f';

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
            const { normalizeCollectionSlug, localMembershipFor } = await import(
              '@/lib/products/collections'
            );
            const collectionSlug =
              normalizeCollectionSlug(normProd.category) ||
              localMembershipFor(parentSlug, parentSlug)[0] ||
              null;

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
                metadata: collectionSlug ? { category: collectionSlug } : {},
              })
              .select('id')
              .single();

            if (createError || !newProd) {
              throw new Error(`Failed to create parent product ${parentSlug}: ${createError?.message}`);
            }
            dbProduct = newProd;

            // Link into collection_products when we know the collection slug
            if (collectionSlug) {
              const { data: col } = await admin
                .from('collections')
                .select('id')
                .eq('slug', collectionSlug)
                .maybeSingle();
              if (col?.id) {
                await admin.from('collection_products').upsert(
                  { collection_id: col.id, product_id: newProd.id, sort_order: 0 },
                  { onConflict: 'collection_id,product_id' }
                );
              }
            }
          } else if (normProd.imageUrl) {
            // Backfill missing media on existing UniCommerce parents
            const { data: existingParent } = await admin
              .from('products')
              .select('featured_image_url, metadata')
              .eq('id', dbProduct.id)
              .maybeSingle();
            if (!existingParent?.featured_image_url) {
              const { resolveProductImages } = await import('@/lib/products/image-map');
              const pack = resolveProductImages(parentSlug) || resolveProductImages(normProd.sku);
              const prevMeta =
                existingParent?.metadata && typeof existingParent.metadata === 'object'
                  ? (existingParent.metadata as Record<string, unknown>)
                  : {};
              await admin
                .from('products')
                .update({
                  featured_image_url: normProd.imageUrl,
                  ...(pack
                    ? { metadata: { ...prevMeta, gallery_images: pack.gallery } }
                    : {}),
                })
                .eq('id', dbProduct.id);
            }
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
    let zeroStockRows = 0;

    try {
      await UnicommerceLogger.info('sync.inventory_start', 'Starting inventory synchronization job');

      const admin = createAdminClient();

      // 1. Fetch all variants from database that have a SKU
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

      // 2. Fetch inventory snapshot in chunks of 100
      const chunkSize = 100;
      const snapshots: Array<{ sku: string; stock: number }> = [];

      for (let i = 0; i < skus.length; i += chunkSize) {
        const chunk = skus.slice(i, i + chunkSize);
        // If the SOAP request fails, it throws and crashes the sync job, leaving database records intact.
        const chunkSnapshots = await this.inventoryService.getInventorySnapshot(chunk);
        snapshots.push(...chunkSnapshots);
      }

      // 3. Build snapshot map keyed by SKU (case-insensitive)
      const snapshotMap = new Map<string, number>();
      for (const snap of snapshots) {
        snapshotMap.set(snap.sku.toLowerCase(), snap.stock);
      }

      // 4. Update stock quantity in the database inventory table for every variant
      for (const dbVariant of dbVariants) {
        try {
          const skuLower = dbVariant.sku.toLowerCase();
          const hasSnapshot = snapshotMap.has(skuLower);
          const stock = hasSnapshot ? Math.max(0, snapshotMap.get(skuLower)!) : 0;

          if (!hasSnapshot) {
            zeroStockRows++;
          }

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
            // Update existing record, preserving reserved_quantity and other fields
            const { error: updateError } = await admin
              .from('inventory')
              .update({
                quantity: stock,
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
                quantity: stock,
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
            `Failed updating stock quantity for SKU ${dbVariant.sku}`,
            err,
            dbVariant.sku
          );
        }
      }

      const logMessage = [
        'Inventory Sync',
        '--------------',
        `Catalog Variants: ${dbVariants.length}`,
        `Returned Snapshots: ${snapshots.length}`,
        `Updated Rows: ${processed}`,
        `Zero Stock Rows: ${zeroStockRows}`,
        `Failed Rows: ${errors}`
      ].join('\n');

      console.log(logMessage);
      await UnicommerceLogger.info('sync.inventory_completed', logMessage);

      return { success: true, processed, errors };
    } catch (err: any) {
      await UnicommerceLogger.error('sync.inventory_error', 'Inventory synchronization job crashed', err);
      return { success: false, processed: 0, errors };
    }
  }
}
