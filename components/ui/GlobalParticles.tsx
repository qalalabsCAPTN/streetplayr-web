"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Particle {
  left: number;
  delay: number;
  dur: number;
  size: number;
}

const EXCLUDED_PATHS = ["/enter-the-play", "/entering-street-playR"];

export default function GlobalParticles() {
  const pathname = usePathname();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Detect screen width to adjust particle count and size dynamically
    const isDesktop = window.innerWidth >= 1024;
    const count = isDesktop ? 90 : 32;
    
    const generated = Array.from({ length: count }, () => {
      const dur = isDesktop ? (7 + Math.random() * 8) : (5 + Math.random() * 7);
      return {
        left: Math.random() * 100,
        // Negative delay pre-warms the animation so they are distributed across the screen height on load
        delay: -Math.random() * dur,
        dur,
        size: isDesktop ? (2 + Math.random() * 3.5) : (1 + Math.random() * 2),
      };
    });
    setParticles(generated);
  }, []);

  // Do not render particles on excluded pages
  if (EXCLUDED_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full exempt-motion"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "var(--sp-accent, #ddb7ff)",
            boxShadow: `0 0 ${p.size * 3}px var(--sp-accent, rgba(221, 183, 255, 0.45))`,
            animation: `pPart ${p.dur}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
