import HomeHero from "@/components/sections/home/HomeHero";
import FeaturedCollections from "@/components/sections/home/FeaturedCollections";
import NewDrops from "@/components/sections/home/NewDrops";
import BrandStory from "@/components/sections/home/BrandStory";
import CategoryScroll from "@/components/sections/home/CategoryScroll";
import FeaturedProductBanner from "@/components/sections/home/FeaturedProductBanner";
import SocialProof from "@/components/sections/home/SocialProof";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-black text-white bg-noise">
      <HomeHero />
      <FeaturedCollections />
      <NewDrops />
      <BrandStory />
      <CategoryScroll />
      <FeaturedProductBanner />
      <SocialProof />
    </div>
  );
}
