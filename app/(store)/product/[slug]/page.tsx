import ProductDetailClient from "./ProductDetailClient";
import ProductStory from "@/components/sections/product/ProductStory";
import ProductReviews from "@/components/sections/product/ProductReviews";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductQueries } from "@/lib/products/queries";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

const DEMO_SLUGS = new Set(["srh-jersey-01", "core-waffle-ls", "track-pant-02", "ribbed-tank-pack", "heavy-zip-hoodie", "vintage-wash-tee"]);

function getDemoProduct(slug: string) {
  return {
    id: slug,
    name: slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    price: 2499,
    description: "Limited edition piece from the latest drop. Precision-crafted in premium materials. Defy the standard.",
    image_url: "/assets/srh-jersey.jpg",
    slug,
    metadata: {
      tagline: "Performance Meets Street",
      drop_number: "DROP 01",
      release_type: "LIMITED RELEASE",
      fabric_details: "PREMIUM COTTON",
      gsm_info: "HEAVYWEIGHT",
      model_info: "Standard Fit",
      fit_type: "Boxy",
      true_to_size: true,
      colors: [
        { id: "onyx", name: "Onyx Black", hex: "#000000" },
        { id: "ivory", name: "Ivory White", hex: "#F5F0E8" },
      ],
      gallery_images: ["/assets/srh-jersey.jpg", "/assets/srh-jersey.jpg"],
      story: {
        headline: "Defy The Standard",
        sublines: [
          "We stripped away everything unnecessary.",
          "What remains is a pure expression of form and function.",
        ],
      },
    },
    variants: [
      { id: "v-s", size: "S", color: "Onyx Black", stock_quantity: 10, price_override: null },
      { id: "v-m", size: "M", color: "Onyx Black", stock_quantity: 10, price_override: null },
      { id: "v-l", size: "L", color: "Onyx Black", stock_quantity: 10, price_override: null },
      { id: "v-xl", size: "XL", color: "Onyx Black", stock_quantity: 10, price_override: null },
    ],
  };
}

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

  // 4. Development-only: known demo slugs get hardcoded product
  // Note: In production with Supabase configured, real products should exist.
  // Demo slugs exist only for local dev without seeded data.
  if (process.env.DEMO_AUTH === 'true' && DEMO_SLUGS.has(slug)) {
    return getDemoProduct(slug);
  }

  // 5. No product found — return null (caller handles 404)
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
    tagline: product.metadata?.tagline || "Performance Meets Street",
    price: formatPrice(product.price),
    description: product.description || "",
    image: product.image_url,
    images: product.metadata?.gallery_images || [product.image_url],
    dropMetadata: {
      dropNumber: product.metadata?.drop_number || "DROP 01",
      releaseType: product.metadata?.release_type || "LIMITED RELEASE",
      fabricDetails: product.metadata?.fabric_details || "PREMIUM COTTON",
      gsmInfo: product.metadata?.gsm_info || "HEAVYWEIGHT",
    },
    fitIntelligence: {
      modelInfo: product.metadata?.model_info || "Standard Fit",
      fitType: product.metadata?.fit_type || "Boxy",
      trueToSize: product.metadata?.true_to_size ?? true,
    },
    colors: product.metadata?.colors || [
      { id: "default", name: "Standard", hex: "#000000" },
    ],
    sizes:
      variants
        ?.map((v: any) => v.size)
        .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i) || ["S", "M", "L", "XL"],
    variants: variants.map((v: any) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stockQuantity: v.stock_quantity ?? 0,
    })),
  };

  const storyData = product.metadata?.story || {
    headline: "Defy The Standard",
    sublines: [
      "We stripped away everything unnecessary.",
      "What remains is a pure expression of form and function.",
    ],
  };

  return (
    <>
      <ProductDetailClient
        productId={product.id}
        title={displayData.title}
        tagline={displayData.tagline}
        price={displayData.price}
        description={displayData.description}
        image={displayData.image}
        images={displayData.images}
        dropMetadata={displayData.dropMetadata}
        fitIntelligence={displayData.fitIntelligence}
        colors={displayData.colors}
        sizes={displayData.sizes}
        variants={displayData.variants}
      />

      <ProductStory headline={storyData.headline} sublines={storyData.sublines} />

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
