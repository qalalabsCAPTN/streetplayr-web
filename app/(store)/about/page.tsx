import AboutHero from "@/components/sections/about/Hero";
import Manifesto from "@/components/sections/about/Manifesto";
import QuoteSection from "@/components/sections/about/QuoteSection";
import MaterialSpecs from "@/components/sections/about/MaterialSpecs";
import Journey from "@/components/sections/about/Journey";
import FounderCard from "@/components/sections/about/FounderCard";
import FooterTransition from "@/components/sections/about/FooterTransition";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full bg-transparent">
      <Navbar />
      <AboutHero />
      <Manifesto />
      <QuoteSection />
      <MaterialSpecs />
      <Journey />
      <FounderCard />
      <FooterTransition />
      <Footer />
    </div>
  );
}
