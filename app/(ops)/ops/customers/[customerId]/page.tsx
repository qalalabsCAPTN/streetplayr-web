/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { notFound } from 'next/navigation';
import { getCustomerDetailAction } from '@/app/actions/ops/customers';

function formatTime(ts: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const { customerId } = await params;
  const data = await getCustomerDetailAction(customerId);
  if (!data) notFound();

  const { profile, orders, walletTx, referrals, referredBy } = data;
  const totalSpent = orders.reduce((s: number, o: any) => s + (o.total ?? 0), 0);

  return (
    <div className="space-y-16">
      <section className="flex items-end justify-between border-b border-[var(--ops-border-subtle)] pb-8">
        <div>
          <h1 className="font-display text-6xl uppercase tracking-tight text-white">
            {profile.full_name || 'Unknown'}
          </h1>
          <p className="mt-4 text-[10px] font-mono text-[var(--ops-text-secondary)] uppercase tracking-[0.2em]">
            Customer Dossier / {profile.role || 'member'}
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-xl font-mono text-white">{orders.length}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Orders</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-white">₹{totalSpent.toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Total Spent</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-[var(--sp-accent)]">{profile.sprr_balance ?? 0}</div>
            <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">Wallet</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
        <div className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">Order History</h2>
            </div>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div key={order.id} className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className={`ml-4 text-[9px] font-mono uppercase tracking-widest ${
                          order.status === 'confirmed' ? 'text-green-400' :
                          order.status === 'shipped' ? 'text-blue-400' :
                          order.status === 'delivered' ? 'text-[var(--sp-accent)]' :
                          'text-[var(--ops-text-muted)]'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-mono text-white">₹{(order.total ?? 0).toLocaleString('en-IN')}</div>
                        <div className="text-[8px] font-mono text-[var(--ops-text-muted)]">{formatTime(order.created_at)}</div>
                      </div>
                    </div>
                    {order.order_items?.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-[var(--ops-border-subtle)]">
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-[10px] font-mono text-[var(--ops-text-secondary)]">
                            <span>x{item.quantity}</span>
                            <span>₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[20vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
                <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">No orders yet</p>
              </div>
            )}
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">Referral Network</h2>
            </div>
            {referrals.length > 0 ? (
              <div className="space-y-4">
                {referrals.map((ref: any) => (
                  <div key={ref.id} className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-mono text-white">{ref.referred?.full_name || 'Unknown'}</div>
                        <div className="text-[9px] font-mono text-[var(--ops-text-muted)]">{ref.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-[var(--sp-accent)]">+{ref.bonus_sprr} SP</div>
                        <div className="text-[8px] font-mono text-[var(--ops-text-muted)]">{formatTime(ref.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[10vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
                <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">No referrals</p>
              </div>
            )}
            {referredBy && (
              <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Referred By</div>
                <div className="text-sm font-mono text-white">{referredBy.referrer?.full_name || 'Unknown'}</div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">Profile</h2>
            </div>
            <div className="space-y-4">
              <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Email</div>
                <div className="text-sm font-mono text-white">{profile.email || '—'}</div>
              </div>
              <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Referral Code</div>
                <div className="text-sm font-mono text-white">{profile.referral_code || '—'}</div>
              </div>
              <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">Joined</div>
                <div className="text-sm font-mono text-white">{formatTime(profile.created_at)}</div>
              </div>
              <div className="p-6 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                <div className="text-[9px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest mb-2">XP</div>
                <div className="text-sm font-mono text-white">{profile.xp ?? 0}</div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-[var(--ops-border-subtle)] pb-4">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ops-text-muted)]">Wallet Activity</h2>
            </div>
            {walletTx.length > 0 ? (
              <div className="space-y-4">
                {walletTx.slice(0, 10).map((tx: any) => (
                  <div key={tx.id} className="p-4 border border-[var(--ops-border-subtle)] bg-[var(--ops-bg-surface)]/20">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-mono text-[var(--ops-text-secondary)]">{tx.source}</div>
                      <div className={`text-sm font-mono ${tx.delta > 0 ? 'text-[var(--sp-accent)]' : 'text-red-400/70'}`}>
                        {tx.delta > 0 ? '+' : ''}{tx.delta}
                      </div>
                    </div>
                    <div className="text-[8px] font-mono text-[var(--ops-text-muted)]">{formatTime(tx.created_at)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[10vh] items-center justify-center border border-dashed border-[var(--ops-border-subtle)]">
                <p className="text-[10px] font-mono text-[var(--ops-text-muted)] uppercase tracking-widest">No activity</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
