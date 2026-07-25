'use client';

import TryOnGallery from '@/components/profile/TryOnGallery';

export default function ProfileTryOnsPage() {
  return (
    <div>
      <div className="acct-section-head" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
        <h2>AI Try-Ons</h2>
      </div>
      <p className="tryon-gallery__intro">
        Looks you saved from product pages — multiple garments, one gallery.
        Download any fit anytime.
      </p>
      <TryOnGallery />
    </div>
  );
}
