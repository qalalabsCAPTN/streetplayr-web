import { getCatalogAvailabilityAction } from '@/app/actions/stock';

type WithVariants = {
  variants?: { id: string; stockQuantity?: number }[];
};

/** Batch-fill variant stock from inventory − reservations. */
export async function attachCatalogAvailability<T extends WithVariants>(
  products: T[]
): Promise<T[]> {
  const ids = products.flatMap((p) => (p.variants ?? []).map((v) => v.id).filter(Boolean));
  if (ids.length === 0) return products;
  try {
    const stock = await getCatalogAvailabilityAction(ids);
    return products.map((p) => ({
      ...p,
      variants: (p.variants ?? []).map((v) => ({
        ...v,
        stockQuantity: stock[v.id] ?? 0,
      })),
    }));
  } catch {
    return products;
  }
}
