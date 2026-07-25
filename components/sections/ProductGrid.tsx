"use client";

import ProductCard, { type Product } from "@/components/product/ProductCard";
import Reveal from "@/components/ui/Reveal";

const latestDrop: Product[] = [
  {
    name: "Triple Tee Set",
    category: "T-Shirt",
    price: "Rs. 1,499",
    spPrice: "SP Rs. 1,249",
    image: "/assets/products/inspired/image-1.webp",
    imageAlt: "Street PlayR Inspired tee",
    badge: "New",
    href: "/product/triple-tee-set",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Court Polo Pack",
    category: "Polo",
    price: "Rs. 1,799",
    spPrice: "SP Rs. 1,540",
    image: "/assets/products/stick-no-bills/image-1.jpg",
    imageAlt: "Street PlayR Stick No Bills long sleeve",
    badge: "Drop",
    href: "/product/court-polo-pack",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Run Short",
    category: "Track",
    price: "Rs. 999",
    image: "/assets/products/carpenter-grey/image-1.jpg",
    imageAlt: "Street PlayR Carpenter Grey pants",
    href: "/product/run-short",
    sizes: ["S", "M", "L", "XL"],
  },
];

const mostViewed: Product[] = [
  {
    name: "Waffle Tee",
    category: "Waffle",
    price: "Rs. 1,299",
    spPrice: "SP Rs. 1,099",
    image: "/assets/products/ctt-waffle/image-1.jpg",
    imageAlt: "Street PlayR Waffle Tee",
    badge: "New",
    href: "/product/waffle-tee",
    sizes: ["S", "M", "L", "XL"],
    hot: true,
  },
  {
    name: "Polo Black",
    category: "Polo",
    price: "Rs. 1,799",
    image: "/assets/products/black-warrior/image-1.jpg",
    imageAlt: "Street PlayR Black Warrior tee",
    href: "/product/polo-black",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Dream Jersey",
    category: "Jersey",
    price: "Rs. 1,999",
    spPrice: "SP Rs. 1,699",
    image: "/assets/products/star-tank-dark/image-1.jpg",
    imageAlt: "Street PlayR Star Tank",
    href: "/product/dream-jersey",
    sizes: ["S", "M", "L", "XL"],
  },
  {
    name: "Miles Short",
    category: "Shorts",
    price: "Rs. 999",
    image: "/assets/products/olive-pant/image-1.jpg",
    imageAlt: "Street PlayR Olive pant",
    href: "/product/miles-short",
    sizes: ["S", "M", "L", "XL"],
  },
];

function SectionHeader({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--sp-accent)]">
          {kicker}
        </p>
        <h2 className="mt-2 font-display text-5xl leading-none tracking-[0.1em] sm:text-6xl">
          {title}
        </h2>
      </div>
      <p className="max-w-md text-sm leading-6 text-white/55">{copy}</p>
    </div>
  );
}

export default function ProductGrid() {
  return (
    <div id="latest-drop" className="bg-black px-4 py-20 sm:px-6 lg:px-16">
      <section className="mx-auto max-w-7xl">
        <Reveal>
          <SectionHeader
            copy="Featured pieces that carry the launch mood: sharp basics, cropped movement, and quick-buy confidence."
            kicker="Latest Drop"
            title="BUILT TO MOVE"
          />
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-5 lg:grid-rows-2">
          <Reveal className="lg:col-span-3 lg:row-span-2">
            <ProductCard featured priority product={latestDrop[0]} />
          </Reveal>
          {latestDrop.slice(1).map((product, index) => (
            <Reveal className="lg:col-span-2" delay={0.08 * (index + 1)} key={product.name}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl">
        <Reveal>
          <SectionHeader
            copy="The pieces people keep coming back to, tuned for fast scanning and clean product decisions."
            kicker="Most Viewed"
            title="ON ROTATION"
          />
        </Reveal>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {mostViewed.map((product, index) => (
            <Reveal delay={0.05 * index} key={product.name}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
