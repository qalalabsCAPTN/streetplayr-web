'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

function formatNumber(n: number) { return n.toLocaleString('en-IN'); }
interface ReferralStat { total: number; converted: number; pending: number; earnedSprr: number; }

export default function ReferralsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ReferralStat | null>(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try { const res = await fetch('/api/nectar/referrals'); if (res.ok) { const d = await res.json(); setStats(d.stats); setCode(d.code ?? ''); } } catch {}
    })();
  }, []);

  if (!user) return null;
  const shareUrl = code ? `${window.location.origin}/login?ref=${code}` : '';
  const handleCopy = () => { if (shareUrl) { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  return (
    <div className="dash-page">
      <section className="dash-hero-sm"><p className="dash-hero-eyebrow">Referral Program</p><h1 className="dash-hero-title">Refer & Earn</h1></section>
      {code && (
        <motion.section className="dash-panel dash-panel-highlight" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="dash-panel-title text-sm">Your Referral Code</p>
          <div className="dash-referral-code-row"><code className="dash-referral-code">{code}</code><button onClick={handleCopy} className="dash-btn dash-btn-sm">{copied ? 'Copied!' : 'Copy Link'}</button></div>
          <p className="dash-panel-desc mt-2">Share this link to earn SP-RR when your friends join.</p>
        </motion.section>
      )}
      <section className="dash-cards-three">
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><div className="dash-card-label">Total Referrals</div><div className="dash-card-value">{stats?.total ?? 0}</div><div className="dash-card-unit">People referred</div></motion.div>
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><div className="dash-card-label">Converted</div><div className="dash-card-value">{stats?.converted ?? 0}</div><div className="dash-card-unit">Active members</div></motion.div>
        <motion.div className="dash-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><div className="dash-card-label">SP-RR Earned</div><div className="dash-card-value">{formatNumber(stats?.earnedSprr ?? 0)}</div><div className="dash-card-unit">From referrals</div></motion.div>
      </section>
      {!code && !stats && <div className="dash-empty"><p className="dash-empty-title">No referral data yet</p><p className="dash-empty-sub">Complete a purchase to unlock your referral code.</p></div>}
    </div>
  );
}
