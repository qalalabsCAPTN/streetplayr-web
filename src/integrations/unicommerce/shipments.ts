/**
 * Shipments Module for Unicommerce.
 * Manages package details retrieval, waybill tracking, and fulfillment updates.
 */

import { request } from './client';
import { soapRequest } from './soapClient';
import { getUnicommerceConfig } from './config';
import { UnicommerceLogger } from './logging';
import { UnicommerceMapper } from './mapping';
import type {
  NormalizedShipment,
  NormalizedTracking,
  UniwareShippingPackageDetailsResponse,
  UniwareShippingPackageSearchResponse,
  UniwareWaybillDetailsResponse,
} from './types';

export class UnicommerceShipmentService {
  /**
   * Retrieves shipment details for a specific shipping package.
   */
  async getShipmentDetails(shippingPackageCode: string): Promise<NormalizedShipment | null> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      return {
        shippingPackageCode,
        saleOrderCode: 'DEMO-ORDER-123',
        status: 'SHIPPED',
        courierName: 'Delhivery',
        trackingNumber: '123456789',
        waybillNumber: 'AWB-12345',
        weight: 0.5,
        dispatchedAt: new Date().toISOString(),
      };
    }

    try {
      await UnicommerceLogger.info(
        'shipments.get_details',
        `Retrieving package details for: ${shippingPackageCode}`,
        shippingPackageCode
      );

      let response: UniwareShippingPackageDetailsResponse;
      if (config.transportMode === 'SOAP') {
        response = await soapRequest<UniwareShippingPackageDetailsResponse>(
          'getShippingPackageDetailRequest',
          `<ser:getShippingPackageDetailRequest>
            <ser:ShippingPackageCode>${shippingPackageCode}</ser:ShippingPackageCode>
          </ser:getShippingPackageDetailRequest>`
        );
      } else {
        response = await request<UniwareShippingPackageDetailsResponse>(
          '/services/rest/v1/oms/shippingPackage/getShippingPackageDetails',
          {
            body: { shippingPackageCode },
          }
        );
      }

      if (!response.shippingPackage) {
        await UnicommerceLogger.warn(
          'shipments.get_details_not_found',
          `Shipping package ${shippingPackageCode} not found in Uniware`,
          shippingPackageCode
        );
        return null;
      }

      return UnicommerceMapper.mapShipmentToInternal(response.shippingPackage);
    } catch (err: any) {
      await UnicommerceLogger.error(
        'shipments.get_details_error',
        `Failed to retrieve shipping package details for ${shippingPackageCode}`,
        err,
        shippingPackageCode
      );
      return null;
    }
  }

  /**
   * Retrieves all shipping packages associated with a specific sale order.
   */
  async getShipmentsByOrder(saleOrderCode: string): Promise<NormalizedShipment[]> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      return [
        {
          shippingPackageCode: 'PKG-DEMO-123',
          saleOrderCode,
          status: 'DISPATCHED',
          courierName: 'Blue Dart',
          trackingNumber: 'AWB98765',
          waybillNumber: 'AWB98765',
        },
      ];
    }

    try {
      await UnicommerceLogger.info(
        'shipments.search_by_order',
        `Searching shipping packages for order: ${saleOrderCode}`,
        saleOrderCode
      );

      let response: UniwareShippingPackageSearchResponse;
      if (config.transportMode === 'SOAP') {
        response = await soapRequest<UniwareShippingPackageSearchResponse>(
          'SearchShippingPackageRequest',
          `<ser:SearchShippingPackageRequest>
            <ser:SaleOrderCode>${saleOrderCode}</ser:SaleOrderCode>
            <ser:SearchOptions>
              <ser:DisplayStart>0</ser:DisplayStart>
              <ser:DisplayLength>100</ser:DisplayLength>
            </ser:SearchOptions>
          </ser:SearchShippingPackageRequest>`
        );
      } else {
        response = await request<UniwareShippingPackageSearchResponse>(
          '/services/rest/v1/oms/shippingPackage/search',
          {
            body: { saleOrderCode },
          }
        );
      }

      const packages = response.shippingPackages || [];
      return packages.map((pkg) => UnicommerceMapper.mapShipmentToInternal(pkg));
    } catch (err: any) {
      await UnicommerceLogger.error(
        'shipments.search_by_order_error',
        `Failed searching packages for order ${saleOrderCode}`,
        err,
        saleOrderCode
      );
      return [];
    }
  }

  /**
   * Fetches courier waybill tracking details from the shipping provider through Unicommerce.
   */
  async getWaybillTracking(waybillNumber: string): Promise<NormalizedTracking | null> {
    const config = getUnicommerceConfig();

    if (config.isDemoMode && !config.apiUrl) {
      return {
        waybillNumber,
        status: 'IN_TRANSIT',
        activityLocation: 'Hub Bangalore',
        activityDateTime: new Date().toISOString(),
        remarks: 'Package is sorted and in transit to next hub.',
      };
    }

    try {
      await UnicommerceLogger.info(
        'shipments.get_waybill_tracking',
        `Fetching waybill tracking status for: ${waybillNumber}`,
        waybillNumber
      );

      let trackingDetail: NormalizedTracking | null = null;
      if (config.transportMode === 'SOAP') {
        const response = await soapRequest<UniwareShippingPackageSearchResponse>(
          'SearchShippingPackageRequest',
          `<ser:SearchShippingPackageRequest>
            <ser:TrackingNumber>${waybillNumber}</ser:TrackingNumber>
            <ser:SearchOptions>
              <ser:DisplayStart>0</ser:DisplayStart>
              <ser:DisplayLength>100</ser:DisplayLength>
            </ser:SearchOptions>
          </ser:SearchShippingPackageRequest>`
        );
        const pkg = response.shippingPackages?.[0];
        if (pkg) {
          trackingDetail = {
            waybillNumber: pkg.waybillNumber || waybillNumber,
            status: pkg.status,
            activityLocation: 'Uniware System',
            activityDateTime: new Date().toISOString(),
            remarks: `Status retrieved via SOAP SearchShippingPackage fallback for carrier ${pkg.courierName || 'unknown'}.`,
          };
        }
      } else {
        const response = await request<UniwareWaybillDetailsResponse>(
          `/waybillDetails`,
          {
            method: 'GET',
            headers: {
              'waybills': `"${waybillNumber}"`, // Often required as query or header parameter
            },
          }
        );

        const details = response.waybillDetails?.[0];
        if (details) {
          trackingDetail = UnicommerceMapper.mapTrackingToInternal(details);
        }
      }

      if (!trackingDetail) {
        await UnicommerceLogger.warn(
          'shipments.get_waybill_tracking_not_found',
          `Waybill details for AWB ${waybillNumber} not returned`,
          waybillNumber
        );
        return null;
      }

      return trackingDetail;
    } catch (err: any) {
      await UnicommerceLogger.error(
        'shipments.get_waybill_tracking_error',
        `Failed to retrieve tracking for AWB ${waybillNumber}`,
        err,
        waybillNumber
      );
      return null;
    }
  }
}
