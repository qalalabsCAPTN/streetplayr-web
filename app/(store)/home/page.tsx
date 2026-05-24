import HomeHero from "@/components/sections/home/HomeHero";
import BestSellers from "@/components/sections/home/BestSellers";
import BrandStory from "@/components/sections/home/BrandStory";
import Lookbook from "@/components/sections/home/Lookbook";
import ReviewsSection from "@/components/sections/home/ReviewsSection";
import { ProductQueries } from "@/lib/products/queries";

export default async function HomePage() {
  const latestDrops = await ProductQueries.getLatestDrops();

  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#16111b] text-[#eadfed]">
      <HomeHero />
      <BestSellers products={latestDrops} />
      <BrandStory />
      <Lookbook />
      <ReviewsSection />
    </div>
  );
}
