import AboutHero from "@/components/sections/about/AboutOpening";
import AboutManifesto from "@/components/sections/about/AboutManifesto";
import AboutEditorial from "@/components/sections/about/AboutEditorial";
import AboutCulture from "@/components/sections/about/AboutCulture";
import AboutCTA from "@/components/sections/about/AboutCTA";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#050505]">
      {/* 1. About Hero — 75/25 */}
      <AboutHero />

      {/* 2. Brand Manifesto */}
      <AboutManifesto />

      {/* 3. Editorial Storytelling */}
      <AboutEditorial />

      {/* 4. Cultural Positioning / Philosophy Pillars */}
      <AboutCulture />

      {/* 5. Closing CTA — emotional invitation */}
      <AboutCTA />
    </div>
  );
}
