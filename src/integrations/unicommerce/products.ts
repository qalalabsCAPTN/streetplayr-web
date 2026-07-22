/**
 * Products Module for Unicommerce.
 * Manages fetching product definitions, catalog metadata, and mapping to normalized models.
 */

import { request } from './client';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import { UnicommerceMapper } from './mapping';
import type { NormalizedProduct, UniwareProductGetResponse } from './types';
import { LOCAL_PRODUCTS } from '@/lib/products/data';

export class UnicommerceProductService {
  /**
   * Fetches product details for a specific SKU.
   * If in demo/stub mode, returns mock product details.
   */
  async getProductBySku(sku: string): Promise<NormalizedProduct | null> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      // Find inside LOCAL_PRODUCTS to return a realistic mock product
      const localProduct = LOCAL_PRODUCTS.find(
        (p) => p.id === sku || p.variants.some((v) => v.id === sku)
      );

      if (localProduct) {
        return {
          sku,
          name: localProduct.name,
          description: localProduct.description,
          imageUrl: localProduct.image_url,
          price: localProduct.price,
          category: localProduct.category.name,
          enabled: true,
        };
      }

      // Default mock fallback
      return {
        sku,
        name: `Mock Product ${sku}`,
        description: 'This is a mock product description generated in demo mode.',
        price: 1999,
        category: 'TEES',
        enabled: true,
      };
    }

    try {
      await UnicommerceLogger.info('products.get_by_sku', `Fetching product for SKU: ${sku}`, sku);

      const response = await request<UniwareProductGetResponse>(
        '/services/rest/v1/catalog/itemType/get',
        {
          body: { skuCode: sku },
        }
      );

      const rawProduct = response.itemTypeDTO;
      if (!rawProduct) {
        await UnicommerceLogger.warn('products.get_by_sku_not_found', `Product SKU ${sku} not found in Uniware`, sku);
        return null;
      }

      return UnicommerceMapper.mapProductToInternal(rawProduct);
    } catch (err: any) {
      await UnicommerceLogger.error('products.get_by_sku_error', `Failed to fetch product for SKU: ${sku}`, err, sku);
      return null;
    }
  }

  /**
   * Fetches multiple product details in bulk by calling getProductBySku concurrently.
   */
  async getProductsBySkus(skus: string[]): Promise<NormalizedProduct[]> {
    if (skus.length === 0) return [];
    
    try {
      await UnicommerceLogger.info('products.get_by_skus', `Fetching products in bulk for ${skus.length} SKUs`);

      const promises = skus.map(sku => this.getProductBySku(sku));
      const results = await Promise.all(promises);
      
      return results.filter((p): p is NormalizedProduct => p !== null);
    } catch (err: any) {
      await UnicommerceLogger.error(
        'products.get_by_skus_error',
        `Failed bulk fetching product SKUs`,
        err,
        'bulk',
        { skus }
      );
      return [];
    }
  }
}
