'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { stories } from '@/lib/bluorng-data';

export default function StoriesBar() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="stories">
        {stories.map((s, i) => (
          <div key={s.label} className="story" onClick={() => setActive(i)}>
            <div className="story__ring">
              <Image src={s.image} alt={s.label} width={56} height={56} className="rounded-full object-cover" />
            </div>
            <p>{s.label}</p>
          </div>
        ))}
      </div>

      {active !== null && (
        <div className="storyviewer" onClick={() => setActive(null)}>
          <button className="storyviewer__close" aria-label="Close">
            ×
          </button>
          <div className="storyviewer__card" onClick={(e) => e.stopPropagation()}>
            <Image src={stories[active].image} alt={stories[active].label} width={400} height={600} className="w-full h-full object-cover" />
            <Link href={stories[active].href} className="storyviewer__cta" onClick={() => setActive(null)}>
              {stories[active].cta}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
