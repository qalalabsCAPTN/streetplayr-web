import { revalidatePath } from 'next/cache';

/** Drop ISR pages that embed inventory so Uniware qty hits the storefront. */
export function revalidateStorefrontInventory(slugs: string[] = []): void {
  revalidatePath('/home');
  revalidatePath('/collections');
  revalidatePath('/search');
  revalidatePath('/product/[slug]', 'page');
  for (const slug of slugs) {
    if (slug) revalidatePath(`/product/${slug}`);
  }
}
