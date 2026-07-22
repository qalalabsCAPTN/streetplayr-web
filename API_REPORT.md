# API Verification Report

## 1. Catalog Retrieval API
*   **Endpoint:** `/services/soap/?version=1.9`
*   **Operation:** `GetItemTypeRequest`
*   **Status:** ✅ Verified
*   **SKU Code Query:** `IK5737-M`
*   **Response Details:**
    *   Name: `Fortore 3 Jersey`
    *   Brand: `Adidas`
    *   Category: `Jersey`
    *   Price: `Rs. 1999.00`
    *   Enabled: `true`

## 2. Inventory Snapshot API
*   **Endpoint:** `/services/soap/?version=1.9&facility=playR_Delhi`
*   **Operation:** `GetInventorySnapshotRequest`
*   **Status:** ⚠️ Returned Error
*   **Raw Response Status:** HTTP 200
*   **Inventory Outcome Details:**
```json
{
  "success": false,
  "errorCode": "60004",
  "description": "Could not find any any items",
  "message": "INVENTORY_NOT_AVAILABLE"
}
```

## 3. Core Operational APIs Compatibility
Based on the SOAP operations enumerated from the WSDL, the following corresponding endpoints are available:
*   **Order API:** `CreateSaleOrder` / `CreateSaleOrderAlternate` (Fully Supported)
*   **Shipment API:** `GetShippingPackageDetail` / `SmartSplitShippingPackage` (Fully Supported)
*   **Return API:** `CreateReversePickup` / `CompleteReturns` (Fully Supported)
