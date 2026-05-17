import HomeHero from "@/components/sections/home/HomeHero";
import MarqueeStrip from "@/components/sections/home/MarqueeStrip";
import BestSellers from "@/components/sections/home/BestSellers";
import NewDrops from "@/components/sections/home/NewDrops";
import DiscoveryFeed from "@/components/sections/home/DiscoveryFeed";
import ReviewsSection from "@/components/sections/home/ReviewsSection";
import { ProductQueries } from "@/lib/products/queries";

export default async function HomePage() {
  const latestDrops = await ProductQueries.getLatestDrops();

  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#16111b] text-[#eadfed]">
      <HomeHero />
      <section className="py-24 px-4 md:px-16 max-w-[1440px] mx-auto text-center">
        <h3 className="font-display text-[clamp(32px,5vw,64px)] leading-[0.95] tracking-[0.01em] uppercase text-[#eadfed]">
          Uniforms for the City After Dark
        </h3>
      </section>
      <MarqueeStrip />
      <BestSellers products={latestDrops} />
      <NewDrops products={latestDrops} />
      <DiscoveryFeed />
      <ReviewsSection />
    </div>
  );
}
