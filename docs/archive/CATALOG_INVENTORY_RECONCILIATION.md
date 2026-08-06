# Catalog & Inventory Reconciliation Report

This report presents the results of a complete reconciliation audit of all 198 database `product_variants.sku` values against the live Unicommerce production catalog (`playr.unicommerce.com`) and the corresponding SOAP inventory snapshot responses.

---

## 1. Classification Summary & Counts

Every SKU in the database has been matched and classified into one of three buckets:

| Classification Bucket | Count | Description |
| :--- | :--- | :--- |
| **Bucket 1: Exists in catalog + inventory returned** | **10** | SKUs exist in the live Uniware catalog and returned active warehouse stock levels. |
| **Bucket 2: Exists in catalog + no inventory returned** | **140** | SKUs exist in the live Uniware catalog, but no stock levels were returned. |
| **Bucket 3: Does not exist in catalog** | **48** | SKUs do not exist in the live Uniware catalog. |
| **Total SKUs Processed** | **198** | |

---

## 2. Sample SKUs per Bucket

### Bucket 1: Exists in catalog + inventory returned (10 SKUs)
*   `PST-133-COM-4-M`
*   `PST-133-COM-4-L`
*   `PST-133-COM-4-2XL`
*   `PST-133-COM-3-S`
*   `PST-133-COM-3-M`

### Bucket 2: Exists in catalog + no inventory returned (140 SKUs)
*   `PS-TEE-WAR-BRW-XS`
*   `PS-TEE-INS-PRP-M`
*   `PS-TEE-INS-PRP-L`
*   `PS-TEE-CRT-WHT-XS`
*   `PS-TEE-CRT-WHT-XL`

### Bucket 3: Does not exist in catalog (48 SKUs)
*   `SPR-HD-001-S`
*   `SPR-HD-001-M`
*   `SPR-HD-001-L`
*   `SPR-CP-001-O`
*   `SPR-TE-001-S`
*   `SPR-TE-001-M`
*   `ctt-waffle-m`
*   `ctt-waffle-l`
*   `ctt-waffle-xl`
*   `ctt-waffle-2xl`

---

## 3. Recommendation for Missing Inventory

### The Problem
The current synchronization logic loops only over returned inventory snapshots. The 140 SKUs in **Bucket 2** exist in the catalog but are skipped by the update loop because Unicommerce did not return an inventory snapshot for them. As a result, they have `NULL` stock records in the database.

### Our Recommendation
We strongly recommend **treating missing inventory snapshots as zero stock (quantity = 0)** instead of ignoring them.

#### Rationale:
1.  **Overselling Prevention**: If Unicommerce does not return any stock snapshot for a SKU, it implies the item has no physical inventory or active stock transaction history in the queried warehouse facility. Treating it as `0` is the safest choice to prevent checkout attempts on out-of-stock items.
2.  **Database & UI Consistency**: Setting explicit `quantity = 0` rows in the `inventory` table ensures clean database joins on the storefront, preventing UI components from receiving `NULL` fields or failing validation checks.
3.  **Correct Lifecycle Handling**: When stock sells out, or is removed from the shelf in Uniware, the sync engine will correctly set it to `0` rather than leaving stale values or `NULL` states.
