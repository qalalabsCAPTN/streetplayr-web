"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Look = {
  id: string;
  number: string; // e.g. "01"
  title: string;
  image: string;
  href: string;
};

export default function EditorialLooks({ looks }: { looks: Look[] }) {
  return (
    <section className="py-24 px-4 md:px-6">
      <div className="mb-32 flex justify-between items-end">
        <h2 className="font-display text-5xl uppercase leading-none tracking-wide text-white md:text-7xl lg:text-[6rem]">
          Complete<br />The Look
        </h2>
        <Link href="/shop" className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white md:block transition-colors">
          View All Drops
        </Link>
      </div>

      <div className="flex flex-col gap-32 md:gap-48">
        {looks.map((look, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.div
              key={look.id}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col gap-8 md:flex-row ${
                isEven ? "md:flex-row md:-ml-8 lg:-ml-16" : "md:flex-row-reverse md:-mr-8 lg:-mr-16"
              } items-center`}
            >
              {/* Image Container */}
              <Link 
                href={look.href}
                className={`relative w-full md:w-[65%] overflow-hidden bg-[#050505] group block aspect-[4/5] md:aspect-[3/4] ${
                  isEven ? "md:mr-auto" : "md:ml-auto"
                }`}
                data-cursor="product"
              >
                <Image
                  src={look.image}
                  alt={look.title}
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  sizes="(min-width: 768px) 60vw, 100vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Link>

              {/* Text Container */}
              <div className={`flex w-full flex-col md:w-2/5 ${isEven ? "md:pl-16" : "md:pr-16 md:items-end md:text-right"}`}>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-accent)]">
                  Look {look.number}
                </span>
                <h3 className="mt-4 font-display text-4xl uppercase leading-none tracking-wide text-white md:text-5xl">
                  {look.title}
                </h3>
                <Link 
                  href={look.href}
                  className="mt-8 border-b border-white/30 pb-1 font-mono text-[10px] uppercase tracking-widest text-white transition-colors hover:border-white w-fit"
                >
                  Discover
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-24 md:hidden">
        <Link href="/shop" className="block w-full border border-white/20 py-4 text-center font-mono text-xs uppercase tracking-widest text-white">
          View All Drops
        </Link>
      </div>
    </section>
  );
}
