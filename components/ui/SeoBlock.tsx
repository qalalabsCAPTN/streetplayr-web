"use client";

import { useState } from "react";

export default function SeoBlock() {
  const [open, setOpen] = useState(false);

  return (
    <section className="seo">
      <div className={`seo__body ${open ? "open" : ""}`}>
        <h2>playR — Sportswear and Gear Made for Movement</h2>
        <p>
          playR builds performance sportswear and gear for India&apos;s athletes and fans — from official
          IPL and MLC fan merchandise to swim, training, and everyday sport essentials. Every product is
          designed to move with you: breathable fabrics, durable construction, and fits made for real play.
        </p>
        <h3>Caps &amp; Headwear</h3>
        <p>
          Our mesh caps are lightweight and ventilated, built for long days in the sun. The playR x Seattle
          Orcas range brings official MLC 2026 matchday headwear to fans everywhere.
        </p>
        <h3>Swimming Essentials</h3>
        <p>
          From UV-protected, anti-fog goggles to chlorine-resistant silicone swim caps, the playR swim range
          covers everyone from first-time swimmers to elite racers — with dedicated kids&apos; lines for
          young athletes.
        </p>
        <h3>Why playR</h3>
        <p>
          Stylish, sporty, and made for movement. playR blends performance engineering with everyday
          wearability, at prices that keep the game accessible to everyone.
        </p>
      </div>
      <button className="seo__toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Read less" : "Read more..."}
      </button>
    </section>
  );
}
