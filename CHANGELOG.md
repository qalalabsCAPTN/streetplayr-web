# Changelog

This document logs all modifications made during the production readiness audit of the Unicommerce integration layer.

---

### [Refactor] [types.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/types.ts)
*   **Change**: Modified `UniwareProductGetRequest` and `UniwareProductGetResponse` to match the official catalog item details API (`skuCode` query parameter, `itemTypeDTO` response payload).
*   **Rationale**: Align types with the official Unicommerce REST API documentation.

### [Refactor] [products.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/products.ts)
*   **Change**: Corrected endpoint path to `/services/rest/v1/catalog/itemType/get`. Updated `getProductBySku` request payload and parsed properties to read `itemTypeDTO` instead of the old assumed arrays. Modified `getProductsBySkus` to retrieve items in parallel via `Promise.all` mapping.
*   **Rationale**: Eliminate wrong endpoint pathways and N+1 query blocking bottlenecks.

### [Refactor] [mapping.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/mapping.ts)
*   **Change**: Aligned `mapProductToInternal` to normalize the correct properties (`skuCode` to `sku`, exclude non-existent `imageUrl`).
*   **Rationale**: Ensure mapper correctly matches updated raw catalog types.

### [Refactor] [client.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/client.ts)
*   **Change**: Added latency tracking inside the request dispatcher, and passed HTTP status, API endpoint, request ID, and correlation ID inside logging parameters.
*   **Rationale**: Satisfy SRE structured logging requirements and enable performance observability.

### [Refactor] [webhooks.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/webhooks.ts)
*   **Change**: Integrated timestamp checking into `verifySignature` to mitigate webhook replay attacks.
*   **Rationale**: Hardening security and replay protection.

### [Refactor] [route.ts (app/api/webhooks/unicommerce)](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/app/api/webhooks/unicommerce/route.ts)
*   **Change**: Extracted timestamp headers (`x-timestamp` or `x-webhook-timestamp`) and passed to signature validator.
*   **Rationale**: Enable replay attack prevention on incoming routes.

### [Refactor] [route.ts (app/api/health)](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/app/api/health/route.ts)
*   **Change**: Added Unicommerce connectivity check to the platform's unified `/api/health` checking report.
*   **Rationale**: Enable observability and centralized status monitoring.

---

### Previous Correctness Fixes (Phase 1)
*   [sync.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/sync.ts) — Updated product catalog creation to insert default `organization_id` and `brand_id` to satisfy schema constraints, and replacedupsert variants with search-then-conditional actions to bypass missing unique constraints. Modified inventory synchronization to write to the public `inventory` table.
*   [lib/inventory/index.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/lib/inventory/index.ts) — Replaced queries targeting `stock_quantity` on `product_variants` with the correct `inventory` table lookup.
*   [app/actions/stock.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/app/actions/stock.ts) — Replaced `stock_quantity` queries with `inventory` table checks.
*   [lib/orchestration/idempotency.ts](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/lib/orchestration/idempotency.ts) — Fixed core platform bug where Postgres duplicate inserts returning no rows bypassed duplicate detection block.
