# Mapping Comparison Report

This report compares the raw SOAP response structure against the current mapping definitions in [`src/integrations/unicommerce/mapping.ts`](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/mapping.ts).

## 1. Gaps Identified

The integration layer was designed assuming Unicommerce REST JSON response structures. However, since this tenant uses the SOAP XML interface, the following mismatches exist:

1.  **Casing and Format**:
    *   **REST JSON:** Returns properties in camelCase (e.g. `skuCode`, `categoryCode`, `basePrice`).
    *   **SOAP XML:** Returns tags in PascalCase (e.g. `<SkuCode>`, `<CategoryCode>`, `<MaxRetailPrice>`).
    *   **Impact:** The mapping methods inside `UnicommerceMapper` will fail with `undefined` values because they expect camelCase properties in lower-level JSON.

2.  **Field Naming Anomalies**:
    *   **Catalog Price:** REST returns `basePrice`, but SOAP returns `<MaxRetailPrice>`.
    *   **Inventory Identifier:** REST returns `itemTypeSKU` inside `inventorySnapshots` objects, but SOAP returns `<ItemSKU>` inside `<InventorySnapshot>` objects.

## 2. Recommended Solution
To resolve this without altering the core codebase of the REST-focused mapping layer, we should introduce a **Normalization Wrapper** in the integration service. This wrapper will convert the parsed SOAP XML structures to match the REST-compliant camelCase JSON formats before calling `UnicommerceMapper.mapProductToInternal` or `UnicommerceInventoryService.getInventorySnapshot`.
