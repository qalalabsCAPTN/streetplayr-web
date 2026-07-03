import HomeHero from "@/components/sections/home/HomeHero";
import BestSellersGate from "@/components/sections/home/BestSellersGate";
import BrandStory from "@/components/sections/home/BrandStory";
import Lookbook from "@/components/sections/home/Lookbook";
import ReviewsSection from "@/components/sections/home/ReviewsSection";
import { BlockRenderer } from "@/components/page-editor/block-renderer";
import { getPageBlocks } from "@/lib/page-editor/get-page-blocks";
import { ProductQueries } from "@/lib/products/queries";
import { AuthService } from "@/lib/auth/service";

interface HomePageProps {
  searchParams: Promise<{ preview?: string }> | { preview?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Await searchParams for forward-compatibility with Next.js 14 and Next.js 15 App Router
  const resolvedParams = await searchParams;
  let isPreview = resolvedParams?.preview === 'true';

  // Security gate: Enforce that preview mode requires an authenticated admin/ops role
  if (isPreview) {
    try {
      const profile = await AuthService.getCurrentProfile();
      const isAdmin = profile && ['super_admin', 'ops_admin', 'growth', 'campaign_manager'].includes(profile.role);
      
      if (!isAdmin) {
        console.warn(`[Staging Preview] Unauthorized access attempt blocked for user: ${profile?.email || 'anonymous'}`);
        isPreview = false; // Force downgrade to safe published production content
      }
    } catch (err) {
      console.error('[Staging Preview] Gating authentication evaluation failed:', err);
      isPreview = false; // Fallback to safe published production content
    }
  }

  // Fetch page blocks (published vs draft preview)
  const blocks = await getPageBlocks("home", "streetplayr", isPreview);

  // If database contains blocks, serve the fully CMS-driven homepage layout
  if (blocks && blocks.length > 0) {
    return (
      <div className="flex flex-col w-full overflow-x-clip bg-transparent text-[#eadfed]">
        <BlockRenderer blocks={blocks} />
      </div>
    );
  }

  // DYNAMIC FALLBACK: Render identical static hardcoded components on empty blocks or DB down times
  const latestDrops = await ProductQueries.getLatestDrops();
  return (
    <div className="flex flex-col w-full overflow-x-clip bg-transparent text-[#eadfed]">
      <HomeHero />
      <BestSellersGate products={latestDrops} />
      <BrandStory />
      <Lookbook />
      <ReviewsSection />
    </div>
  );
}
