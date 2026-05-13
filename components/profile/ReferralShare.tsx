'use client';

export function ReferralShare({ code, referralCount }: { code: string; referralCount: number }) {
  const shareUrl = `${window.location.origin}/?ref=${code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  }

  return (
    <section className="p-8 border border-white/10 bg-white/[0.02]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-display uppercase tracking-tight">Refer & Earn</h2>
          <p className="mt-1 text-sm text-white/50">
            Share your referral link. Earn SP-RR when friends join and order.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <code className="px-3 py-1.5 bg-white/5 border border-white/10 text-sm font-mono">{code}</code>
            <span className="text-xs text-white/40">{referralCount} referral{referralCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          onClick={copyLink}
          className="px-6 py-3 border border-white/20 text-sm font-mono uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all"
        >
          Copy Link
        </button>
      </div>
    </section>
  );
}
