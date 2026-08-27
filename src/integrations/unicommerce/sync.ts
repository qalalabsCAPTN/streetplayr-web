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
import { isRemovedApparelSize } from '@/lib/products/sizes';
import { displayProductName, withClientProductCopy } from '@/lib/products/copy';
import {
  filterStreetPlayrUnicommerceItems,
  isStreetPlayrCatalogMetadata,
  isStreetPlayrUnicommerceBrand,
} from './streetplayr-brand';

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
  async syncProducts(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    unicommerceReceived: number;
    streetplayrReceived: number;
    skippedOtherBrands: number;
  }> {
    let processed = 0;
    let errors = 0;
    let unicommerceReceived = 0;
    let streetplayrReceived = 0;
    let skippedOtherBrandCount = 0;

    try {
      await UnicommerceLogger.info('sync.products_start', 'Starting product synchronization job');

      const config = getUnicommerceConfig();
      const admin = createAdminClient();

      let normalizedProducts: any[] = [];
      let candidateParentSlugs: string[] = [];
      const importedParentSlugs = new Set<string>();
      if (config.transportMode === 'SOAP') {
        let start = 0;
        let hasMore = true;
        const allItemTypes: any[] = [];
        while (hasMore) {
          try {
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
          } catch (pageErr) {
            errors++;
            await UnicommerceLogger.error(
              'sync.products_page_failed',
              `SearchItemTypes page failed at start=${start}; continuing with ${allItemTypes.length} items already fetched`,
              pageErr
            );
            hasMore = false;
          }
        }

        // Brand gate first. SKU allowlist is optional extra restrictor, never a brand bypass.
        const allowlistStr = process.env.UNICOMMERCE_SYNC_ALLOWLIST || '';
        const allowedPatterns = allowlistStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

        const { kept: streetplayrItems, skipped: skippedOtherBrands } =
          filterStreetPlayrUnicommerceItems(allItemTypes);
        unicommerceReceived = allItemTypes.length;
        streetplayrReceived = streetplayrItems.length;
        skippedOtherBrandCount = skippedOtherBrands;

        const brandFilterMsg = `UniCommerce items ${allItemTypes.length}; StreetPlayR (Brand=playR STREET) ${streetplayrItems.length}; skipped other brands ${skippedOtherBrands}`;
        console.log(brandFilterMsg);
        await UnicommerceLogger.info('sync.products_brand_filter', brandFilterMsg);

        const candidates = streetplayrItems.filter((it) => {
          if (!allowedPatterns.length) return true;
          const skuLower = (it.skuCode || '').toLowerCase();
          return allowedPatterns.some((pattern) => skuLower.includes(pattern));
        });

        candidateParentSlugs = Array.from(new Set(candidates.map(c => {
          const lastDash = c.skuCode.lastIndexOf('-');
          return lastDash > 0 ? c.skuCode.substring(0, lastDash) : c.skuCode;
        })));

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
              if (detailRes && detailRes.enabled && isStreetPlayrUnicommerceBrand(detailRes.brand)) {
                normalizedProducts.push(detailRes);
              } else if (detailRes && !isStreetPlayrUnicommerceBrand(detailRes.brand)) {
                await UnicommerceLogger.info(
                  'sync.product_skip',
                  `Skipped ${it.skuCode}: GetItemType Brand=${detailRes.brand || '(empty)'} is not playR STREET`
                );
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
        const restProducts = await this.productService.getProductsBySkus(skusToSync);
        const restFiltered = filterStreetPlayrUnicommerceItems(restProducts);
        unicommerceReceived = restProducts.length;
        streetplayrReceived = restFiltered.kept.length;
        skippedOtherBrandCount = restFiltered.skipped;
        normalizedProducts = restFiltered.kept;
        candidateParentSlugs = Array.from(new Set(skusToSync.map(s => {
          const lastDash = s.lastIndexOf('-');
          return lastDash > 0 ? s.substring(0, lastDash) : s;
        })));
      }

      // Fetch dynamic brand_id for streetplayr storefront
      const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
      const { data: brandData } = await admin
        .from('brands')
        .select('id')
        .eq('slug', brandSlug)
        .maybeSingle();

      if (!brandData) {
        throw new Error('Sync aborted: Brand record "streetplayr" not found in the database.');
      }

      const { data: sampleProduct } = await admin
        .from('products')
        .select('organization_id')
        .limit(1)
        .maybeSingle();

      const orgId = sampleProduct?.organization_id || '00000000-0000-0000-0000-000000000001';
      const brandId = brandData.id;

      for (const normProd of normalizedProducts) {
        try {
          const brandVal = (normProd.brand || '').trim();

          if (!isStreetPlayrUnicommerceBrand(brandVal)) {
            const skipLogMsg = `Skipped: ${normProd.sku} (${brandVal || 'Unknown Brand'}) - not StreetPlayR UniCommerce Brand playR STREET`;
            console.log(skipLogMsg);
            await UnicommerceLogger.info('sync.product_skip', skipLogMsg);
            continue;
          }

          const importLogMsg = `Imported: ${normProd.sku} (${brandVal})`;
          console.log(importLogMsg);
          await UnicommerceLogger.info('sync.product_import', importLogMsg);

          // Parse parent SKU
          // e.g. "ctt-waffle-s" parent ID/slug is "ctt-waffle"
          const lastDashIndex = normProd.sku.lastIndexOf('-');
          const parentSlug = lastDashIndex > 0 ? normProd.sku.substring(0, lastDashIndex) : normProd.sku;
          const size = lastDashIndex > 0 ? normProd.sku.substring(lastDashIndex + 1).toUpperCase() : 'DEFAULT';

          if (isRemovedApparelSize(size)) {
            await UnicommerceLogger.info(
              'sync.product_skip',
              `Skipped removed apparel size ${size} for SKU ${normProd.sku}`
            );
            continue;
          }

          // 1. Fetch or create Parent Product in Database
          let { data: dbProduct } = await admin
            .from('products')
            .select('id')
            .eq('slug', parentSlug)
            .eq('brand_id', brandId)
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
                title: displayProductName(normProd.name.replace(/ - [A-Z0-9]+$/i, '')),
                slug: parentSlug,
                description: withClientProductCopy(
                  parentSlug,
                  normProd.name,
                  normProd.description || 'Synced from Unicommerce'
                ),
                featured_image_url: normProd.imageUrl || null,
                status: normProd.enabled ? 'active' : 'draft',
                metadata: {
                  brand: brandVal,
                  ...(collectionSlug ? { category: collectionSlug } : {}),
                },
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
          } else {
            // Backfill missing media on existing UniCommerce parents, and ensure brand metadata is set
            const { data: existingParent } = await admin
              .from('products')
              .select('featured_image_url, metadata')
              .eq('id', dbProduct.id)
              .maybeSingle();
            
            const prevMeta =
              existingParent?.metadata && typeof existingParent.metadata === 'object'
                ? (existingParent.metadata as Record<string, unknown>)
                : {};

            const needsUrlUpdate = !existingParent?.featured_image_url && normProd.imageUrl;
            const needsBrandUpdate = prevMeta.brand !== brandVal;

            if (needsUrlUpdate || needsBrandUpdate) {
              const { resolveProductImages } = await import('@/lib/products/image-map');
              const pack = resolveProductImages(parentSlug) || resolveProductImages(normProd.sku);
              
              await admin
                .from('products')
                .update({
                  ...(needsUrlUpdate ? { featured_image_url: normProd.imageUrl } : {}),
                  metadata: {
                    ...prevMeta,
                    brand: brandVal,
                    ...(needsUrlUpdate && pack ? { gallery_images: pack.gallery } : {}),
                  },
                })
                .eq('id', dbProduct.id);
            }
          }

          // 2. Upsert Variant manually to handle missing UNIQUE constraint on SKU column
          const { data: existingVariant, error: checkError } = await admin
            .from('product_variants')
            .select('id')
            .eq('sku', normProd.sku)
            .eq('product_id', dbProduct.id)
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
          importedParentSlugs.add(parentSlug);
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

      // 3. Database Cleanup (safety check)
      // Deactivate any active products that belong to the resolved brand_id and whose slug is in the slugsToDeactivate set
      const slugsToDeactivate = candidateParentSlugs.filter(slug => !importedParentSlugs.has(slug));
      if (slugsToDeactivate.length > 0) {
        const { error: cleanupError } = await admin
          .from('products')
          .update({ status: 'draft' })
          .eq('status', 'active')
          .eq('brand_id', brandId)
          .in('slug', slugsToDeactivate);

        if (cleanupError) {
          await UnicommerceLogger.error(
            'sync.cleanup_error',
            `Failed to deactivate skipped products: ${cleanupError.message}`,
            cleanupError
          );
        } else {
          const successMsg = `Deactivated any active products not belonging to playR STREET among candidates. Slugs: ${slugsToDeactivate.join(', ')}`;
          console.log(successMsg);
          await UnicommerceLogger.info('sync.cleanup_success', successMsg);
        }
      }

      const { data: leaked } = await admin
        .from('products')
        .select('id, slug, metadata')
        .eq('brand_id', brandId)
        .eq('status', 'active');
      const leakedIds = (leaked ?? [])
        .filter((row) => !isStreetPlayrCatalogMetadata(row.metadata))
        .map((row) => row.id);
      if (leakedIds.length > 0) {
        await admin.from('products').update({ status: 'draft' }).in('id', leakedIds);
        await UnicommerceLogger.info(
          'sync.foreign_brand_drafted',
          `Drafted ${leakedIds.length} streetplayr-brand_id rows whose metadata.brand is not playR STREET`
        );
      }

      // 4. Cache Invalidation
      try {
        const { clearCatalogLkg } = await import('@/lib/products/catalog-cache');
        clearCatalogLkg();
        const cacheMsg = 'Catalog LKG cache invalidated successfully';
        console.log(cacheMsg);
        await UnicommerceLogger.info('sync.cache_invalidated', cacheMsg);
      } catch (cacheErr) {
        await UnicommerceLogger.error('sync.cache_invalidation_failed', 'Failed to invalidate catalog cache', cacheErr);
      }

      await UnicommerceLogger.info(
        'sync.products_completed',
        `Product sync job completed. Processed: ${processed}, Errors: ${errors}`,
        'system',
        { processed, errors, startTime: new Date(Date.now() - processed * 50).toISOString(), endTime: new Date().toISOString() }
      );
      return {
        success: true,
        processed,
        errors,
        unicommerceReceived,
        streetplayrReceived,
        skippedOtherBrands: skippedOtherBrandCount,
      };
    } catch (err: any) {
      await UnicommerceLogger.error('sync.products_error', 'Product synchronization job crashed', err);
      return {
        success: false,
        processed,
        errors,
        unicommerceReceived,
        streetplayrReceived,
        skippedOtherBrands: skippedOtherBrandCount,
      };
    }
  }

  /**
   * Syncs active variant inventory counts from Unicommerce snapshot API to the DB's inventory table.
   */
  async syncInventory(): Promise<{
    success: boolean;
    processed: number;
    errors: number;
    matched: number;
    explicitZero: number;
    positiveStock: number;
    skippedNoSnapshot: number;
  }> {
    let processed = 0;
    let errors = 0;
    let zeroStockRows = 0;
    let positiveStock = 0;
    let skippedNoSnapshot = 0;

    try {
      await UnicommerceLogger.info('sync.inventory_start', 'Starting inventory synchronization job');

      const admin = createAdminClient();

      const brandSlug = process.env.NEXT_PUBLIC_BRAND_ID || 'streetplayr';
      const { data: brandData } = await admin
        .from('brands')
        .select('id')
        .eq('slug', brandSlug)
        .maybeSingle();

      if (!brandData?.id) {
        throw new Error(`Inventory sync aborted: brand slug "${brandSlug}" not found.`);
      }

      const { data: brandProducts, error: brandProdErr } = await admin
        .from('products')
        .select('id, metadata')
        .eq('brand_id', brandData.id)
        .eq('status', 'active');

      if (brandProdErr) {
        throw new Error(`Failed to load StreetPlayR products: ${brandProdErr.message}`);
      }

      const productIds = (brandProducts ?? [])
        .filter((row) => isStreetPlayrCatalogMetadata(row.metadata))
        .map((p) => p.id);
      if (productIds.length === 0) {
        await UnicommerceLogger.warn(
          'sync.inventory_no_skus',
          'No StreetPlayR products found for inventory sync'
        );
        return {
          success: true,
          processed: 0,
          errors: 0,
          matched: 0,
          explicitZero: 0,
          positiveStock: 0,
          skippedNoSnapshot: 0,
        };
      }

      const { data: dbVariants, error: fetchError } = await admin
        .from('product_variants')
        .select('id, sku')
        .in('product_id', productIds)
        .not('sku', 'is', null);

      if (fetchError || !dbVariants) {
        throw new Error(`Failed to load variants from database: ${fetchError?.message}`);
      }

      const skus = dbVariants.map((v) => v.sku);
      if (skus.length === 0) {
        await UnicommerceLogger.warn('sync.inventory_no_skus', 'No active SKUs found in database for inventory sync');
        return {
          success: true,
          processed: 0,
          errors: 0,
          matched: 0,
          explicitZero: 0,
          positiveStock: 0,
          skippedNoSnapshot: 0,
        };
      }

      const chunkSize = 50;
      const snapshots: Array<{ sku: string; stock: number }> = [];

      for (let i = 0; i < skus.length; i += chunkSize) {
        const chunk = skus.slice(i, i + chunkSize);
        try {
          const chunkSnapshots = await this.inventoryService.getInventorySnapshot(chunk);
          if (!chunkSnapshots.length) {
            await UnicommerceLogger.warn(
              'sync.inventory_empty_chunk',
              `Inventory snapshot returned 0 rows for chunk at offset ${i} (${chunk.length} SKUs requested); leaving those SKUs unchanged`
            );
            continue;
          }
          snapshots.push(...chunkSnapshots);
        } catch (chunkErr) {
          errors++;
          await UnicommerceLogger.error(
            'sync.inventory_chunk_failed',
            `Inventory snapshot chunk failed at offset ${i}; leaving those SKUs unchanged`,
            chunkErr
          );
        }
      }

      // 3. Build snapshot map keyed by SKU (case-insensitive)
      const snapshotMap = new Map<string, number>();
      for (const snap of snapshots) {
        snapshotMap.set(snap.sku.toLowerCase(), snap.stock);
      }

      // 4. Update only SKUs UniCommerce explicitly returned.
      // Missing SKU / empty chunk / timeout = keep last known quantity.
      // Explicit stock 0 in the snapshot is a real sold-out write.
      for (const dbVariant of dbVariants) {
        const skuLower = dbVariant.sku.toLowerCase();
        if (!snapshotMap.has(skuLower)) {
          skippedNoSnapshot++;
          continue;
        }
        try {
          const stock = Math.max(0, snapshotMap.get(skuLower)!);

          if (stock === 0) {
            zeroStockRows++;
          } else {
            positiveStock++;
          }

          // Check if there is an existing inventory record for this variant
          const { data: existingInv, error: checkError } = await admin
            .from('inventory')
            .select('id, quantity')
            .eq('variant_id', dbVariant.id)
            .maybeSingle();

          if (checkError) {
            throw new Error(`Failed to check existing inventory for variant ${dbVariant.id}: ${checkError.message}`);
          }

          if (existingInv) {
            if (Number(existingInv.quantity) === stock) {
              processed++;
              continue;
            }
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
        `Skipped / no snapshot: ${skippedNoSnapshot}`,
        `Positive Stock Rows: ${positiveStock}`,
        `Zero Stock Rows: ${zeroStockRows}`,
        `Failed Rows: ${errors}`
      ].join('\n');

      console.log(logMessage);
      await UnicommerceLogger.info(
        'sync.inventory_completed',
        logMessage,
        'system',
        { catalogVariants: dbVariants.length, returnedSnapshots: snapshots.length, updatedRows: processed, zeroStockRows, positiveStock, skippedNoSnapshot, failedRows: errors }
      );

      return {
        success: processed > 0 || errors === 0,
        processed,
        errors,
        matched: processed,
        explicitZero: zeroStockRows,
        positiveStock,
        skippedNoSnapshot,
      };
    } catch (err: any) {
      await UnicommerceLogger.error('sync.inventory_error', 'Inventory synchronization job crashed', err);
      return {
        success: false,
        processed: 0,
        errors: 1,
        matched: 0,
        explicitZero: 0,
        positiveStock: 0,
        skippedNoSnapshot: 0,
      };
    }
  }
}
