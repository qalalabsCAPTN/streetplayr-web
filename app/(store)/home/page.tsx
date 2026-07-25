import Hero from "@/components/ui/Hero";
import ProductSection from "@/components/ui/ProductSection";
import BannerSlider from "@/components/ui/BannerSlider";
import RecentlyVisited from "@/components/ui/RecentlyVisited";
import HomeMobileLatestCarousel from "@/components/ui/HomeMobileLatestCarousel";
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

  const CATALOG_BLOCK_TYPES = new Set(["product_carousel", "collection_grid"]);
  const hasCmsBlocks = Array.isArray(blocks) && blocks.length > 0;
  const cmsHasCatalog =
    hasCmsBlocks && blocks.some((b) => CATALOG_BLOCK_TYPES.has(b.block_type));

  // CMS with its own product blocks → full CMS page
  if (cmsHasCatalog) {
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

  let latest = byCollection(COLLECTION_SLUG.LATEST);
  const tees = byCollection(COLLECTION_SLUG.TEES);
  const pants = byCollection(COLLECTION_SLUG.PANTS);
  const tanks = byCollection(COLLECTION_SLUG.TANKS);

  // Last-resort shelf: if every section is empty but we have products, show them
  // under Latest Drop so home never looks like an empty store.
  const anySection = latest.length + tees.length + pants.length + tanks.length > 0;
  if (!anySection && activeProducts.length > 0) {
    console.warn(
      "[home] Collection filters empty — showing unfiltered active products in Latest Drop"
    );
    latest = activeProducts.slice(0, 8) as typeof latest;
  }

  // Same catalog slice for mobile carousel + Latest Drop grid (no extra fetch).
  const latestProducts = latest;

  const productSections = (
    <>
      {/* Mobile only — CSS-hidden on desktop; reuses latestProducts */}
      <HomeMobileLatestCarousel products={latestProducts} />

      <ProductSection
        title="Latest Drop"
        products={latestProducts}
        moreHref="/collections"
        gallery
        flat
      />
      <ProductSection
        title="playR Tees Collection"
        products={tees}
        moreHref="/collections?category=tees"
        gallery
      />
      <BannerSlider />
      <ProductSection
        title="Pants"
        products={pants}
        moreHref="/collections?category=pants"
        gallery
      />
      <ProductSection
        title="Tank Tops"
        products={tanks}
        moreHref="/collections?category=tanks"
        gallery
      />
      <RecentlyVisited />
    </>
  );

  // Editorial CMS (hero/story/lookbook) without catalog blocks — keep CMS, append shelves
  if (hasCmsBlocks) {
    return (
      <div className="flex flex-col w-full overflow-x-clip bg-transparent text-[#eadfed]">
        <BlockRenderer blocks={blocks} />
        {productSections}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <Hero />
      {activeProducts.length === 0 ? (
        <section className="panel panel--flat" aria-live="polite">
          <div className="panel__head">
            <h2 className="panel__title">Catalog temporarily unavailable</h2>
          </div>
          <p className="px-4 md:px-6 pb-8 text-sm opacity-70 max-w-xl">
            Products are not available right now. Please try again shortly.
          </p>
        </section>
      ) : (
        productSections
      )}
    </div>
  );
}
