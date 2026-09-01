'use client';

import { useEffect, useState } from 'react';
import type { TotalsResult } from '@/lib/commerce/totals';

export function useServerCartQuote(items: Array<{ key: string; qty: number }>) {
  const [quote, setQuote] = useState<TotalsResult | null>(null);

  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const payload = items
      .filter((i) => i.qty > 0)
      .map((i) => ({ variantId: i.key, quantity: i.qty }));
    (async () => {
      const { previewCartTotalsAction } = await import('@/app/actions/checkout');
      const result = await previewCartTotalsAction(payload);
      if (!cancelled && result.success && result.data) setQuote(result.data);
    })().catch(() => {
      if (!cancelled) setQuote(null);
    });
    return () => {
      cancelled = true;
    };
  }, [items.map((i) => `${i.key}:${i.qty}`).join('|')]);

  return quote;
}
