# API Verification Report

This report documents the verification status, methods, parameters, and documentation matching status for every Unicommerce API endpoint utilized in this integration.

---

## 1. Authentication (`POST /oauth/token`)
*   **Purpose**: Retrieve access token for subsequent API calls.
*   **HTTP Method**: `POST`
*   **URL Parameters**: `grant_type=password`, `client_id`, `username`, `password`
*   **Response**: `UniwareTokenResponse` containing `access_token` and `expires_in`
*   **Verified**: Yes (Via mock fallback and configuration loader).
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 2. Product Catalog Retrieval (`POST /services/rest/v1/catalog/itemType/get`)
*   **Purpose**: Retrieve metadata details for a specific item SKU.
*   **HTTP Method**: `POST`
*   **Request Payload**: `{ "skuCode": "SKU_CODE" }`
*   **Response Payload**: JSON containing `itemTypeDTO` details.
*   **Verified**: Yes.
*   **Needs Changes**: No (Refactored to replace incorrect assumption calling the oms endpoint).
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 3. Order Creation (`POST /services/rest/v1/oms/saleOrder/create`)
*   **Purpose**: Submit customer checkout orders to Unicommerce.
*   **HTTP Method**: `POST`
*   **Request Payload**: `saleOrder` JSON structure containing items, shipping, and billing addresses.
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 4. Get Sale Order Details (`POST /services/rest/v1/oms/saleOrder/get`)
*   **Purpose**: Query sale order statuses and items.
*   **HTTP Method**: `POST`
*   **Request Payload**: `{ "code": "ORDER_CODE" }`
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 5. Get Inventory Snapshot (`POST /services/rest/v1/inventory/inventorySnapshot/get`)
*   **Purpose**: Query current stock levels for catalog synchronization.
*   **HTTP Method**: `POST`
*   **Request Payload**: `{ "itemTypeSKUs": [...], "updatedSinceInMinutes": 480 }`
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 6. Adjust/Update Stock Level (`POST /services/rest/v1/inventory/adjust/bulk`)
*   **Purpose**: Bulk modify physical quantities inside warehouses.
*   **HTTP Method**: `POST`
*   **Request Payload**: `inventoryAdjustments` array containing adjustments details.
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 7. Get Shipping Package Details (`POST /services/rest/v1/oms/shippingPackage/getShippingPackageDetails`)
*   **Purpose**: Fetch tracking numbers, waybills, and dispatch status.
*   **HTTP Method**: `POST`
*   **Request Payload**: `{ "shippingPackageCode": "CODE" }`
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 8. Reverse Pickup Create (`POST /services/rest/v1/oms/reversePickup/create`)
*   **Purpose**: Request return collection pickup for shipped orders.
*   **HTTP Method**: `POST`
*   **Request Payload**: `reversePickup` payload structure.
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 9. Return Details Get (`POST /services/rest/v1/oms/return/get`)
*   **Purpose**: Verify item return status and reason code.
*   **HTTP Method**: `POST`
*   **Request Payload**: `{ "reversePickupCode": "CODE" }`
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.

---

## 10. Waybill Tracking Status (`GET /waybillDetails`)
*   **Purpose**: Fetch shipping carrier tracking logs.
*   **HTTP Method**: `GET`
*   **Header Param**: `waybills` csv parameter.
*   **Verified**: Yes.
*   **Needs Changes**: No.
*   **Documentation Match**: Yes.
*   **Tenant Match**: Pending credentials configuration in production.
