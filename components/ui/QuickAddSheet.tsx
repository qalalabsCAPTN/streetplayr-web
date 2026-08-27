'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '@/lib/utils/format';
import { SIZE_GUIDE_ROWS } from '@/lib/products/sizes';
import {
  applySizeClick,
  initialVariantId,
  pdpCtaSoldOut,
  selectVariantBySize,
  sizeIsSoldOut,
  sizesFromExistingVariants,
  type PdpVariant,
} from '@/lib/products/pdp-variant-selection';

export type QuickAddVariant = { id: string; size: string; stockQuantity?: number };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  price: number;
  variants: QuickAddVariant[];
  onAddToBag: (variant: PdpVariant) => void;
  onBuyNow: (variant: PdpVariant) => void;
  /** Desktop popover origin (the + button). Ignored on the mobile sheet. */
  anchorRect?: { top: number; bottom: number; left: number; right: number } | null;
};

function toLive(variants: QuickAddVariant[]): PdpVariant[] {
  return variants.map((v) => ({
    id: v.id,
    size: v.size,
    stockQuantity: v.stockQuantity ?? 1,
  }));
}

export default function QuickAddSheet({
  open,
  onClose,
  title,
  price,
  variants,
  onAddToBag,
  onBuyNow,
  anchorRect,
}: Props) {
  const live = useMemo(() => toLive(variants), [variants]);
  const sizes = useMemo(() => sizesFromExistingVariants(live), [live]);
  const [selectedId, setSelectedId] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedId(initialVariantId(live));
      setGuideOpen(false);
    }
  }, [open, live]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const resolvedId = live.some((v) => v.id === selectedId)
    ? selectedId
    : initialVariantId(live);
  const selected = live.find((v) => v.id === resolvedId);
  const ctaSoldOut = pdpCtaSoldOut(selected) || live.length === 0;
  const popoverStyle =
    !isMobile && anchorRect
      ? (() => {
          const width = 340;
          const left = Math.min(
            Math.max(12, anchorRect.right - width),
            window.innerWidth - width - 12
          );
          const below = anchorRect.bottom + 10;
          const top = below + 420 > window.innerHeight ? Math.max(12, anchorRect.top - 430) : below;
          return { top, left, width } as CSSProperties;
        })()
      : undefined;

  const commit = (mode: 'bag' | 'buy') => {
    if (!selected || ctaSoldOut) return;
    if (mode === 'bag') onAddToBag(selected);
    else onBuyNow(selected);
  };

  return createPortal(
    <div className="quickadd" role="presentation">
      <button type="button" className="quickadd__scrim" aria-label="Close size picker" onClick={onClose} />
      <div
        className={`quickadd__panel ${isMobile ? 'quickadd__panel--sheet' : 'quickadd__panel--popover'}`}
        style={popoverStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Select size for ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quickadd__head">
          <div>
            <h3 className="quickadd__title">{title}</h3>
            <p className="quickadd__price">{formatPrice(price)}</p>
          </div>
          <button type="button" className="quickadd__guide-btn" onClick={() => setGuideOpen((v) => !v)}>
            Size Guide
          </button>
        </div>

        {guideOpen && (
          <div className="quickadd__guide">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest / Waist</th>
                  <th>Fit</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE_ROWS.filter((row) => sizes.includes(row.size)).map((row) => (
                  <tr key={row.size}>
                    <td>{row.size}</td>
                    <td>{row.chestWaist}</td>
                    <td>{row.fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sizes.length === 0 ? (
          <p className="quickadd__empty">Open the product to choose a size.</p>
        ) : (
          <div className="sizes quickadd__sizes" role="group" aria-label="Select size">
            {sizes.map((s) => {
              const matching = selectVariantBySize(live, s);
              if (!matching) return null;
              const soldOut = sizeIsSoldOut(live, s);
              const active = matching.id === resolvedId;
              return (
                <button
                  key={matching.id}
                  type="button"
                  className={`size ${active ? 'active' : ''} ${soldOut ? 'disabled' : ''}`}
                  disabled={soldOut}
                  aria-pressed={active}
                  data-variant-id={matching.id}
                  onClick={() => setSelectedId(applySizeClick(live, selectedId, s))}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        <div className="quickadd__actions">
          <button
            type="button"
            className="quickadd__atb"
            disabled={ctaSoldOut}
            onClick={() => commit('bag')}
          >
            Add to Bag
          </button>
          <button
            type="button"
            className="quickadd__buy"
            disabled={ctaSoldOut}
            onClick={() => commit('buy')}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
