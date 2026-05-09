import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import MobilePurchaseBar from "@/components/product/MobilePurchaseBar";
import ProductStory from "@/components/sections/product/ProductStory";
import { ProductQueries } from "@/lib/products/queries";
import { createClient } from "@/lib/supabase/server";

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

  // 4. Known demo slugs — return hardcoded product
  if (DEMO_SLUGS.has(slug)) {
    return getDemoProduct(slug);
  }

  // 5. Absolute fallback — return generic demo product
  return getDemoProduct(slug);
}

export async function generateStaticParams() {
  return [];
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  const displayData = {
    title: product.name,
    tagline: product.metadata?.tagline || "Performance Meets Street",
    price: `$${product.price}`,
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
      product.variants
        ?.map((v: any) => v.size)
        .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i) || ["S", "M", "L", "XL"],
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
      <div className="relative pt-24 md:pt-32">
        <div className="mx-auto max-w-[1800px] px-0 md:px-8 lg:px-12">
          <div className="flex flex-col-reverse lg:flex-row lg:items-end lg:gap-0">
            <div className="relative z-20 w-full px-6 pb-24 pt-12 lg:sticky lg:bottom-12 lg:w-[45%] lg:px-0 lg:pb-12 lg:-mr-12 xl:-mr-24">
              <ProductInfo
                productId={product.id}
                title={displayData.title}
                tagline={displayData.tagline}
                price={displayData.price}
                description={displayData.description}
                dropMetadata={displayData.dropMetadata}
                fitIntelligence={displayData.fitIntelligence}
                colors={displayData.colors}
                sizes={displayData.sizes}
                image={displayData.image}
              />
            </div>

            <div className="relative z-10 w-full lg:w-[55%]">
              <ProductGallery images={displayData.images} />
            </div>
          </div>
        </div>
      </div>

      <ProductStory headline={storyData.headline} sublines={storyData.sublines} />

      <MobilePurchaseBar price={displayData.price} productId={product.id} title={displayData.title} image={displayData.image} />
    </>
  );
}
