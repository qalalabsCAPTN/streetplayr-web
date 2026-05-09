import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import MobilePurchaseBar from "@/components/product/MobilePurchaseBar";
import ProductStory from "@/components/sections/product/ProductStory";
import { ProductQueries } from "@/lib/products/queries";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  // In a real scenario, fetch all slugs to pre-render. 
  // For V1, we'll let it fallback to dynamic rendering.
  return [];
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const product = await ProductQueries.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Map Supabase data to component expectations
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
      gsmInfo: product.metadata?.gsm_info || "HEAVYWEIGHT"
    },
    fitIntelligence: {
      modelInfo: product.metadata?.model_info || "Standard Fit",
      fitType: product.metadata?.fit_type || "Boxy",
      trueToSize: product.metadata?.true_to_size ?? true
    },
    colors: product.metadata?.colors || [
      { id: "default", name: "Standard", hex: "#000000" }
    ],
    sizes: product.variants?.map((v: any) => v.size).filter((v: any, i: number, a: any[]) => a.indexOf(v) === i) || ["S", "M", "L", "XL"]
  };

  const storyData = product.metadata?.story || {
    headline: "Defy The Standard",
    sublines: [
      "We stripped away everything unnecessary.",
      "What remains is a pure expression of form and function."
    ]
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
