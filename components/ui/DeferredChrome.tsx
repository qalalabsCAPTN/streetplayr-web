'use client';

import dynamic from 'next/dynamic';

/**
 * Non-critical chrome loaded after hydration so root layout stays free of
 * eager ScrollDamping / GlobalParticles JS on the critical path.
 */
const ScrollDamping = dynamic(() => import('@/components/ui/ScrollDamping'), {
  ssr: false,
});
const GlobalParticles = dynamic(() => import('@/components/ui/GlobalParticles'), {
  ssr: false,
});

export default function DeferredChrome() {
  return (
    <>
      <ScrollDamping />
      <GlobalParticles />
    </>
  );
}
