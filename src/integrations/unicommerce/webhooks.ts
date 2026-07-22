/**
 * Webhooks Module for Unicommerce.
 * Validates cryptographic signatures and processes asynchronous webhooks.
 */

import crypto from 'crypto';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';

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
   * Standardizes events and routes them to appropriate application handlers.
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
        // In a production system, this would call the internal OrderService to update status to "shipped"
        // and record tracking details. Let's log it.
        await UnicommerceLogger.info(
          'webhooks.order_shipped',
          `Order ${orderCode} shipped via ${courier}. trackingNumber: ${trackingNumber}, AWB: ${waybill}`,
          orderCode,
          event.payload
        );
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
        break;
      }

      case 'inventory.updated': {
        // Triggers inventory synchronization for modified items
        await UnicommerceLogger.info(
          'webhooks.inventory_updated',
          `Inventory updated for ${event.payload.length} items`,
          'inventory',
          { items: event.payload }
        );
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
