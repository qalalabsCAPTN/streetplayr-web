import AboutHero from "@/components/sections/about/Hero";
import Manifesto from "@/components/sections/about/Manifesto";
import MaterialSpecs from "@/components/sections/about/MaterialSpecs";
import Journey from "@/components/sections/about/Journey";
import FounderCard from "@/components/sections/about/FounderCard";
import FooterTransition from "@/components/sections/about/FooterTransition";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-[#16111b] text-[#eadfed]">
      <AboutHero />
      <Manifesto />
      <MaterialSpecs />
      <Journey />
      <FounderCard />
      <FooterTransition />
    </div>
  );
}
