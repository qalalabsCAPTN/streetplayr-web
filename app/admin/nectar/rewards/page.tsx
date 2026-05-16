'use client';

import { useState } from 'react';
import { TopBar } from '@/components/ops2/top-bar';
import { RuleList } from '@/modules/nectar/rewards/components/rule-list';
import { RuleBuilder } from '@/modules/nectar/rewards/components/rule-builder';
import type { RewardRule } from '@nectar/types';

export default function RewardsPage() {
  const [selectedRule, setSelectedRule] = useState<RewardRule | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Reward Rules" />

      <div className="flex-1 pt-14 p-5 flex gap-5 min-h-0">
        <div className="w-[360px] shrink-0 h-full">
          <RuleList
            onSelectRule={(rule) => { setSelectedRule(rule); setCreating(false); }}
            onCreateRule={() => { setSelectedRule(null); setCreating(true); }}
            selectedId={selectedRule?.id}
          />
        </div>

        <div className="flex-1 min-w-0 h-full">
          {(selectedRule || creating) ? (
            <RuleBuilder
              rule={selectedRule ?? undefined}
              onSave={() => { setSelectedRule(null); setCreating(false); }}
              onCancel={() => { setSelectedRule(null); setCreating(false); }}
            />
          ) : (
            <div className="surface h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Select a rule to edit</p>
                <p className="text-xs text-text-muted mt-1">
                  Or create a new rule to start orchestrating rewards
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
