/**
 * Client-side preview mode gate.
 * Reads ?preview=true from the URL and checks auth on the client.
 * Shows a subtle banner when preview mode is active, but never blocks rendering
 * of the main page content.
 */
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function PreviewBanner() {
  const searchParams = useSearchParams();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isPreview = searchParams?.get('preview') === 'true';
    if (!isPreview) {
      setChecking(false);
      return;
    }
    // Lazy-load auth check to avoid blocking render
    import('@/lib/auth/service').then(({ AuthService }) => {
      AuthService.getCurrentProfile().then((profile) => {
        const isAdmin = profile && ['super_admin', 'ops_admin', 'growth', 'campaign_manager'].includes(profile.role);
        setAuthorized(!!isAdmin);
        setChecking(false);
      });
    }).catch(() => {
      setChecking(false);
    });
  }, [searchParams]);

  if (!authorized || checking) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white text-center py-1 text-xs font-mono tracking-wider">
      ⚡ PREVIEW MODE — Draft content shown
    </div>
  );
}
