'use client';

import Reveal from './BluorngReveal';
import { stores } from '@/lib/bluorng-data';

export default function StoresSection() {
  return (
    <section className="section">
      <Reveal className="section__head" as="div">
        <h2 className="section__title">Find Streetplayr across India</h2>
      </Reveal>
      <Reveal stagger className="stores" as="div">
        {stores.map((s) => (
          <div key={s.city} className="store">
            <img src={s.image} alt={s.city} loading="lazy" />
            <span className="store__open">Open now</span>
            <div className="store__meta">
              <h3 className="store__city">{s.city}</h3>
              <p className="store__addr">
                {s.address}
                <br />
                {s.phone}
              </p>
              <a href={s.map} target="_blank" rel="noreferrer">
                Get direction
              </a>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
