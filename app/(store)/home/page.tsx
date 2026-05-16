import HomeHero from "@/components/sections/home/HomeHero";
import MarqueeStrip from "@/components/sections/home/MarqueeStrip";
import NewDrops from "@/components/sections/home/NewDrops";
import DiscoveryFeed from "@/components/sections/home/DiscoveryFeed";
import ReviewsSection from "@/components/sections/home/ReviewsSection";
import { ProductQueries } from "@/lib/products/queries";

export default async function HomePage() {
  const latestDrops = await ProductQueries.getLatestDrops();

  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#16111b] text-[#eadfed]">
      <HomeHero />
      <MarqueeStrip />
      <NewDrops products={latestDrops} />
      <DiscoveryFeed />
      <ReviewsSection />
    </div>
  );
}
