'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTryOnSaveStore } from '@/store/tryonSaveStore';
import { downloadTryOnImage } from '@/lib/tryon-saves/adapter';
import type { TryOnSave } from '@/lib/tryon-saves/types';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function DownloadBtn({ item }: { item: TryOnSave }) {
  const [busy, setBusy] = useState(false);

  const onDownload = async () => {
    setBusy(true);
    try {
      const safe = (item.productTitle || 'tryon')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
      await downloadTryOnImage(
        item.imageUrl,
        `streetplayr-${safe || 'tryon'}.jpg`
      );
    } catch {
      /* silent — user can long-press as fallback */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="tryon-gallery__dl"
      onClick={onDownload}
      disabled={busy}
      aria-label={`Download try-on of ${item.productTitle}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span>{busy ? '…' : 'Save'}</span>
    </button>
  );
}

export default function TryOnGallery({
  compact = false,
  limit,
}: {
  compact?: boolean;
  limit?: number;
}) {
  const items = useTryOnSaveStore((s) => s.items);
  const hydrated = useTryOnSaveStore((s) => s.hydrated);
  const syncing = useTryOnSaveStore((s) => s.syncing);
  const hydrate = useTryOnSaveStore((s) => s.hydrate);
  const remove = useTryOnSaveStore((s) => s.remove);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const visible = typeof limit === 'number' ? items.slice(0, limit) : items;

  if (!hydrated || syncing) {
    return (
      <div className="tryon-gallery tryon-gallery--loading" aria-busy="true">
        <p className="tryon-gallery__empty-copy">Loading your fits…</p>
      </div>
    );
  }

  if (items.length === 0) {
    if (compact) return null;
    return (
      <div className="tryon-gallery tryon-gallery--empty">
        <p className="tryon-gallery__empty-copy">
          No saved try-ons yet. Generate a look on any product page, then tap{' '}
          <strong>Save to your profile</strong>.
        </p>
        <Link href="/collections" className="storefront-cta storefront-cta--inline">
          Browse collection →
        </Link>
      </div>
    );
  }

  return (
    <div className={`tryon-gallery ${compact ? 'tryon-gallery--compact' : ''}`}>
      <ul className="tryon-gallery__grid" role="list">
        {visible.map((item) => (
          <li key={item.id} className="tryon-gallery__card">
            <div className="tryon-gallery__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={`AI try-on — ${item.productTitle}`}
                className="tryon-gallery__img"
                loading="lazy"
              />
              <span className="tryon-gallery__badge">AI</span>
              <div className="tryon-gallery__actions">
                <DownloadBtn item={item} />
                {!compact && (
                  <button
                    type="button"
                    className="tryon-gallery__rm"
                    onClick={() => void remove(item.id)}
                    aria-label={`Remove try-on of ${item.productTitle}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="tryon-gallery__meta">
              {item.productSlug ? (
                <Link href={`/product/${item.productSlug}`} className="tryon-gallery__title">
                  {item.productTitle}
                </Link>
              ) : (
                <span className="tryon-gallery__title">{item.productTitle}</span>
              )}
              <time className="tryon-gallery__date" dateTime={item.createdAt}>
                {formatDate(item.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>
      {compact && items.length > (limit ?? 0) && (
        <Link href="/profile/try-ons" className="tryon-gallery__more">
          View all {items.length} try-ons →
        </Link>
      )}
    </div>
  );
}
