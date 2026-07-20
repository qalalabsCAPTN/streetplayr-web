'use client';

import { type WalletTransaction, type WalletTransactionType } from '@/store/authStore';

function formatDelta(delta: number) {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_CONFIG: Record<WalletTransactionType, { label: string; symbol: string }> = {
  EARN:     { label: 'Earned',   symbol: '↑' },
  SPEND:    { label: 'Spent',    symbol: '↓' },
  REFERRAL: { label: 'Referral', symbol: '⇉' },
  BONUS:    { label: 'Bonus',    symbol: '✦' },
  PURCHASE: { label: 'Purchase', symbol: '◆' },
  DROP:     { label: 'Drop',     symbol: '◉' },
};

interface WalletHistoryItemProps {
  tx: WalletTransaction;
  index?: number;
}

export default function WalletHistoryItem({ tx }: WalletHistoryItemProps) {
  const cfg = TYPE_CONFIG[tx.type];
  const isPositive = tx.delta >= 0;

  return (
    <div className="acct-txrow">
      <span className="acct-txrow__symbol">{cfg.symbol}</span>
      <div className="acct-txrow__info">
        <p>{tx.source}</p>
        <span>{formatDate(tx.createdAt)}</span>
      </div>
      <div className={`acct-txrow__amount ${isPositive ? 'positive' : 'negative'}`}>
        <span>{formatDelta(tx.delta)}</span>
        <small>SP-RR</small>
      </div>
    </div>
  );
}
