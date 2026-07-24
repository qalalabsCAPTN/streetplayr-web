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
    <section className="acct-referral">
      <div>
        <h2>Refer &amp; Earn</h2>
        <p>Share your referral link. Earn SP-RR when friends join and order.</p>
        <div className="acct-referral__code">
          <code>{code}</code>
          <span>{referralCount} referral{referralCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <button onClick={copyLink} className="storefront-cta storefront-cta--inline">Copy link</button>
    </section>
  );
}
