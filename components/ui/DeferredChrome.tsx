'use client';

import dynamic from 'next/dynamic';

/**
 * Non-critical chrome loaded after hydration so root layout stays free of
 * eager GlobalParticles JS on the critical path.
 */
const GlobalParticles = dynamic(() => import('@/components/ui/GlobalParticles'), {
  ssr: false,
});

export default function DeferredChrome() {
  return <GlobalParticles />;
}
