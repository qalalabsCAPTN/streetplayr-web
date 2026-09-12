'use server';

import { headers } from 'next/headers';
import { rateLimit, clientKey } from '@/lib/security/rate-limit';
import { appendNotifyMeRow, notifyMeSheetsConfigured } from '@/lib/notify-me/append-sheet';
import { validateNotifyMeInput, type NotifyMeInput } from '@/lib/notify-me/validate';

export type NotifyMeActionResult =
  | { success: true; message: string }
  | { success: false; error: string; fields?: Record<string, string> };

export async function submitNotifyMeAction(input: NotifyMeInput): Promise<NotifyMeActionResult> {
  if (String(input.website ?? '').trim()) {
    return { success: true, message: "You're on the list. We'll notify you when this is back." };
  }

  const fields = validateNotifyMeInput(input);
  if (Object.keys(fields).length > 0) {
    return { success: false, error: 'Please check the form and try again.', fields };
  }

  const reqHeaders = await headers();
  const emailKey = String(input.email).trim().toLowerCase();
  const productKey = String(input.productId).trim();
  const ipLimit = await rateLimit({
    key: `notify-me:${clientKey(reqHeaders)}`,
    limit: 8,
    windowMs: 60 * 60_000,
  });
  const dupLimit = await rateLimit({
    key: `notify-me:${emailKey}:${productKey}`,
    limit: 1,
    windowMs: 10 * 60_000,
  });
  if (!ipLimit.ok || !dupLimit.ok) {
    return { success: false, error: 'Please wait a few minutes before requesting again.' };
  }

  if (!notifyMeSheetsConfigured()) {
    return { success: false, error: 'Notify Me is temporarily unavailable. Please try again later.' };
  }

  const saved = await appendNotifyMeRow({
    name: String(input.name).trim(),
    email: emailKey,
    phone: String(input.phone).trim(),
    timestamp: new Date().toISOString(),
    productName: String(input.productName).trim(),
    productId: productKey,
    productHandle: String(input.productHandle).trim(),
    variants: String(input.variants ?? '').trim(),
  });

  if (!saved.ok) {
    return { success: false, error: 'Could not save your request. Please try again.' };
  }

  return { success: true, message: "You're on the list. We'll notify you when this is back." };
}
