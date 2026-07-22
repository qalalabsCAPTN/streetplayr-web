/**
 * Unicommerce (Uniware) Integration Service Entrypoint.
 * Bundles modules into a structured, dependency-injected integration interface.
 */

import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import { UnicommerceProductService } from './products';
import { UnicommerceInventoryService } from './inventory';
import { UnicommerceOrderService } from './orders';
import { UnicommerceShipmentService } from './shipments';
import { UnicommerceReturnService } from './returns';
import { UnicommerceWebhookService } from './webhooks';
import { UnicommerceSyncService } from './sync';

export class UnicommerceService {
  public static readonly config = getUnicommerceConfig();
  public static readonly logger = UnicommerceLogger;

  public static readonly products = new UnicommerceProductService();
  public static readonly inventory = new UnicommerceInventoryService();
  public static readonly orders = new UnicommerceOrderService();
  public static readonly shipments = new UnicommerceShipmentService();
  public static readonly returns = new UnicommerceReturnService();
  public static readonly webhooks = new UnicommerceWebhookService();
  public static readonly sync = new UnicommerceSyncService();

  /**
   * Performs a health check / connection validation with Unicommerce.
   */
  public static async checkConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = getUnicommerceConfig();
      if (config.isDemoMode && !config.apiUrl) {
        return { success: true, message: 'Connected in Demo/Mock mode' };
      }

      // Check auth by trying to retrieve token
      const { getAccessToken } = require('./auth');
      const token = await getAccessToken();

      if (token) {
        return { success: true, message: 'Authentication successful' };
      }
      return { success: false, message: 'Failed to retrieve access token' };
    } catch (err: any) {
      return { success: false, message: `Connection test failed: ${err.message}` };
    }
  }
}

export * from './types';
export { getUnicommerceConfig } from './config';
export { UnicommerceLogger } from './logging';
