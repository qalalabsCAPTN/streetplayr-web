"use client";

import { useEffect, useState } from "react";

export default function ScrollIndicator() {
  const [sections, setSections] = useState<Element[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll("main > section, main section[data-section]"));
    if (els.length === 0) {
      /* Fallback: any direct section children under the first <main> */
      const all = Array.from(document.querySelectorAll("main section"));
      setSections(all.slice(0, 5));
    } else {
      setSections(els.slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (sections.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sections.indexOf(entry.target);
            if (idx !== -1) setActiveIdx(idx);
          }
        }
      },
      { threshold: 0.4 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <div
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex"
      aria-hidden="true"
    >
      {sections.map((section, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Scroll to section ${i + 1}`}
          onClick={() => section.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="rounded-full transition-all duration-300"
          style={
            i === activeIdx
              ? {
                  width: "8px",
                  height: "20px",
                  background: "var(--sp-accent)",
                  boxShadow: "0 0 10px rgba(157,78,221,0.5)",
                }
              : {
                  width: "8px",
                  height: "8px",
                  background: "rgba(255,255,255,0.10)",
                }
          }
        />
      ))}
    </div>
  );
}
