import ProductDetailClient from "./ProductDetailClient";
import ProductReviews from "@/components/sections/product/ProductReviews";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductQueries } from "@/lib/products/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

// ── Mock product for dev when Supabase isn't configured ──
const MOCK_PRODUCT = {
  id: "mock-gravity-parka",
  name: "Gravity Parka",
  price: 2499,
  description:
    "A study in suspended animation. The Gravity Parka distills utility into its most essential form — a shell that moves with you, not against you. Cut from Japanese 3-layer ripstop with taped seams and a stealth hood that disappears when you don't need it.",
  image_url:
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000&auto=format&fit=crop",
  slug: "gravity-parka",
  metadata: {
    points: "420",
    gallery_images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608236426742-0b656403b250?q=80&w=2000&auto=format&fit=crop",
    ],
    colors: [
      { id: "black", name: "Onyx Black", hex: "#0a0a0a" },
      { id: "olive", name: "Olive Drab", hex: "#4a5d23" },
      { id: "ash", name: "Ash Grey", hex: "#8a8a8a" },
    ],
  },
  variants: [
    { id: "v-gp-s", size: "S", color: "black", stock_quantity: 12 },
    { id: "v-gp-m", size: "M", color: "black", stock_quantity: 8 },
    { id: "v-gp-l", size: "L", color: "black", stock_quantity: 15 },
    { id: "v-gp-xl", size: "XL", color: "black", stock_quantity: 5 },
    { id: "v-gp-s-olive", size: "S", color: "olive", stock_quantity: 6 },
    { id: "v-gp-m-olive", size: "M", color: "olive", stock_quantity: 10 },
    { id: "v-gp-l-olive", size: "L", color: "olive", stock_quantity: 4 },
    { id: "v-gp-s-ash", size: "S", color: "ash", stock_quantity: 3 },
    { id: "v-gp-m-ash", size: "M", color: "ash", stock_quantity: 7 },
  ],
};

async function resolveProduct(slug: string) {
  // 1. Exact match
  let product = await ProductQueries.getProductBySlug(slug);
  if (product) return product;

  // 2. Lowercase
  product = await ProductQueries.getProductBySlug(slug.toLowerCase());
  if (product) return product;

  // 3. Try fetching all products and find partial match
  try {
    const supabase = await createClient();
    const { data: allProducts } = await supabase
      .from("products")
      .select("slug")
      .limit(50);

    if (allProducts && allProducts.length > 0) {
      const match = allProducts.find(
        (p) =>
          p.slug?.toLowerCase().includes(slug.toLowerCase()) ||
          slug.toLowerCase().includes(p.slug?.toLowerCase() || ""),
      );
      if (match) {
        product = await ProductQueries.getProductBySlug(match.slug!);
        if (product) return product;
      }
    }
  } catch {}

  return null;
}

async function getProduct(slug: string) {
  const fromDb = await resolveProduct(slug);
  if (fromDb) return fromDb;

  // Fall back to mock data for dev UI iteration
  return MOCK_PRODUCT;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found — Street PlayR" };
  const title = formatProductTitle(product.name);
  return {
    title: `${title} — Street PlayR`,
    description: product.description,
    openGraph: {
      title: `${title} — Street PlayR`,
      description: product.description,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}


export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const variants = (product as any).variants ?? [];
  const displayData = {
    title: formatProductTitle(product.name),
    price: formatPrice(product.price),
    description: product.description ?? '',
    points: product.metadata?.points ?? '100',
    image: product.image_url,
    images: product.metadata?.gallery_images || (product.image_url ? [product.image_url] : []),
    colors: product.metadata?.colors ?? [],
    sizes:
      variants
        ?.map((v: any) => v.size)
        .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i) ?? [],
    variants: variants.map((v: any) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stockQuantity: v.stock_quantity ?? 0,
    })),
  };

  return (
    <>
      <ProductDetailClient
        productId={product.id}
        title={displayData.title}
        price={displayData.price}
        description={displayData.description}
        points={displayData.points}
        image={displayData.image}
        images={displayData.images}
        colors={displayData.colors}
        sizes={displayData.sizes}
        variants={displayData.variants}
      />

      <ProductReviews />

      {/* AI Try-On — Coming Soon */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#050505] border-t border-white/5">
        <div className="mx-auto max-w-7xl text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/20">AI Try-On</span>
          <h2 className="mt-6 font-display text-4xl uppercase tracking-wide text-white/80 md:text-5xl">
            Virtual Fit Studio
          </h2>
          <p className="mx-auto mt-4 max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/40">
            See how it looks on you before you buy. Coming soon.
          </p>
          <div className="mt-10 inline-block border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            Coming Soon
          </div>
        </div>
      </section>

      {/* Generate Your Print — Placeholder */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#050505] border-t border-white/5">
        <div className="mx-auto max-w-7xl text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/20">Your Print</span>
          <h2 className="mt-6 font-display text-4xl uppercase tracking-wide text-white/80 md:text-5xl">
            Generate Your Print
          </h2>
          <p className="mx-auto mt-4 max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/40">
            Design your own custom colorway and fabric combo. Exclusive to SP members.
          </p>
          <div className="mt-10 inline-block border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            Unlock with Wallet
          </div>
        </div>
      </section>
    </>
  );
}
