"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

const STORAGE_KEY = "streetplayr-recently-visited";

export function pushRecentlyVisited(slug: string) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter((s: string) => s !== slug);
    list.unshift(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 8)));
  } catch {}
}

type CardProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  image2?: string;
  category?: string;
  variants?: { id: string; size: string }[];
};

export default function RecentlyVisited({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<CardProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const slugs = list.filter((s) => s !== excludeSlug).slice(0, 8);
        if (slugs.length === 0) return;

        const { loadClientCatalog } = await import("@/lib/products/client-catalog");
        const catalog = await loadClientCatalog();
        if (cancelled) return;

        const bySlug = new Map(catalog.map((p) => [p.slug.toLowerCase(), p]));
        setItems(
          slugs
            .map((s) => bySlug.get(s.toLowerCase()))
            .filter(Boolean)
            .slice(0, 4)
            .map((p) => ({
              id: p!.id,
              slug: p!.slug,
              name: p!.name,
              price: p!.price,
              image: p!.image,
              image2: p!.image2,
              category: p!.collections[0],
              variants: (p!.variants ?? []).map((v) => ({ id: v.id, size: v.size })),
            }))
        );
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
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
