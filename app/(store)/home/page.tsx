import Hero from "@/components/ui/Hero";
import ProductSection from "@/components/ui/ProductSection";
import BannerSlider from "@/components/ui/BannerSlider";
import RecentlyVisited from "@/components/ui/RecentlyVisited";
import { BlockRenderer } from "@/components/page-editor/block-renderer";
import { getPageBlocks } from "@/lib/page-editor/get-page-blocks";
import { ProductQueries } from "@/lib/products/queries";
import { AuthService } from "@/lib/auth/service";

interface HomePageProps {
  searchParams: Promise<{ preview?: string }> | { preview?: string };
}

/** ISR hint for data cache; root layout cookies() still forces dynamic HTML shell */
export const revalidate = 300;

export default async function HomePage({ searchParams }: HomePageProps) {
  // Await searchParams for forward-compatibility with Next.js 14 and Next.js 15 App Router
  const resolvedParams = await searchParams;
  let isPreview = resolvedParams?.preview === "true";

  // Security gate: Enforce that preview mode requires an authenticated admin/ops role
  if (isPreview) {
    try {
      const profile = await AuthService.getCurrentProfile();
      const isAdmin =
        profile &&
        ["super_admin", "ops_admin", "growth", "campaign_manager"].includes(profile.role);

      if (!isAdmin) {
        console.warn(
          `[Staging Preview] Unauthorized access attempt blocked for user: ${profile?.email || "anonymous"}`
        );
        isPreview = false;
      }
    } catch (err) {
      console.error("[Staging Preview] Gating authentication evaluation failed:", err);
      isPreview = false;
    }
  }

  const blocks = await getPageBlocks("home", "streetplayr", isPreview);

  if (blocks && blocks.length > 0) {
    return (
      <div className="flex flex-col w-full overflow-x-clip bg-transparent text-[#eadfed]">
        <BlockRenderer blocks={blocks} />
      </div>
    );
  }

  const activeProducts = await ProductQueries.getActiveProducts();

  const { COLLECTION_SLUG } = await import("@/lib/products/collections");

  const byCollection = (slug: string) =>
    activeProducts
      .filter(
        (p) =>
          Array.isArray((p as { collections?: string[] }).collections) &&
          (p as { collections?: string[] }).collections!.includes(slug)
      )
      .slice(0, 8);

  const tees = byCollection(COLLECTION_SLUG.TEES);
  const longSleeve = byCollection(COLLECTION_SLUG.LONG_SLEEVE);
  const pants = byCollection(COLLECTION_SLUG.PANTS);
  const tanks = byCollection(COLLECTION_SLUG.TANKS);

  return (
    <div className="flex flex-col w-full">
      <Hero />
      <ProductSection
        title="Short Sleeve T-Shirts"
        mobileTitle="Topwear"
        products={tees}
        moreHref="/collections?category=tees"
        gallery
        flat
      />
      <ProductSection
        title="Long Sleeve T-Shirts"
        mobileTitle="Topwear"
        products={longSleeve}
        moreHref="/collections?category=long-sleeve"
        gallery
      />
      <BannerSlider />
      <ProductSection
        title="Tanks"
        mobileTitle="Topwear"
        products={tanks}
        moreHref="/collections?category=tanks"
        gallery
      />
      <ProductSection
        title="Sweatpants"
        mobileTitle="Bottomwear"
        products={pants}
        moreHref="/collections?category=pants"
        gallery
      />
      <RecentlyVisited />
    </div>
  );
}
