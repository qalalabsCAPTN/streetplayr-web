/**
 * Type definitions for the Unicommerce integration layer.
 * Includes both normalized internal commerce domain models and raw Uniware API types.
 */

// ==========================================
// Normalized Internal Models
// ==========================================

export interface NormalizedProduct {
  sku: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  category?: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  brand?: string;
}

export interface NormalizedVariant {
  sku: string;
  parentSku?: string;
  size?: string;
  color?: string;
  stockQuantity: number;
  priceOverride?: number;
}

export interface NormalizedOrderAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
}

export interface NormalizedOrderItem {
  sku: string;
  name: string;
  price: number; // selling price
  quantity: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface NormalizedOrder {
  orderCode: string;
  displayOrderCode: string;
  displayOrderDateTime: string;
  currencyCode: string;
  paymentMethod: 'COD' | 'PREPAID';
  shippingAddress: NormalizedOrderAddress;
  billingAddress: NormalizedOrderAddress;
  items: NormalizedOrderItem[];
  status?: string;
  metadata?: Record<string, any>;
}

export interface NormalizedShipment {
  shippingPackageCode: string;
  saleOrderCode: string;
  status: string;
  courierName?: string;
  trackingNumber?: string;
  waybillNumber?: string;
  weight?: number;
  dispatchedAt?: string;
  deliveredAt?: string;
}

export interface NormalizedReturnItem {
  sku: string;
  quantity: number;
  reason?: string;
}

export interface NormalizedReturn {
  reversePickupCode: string;
  saleOrderCode: string;
  status: string;
  courierName?: string;
  trackingNumber?: string;
  items: NormalizedReturnItem[];
  createdAt: string;
}

export interface NormalizedTracking {
  waybillNumber: string;
  status: string;
  activityLocation?: string;
  activityDateTime?: string;
  remarks?: string;
}

// ==========================================
// Raw Unicommerce API Shapes
// ==========================================

export interface UniwareTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface UniwareResponse {
  successful: boolean;
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

export interface UniwareProductGetRequest {
  skuCode: string;
  cartonScanIdentifier?: string | null;
  kitSku?: boolean;
}

export interface UniwareProductGetResponse extends UniwareResponse {
  itemTypeDTO?: {
    skuCode: string;
    categoryCode?: string;
    name: string;
    description?: string;
    color?: string;
    size?: string;
    brand?: string;
    basePrice?: number;
    maxRetailPrice?: number;
    enabled: boolean;
    hsnCode?: string;
  };
}

export interface UniwareInventorySnapshotRequest {
  itemTypeSKUs?: string[];
  updatedSinceInMinutes?: number;
}

export interface UniwareInventorySnapshotResponse extends UniwareResponse {
  inventorySnapshots?: Array<{
    itemTypeSKU: string;
    inventory: number;
    blocked: number;
    openOrders: number;
    facilityCode: string;
  }>;
}

export interface UniwareInventoryAdjustRequest {
  inventoryAdjustments: Array<{
    itemSKU: string;
    quantity: number;
    shelfCode?: string;
    inventoryType: 'GOOD_INVENTORY' | 'BAD_INVENTORY' | 'QC_REJECTED' | 'VIRTUAL_INVENTORY';
    adjustmentType: 'ADD' | 'REMOVE' | 'REPLACE' | 'TRANSFER';
    remarks?: string;
    facilityCode: string;
  }>;
  forceAllocate?: boolean;
}

export interface UniwareInventoryAdjustResponse extends UniwareResponse {
  adjustmentResults?: Array<{
    itemSKU: string;
    successful: boolean;
    errorCode?: string;
    errorMessage?: string;
  }>;
}

export interface UniwareOrderAddress {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  countryCode: string; // "IN"
  pincode: string;
  phone: string;
  email: string;
}

export interface UniwareOrderItem {
  code?: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface UniwareOrderCreateRequest {
  saleOrder: {
    code: string;
    displayOrderCode: string;
    displayOrderDateTime: string;
    channelCode: string;
    currencyCode: string; // "INR"
    paymentMethod: 'COD' | 'PREPAID';
    billingAddress: UniwareOrderAddress;
    shippingAddress: UniwareOrderAddress;
    saleOrderItems: UniwareOrderItem[];
  };
}

export interface UniwareOrderCreateResponse extends UniwareResponse {
  saleOrderCode?: string;
}

export interface UniwareOrderGetResponse extends UniwareResponse {
  saleOrder?: {
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
  };
}

export interface UniwareShippingPackageGetRequest {
  shippingPackageCode: string;
}

export interface UniwareShippingPackageDetailsResponse extends UniwareResponse {
  shippingPackage?: {
    code: string;
    saleOrderCode: string;
    status: string; // "SHIPPED", "DISPATCHED", etc.
    courierName?: string;
    trackingNumber?: string;
    waybillNumber?: string;
    weight?: number;
    dispatchedDate?: string;
    deliveryDate?: string;
  };
}

export interface UniwareShippingPackageSearchRequest {
  shippingPackageCode?: string;
  saleOrderCode?: string;
  statuses?: string[];
}

export interface UniwareShippingPackageSearchResponse extends UniwareResponse {
  shippingPackages?: Array<{
    code: string;
    saleOrderCode: string;
    status: string;
    courierName?: string;
    trackingNumber?: string;
    waybillNumber?: string;
  }>;
}

export interface UniwareReversePickupCreateRequest {
  reversePickup: {
    saleOrderCode: string;
    reason?: string;
    shippingAddress: UniwareOrderAddress;
    reversePickupItems: Array<{
      saleOrderItemCode: string;
      sku: string;
      quantity: number;
    }>;
  };
}

export interface UniwareReversePickupCreateResponse extends UniwareResponse {
  reversePickupCode?: string;
}

export interface UniwareReturnGetResponse extends UniwareResponse {
  returnDetails?: Array<{
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
  }>;
}

export interface UniwareWaybillDetailsResponse extends UniwareResponse {
  waybillDetails?: Array<{
    waybillNumber: string;
    status: string;
    activityLocation?: string;
    activityDateTime?: string;
    remarks?: string;
  }>;
}
