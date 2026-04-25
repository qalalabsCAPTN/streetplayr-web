"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";

const categories = [
  {
    name: "T-Shirt",
    href: "/collection?category=t-shirt",
    image: "/assets/hero-tees.png",
  },
  {
    name: "Waffle",
    href: "/collection?category=waffle",
    image: "/assets/hero-tees.png",
  },
  {
    name: "Tank",
    href: "/collection?category=tank",
    image: "/assets/polo-editorial.png",
  },
  {
    name: "Track",
    href: "/collection?category=track",
    image: "/assets/run-shorts.jpeg",
  },
  {
    name: "Pants",
    href: "/collection?category=pants",
    image: "/assets/srh-jersey.jpg",
  },
];

export default function Categories() {
  return (
    <section className="border-y border-white/10 bg-[var(--sp-bg-surface)] px-4 py-16 sm:px-6 lg:px-16">
      <Reveal className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-accent)]">
              Category Strip
            </p>
            <h2 className="mt-2 font-display text-5xl leading-none tracking-[0.1em] sm:text-6xl">
              PICK YOUR LANE
            </h2>
          </div>
          <Link
            className="hidden font-mono text-xs uppercase tracking-[0.18em] text-white/55 transition-colors duration-200 hover:text-white md:block"
            href="/collection"
          >
            View All
          </Link>
        </div>
      </Reveal>

      <div className="no-scrollbar mx-auto flex max-w-7xl snap-x gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible">
        {categories.map((category, index) => (
          <Reveal
            className="min-w-[72vw] snap-start sm:min-w-[42vw] md:min-w-0"
            delay={0.05 * index}
            key={category.name}
          >
            <motion.div
              className="group relative overflow-hidden border border-white/10 bg-black"
              transition={{ duration: 0.2 }}
              whileHover={{ y: -4 }}
            >
              <Link className="block" href={category.href}>
                <div className="relative aspect-[4/5]">
                  <Image
                    alt={`Street PlayR ${category.name} category`}
                    className="h-full w-full object-cover opacity-[0.72] transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                    fill
                    sizes="(min-width: 1024px) 20vw, 72vw"
                    src={category.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/[0.32] to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-4xl leading-none tracking-[0.1em]">
                    {category.name}
                  </h3>
                  <span className="mt-3 block h-px w-10 bg-[var(--sp-accent)] transition-all duration-200 group-hover:w-20" />
                </div>
              </Link>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
