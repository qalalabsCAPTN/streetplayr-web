/**
 * Returns Module for Unicommerce.
 * Manages reverse pickup creations and customer return queries.
 */

import { request } from './client';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import { UnicommerceMapper } from './mapping';
import type {
  NormalizedOrderAddress,
  NormalizedReturn,
  UniwareReversePickupCreateResponse,
  UniwareReturnGetResponse,
} from './types';

export class UnicommerceReturnService {
  /**
   * Initiates a reverse pick-up in Unicommerce for items being returned.
   */
  async createReversePickup(params: {
    saleOrderCode: string;
    reason?: string;
    shippingAddress: NormalizedOrderAddress;
    items: Array<{
      saleOrderItemCode: string;
      sku: string;
      quantity: number;
    }>;
  }): Promise<{ success: boolean; reversePickupCode?: string; error?: string }> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      await UnicommerceLogger.info(
        'returns.create_reverse_pickup_demo',
        `Demo Mode: Reverse pickup created for order ${params.saleOrderCode}`,
        params.saleOrderCode
      );
      return {
        success: true,
        reversePickupCode: `RP-DEMO-${params.saleOrderCode}`,
      };
    }

    try {
      await UnicommerceLogger.info(
        'returns.create_reverse_pickup',
        `Creating reverse pickup for order: ${params.saleOrderCode}`,
        params.saleOrderCode
      );

      const uniAddress = UnicommerceMapper.mapAddressToUniware(params.shippingAddress);
      const payload = {
        reversePickup: {
          saleOrderCode: params.saleOrderCode,
          reason: params.reason,
          shippingAddress: uniAddress,
          reversePickupItems: params.items,
        },
      };

      const response = await request<UniwareReversePickupCreateResponse>(
        '/services/rest/v1/oms/reversePickup/create',
        {
          body: payload,
        }
      );

      return {
        success: true,
        reversePickupCode: response.reversePickupCode,
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed creating reverse pickup';
      await UnicommerceLogger.error(
        'returns.create_reverse_pickup_error',
        `Failed to create reverse pickup for order ${params.saleOrderCode}`,
        err,
        params.saleOrderCode
      );
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Retrieves return details for a reverse pickup or shipment package code.
   */
  async getReturnDetails(reversePickupCode: string): Promise<NormalizedReturn | null> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      return {
        reversePickupCode,
        saleOrderCode: 'DEMO-ORDER-123',
        status: 'RETURN_RECEIVED',
        courierName: 'Delhivery Reverse',
        trackingNumber: 'RP-TRACK-123',
        items: [
          {
            sku: 'ctt-waffle-s',
            quantity: 1,
            reason: 'Size too small',
          },
        ],
        createdAt: new Date().toISOString(),
      };
    }

    try {
      await UnicommerceLogger.info(
        'returns.get_details',
        `Retrieving return details for reverse pickup code: ${reversePickupCode}`,
        reversePickupCode
      );

      const response = await request<UniwareReturnGetResponse>(
        '/services/rest/v1/oms/return/get',
        {
          body: { reversePickupCode },
        }
      );

      const details = response.returnDetails?.[0];
      if (!details) {
        await UnicommerceLogger.warn(
          'returns.get_details_not_found',
          `Return details not found for RP code ${reversePickupCode}`,
          reversePickupCode
        );
        return null;
      }

      return UnicommerceMapper.mapReturnToInternal(details);
    } catch (err: any) {
      await UnicommerceLogger.error(
        'returns.get_details_error',
        `Failed retrieving return details for RP code ${reversePickupCode}`,
        err,
        reversePickupCode
      );
      return null;
    }
  }
}
