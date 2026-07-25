/**
 * Mapping Module for Unicommerce.
 * Handles the normalization of models between Uniware and internal formats.
 */

import type {
  NormalizedProduct,
  NormalizedOrderAddress,
  NormalizedOrderItem,
  NormalizedOrder,
  NormalizedShipment,
  NormalizedReturn,
  NormalizedReturnItem,
  NormalizedTracking,
  UniwareOrderAddress,
  UniwareOrderItem,
  UniwareOrderCreateRequest,
} from './types';
import { resolveProductImages } from '@/lib/products/image-map';

export class UnicommerceMapper {
  /**
   * Maps internal order models to Unicommerce Order Create payload.
   */
  static mapOrderToUniware(
    order: {
      id: string;
      displayCode: string;
      createdAt: string;
      currency: string;
      paymentMethod: 'COD' | 'PREPAID';
      shippingAddress: NormalizedOrderAddress;
      billingAddress?: NormalizedOrderAddress;
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
  ): UniwareOrderCreateRequest {
    const uniwareBilling = this.mapAddressToUniware(order.billingAddress || order.shippingAddress);
    const uniwareShipping = this.mapAddressToUniware(order.shippingAddress);

    const saleOrderItems: UniwareOrderItem[] = order.items.map((item) => ({
      sku: item.sku,
      sellingPrice: item.price,
      quantity: item.quantity,
      taxAmount: item.taxAmount ?? 0,
      discountAmount: item.discountAmount ?? 0,
    }));

    return {
      saleOrder: {
        code: order.id,
        displayOrderCode: order.displayCode,
        displayOrderDateTime: new Date(order.createdAt).toISOString(),
        channelCode,
        currencyCode: order.currency || 'INR',
        paymentMethod: order.paymentMethod,
        billingAddress: uniwareBilling,
        shippingAddress: uniwareShipping,
        saleOrderItems,
      },
    };
  }

  /**
   * Map address to Uniware address format.
   */
  static mapAddressToUniware(addr: NormalizedOrderAddress): UniwareOrderAddress {
    return {
      name: addr.name,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      countryCode: addr.country === 'India' || addr.country === 'IN' ? 'IN' : addr.country,
      pincode: addr.pincode,
      phone: addr.phone,
      email: addr.email,
    };
  }

  /**
   * Map Uniware address back to internal format.
   */
  static mapAddressToInternal(addr: UniwareOrderAddress): NormalizedOrderAddress {
    return {
      name: addr.name,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      country: addr.countryCode,
      pincode: addr.pincode,
      phone: addr.phone,
      email: addr.email,
    };
  }

  /**
   * Normalizes a Uniware product definition to internal format.
   */
  static mapProductToInternal(raw: {
    skuCode: string;
    name: string;
    description?: string;
    basePrice?: number;
    categoryCode?: string;
    enabled: boolean;
  }): NormalizedProduct {
    // Uniware item types lack media; map known streetwear SKUs → local asset packs
    const pack = resolveProductImages(raw.skuCode);
    return {
      sku: raw.skuCode,
      name: raw.name,
      description: raw.description,
      imageUrl: pack?.featured,
      price: raw.basePrice ?? 0,
      category: raw.categoryCode,
      enabled: raw.enabled,
    };
  }

  /**
   * Normalizes a Uniware Order Detail response to internal format.
   */
  static mapOrderToInternal(raw: {
    code: string;
    displayOrderCode: string;
    status: string;
    shippingAddress: UniwareOrderAddress;
    billingAddress: UniwareOrderAddress;
    saleOrderItems: Array<{
      code: string;
      sku: string;
      sellingPrice: number;
      quantity: number;
      statusCode: string;
    }>;
  }): NormalizedOrder {
    const items: NormalizedOrderItem[] = raw.saleOrderItems.map((item) => ({
      sku: item.sku,
      name: item.sku, // Default to SKU as item name if not returned in order details
      price: item.sellingPrice,
      quantity: item.quantity,
    }));

    return {
      orderCode: raw.code,
      displayOrderCode: raw.displayOrderCode,
      displayOrderDateTime: new Date().toISOString(), // Fallback if not available
      currencyCode: 'INR', // Default
      paymentMethod: 'PREPAID', // Default fallback
      shippingAddress: this.mapAddressToInternal(raw.shippingAddress),
      billingAddress: this.mapAddressToInternal(raw.billingAddress),
      items,
      status: raw.status,
    };
  }

  /**
   * Normalizes a Uniware Shipping Package response to internal format.
   */
  static mapShipmentToInternal(raw: {
    code: string;
    saleOrderCode: string;
    status: string;
    courierName?: string;
    trackingNumber?: string;
    waybillNumber?: string;
    weight?: number;
    dispatchedDate?: string;
    deliveryDate?: string;
  }): NormalizedShipment {
    return {
      shippingPackageCode: raw.code,
      saleOrderCode: raw.saleOrderCode,
      status: raw.status,
      courierName: raw.courierName,
      trackingNumber: raw.trackingNumber,
      waybillNumber: raw.waybillNumber,
      weight: raw.weight,
      dispatchedAt: raw.dispatchedDate,
      deliveredAt: raw.deliveryDate,
    };
  }

  /**
   * Normalizes a Uniware return object to internal format.
   */
  static mapReturnToInternal(raw: {
    reversePickupCode: string;
    saleOrderCode: string;
    status: string;
    courierName?: string;
    trackingNumber?: string;
    items: Array<{
      sku: string;
      quantity: number;
      reason?: string;
    }>;
    createdDate: string;
  }): NormalizedReturn {
    const items: NormalizedReturnItem[] = raw.items.map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
      reason: i.reason,
    }));

    return {
      reversePickupCode: raw.reversePickupCode,
      saleOrderCode: raw.saleOrderCode,
      status: raw.status,
      courierName: raw.courierName,
      trackingNumber: raw.trackingNumber,
      items,
      createdAt: raw.createdDate,
    };
  }

  /**
   * Normalizes waybill status details.
   */
  static mapTrackingToInternal(raw: {
    waybillNumber: string;
    status: string;
    activityLocation?: string;
    activityDateTime?: string;
    remarks?: string;
  }): NormalizedTracking {
    return {
      waybillNumber: raw.waybillNumber,
      status: raw.status,
      activityLocation: raw.activityLocation,
      activityDateTime: raw.activityDateTime,
      remarks: raw.remarks,
    };
  }
}
