import type { Metadata } from 'next';
import { TopBar } from '@/components/ops2/top-bar';
import { Shield, Check, X } from 'lucide-react';
import { ROLE_PERMISSIONS, type OpsUserRole, type Permission } from '@/types/ops2/ops';
import { Badge } from '@/components/ops2/ui/badge';
import { cn } from '@/lib/ops2/cn';

export const metadata: Metadata = { title: 'Access Control' };

const ALL_ROLES: OpsUserRole[] = ['super_admin', 'ops_admin', 'support', 'growth', 'finance', 'campaign_manager'];

const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  { label: 'Customers', perms: ['customers:read', 'customers:write', 'customers:adjust_wallet', 'customers:flag'] },
  { label: 'Rewards',   perms: ['rewards:read', 'rewards:write', 'rewards:delete', 'rewards:test_execute'] },
  { label: 'Campaigns', perms: ['campaigns:read', 'campaigns:write', 'campaigns:activate'] },
  { label: 'Events',    perms: ['events:read', 'events:replay'] },
  { label: 'Wallets',   perms: ['wallets:read', 'wallets:manual_credit', 'wallets:manual_debit'] },
  { label: 'Analytics', perms: ['analytics:read', 'analytics:export'] },
  { label: 'System',    perms: ['settings:read', 'settings:write', 'access:manage'] },
];

const ROLE_LABEL: Record<OpsUserRole, string> = {
  super_admin:      'Super Admin',
  ops_admin:        'Ops Admin',
  support:          'Support',
  growth:           'Growth',
  finance:          'Finance',
  campaign_manager: 'Campaign Mgr',
};

export default function AccessControlPage() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Access Control" />

      <div className="flex-1 pt-14 p-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-nectar-400/10 border border-nectar-400/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-nectar-400" />
          </div>
          <div>
            <h2 className="page-title">Access Control</h2>
            <p className="text-sm text-text-muted mt-0.5">Role-based permissions for NECTAR OpsOS</p>
          </div>
        </div>

        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider w-48">
                  Permission
                </th>
                {ALL_ROLES.map(role => (
                  <th key={role} className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        role === 'super_admin' ? 'nectar' :
                        role === 'ops_admin'   ? 'info' :
                        'muted'
                      }
                    >
                      {ROLE_LABEL[role]}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(group => (
                <>
                  <tr key={`group-${group.label}`} className="bg-base-elevated/30">
                    <td colSpan={ALL_ROLES.length + 1} className="px-5 py-2">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{group.label}</span>
                    </td>
                  </tr>
                  {group.perms.map(perm => (
                    <tr key={perm} className="border-t border-border-subtle hover:bg-base-elevated/30 transition-colors">
                      <td className="px-5 py-2.5">
                        <span className="code">{perm}</span>
                      </td>
                      {ALL_ROLES.map(role => {
                        const has = ROLE_PERMISSIONS[role]?.includes(perm);
                        return (
                          <td key={role} className="px-4 py-2.5 text-center">
                            {has
                              ? <Check className="h-4 w-4 text-status-success mx-auto" />
                              : <X className="h-3.5 w-3.5 text-text-muted/40 mx-auto" />
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {ALL_ROLES.map(role => (
            <div key={role} className="surface-elevated rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={role === 'super_admin' ? 'nectar' : role === 'ops_admin' ? 'info' : 'muted'}>
                  {ROLE_LABEL[role]}
                </Badge>
              </div>
              <div className="text-xs text-text-muted">
                {ROLE_PERMISSIONS[role]?.length} permissions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
