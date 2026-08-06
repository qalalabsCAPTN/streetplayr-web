# Inventory Root Cause Analysis

This report documents the audit of the inventory synchronization pipeline, identifies why 140 variants currently have `NULL` inventory in the database, and recommends an implementation fix.

---

## 1. Audit Metrics & Findings

*   **Requested SKU Count**: 198
*   **Returned SKU Count**: 10
*   **Missing SKU Count**: 188
*   **Variants with NULL Inventory**: 140

### 2. First 20 SKUs Sent inside SOAP `GetInventorySnapshotRequest`
The first 20 SKUs retrieved from the `product_variants` table and dispatched in the SOAP request:
1.  `SPR-HD-001-S`
2.  `SPR-HD-001-M`
3.  `SPR-HD-001-L`
4.  `SPR-CP-001-O`
5.  `SPR-TE-001-S`
6.  `SPR-TE-001-M`
7.  `ctt-waffle-m`
8.  `ctt-waffle-l`
9.  `ctt-waffle-xl`
10. `ctt-waffle-2xl`
11. `black-warrior-xs`
12. `black-warrior-s`
13. `black-warrior-m`
14. `black-warrior-l`
15. `black-warrior-xl`
16. `black-warrior-2xl`
17. `inspired-xs`
18. `inspired-s`
19. `inspired-m`
20. `inspired-l`

---

## 2. Root Cause Analysis

### Mismatch 1: Mock/Test SKUs in Database
Out of the 198 SKUs stored in the `product_variants` table, 188 do not exist in the active catalog of the playr production tenant (`playr.unicommerce.com`). They are mock variants or leftovers from previous sessions. Because they do not exist in the Uniware catalog, Unicommerce does not include them in the `<InventorySnapshot>` XML response.

### Mismatch 2: Sync Engine Ignores Missing Snapshots
In [`src/integrations/unicommerce/sync.ts`](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/sync.ts), the inventory sync logic updates the database by looping **only** over the returned snapshots:

```typescript
// Line 275 in sync.ts:
for (const snap of snapshots) {
  // updates or inserts quantity
}
```

Since the code does not iterate over the list of *requested* variants (`dbVariants`), any SKU that fails to return a snapshot is silently skipped. It is never initialized to `quantity = 0`, leaving 140 variants with a `null` stock state in the database instead of defaulting them to `0` (out of stock).

---

## 3. Pipeline Filtering Status

We verified the existence of filters in the current inventory synchronization pipeline:
*   **Facility**: **YES**. Requests are filtered by the configured facility code (e.g. `playR_Delhi`) in SOAP and REST transports.
*   **Enabled**: **NO**. The sync fetches inventory levels for all SKUs in `product_variants` regardless of whether they are active or disabled.
*   **Allowlist**: **NO**. No allowlist checks exist during inventory sync.
*   **Storefront Flag**: **NO**.
*   **Pagination**: **NO**.
*   **Batching**: **YES**. The sync chunks the list of SKUs in batches of 100 before calling the SOAP endpoint.

---

## 4. Recommended Fix

To resolve the `NULL` inventory state, update [`src/integrations/unicommerce/sync.ts`](file:///c:/Users/pc/Desktop/streetplayr%20-%20open%20code/src/integrations/unicommerce/sync.ts#L274-L321) to iterate over the `dbVariants` array instead of the `snapshots` response array. Any variant SKU that is not present in the returned snapshots should default to `quantity = 0` in the `inventory` table:

```typescript
// Proposed Refactoring:
const snapshotMap = new Map(snapshots.map((s) => [s.sku, s.stock]));

for (const dbVariant of dbVariants) {
  try {
    const stock = snapshotMap.has(dbVariant.sku) ? Math.max(0, snapshotMap.get(dbVariant.sku)!) : 0;
    
    // Check if there is an existing inventory record for this variant
    const { data: existingInv, error: checkError } = await admin
      .from('inventory')
      .select('id')
      .eq('variant_id', dbVariant.id)
      .maybeSingle();

    if (existingInv) {
      // Update quantity
      await admin
        .from('inventory')
        .update({ quantity: stock, updated_at: new Date().toISOString() })
        .eq('id', existingInv.id);
    } else {
      // Insert with default quantity
      await admin
        .from('inventory')
        .insert({
          variant_id: dbVariant.id,
          quantity: stock,
          reserved_quantity: 0,
          low_stock_threshold: 10,
          updated_at: new Date().toISOString(),
        });
    }
  } catch (err) {
    // Log error
  }
}
```
