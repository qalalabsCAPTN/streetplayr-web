/**
 * Inventory Module for Unicommerce.
 * Manages fetching inventory levels, snapshots, and updating stock back to Uniware.
 */

import { request } from './client';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import type {
  UniwareInventorySnapshotResponse,
  UniwareInventoryAdjustResponse,
} from './types';

export class UnicommerceInventoryService {
  /**
   * Fetches inventory levels for specific SKUs or all changed SKUs.
   */
  async getInventorySnapshot(
    skus?: string[],
    updatedSinceInMinutes?: number
  ): Promise<Array<{ sku: string; stock: number; blocked: number }>> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      // Return demo inventory values
      const targetSkus = skus || ['ctt-waffle-s', 'ctt-waffle-m', 'black-warrior-l'];
      return targetSkus.map((sku) => ({
        sku,
        stock: 50,
        blocked: 2,
      }));
    }

    try {
      await UnicommerceLogger.info(
        'inventory.get_snapshot',
        `Fetching inventory snapshot for ${skus ? skus.length : 'all'} SKUs`
      );

      const response = await request<UniwareInventorySnapshotResponse>(
        '/services/rest/v1/inventory/inventorySnapshot/get',
        {
          body: {
            itemTypeSKUs: skus,
            updatedSinceInMinutes,
          },
        }
      );

      const snapshots = response.inventorySnapshots || [];
      return snapshots.map((s) => ({
        sku: s.itemTypeSKU,
        stock: s.inventory,
        blocked: s.blocked,
      }));
    } catch (err: any) {
      await UnicommerceLogger.error(
        'inventory.get_snapshot_error',
        'Failed to retrieve inventory snapshot from Unicommerce',
        err
      );
      return [];
    }
  }

  /**
   * Adjusts stock quantity for a single SKU in the warehouse.
   */
  async adjustInventory(params: {
    sku: string;
    quantity: number;
    adjustmentType: 'ADD' | 'REMOVE' | 'REPLACE';
    remarks?: string;
  }): Promise<boolean> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      await UnicommerceLogger.info(
        'inventory.adjust_demo',
        `Demo Mode: Adjusted inventory for SKU ${params.sku} by ${params.quantity} (${params.adjustmentType})`
      );
      return true;
    }

    try {
      await UnicommerceLogger.info(
        'inventory.adjust_stock',
        `Adjusting stock for SKU ${params.sku} by ${params.quantity} (${params.adjustmentType})`,
        params.sku
      );

      const response = await request<UniwareInventoryAdjustResponse>(
        '/services/rest/v1/inventory/adjust/bulk',
        {
          body: {
            inventoryAdjustments: [
              {
                itemSKU: params.sku,
                quantity: params.quantity,
                inventoryType: 'GOOD_INVENTORY',
                adjustmentType: params.adjustmentType,
                remarks: params.remarks ?? 'Adjusted via commerce service',
                facilityCode: config.facilityCode,
              },
            ],
          },
        }
      );

      const result = response.adjustmentResults?.[0];
      if (result && result.successful) {
        return true;
      } else {
        throw new Error(
          result
            ? `${result.errorCode}: ${result.errorMessage}`
            : 'Response did not contain adjustment results'
        );
      }
    } catch (err: any) {
      await UnicommerceLogger.error(
        'inventory.adjust_stock_error',
        `Failed to adjust stock for SKU ${params.sku}`,
        err,
        params.sku
      );
      return false;
    }
  }
}
