/**
 * Orders Module for Unicommerce.
 * Handles order submissions, retrievals, status queries, and idempotency protection.
 */

import { request } from './client';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import { UnicommerceMapper } from './mapping';
import type { NormalizedOrder, UniwareOrderCreateResponse, UniwareOrderGetResponse } from './types';
import { idempotencyGuard } from '@/lib/orchestration/idempotency';

export class UnicommerceOrderService {
  /**
   * Submits an order to Unicommerce.
   * Leverages idempotencyGuard to ensure duplicate client/action payloads are rejected.
   */
  async createOrder(
    order: {
      id: string;
      displayCode: string;
      createdAt: string;
      currency: string;
      paymentMethod: 'COD' | 'PREPAID';
      shippingAddress: any;
      billingAddress?: any;
      items: Array<{
        sku: string;
        name: string;
        price: number;
        quantity: number;
        taxAmount?: number;
        discountAmount?: number;
      }>;
    },
    channelCode: string
  ): Promise<{ success: boolean; uniwareCode?: string; error?: string; isDuplicate?: boolean }> {
    const config = getUnicommerceConfig();

    // 1. Establish the Idempotency Key
    const idempotencyKey = `unicommerce:order_create:${order.id}`;
    const guard = await idempotencyGuard(idempotencyKey, { ttl: 86400 }); // Guard for 24 hours

    if (!guard.canProceed) {
      const existingData = guard.existingData as { uniwareCode?: string; error?: string } | null;
      await UnicommerceLogger.warn(
        'orders.create_idempotency_block',
        `Duplicate order create request blocked by idempotency key: ${idempotencyKey}`,
        order.id
      );

      return {
        success: !existingData?.error,
        uniwareCode: existingData?.uniwareCode,
        error: existingData?.error,
        isDuplicate: true,
      };
    }

    if (config.isDemoMode && !config.apiUrl) {
      await UnicommerceLogger.info(
        'orders.create_demo',
        `Demo Mode: Order ${order.id} submitted successfully to Unicommerce`,
        order.id
      );

      const mockResult = { uniwareCode: `UC-${order.id}` };
      await guard.complete(mockResult);

      return {
        success: true,
        uniwareCode: mockResult.uniwareCode,
        isDuplicate: false,
      };
    }

    try {
      await UnicommerceLogger.info(
        'orders.create_request',
        `Submitting order to Unicommerce: ${order.id} (${order.displayCode})`,
        order.id
      );

      const payload = UnicommerceMapper.mapOrderToUniware(order, channelCode);

      const response = await request<UniwareOrderCreateResponse>(
        '/services/rest/v1/oms/saleOrder/create',
        {
          body: payload,
        }
      );

      const uniwareCode = response.saleOrderCode ?? order.id;

      await UnicommerceLogger.info(
        'orders.create_success',
        `Order ${order.id} successfully created in Uniware under code ${uniwareCode}`,
        order.id
      );

      const result = { uniwareCode };
      await guard.complete(result);

      return {
        success: true,
        uniwareCode,
        isDuplicate: false,
      };
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown order creation failure';
      await UnicommerceLogger.error(
        'orders.create_error',
        `Order submission failed for ${order.id}`,
        err,
        order.id
      );

      await guard.fail(errorMsg);

      return {
        success: false,
        error: errorMsg,
        isDuplicate: false,
      };
    }
  }

  /**
   * Retrieves order details and status from Unicommerce.
   */
  async getOrder(orderCode: string): Promise<NormalizedOrder | null> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      return {
        orderCode,
        displayOrderCode: orderCode,
        displayOrderDateTime: new Date().toISOString(),
        currencyCode: 'INR',
        paymentMethod: 'PREPAID',
        shippingAddress: {
          name: 'Demo Customer',
          addressLine1: '123 Street Play',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'IN',
          pincode: '560001',
          phone: '9999999999',
          email: 'demo@streetplayr.com',
        },
        billingAddress: {
          name: 'Demo Customer',
          addressLine1: '123 Street Play',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'IN',
          pincode: '560001',
          phone: '9999999999',
          email: 'demo@streetplayr.com',
        },
        items: [
          {
            sku: 'ctt-waffle-s',
            name: 'playR Create Waffle Tee - S',
            price: 1999,
            quantity: 1,
          },
        ],
        status: 'PROCESSING',
      };
    }

    try {
      await UnicommerceLogger.info('orders.get_order', `Retrieving order details for: ${orderCode}`, orderCode);

      const response = await request<UniwareOrderGetResponse>(
        '/services/rest/v1/oms/saleOrder/get',
        {
          body: { code: orderCode },
        }
      );

      if (!response.saleOrder) {
        await UnicommerceLogger.warn('orders.get_order_not_found', `Order ${orderCode} not found in Uniware`, orderCode);
        return null;
      }

      return UnicommerceMapper.mapOrderToInternal(response.saleOrder);
    } catch (err: any) {
      await UnicommerceLogger.error(
        'orders.get_order_error',
        `Failed to retrieve order details for ${orderCode}`,
        err,
        orderCode
      );
      return null;
    }
  }
}
