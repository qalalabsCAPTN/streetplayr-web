'use server';

import { requireSSRRole } from '@/lib/auth/ssr';
import { OPS_ROLES } from '@/lib/auth/permissions';
import { OrderService } from '@/lib/orchestration/order';

export async function transitionAdminOrderAction(orderId: string, status: string, reason?: string) {
  const auth = await requireSSRRole(OPS_ROLES);
  if ('error' in auth) return auth.error;
  return OrderService.transitionStatus(orderId, status, auth.user.id, reason);
}
