"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getLocalProductBySlug, type LocalProduct } from "@/lib/products/data";

const STORAGE_KEY = "streetplayr-recently-visited";

export function pushRecentlyVisited(slug: string) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter((s: string) => s !== slug);
    list.unshift(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {}
}

function toCardProduct(p: LocalProduct) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    image: p.image_url,
    image2: p.metadata?.gallery_images?.[1],
    category: p.category?.name,
    variants: p.variants.map((v) => ({ id: v.id, size: v.size })),
  };
}

export default function RecentlyVisited({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<ReturnType<typeof toCardProduct>[]>([]);

  useEffect(() => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setItems(
        list
          .filter((s) => s !== excludeSlug)
          .map(getLocalProductBySlug)
          .filter((p): p is LocalProduct => Boolean(p))
          .map(toCardProduct)
          .slice(0, 4)
      );
    } catch {}
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">Recently visited</h2>
      </div>
      <div className="prow">
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} gallery={true} />
        ))}
      </div>
    </section>
  );
}
