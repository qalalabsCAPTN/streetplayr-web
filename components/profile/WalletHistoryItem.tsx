'use client';

import { motion } from 'framer-motion';
import { type WalletTransaction, type WalletTransactionType } from '@/store/authStore';

function formatDelta(delta: number) {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_CONFIG: Record<WalletTransactionType, { label: string; symbol: string; color: string }> = {
  EARN:     { label: 'Earned',   symbol: '↑', color: 'var(--sp-success)' },
  SPEND:    { label: 'Spent',    symbol: '↓', color: 'var(--sp-error)' },
  REFERRAL: { label: 'Referral', symbol: '⇉', color: 'var(--tier-player)' },
  BONUS:    { label: 'Bonus',    symbol: '✦', color: 'var(--tier-legend)' },
  PURCHASE: { label: 'Purchase', symbol: '◆', color: 'var(--sp-text-secondary)' },
  DROP:     { label: 'Drop',     symbol: '◉', color: 'var(--sp-accent)' },
};

interface WalletHistoryItemProps {
  tx: WalletTransaction;
  index?: number;
}

export default function WalletHistoryItem({ tx, index = 0 }: WalletHistoryItemProps) {
  const cfg = TYPE_CONFIG[tx.type];
  const isPositive = tx.delta >= 0;

  return (
    <motion.div
      className="wallet-tx-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="wallet-tx-icon"
        aria-hidden="true"
        style={{ color: cfg.color }}
      >
        {cfg.symbol}
      </div>

      <div className="wallet-tx-meta">
        <p className="wallet-tx-source">{tx.source}</p>
        <p className="wallet-tx-date">{formatDate(tx.createdAt)}</p>
      </div>

      <div
        className="wallet-tx-delta"
        style={{ color: isPositive ? 'var(--sp-text-primary)' : 'var(--sp-text-secondary)' }}
        aria-label={`${formatDelta(tx.delta)} SP-RR`}
      >
        <span className="wallet-tx-delta-num">{formatDelta(tx.delta)}</span>
        <span className="wallet-tx-delta-unit">SP-RR</span>
      </div>
    </motion.div>
  );
}
