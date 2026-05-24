import ProductDetailClient from "./ProductDetailClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductQueries } from "@/lib/products/queries";
import { getLocalProductBySlug } from "@/lib/products/data";
import { formatPrice, formatProductTitle } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

async function resolveProduct(slug: string) {
  let product = await ProductQueries.getProductBySlug(slug);
  if (product) return product;

  product = await ProductQueries.getProductBySlug(slug.toLowerCase());
  if (product) return product;

  const local = getLocalProductBySlug(slug);
  if (local) return local;

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

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  if (!product) notFound();

  type ProductVariant = { id: string; size: string; color: string; stock_quantity?: number; price_override?: number | null };
  const variants: ProductVariant[] = (product as { variants?: ProductVariant[] }).variants ?? [];
  type ProductMeta = {
    points?: string;
    gallery_images?: string[];
    colors?: { id: string; name: string; hex: string }[];
    model3d?: string;
  };
  const meta = (product as { metadata?: ProductMeta }).metadata;

  const displayData = {
    title: formatProductTitle(product.name),
    price: formatPrice(product.price),
    description: product.description ?? "",
    points: meta?.points ?? "100",
    image: product.image_url,
    images: meta?.gallery_images || (product.image_url ? [product.image_url] : []),
    colors: meta?.colors ?? [],
    sizes: [...new Set(variants.map((v) => v.size))],
    variants: variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      stockQuantity: v.stock_quantity ?? 0,
    })),
    model3d: meta?.model3d,
  };

  return (
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
      slug={product.slug}
      model3d={displayData.model3d}
    />
  );
}
