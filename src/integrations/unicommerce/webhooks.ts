/**
 * Webhooks Module for Unicommerce.
 * Validates cryptographic signatures and processes asynchronous webhooks.
 * On valid events: updates Supabase order status and inventory.
 */

import crypto from 'crypto';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import { createAdminClient } from '@/lib/supabase/admin';
import { OrderService } from '@/lib/orchestration/order';

async function findOrderByUnicommerceCode(orderCode: string) {
  const admin = createAdminClient();
  const { data: bySource } = await admin
    .from('orders')
    .select('id, status')
    .eq('source_order_id', orderCode)
    .maybeSingle();
  if (bySource) return { admin, order: bySource };
  const { data: byNumber } = await admin
    .from('orders')
    .select('id, status')
    .eq('order_number', orderCode)
    .maybeSingle();
  return { admin, order: byNumber ?? null };
}

export type UnicommerceWebhookEvent =
  | { type: 'order.shipped'; payload: { orderCode: string; trackingNumber: string; waybill: string; courier: string } }
  | { type: 'order.delivered'; payload: { orderCode: string; deliveredAt: string } }
  | { type: 'inventory.updated'; payload: Array<{ sku: string; stock: number; facilityCode: string }> };

export class UnicommerceWebhookService {
  /**
   * Verifies the authenticity of incoming webhook HTTP requests.
   * Compares the computed HMAC-SHA256 hash of the raw request body with the signature header.
   */
  static verifySignature(rawBody: string, signature: string, timestamp?: string | null): boolean {
    const config = getUnicommerceConfig();
    const secret = config.webhookSecret;

    if (!secret) {
      // In development/test mode without secret configured, issue a warning but let it proceed
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Unicommerce Webhooks] Verification bypassed: No webhook secret configured');
        return true;
      }
      return false;
    }

    if (!signature) return false;

    // Replay attack validation (timestamp check)
    if (timestamp) {
      const ts = parseInt(timestamp, 10);
      if (!isNaN(ts)) {
        const timeDiff = Math.abs(Date.now() - ts);
        const maxAllowedDiff = 5 * 60 * 1000; // 5 minutes
        if (timeDiff > maxAllowedDiff) {
          console.error('[Unicommerce Webhooks] Replay attack detected. Time difference exceeds threshold.');
          return false;
        }
      }
    }

    try {
      const computedHash = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      const computedBuffer = Buffer.from(computedHash, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');

      if (computedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
    } catch (err) {
      console.error('[Unicommerce Webhooks] Signature verification error:', err);
      return false;
    }
  }

  /**
   * Processes a verified Unicommerce webhook payload.
   * Routes events to appropriate DB update handlers.
   */
  async processWebhook(event: UnicommerceWebhookEvent): Promise<void> {
    await UnicommerceLogger.info(
      'webhooks.process_event',
      `Processing webhook event of type ${event.type}`,
      'webhook',
      { type: event.type }
    );

    switch (event.type) {
      case 'order.shipped': {
        const { orderCode, trackingNumber, waybill, courier } = event.payload;

        await UnicommerceLogger.info(
          'webhooks.order_shipped',
          `Order ${orderCode} shipped via ${courier}. trackingNumber: ${trackingNumber}, AWB: ${waybill}`,
          orderCode,
          event.payload
        );

        // Update order status and tracking metadata in Supabase
        try {
          const { admin, order } = await findOrderByUnicommerceCode(orderCode);

          if (order) {
            await OrderService.transitionStatus(
              order.id,
              'shipped',
              'system',
              `webhook:order.shipped`
            );

            await admin
              .from('orders')
              .update({
                tracking_number: trackingNumber || null,
                carrier: courier || null,
                shipped_at: new Date().toISOString(),
              })
              .eq('id', order.id);
          }
        } catch (err: any) {
          await UnicommerceLogger.error(
            'webhooks.order_shipped_db_update_failed',
            `Failed to update DB for shipped order ${orderCode}`,
            err,
            orderCode
          );
        }
        break;
      }

      case 'order.delivered': {
        const { orderCode, deliveredAt } = event.payload;

        await UnicommerceLogger.info(
          'webhooks.order_delivered',
          `Order ${orderCode} marked as delivered at ${deliveredAt}`,
          orderCode,
          event.payload
        );

        // Update order status to delivered in Supabase
        try {
          const { admin, order } = await findOrderByUnicommerceCode(orderCode);

          if (order) {
            await OrderService.transitionStatus(
              order.id,
              'delivered',
              'system',
              `webhook:order.delivered`
            );

            await admin
              .from('orders')
              .update({
                delivered_at: deliveredAt || new Date().toISOString(),
              })
              .eq('id', order.id);
          }
        } catch (err: any) {
          await UnicommerceLogger.error(
            'webhooks.order_delivered_db_update_failed',
            `Failed to update DB for delivered order ${orderCode}`,
            err,
            orderCode
          );
        }
        break;
      }

      case 'inventory.updated': {
        // Targeted inventory refresh for affected SKUs
        await UnicommerceLogger.info(
          'webhooks.inventory_updated',
          `Inventory updated for ${event.payload.length} items`,
          'inventory',
          { items: event.payload }
        );

        try {
          const admin = createAdminClient();

          for (const item of event.payload) {
            // Find the variant by SKU
            const { data: variant } = await admin
              .from('product_variants')
              .select('id')
              .eq('sku', item.sku)
              .maybeSingle();

            if (!variant) continue;

            // Upsert inventory record
            const { data: existingInv } = await admin
              .from('inventory')
              .select('id')
              .eq('variant_id', variant.id)
              .maybeSingle();

            const stock = Math.max(0, item.stock);

            if (existingInv) {
              await admin
                .from('inventory')
                .update({ quantity: stock, updated_at: new Date().toISOString() })
                .eq('id', existingInv.id);
            } else {
              await admin
                .from('inventory')
                .insert({
                  variant_id: variant.id,
                  quantity: stock,
                  reserved_quantity: 0,
                  low_stock_threshold: 10,
                  updated_at: new Date().toISOString(),
                });
            }
          }
        } catch (err: any) {
          await UnicommerceLogger.error(
            'webhooks.inventory_update_db_failed',
            'Failed to update inventory from webhook',
            err,
            'inventory'
          );
        }
        break;
      }

      default:
        await UnicommerceLogger.warn(
          'webhooks.unknown_type',
          `Received unhandled webhook event type: ${(event as any).type}`,
          'webhook'
        );
    }
  }
}
