import ProductDetailClient from "./ProductDetailClient";
import ProductReviews from "@/components/sections/product/ProductReviews";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductQueries } from "@/lib/products/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);
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

export async function generateStaticParams() {
  return [];
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await resolveProduct(slug);
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
