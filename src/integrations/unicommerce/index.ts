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

      if (config.transportMode === 'SOAP') {
        const { soapRequest } = await import('./soapClient');
        // Probe a real StreetPlayR catalog SKU (legacy Adidas sample SKU was deleted)
        const probeSku = process.env.UNICOMMERCE_PROBE_SKU || 'PS-TEE-CRT-WHT';
        await soapRequest(
          'GetItemTypeRequest',
          `<ser:GetItemTypeRequest><ser:SkuCode>${probeSku}</ser:SkuCode></ser:GetItemTypeRequest>`
        );
        return { success: true, message: `SOAP Connection successful (${probeSku})` };
      }

      // Check auth by trying to retrieve token
      const { getAccessToken } = await import('./auth');
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
export { getUnicommerceConfig, normalizeUnicommerceApiUrl, buildUnicommerceSoapUrl } from './config';
export { UnicommerceLogger } from './logging';
