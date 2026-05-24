import HomeHero from "@/components/sections/home/HomeHero";
import BestSellers from "@/components/sections/home/BestSellers";
import BrandStory from "@/components/sections/home/BrandStory";
import Lookbook from "@/components/sections/home/Lookbook";
import ReviewsSection from "@/components/sections/home/ReviewsSection";
import { BlockRenderer } from "@/components/page-editor/block-renderer";
import { getPageBlocks } from "@/lib/page-editor/get-page-blocks";
import { ProductQueries } from "@/lib/products/queries";

export default async function HomePage() {
  const latestDrops = await ProductQueries.getLatestDrops();
  const blocks = await getPageBlocks("home", "streetplayr");

  return (
    <div className="flex flex-col w-full overflow-x-clip bg-[#16111b] text-[#eadfed]">
      <BlockRenderer blocks={blocks} />
      <HomeHero />
      <BestSellers products={latestDrops} />
      <BrandStory />
      <Lookbook />
      <ReviewsSection />
    </div>
  );
}
