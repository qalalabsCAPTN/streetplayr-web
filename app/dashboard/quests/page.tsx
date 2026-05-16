'use client';

import { Scroll, ChevronRight, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/nectar-portal/cn';

const QUESTS = [
  { id: 'q1',  name: 'Social Butterfly',       freq: 'weekly',  steps: 5, done: 3, pts: 3000,  xp: 1500, endsIn: '5 days', status: 'active',    desc: 'Make purchases on 5 different days this week.' },
  { id: 'q2',  name: 'Streak Master',           freq: 'daily',   steps: 7, done: 5, pts: 1500,  xp: 500,  endsIn: '6 days', status: 'active',    desc: 'Log in for 7 consecutive days.' },
  { id: 'q3',  name: 'Refer 3 Friends',         freq: 'once',    steps: 3, done: 1, pts: 8000,  xp: 3000, endsIn: null,     status: 'active',    desc: 'Refer 3 friends who complete their first purchase.' },
  { id: 'q4',  name: 'Weekend Warrior',         freq: 'weekly',  steps: 3, done: 3, pts: 2000,  xp: 1000, endsIn: null,     status: 'completed', desc: 'Make purchases on both Saturday and Sunday.' },
  { id: 'q5',  name: 'First Drop',              freq: 'once',    steps: 1, done: 1, pts: 5000,  xp: 2000, endsIn: null,     status: 'completed', desc: 'Claim your first exclusive drop.' },
  { id: 'q6',  name: 'Platform Explorer',       freq: 'once',    steps: 4, done: 0, pts: 10000, xp: 5000, endsIn: null,     status: 'available', desc: 'Be active on all 4 PlayR platforms in a single week.' },
  { id: 'q7',  name: 'Game Champion',           freq: 'weekly',  steps: 5, done: 0, pts: 4000,  xp: 2000, endsIn: '5 days', status: 'available', desc: 'Win 5 matches on PlayR Game this week.' },
  { id: 'q8',  name: 'Night Raider',            freq: 'once',    steps: 3, done: 0, pts: 6000,  xp: 2500, endsIn: '18 days',status: 'available', desc: 'Make 3 purchases during Night Raid hours (00:00–04:00 UTC).' },
];

const STATUS_CONFIG = {
  active:    { label: 'Active',     color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  completed: { label: 'Complete',   color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  available: { label: 'Available',  color: '#94A3B8', bg: 'rgba(148,163,184,0.06)' },
};

const FREQ_LABELS: Record<string, string> = {
  once: 'One-time', daily: 'Daily', weekly: 'Weekly', seasonal: 'Seasonal',
};

export default function QuestsPage() {
  const active = QUESTS.filter(q => q.status === 'active');
  const completed = QUESTS.filter(q => q.status === 'completed');
  const available = QUESTS.filter(q => q.status === 'available');

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center gap-3 animate-fade-up">
        <Scroll className="h-8 w-8 text-nectar-400" />
        <div>
          <h1 className="text-3xl font-black text-text-primary">Quests</h1>
          <p className="text-sm text-text-muted">{active.length} active · {completed.length} completed · {available.length} available</p>
        </div>
      </div>

      {/* Active quests - prominent */}
      <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="section-title mb-4">In Progress</h2>
        <div className="grid grid-cols-3 gap-4">
          {active.map(q => {
            const pct = (q.done / q.steps) * 100;
            return (
              <div key={q.id} className="card p-5 space-y-4 cursor-pointer hover:border-nectar-400/20 transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-text-primary group-hover:text-nectar-300 transition-colors">{q.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">{q.desc}</div>
                  </div>
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0"
                    style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.1)' }}>
                    {FREQ_LABELS[q.freq]}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">{q.done}/{q.steps} steps</span>
                    {q.endsIn && (
                      <span className="flex items-center gap-1 text-status-warning">
                        <Clock className="h-3 w-3" /> {q.endsIn}
                      </span>
                    )}
                  </div>
                  <div className="h-2 w-full rounded-full bg-base-overlay overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)', boxShadow: '0 0 6px rgba(251,191,36,0.4)' }} />
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: q.steps }).map((_, i) => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full', i < q.done ? 'bg-nectar-400' : 'bg-base-overlay')} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-nectar-400 font-bold">
                    <Zap className="h-3 w-3" />
                    +{q.pts.toLocaleString()} pts · +{q.xp.toLocaleString()} XP
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available */}
      <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <h2 className="section-title mb-4">Available</h2>
        <div className="card divide-y divide-border-subtle overflow-hidden">
          {available.map(q => (
            <div key={q.id} className="flex items-center gap-4 px-5 py-4 hover:bg-base-elevated/30 transition-colors cursor-pointer group">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-primary group-hover:text-nectar-300 transition-colors">{q.name}</div>
                <div className="text-xs text-text-muted mt-0.5">{q.desc}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-nectar-400">+{q.pts.toLocaleString()} pts</div>
                <div className="text-[10px] text-text-muted">{q.steps} steps · {FREQ_LABELS[q.freq]}</div>
              </div>
              {q.endsIn && <span className="text-xs text-status-warning shrink-0">{q.endsIn}</span>}
              <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Completed */}
      <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
        <h2 className="section-title mb-4">Completed</h2>
        <div className="card divide-y divide-border-subtle overflow-hidden">
          {completed.map(q => (
            <div key={q.id} className="flex items-center gap-4 px-5 py-4 opacity-60">
              <div className="h-6 w-6 rounded-full bg-status-success/10 border border-status-success/20 flex items-center justify-center text-xs shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-secondary">{q.name}</div>
                <div className="text-xs text-text-muted">{q.desc}</div>
              </div>
              <div className="text-right text-xs font-bold text-status-success">+{q.pts.toLocaleString()} pts earned</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
