'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { stories } from '@/lib/bluorng-data';

interface StoryViewerProps {
  onClose: () => void;
}

export default function StoryViewer({ onClose }: StoryViewerProps) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setIdx((i) => {
        if (i + 1 >= stories.length) {
          onClose();
          return i;
        }
        return i + 1;
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [idx, paused, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const story = stories[idx];
  const step = (dir: number) => setIdx((i) => Math.min(Math.max(i + dir, 0), stories.length - 1));

  return (
    <div className="storyviewer" onClick={onClose}>
      <div className="storyviewer__top" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setPaused((v) => !v)} aria-label="Pause">
          {paused ? '▶' : '⏸'}
        </button>
        <button onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <button
        className="storyviewer__side"
        onClick={(e) => {
          e.stopPropagation();
          step(-1);
        }}
        aria-label="Previous story"
        style={{ visibility: idx === 0 ? 'hidden' : 'visible' }}
      >
        ←
      </button>

      <div className="storyviewer__card" onClick={(e) => e.stopPropagation()}>
        <div className="storyviewer__progress">
          {stories.map((_, i) => (
            <span key={`${i}-${i === idx ? idx : 'x'}`} className={`storyviewer__bar ${i < idx ? 'done' : ''} ${i === idx && !paused ? 'now' : ''}`}>
              <i />
            </span>
          ))}
        </div>
        <span className="storyviewer__label">{story.label}</span>
        <img src={story.image} alt={story.label} />
        <Link href={story.href} className="storyviewer__cta" onClick={onClose}>
          {story.cta}
        </Link>
      </div>

      <button
        className="storyviewer__side"
        onClick={(e) => {
          e.stopPropagation();
          step(1);
        }}
        aria-label="Next story"
        style={{ visibility: idx === stories.length - 1 ? 'hidden' : 'visible' }}
      >
        →
      </button>
    </div>
  );
}
