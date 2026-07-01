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
    // Generate 32 particles on client mount to prevent hydration mismatch
    const generated = Array.from({ length: 32 }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 6,
      dur: 5 + Math.random() * 7,
      size: 1 + Math.random() * 2,
    }));
    setParticles(generated);
  }, []);

  // Do not render particles on excluded pages
  if (EXCLUDED_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[10] overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "var(--sp-accent, #ddb7ff)",
            boxShadow: "0 0 6px var(--sp-accent, rgba(221, 183, 255, 0.4))",
            animation: `pPart ${p.dur}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
