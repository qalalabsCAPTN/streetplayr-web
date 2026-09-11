'use server';

import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import { UnicommerceSyncService } from '@/src/integrations/unicommerce/sync';
import { revalidateStorefrontInventory } from '@/lib/inventory/revalidate-storefront';
import { revalidatePath } from 'next/cache';

export async function pullUniwareInventoryAction(): Promise<{
  success: boolean;
  error?: string;
  written?: number;
  explicitZero?: number;
  processed?: number;
}> {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return { success: false, error: 'Unauthorized' };

  try {
    const result = await new UnicommerceSyncService().syncInventory();
    if (result.written > 0) {
      revalidateStorefrontInventory(result.changedSlugs);
    }
    revalidatePath('/ops/inventory');
    return {
      success: result.success,
      written: result.written,
      explicitZero: result.explicitZero,
      processed: result.processed,
      error: result.success ? undefined : 'Inventory pull failed',
    };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Inventory pull failed' };
  }
}
